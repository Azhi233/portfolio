import { createMediaAsset, listMediaAssets } from '../services/media.service.js';

export function createMediaController() {
  async function getMediaAssets(_req, res) {
    res.json({ ok: true, data: await listMediaAssets() });
  }

  async function postMediaAsset(req, res) {
    const payload = req.body || {};
    if (!payload.url || !payload.kind) {
      return res.status(400).json({ ok: false, message: 'kind and url are required.' });
    }

    const data = await createMediaAsset(payload);
    return res.status(201).json({ ok: true, data });
  }

  return { getMediaAssets, postMediaAsset };
}
