import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import {
  pool,
  initDB,
  testConnection,
  readConfigObject,
  upsertConfigObject,
  readProjects,

  insertProject,
  updateProject,
  deleteProjectById,
  readReviews,
  upsertReview,
  readReviewAuditLogs,
  readProjectUnlocks,
  upsertProjectUnlock,
  readDeliveryUnlocks,
  upsertDeliveryUnlock,
  readMediaAssets,
  upsertMediaAsset,
  markStaleVideoTranscodeTasks,
} from './db.js';
import { minioClient, minioBucket, minioUploadPrefix, minioPresignExpiresSeconds } from './utils/minioClient.js';
import { initMinio } from './utils/minio.js';
import uploadRouter from './routes/upload.js';
import { seedAdminUser } from '../initAdmin.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: ['http://localhost:5175', 'http://localhost:5173', 'http://47.114.95.49'],
  credentials: true,
}));
app.set('trust proxy', true);
app.use(express.json({ limit: '20480mb' }));
app.use(express.urlencoded({ limit: '20480mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-dev-secret';
const DEFAULT_PORT = 8787;
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20480 * 1024 * 1024 } });

function resolvePort(value, fallback = DEFAULT_PORT) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return parsed;
  }
  return fallback;
}

const PORT = resolvePort(process.env.PORT, DEFAULT_PORT);

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureMinioBucket() {
  if (!minioClient || !minioBucket) return false;

  const exists = await minioClient.bucketExists(minioBucket);
  if (!exists) {
    await minioClient.makeBucket(minioBucket, process.env.MINIO_REGION || '');
  }

  return true;
}

function safeExt(fileName = '') {
  const parts = String(fileName).split('.');
  if (parts.length < 2) return 'bin';
  return parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
}

function safeDir(inputDir = '') {
  const cleaned = String(inputDir)
    .replace(/\\/g, '/')
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return cleaned || 'uploads';
}

function parseJsonField(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(403).json({ ok: false, message: 'Forbidden' });
  }
}

const sseClients = new Set();

function normalizeTaskEventPayload(payload = {}) {
  return {
    event: String(payload.event || 'task-updated'),
    taskId: String(payload.taskId || ''),
    status: String(payload.status || ''),
    targetUrl: payload.targetUrl ?? null,
    errorMsg: payload.errorMsg ?? null,
  };
}

function emitTaskEvent(payload = {}) {
  const normalized = normalizeTaskEventPayload(payload);
  const message = `event: ${normalized.event}\ndata: ${JSON.stringify(normalized)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
  return normalized;
}

const notifyConfigChanged = (reason = 'config-updated') => {
  const message = `event: config-updated\ndata: ${JSON.stringify({ reason, at: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
};


app.get('/api/health', async (_req, res) => {
  const databaseReady = await testConnection();
  res.json({ ok: databaseReady, service: 'oss-policy-api-sts', databaseReady });
});

app.get('/api/config', async (_req, res) => {
  res.json({ ok: true, data: await readConfigObject() });
});

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  sseClients.add(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});


app.post('/api/login', async (req, res) => {
  const { pool } = await import('./db.js');
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'username and password are required.' });
  }

  const [rows] = await pool.execute('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1', [String(username).trim()]);
  const userRow = rows[0] || null;

  if (!userRow) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
  }

  const passwordMatches = bcrypt.compareSync(String(password), userRow.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { sub: userRow.id, username: userRow.username, role: userRow.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return res.json({ ok: true, data: { token, user: { id: userRow.id, username: userRow.username, role: userRow.role } } });
});

