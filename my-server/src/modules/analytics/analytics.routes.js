const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { AnalyticsService } = require('./analytics.service');
const { requireManager } = require('../../middleware/require-auth');

function analyticsRoutes(collections) {
  const router = Router();
  const service = new AnalyticsService(collections);

  router.get('/overview', asyncHandler(async (req, res) => res.json(await service.overview())));
  router.get('/utilization', requireManager, asyncHandler(async (req, res) => {
    res.json(await service.utilization({ from: req.query.from, to: req.query.to }));
  }));
  router.get('/peak-hours', asyncHandler(async (req, res) => res.json(await service.peakHours())));
  router.get('/low-usage', requireManager, asyncHandler(async (req, res) => res.json(await service.lowUsage())));
  router.get('/purposes', asyncHandler(async (req, res) => res.json(await service.purposeAnalysis())));
  router.get('/equipment-demand', asyncHandler(async (req, res) => res.json(await service.equipmentDemand())));

  return router;
}

module.exports = { analyticsRoutes };
