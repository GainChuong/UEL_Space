const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { ScheduleRepository } = require('./schedule.repository');
const { requireManager } = require('../../middleware/require-auth');
const { newId, now } = require('../../common/id');
const { requireObject, requireString, requireNumber, optionalString, parseDate } = require('../../common/validate');
const { AppError } = require('../../common/app-error');

function scheduleRoutes(collections) {
  const router = Router();
  const repository = new ScheduleRepository(collections.schedules);

  router.get('/', asyncHandler(async (req, res) => {
    if (req.query.spaceId) return res.json(await repository.findBySpace(req.query.spaceId));
    res.json(await repository.findAll({ status: { $ne: 'CANCELLED' } }));
  }));

  router.post('/', requireManager, asyncHandler(async (req, res) => {
    requireObject(req.body);
    const spaceId = requireString(req.body.spaceId, 'spaceId');
    const startTime = parseDate(req.body.startTime, 'startTime');
    const endTime = parseDate(req.body.endTime, 'endTime');
    if (endTime <= startTime) throw AppError.badRequest('endTime phải sau startTime');
    const conflicts = await repository.overlapping(spaceId, startTime, endTime);
    if (conflicts.length) throw AppError.conflict('Lịch trùng với lịch đã có', 'SCHEDULE_CONFLICT');
    const schedule = {
      _id: newId(),
      spaceId,
      organizationId: req.body.organizationId || null,
      semester: optionalString(req.body.semester, 'semester') || '',
      courseCode: optionalString(req.body.courseCode, 'courseCode') || '',
      startTime,
      endTime,
      scheduleType: optionalString(req.body.scheduleType, 'scheduleType') || 'CLASS',
      recurrenceRule: optionalString(req.body.recurrenceRule, 'recurrenceRule') || '',
      source: req.body.source || 'MANUAL',
      status: 'ACTIVE',
      createdAt: now(),
      updatedAt: now()
    };
    await repository.insert(schedule);
    res.status(201).json(schedule);
  }));

  return router;
}

module.exports = { scheduleRoutes };
