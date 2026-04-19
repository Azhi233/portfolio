import dotenv from 'dotenv';
import { initDB, testConnection } from './db.js';
import { initTranslationReviewTable } from './services/translation-review.service.js';
import { initMinio } from './utils/minio.js';
import { createApp } from './app.js';
import { uploadEvents } from './utils/taskEvents.js';
import { seedAdminUser } from '../initAdmin.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-dev-secret';
const DEFAULT_PORT = resolvePort(process.env.VITE_BACKEND_PORT || process.env.PORT, 8789);
const BAOTA_DB_HINT = {
  host: process.env.DB_HOST || process.env.BAOTA_DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
  port: process.env.DB_PORT || process.env.BAOTA_DB_PORT || process.env.MYSQL_PORT || 3306,
  database: process.env.DB_NAME || process.env.BAOTA_DB_NAME || process.env.MYSQL_DATABASE || 'mywebsite',
  user: process.env.DB_USER || process.env.BAOTA_DB_USER || process.env.MYSQL_USER || 'mywebsite',
};

function resolvePort(value, fallback = DEFAULT_PORT) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return parsed;
  }
  return fallback;
}

const PORT = resolvePort(process.env.PORT, DEFAULT_PORT);
const sseClients = new Set();
const app = createApp({
  JWT_SECRET,
  uploadProjectImage: async () => ({ url: '', objectName: '' }),
  notifyConfigChanged: () => {},
  uploadEvents,
  sseClients,
});

async function waitForMinioReady(attempts = 8, delayMs = 1000) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await initMinio();
      return true;
    } catch (error) {
      const message = String(error?.message || error || '');
      if (!message.includes('ECONNREFUSED')) {
        throw error;
      }
      if (i === attempts - 1) return false;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

async function bootstrap() {
  try {
    await initDB();
    await initTranslationReviewTable();
    const databaseReady = await testConnection();
    if (!databaseReady) {
      console.warn('Database is not reachable. Starting server in degraded mode.');
    }
  } catch (error) {
    console.warn('Database initialization skipped:', error?.message || error);
    console.warn('Current DB hint:', BAOTA_DB_HINT);
  }

  if (process.env.MINIO_ENABLED === 'true') {
    try {
      const minioReady = await waitForMinioReady();
      if (!minioReady) {
        console.warn('MinIO initialization skipped after bounded retry: ECONNREFUSED');
      }
    } catch (error) {
      console.warn('MinIO initialization skipped:', error?.message || error);
    }
  }

  try {
    await seedAdminUser();
  } catch (error) {
    console.warn('Admin seed skipped:', error?.message || error);
  }

  startServer(PORT);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exitCode = 1;
});

function startServer(port, attemptsLeft = 20) {
  const server = app.listen(port, () => {
    console.log(`OSS STS policy API running at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use, retrying on ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
      return;
    }

    console.error('Server failed to start:', error);
    process.exitCode = 1;
  });
}
