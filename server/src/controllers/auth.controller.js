import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export function createAuthController({ pool, jwtSecret }) {
  async function login(req, res) {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'username and password are required.' });
    }

    const [rows] = await pool.execute('SELECT id, username, password_hash, role FROM users WHERE username = ? LIMIT 1', [String(username).trim()]);
    const userRow = rows[0] || null;

    if (!userRow) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
    }

    const passwordMatches = bcrypt.compareSync(String(password), userRow.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ sub: userRow.id, username: userRow.username, role: userRow.role }, jwtSecret, { expiresIn: '7d' });
    return res.json({ ok: true, data: { token, user: { id: userRow.id, username: userRow.username, role: userRow.role } } });
  }

  async function register(req, res) {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'username and password are required.' });
    }

    const normalizedUsername = String(username).trim();
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ ok: false, message: 'Username must be at least 3 characters.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters.' });
    }

    const [existingRows] = await pool.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [normalizedUsername]);
    if (existingRows[0]) {
      return res.status(409).json({ ok: false, message: 'Username already exists.' });
    }

    const user = {
      id: `user-${crypto.randomUUID()}`,
      username: normalizedUsername,
      password_hash: bcrypt.hashSync(String(password), 10),
      role: 'admin',
      created_at: new Date(),
    };

    await pool.execute(
      `INSERT INTO users (id, username, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.username, user.password_hash, user.role, user.created_at],
    );

    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '7d' });
    return res.status(201).json({ ok: true, data: { token, user: { id: user.id, username: user.username, role: user.role } } });
  }

  return { login, register };
}
