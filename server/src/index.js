import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'minio';
import { pool, testConnection } from './db.js';
import '../initAdmin.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '25mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-dev-secret';
const PORT = process.env.PORT || '8787';
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
const MINIO_ENABLED = String(process.env.MINIO_ENABLED || '').toLowerCase() === 'true';
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || '';
const MINIO_PORT = Number(process.env.MINIO_PORT || '9000');
const MINIO_USE_SSL = String(process.env.MINIO_USE_SSL || '').toLowerCase() === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || '';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '';
const MINIO_BUCKET = process.env.MINIO_BUCKET || '';
const MINIO_UPLOAD_PREFIX = process.env.MINIO_UPLOAD_PREFIX || 'portfolio';
const MINIO_PRESIGN_EXPIRES_SECONDS = Number(process.env.MINIO_PRESIGN_EXPIRES_SECONDS || '2592000');

const minioClient = MINIO_ENABLED && MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY
  ? new Client({
      endPoint: MINIO_ENDPOINT,
      port: MINIO_PORT,
      useSSL: MINIO_USE_SSL,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    })
  : null;

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureMinioBucket() {
  if (!minioClient || !MINIO_BUCKET) return false;

  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET, process.env.MINIO_REGION || '');
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
  const [rows] = await pool.query('SELECT key_name, json_value FROM global_config');
  const config = rows.reduce((acc, row) => {
    try {
      acc[row.key_name] = JSON.parse(row.json_value);
    } catch {
      acc[row.key_name] = row.json_value;
    }
    return acc;
  }, {});

  res.json({ ok: true, data: config });
});

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
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
  }, 25000);

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

  const id = payload.id || `review-${Date.now()}`;
  await pool.execute(
    `INSERT INTO reviews (id, payload_json, created_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), created_at = VALUES(created_at)`,
    [id, JSON.stringify({ ...payload, status: payload.status || 'pending' }), new Date(payload.createdAt || new Date())],
  );

  return res.status(201).json({ ok: true, data: { ...payload, id } });
});

app.get('/api/review-audit-logs', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, payload_json, created_at FROM review_audit_logs ORDER BY created_at DESC');
  const data = rows.map((row) => ({
    ...(() => {
      try {
        return row.payload_json ? JSON.parse(row.payload_json) : {};
      } catch {
        return {};
      }
    })(),
    id: row.id,
    createdAt: row.created_at,
  }));
  res.json({ ok: true, data });
});

app.get('/api/project-unlocks', async (_req, res) => {
  const [rows] = await pool.query('SELECT project_id, unlocked FROM project_unlocks');
  const data = rows.reduce((acc, row) => {
    acc[row.project_id] = Boolean(row.unlocked);
    return acc;
  }, {});
  res.json({ ok: true, data });
});

app.post('/api/project-unlocks', async (req, res) => {
  const { projectId, unlocked } = req.body || {};
  if (!projectId) {
    return res.status(400).json({ ok: false, message: 'projectId is required.' });
  }

  await pool.execute(
    `INSERT INTO project_unlocks (project_id, unlocked, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE unlocked = VALUES(unlocked)`,
    [projectId, Boolean(unlocked) ? 1 : 0],
  );

  const [rows] = await pool.query('SELECT project_id, unlocked FROM project_unlocks');
  const data = rows.reduce((acc, row) => {
    acc[row.project_id] = Boolean(row.unlocked);
    return acc;
  }, {});
  return res.json({ ok: true, data });
});

app.get('/api/delivery-unlocks', async (_req, res) => {
  const [rows] = await pool.query('SELECT project_id, unlocked FROM delivery_unlocks');
  const data = rows.reduce((acc, row) => {
    acc[row.project_id] = Boolean(row.unlocked);
    return acc;
  }, {});
  res.json({ ok: true, data });
});

app.post('/api/delivery-unlocks', async (req, res) => {
  const { projectId, unlocked } = req.body || {};
  if (!projectId) {
    return res.status(400).json({ ok: false, message: 'projectId is required.' });
  }

  await pool.execute(
    `INSERT INTO delivery_unlocks (project_id, unlocked, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE unlocked = VALUES(unlocked)`,
    [projectId, Boolean(unlocked) ? 1 : 0],
  );

  const [rows] = await pool.query('SELECT project_id, unlocked FROM delivery_unlocks');
  const data = rows.reduce((acc, row) => {
    acc[row.project_id] = Boolean(row.unlocked);
    return acc;
  }, {});
  return res.json({ ok: true, data });
});

