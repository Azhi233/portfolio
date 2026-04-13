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
    cover_url TEXT,
    video_url TEXT,
    content_json TEXT,
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

export function readProjects() {
  const rows = db
    .prepare(
      `SELECT id, title, category, cover_url, video_url, content_json, created_at
       FROM projects
       ORDER BY datetime(created_at) DESC`,
    )
    .all();

  return rows.map((row) => {
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
      coverUrl: row.cover_url,
      videoUrl: row.video_url,
      createdAt: row.created_at,
      ...extra,
    };
  });
}

export function insertProject(project) {
  const payload = { ...(project || {}) };
  const { id, title, category, coverUrl, videoUrl, createdAt, ...extra } = payload;

  db.prepare(
    `INSERT INTO projects (id, title, category, cover_url, video_url, content_json, created_at)
     VALUES (@id, @title, @category, @cover_url, @video_url, @content_json, @created_at)`,
  ).run({
    id,
    title,
    category: category || null,
    cover_url: coverUrl || null,
    video_url: videoUrl || null,
    content_json: JSON.stringify(extra),
    created_at: createdAt || new Date().toISOString(),
  });
}

export function updateProject(id, project) {
  const payload = { ...(project || {}) };
  const { title, category, coverUrl, videoUrl, createdAt, ...extra } = payload;

  db.prepare(
    `UPDATE projects
     SET title = @title,
         category = @category,
         cover_url = @cover_url,
         video_url = @video_url,
         content_json = @content_json,
         created_at = @created_at
     WHERE id = @id`,
  ).run({
    id,
    title,
    category: category || null,
    cover_url: coverUrl || null,
    video_url: videoUrl || null,
    content_json: JSON.stringify(extra),
    created_at: createdAt || new Date().toISOString(),
  });
}

export function findProjectById(id) {
  const row = db
    .prepare('SELECT id, title, category, cover_url, video_url, content_json, created_at FROM projects WHERE id = ?')
    .get(id);

  if (!row) return null;

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
    coverUrl: row.cover_url,
    videoUrl: row.video_url,
    createdAt: row.created_at,
    ...extra,
  };
}

export default db;
