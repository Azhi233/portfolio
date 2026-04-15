import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from './src/db.js';

const DEFAULT_USERNAME = 'zhizhi';
const DEFAULT_PASSWORD = 'zhizhi233';
const DEFAULT_ROLE = 'admin';

async function seedAdminUser() {
  const [rows] = await pool.execute('SELECT id, username FROM users WHERE username = ? LIMIT 1', [DEFAULT_USERNAME]);
  const existing = rows[0] || null;

  if (existing) {
    console.log(`Admin user already exists: ${existing.username}`);
    return existing;
  }

  const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const user = {
    id: `user-${crypto.randomUUID()}`,
    username: DEFAULT_USERNAME,
    password_hash: passwordHash,
    role: DEFAULT_ROLE,
    created_at: new Date(),
  };

  await pool.execute(
    `INSERT INTO users (id, username, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, user.username, user.password_hash, user.role, user.created_at],
  );

  console.log(`Seeded default admin user: ${DEFAULT_USERNAME}`);
  return user;
}

seedAdminUser().catch((error) => {
  console.error('Failed to initialize admin user:', error);
  process.exitCode = 1;
});
