/**
 * 鉴权中间件:admin JWT / client token 双凭证
 *
 * 凭证体系说明:
 * - admin:JWT(localStorage portfolio.auth.token),由 /api/login 签发,用于管理级写操作
 * - client:解锁口令换取的 token(sessionStorage client-access-token),
 *   格式 `private-<projectId>-<timestamp>-<signature>`(签发见 unlocks.service.js),
 *   其中 signature = HMAC-SHA256(JWT_SECRET, `client:<projectId>:<timestamp>`) 前 16 位十六进制,
 *   有效期为 CLIENT_TOKEN_TTL_MS(7 天),脱离服务端密钥无法伪造
 *
 * createAdminAuthMiddleware:仅接受 admin JWT(严格模式)
 * createWriteAuthMiddleware:admin JWT 或 client token(兼容现有控制台面板,前端统一经 fetchJson 附加 Bearer 头)
 * createOptionalAuthMiddleware:有合法凭证则标记 req.authKind,无凭证也放行(供读接口按鉴权状态脱敏)
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const CLIENT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CLIENT_TOKEN_PATTERN = /^private-(.+)-(\d+)-([a-f0-9]{16})$/;

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function signClientToken(projectId, timestamp, secret) {
  return crypto.createHmac('sha256', String(secret)).update(`client:${projectId}:${timestamp}`).digest('hex').slice(0, 16);
}

/** 签发 client token(unlocks.service.js 使用);signature 绑定项目 ID 与时间戳,不可脱离密钥伪造 */
export function createClientToken({ projectId, secret, now = Date.now() }) {
  const timestamp = now;
  return `private-${projectId}-${timestamp}-${signClientToken(projectId, timestamp, secret)}`;
}

async function verifyClientToken(token, { secret, findProjectById }) {
  const match = CLIENT_TOKEN_PATTERN.exec(token);
  if (!match) return null;

  const projectId = match[1];
  const timestamp = Number(match[2]);
  const signature = match[3];
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  if (Date.now() - timestamp > CLIENT_TOKEN_TTL_MS) return null;
  if (signature !== signClientToken(projectId, timestamp, secret)) return null;

  try {
    const project = await findProjectById(projectId);
    const isPrivateProject = Boolean(project) && String(project.visibility).toLowerCase() === 'private';
    const hasAccessPassword = Boolean(project) && Boolean(String(project.accessPassword || project.password || '').trim());
    if (!isPrivateProject || !hasAccessPassword) return null;
    return { projectId, token };
  } catch {
    // 视为无效凭证
    return null;
  }
}

async function authenticateRequest({ token, secret, findProjectById }) {
  if (!token) return null;

  // 优先 admin JWT
  try {
    const user = jwt.verify(token, secret);
    return { authKind: 'admin', user };
  } catch {
    // fall through:尝试 client token
  }

  const client = await verifyClientToken(token, { secret, findProjectById });
  return client ? { authKind: 'client', client } : null;
}

export function createAdminAuthMiddleware({ JWT_SECRET }) {
  return function adminAuthMiddleware(req, res, next) {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      req.authKind = 'admin';
      return next();
    } catch {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }
  };
}

export function createWriteAuthMiddleware({ JWT_SECRET, findProjectById }) {
  return async function writeAuthMiddleware(req, res, next) {
    const token = extractBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const auth = await authenticateRequest({ token, secret: JWT_SECRET, findProjectById });
    if (!auth) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    Object.assign(req, auth);
    return next();
  };
}

/** 可选鉴权:有合法凭证则标记,无凭证直接放行(供读接口按鉴权状态脱敏) */
export function createOptionalAuthMiddleware({ JWT_SECRET, findProjectById }) {
  return async function optionalAuthMiddleware(req, _res, next) {
    const token = extractBearerToken(req);
    if (!token) return next();

    const auth = await authenticateRequest({ token, secret: JWT_SECRET, findProjectById });
    if (auth) Object.assign(req, auth);
    return next();
  };
}
