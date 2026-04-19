import { readMediaAssets, upsertMediaAsset } from '../db.js';

export function createMediaController() {
  async function getMediaAssets(_req, res) {
    res.json({ ok: true, data: await readMediaAssets() });
  }

  async function postMediaAsset(req, res) {
    const payload = req.body || {};
    if (!payload.url || !payload.kind) {
      return res.status(400).json({ ok: false, message: 'kind and url are required.' });
    }

    const data = await upsertMediaAsset(payload);
    return res.status(201).json({ ok: true, data });
  }

  return { getMediaAssets, postMediaAsset };
}
