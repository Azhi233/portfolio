import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
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
import { createSyncController } from './controllers/sync.controller.js';
import { createSyncRouter } from './routes/sync.routes.js';
import { createHealthcheckRouter } from './routes/healthcheck.routes.js';
import { createAboutProfilesController } from './controllers/aboutProfiles.controller.js';
import { createAboutProfilesRouter } from './routes/aboutProfiles.routes.js';
import { readProjects } from './db/projects.repository.js';

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

  const broadcastEvent = (eventName, payload) => {
    for (const client of sseClients) {
      try {
        client.write(`event: ${eventName}\n`);
        client.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  const eventsController = createEventsController({ sseClients, uploadEvents });
  eventsController.attachUploadEvents(broadcastEvent);

  app.get('/', async (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Portfolio API</title>
    <style>
      body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b0b0f; color: #f5f5f7; }
      .card { width: min(720px, calc(100vw - 32px)); border: 1px solid rgba(255,255,255,.1); border-radius: 24px; padding: 32px; background: rgba(255,255,255,.04); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      h1 { margin: 0 0 12px; font-size: 28px; letter-spacing: .04em; }
      p { margin: 0 0 10px; line-height: 1.75; color: rgba(245,245,247,.72); }
      a { color: #7dd3fc; text-decoration: none; }
      code { background: rgba(255,255,255,.08); padding: 2px 6px; border-radius: 8px; }
      ul { padding-left: 20px; color: rgba(245,245,247,.72); line-height: 1.8; }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Portfolio API 已运行</h1>
      <p>你现在打开的是后端服务根路径，<code>GET /</code> 不提供前端页面，所以会显示这个提示而不是报错。</p>
      <p>常用入口：</p>
      <ul>
        <li><a href="/health">/health</a> - 服务状态</li>
        <li><a href="/api/health">/api/health</a> - API 健康检查</li>
        <li>前端通常运行在 Vite 的开发端口，例如 <code>http://localhost:5173</code></li>
      </ul>
      <p>如果你希望这个端口直接打开前端首页，需要再启动前端开发服务，或者给后端加静态页面托管。</p>
    </main>
  </body>
</html>`);
  });

  app.get('/api/health', async (_req, res) => {
    res.json({ ok: true, service: 'oss-policy-api-sts', databaseReady: true });
  });

  app.get('/health', async (_req, res) => {
    res.json({ ok: true, service: 'oss-policy-api-sts', databaseReady: true });
  });

  app.use('/api/events', createEventsRouter(eventsController));
  app.use('/api', createAuthRouter(createAuthController({ pool, jwtSecret: JWT_SECRET })));
  app.use('/api/config', createConfigRouter(createConfigController({ notifyConfigChanged, broadcastEvent, authMiddleware })));
  app.use('/api/about-profiles', createAboutProfilesRouter(createAboutProfilesController({ notifyConfigChanged, broadcastEvent, authMiddleware })));
  app.use('/api/reviews', createReviewsRouter(createReviewsController()));
  app.use('/api/projects', createProjectsRouter(createProjectsController({ uploadProjectImage, notifyConfigChanged, pool }), upload));
  app.use('/api', createUnlocksRouter(createUnlocksController()));
  app.use('/api/media-assets', createMediaRouter(createMediaController()));
  app.get('/api/clients', async (_req, res) => {
    const projects = await readProjects();
    const clients = projects.filter((project) => project.visibility === 'private');
    res.json({ ok: true, data: clients });
  });
  app.use('/api/review-audit-logs', createReviewAuditRouter(createReviewAuditController()));
  app.use('/api/translation-review-items', createTranslationReviewRouter(createTranslationReviewController()));
  const uploadController = createUploadController();
  app.use('/api/uploads', createUploadRouter(uploadController));
  const syncController = createSyncController();
  app.use('/api/sync', createSyncRouter(syncController));
  app.use('/api/healthcheck', createHealthcheckRouter());

  return app;
}
