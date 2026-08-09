import express from 'express';

export function createSyncRouter(controller, writeAuth) {
  const router = express.Router();
  router.post('/media-assets', writeAuth, controller.syncMediaAssets);
  return router;
}
