import { readReviewAuditLogs } from '../db.js';

export function createReviewAuditController() {
  async function getReviewAuditLogs(_req, res) {
    res.json({ ok: true, data: await readReviewAuditLogs() });
  }

  return { getReviewAuditLogs };
}
