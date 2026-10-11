const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { AuthRepository } = require('./auth.repository');
const { AuthService } = require('./auth.service');
const { AuthController } = require('./auth.controller');
const { requireAuth } = require('../../middleware/require-auth');

function authRoutes({ users, organizationService }) {
  const router = Router();
  const service = new AuthService(new AuthRepository(users), (name) => organizationService.ensureByName(name));
  const controller = new AuthController(service);

  router.post('/google', asyncHandler(controller.googleLogin));
  router.post('/register', asyncHandler(controller.register));
  router.post('/login', asyncHandler(controller.login));
  router.get('/me', asyncHandler(controller.me));
  router.post('/logout', requireAuth, asyncHandler(controller.logout));

  return router;
}

module.exports = { authRoutes };
