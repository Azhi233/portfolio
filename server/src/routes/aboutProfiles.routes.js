import express from 'express';

export function createAboutProfilesRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getAboutProfilesHandler);
  router.put('/', controller.authMiddleware, controller.putAboutProfilesHandler);
  router.post('/', controller.authMiddleware, controller.postAboutProfilesHandler);
  router.put('/:id', controller.authMiddleware, controller.putAboutProfileHandler);
  router.delete('/:id', controller.authMiddleware, controller.deleteAboutProfileHandler);
  return router;
}
