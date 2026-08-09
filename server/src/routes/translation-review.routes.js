import { Router } from 'express';

export function createTranslationReviewRouter(controller, writeAuth) {
  const router = Router();
  router.get('/', controller.getItems);
  router.post('/seed', writeAuth, controller.postSeed);
  router.patch('/:key/status', writeAuth, controller.patchStatus);
  return router;
}
