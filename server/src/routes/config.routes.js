import express from 'express';

export function createConfigRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getConfigHandler);
  router.get('/editor-layout', controller.getEditorLayoutHandler);
  router.put('/editor-layout', controller.authMiddleware, controller.putEditorLayoutHandler);
  router.post('/', controller.authMiddleware, controller.postConfigHandler);
  return router;
}
