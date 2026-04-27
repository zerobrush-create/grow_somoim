import express from 'express';
import { isAdmin } from './middleware/isAdmin.js';
import { isAuthenticated } from './middleware/isAuthenticated.js';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/me', isAuthenticated, (_req, res) => {
  res.status(200).json({ message: 'Authenticated route placeholder' });
});

app.get('/api/admin', isAuthenticated, isAdmin, (_req, res) => {
  res.status(200).json({ message: 'Admin route placeholder' });
});

// ✅ 로컬 개발용 (Vercel에서는 무시됨)
if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// ✅ Vercel Serverless용 export
export default app;
