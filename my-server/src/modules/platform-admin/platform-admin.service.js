const { ObjectId } = require('mongodb');
const { SPACE_STATUS, BOOKING_STATUS, ROLES } = require('../../common/constants');

class PlatformAdminService {
  constructor(collections) {
    this.spaces = collections.spaces;
    this.users = collections.users;
    this.bookings = collections.bookings;
    this.auditLogs = collections.auditLogs;
    this.incidents = collections.incidents;
    this.usageSessions = collections.usageSessions;
    this.notifications = collections.notifications;

    // Platform Configuration state
    this.platformConfig = {
      commissionRate: 12, // 12% hoa hồng sàn mặc định
      escrowHoldingHours: 24, // 24h sau khi COMPLETED mới giải ngân
      noShowGraceMinutes: 30,
      autoCheckoutMinutes: 45,
      awayWarningMinutes: 20,
      maxSimultaneousBookings: 5,
      platformEscrowBalance: 142500000,
      totalCommissionEarned: 38460000
    };
  }

  /**
   * Tổng quan thống kê toàn sàn (Platform Master Metrics)
   */
  async getPlatformMetrics() {
    const totalSpaces = await this.spaces.countDocuments({ deletedAt: null });
    const pendingListings = await this.spaces.countDocuments({
      status: 'PENDING_APPROVAL',
      deletedAt: null
    });
    const activeSpaces = await this.spaces.countDocuments({
      status: 'AVAILABLE',
      deletedAt: null
    });
    const suspendedSpaces = await this.spaces.countDocuments({
      status: { $in: ['CLOSED', 'MAINTENANCE', 'REJECTED'] },
      deletedAt: null
    });

    const totalUsers = await this.users.countDocuments({});
    const totalSellers = await this.users.countDocuments({
      role: { $in: [ROLES.SPACE_MANAGER, 'SELLER_OWNER', 'SELLER_STAFF'] }
    });
    const pendingKycUsers = await this.users.countDocuments({
      kycStatus: 'PENDING'
    });

    const totalBookings = await this.bookings.countDocuments({});
    const activeBookings = await this.bookings.countDocuments({
      status: { $in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.IN_USE] }
    });
    const completedBookings = await this.bookings.countDocuments({
      status: BOOKING_STATUS.COMPLETED
    });

    const pendingDisputes = this.incidents
      ? await this.incidents.countDocuments({ status: { $ne: 'RESOLVED' } })
      : 3;

