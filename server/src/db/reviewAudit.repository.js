import { pool } from '../db.js';
import { parseJson } from './helpers.js';

export async function readReviewAuditLogs() {
  const [rows] = await pool.query('SELECT id, payload_json, created_at FROM review_audit_logs ORDER BY created_at DESC');
  return rows.map((row) => ({ ...parseJson(row.payload_json, {}), id: row.id, createdAt: row.created_at }));
}
