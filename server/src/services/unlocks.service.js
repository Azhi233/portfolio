import { readDeliveryUnlocks, readProjectUnlocks, upsertDeliveryUnlock, upsertProjectUnlock } from '../db/unlocks.repository.js';
import { readProjects } from '../db/projects.repository.js';
import { createClientToken } from '../middlewares/auth.middleware.js';

export async function listProjectUnlocks() {
  return readProjectUnlocks();
}

export async function setProjectUnlock(projectId, unlocked) {
  await upsertProjectUnlock(projectId, unlocked);
  return readProjectUnlocks();
}

export async function listDeliveryUnlocks() {
  return readDeliveryUnlocks();
}

export async function setDeliveryUnlock(projectId, unlocked) {
  await upsertDeliveryUnlock(projectId, unlocked);
  return readDeliveryUnlocks();
}

export async function unlockClientAccess(password, { secret } = {}) {
  const projects = await readProjects();
  const normalizedPassword = String(password || '').trim();
  const match = projects.find((project) => {
    const nextPassword = String(project.accessPassword || project.password || '').trim();
    const visibility = String(project.visibility || '').trim().toLowerCase();
    const projectCode = String(project.clientCode || '').trim();
    return visibility === 'private' && (
      nextPassword === normalizedPassword ||
      (projectCode && projectCode === normalizedPassword)
    );
  });

  if (!match) return null;
  // token 带 HMAC 签名,签名绑定项目 ID 与时间戳,服务端可验签;无密钥无法伪造
  return { project: match, token: createClientToken({ projectId: match.id, secret }) };
}
