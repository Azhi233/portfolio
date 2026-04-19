import { Router } from 'express';

export function createTranslationReviewRouter(controller) {
  const router = Router();
  router.get('/', controller.getItems);
  router.post('/seed', controller.postSeed);
  router.patch('/:key/status', controller.patchStatus);
  return router;
}
