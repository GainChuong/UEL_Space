const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { requireAdmin } = require('../../middleware/require-auth');

function auditRoutes(collections) {
  const router = Router();
  const collection = collections.auditLogs;

  router.get('/', requireAdmin, asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.entityName) query.entityName = req.query.entityName;
    if (req.query.action) query.action = req.query.action;
    if (req.query.level) query.level = req.query.level;
    if (req.query.actorId) query.actorId = req.query.actorId;
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) query.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) query.createdAt.$lte = new Date(req.query.to);
    }
    const limit = Math.min(Number(req.query.limit || 200), 1000);
    const logs = await collection.find(query).sort({ createdAt: -1 }).limit(limit).toArray();
    res.json(logs);
  }));

  return router;
}

module.exports = { auditRoutes };
