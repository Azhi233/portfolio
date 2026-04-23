import { pool } from '../db.js';
import { parseJson, toDateTime } from './helpers.js';

export async function readReviews() {
  const [rows] = await pool.query('SELECT id, payload_json, created_at FROM reviews ORDER BY created_at DESC');
  return rows.map((row) => ({ ...parseJson(row.payload_json, {}), id: row.id, createdAt: row.created_at }));
}

export async function upsertReview(review) {
  const payload = { ...(review || {}) };
  const id = payload.id || `review-${Date.now()}`;
  await pool.execute(
    `INSERT INTO reviews (id, payload_json, created_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), created_at = VALUES(created_at)`,
    [id, JSON.stringify(payload), toDateTime(payload.createdAt || new Date())],
  );
  return { ...payload, id };
}
