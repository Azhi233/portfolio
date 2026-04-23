import { getConfig, saveConfig } from '../services/config.service.js';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function createConfigController({ notifyConfigChanged, authMiddleware }) {
  async function getConfigHandler(_req, res) {
    res.json({ ok: true, data: await getConfig() });
  }

  async function postConfigHandler(req, res) {
    const payload = req.body;
    if (!isPlainObject(payload)) {
      return res.status(400).json({ ok: false, message: 'Config payload must be a JSON object.' });
    }

    const data = await saveConfig(payload);
    notifyConfigChanged('config');
    return res.json({ ok: true, data });
  }

  async function getEditorLayoutHandler(_req, res) {
    const config = await getConfig();
    return res.json({ ok: true, data: config.editorLayout || { slots: [] } });
  }

  async function putEditorLayoutHandler(req, res) {
    const payload = req.body;
    if (!isPlainObject(payload)) {
      return res.status(400).json({ ok: false, message: 'Editor layout payload must be a JSON object.' });
    }

    const config = await saveConfig({ editorLayout: payload });
    notifyConfigChanged('editorLayout');
    return res.json({ ok: true, data: config.editorLayout || payload });
  }

  return { getConfigHandler, postConfigHandler, getEditorLayoutHandler, putEditorLayoutHandler, authMiddleware };
}
