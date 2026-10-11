const { env } = require('../config/env');
const { getCollection } = require('../config/db');
const { now, newId } = require('../common/id');
const { BOOKING_STATUS, SESSION_STATUS, DEFAULT_POLICY } = require('../common/constants');
const { UsageRepository } = require('../modules/usage/usage.repository');
const { UsageService } = require('../modules/usage/usage.service');
const { NotificationRepository } = require('../modules/notifications/notification.repository');
const { NotificationService } = require('../modules/notifications/notification.service');
const { OccupancyRepository } = require('../modules/occupancy/occupancy.repository');
const { OccupancyService } = require('../modules/occupancy/occupancy.service');
const { writeAudit } = require('../common/audit');

function buildContext() {
  const collections = {
    usageSessions: getCollection('usage_sessions'),
    presenceRecords: getCollection('presence_records'),
    releaseCases: getCollection('release_cases'),
    bookings: getCollection('bookings'),
    spaces: getCollection('spaces'),
    notifications: getCollection('notifications'),
    occupancyRecords: getCollection('occupancy_records')
  };

  const notificationService = new NotificationService(new NotificationRepository(collections.notifications));
  const usageRepository = new UsageRepository(collections);
  const usageService = new UsageService(usageRepository, {
    bookingRepository: {
      findById: (id) => collections.bookings.findOne({ _id: id }),
      update: (id, patch) => collections.bookings.findOneAndUpdate({ _id: id }, { $set: patch, $inc: { version: 1 } }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r))
    },
    spaceRepository: {
      findById: (id) => collections.spaces.findOne({ _id: id }),
      update: (id, patch) => collections.spaces.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r))
    },
    notificationService,
    spaceStatusSync: null
  });
  const occupancyService = new OccupancyService(new OccupancyRepository(collections.occupancyRecords), {
    usageRepository,
    spaceRepository: { findAll: (f) => collections.spaces.find({ deletedAt: null, ...f }).toArray() }
  });

  return { collections, notificationService, usageRepository, usageService, occupancyService };
}

async function detectNoShows(ctx) {
  const { collections, notificationService } = ctx;
  const currentTime = now();
  const candidates = await collections.bookings
    .find({ deletedAt: null, status: BOOKING_STATUS.APPROVED, startTime: { $lte: currentTime } })
    .toArray();

  let marked = 0;
  for (const booking of candidates) {
    const space = await collections.spaces.findOne({ _id: booking.spaceId });
    const policy = { ...DEFAULT_POLICY, ...(space?.policy || {}) };
    const cutoff = new Date(new Date(booking.startTime).getTime() + policy.noShowGraceMinutes * 60000);
    if (currentTime < cutoff) continue;

    const session = await collections.usageSessions.findOne({ bookingId: booking._id });
    if (session) continue;

    await collections.bookings.updateOne(
      { _id: booking._id },
      { $set: { status: BOOKING_STATUS.NO_SHOW, updatedAt: currentTime }, $inc: { version: 1 } }
    );
    await writeAudit({ action: 'NO_SHOW', entityName: 'Booking', entityId: booking._id, changes: { code: booking.code }, level: 'WARNING' });
    await notificationService.create({
      userId: booking.userId,
      category: 'booking',
      title: 'Không check-in đúng hạn',
      message: `Lượt đặt ${booking.code} tại ${booking.spaceName} đã bị đánh dấu No-show.`
    });
    marked += 1;
  }
  if (marked) console.log(`[jobs] no-show detection marked ${marked} booking(s)`);
}

