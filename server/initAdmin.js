import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from './src/db.js';

const DEFAULT_USERNAME = process.env.ADMIN_INIT_USERNAME || 'zhizhi';
const LEGACY_DEFAULT_PASSWORD = 'zhizhi233';
const ADMIN_INIT_PASSWORD = process.env.ADMIN_INIT_PASSWORD || '';
const DEFAULT_ROLE = 'admin';

export async function seedAdminUser() {
  const [rows] = await pool.execute('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1', [DEFAULT_USERNAME]);
  const existing = rows[0] || null;

  if (existing) {
    // 检测是否仍在使用源码中公开的默认密码
    if (bcrypt.compareSync(LEGACY_DEFAULT_PASSWORD, existing.password_hash)) {
      console.warn(`[auth] Admin user "${DEFAULT_USERNAME}" still uses the default password shipped in source code. Change it immediately (or set ADMIN_INIT_PASSWORD and delete the user to re-seed).`);
    }
    console.log(`Admin user already exists: ${existing.username}`);
    return existing;
  }

  // 密码优先取环境变量;未配置时生成随机密码并仅打印一次,不再使用源码内置密码
  const password = ADMIN_INIT_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const passwordHash = bcrypt.hashSync(password, 10);
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

  console.log(`Seeded admin user "${DEFAULT_USERNAME}" with ${ADMIN_INIT_PASSWORD ? 'password from ADMIN_INIT_PASSWORD' : `generated password: ${password} (print-once, save it now)`}`);
  return user;
}
