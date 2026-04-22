import { readDeliveryUnlocks, readProjectUnlocks, upsertDeliveryUnlock, upsertProjectUnlock, readProjects } from '../db.js';

export function createUnlocksController() {
  async function getProjectUnlocks(_req, res) {
    res.json({ ok: true, data: await readProjectUnlocks() });
  }

  async function postProjectUnlocks(req, res) {
    const { projectId, unlocked } = req.body || {};
    if (!projectId) {
      return res.status(400).json({ ok: false, message: 'projectId is required.' });
    }

    await upsertProjectUnlock(projectId, Boolean(unlocked));
    return res.json({ ok: true, data: await readProjectUnlocks() });
  }

  async function getDeliveryUnlocks(_req, res) {
    res.json({ ok: true, data: await readDeliveryUnlocks() });
  }

  async function postDeliveryUnlocks(req, res) {
    const { projectId, unlocked } = req.body || {};
    if (!projectId) {
      return res.status(400).json({ ok: false, message: 'projectId is required.' });
    }

    await upsertDeliveryUnlock(projectId, Boolean(unlocked));
    return res.json({ ok: true, data: await readDeliveryUnlocks() });
  }

  async function postClientAccessUnlock(req, res) {
    const password = String(req.body?.password || '').trim();
    if (!password) {
      return res.status(400).json({ ok: false, message: 'password is required.' });
    }

    const projects = await readProjects();
    const match = projects.find((project) => {
      const nextPassword = String(project.accessPassword || project.password || '').trim();
      return project.visibility === 'private' && nextPassword === password;
    });

    if (!match) {
      return res.status(404).json({ ok: false, message: 'No matching private project found.' });
    }

    return res.json({ ok: true, data: { project: match, token: `private-${match.id}-${Date.now()}` } });
  }

  return { getProjectUnlocks, postProjectUnlocks, getDeliveryUnlocks, postDeliveryUnlocks, postClientAccessUnlock };
}
