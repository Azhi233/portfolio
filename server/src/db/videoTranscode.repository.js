import { pool } from '../db.js';

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
