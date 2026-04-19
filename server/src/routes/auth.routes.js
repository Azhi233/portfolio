import express from 'express';

export function createAuthRouter(controller) {
  const router = express.Router();
  router.post('/login', controller.login);
  router.post('/register', controller.register);
  return router;
}
