const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { UsageRepository } = require('./usage.repository');
const { UsageService } = require('./usage.service');
const { requireAuth, requireManager } = require('../../middleware/require-auth');

class UsageController {
  constructor(service) {
    this.service = service;
  }

  checkIn = async (req, res) => {
    res.status(201).json(await this.service.checkIn(req.body?.bookingId, req.user, req.body?.method));
  };

  checkOut = async (req, res) => {
    res.json(await this.service.checkOut(req.body?.sessionId, req.user, req.body?.method));
  };

  presence = async (req, res) => {
    res.json(await this.service.confirmPresence(req.params.id, req.user));
  };

  listMine = async (req, res) => {
    res.json(await this.service.listMine(req.user));
  };

  listActive = async (req, res) => {
    res.json(await this.service.listActive());
  };

  listBySpace = async (req, res) => {
    res.json(await this.service.listBySpace(req.params.spaceId));
  };

  detail = async (req, res) => {
    res.json(await this.service.detail(req.params.id, req.user));
  };

  listReleaseCases = async (req, res) => {
    res.json(await this.service.listReleaseCases());
  };

  resolveReleaseCase = async (req, res) => {
    res.json(await this.service.resolveReleaseCase(req.params.id, { ...req.body, staffUserId: req.user?.id }));
  };
}

function usageRoutes(collections) {
  const router = Router();
  const service = new UsageService(new UsageRepository(collections), {
    bookingRepository: collections.bookingRepository,
    spaceRepository: collections.spaceRepository,
    notificationService: collections.notificationService,
    spaceStatusSync: collections.spaceStatusSync
  });
  const controller = new UsageController(service);

  router.post('/check-in', requireAuth, asyncHandler(controller.checkIn));
  router.post('/check-out', requireAuth, asyncHandler(controller.checkOut));
  router.post('/sessions/:id/presence', requireAuth, asyncHandler(controller.presence));
  router.get('/me', requireAuth, asyncHandler(controller.listMine));
  router.get('/active', requireManager, asyncHandler(controller.listActive));
  router.get('/space/:spaceId', requireManager, asyncHandler(controller.listBySpace));
  router.get('/sessions/:id', requireAuth, asyncHandler(controller.detail));
  router.get('/release-cases', requireManager, asyncHandler(controller.listReleaseCases));
  router.post('/release-cases/:id/resolve', requireManager, asyncHandler(controller.resolveReleaseCase));

  return router;
}

module.exports = { usageRoutes, UsageService };
