import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, {
  deleteProjectById,
  findProjectById,
  insertProject,
  readConfigObject,
  readDeliveryUnlocks,
  readMediaAssets,
  readProjectUnlocks,
  readProjects,
  readReviewAuditLogs,
  readReviews,
  updateProject,
  upsertConfigObject,
  upsertDeliveryUnlock,
  upsertMediaAsset,
  upsertProjectUnlock,
  upsertReview,
} from './db.js';
import '../initAdmin.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '25mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-dev-secret';
const PORT = process.env.PORT || '8787';
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'oss-policy-api-sts' });
});

app.get('/api/config', (_req, res) => {
  const config = readConfigObject();
  res.json({ ok: true, data: config });
});


app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: 'username and password are required.' });
  }

  const user = db.prepare('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1').get(String(username).trim());
  if (!user) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
  }

  const passwordMatches = bcrypt.compareSync(String(password), user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return res.json({ ok: true, data: { token, user: { id: user.id, username: user.username, role: user.role } } });
});

app.post('/api/register', (req, res) => {
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

  const existing = db.prepare('SELECT id FROM users WHERE username = ? LIMIT 1').get(normalizedUsername);
  if (existing) {
    return res.status(409).json({ ok: false, message: 'Username already exists.' });
  }

  const passwordHash = bcrypt.hashSync(String(password), 10);
  const user = {
    id: `user-${crypto.randomUUID()}`,
    username: normalizedUsername,
    password_hash: passwordHash,
    role: 'admin',
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO users (id, username, password_hash, role, created_at)
     VALUES (@id, @username, @password_hash, @role, @created_at)`,
  ).run(user);

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return res.status(201).json({ ok: true, data: { token, user: { id: user.id, username: user.username, role: user.role } } });
});

app.get('/api/reviews', (_req, res) => {
  res.json({ ok: true, data: readReviews() });
});

app.post('/api/reviews', (req, res) => {
  const payload = req.body || {};
  if (!payload.projectId || !payload.projectName || !payload.content) {
    return res.status(400).json({ ok: false, message: 'projectId, projectName and content are required.' });
  }

  const created = upsertReview({
    ...payload,
    status: payload.status || 'pending',
    createdAt: payload.createdAt || new Date().toISOString(),
  });
  return res.status(201).json({ ok: true, data: created });
});

app.get('/api/review-audit-logs', (_req, res) => {
  res.json({ ok: true, data: readReviewAuditLogs() });
});

app.get('/api/project-unlocks', (_req, res) => {
  res.json({ ok: true, data: readProjectUnlocks() });
});

app.post('/api/project-unlocks', (req, res) => {
  const { projectId, unlocked } = req.body || {};
  if (!projectId) {
    return res.status(400).json({ ok: false, message: 'projectId is required.' });
  }

  upsertProjectUnlock(projectId, Boolean(unlocked));
  return res.json({ ok: true, data: readProjectUnlocks() });
});

app.get('/api/delivery-unlocks', (_req, res) => {
  res.json({ ok: true, data: readDeliveryUnlocks() });
});

app.post('/api/delivery-unlocks', (req, res) => {
  const { projectId, unlocked } = req.body || {};
  if (!projectId) {
    return res.status(400).json({ ok: false, message: 'projectId is required.' });
  }

  upsertDeliveryUnlock(projectId, Boolean(unlocked));
  return res.json({ ok: true, data: readDeliveryUnlocks() });
});

app.post('/api/config', authMiddleware, (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, message: 'Config payload must be a JSON object.' });
  }

  const data = upsertConfigObject(payload);
  return res.json({ ok: true, data });
});

app.get('/api/media-assets', (_req, res) => {
  const data = readMediaAssets();
  res.json({ ok: true, data });
});

app.post('/api/media-assets', (req, res) => {
  const payload = req.body || {};
  if (!payload.url || !payload.kind) {
    return res.status(400).json({ ok: false, message: 'kind and url are required.' });
  }

  const created = upsertMediaAsset(payload);
  return res.status(201).json({ ok: true, data: created });
});

app.get('/api/projects', (_req, res) => {
  const data = readProjects();
  res.json({ ok: true, data });
});

app.post('/api/projects', (req, res) => {
  const project = req.body || {};

  if (!project.id || !project.title) {
    return res.status(400).json({ ok: false, message: 'Project id and title are required.' });
  }

  insertProject(project);
  const created = findProjectById(project.id);
  return res.status(201).json({ ok: true, data: created });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const existed = findProjectById(id);

  if (!existed) {
    return res.status(404).json({ ok: false, message: 'Project not found.' });
  }

  const merged = {
    ...existed,
    ...(req.body || {}),
    id,
  };

  if (!merged.title) {
    return res.status(400).json({ ok: false, message: 'Project title is required.' });
  }

  updateProject(id, merged);
  const updated = findProjectById(id);
  return res.json({ ok: true, data: updated });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const deleted = deleteProjectById(id);

  if (!deleted) {
    return res.status(404).json({ ok: false, message: 'Project not found.' });
  }

  return res.json({ ok: true, data: { id } });
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
    const absoluteDir = path.join(LOCAL_UPLOAD_DIR, relativeDir);
    const absolutePath = path.join(absoluteDir, fileBase);

    await ensureDir(absoluteDir);
    const buffer = Buffer.from(String(data).replace(/^data:[^;]+;base64,/, ''), 'base64');
    await fs.writeFile(absolutePath, buffer);

    const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    return res.status(201).json({
      ok: true,
      data: {
        url,
        path: relativePath.replace(/\\/g, '/'),
        size: buffer.length,
        contentType,
        fileName,
      },
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

app.listen(Number(PORT), () => {
  console.log(`OSS STS policy API running at http://localhost:${PORT}`);
});
