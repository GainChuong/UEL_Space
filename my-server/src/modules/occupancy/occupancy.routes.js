const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { OccupancyRepository } = require('./occupancy.repository');
const { OccupancyService } = require('./occupancy.service');
const { requireManager } = require('../../middleware/require-auth');

function occupancyRoutes(collections) {
  const router = Router();
  const service = new OccupancyService(new OccupancyRepository(collections.occupancyRecords), {
    usageRepository: collections.usageRepository,
    spaceRepository: collections.spaceRepository
  });

  router.get('/live', asyncHandler(async (req, res) => res.json(await service.live())));
  router.get('/history', asyncHandler(async (req, res) => {
    res.json(await service.history({ spaceId: req.query.spaceId, from: req.query.from, to: req.query.to }));
  }));
  router.post('/snapshot', requireManager, asyncHandler(async (req, res) => {
    res.status(201).json(await service.snapshot());
  }));

  return router;
}

module.exports = { occupancyRoutes, OccupancyService };
