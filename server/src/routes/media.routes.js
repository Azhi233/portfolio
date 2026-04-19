import express from 'express';

export function createMediaRouter(controller) {
  const router = express.Router();

  router.get('/', controller.getMediaAssets);
  router.post('/', controller.postMediaAsset);

  return router;
}
