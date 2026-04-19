import { pool } from '../db.js';

const TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS translation_review_items (
    id VARCHAR(191) PRIMARY KEY,
    translation_key VARCHAR(512) NOT NULL UNIQUE,
    source_locale VARCHAR(16) NOT NULL DEFAULT 'zh',
    target_locale VARCHAR(16) NOT NULL DEFAULT 'en',
    source_text LONGTEXT NOT NULL,
    translated_text LONGTEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    is_locked TINYINT(1) NOT NULL DEFAULT 0,
    reviewed_by VARCHAR(191) NULL,
    reviewed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_translation_review_items_status (status),
    KEY idx_translation_review_items_key (translation_key)
  )
`;

export async function initTranslationReviewTable() {
  await pool.execute(TABLE_SQL);
}

function toRow(item = {}) {
  return {
    id: item.id || `tri-${Date.now()}`,
    translation_key: item.translationKey || item.key || '',
    source_locale: item.sourceLocale || 'zh',
    target_locale: item.targetLocale || 'en',
    source_text: item.sourceText || '',
    translated_text: item.translatedText || '',
    status: item.status || 'pending',
    is_locked: item.isLocked ? 1 : 0,
    reviewed_by: item.reviewedBy || null,
    reviewed_at: item.reviewedAt || null,
  };
}

function fromRow(row) {
  return {
    id: row.id,
    translationKey: row.translation_key,
    sourceLocale: row.source_locale,
    targetLocale: row.target_locale,
    sourceText: row.source_text,
    translatedText: row.translated_text,
    status: row.status,
    isLocked: Boolean(row.is_locked),
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTranslationReviewItems() {
  const [rows] = await pool.query('SELECT * FROM translation_review_items ORDER BY updated_at DESC');
  return rows.map(fromRow);
}

export async function upsertTranslationReviewItem(item) {
  const row = toRow(item);
  await pool.execute(
    `INSERT INTO translation_review_items
      (id, translation_key, source_locale, target_locale, source_text, translated_text, status, is_locked, reviewed_by, reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      source_locale = VALUES(source_locale),
      target_locale = VALUES(target_locale),
      source_text = VALUES(source_text),
      translated_text = VALUES(translated_text),
      status = VALUES(status),
      is_locked = VALUES(is_locked),
      reviewed_by = VALUES(reviewed_by),
      reviewed_at = VALUES(reviewed_at)`,
    [row.id, row.translation_key, row.source_locale, row.target_locale, row.source_text, row.translated_text, row.status, row.is_locked, row.reviewed_by, row.reviewed_at],
  );
  return getTranslationReviewItemByKey(row.translation_key);
}

export async function updateTranslationReviewStatus(translationKey, status) {
  const normalized = ['pending', 'approved', 'locked'].includes(status) ? status : 'pending';
  const locked = normalized === 'locked' ? 1 : 0;
  await pool.execute(
    `UPDATE translation_review_items
     SET status = ?, is_locked = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE translation_key = ?`,
    [normalized, locked, translationKey],
  );
  return getTranslationReviewItemByKey(translationKey);
}

export async function getTranslationReviewItemByKey(translationKey) {
  const [rows] = await pool.execute('SELECT * FROM translation_review_items WHERE translation_key = ? LIMIT 1', [translationKey]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function seedTranslationReviewItems(items = []) {
  for (const item of items) {
    await upsertTranslationReviewItem(item);
  }
  return listTranslationReviewItems();
}
