import { createReview, listReviews } from '../services/reviews.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export function createReviewsController() {
  async function getReviews(_req, res) {
    res.json({ ok: true, data: await listReviews() });
  }

  async function postReview(req, res) {
    const payload = req.body || {};
    if (!payload.projectId || !payload.projectName || !payload.content) {
      return res.status(400).json({ ok: false, message: 'projectId, projectName and content are required.' });
    }

    // 客户端提交的评论状态强制为 pending,不允许自定审核状态(审批仅由管理端完成)
    const created = await createReview({ ...payload, status: 'pending' });
    return res.status(201).json({ ok: true, data: created });
  }

  return { getReviews: asyncHandler(getReviews), postReview: asyncHandler(postReview) };
}
