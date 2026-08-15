import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { adminAuth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Генератор случайного кода вида XXXX-XXXX-XXXX-XXXX
 */
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

/**
 * POST /api/admin/login
 * Вход в админку
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

/**
 * POST /api/admin/generate
 * Генерация новых кодов
 */
router.post('/generate', adminAuth, (req, res) => {
  const { type, count = 1, note } = req.body;

  if (!['7d', '14d', '30d', '365d', 'lifetime'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  if (count < 1 || count > 500) {
    return res.status(400).json({ error: 'Count must be 1-500' });
  }

  const codes: string[] = [];
  const insert = db.prepare(`
    INSERT INTO licenses (code, type, status, createdAt, note)
    VALUES (?, ?, 'unused', ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      let code = generateCode();
      // Проверяем уникальность (маловероятно но всё же)
      while (db.prepare('SELECT 1 FROM licenses WHERE code = ?').get(code)) {
        code = generateCode();
      }
      insert.run(code, type, Date.now(), note || null);
      codes.push(code);
    }
  });
  transaction();

  res.json({ success: true, codes });
});

/**
 * GET /api/admin/list
 * Список всех лицензий
 */
router.get('/list', adminAuth, (req, res) => {
  const licenses = db.prepare(`
    SELECT * FROM licenses ORDER BY createdAt DESC
  `).all();
  res.json({ licenses });
});

/**
 * POST /api/admin/revoke
 * Заблокировать лицензию
 */
router.post('/revoke', adminAuth, (req, res) => {
  const { code } = req.body;
  const result = db.prepare("UPDATE licenses SET status = 'revoked' WHERE code = ?").run(code);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ success: true });
});

/**
 * POST /api/admin/reset-hwid
 * Сбросить привязку HWID (например если юзер сменил ПК)
 */
router.post('/reset-hwid', adminAuth, (req, res) => {
  const { code } = req.body;
  const result = db.prepare(`
    UPDATE licenses SET hwid = NULL, status = 'unused', activatedAt = NULL, expiresAt = NULL 
    WHERE code = ?
  `).run(code);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ success: true });
});

/**
 * DELETE /api/admin/delete
 * Удалить лицензию полностью
 */
router.delete('/delete', adminAuth, (req, res) => {
  const { code } = req.body;
  db.prepare('DELETE FROM licenses WHERE code = ?').run(code);
  res.json({ success: true });
});

/**
 * GET /api/admin/stats
 * Общая статистика
 */
router.get('/stats', adminAuth, (req, res) => {
  const total = (db.prepare('SELECT COUNT(*) as c FROM licenses').get() as any).c;
  const active = (db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status = 'active'").get() as any).c;
  const unused = (db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status = 'unused'").get() as any).c;
  const revoked = (db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status = 'revoked'").get() as any).c;
  const expired = (db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status = 'expired'").get() as any).c;

  res.json({ total, active, unused, revoked, expired });
});

/**
 * GET /api/admin/logs
 * Логи активаций
 */
router.get('/logs', adminAuth, (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = db.prepare('SELECT * FROM activation_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  res.json({ logs });
});

export default router;