function resolvePort(value, fallback = 8788) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
    return parsed;
  }
  return fallback;
}

async function ensureDir(fs, dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureMinioBucket(minioClient, minioBucket, region = '') {
  if (!minioClient || !minioBucket) return false;

  const exists = await minioClient.bucketExists(minioBucket);
  if (!exists) {
    await minioClient.makeBucket(minioBucket, region);
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

function authMiddlewareFactory({ jwt, JWT_SECRET }) {
  return function authMiddleware(req, res, next) {
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
  };
}

function createSseHub() {
  const clients = new Set();

  const notifyConfigChanged = (reason = 'config-updated') => {
    const message = `event: config-updated\ndata: ${JSON.stringify({ reason, at: new Date().toISOString() })}\n\n`;
    for (const client of clients) {
      try {
        client.write(message);
      } catch {
        clients.delete(client);
      }
    }
  };

  function sendSseEvent(client, eventName, payload) {
    client.write(`event: ${eventName}\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  function broadcastSse(eventName, payload) {
    for (const client of clients) {
      try {
        sendSseEvent(client, eventName, payload);
      } catch {
        clients.delete(client);
      }
    }
  }

  return { clients, notifyConfigChanged, sendSseEvent, broadcastSse };
}

function createObjectId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export {
  resolvePort,
  ensureDir,
  ensureMinioBucket,
  safeExt,
  safeDir,
  parseJsonField,
  authMiddlewareFactory,
  createSseHub,
  createObjectId,
};
