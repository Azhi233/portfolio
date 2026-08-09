import express from 'express';

export function createEventsRouter(controller) {
  const router = express.Router();
  router.get('/', controller.getEvents);
  router.get('/events', controller.getEvents);
  return router;
}
