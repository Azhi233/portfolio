import { readDeliveryUnlocks, readProjectUnlocks, upsertDeliveryUnlock, upsertProjectUnlock } from '../db.js';

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

  return { getProjectUnlocks, postProjectUnlocks, getDeliveryUnlocks, postDeliveryUnlocks };
}
