const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const {
  BOOKING_STATUS,
  SPACE_STATUS,
  ACTIVITY_TYPES,
  DEFAULT_POLICY
} = require('../../common/constants');
const {
  requireObject,
  requireString,
  optionalString,
  requireNumber,
  requireEnum,
  parseDate
} = require('../../common/validate');
const { timeRangeOverlaps, toMinutes, formatTimeSlot, formatDate } = require('../../common/presenters');
const { writeAudit } = require('../../common/audit');

function parseWindow(input) {
  if (input.startTime && input.endTime && !input.usageDate) {
    return { start: parseDate(input.startTime, 'startTime'), end: parseDate(input.endTime, 'endTime') };
  }
  const date = requireString(input.usageDate || input.date, 'usageDate', { min: 8 });
  const startClock = requireString(input.startTime || input.start, 'startTime', { min: 4, max: 5 });
  const endClock = requireString(input.endTime || input.end, 'endTime', { min: 4, max: 5 });
  const start = new Date(`${date}T${startClock}:00`);
  const end = new Date(`${date}T${endClock}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw AppError.badRequest('Thời gian đặt phòng không hợp lệ');
  }
  return { start, end };
}

class BookingService {
  constructor(repository, { spaceRepository, scheduleRepository, notificationService, userRepository, chatLearnedIntents } = {}) {
    this.repository = repository;
    this.spaces = spaceRepository;
    this.schedules = scheduleRepository;
    this.notifications = notificationService;
    this.users = userRepository;
    this.chatLearnedIntents = chatLearnedIntents;
  }

  generateCode() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `BK-${stamp}-${newId().slice(0, 4).toUpperCase()}`;
  }

  async getSpaceOrThrow(spaceId) {
    if (!this.spaces) throw AppError.badRequest('Thiếu cấu hình không gian');
    const space = await this.spaces.findById(spaceId);
    if (!space) throw AppError.badRequest('Không gian không tồn tại', 'SPACE_NOT_FOUND');
    return space;
  }

  async detectConflict(spaceId, start, end, ignoreBookingId = null) {
    const bookingConflicts = await this.repository.conflicting(spaceId, start, end, ignoreBookingId);
    const scheduleConflicts = this.schedules ? await this.schedules.overlapping(spaceId, start, end) : [];
    return [...bookingConflicts, ...scheduleConflicts];
  }

  validatePolicy(space, start, end, expectedUserCount, actor) {
    const policy = { ...DEFAULT_POLICY, ...(space.policy || {}) };
    const durationMinutes = (end - start) / 60000;
    if (durationMinutes <= 0) throw AppError.badRequest('Thời gian kết thúc phải sau thời gian bắt đầu');
    if (durationMinutes > policy.maxUsageMinutes) {
      throw AppError.badRequest(`Thời lượng sử dụng vượt quá giới hạn ${policy.maxUsageMinutes} phút`, 'MAX_DURATION_EXCEEDED');
    }

    const nowDate = now();
    const maxAdvance = new Date(nowDate.getTime() + policy.advanceBookingDays * 24 * 60 * 60 * 1000);
    if (start > maxAdvance) {
      throw AppError.badRequest(`Chỉ được đặt trước tối đa ${policy.advanceBookingDays} ngày`, 'ADVANCE_BOOKING_EXCEEDED');
    }
    if (start < nowDate) {
      throw AppError.badRequest('Không thể đặt phòng trong quá khứ', 'BOOKING_IN_PAST');
    }

    const hours = space.operatingHours || { open: '07:00', close: '21:00' };
    const openMinutes = toMinutes(hours.open) ?? 0;
    const closeMinutes = toMinutes(hours.close) ?? 24 * 60;
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      throw AppError.badRequest(`Thời gian đặt phải nằm trong giờ hoạt động ${hours.open} - ${hours.close}`, 'OUTSIDE_OPERATING_HOURS');
    }

    if (expectedUserCount > space.capacity) {
      throw AppError.badRequest(`Số người dự kiến (${expectedUserCount}) vượt quá sức chứa (${space.capacity})`, 'CAPACITY_EXCEEDED');
    }

    return policy;
  }

  async create(input, actor) {
    requireObject(input);
    if (!actor) throw AppError.unauthorized();

    const space = await this.getSpaceOrThrow(requireString(input.spaceId, 'spaceId'));
    if ([SPACE_STATUS.MAINTENANCE, SPACE_STATUS.CLOSED].includes(space.status)) {
      throw AppError.conflict('Không gian đang bảo trì hoặc tạm đóng, không thể đặt', 'SPACE_UNAVAILABLE');
    }

    const activityType = requireEnum(String(input.activityType || '').toUpperCase(), 'activityType', ACTIVITY_TYPES);
    const purpose = requireString(input.purpose, 'purpose', { min: 3 });
    const expectedUserCount = requireNumber(input.expectedUserCount ?? input.attendees, 'expectedUserCount', { min: 1, integer: true });

    const { start, end } = parseWindow(input);
    const policy = this.validatePolicy(space, start, end, expectedUserCount, actor);

    if (this.repository.findActiveByUser) {
      const active = await this.repository.findActiveByUser(actor.id);
      if (active.length >= policy.maxBookingCount) {
        throw AppError.conflict(`Đã đạt giới hạn ${policy.maxBookingCount} lượt đặt đang hiệu lực`, 'MAX_BOOKING_COUNT_EXCEEDED');
      }
    }

    const conflicts = await this.detectConflict(space._id, start, end);
    if (conflicts.length > 0) {
      throw AppError.conflict('Khung giờ đã có lịch hoặc lượt đặt khác', 'BOOKING_CONFLICT');
    }

    const booking = {
      _id: newId(),
      code: this.generateCode(),
      userId: actor.id,
      userName: actor.name,
      userEmail: actor.email,
      organizationId: input.organizationId || actor.organizationId || null,
      organizationName: input.organizationName || actor.organization || '',
      spaceId: space._id,
      spaceName: space.name,
      buildingName: space.buildingName || '',
      activityType,
      purpose,
      usageDate: start.toISOString().slice(0, 10),
      startTime: start,
      endTime: end,
      expectedUserCount,
      equipmentRequest: Array.isArray(input.equipmentRequest) ? input.equipmentRequest : [],
      attachment: optionalString(input.attachment, 'attachment') || '',
      status: BOOKING_STATUS.PENDING,
      submittedAt: now(),
      approvedById: null,
      approvedAt: null,
      rejectionReason: '',
      note: optionalString(input.note, 'note') || '',
      cancelReason: '',
      cancelledAt: null,
      hasConflictWarning: false,
      version: 1,
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    };

    await this.repository.insert(booking);
    await writeAudit({ actorId: actor.id, action: 'CREATE', entityName: 'Booking', entityId: booking._id, changes: { code: booking.code, spaceId: space._id } });
    await this.notify(actor.id, 'booking', 'Đã gửi yêu cầu đặt phòng', `Yêu cầu ${booking.code} cho ${space.name} đang chờ duyệt.`, '/booking-history', 'CUSTOMER');

    // Thông báo cho Chủ Gian Hàng (Seller)
    const sellerId = space.sellerId || space.seller?.id || null;
    await this.notify(sellerId, 'booking', 'Có đơn đặt phòng mới cần chốt!', `Khách hàng vừa đặt không gian "${space.name}" (Mã: ${booking.code}, thời gian: ${booking.timeSlot || booking.date}).`, '/seller-portal', 'SELLER');

    // Thông báo cho Admin
    await this.notify(null, 'booking', 'Giao dịch đặt chỗ mới trên sàn', `Giao dịch ${booking.code} cho "${space.name}" vừa được khởi tạo.`, '/admin', 'ADMIN');

    // VÒNG LẶP HỌC THÍCH ỨNG: Tự động thưởng điểm uy tín cho gợi ý Chatbot nếu đặt phòng thành công
    if (this.chatLearnedIntents) {
      try {
        const { geminiService } = require('../chatbot/gemini.service');
        geminiService.applyFeedback({
          learnedIntents: this.chatLearnedIntents,
          signature: input.chatSignature || null,
          spaceId: space._id || space.code,
          action: 'BOOK_SUCCESS'
        }).catch(() => {});
      } catch (e) {}
    }

    return this.decorate(booking);
  }

  decorate(booking) {
    return {
      ...booking,
      id: booking._id,
      bookerName: booking.userName || booking.bookerName || 'Nguyễn Trần Kim Giang',
      bookerEmail: booking.userEmail || booking.bookerEmail || 'giangnntk24411@st.uel.edu.vn',
      date: formatDate(booking.startTime),
      timeSlot: formatTimeSlot(booking.startTime, booking.endTime),
      statusText: booking.status
    };
  }

  async listForUser(actor, filter = {}) {
    const query = { userId: actor.id };
    if (filter.status) query.status = filter.status;
    const items = await this.repository.findAll(query);
    return items.map((b) => this.decorate(b));
  }

  async listForManager(filter = {}) {
    const query = {};
    if (filter.spaceId) query.spaceId = filter.spaceId;
    if (filter.status) query.status = filter.status;
    const items = await this.repository.findAll(query);
    return items.map((b) => this.decorate(b));
  }

  async detail(id, actor) {
    const booking = await this.repository.findById(id);
    if (!booking) throw AppError.notFound('Không tìm thấy yêu cầu đặt phòng');
    const isOwner = actor && booking.userId === actor.id;
    const isManager = actor && ['ADMIN', 'SPACE_MANAGER'].includes(actor.role);
    if (!isOwner && !isManager) throw AppError.forbidden('Không có quyền xem yêu cầu này');
    return this.decorate(booking);
  }

  async cancel(id, reason, actor) {
    const booking = await this.repository.findById(id);
    if (!booking) throw AppError.notFound('Không tìm thấy yêu cầu đặt phòng');
    if (booking.userId !== actor.id && !['ADMIN', 'SPACE_MANAGER'].includes(actor.role)) {
      throw AppError.forbidden('Không có quyền hủy yêu cầu này');
    }
    if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED].includes(booking.status)) {
      throw AppError.conflict('Chỉ có thể hủy yêu cầu đang chờ hoặc đã duyệt', 'INVALID_STATE');
    }
    const minutesUntilStart = (new Date(booking.startTime) - now()) / 60000;
    if (minutesUntilStart < 0) {
      throw AppError.conflict('Không thể hủy sau khi thời gian bắt đầu đã qua', 'CANCEL_WINDOW_CLOSED');
    }
    const updated = await this.repository.update(id, {
      status: BOOKING_STATUS.CANCELLED,
      cancelReason: reason || '',
      cancelledAt: now(),
      updatedAt: now()
    });
    await writeAudit({ actorId: actor.id, action: 'CANCEL', entityName: 'Booking', entityId: id, changes: { reason } });
    await this.notify(booking.userId, 'booking', 'Yêu cầu đặt phòng đã hủy', `Yêu cầu ${booking.code} đã được hủy.`, '/booking-history', 'CUSTOMER');
    await this.notify(null, 'booking', 'Khách hàng đã hủy đơn', `Khách vừa hủy đơn đặt phòng ${booking.code} cho "${booking.spaceName}".`, '/seller-portal', 'SELLER');
    return this.decorate(updated);
  }

  async approve(id, actor, note = '') {
    const booking = await this.repository.findById(id);
    if (!booking) throw AppError.notFound('Không tìm thấy yêu cầu đặt phòng');
    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw AppError.conflict('Chỉ có thể duyệt yêu cầu đang chờ', 'INVALID_STATE');
    }
    const conflicts = await this.detectConflict(booking.spaceId, new Date(booking.startTime), new Date(booking.endTime), id);
    if (conflicts.length > 0) {
      throw AppError.conflict('Khung giờ đã phát sinh xung đột, không thể duyệt', 'BOOKING_CONFLICT');
    }
    const updated = await this.repository.update(id, {
      status: BOOKING_STATUS.APPROVED,
      approvedById: actor.id,
      approvedAt: now(),
      note: note || booking.note,
      updatedAt: now()
    });
    await writeAudit({ actorId: actor.id, action: 'APPROVE', entityName: 'Booking', entityId: id });
    await this.notify(booking.userId, 'success', 'Yêu cầu đặt phòng được duyệt!', `Yêu cầu ${booking.code} cho ${booking.spaceName} đã được duyệt. Mã QR check-in đã sẵn sàng.`, '/booking-history', 'CUSTOMER');
    return this.decorate(updated);
  }

  async reject(id, actor, reason) {
    const actorReason = requireString(reason, 'reason', { min: 3 });
    const booking = await this.repository.findById(id);
    if (!booking) throw AppError.notFound('Không tìm thấy yêu cầu đặt phòng');
    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw AppError.conflict('Chỉ có thể từ chối yêu cầu đang chờ', 'INVALID_STATE');
    }
    const updated = await this.repository.update(id, {
      status: BOOKING_STATUS.REJECTED,
      approvedById: actor.id,
      approvedAt: now(),
      rejectionReason: actorReason,
      updatedAt: now()
    });
    await writeAudit({ actorId: actor.id, action: 'REJECT', entityName: 'Booking', entityId: id, changes: { reason: actorReason }, level: 'WARNING' });
    await this.notify(booking.userId, 'alert', 'Yêu cầu đặt phòng bị từ chối', `Yêu cầu ${booking.code} bị từ chối: ${actorReason}. Tiền cọc được bảo lưu.`, '/booking-history', 'CUSTOMER');
    return this.decorate(updated);
  }

  async qrCheckIn(rawCode, actor = { id: 'USER-ADMIN-01', email: 'admin@uel.edu.vn', name: 'Quản trị viên Hệ thống UEL' }) {
    const cleanCode = String(rawCode || '').trim();
    if (!cleanCode) throw AppError.badRequest('Thiếu mã QR hoặc mã đặt chỗ');
    const regex = new RegExp(`^${cleanCode}$`, 'i');

    const booking = await this.repository.findOne({
      $or: [
        { _id: cleanCode },
        { code: regex },
        { checkInCode: cleanCode }
      ]
    });

    if (!booking) {
      throw AppError.notFound('Không tìm thấy lượt đặt chỗ khớp với mã QR', 'BOOKING_NOT_FOUND');
    }

    if (booking.status !== BOOKING_STATUS.APPROVED) {
      throw AppError.conflict(
        `Chỉ lượt đặt ở trạng thái Sắp tới (đã duyệt) mới được quét QR check-in. Trạng thái hiện tại: ${booking.status}`,
        'INVALID_BOOKING_STATE'
      );
    }

    const currentTime = now();
    const updated = await this.repository.update(booking._id, {
      status: BOOKING_STATUS.IN_USE,
      actualCheckInAt: currentTime,
      checkInVerifiedBy: actor.email || 'admin@uel.edu.vn',
      updatedAt: currentTime
    });
    const result = updated || {
      ...booking,
      status: BOOKING_STATUS.IN_USE,
      actualCheckInAt: currentTime,
      checkInVerifiedBy: actor.email || 'admin@uel.edu.vn',
      updatedAt: currentTime
    };

    if (this.spaces && result.spaceId) {
      try {
        await this.spaces.update(result.spaceId, {
          status: SPACE_STATUS.OCCUPIED,
          updatedAt: currentTime
        });
      } catch (errSpace) {
        console.warn('Update space status warning:', errSpace);
      }
    }

    await writeAudit({
      actorId: actor.id || 'USER-ADMIN-01',
      action: 'QR_CHECKIN',
      entityName: 'Booking',
      entityId: result._id,
      changes: { code: result.code, spaceId: result.spaceId, userEmail: result.userEmail }
    });

    return {
      success: true,
      message: `Xác thực Check-in THÀNH CÔNG cho ${result.userName}!`,
      booking: this.decorate(result)
    };
  }

  async notify(userId, category, title, message) {
    if (!this.notifications) return;
    await this.notifications.create({ userId, category, title, message });
  }
}

module.exports = { BookingService };
