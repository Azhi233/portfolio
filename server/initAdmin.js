import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import db from './src/db.js';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_ROLE = 'admin';

function seedAdminUser() {
  const existing = db.prepare('SELECT id, username FROM users WHERE username = ? LIMIT 1').get(DEFAULT_USERNAME);
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
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO users (id, username, password_hash, role, created_at)
     VALUES (@id, @username, @password_hash, @role, @created_at)`,
  ).run(user);

  console.log(`Seeded default admin user: ${DEFAULT_USERNAME}`);
  return user;
}

try {
  seedAdminUser();
} catch (error) {
  console.error('Failed to initialize admin user:', error);
  process.exitCode = 1;
}