async function monitorPresence(ctx) {
  const { collections, notificationService } = ctx;
  const currentTime = now();
  const active = await collections.usageSessions
    .find({ status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING] } })
    .toArray();

  for (const session of active) {
    const space = await collections.spaces.findOne({ _id: session.spaceId });
    const policy = { ...DEFAULT_POLICY, ...(space?.policy || {}) };
    const lastPresence = session.lastPresenceAt ? new Date(session.lastPresenceAt) : new Date(session.checkInTime);
    const awayMinutes = Math.round((currentTime - lastPresence) / 60000);

    if (awayMinutes >= policy.autoCheckoutMinutes) {
      await collections.usageSessions.updateOne(
        { _id: session._id },
        {
          $set: {
            status: SESSION_STATUS.AUTO_CHECKED_OUT,
            checkOutTime: currentTime,
            checkOutMethod: 'AUTO',
            totalAwayMinutes: awayMinutes,
            actualDurationMinutes: Math.round((currentTime - new Date(session.checkInTime)) / 60000),
            endReason: 'AUTO_CHECKOUT_ABSENCE',
            updatedAt: currentTime
          },
          $inc: { version: 1 }
        }
      );
      await collections.releaseCases.insertOne({
        _id: newId(),
        usageId: session._id,
        spaceId: session.spaceId,
        spaceName: session.spaceName,
        userEmail: session.userEmail,
        userName: session.userName,
        awayMinutes,
        thresholdMinutes: policy.autoCheckoutMinutes,
        status: 'STILL_PENDING',
        processingResult: 'STILL_PENDING',
        detectedAt: currentTime,
        notes: 'Tự động phát hiện do vắng mặt quá lâu'
      });
      if (session.bookingId) {
        await collections.bookings.updateOne({ _id: session.bookingId }, { $set: { status: BOOKING_STATUS.COMPLETED, updatedAt: currentTime } });
      }
      await writeAudit({ action: 'AUTO_CHECKOUT', entityName: 'UsageSession', entityId: session._id, changes: { awayMinutes }, level: 'WARNING' });
      await notificationService.create({
        userId: session.userId,
        category: 'presence',
        title: 'Tự động check-out',
        message: `Phiên sử dụng tại ${session.spaceName} đã tự động kết thúc do vắng mặt ${awayMinutes} phút.`
      });
      if (space) {
        const remaining = await collections.usageSessions.countDocuments({
          spaceId: session.spaceId,
          status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING] }
        });
        await collections.spaces.updateOne(
          { _id: session.spaceId },
          { $set: { currentOccupants: remaining > 0 ? space.currentOccupants : 0, status: remaining > 0 ? space.status : 'AVAILABLE' } }
        );
      }
      continue;
    }

    if (awayMinutes >= policy.awayWarningMinutes && session.status === SESSION_STATUS.ACTIVE) {
      await collections.usageSessions.updateOne(
        { _id: session._id },
        { $set: { status: SESSION_STATUS.WARNING, totalAwayMinutes: awayMinutes, updatedAt: currentTime }, $inc: { version: 1 } }
      );
      await notificationService.create({
        userId: session.userId,
        category: 'presence',
        title: 'Cảnh báo vắng mặt',
        message: `Bạn đã vắng mặt ${awayMinutes} phút tại ${session.spaceName}. Vui lòng xác nhận còn sử dụng phòng.`
      });
    }
  }
}

async function occupancySnapshot(ctx) {
  const docs = await ctx.occupancyService.snapshot();
  console.log(`[jobs] occupancy snapshot saved ${docs.length} record(s)`);
}

function startJobs() {
  if (!env.enableJobs) {
    console.log('[jobs] disabled via ENABLE_JOBS=false');
    return () => {};
  }
  const ctx = buildContext();
  const timers = [];

  const run = (fn, label) => () =>
    fn(ctx).catch((error) => console.error(`[jobs] ${label} failed`, error));

  const noShowTimer = setInterval(run(detectNoShows, 'no-show'), env.noShowIntervalMs);
  const presenceTimer = setInterval(run(monitorPresence, 'presence'), Math.min(env.noShowIntervalMs, 60000));
  const snapshotTimer = setInterval(run(occupancySnapshot, 'occupancy'), env.occupancySnapshotIntervalMs);
  timers.push(noShowTimer, presenceTimer, snapshotTimer);

  console.log('[jobs] background scheduler started');
  return () => timers.forEach((timer) => clearInterval(timer));
}

module.exports = { startJobs, detectNoShows, monitorPresence, occupancySnapshot };
