import { pool } from '../db.js';
import { parseJson } from './helpers.js';

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
