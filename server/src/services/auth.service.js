import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername, userExists } from '../db/users.repository.js';

export async function loginUser(username, password, jwtSecret) {
  const userRow = await findUserByUsername(username);
  if (!userRow) return null;
  if (!bcrypt.compareSync(String(password), userRow.password_hash)) return null;

  const token = jwt.sign({ sub: userRow.id, username: userRow.username, role: userRow.role }, jwtSecret, { expiresIn: '7d' });
  return { token, user: { id: userRow.id, username: userRow.username, role: userRow.role } };
}

export async function registerUser(username, password, jwtSecret) {
  const normalizedUsername = String(username).trim();
  if (normalizedUsername.length < 3) {
    return { error: 'Username must be at least 3 characters.' };
  }

  if (String(password).length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  if (await userExists(normalizedUsername)) {
    return { error: 'Username already exists.' };
  }

  const user = {
    id: `user-${crypto.randomUUID()}`,
    username: normalizedUsername,
    password_hash: bcrypt.hashSync(String(password), 10),
    role: 'admin',
    created_at: new Date(),
  };

  await createUser(user);
  const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '7d' });
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}
