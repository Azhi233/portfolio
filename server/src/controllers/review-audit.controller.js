import { listReviewAuditLogs } from '../services/reviewAudit.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export function createReviewAuditController() {
  async function getReviewAuditLogs(_req, res) {
    res.json({ ok: true, data: await listReviewAuditLogs() });
  }

  return { getReviewAuditLogs: asyncHandler(getReviewAuditLogs) };
}
