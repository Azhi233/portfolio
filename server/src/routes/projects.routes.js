import express from 'express';

export function createProjectsRouter(controller, upload, writeAuth, optionalAuth) {
  const router = express.Router();

  router.get('/', optionalAuth, controller.getProjects);
  router.get('/:id', optionalAuth, controller.getProject);
  router.post('/', writeAuth, upload.single('image'), controller.postProject);
  router.put('/:id', writeAuth, upload.single('image'), controller.putProject);
  router.delete('/:id', writeAuth, controller.deleteProject);

  return router;
}
