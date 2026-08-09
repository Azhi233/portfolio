import express from 'express';

export function createProjectsRouter(controller, upload, writeAuth) {
  const router = express.Router();

  router.get('/', controller.getProjects);
  router.get('/:id', controller.getProject);
  router.post('/', writeAuth, upload.single('image'), controller.postProject);
  router.put('/:id', writeAuth, upload.single('image'), controller.putProject);
  router.delete('/:id', writeAuth, controller.deleteProject);

  return router;
}
