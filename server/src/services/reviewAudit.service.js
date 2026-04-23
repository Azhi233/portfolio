import { readReviewAuditLogs } from '../db/reviewAudit.repository.js';

export async function listReviewAuditLogs() {
  return readReviewAuditLogs();
}
