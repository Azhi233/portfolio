import { listTranslationReviewItems, seedTranslationReviewItems, updateTranslationReviewStatus } from '../services/translation-review.service.js';

export function createTranslationReviewController() {
  async function getItems(_req, res) {
    res.json({ ok: true, data: await listTranslationReviewItems() });
  }

  async function postSeed(req, res) {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const data = await seedTranslationReviewItems(items);
    return res.status(201).json({ ok: true, data });
  }

  async function patchStatus(req, res) {
    const { key } = req.params;
    const status = req.body?.status;
    if (!key) return res.status(400).json({ ok: false, message: 'Translation key is required.' });
    const item = await updateTranslationReviewStatus(key, status);
    return res.json({ ok: true, data: item });
  }

  return { getItems, postSeed, patchStatus };
}
