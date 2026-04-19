import { createReview, listReviews } from '../services/reviews.service.js';

export function createReviewsController() {
  async function getReviews(_req, res) {
    res.json({ ok: true, data: await listReviews() });
  }

  async function postReview(req, res) {
    const payload = req.body || {};
    if (!payload.projectId || !payload.projectName || !payload.content) {
      return res.status(400).json({ ok: false, message: 'projectId, projectName and content are required.' });
    }

    const created = await createReview({ ...payload, status: payload.status || 'pending' });
    return res.status(201).json({ ok: true, data: created });
  }

  return { getReviews, postReview };
}
