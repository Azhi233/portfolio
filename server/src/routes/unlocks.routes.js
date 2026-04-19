import express from 'express';

export function createUnlocksRouter(controller) {
  const router = express.Router();

  router.get('/project-unlocks', controller.getProjectUnlocks);
  router.post('/project-unlocks', controller.postProjectUnlocks);
  router.get('/delivery-unlocks', controller.getDeliveryUnlocks);
  router.post('/delivery-unlocks', controller.postDeliveryUnlocks);

  return router;
}
