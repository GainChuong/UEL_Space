const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { NotificationRepository } = require('./notification.repository');
const { NotificationService } = require('./notification.service');
const { requireAuth } = require('../../middleware/require-auth');

function notificationRoutes(collections) {
  const router = Router();
  const service = collections.notificationService || new NotificationService(new NotificationRepository(collections.notifications));

  router.get('/', requireAuth, asyncHandler(async (req, res) => {
    res.json(await service.listForUser(req.user.id));
  }));

  router.post('/:id/read', requireAuth, asyncHandler(async (req, res) => {
    res.json(await service.markRead(req.params.id, req.user.id));
  }));

  router.post('/read-all', requireAuth, asyncHandler(async (req, res) => {
    res.json(await service.markAllRead(req.user.id));
  }));

  return router;
}

module.exports = { notificationRoutes, NotificationService };
