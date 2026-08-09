/**
 * 统一错误处理中间件:notFoundHandler / errorHandler / asyncHandler
 *
 * 约定:
 * - controller 中抛出的错误统一交给 errorHandler 转为 JSON 响应
 * - 业务错误可携带 status(4xx)与 detail(仅非生产环境返回)
 * - 500 级错误记录堆栈,但不向客户端暴露内部细节
 */

export function notFoundHandler(req, res) {
  res.status(404).json({ ok: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error('[server-error]', err?.stack || err?.message || err);
  }

  const body = {
    ok: false,
    message: isServerError ? 'Internal server error.' : (err?.message || 'Request failed.'),
  };
  if (!isServerError && process.env.NODE_ENV !== 'production' && err?.detail) {
    body.detail = err.detail;
  }
  return res.status(status).json(body);
}

/** 包装 async 路由处理器,自动把 rejection 交给 next(error) */
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
