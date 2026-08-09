import express from 'express';

export function createUnlocksRouter(controller, writeAuth) {
  const router = express.Router();

  router.get('/project-unlocks', controller.getProjectUnlocks);
  router.post('/project-unlocks', writeAuth, controller.postProjectUnlocks);
  router.get('/delivery-unlocks', controller.getDeliveryUnlocks);
  router.post('/delivery-unlocks', writeAuth, controller.postDeliveryUnlocks);
  router.post('/client-access/unlock', controller.postClientAccessUnlock); // public unlock, no auth required

  return router;
}
