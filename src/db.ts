import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(path.join(DB_DIR, 'licenses.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,               -- '7d' | '14d' | '30d' | '365d' | 'lifetime'
    status TEXT DEFAULT 'unused',     -- 'unused' | 'active' | 'revoked' | 'expired'
    hwid TEXT,                        -- привязанный HWID (null если не активирован)
    activatedAt INTEGER,              -- когда активирован
    expiresAt INTEGER,                -- когда истекает (null для lifetime)
    createdAt INTEGER NOT NULL,       -- когда сгенерирован
    lastCheckAt INTEGER,              -- последняя проверка
    note TEXT                         -- заметка (кому продал)
  );

  CREATE TABLE IF NOT EXISTS activation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    licenseCode TEXT NOT NULL,
    action TEXT NOT NULL,             -- 'activate' | 'validate' | 'revoke' | 'reset_hwid'
    hwid TEXT,
    ip TEXT,
    userAgent TEXT,
    success INTEGER,
    message TEXT,
    timestamp INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_licenses_code ON licenses(code);
  CREATE INDEX IF NOT EXISTS idx_licenses_hwid ON licenses(hwid);
  CREATE INDEX IF NOT EXISTS idx_logs_code ON activation_logs(licenseCode);
`);

console.log('[DB] Initialized at', path.join(DB_DIR, 'licenses.db'));