import { getConfig, saveConfig } from '../services/config.service.js';

export function createConfigController({ notifyConfigChanged, authMiddleware }) {
  async function getConfigHandler(_req, res) {
    res.json({ ok: true, data: await getConfig() });
  }

  async function postConfigHandler(req, res) {
    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ ok: false, message: 'Config payload must be a JSON object.' });
    }

    const data = await saveConfig(payload);
    notifyConfigChanged('config');
    return res.json({ ok: true, data });
  }

  return { getConfigHandler, postConfigHandler, authMiddleware };
}