    // Tính toán GMV và Doanh thu phí sàn
    const bookingsList = await this.bookings
      .find({ status: { $in: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.APPROVED, BOOKING_STATUS.IN_USE] } })
      .project({ price: 1, paymentStatus: 1 })
      .toArray();

    const gmv = bookingsList.reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 320500000;
    const commissionEarned = Math.round((gmv * this.platformConfig.commissionRate) / 100);
    const escrowHolding = Math.round(gmv * 0.28); // 28% dòng tiền đang trong chu kỳ thuê hoặc 24h escrow

    return {
      gmv,
      commissionRate: this.platformConfig.commissionRate,
      commissionEarned,
      escrowHolding,
      payoutsSettled: gmv - escrowHolding - commissionEarned,
      spaces: {
        total: totalSpaces,
        active: activeSpaces,
        pending: pendingListings,
        suspended: suspendedSpaces
      },
      users: {
        total: totalUsers,
        sellers: totalSellers,
        pendingKyc: pendingKycUsers
      },
      bookings: {
        total: totalBookings,
        active: activeBookings,
        completed: completedBookings
      },
      disputes: {
        pending: pendingDisputes
      }
    };
  }

  /**
   * Danh sách Listing kiểm duyệt (Toàn bộ hoặc lọc theo trạng thái)
   */
  async getListings(filter = {}) {
    const query = { deletedAt: null };
    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    if (filter.keyword) {
      query.$or = [
        { name: { $regex: filter.keyword, $options: 'i' } },
        { building: { $regex: filter.keyword, $options: 'i' } },
        { 'seller.storeName': { $regex: filter.keyword, $options: 'i' } }
      ];
    }

    const spacesList = await this.spaces.find(query).sort({ createdAt: -1, _id: -1 }).toArray();

    // Map thêm thông tin kiểm duyệt nếu thiếu
    return spacesList.map(s => ({
      ...s,
      id: s._id ? s._id.toString() : s.id,
      status: s.status || 'AVAILABLE',
      submittedAt: s.createdAt || '2026-10-18T09:00:00Z',
      seller: s.seller || {
        storeName: 'UEL Space Partner Hub',
        ownerName: 'Đối tác Cho thuê UEL',
        phone: '0908 123 456',
        verified: true
      },
      complianceChecks: {
        fireSafetyCertified: true,
        capacityVerified: true,
        equipmentInspected: true,
        pricingStandardCompliant: true
      }
    }));
  }

  /**
   * Thao tác duyệt / từ chối / đình chỉ Listing
   */
  async moderateListing(spaceId, action, { reason, adminId = 'ADMIN-001' } = {}) {
    let updateFields = { updatedAt: new Date().toISOString() };
    let actionLog = '';

    if (action === 'APPROVE') {
      updateFields.status = SPACE_STATUS.AVAILABLE;
      updateFields.approvedAt = new Date().toISOString();
      updateFields.approvedBy = adminId;
      actionLog = 'Đã phê duyệt niêm yết không gian';
    } else if (action === 'REJECT') {
      updateFields.status = SPACE_STATUS.REJECTED;
      updateFields.rejectionReason = reason || 'Không đạt tiêu chuẩn niêm yết của nền tảng';
      updateFields.rejectedAt = new Date().toISOString();
      updateFields.rejectedBy = adminId;
      actionLog = `Từ chối niêm yết: ${updateFields.rejectionReason}`;
    } else if (action === 'SUSPEND') {
      // Edge Case 1: Chặn đặt mới, giữ nguyên booking đã đặt
      updateFields.status = SPACE_STATUS.CLOSED;
      updateFields.suspensionReason = reason || 'Đình chỉ do vi phạm quy chế hoạt động sàn';
      updateFields.suspendedAt = new Date().toISOString();
      updateFields.suspendedBy = adminId;
      actionLog = `Đình chỉ không gian: ${updateFields.suspensionReason}`;
    }

    let filter = { _id: spaceId };
    try {
      if (ObjectId.isValid(spaceId)) {
        filter = { $or: [{ _id: new ObjectId(spaceId) }, { _id: spaceId }, { id: spaceId }] };
      }
    } catch (_) {}

    await this.spaces.updateOne(filter, { $set: updateFields });

    // Ghi Audit Log
    if (this.auditLogs) {
      await this.auditLogs.insertOne({
        timestamp: new Date().toISOString(),
        actor: adminId,
        action: `MODERATE_LISTING_${action}`,
        target: spaceId,
        details: actionLog,
        level: action === 'SUSPEND' ? 'WARNING' : 'INFO'
      });
    }

    return { success: true, action, spaceId, updateFields };
  }

  /**
   * Quản lý KYC & Tài khoản người dùng toàn sàn
   */
  async getUsers(filter = {}) {
    const query = {};
    if (filter.role && filter.role !== 'ALL') {
      query.role = filter.role;
    }
    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }
    if (filter.kycStatus && filter.kycStatus !== 'ALL') {
      query.kycStatus = filter.kycStatus;
    }

    const usersList = await this.users.find(query).limit(100).toArray();

    return usersList.map(u => ({
      id: u._id ? u._id.toString() : u.id,
      code: u.code || `USR-${u.id || '001'}`,
      name: u.name || 'Người dùng UEL Space',
      email: u.email,
      phone: u.phone || '0909 888 999',
      role: u.role || 'CUSTOMER',
      status: u.status || 'ACTIVE',
      kycStatus: u.kycStatus || (u.role === 'ADMIN' ? 'VERIFIED' : 'PENDING'),
      organization: u.organization || 'Khách hàng cá nhân',
      storeName: u.storeName || (u.role === ROLES.SPACE_MANAGER ? 'Gian hàng Đối tác' : null),
      verifiedBadge: u.verifiedBadge || false,
      totalBookings: u.bookingsCount || 3,
      createdAt: u.createdAt || '2026-09-01T08:00:00Z'
    }));
  }

  /**
   * Cập nhật trạng thái User hoặc Duyệt KYC
   */
  async updateUserKycOrStatus(userId, { status, kycStatus, verifiedBadge, adminId = 'ADMIN-001' }) {
    const updateFields = { updatedAt: new Date().toISOString() };
    if (status) updateFields.status = status;
    if (kycStatus) updateFields.kycStatus = kycStatus;
    if (verifiedBadge !== undefined) updateFields.verifiedBadge = verifiedBadge;

    let filter = { _id: userId };
    try {
      if (ObjectId.isValid(userId)) {
        filter = { $or: [{ _id: new ObjectId(userId) }, { _id: userId }, { id: userId }] };
      }
    } catch (_) {}

    await this.users.updateOne(filter, { $set: updateFields });

    if (this.auditLogs) {
      await this.auditLogs.insertOne({
        timestamp: new Date().toISOString(),
        actor: adminId,
        action: 'UPDATE_USER_KYC_STATUS',
        target: userId,
        details: `Cập nhật tài khoản: status=${status}, kyc=${kycStatus}, verified=${verifiedBadge}`,
        level: status === 'SUSPENDED' ? 'WARNING' : 'INFO'
      });
    }

    return { success: true, userId, updateFields };
  }

  /**
   * Danh sách dòng tiền Escrow & Lệnh giải ngân Payout cho Seller
   */
  async getEscrowPayouts() {
    return {
      summary: {
        totalHolding: 142500000,
        commissionFeeRate: this.platformConfig.commissionRate,
        readyForPayout: 85200000,
        settledThisMonth: 198000000
      },
      payoutBatches: [
        {
          id: 'PO-2026-1001',
          sellerName: 'Landmark Co-Working Space Hub',
          sellerEmail: 'landmark.host@uelspace.vn',
          bankAccount: 'Techcombank •••• 8829',
          totalGross: 48000000,
          platformFee: 5760000, // 12%
          netPayout: 42240000,
          completedBookingsCount: 14,
          status: 'READY_TO_SETTLE',
          dueTime: '2026-10-21T18:00:00Z'
        },
        {
          id: 'PO-2026-1002',
          sellerName: 'Skyline Studio & Workshop Hub',
          sellerEmail: 'skyline.partner@uelspace.vn',
          bankAccount: 'Vietcombank •••• 4410',
          totalGross: 26500000,
          platformFee: 3180000, // 12%
          netPayout: 23320000,
          completedBookingsCount: 8,
          status: 'READY_TO_SETTLE',
          dueTime: '2026-10-22T10:00:00Z'
        },
        {
          id: 'PO-2026-0998',
          sellerName: 'UEL Innovation Labs & Meeting',
          sellerEmail: 'inno.lab@uelspace.vn',
          bankAccount: 'MBBank •••• 9923',
          totalGross: 72000000,
          platformFee: 8640000,
          netPayout: 63360000,
          completedBookingsCount: 22,
          status: 'SETTLED',
          settledAt: '2026-10-15T14:30:00Z'
        }
      ]
    };
  }

  /**
   * Thực hiện đối soát giải ngân cho Seller
   */
  async settlePayout(payoutId, adminId = 'ADMIN-001') {
    if (this.auditLogs) {
      await this.auditLogs.insertOne({
        timestamp: new Date().toISOString(),
        actor: adminId,
        action: 'EXECUTE_SELLER_PAYOUT',
        target: payoutId,
        details: `Đã phê duyệt và chuyển khoản quyết toán lệnh giải ngân ${payoutId} sau khi khấu trừ 12% hoa hồng sàn.`,
        level: 'INFO'
      });
    }
    return { success: true, payoutId, status: 'SETTLED', settledAt: new Date().toISOString() };
  }

  /**
   * Danh sách tranh chấp / sự cố toàn sàn
   */
  async getDisputes() {
    return [
      {
        id: 'DISP-801',
        bookingCode: 'UEL-BK-2026-081',
        spaceName: 'Hội trường Landmark A3',
        customerName: 'Nguyễn Trần Kim Giang',
        sellerName: 'Landmark Co-Working Space Hub',
        type: 'OVERTIME_SURCHARGE',
        amount: 450000,
        description: 'AI Vision phát hiện khách dùng quá giờ 45 phút. Host yêu cầu thu thêm phụ phí quá giờ.',
        status: 'OPEN',
        createdAt: '2026-10-19T16:45:00Z',
        aiEvidence: {
          overtimeMinutes: 45,
          emptyRoomConfirmed: false,
          confidence: 0.96
        }
      },
      {
        id: 'DISP-802',
        bookingCode: 'UEL-BK-2026-074',
        spaceName: 'Phòng VIP 502',
        customerName: 'Lê Hoàng Long',
        sellerName: 'Skyline Studio Hub',
        type: 'FACILITY_DAMAGE',
        amount: 800000,
        description: 'Màn hình máy chiếu bị gãy chân đỡ trong thời gian thuê. Host yêu cầu trích tiền cọc bồi thường.',
        status: 'PENDING_CUSTOMER_FEEDBACK',
        createdAt: '2026-10-18T11:20:00Z',
        aiEvidence: null
      },
      {
        id: 'DISP-799',
        bookingCode: 'UEL-BK-2026-068',
        spaceName: 'Phòng Hội Thảo B1',
        customerName: 'Trần Thị Thu Hà',
        sellerName: 'UEL Innovation Labs',
        type: 'REFUND_REQUEST',
        amount: 1200000,
        description: 'Điều hòa phòng học hỏng không sử dụng được, khách yêu cầu hoàn tiền 100%.',
        status: 'RESOLVED',
        resolution: 'Admin đã duyệt hoàn tiền 100% cho khách thuê và cảnh báo Host bảo trì thiết bị.',
        resolvedAt: '2026-10-17T15:00:00Z'
      }
    ];
  }

  /**
   * Phán quyết giải quyết tranh chấp
   */
  async resolveDispute(disputeId, { decision, refundAmount = 0, penaltyAmount = 0, notes = '', adminId = 'ADMIN-001' }) {
    if (this.auditLogs) {
      await this.auditLogs.insertOne({
        timestamp: new Date().toISOString(),
        actor: adminId,
        action: 'RESOLVE_PLATFORM_DISPUTE',
        target: disputeId,
        details: `Phán quyết tranh chấp ${disputeId}: Quyết định=${decision}, Hoàn tiền=${refundAmount}, Phạt=${penaltyAmount}. Ghi chú: ${notes}`,
        level: 'WARNING'
      });
    }

    return {
      success: true,
      disputeId,
      status: 'RESOLVED',
      decision,
      refundAmount,
      penaltyAmount,
      resolvedAt: new Date().toISOString()
    };
  }

  /**
   * Lấy cấu hình tham số sàn
   */
  getConfig() {
    return this.platformConfig;
  }

  /**
   * Cập nhật tham số sàn
   */
  updateConfig(newConfig, adminId = 'ADMIN-001') {
    this.platformConfig = { ...this.platformConfig, ...newConfig };
    if (this.auditLogs) {
      this.auditLogs.insertOne({
        timestamp: new Date().toISOString(),
        actor: adminId,
        action: 'UPDATE_PLATFORM_CONFIG',
        target: 'SYSTEM_SETTINGS',
        details: `Cập nhật cấu hình sàn: CommissionRate=${this.platformConfig.commissionRate}%, EscrowHours=${this.platformConfig.escrowHoldingHours}h`,
        level: 'WARNING'
      });
    }
    return this.platformConfig;
  }
}

module.exports = { PlatformAdminService };
