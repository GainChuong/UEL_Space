const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const {
  BOOKING_STATUS,
  SESSION_STATUS,
  SPACE_STATUS,
  DEFAULT_POLICY
} = require('../../common/constants');
const { requireString } = require('../../common/validate');
const { writeAudit } = require('../../common/audit');

class UsageService {
  constructor(repository, { bookingRepository, spaceRepository, notificationService, spaceStatusSync } = {}) {
    this.repository = repository;
    this.bookings = bookingRepository;
    this.spaces = spaceRepository;
    this.notifications = notificationService;
    this.spaceStatusSync = spaceStatusSync;
  }

  async recomputeOccupancy(spaceId) {
    if (!this.spaces) return;
    const sessions = (await this.repository.findActiveSessions()).filter((s) => s.spaceId === spaceId);
    const current = sessions.reduce((sum, s) => sum + (s.expectedUserCount || 1), 0);
    await this.spaces.update(spaceId, { currentOccupants: current, updatedAt: now() });
    if (this.spaceStatusSync) await this.spaceStatusSync(spaceId);
  }

  async checkIn(bookingId, actor, method = 'QR') {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) throw AppError.notFound('Không tìm thấy lượt đặt phòng');
    if (booking.userId !== actor.id && !['ADMIN', 'SPACE_MANAGER'].includes(actor.role)) {
      throw AppError.forbidden('Không có quyền check-in cho lượt đặt này');
    }
    if (booking.status !== BOOKING_STATUS.APPROVED) {
      throw AppError.conflict('Chỉ có thể check-in cho lượt đặt đã được duyệt', 'INVALID_BOOKING_STATE');
    }
    const existing = await this.repository.findActiveSessionByBooking(bookingId);
    if (existing) throw AppError.conflict('Lượt đặt này đã check-in', 'ALREADY_CHECKED_IN');

    const space = await this.spaces.findById(booking.spaceId);
    if (!space) throw AppError.notFound('Không gian không tồn tại');
    if ([SPACE_STATUS.MAINTENANCE, SPACE_STATUS.CLOSED].includes(space.status)) {
      throw AppError.conflict('Không gian đang bị khóa', 'SPACE_LOCKED');
    }

    const policy = { ...DEFAULT_POLICY, ...(space.policy || {}) };
    const start = new Date(booking.startTime);
    const earliest = new Date(start.getTime() - policy.checkInWindowMinutes * 60000);
    const latest = new Date(start.getTime() + policy.noShowGraceMinutes * 60000);
    const currentTime = now();
    if (currentTime < earliest || currentTime > latest) {
      throw AppError.badRequest(
        `Chỉ được check-in trong khoảng ${policy.checkInWindowMinutes} phút trước đến ${policy.noShowGraceMinutes} phút sau giờ bắt đầu`,
        'OUTSIDE_CHECKIN_WINDOW'
      );
    }

