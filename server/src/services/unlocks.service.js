import { readDeliveryUnlocks, readProjectUnlocks, upsertDeliveryUnlock, upsertProjectUnlock } from '../db/unlocks.repository.js';
import { readProjects } from '../db/projects.repository.js';

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

export async function unlockClientAccess(password) {
  const projects = await readProjects();
  const match = projects.find((project) => {
    const nextPassword = String(project.accessPassword || project.password || '').trim();
    return project.visibility === 'private' && nextPassword === password;
  });

  if (!match) return null;
  return { project: match, token: `private-${match.id}-${Date.now()}` };
}
