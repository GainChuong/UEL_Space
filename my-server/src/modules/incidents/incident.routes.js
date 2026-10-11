const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { IncidentRepository } = require('./incident.repository');
const { IncidentService } = require('./incident.service');
const { requireAuth, requireManager } = require('../../middleware/require-auth');

function incidentRoutes(collections) {
  const router = Router();
  const service = new IncidentService(new IncidentRepository(collections.incidents), {
    spaceRepository: collections.spaceRepository,
    notificationService: collections.notificationService
  });

  router.get('/', requireManager, asyncHandler(async (req, res) => {
    res.json(await service.list({ status: req.query.status, spaceId: req.query.spaceId }));
  }));
  router.get('/me', requireAuth, asyncHandler(async (req, res) => {
    res.json(await service.list({ reporterId: req.user.id }));
  }));
  router.post('/', requireAuth, asyncHandler(async (req, res) => {
    res.status(201).json(await service.create(req.body, req.user));
  }));
  router.patch('/:id', requireManager, asyncHandler(async (req, res) => {
    res.json(await service.updateStatus(req.params.id, req.body, req.user));
  }));

  return router;
}

module.exports = { incidentRoutes };
