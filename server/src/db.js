import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'portfolio.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS global_config (
    key_name TEXT PRIMARY KEY,
    json_value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    role TEXT,
    release_date TEXT,
    cover_url TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    main_video_url TEXT,
    bts_media_json TEXT,
    client_agency TEXT,
    client_code TEXT,
    is_featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    credits TEXT,
    is_visible INTEGER NOT NULL DEFAULT 1,
    publish_status TEXT,
    visibility TEXT,
    access_password TEXT,
    delivery_pin TEXT,
    status TEXT,
    password TEXT,
    private_files_json TEXT,
    outline_tags_json TEXT,
    content_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    url TEXT NOT NULL,
    meta_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS review_audit_logs (
    id TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_unlocks (
    project_id TEXT PRIMARY KEY,
    unlocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS delivery_unlocks (
    project_id TEXT PRIMARY KEY,
    unlocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function readConfigObject() {
  const rows = db.prepare('SELECT key_name, json_value FROM global_config').all();
  return rows.reduce((acc, row) => {
    try {
      acc[row.key_name] = JSON.parse(row.json_value);
    } catch {
      acc[row.key_name] = row.json_value;
    }
    return acc;
  }, {});
}

export function upsertConfigObject(config = {}) {
  const entries = Object.entries(config || {}).filter(([key]) => Boolean(key));
  const stmt = db.prepare(`
    INSERT INTO global_config (key_name, json_value)
    VALUES (@key_name, @json_value)
    ON CONFLICT(key_name) DO UPDATE SET json_value = excluded.json_value
  `);

  const trx = db.transaction((items) => {
    for (const [key, value] of items) {
      stmt.run({ key_name: key, json_value: JSON.stringify(value ?? null) });
    }
  });

  trx(entries);
  return readConfigObject();
}

function parseJsonArray(value, fallback = []) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function parseJsonObject(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function toInt(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeProjectRow(row) {
  let extra = {};
  try {
    extra = row.content_json ? JSON.parse(row.content_json) : {};
  } catch {
    extra = {};
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    role: row.role || '',
    releaseDate: row.release_date || '',
    coverUrl: row.cover_url || '',
    thumbnailUrl: row.thumbnail_url || row.cover_url || '',
    videoUrl: row.video_url || '',
    mainVideoUrl: row.main_video_url || row.video_url || '',
    btsMedia: parseJsonArray(row.bts_media_json, []),
    clientAgency: row.client_agency || '',
    clientCode: row.client_code || '',
    isFeatured: Boolean(toInt(row.is_featured, 0)),
    sortOrder: toInt(row.sort_order, 0),
    description: row.description || '',
    credits: row.credits || '',
    isVisible: Boolean(toInt(row.is_visible, 1)),
    publishStatus: row.publish_status || 'Draft',
    visibility: row.visibility || 'Draft',
    accessPassword: row.access_password || '',
    deliveryPin: row.delivery_pin || '',
    status: row.status || 'draft',
    password: row.password || '',
    privateFiles: parseJsonArray(row.private_files_json, []),
    outlineTags: parseJsonArray(row.outline_tags_json, []),
    createdAt: row.created_at,
    ...extra,
  };
}

export function readProjects() {
  const rows = db
    .prepare(
      `SELECT id, title, category, role, release_date, cover_url, thumbnail_url, video_url, main_video_url,
              bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits,
              is_visible, publish_status, visibility, access_password, delivery_pin, status, password,
              private_files_json, outline_tags_json, content_json, created_at
       FROM projects
       ORDER BY datetime(created_at) DESC`,
    )
    .all();

  return rows.map(normalizeProjectRow);
}

function normalizeReviewRow(row) {
  return {
    ...parseJsonObject(row.payload_json, {}),
    id: row.id,
    createdAt: row.created_at,
  };
}

export function readReviews() {
  return db
    .prepare('SELECT id, payload_json, created_at FROM reviews ORDER BY datetime(created_at) DESC')
    .all()
    .map(normalizeReviewRow);
}

export function upsertReview(review) {
  const payload = { ...(review || {}) };
  const id = payload.id || `review-${Date.now()}`;
  db.prepare(
    `INSERT INTO reviews (id, payload_json, created_at)
     VALUES (@id, @payload_json, @created_at)
     ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json`,
  ).run({
    id,
    payload_json: JSON.stringify(payload),
    created_at: payload.createdAt || new Date().toISOString(),
  });
  return { ...payload, id };
}

export function readReviewAuditLogs() {
  return db
    .prepare('SELECT id, payload_json, created_at FROM review_audit_logs ORDER BY datetime(created_at) DESC')
    .all()
    .map(normalizeReviewRow);
}

export function appendReviewAuditLog(entry) {
  const payload = { ...(entry || {}) };
  const id = payload.id || `audit-${Date.now()}`;
  db.prepare(
    `INSERT INTO review_audit_logs (id, payload_json, created_at)
     VALUES (@id, @payload_json, @created_at)`,
  ).run({
    id,
    payload_json: JSON.stringify(payload),
    created_at: payload.at || payload.createdAt || new Date().toISOString(),
  });
  return { ...payload, id };
}

export function readProjectUnlocks() {
  return db
    .prepare('SELECT project_id, unlocked FROM project_unlocks')
    .all()
    .reduce((acc, row) => {
      acc[row.project_id] = Boolean(row.unlocked);
      return acc;
    }, {});
}

export function upsertProjectUnlock(projectId, unlocked) {
  db.prepare(
    `INSERT INTO project_unlocks (project_id, unlocked, created_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(project_id) DO UPDATE SET unlocked = excluded.unlocked`,
  ).run(projectId, unlocked ? 1 : 0);
}

export function readDeliveryUnlocks() {
  return db
    .prepare('SELECT project_id, unlocked FROM delivery_unlocks')
    .all()
    .reduce((acc, row) => {
      acc[row.project_id] = Boolean(row.unlocked);
      return acc;
    }, {});
}

export function upsertDeliveryUnlock(projectId, unlocked) {
  db.prepare(
    `INSERT INTO delivery_unlocks (project_id, unlocked, created_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(project_id) DO UPDATE SET unlocked = excluded.unlocked`,
  ).run(projectId, unlocked ? 1 : 0);
}

function normalizeProjectPayload(project = {}) {
  const payload = { ...(project || {}) };
  const {
    id,
    title,
    category,
    role,
    releaseDate,
    coverUrl,
    thumbnailUrl,
    videoUrl,
    mainVideoUrl,
    btsMedia,
    clientAgency,
    clientCode,
    isFeatured,
    sortOrder,
    description,
    credits,
    isVisible,
    publishStatus,
    visibility,
    accessPassword,
    deliveryPin,
    status,
    password,
    privateFiles,
    outlineTags,
    createdAt,
    ...extra
  } = payload;

  return {
    id,
    title,
    category: category || null,
    role: role || null,
    release_date: releaseDate || null,
    cover_url: coverUrl || null,
    thumbnail_url: thumbnailUrl || coverUrl || null,
    video_url: videoUrl || null,
    main_video_url: mainVideoUrl || videoUrl || null,
    bts_media_json: JSON.stringify(Array.isArray(btsMedia) ? btsMedia : []),
    client_agency: clientAgency || null,
    client_code: clientCode || null,
    is_featured: isFeatured ? 1 : 0,
    sort_order: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    description: description || null,
    credits: credits || null,
    is_visible: isVisible === false ? 0 : 1,
    publish_status: publishStatus || 'Draft',
    visibility: visibility || publishStatus || 'Draft',
    access_password: accessPassword || null,
    delivery_pin: deliveryPin || null,
    status: status || 'draft',
    password: password || null,
    private_files_json: JSON.stringify(Array.isArray(privateFiles) ? privateFiles : []),
    outline_tags_json: JSON.stringify(Array.isArray(outlineTags) ? outlineTags : []),
    content_json: JSON.stringify(extra),
    created_at: createdAt || new Date().toISOString(),
  };
}

export function insertProject(project) {
  const values = normalizeProjectPayload(project);

  db.prepare(
    `INSERT INTO projects (id, title, category, role, release_date, cover_url, thumbnail_url, video_url, main_video_url,
     bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits, is_visible,
     publish_status, visibility, access_password, delivery_pin, status, password, private_files_json, outline_tags_json,
     content_json, created_at)
     VALUES (@id, @title, @category, @role, @release_date, @cover_url, @thumbnail_url, @video_url, @main_video_url,
     @bts_media_json, @client_agency, @client_code, @is_featured, @sort_order, @description, @credits, @is_visible,
     @publish_status, @visibility, @access_password, @delivery_pin, @status, @password, @private_files_json, @outline_tags_json,
     @content_json, @created_at)`,
  ).run(values);
}

export function updateProject(id, project) {
  const values = normalizeProjectPayload({ ...project, id });

  db.prepare(
    `UPDATE projects
     SET title = @title,
         category = @category,
         role = @role,
         release_date = @release_date,
         cover_url = @cover_url,
         thumbnail_url = @thumbnail_url,
         video_url = @video_url,
         main_video_url = @main_video_url,
         bts_media_json = @bts_media_json,
         client_agency = @client_agency,
         client_code = @client_code,
         is_featured = @is_featured,
         sort_order = @sort_order,
         description = @description,
         credits = @credits,
         is_visible = @is_visible,
         publish_status = @publish_status,
         visibility = @visibility,
         access_password = @access_password,
         delivery_pin = @delivery_pin,
         status = @status,
         password = @password,
         private_files_json = @private_files_json,
         outline_tags_json = @outline_tags_json,
         content_json = @content_json,
         created_at = @created_at
     WHERE id = @id`,
  ).run(values);
}

export function deleteProjectById(id) {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}

export function upsertMediaAsset(asset) {
  const payload = { ...(asset || {}) };
  const id = payload.id || `asset-${Date.now()}`;
  db.prepare(
    `INSERT INTO media_assets (id, kind, url, meta_json, created_at)
     VALUES (@id, @kind, @url, @meta_json, @created_at)
     ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, url = excluded.url, meta_json = excluded.meta_json`,
  ).run({
    id,
    kind: payload.kind || 'image',
    url: payload.url || '',
    meta_json: JSON.stringify(payload.meta || {}),
    created_at: payload.createdAt || new Date().toISOString(),
  });
  return { id, kind: payload.kind || 'image', url: payload.url || '', meta: payload.meta || {} };
}

export function readMediaAssets() {
  return db.prepare('SELECT id, kind, url, meta_json, created_at FROM media_assets ORDER BY datetime(created_at) DESC').all().map((row) => ({
    id: row.id,
    kind: row.kind,
    url: row.url,
    createdAt: row.created_at,
    meta: row.meta_json ? JSON.parse(row.meta_json) : {},
  }));
}

export function findProjectById(id) {
  const row = db
    .prepare(
      `SELECT id, title, category, role, release_date, cover_url, thumbnail_url, video_url, main_video_url,
              bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits,
              is_visible, publish_status, visibility, access_password, delivery_pin, status, password,
              private_files_json, outline_tags_json, content_json, created_at
       FROM projects WHERE id = ?`,
    )
    .get(id);

  if (!row) return null;

  return normalizeProjectRow(row);
}

export default db;
