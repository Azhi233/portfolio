import express from 'express';

export function createMediaRouter(controller, writeAuth) {
  const router = express.Router();

  router.get('/', controller.getMediaAssets);
  router.post('/', writeAuth, controller.postMediaAsset);

  return router;
}
