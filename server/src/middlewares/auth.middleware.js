/**
 * 鉴权中间件:admin JWT / client token 双凭证
 *
 * 凭证体系说明:
 * - admin:JWT(localStorage portfolio.auth.token),由 /api/auth/login 签发,用于管理级写操作
 * - client:解锁口令换取的 token(sessionStorage client-access-token),
 *   格式 `private-<projectId>-<timestamp>`(见 unlocks.service.js),用于控制台写操作
 *
 * createAdminAuthMiddleware:仅接受 admin JWT(严格模式)
 * createWriteAuthMiddleware:admin JWT 或 client token(兼容现有控制台面板,前端统一经 fetchJson 附加 Bearer 头)
 * client token 无签名且不校验签发时间,安全边界弱于 JWT,仅用于控制台面板的轻量防护;
 * 服务端签发 token 表(可撤销/过期)列入后续计划。
 */
import jwt from 'jsonwebtoken';

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
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

    // 优先 admin JWT
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      req.authKind = 'admin';
      return next();
    } catch {
      // fall through:尝试 client token
    }

    // client token:private-<projectId>-<timestamp>,校验对应项目为私密且设置了口令
    const clientMatch = /^private-(.+)-(\d+)$/.exec(token);
    if (clientMatch) {
      try {
        const project = await findProjectById(clientMatch[1]);
        const isPrivateProject = Boolean(project) && String(project.visibility).toLowerCase() === 'private';
        const hasAccessPassword = Boolean(project) && Boolean(String(project.accessPassword || project.password || '').trim());
        if (isPrivateProject && hasAccessPassword) {
          req.client = { projectId: clientMatch[1], token };
          req.authKind = 'client';
          return next();
        }
      } catch {
        // 视为无效凭证
      }
    }

    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  };
}
