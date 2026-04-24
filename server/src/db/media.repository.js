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

export async function listProjectMediaAssets() {
  const [rows] = await pool.query(
    `SELECT id, title, cover_url, cover_asset_url, thumbnail_url, video_url, main_video_url, cover_asset_object_name, cover_asset_file_type, bts_media_json, content_json, created_at
     FROM projects
     ORDER BY created_at DESC`
  );

  const assets = [];
  const seen = new Set();

  const pushAsset = (asset) => {
    if (!asset?.url) return;
    const key = `${asset.kind}:${asset.url}`;
    if (seen.has(key)) return;
    seen.add(key);
    assets.push(asset);
  };

  for (const row of rows) {
    const meta = parseJson(row.content_json, {});
    const btsMedia = parseJson(row.bts_media_json, []);
    const baseMeta = {
      projectId: row.id,
      projectTitle: row.title,
      source: 'projects',
      createdAt: row.created_at,
    };

    pushAsset({
      id: `${row.id}-cover`,
      kind: 'image',
      url: row.cover_asset_url || row.cover_url || '',
      meta: { ...baseMeta, role: 'cover', objectName: row.cover_asset_object_name || '', fileType: row.cover_asset_file_type || '', ...meta },
      createdAt: row.created_at,
    });

    pushAsset({
      id: `${row.id}-thumbnail`,
      kind: 'image',
      url: row.thumbnail_url || '',
      meta: { ...baseMeta, role: 'thumbnail' },
      createdAt: row.created_at,
    });

    pushAsset({
      id: `${row.id}-video`,
      kind: 'video',
      url: row.main_video_url || row.video_url || '',
      meta: { ...baseMeta, role: 'video' },
      createdAt: row.created_at,
    });

    for (const [index, item] of Array.isArray(btsMedia) ? btsMedia.entries() : []) {
      const media = typeof item === 'string' ? { url: item } : item || {};
      pushAsset({
        id: `${row.id}-bts-${index}`,
        kind: String(media.kind || media.mediaType || (String(media.url || '').match(/\.mp4($|\?)/i) ? 'video' : 'image')).toLowerCase(),
        url: media.url || '',
        meta: { ...baseMeta, role: 'bts', index, isGroupCover: Boolean(media.isGroupCover) },
        createdAt: row.created_at,
      });
    }
  }

  return assets;
}
