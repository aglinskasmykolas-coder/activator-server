import { Router, Request } from 'express';
import { db } from '../db';

const router = Router();

/**
 * Генератор длительности в мс
 */
function getDurationMs(type: string): number | null {
  switch (type) {
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '14d': return 14 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    case '365d': return 365 * 24 * 60 * 60 * 1000;
    case 'lifetime': return null;
    default: return null;
  }
}

/**
 * Логирование действий
 */
function logAction(code: string, action: string, hwid: string, ip: string, userAgent: string, success: boolean, message: string) {
  db.prepare(`
    INSERT INTO activation_logs (licenseCode, action, hwid, ip, userAgent, success, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, action, hwid, ip, userAgent, success ? 1 : 0, message, Date.now());
}

/**
 * POST /api/license/activate
 * Первая активация — привязка HWID
 */
router.post('/activate', (req: Request, res) => {
  const { code, hwid } = req.body;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!code || !hwid) {
    return res.status(400).json({ success: false, message: 'Missing code or hwid' });
  }

  const license: any = db.prepare('SELECT * FROM licenses WHERE code = ?').get(code);

  if (!license) {
    logAction(code, 'activate', hwid, ip, userAgent, false, 'License not found');
    return res.status(404).json({ success: false, message: 'Код не найден' });
  }

  if (license.status === 'revoked') {
    logAction(code, 'activate', hwid, ip, userAgent, false, 'Revoked');
    return res.status(403).json({ success: false, message: 'Код заблокирован' });
  }

  // Если уже активирован — проверяем HWID
  if (license.status === 'active') {
    if (license.hwid !== hwid) {
      logAction(code, 'activate', hwid, ip, userAgent, false, `HWID mismatch (expected ${license.hwid})`);
      return res.status(403).json({
        success: false,
        message: 'Этот код уже активирован на другом устройстве'
      });
    }

    // Проверяем не истёк ли
    if (license.expiresAt && license.expiresAt < Date.now()) {
      db.prepare("UPDATE licenses SET status = 'expired' WHERE id = ?").run(license.id);
      return res.status(403).json({ success: false, message: 'Срок действия истёк' });
    }

    // Всё ок, возвращаем как есть
    logAction(code, 'activate', hwid, ip, userAgent, true, 'Re-activation OK');
    return res.json({
      success: true,
      message: 'Уже активирован',
      license: {
        type: license.type,
        expiresAt: license.expiresAt,
        activatedAt: license.activatedAt,
      }
    });
  }

  // Первая активация
  const now = Date.now();
  const duration = getDurationMs(license.type);
  const expiresAt = duration ? now + duration : null;

  db.prepare(`
    UPDATE licenses 
    SET status = 'active', hwid = ?, activatedAt = ?, expiresAt = ?, lastCheckAt = ?
    WHERE id = ?
  `).run(hwid, now, expiresAt, now, license.id);

  logAction(code, 'activate', hwid, ip, userAgent, true, 'First activation');

  res.json({
    success: true,
    message: 'Активация успешна',
    license: {
      type: license.type,
      expiresAt,
      activatedAt: now,
    }
  });
});

/**
 * POST /api/license/validate
 * Периодическая проверка (при запуске приложения)
 */
router.post('/validate', (req: Request, res) => {
  const { code, hwid } = req.body;
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!code || !hwid) {
    return res.status(400).json({ valid: false, message: 'Missing data' });
  }

  const license: any = db.prepare('SELECT * FROM licenses WHERE code = ?').get(code);

  if (!license) {
    logAction(code, 'validate', hwid, ip, userAgent, false, 'Not found');
    return res.json({ valid: false, message: 'Код не найден' });
  }

  if (license.status === 'revoked') {
    logAction(code, 'validate', hwid, ip, userAgent, false, 'Revoked');
    return res.json({ valid: false, message: 'Код заблокирован' });
  }

  if (license.hwid !== hwid) {
    logAction(code, 'validate', hwid, ip, userAgent, false, 'HWID mismatch');
    return res.json({ valid: false, message: 'Устройство не соответствует' });
  }

  if (license.expiresAt && license.expiresAt < Date.now()) {
    db.prepare("UPDATE licenses SET status = 'expired' WHERE id = ?").run(license.id);
    logAction(code, 'validate', hwid, ip, userAgent, false, 'Expired');
    return res.json({ valid: false, message: 'Срок действия истёк' });
  }

  // Обновляем время последней проверки
  db.prepare('UPDATE licenses SET lastCheckAt = ? WHERE id = ?').run(Date.now(), license.id);

  logAction(code, 'validate', hwid, ip, userAgent, true, 'OK');

  res.json({
    valid: true,
    license: {
      type: license.type,
      expiresAt: license.expiresAt,
      activatedAt: license.activatedAt,
    }
  });
});

export default router;