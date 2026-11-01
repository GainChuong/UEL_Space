const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { FeedbackRepository } = require('./feedback.repository');
const { FeedbackService } = require('./feedback.service');
const { requireAuth, requireManager } = require('../../middleware/require-auth');

function feedbackRoutes(collections) {
  const router = Router();
  const service = new FeedbackService(new FeedbackRepository(collections.feedback), {
    usageRepository: collections.usageRepository,
    spaceRepository: collections.spaceRepository
  });

  router.get('/', requireManager, asyncHandler(async (req, res) => {
    res.json(await service.list({ spaceId: req.query.spaceId }));
  }));
  router.get('/me', requireAuth, asyncHandler(async (req, res) => {
    res.json(await service.list({ userId: req.user.id }));
  }));
  router.post('/', requireAuth, asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body, req.user));
  }));

  return router;
}

module.exports = { feedbackRoutes };
