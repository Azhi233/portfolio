import { loginUser, registerUser } from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export function createAuthController({ jwtSecret, allowRegister = false }) {
  async function login(req, res) {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ ok: false, message: 'username and password are required.' });

    const result = await loginUser(username, password, jwtSecret);
    if (!result) return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
    return res.json({ ok: true, data: result });
  }

  async function register(req, res) {
    // 公开注册会直接签发 admin JWT,默认关闭;需显式设置 ALLOW_REGISTER=true 才开放
    if (!allowRegister) {
      return res.status(403).json({ ok: false, message: 'Registration is disabled.' });
    }

    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ ok: false, message: 'username and password are required.' });

    const result = await registerUser(username, password, jwtSecret);
    if (result?.error) {
      return res.status(result.error === 'Username already exists.' ? 409 : 400).json({ ok: false, message: result.error });
    }

    return res.status(201).json({ ok: true, data: result });
  }

  return { login: asyncHandler(login), register: asyncHandler(register) };
}
