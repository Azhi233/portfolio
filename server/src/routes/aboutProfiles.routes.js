import express from 'express';

export function createAboutProfilesRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getAboutProfilesHandler);
  router.put('/', controller.putAboutProfilesHandler);
  router.post('/', controller.postAboutProfilesHandler);
  router.put('/:id', controller.putAboutProfileHandler);
  router.delete('/:id', controller.deleteAboutProfileHandler);
  return router;
}
