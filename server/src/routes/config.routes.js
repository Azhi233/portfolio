import express from 'express';

export function createConfigRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getConfigHandler);
  router.post('/', controller.authMiddleware, controller.postConfigHandler);
  return router;
}