    const session = {
      _id: newId(),
      bookingId,
      userId: booking.userId,
      userName: booking.userName,
      userEmail: booking.userEmail,
      spaceId: booking.spaceId,
      spaceName: booking.spaceName,
      expectedUserCount: booking.expectedUserCount,
      checkInTime: currentTime,
      checkOutTime: null,
      checkInMethod: method,
      checkOutMethod: null,
      reservedDurationMinutes: Math.round((new Date(booking.endTime) - start) / 60000),
      actualDurationMinutes: null,
      status: SESSION_STATUS.ACTIVE,
      lastPresenceAt: currentTime,
      totalAwayMinutes: 0,
      endReason: '',
      version: 1,
      createdAt: currentTime,
      updatedAt: currentTime
    };
    await this.repository.insertSession(session);
    await this.repository.insertPresence({
      _id: newId(),
      usageId: session._id,
      userId: booking.userId,
      spaceId: booking.spaceId,
      recordedTime: currentTime,
      presenceStatus: 'PRESENT',
      dataSource: method
    });
    await this.bookings.update(bookingId, { status: BOOKING_STATUS.IN_USE, updatedAt: currentTime });
    await this.recomputeOccupancy(booking.spaceId);
    await writeAudit({ actorId: actor.id, action: 'CHECK_IN', entityName: 'UsageSession', entityId: session._id, changes: { bookingId, method } });
    return session;
  }

  async checkOut(sessionId, actor, method = 'QR') {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) throw AppError.notFound('Không tìm thấy phiên sử dụng');
    if (session.userId !== actor.id && !['ADMIN', 'SPACE_MANAGER'].includes(actor.role)) {
      throw AppError.forbidden('Không có quyền check-out phiên này');
    }
    if (![SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING].includes(session.status)) {
      throw AppError.conflict('Phiên sử dụng không ở trạng thái có thể check-out', 'INVALID_SESSION_STATE');
    }
    const currentTime = now();
    const updated = await this.repository.updateSession(sessionId, {
      status: SESSION_STATUS.COMPLETED,
      checkOutTime: currentTime,
      checkOutMethod: method,
      actualDurationMinutes: Math.round((currentTime - new Date(session.checkInTime)) / 60000),
      updatedAt: currentTime
    });
    await this.repository.insertPresence({
      _id: newId(),
      usageId: sessionId,
      userId: session.userId,
      spaceId: session.spaceId,
      recordedTime: currentTime,
      presenceStatus: 'CHECKED_OUT',
      dataSource: method
    });
    if (session.bookingId) {
      await this.bookings.update(session.bookingId, { status: BOOKING_STATUS.COMPLETED, updatedAt: currentTime });
    }
    await this.recomputeOccupancy(session.spaceId);
    await writeAudit({ actorId: actor.id, action: 'CHECK_OUT', entityName: 'UsageSession', entityId: sessionId, changes: { method } });
    return updated;
  }

  async confirmPresence(sessionId, actor) {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) throw AppError.notFound('Không tìm thấy phiên sử dụng');
    if (session.userId !== actor.id) throw AppError.forbidden('Không có quyền xác nhận hiện diện cho phiên này');
    if (![SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING].includes(session.status)) {
      throw AppError.conflict('Phiên sử dụng đã kết thúc', 'INVALID_SESSION_STATE');
    }
    const currentTime = now();
    const updated = await this.repository.updateSession(sessionId, {
      lastPresenceAt: currentTime,
      status: SESSION_STATUS.ACTIVE,
      updatedAt: currentTime
    });
    await this.repository.insertPresence({
      _id: newId(),
      usageId: sessionId,
      userId: actor.id,
      spaceId: session.spaceId,
      recordedTime: currentTime,
      presenceStatus: 'PRESENT',
      dataSource: 'SELF_CONFIRM'
    });
    return updated;
  }

  listMine(actor) {
    return this.repository.findSessionsForUser(actor.id);
  }

  listActive() {
    return this.repository.findActiveSessions();
  }

  listBySpace(spaceId) {
    return this.repository.findSessionsBySpace(spaceId);
  }

  async detail(sessionId, actor) {
    const session = await this.repository.findSessionById(sessionId);
    if (!session) throw AppError.notFound('Không tìm thấy phiên sử dụng');
    if (session.userId !== actor.id && !['ADMIN', 'SPACE_MANAGER'].includes(actor.role)) {
      throw AppError.forbidden('Không có quyền xem phiên này');
    }
    return session;
  }

  listReleaseCases(filter = {}) {
    return this.repository.findReleaseCases(filter);
  }

  async resolveReleaseCase(caseId, { processingResult, staffUserId, description, foundItem } = {}) {
    const releaseCase = await this.repository.findReleaseCaseById(caseId);
    if (!releaseCase) throw AppError.notFound('Không tìm thấy hồ sơ giải phóng phòng');
    const updated = await this.repository.updateReleaseCase(caseId, {
      processingResult: processingResult || releaseCase.processingResult,
      staffUserId: staffUserId || releaseCase.staffUserId,
      verificationTime: now(),
      description: description || releaseCase.description,
      foundItem: foundItem ?? releaseCase.foundItem,
      status: processingResult && processingResult !== 'STILL_PENDING' ? 'RESOLVED' : 'PENDING'
    });
    await writeAudit({ actorId: staffUserId, action: 'RESOLVE_RELEASE_CASE', entityName: 'ReleaseCase', entityId: caseId, changes: { processingResult } });
    return updated;
  }

  async notify(userId, category, title, message) {
    if (!this.notifications) return;
    await this.notifications.create({ userId, category, title, message });
  }
}

module.exports = { UsageService };