app.post('/api/config', authMiddleware, async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, message: 'Config payload must be a JSON object.' });
  }

  for (const [key, value] of Object.entries(payload)) {
    await pool.execute(
      `INSERT INTO global_config (key_name, json_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE json_value = VALUES(json_value)`,
      [key, JSON.stringify(value ?? null)],
    );
  }

  const [rows] = await pool.query('SELECT key_name, json_value FROM global_config');
  const data = rows.reduce((acc, row) => {
    try {
      acc[row.key_name] = JSON.parse(row.json_value);
    } catch {
      acc[row.key_name] = row.json_value;
    }
    return acc;
  }, {});

  notifyConfigChanged('config');
  return res.json({ ok: true, data });
});

app.get('/api/media-assets', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, kind, url, meta_json, created_at FROM media_assets ORDER BY created_at DESC');
  const data = rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    url: row.url,
    createdAt: row.created_at,
    meta: (() => {
      try {
        return row.meta_json ? JSON.parse(row.meta_json) : {};
      } catch {
        return {};
      }
    })(),
  }));
  res.json({ ok: true, data });
});

app.post('/api/media-assets', async (req, res) => {
  const payload = req.body || {};
  if (!payload.url || !payload.kind) {
    return res.status(400).json({ ok: false, message: 'kind and url are required.' });
  }

  const id = payload.id || `asset-${Date.now()}`;
  await pool.execute(
    `INSERT INTO media_assets (id, kind, url, meta_json, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE kind = VALUES(kind), url = VALUES(url), meta_json = VALUES(meta_json), created_at = VALUES(created_at)`,
    [id, payload.kind, payload.url, JSON.stringify(payload.meta || {}), new Date(payload.createdAt || new Date())],
  );

  return res.status(201).json({ ok: true, data: { id, kind: payload.kind, url: payload.url, meta: payload.meta || {} } });
});

app.get('/api/projects', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, link, created_at
     FROM projects
     ORDER BY created_at DESC`,
  );

  const data = rows.map((row) => ({
    id: row.id,
    title: row.title,
    link: row.link,
    createdAt: row.created_at,
  }));

  res.json({ ok: true, data });
});

app.post('/api/projects', async (req, res) => {
  const project = req.body || {};

  if (!project.id || !project.title) {
    return res.status(400).json({ ok: false, message: 'Project id and title are required.' });
  }

  await pool.execute(
    `INSERT INTO projects (id, title, link, created_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), link = VALUES(link)`,
    [project.id, project.title, project.link || '', new Date(project.createdAt || new Date())],
  );

  const [rows] = await pool.execute('SELECT id, title, link, created_at FROM projects WHERE id = ? LIMIT 1', [project.id]);
  const created = rows[0]
    ? {
        id: rows[0].id,
        title: rows[0].title,
        link: rows[0].link,
        createdAt: rows[0].created_at,
      }
    : null;

  notifyConfigChanged('projects');
  return res.status(201).json({ ok: true, data: created });
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const [existingRows] = await pool.execute('SELECT id FROM projects WHERE id = ? LIMIT 1', [id]);

  if (!existingRows[0]) {
    return res.status(404).json({ ok: false, message: 'Project not found.' });
  }

  const { title, link = '' } = req.body || {};
  if (!title) {
    return res.status(400).json({ ok: false, message: 'Project title is required.' });
  }

  await pool.execute(
    `UPDATE projects SET title = ?, link = ? WHERE id = ?`,
    [title, link, id],
  );

  const [rows] = await pool.execute('SELECT id, title, link, created_at FROM projects WHERE id = ? LIMIT 1', [id]);
  const updated = rows[0]
    ? {
        id: rows[0].id,
        title: rows[0].title,
        link: rows[0].link,
        createdAt: rows[0].created_at,
      }
    : null;

  notifyConfigChanged('projects');
  return res.json({ ok: true, data: updated });
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [id]);

  if (!result.affectedRows) {
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

  if (!minioClient || !MINIO_BUCKET) {
    return res.status(400).json({ ok: false, message: 'MinIO is not enabled.' });
  }

  const expiresInSeconds = MINIO_PRESIGN_EXPIRES_SECONDS;
  const url = await minioClient.presignedGetObject(MINIO_BUCKET, objectPath, expiresInSeconds);
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

    if (minioClient && MINIO_BUCKET) {
      await ensureMinioBucket();
      const objectName = path.posix.join(MINIO_UPLOAD_PREFIX, relativePath);
      await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
        'Content-Type': contentType || 'application/octet-stream',
      });

      const url = await minioClient.presignedGetObject(MINIO_BUCKET, objectName, MINIO_PRESIGN_EXPIRES_SECONDS);

      const responsePayload = {
        url,
        path: objectName,
        size: buffer.length,
        contentType,
        fileName,
        storage: 'minio',
        expiresInSeconds: Number(process.env.MINIO_PRESIGN_EXPIRES_SECONDS || '3600'),
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

app.listen(Number(PORT), () => {
  console.log(`OSS STS policy API running at http://localhost:${PORT}`);
});
