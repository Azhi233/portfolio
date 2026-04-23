import { pool } from '../db.js';

export async function findUserByUsername(username) {
  const [rows] = await pool.execute('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1', [String(username).trim()]);
  return rows[0] || null;
}

export async function userExists(username) {
  const [rows] = await pool.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [String(username).trim()]);
  return Boolean(rows[0]);
}

export async function createUser(user) {
  await pool.execute(
    `INSERT INTO users (id, username, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?)` ,
    [user.id, user.username, user.password_hash, user.role, user.created_at],
  );
  return user;
}
