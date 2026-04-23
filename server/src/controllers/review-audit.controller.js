import { listReviewAuditLogs } from '../services/reviewAudit.service.js';

export function createReviewAuditController() {
  async function getReviewAuditLogs(_req, res) {
    res.json({ ok: true, data: await listReviewAuditLogs() });
  }

  return { getReviewAuditLogs };
}
