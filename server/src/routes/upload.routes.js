import express from 'express';

export function createUploadRouter(controller, writeAuth) {
  const router = express.Router();
  router.get('/', controller.getUploads);
  router.post('/', writeAuth, controller.upload.single('file'), controller.postUpload);
  router.post('/sign', writeAuth, controller.postSign);
  router.get('/status/:taskId', controller.getUploadStatus);
  return router;
}
