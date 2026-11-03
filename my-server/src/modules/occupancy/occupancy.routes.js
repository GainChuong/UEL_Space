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

  // Kiểm tra trạng thái THẬT của YOLO Microservice (Hỗ trợ cả Hugging Face Space & Local Flask/FastAPI)
  let aiHealthCache = { at: 0, data: null };
  router.get('/ai-health', asyncHandler(async (req, res) => {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
    const now = Date.now();
    if (aiHealthCache.data && now - aiHealthCache.at < 10000) {
      return res.json(aiHealthCache.data);
    }

    let data;
    try {
      const isHfSpace = AI_SERVICE_URL.includes('hf.space');
      const healthUrl = isHfSpace ? `${AI_SERVICE_URL}/` : `${AI_SERVICE_URL}/health`;
      const r = await fetch(healthUrl, { signal: AbortSignal.timeout(4000) });
      if (!r.ok) {
        data = { success: true, ready: false, message: `AI Microservice error (HTTP ${r.status})` };
      } else {
        data = {
          success: true,
          ready: true,
          model: 'YOLO26 Occupancy Pure Vision SOTA',
          serviceStatus: 'running',
          device: isHfSpace ? 'Hugging Face ZeroGPU (NVIDIA A10G Cloud)' : 'Local Host',
          message: 'YOLO26 AI Service ready'
        };
      }
    } catch (err) {
      data = { success: true, ready: false, message: `YOLO26 Service offline: ${err.message}` };
    }

    aiHealthCache = { at: now, data };
    res.json(data);
  }));

  // SOTA Server AI (Option B): YOLO Microservice Proxy (Hỗ trợ Hugging Face Gradio 5 API & Local Flask)
  router.post('/detect-server', asyncHandler(async (req, res) => {
    const { image, confidenceThreshold, iouThreshold, spaceId, spaceName, capacity, saveRecord } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image base64 payload is required' });
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
    const isHfSpace = AI_SERVICE_URL.includes('hf.space');

    try {
      let result;

      if (isHfSpace) {
        // Hugging Face Space Gradio 5 REST API flow (/gradio_api/call/detect)
        const initResp = await fetch(`${AI_SERVICE_URL}/gradio_api/call/detect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: [image] }),
          signal: AbortSignal.timeout(10000)
        });

        if (!initResp.ok) {
          const errText = await initResp.text();
          throw new Error(`HF Space Gradio init error (${initResp.status}): ${errText}`);
        }

        const { event_id } = await initResp.json();
        const eventResp = await fetch(`${AI_SERVICE_URL}/gradio_api/call/detect/${event_id}`, {
          signal: AbortSignal.timeout(15000)
        });

        if (!eventResp.ok) {
          throw new Error(`HF Space Gradio event fetch error (${eventResp.status})`);
        }

        const rawEventData = await eventResp.text();
        const match = rawEventData.match(/data:\s*(\[.*?\])/);
        if (!match) {
          throw new Error(`Invalid SSE response format from HF Space: ${rawEventData.slice(0, 100)}`);
        }

        const parsedArray = JSON.parse(match[1]);
        result = parsedArray[0] || { success: false, message: 'No result from HF Space' };
      } else {
        // Standard Flask / FastAPI direct endpoint
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
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          const errText = await response.text();
          return res.status(response.status).json({
            success: false,
            fallbackRequired: true,
            message: `AI Microservice error: ${errText}`
          });
        }

        result = await response.json();
      }

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

  // In-memory buffer lưu trữ frame mới nhất từ Mobile CCTV Node
  // key: room/spaceId (hoặc 'default'), value: { image, timestamp, device, battery }
  const cctvStreams = new Map();

  // 1. Mobile Device đẩy frame snapshot lên (POST /api/occupancy/cctv-stream)
  router.post('/cctv-stream', asyncHandler(async (req, res) => {
    const { streamId = 'default', image, device = 'Mobile Camera', facing = 'environment' } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image payload required' });
    }

    cctvStreams.set(streamId, {
      image,
      device,
      facing,
      timestamp: Date.now()
    });

    res.json({ success: true, timestamp: Date.now() });
  }));

  // 2. Dashboard trên máy tính lấy frame mới nhất về để YOLO phân tích (GET /api/occupancy/cctv-stream/:streamId)
  router.get('/cctv-stream/:streamId', asyncHandler(async (req, res) => {
    const streamId = req.params.streamId || 'default';
    const streamData = cctvStreams.get(streamId);

    if (!streamData) {
      return res.status(404).json({ success: false, message: 'No live stream found for this node' });
    }

    // Nếu frame quá cũ (> 15 giây), coi như camera đã ngắt kết nối
    const ageMs = Date.now() - streamData.timestamp;
    if (ageMs > 15000) {
      return res.json({
        success: false,
        online: false,
        message: 'Camera node is offline (heartbeat timeout)',
        ageMs
      });
    }

    res.json({
      success: true,
      online: true,
      image: streamData.image,
      device: streamData.device,
      facing: streamData.facing,
      ageMs
    });
  }));

  return router;
}

module.exports = { occupancyRoutes, OccupancyService };
