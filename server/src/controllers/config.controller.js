import { getConfig, saveConfig } from '../services/config.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

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

    const { homeVideoTitle, homeVideoUrl, homeVideoCaption, homeVideoPosterUrl } = payload;
    const current = await getConfig();
    const currentHomepageVideo = isPlainObject(current?.['homepage-video']) ? current['homepage-video'] : {};
    const nextHomepageVideo = {
      ...currentHomepageVideo,
      ...(Object.prototype.hasOwnProperty.call(payload, 'homeVideoTitle') ? { homeVideoTitle: homeVideoTitle || '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, 'homeVideoUrl') ? { homeVideoUrl: homeVideoUrl || '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, 'homeVideoCaption') ? { homeVideoCaption: homeVideoCaption || '' } : {}),
      ...(Object.prototype.hasOwnProperty.call(payload, 'homeVideoPosterUrl') ? { homeVideoPosterUrl: homeVideoPosterUrl || '' } : {}),
    };
    const data = await saveConfig({ 'homepage-video': nextHomepageVideo });
    notifyConfigChanged('homepage-video');
    broadcastEvent?.('config-updated', { scope: 'homepage-video' });
    return res.json({ ok: true, data: nextHomepageVideo, config: data });
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

  return {
    getConfigHandler: asyncHandler(getConfigHandler),
    postConfigHandler: asyncHandler(postConfigHandler),
    postHomepageVideoHandler: asyncHandler(postHomepageVideoHandler),
    getEditorLayoutHandler: asyncHandler(getEditorLayoutHandler),
    putEditorLayoutHandler: asyncHandler(putEditorLayoutHandler),
    authMiddleware,
  };
}
