import express from 'express';

export function createReviewAuditRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getReviewAuditLogs);
  return router;
}
