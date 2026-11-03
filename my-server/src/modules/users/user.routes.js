const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { UserRepository } = require('./user.repository');
const { UserService } = require('./user.service');
const { requireAdmin } = require('../../middleware/require-auth');

function userRoutes(collections) {
  const router = Router();
  const service = new UserService(new UserRepository(collections));

  router.get('/', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.list({ role: req.query.role, status: req.query.status, keyword: req.query.keyword }));
  }));
  router.get('/:id', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.detail(req.params.id));
  }));
  router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
    res.json(await service.update(req.params.id, req.body, req.user?.id));
  }));

  return router;
}

module.exports = { userRoutes };
