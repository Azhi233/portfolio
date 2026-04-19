import express from 'express';

export function createProjectsRouter(controller, upload) {
  const router = express.Router();

  router.get('/', controller.getProjects);
  router.get('/:id', controller.getProject);
  router.post('/', upload.single('image'), controller.postProject);
  router.put('/:id', upload.single('image'), controller.putProject);
  router.delete('/:id', controller.deleteProject);

  return router;
}
