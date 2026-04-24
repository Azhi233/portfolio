import express from 'express';

export function createUploadRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getUploads);
  router.post('/', controller.upload.single('file'), controller.postUpload);
  router.get('/status/:taskId', controller.getUploadStatus);
  return router;
}
