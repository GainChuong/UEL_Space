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

  // SOTA Server AI (Option B): YOLOv11 Microservice Proxy
  router.post('/detect-server', asyncHandler(async (req, res) => {
    const { image, confidenceThreshold, iouThreshold, spaceId, spaceName, capacity, saveRecord } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image base64 payload is required' });
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

    try {
      const response = await fetch(`${AI_SERVICE_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          confidenceThreshold: Number(confidenceThreshold) || 0.25,
          iouThreshold: Number(iouThreshold) || 0.45,
          spaceId,
          spaceName
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          fallbackRequired: true,
          message: `AI Microservice error: ${errText}`
        });
      }

      const result = await response.json();

      // Nếu client yêu cầu tự động đồng bộ MongoDB Atlas
      if (saveRecord && result.success) {
        const { newId, now } = require('../../common/id');
        const cap = Number(capacity) || 0;
        const count = Number(result.count) || 0;
        const rate = cap > 0 ? Math.round((count / cap) * 100) : 0;

        const doc = {
          _id: newId(),
          spaceId: spaceId || 'general',
          spaceName: spaceName || 'UEL Space Room',
          recordedTime: now(),
          userCount: count,
          capacity: cap,
          occupancyRate: rate,
          confidence: result.confidence || 95,
          modelName: result.modelName || 'YOLOv11 Server AI',
          dataSource: 'YOLO11_SERVER_INFERENCE',
          notes: `Detected via YOLOv11 in ${result.processingTimeMs}ms on ${result.device}`
        };
        await service.repository.insert(doc);
        result.savedRecord = doc;
      }

      res.json(result);
    } catch (err) {
      // Server AI offline hoặc timeout -> Trả về fallbackRequired để frontend tự chuyển client AI
      res.status(503).json({
        success: false,
        fallbackRequired: true,
        message: `YOLOv11 Server AI is currently offline or unreachable: ${err.message}`
      });
    }
  }));

  return router;
}

module.exports = { occupancyRoutes, OccupancyService };
