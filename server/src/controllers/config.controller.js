import { getConfig, saveConfig } from '../services/config.service.js';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function createConfigController({ notifyConfigChanged, broadcastEvent, authMiddleware }) {
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
    broadcastEvent?.('config-updated', { scope: 'config' });
    return res.json({ ok: true, data });
  }

  async function postHomepageVideoHandler(req, res) {
    const payload = req.body;
    if (!isPlainObject(payload)) {
      return res.status(400).json({ ok: false, message: 'Homepage video payload must be a JSON object.' });
    }

    const current = await getConfig();
    const next = await saveConfig({ ...current, homeVideoTitle: payload.homeVideoTitle || '', homeVideoUrl: payload.homeVideoUrl || '' });
    notifyConfigChanged('config');
    broadcastEvent?.('config-updated', { scope: 'homepageVideo' });
    return res.json({ ok: true, data: next });
  }

  async function postHomepageVideoHandler(req, res) {
    const payload = req.body;
    if (!isPlainObject(payload)) {
      return res.status(400).json({ ok: false, message: 'Homepage video payload must be a JSON object.' });
    }

    const { homeVideoTitle, homeVideoUrl } = payload;
    const current = await getConfig();
    const data = await saveConfig({ ...current, homeVideoTitle: homeVideoTitle || '', homeVideoUrl: homeVideoUrl || '' });
    notifyConfigChanged('config');
    broadcastEvent?.('config-updated', { scope: 'config' });
    return res.json({ ok: true, data: { homeVideoTitle: data?.homeVideoTitle || '', homeVideoUrl: data?.homeVideoUrl || '' } });
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
    broadcastEvent?.('editor-layout-updated', { scope: 'editorLayout' });
    return res.json({ ok: true, data: config.editorLayout || payload });
  }

  return { getConfigHandler, postConfigHandler, postHomepageVideoHandler, getEditorLayoutHandler, putEditorLayoutHandler, authMiddleware };
}
