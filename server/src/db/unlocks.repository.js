import { pool } from '../db.js';

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
