import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './db'; // Инициализация БД
import licensesRouter from './routes/licenses';
import adminRouter from './routes/admin';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json());

// Логи запросов
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Роуты
app.use('/api/license', licensesRouter);
app.use('/api/admin', adminRouter);

// Проверка что сервер жив
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'Roblox Activator License Server', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 License server running on http://localhost:${PORT}`);
  console.log(`📊 Admin password: ${process.env.ADMIN_PASSWORD}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`   POST /api/license/activate`);
  console.log(`   POST /api/license/validate`);
  console.log(`   POST /api/admin/login`);
  console.log(`   POST /api/admin/generate`);
  console.log(`   GET  /api/admin/list`);
  console.log(`   POST /api/admin/revoke\n`);
});