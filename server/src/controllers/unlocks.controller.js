import { listDeliveryUnlocks, listProjectUnlocks, setDeliveryUnlock, setProjectUnlock, unlockClientAccess } from '../services/unlocks.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export function createUnlocksController() {
  async function getProjectUnlocks(_req, res) {
    res.json({ ok: true, data: await listProjectUnlocks() });
  }

  async function postProjectUnlocks(req, res) {
    const { projectId, unlocked } = req.body || {};
    if (!projectId) return res.status(400).json({ ok: false, message: 'projectId is required.' });
    return res.json({ ok: true, data: await setProjectUnlock(projectId, Boolean(unlocked)) });
  }

  async function getDeliveryUnlocks(_req, res) {
    res.json({ ok: true, data: await listDeliveryUnlocks() });
  }

  async function postDeliveryUnlocks(req, res) {
    const { projectId, unlocked } = req.body || {};
    if (!projectId) return res.status(400).json({ ok: false, message: 'projectId is required.' });
    return res.json({ ok: true, data: await setDeliveryUnlock(projectId, Boolean(unlocked)) });
  }

  async function postClientAccessUnlock(req, res) {
    const password = String(req.body?.password || '').trim();
    if (!password) return res.status(400).json({ ok: false, message: 'password is required.' });

    const match = await unlockClientAccess(password);
    if (!match) return res.status(404).json({ ok: false, message: 'No matching private project found.' });

    return res.json({ ok: true, data: match });
  }

  return {
    getProjectUnlocks: asyncHandler(getProjectUnlocks),
    postProjectUnlocks: asyncHandler(postProjectUnlocks),
    getDeliveryUnlocks: asyncHandler(getDeliveryUnlocks),
    postDeliveryUnlocks: asyncHandler(postDeliveryUnlocks),
    postClientAccessUnlock: asyncHandler(postClientAccessUnlock),
  };
}
