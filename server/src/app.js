import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { pool, readReviewAuditLogs } from './db.js';
import { createProjectsController } from './controllers/projects.controller.js';
import { createConfigController } from './controllers/config.controller.js';
import { createReviewsController } from './controllers/reviews.controller.js';
import { createProjectsRouter } from './routes/projects.routes.js';
import { createConfigRouter } from './routes/config.routes.js';
import { createReviewsRouter } from './routes/reviews.routes.js';
import { createUnlocksController } from './controllers/unlocks.controller.js';
import { createUnlocksRouter } from './routes/unlocks.routes.js';
import { createMediaController } from './controllers/media.controller.js';
import { createMediaRouter } from './routes/media.routes.js';
import { createAuthController } from './controllers/auth.controller.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createEventsController } from './controllers/events.controller.js';
import { createEventsRouter } from './routes/events.routes.js';
import { createUploadController } from './controllers/upload.controller.js';
import { createReviewAuditController } from './controllers/review-audit.controller.js';
import { createReviewAuditRouter } from './routes/review-audit.routes.js';
import { createTranslationReviewController } from './controllers/translation-review.controller.js';
import { createTranslationReviewRouter } from './routes/translation-review.routes.js';
import { createUploadRouter } from './routes/upload.routes.js';

export function createApp({ JWT_SECRET, uploadProjectImage, notifyConfigChanged, uploadEvents, sseClients }) {
  const app = express();
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5178,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:5176,http://127.0.0.1:5178,http://127.0.0.1:4173,http://47.114.95.49,http://47.114.95.49:5173,http://47.114.95.49:5174,http://47.114.95.49:5176,http://47.114.95.49:5178')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOptions = {
    origin(origin, callback) {
      callback(null, !origin || corsOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.set('trust proxy', true);
  app.use(express.json({ limit: '20480mb' }));
  app.use(express.urlencoded({ limit: '20480mb', extended: true }));

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20480 * 1024 * 1024 } });
  const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      return next();
    } catch {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
  };

  const eventsController = createEventsController({ sseClients, uploadEvents });
  eventsController.attachUploadEvents((eventName, payload) => {
    for (const client of sseClients) {
      try {
        client.write(`event: ${eventName}\n`);
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  });

  app.get('/api/health', async (_req, res) => {
    res.json({ ok: true, service: 'oss-policy-api-sts', databaseReady: true });
  });

  app.get('/health', async (_req, res) => {
    res.json({ ok: true, service: 'oss-policy-api-sts', databaseReady: true });
  });

  app.use('/api/events', createEventsRouter(eventsController));
  app.use('/api', createAuthRouter(createAuthController({ pool, jwtSecret: JWT_SECRET })));
  app.use('/api/config', createConfigRouter(createConfigController({ notifyConfigChanged, authMiddleware })));
  app.use('/api/reviews', createReviewsRouter(createReviewsController()));
  app.use('/api/projects', createProjectsRouter(createProjectsController({ uploadProjectImage, notifyConfigChanged, pool }), upload));
  app.use('/api', createUnlocksRouter(createUnlocksController()));
  app.use('/api/media-assets', createMediaRouter(createMediaController()));
  app.use('/api/review-audit-logs', createReviewAuditRouter(createReviewAuditController()));
  app.use('/api/translation-review-items', createTranslationReviewRouter(createTranslationReviewController()));
  const uploadController = createUploadController();
  app.use('/api/uploads', createUploadRouter(uploadController));

  return app;
}
