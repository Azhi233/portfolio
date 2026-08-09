import { getAboutProfiles, saveAboutProfiles, normalizeAboutProfile } from '../services/aboutProfiles.service.js';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function reindexProfiles(items = []) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

export function createAboutProfilesController({ notifyConfigChanged, broadcastEvent, authMiddleware }) {
  async function getAboutProfilesHandler(_req, res) {
    const data = await getAboutProfiles();
    return res.json({ ok: true, data });
  }

  async function putAboutProfilesHandler(req, res) {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ ok: false, message: 'About profiles payload must be an array.' });
    }

    const data = await saveAboutProfiles(payload);
    notifyConfigChanged('aboutProfiles');
    broadcastEvent?.('config-updated', { scope: 'aboutProfiles' });
    broadcastEvent?.('about-profiles-updated', { scope: 'aboutProfiles' });
    return res.json({ ok: true, data });
  }

  async function postAboutProfilesHandler(req, res) {
    const payload = req.body;
    if (!isPlainObject(payload)) {
      return res.status(400).json({ ok: false, message: 'About profile payload must be a JSON object.' });
    }

    const current = await getAboutProfiles();
    const nextProfile = normalizeAboutProfile(payload, current.length);
    const next = reindexProfiles([...current, nextProfile]);
    const data = await saveAboutProfiles(next);
    notifyConfigChanged('aboutProfiles');
    broadcastEvent?.('config-updated', { scope: 'aboutProfiles' });
    broadcastEvent?.('about-profiles-updated', { scope: 'aboutProfiles' });
    return res.json({ ok: true, data });
  }

  async function putAboutProfileHandler(req, res) {
    const { id } = req.params;
    const payload = req.body;
    if (!id) {
      return res.status(400).json({ ok: false, message: 'Profile id is required.' });
    }
    if (!isPlainObject(payload)) {
      return res.status(400).json({ ok: false, message: 'About profile payload must be a JSON object.' });
    }

    const current = await getAboutProfiles();
    const index = current.findIndex((item) => item.id === id);
    if (index < 0) {
      return res.status(404).json({ ok: false, message: 'Profile not found.' });
    }

    const nextProfile = normalizeAboutProfile({ ...current[index], ...payload, id }, index);
    const next = reindexProfiles(current.map((item) => (item.id === id ? nextProfile : item)));
    const data = await saveAboutProfiles(next);
    notifyConfigChanged('aboutProfiles');
    broadcastEvent?.('config-updated', { scope: 'aboutProfiles' });
    broadcastEvent?.('about-profiles-updated', { scope: 'aboutProfiles' });
    return res.json({ ok: true, data });
  }

  async function deleteAboutProfileHandler(req, res) {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ ok: false, message: 'Profile id is required.' });
    }

    const current = await getAboutProfiles();
    const next = reindexProfiles(current.filter((item) => item.id !== id));
    if (next.length === current.length) {
      return res.status(404).json({ ok: false, message: 'Profile not found.' });
    }

    const data = await saveAboutProfiles(next);
    notifyConfigChanged('aboutProfiles');
    broadcastEvent?.('config-updated', { scope: 'aboutProfiles' });
    return res.json({ ok: true, data });
  }

  return {
    getAboutProfilesHandler,
    putAboutProfilesHandler,
    postAboutProfilesHandler,
    putAboutProfileHandler,
    deleteAboutProfileHandler,
    authMiddleware,
  };
}
