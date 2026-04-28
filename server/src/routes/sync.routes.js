import express from 'express';

export function createSyncRouter(controller) {
  const router = express.Router();
  router.post('/media-assets', controller.syncMediaAssets);
  return router;
}
