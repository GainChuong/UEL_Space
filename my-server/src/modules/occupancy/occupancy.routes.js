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
  router.post('/record', asyncHandler(async (req, res) => {
    const { spaceId, spaceName, detectedCount, capacity, confidence, modelName, notes } = req.body;
    const { newId, now } = require('../../common/id');
    const doc = {
      _id: newId(),
      spaceId: spaceId || 'general',
      spaceName: spaceName || 'UEL Space Room',
      recordedTime: now(),
      userCount: Number(detectedCount) || 0,
      capacity: Number(capacity) || 0,
      occupancyRate: Number(capacity) > 0 ? Math.round((Number(detectedCount) / Number(capacity)) * 100) : 0,
      confidence: Number(confidence) || 90,
      modelName: modelName || 'UEL Space Hybrid AI',
      dataSource: 'AI_EDGE_CAMERA',
      notes: notes || ''
    };
    await service.repository.insert(doc);
    res.status(201).json({ success: true, record: doc });
  }));

  return router;
}

module.exports = { occupancyRoutes, OccupancyService };