app.post('/api/register', async (req, res) => {
  const { pool } = await import('./db.js');
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'username and password are required.' });
  }

  const normalizedUsername = String(username).trim();
  if (normalizedUsername.length < 3) {
    return res.status(400).json({ ok: false, message: 'Username must be at least 3 characters.' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters.' });
  }

  const [existingRows] = await pool.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [normalizedUsername]);
  if (existingRows[0]) {
    return res.status(409).json({ ok: false, message: 'Username already exists.' });
  }

  const passwordHash = bcrypt.hashSync(String(password), 10);
  const user = {
    id: `user-${crypto.randomUUID()}`,
    username: normalizedUsername,
    password_hash: passwordHash,
    role: 'admin',
    created_at: new Date(),
  };

  await pool.execute(
    `INSERT INTO users (id, username, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, user.username, user.password_hash, user.role, user.created_at],
  );

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return res.status(201).json({ ok: true, data: { token, user: { id: user.id, username: user.username, role: user.role } } });
});

app.get('/api/reviews', async (_req, res) => {
  res.json({ ok: true, data: await readReviews() });
});

app.post('/api/reviews', async (req, res) => {
  const payload = req.body || {};
  if (!payload.projectId || !payload.projectName || !payload.content) {
    return res.status(400).json({ ok: false, message: 'projectId, projectName and content are required.' });
  }

  const created = await upsertReview({ ...payload, status: payload.status || 'pending' });
  return res.status(201).json({ ok: true, data: created });
});

app.get('/api/review-audit-logs', async (_req, res) => {
  res.json({ ok: true, data: await readReviewAuditLogs() });
});

app.get('/api/project-unlocks', async (_req, res) => {
  res.json({ ok: true, data: await readProjectUnlocks() });
});

app.post('/api/project-unlocks', async (req, res) => {
  const { projectId, unlocked } = req.body || {};
  if (!projectId) {
    return res.status(400).json({ ok: false, message: 'projectId is required.' });
  }

  await upsertProjectUnlock(projectId, Boolean(unlocked));
  return res.json({ ok: true, data: await readProjectUnlocks() });
});

app.get('/api/delivery-unlocks', async (_req, res) => {
  res.json({ ok: true, data: await readDeliveryUnlocks() });
});

app.post('/api/delivery-unlocks', async (req, res) => {
  const { projectId, unlocked } = req.body || {};
  if (!projectId) {
    return res.status(400).json({ ok: false, message: 'projectId is required.' });
  }

  await upsertDeliveryUnlock(projectId, Boolean(unlocked));
  return res.json({ ok: true, data: await readDeliveryUnlocks() });
});

app.post('/api/config', authMiddleware, async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, message: 'Config payload must be a JSON object.' });
  }

  const data = await upsertConfigObject(payload);
  notifyConfigChanged('config');
  return res.json({ ok: true, data });
});

app.get('/api/media-assets', async (_req, res) => {
  res.json({ ok: true, data: await readMediaAssets() });
});

app.post('/api/media-assets', async (req, res) => {
  const payload = req.body || {};
  if (!payload.url || !payload.kind) {
    return res.status(400).json({ ok: false, message: 'kind and url are required.' });
  }

  const data = await upsertMediaAsset(payload);
  return res.status(201).json({ ok: true, data });
});

app.get('/api/projects', async (_req, res) => {
  res.json({ ok: true, data: await readProjects() });
});

app.use('/api/uploads', uploadRouter);

async function uploadProjectImage(file) {
  if (!file) return { url: '', objectName: '' };

  if (!minioClient || !minioBucket) {
    throw new Error('MinIO is not enabled.');
  }

  const ext = String(file.originalname || '').split('.').pop() || 'bin';
  const safeExtName = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const objectName = path.posix.join(
    minioUploadPrefix,
    'projects',
    new Date().toISOString().slice(0, 10),
    `${crypto.randomUUID()}.${safeExtName}`,
  );

  await ensureMinioBucket();
  await minioClient.putObject(minioBucket, objectName, file.buffer, file.size, {
    'Content-Type': file.mimetype || 'application/octet-stream',
  });

  const url = await minioClient.presignedGetObject(minioBucket, objectName, minioPresignExpiresSeconds);
  return { url, objectName };
}

app.post('/api/projects', upload.single('image'), async (req, res) => {
  try {
    const project = req.body || {};

    let coverUrl = String(project.coverUrl || project.thumbnailUrl || '').trim();
    let coverAssetUrl = String(project.coverAssetUrl || '').trim();
    let coverAssetObjectName = String(project.coverAssetObjectName || '').trim();
    let coverAssetFileType = String(project.coverAssetFileType || '').trim();
    let coverAssetIsPrivate = project.coverAssetIsPrivate === 'true' || project.coverAssetIsPrivate === true;

    if (req.file) {
      const uploadResult = await uploadProjectImage(req.file);
      coverUrl = uploadResult.url;
      coverAssetUrl = uploadResult.url;
      coverAssetObjectName = uploadResult.objectName || '';
      coverAssetFileType = req.file.mimetype || 'application/octet-stream';
      coverAssetIsPrivate = false;
    }

    const payload = {
      ...project,
      id: String(project.id || crypto.randomUUID()),
      title: String(project.title || '').trim(),
      category: String(project.category || '').trim() || null,
      role: String(project.role || '').trim() || null,
      releaseDate: String(project.releaseDate || '').trim() || null,
      coverUrl,
      coverAssetUrl,
      coverAssetObjectName,
      coverAssetFileType,
      coverAssetIsPrivate,
      thumbnailUrl: String(project.thumbnailUrl || coverUrl || '').trim() || coverUrl,
      videoUrl: String(project.videoUrl || '').trim() || null,
      mainVideoUrl: String(project.mainVideoUrl || project.videoUrl || '').trim() || null,
      btsMedia: parseJsonField(project.btsMedia, []),
      clientAgency: String(project.clientAgency || '').trim() || null,
      clientCode: String(project.clientCode || '').trim() || null,
      isFeatured: project.isFeatured === 'true' || project.isFeatured === true,
      sortOrder: Number.isFinite(Number(project.sortOrder)) ? Number(project.sortOrder) : 0,
      description: String(project.description || '').trim() || null,
      credits: String(project.credits || '').trim() || null,
      isVisible: project.isVisible === 'false' || project.isVisible === false ? 0 : 1,
      publishStatus: String(project.publishStatus || 'Draft').trim(),
      visibility: String(project.visibility || project.publishStatus || 'Draft').trim(),
      accessPassword: String(project.accessPassword || project.password || '').trim() || null,
      deliveryPin: String(project.deliveryPin || '').trim() || null,
      status: String(project.status || 'draft').trim(),
      password: String(project.password || project.accessPassword || '').trim() || null,
      privateFiles: parseJsonField(project.privateFiles, []),
      outlineTags: parseJsonField(project.outlineTags, []),
    };

    if (!payload.id || !payload.title) {
      return res.status(400).json({ ok: false, message: 'Project id and title are required.' });
    }

    const created = await insertProject(payload);
    notifyConfigChanged('projects');
    return res.status(201).json({ ok: true, data: created });
  } catch (error) {
    console.error('Failed to create project:', error);
    return res.status(500).json({ ok: false, message: 'Failed to create project.', detail: error?.message || '' });
  }
});

app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [id]);

    if (!existingRows[0]) {
      return res.status(404).json({ ok: false, message: 'Project not found.' });
    }

    const { title, ...rest } = req.body || {};
    if (!title) {
      return res.status(400).json({ ok: false, message: 'Project title is required.' });
    }

    let coverUrl = String(rest.coverUrl || rest.thumbnailUrl || '').trim();
    if (req.file) {
      coverUrl = await uploadProjectImage(req.file);
    }

    const updated = await updateProject(id, {
      ...rest,
      title,
      coverUrl,
      thumbnailUrl: String(rest.thumbnailUrl || coverUrl || '').trim() || coverUrl,
    });
    notifyConfigChanged('projects');
    return res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Failed to update project:', error);
    return res.status(500).json({ ok: false, message: 'Failed to update project.', detail: error?.message || '' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await deleteProjectById(id);

  if (!deleted) {
    return res.status(404).json({ ok: false, message: 'Project not found.' });
  }

  notifyConfigChanged('projects');
  return res.json({ ok: true, data: { id } });
});

app.post('/api/uploads/sign', async (req, res) => {
  const { path: objectPath = '' } = req.body || {};
  if (!objectPath) {
    return res.status(400).json({ ok: false, message: 'path is required.' });
  }

  if (!minioClient || !minioBucket) {
    return res.status(400).json({ ok: false, message: 'MinIO is not enabled.' });
  }

  const expiresInSeconds = minioPresignExpiresSeconds;
  const url = await minioClient.presignedGetObject(minioBucket, objectPath, expiresInSeconds);
  return res.json({ ok: true, data: { url, expiresInSeconds, path: objectPath } });
});

app.post('/api/uploads/local', async (req, res, next) => {
  try {
    const { fileName = '', contentType = '', data = '', dir = 'uploads' } = req.body || {};
    if (!fileName || !data) {
      return res.status(400).json({ ok: false, message: 'fileName and data are required.' });
    }

    const ext = safeExt(fileName);
    const folder = safeDir(dir);
    const dateFolder = new Date().toISOString().slice(0, 10);
    const relativeDir = path.posix.join(folder, dateFolder);
    const fileBase = `${crypto.randomUUID()}.${ext}`;
    const relativePath = path.posix.join(relativeDir, fileBase);
    const buffer = Buffer.from(String(data).replace(/^data:[^;]+;base64,/, ''), 'base64');

    if (minioClient && minioBucket) {
      await ensureMinioBucket();
      const objectName = path.posix.join(minioUploadPrefix, relativePath);
      await minioClient.putObject(minioBucket, objectName, buffer, buffer.length, {
        'Content-Type': contentType || 'application/octet-stream',
      });

      const url = await minioClient.presignedGetObject(minioBucket, objectName, minioPresignExpiresSeconds);

      const responsePayload = {
        url,
        path: objectName,
        size: buffer.length,
        contentType,
        fileName,
        storage: 'minio',
        expiresInSeconds: minioPresignExpiresSeconds,
      };

      notifyConfigChanged('uploads');

      return res.status(201).json({
        ok: true,
        data: responsePayload,
      });
    }

    const absoluteDir = path.join(LOCAL_UPLOAD_DIR, relativeDir);
    const absolutePath = path.join(absoluteDir, fileBase);

    await ensureDir(absoluteDir);
    await fs.writeFile(absolutePath, buffer);

    const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    const responsePayload = {
      url,
      path: relativePath.replace(/\\/g, '/'),
      size: buffer.length,
      contentType,
      fileName,
      storage: 'local',
    };

    notifyConfigChanged('uploads');

    return res.status(201).json({
      ok: true,
      data: responsePayload,
    });
  } catch (error) {
    return next(error);
  }
});

app.use('/uploads', express.static(LOCAL_UPLOAD_DIR, { fallthrough: false }));

app.use((error, _req, res, _next) => {
  console.error(error);

  const detail = error?.message || 'unknown_error';
  if (detail.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ ok: false, message: 'Record already exists.', detail });
  }

  return res.status(500).json({
    ok: false,
    message: 'internal_server_error',
    detail,
  });
});

async function bootstrap() {
  await initDB();
  const databaseReady = await testConnection();
  if (!databaseReady) {
    throw new Error('Database initialization failed.');
  }

  await markStaleVideoTranscodeTasks(60);

  if (process.env.MINIO_ENABLED === 'true') {
    await initMinio();
  }

  await seedAdminUser();

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
