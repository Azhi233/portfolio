import { pool } from '../db.js';
import { parseJson, toDateTime } from './helpers.js';

export async function readMediaAssets() {
  const [rows] = await pool.query('SELECT id, kind, url, meta_json, created_at FROM media_assets ORDER BY created_at DESC');
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    url: row.url,
    createdAt: row.created_at,
    meta: parseJson(row.meta_json, {}),
  }));
}

export async function upsertMediaAsset(asset) {
  const payload = { ...(asset || {}) };
  const id = payload.id || `asset-${Date.now()}`;
  await pool.execute(
    `INSERT INTO media_assets (id, kind, url, meta_json, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE kind = VALUES(kind), url = VALUES(url), meta_json = VALUES(meta_json), created_at = VALUES(created_at)`,
    [id, payload.kind || 'image', payload.url || '', JSON.stringify(payload.meta || {}), toDateTime(payload.createdAt || new Date())],
  );
  return { id, kind: payload.kind || 'image', url: payload.url || '', meta: payload.meta || {} };
}
