import express from 'express';

export function createDeployRouter(controller) {
  const router = express.Router();

  router.post('/webhook', controller.webhookHandler);
  router.get('/status', controller.statusHandler);

  return router;
}
