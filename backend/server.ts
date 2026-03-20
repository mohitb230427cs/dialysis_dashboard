import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './config/db.js';
import { createApiRouter } from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '../frontend');
const distRoot = path.resolve(__dirname, '../dist');

async function startServer() {
  try {
    await connectDB();

    const app = express();
    const PORT = Number(process.env.PORT || 3000);

    app.use(cors());
    app.use(express.json());
    app.use('/api', createApiRouter());

    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        root: frontendRoot,
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(distRoot));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distRoot, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
