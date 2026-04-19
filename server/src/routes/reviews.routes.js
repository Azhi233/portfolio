import express from 'express';

export function createReviewsRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getReviews);
  router.post('/', controller.postReview);
  return router;
}
