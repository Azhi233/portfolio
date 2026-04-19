import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || process.env.BAOTA_DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
const dbUser = process.env.DB_USER || process.env.BAOTA_DB_USER || process.env.MYSQL_USER || 'mywebsite';
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.BAOTA_DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
const dbName = process.env.DB_NAME || process.env.BAOTA_DB_NAME || process.env.MYSQL_DATABASE || 'mywebsite';
const dbPort = Number(process.env.DB_PORT || process.env.BAOTA_DB_PORT || process.env.MYSQL_PORT || 3306);

export const pool = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: Number.isFinite(dbPort) && dbPort > 0 ? dbPort : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDB() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS global_config (
      key_name VARCHAR(191) PRIMARY KEY,
      json_value LONGTEXT NOT NULL
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(255) NULL,
      role VARCHAR(255) NULL,
      release_date VARCHAR(64) NULL,
      cover_url TEXT NULL,
      cover_asset_url TEXT NULL,
      cover_asset_object_name VARCHAR(512) NULL,
      cover_asset_file_type VARCHAR(128) NULL,
      cover_asset_is_private TINYINT(1) NOT NULL DEFAULT 0,
      thumbnail_url TEXT NULL,
      video_url TEXT NULL,
      main_video_url TEXT NULL,
      bts_media_json LONGTEXT NULL,
      client_agency VARCHAR(255) NULL,
      client_code VARCHAR(255) NULL,
      is_featured TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      description LONGTEXT NULL,
      credits LONGTEXT NULL,
      is_visible TINYINT(1) NOT NULL DEFAULT 1,
      publish_status VARCHAR(64) NULL,
      visibility VARCHAR(64) NULL,
      access_password VARCHAR(255) NULL,
      delivery_pin VARCHAR(255) NULL,
      status VARCHAR(64) NULL,
      password VARCHAR(255) NULL,
      private_files_json LONGTEXT NULL,
      outline_tags_json LONGTEXT NULL,
      content_json LONGTEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      username VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(64) NOT NULL DEFAULT 'admin',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id VARCHAR(191) PRIMARY KEY,
      kind VARCHAR(64) NOT NULL,
      url TEXT NOT NULL,
      meta_json LONGTEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(191) PRIMARY KEY,
      payload_json LONGTEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS review_audit_logs (
      id VARCHAR(191) PRIMARY KEY,
      payload_json LONGTEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS project_unlocks (
      project_id VARCHAR(191) PRIMARY KEY,
      unlocked TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS delivery_unlocks (
      project_id VARCHAR(191) PRIMARY KEY,
      unlocked TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS video_transcode_tasks (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      task_id VARCHAR(191) NOT NULL UNIQUE,
      status VARCHAR(32) NOT NULL,
      original_path VARCHAR(1024) NOT NULL,
      target_url TEXT NULL,
      error_msg TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_video_transcode_tasks_status (status),
      KEY idx_video_transcode_tasks_created_at (created_at)
    )
  `);
}

export async function testConnection() {
  try {
    await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ MySQL 连接成功');
    return true;
  } catch (error) {
    console.error('❌ MySQL 连接失败:', error.message);
    return false;
  }
}

function parseJson(value, fallback) {
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

function toDateTime(value) {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
}

function normalizeProjectRow(row) {
  const extra = parseJson(row.content_json, {});
  const normalizedVideoUrl = row.main_video_url || row.video_url || '';

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    role: row.role || '',
    releaseDate: row.release_date || '',
    coverUrl: row.cover_url || '',
    coverAssetUrl: row.cover_asset_url || row.cover_url || '',
    coverAssetObjectName: row.cover_asset_object_name || '',
    coverAssetFileType: row.cover_asset_file_type || '',
    coverAssetIsPrivate: Boolean(toInt(row.cover_asset_is_private, 0)),
    thumbnailUrl: row.thumbnail_url || row.cover_url || '',
    videoUrl: normalizedVideoUrl,
    mainVideoUrl: normalizedVideoUrl,
    btsMedia: parseJson(row.bts_media_json, []).map((item) => (typeof item === 'string' ? { url: item, isGroupCover: false } : { ...item, isGroupCover: Boolean(item?.isGroupCover) })),
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
    privateFiles: parseJson(row.private_files_json, []),
    outlineTags: parseJson(row.outline_tags_json, []),
    createdAt: row.created_at,
    ...extra,
  };
}

function normalizeProjectPayload(project = {}) {
  const {
    id,
    title,
    category,
    role,
    releaseDate,
    coverUrl,
    coverAssetUrl,
    coverAssetObjectName,
    coverAssetFileType,
    coverAssetIsPrivate,
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
  } = project || {};

  return {
    id,
    title,
    category: category || null,
    role: role || null,
    release_date: releaseDate || null,
    cover_url: coverUrl || null,
    cover_asset_url: coverAssetUrl || coverUrl || null,
    cover_asset_object_name: coverAssetObjectName || null,
    cover_asset_file_type: coverAssetFileType || null,
    cover_asset_is_private: coverAssetIsPrivate ? 1 : 0,
    thumbnail_url: thumbnailUrl || coverUrl || null,
    video_url: videoUrl || null,
    main_video_url: mainVideoUrl || videoUrl || null,
    bts_media_json: JSON.stringify(Array.isArray(btsMedia) ? btsMedia.map((item) => (typeof item === 'string' ? { url: item, isGroupCover: false } : { ...item, isGroupCover: Boolean(item?.isGroupCover) })) : []),
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
    created_at: toDateTime(createdAt),
  };
}

export async function readConfigObject() {
  const [rows] = await pool.query('SELECT key_name, json_value FROM global_config');
  return rows.reduce((acc, row) => {
    acc[row.key_name] = parseJson(row.json_value, row.json_value);
    return acc;
  }, {});
}

export async function upsertConfigObject(config = {}) {
  const entries = Object.entries(config || {}).filter(([key]) => Boolean(key));
  for (const [key, value] of entries) {
    await pool.execute(
      `INSERT INTO global_config (key_name, json_value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE json_value = VALUES(json_value)`,
      [key, JSON.stringify(value ?? null)],
    );
  }
  return readConfigObject();
}

export async function readProjects() {
  const [rows] = await pool.query(
    `SELECT id, title, category, role, release_date, cover_url, cover_asset_url, cover_asset_object_name, cover_asset_file_type, cover_asset_is_private,
            thumbnail_url, video_url, main_video_url, bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits,
            is_visible, publish_status, visibility, access_password, delivery_pin, status, password,
            private_files_json, outline_tags_json, content_json, created_at
     FROM projects
     ORDER BY created_at DESC`,
  );
  return rows.map(normalizeProjectRow);
}

export async function findProjectById(id) {
  const [rows] = await pool.execute(
    `SELECT id, title, category, role, release_date, cover_url, cover_asset_url, cover_asset_object_name, cover_asset_file_type, cover_asset_is_private,
            thumbnail_url, video_url, main_video_url, bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits,
            is_visible, publish_status, visibility, access_password, delivery_pin, status, password,
            private_files_json, outline_tags_json, content_json, created_at
     FROM projects WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? normalizeProjectRow(rows[0]) : null;
}

export async function insertProject(project) {
  const values = normalizeProjectPayload(project);
  await pool.execute(
    `INSERT INTO projects (id, title, category, role, release_date, cover_url, cover_asset_url, cover_asset_object_name, cover_asset_file_type, cover_asset_is_private, thumbnail_url, video_url, main_video_url,
     bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits, is_visible,
     publish_status, visibility, access_password, delivery_pin, status, password, private_files_json, outline_tags_json,
     content_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      values.id,
      values.title,
      values.category,
      values.role,
      values.release_date,
      values.cover_url,
      values.cover_asset_url,
      values.cover_asset_object_name,
      values.cover_asset_file_type,
      values.cover_asset_is_private,
      values.thumbnail_url,
      values.video_url,
      values.main_video_url,
      values.bts_media_json,
      values.client_agency,
      values.client_code,
      values.is_featured,
      values.sort_order,
      values.description,
      values.credits,
      values.is_visible,
      values.publish_status,
      values.visibility,
      values.access_password,
      values.delivery_pin,
      values.status,
      values.password,
      values.private_files_json,
      values.outline_tags_json,
      values.content_json,
      values.created_at,
    ],
  );
  return findProjectById(values.id);
}

export async function updateProject(id, project) {
  const values = normalizeProjectPayload({ ...project, id });
  await pool.execute(
    `UPDATE projects
     SET title = ?, category = ?, role = ?, release_date = ?, cover_url = ?, cover_asset_url = ?, cover_asset_object_name = ?, cover_asset_file_type = ?, cover_asset_is_private = ?, thumbnail_url = ?, video_url = ?, main_video_url = ?,
         bts_media_json = ?, client_agency = ?, client_code = ?, is_featured = ?, sort_order = ?, description = ?, credits = ?,
         is_visible = ?, publish_status = ?, visibility = ?, access_password = ?, delivery_pin = ?, status = ?, password = ?,
         private_files_json = ?, outline_tags_json = ?, content_json = ?, created_at = ?
     WHERE id = ?`,
    [
      values.title,
      values.category,
      values.role,
      values.release_date,
      values.cover_url,
      values.cover_asset_url,
      values.cover_asset_object_name,
      values.cover_asset_file_type,
      values.cover_asset_is_private,
      values.thumbnail_url,
      values.video_url,
      values.main_video_url,
      values.bts_media_json,
      values.client_agency,
      values.client_code,
      values.is_featured,
      values.sort_order,
      values.description,
      values.credits,
      values.is_visible,
      values.publish_status,
      values.visibility,
      values.access_password,
      values.delivery_pin,
      values.status,
      values.password,
      values.private_files_json,
      values.outline_tags_json,
      values.content_json,
      values.created_at,
      id,
    ],
  );
  return findProjectById(id);
}

export async function deleteProjectById(id) {
  const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

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

export async function readReviewAuditLogs() {
  const [rows] = await pool.query('SELECT id, payload_json, created_at FROM review_audit_logs ORDER BY created_at DESC');
  return rows.map((row) => ({ ...parseJson(row.payload_json, {}), id: row.id, createdAt: row.created_at }));
}

export async function appendReviewAuditLog(entry) {
  const payload = { ...(entry || {}) };
  const id = payload.id || `audit-${Date.now()}`;
  await pool.execute(
    `INSERT INTO review_audit_logs (id, payload_json, created_at)
     VALUES (?, ?, ?)`,
    [id, JSON.stringify(payload), toDateTime(payload.at || payload.createdAt || new Date())],
  );
  return { ...payload, id };
}

export async function readProjectUnlocks() {
  const [rows] = await pool.query('SELECT project_id, unlocked FROM project_unlocks');
  return rows.reduce((acc, row) => {
    acc[row.project_id] = Boolean(row.unlocked);
    return acc;
  }, {});
}

export async function upsertProjectUnlock(projectId, unlocked) {
  await pool.execute(
    `INSERT INTO project_unlocks (project_id, unlocked, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE unlocked = VALUES(unlocked)`,
    [projectId, unlocked ? 1 : 0],
  );
}

export async function readDeliveryUnlocks() {
  const [rows] = await pool.query('SELECT project_id, unlocked FROM delivery_unlocks');
  return rows.reduce((acc, row) => {
    acc[row.project_id] = Boolean(row.unlocked);
    return acc;
  }, {});
}

export async function upsertDeliveryUnlock(projectId, unlocked) {
  await pool.execute(
    `INSERT INTO delivery_unlocks (project_id, unlocked, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE unlocked = VALUES(unlocked)`,
    [projectId, unlocked ? 1 : 0],
  );
}

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

export async function createVideoTranscodeTask(task) {
  const payload = { ...(task || {}) };
  await pool.execute(
    `INSERT INTO video_transcode_tasks (task_id, status, original_path, target_url, error_msg, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [payload.taskId, payload.status || 'processing', payload.originalPath || '', payload.targetUrl || null, payload.errorMsg || null],
  );
  return getVideoTranscodeTaskByTaskId(payload.taskId);
}

export async function updateVideoTranscodeTask(taskId, patch = {}) {
  const fields = [];
  const values = [];
  if (patch.status) {
    fields.push('status = ?');
    values.push(patch.status);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'targetUrl')) {
    fields.push('target_url = ?');
    values.push(patch.targetUrl || null);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'errorMsg')) {
    fields.push('error_msg = ?');
    values.push(patch.errorMsg || null);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'originalPath')) {
    fields.push('original_path = ?');
    values.push(patch.originalPath || '');
  }
  if (fields.length === 0) return getVideoTranscodeTaskByTaskId(taskId);

  values.push(taskId);
  await pool.execute(
    `UPDATE video_transcode_tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`,
    values,
  );
  return getVideoTranscodeTaskByTaskId(taskId);
}

export async function getVideoTranscodeTaskByTaskId(taskId) {
  const [rows] = await pool.execute(
    `SELECT id, task_id, status, original_path, target_url, error_msg, created_at, updated_at
     FROM video_transcode_tasks
     WHERE task_id = ?
     LIMIT 1`,
    [taskId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    status: row.status,
    originalPath: row.original_path,
    targetUrl: row.target_url,
    errorMsg: row.error_msg,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function markStaleVideoTranscodeTasks(minutes = 60) {
  await pool.execute(
    `UPDATE video_transcode_tasks
     SET status = 'failed', error_msg = 'Task timed out due to server restart', updated_at = CURRENT_TIMESTAMP
     WHERE status IN ('queued', 'processing')
       AND updated_at < (NOW() - INTERVAL ? MINUTE)`,
    [minutes],
  );
}
