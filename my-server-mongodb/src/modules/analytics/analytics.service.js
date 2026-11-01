const { BOOKING_STATUS, SESSION_STATUS } = require('../../common/constants');

class AnalyticsService {
  constructor({ bookings, usageSessions, occupancyRecords, spaces }) {
    this.bookings = bookings;
    this.usage = usageSessions;
    this.occupancy = occupancyRecords;
    this.spaces = spaces;
  }

  async overview() {
    const [spaceList, totalBookings, activeSessions, pending] = await Promise.all([
      this.spaces.find({ deletedAt: null }).toArray(),
      this.bookings.countDocuments({ deletedAt: null }),
      this.usage.countDocuments({ status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING] } }),
      this.bookings.countDocuments({ status: BOOKING_STATUS.PENDING, deletedAt: null })
    ]);
    const byStatus = {};
    for (const space of spaceList) {
      byStatus[space.status] = (byStatus[space.status] || 0) + 1;
    }
    return {
      totalSpaces: spaceList.length,
      spacesByStatus: byStatus,
      totalBookings,
      pendingBookings: pending,
      activeSessions
    };
  }

  async utilization({ from, to } = {}) {
    const match = { 'booking.startTime': {} };
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (!from && !to) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter.$gte = since;
    }
    match.startTime = dateFilter;

    const rows = await this.usage
      .aggregate([
        { $match: Object.keys(dateFilter).length ? { checkInTime: dateFilter, status: { $ne: SESSION_STATUS.ACTIVE } } : {} },
        {
          $group: {
            _id: '$spaceId',
            sessions: { $sum: 1 },
            usageMinutes: { $sum: { $ifNull: ['$actualDurationMinutes', 0] } }
          }
        },
        { $sort: { usageMinutes: -1 } }
      ])
      .toArray();

    const spaceList = await this.spaces.find({ deletedAt: null }).toArray();
    const nameById = new Map(spaceList.map((s) => [s._id, s.name]));
    return rows.map((row) => ({
      spaceId: row._id,
      spaceName: nameById.get(row._id) || 'Không xác định',
      sessions: row.sessions,
      usageMinutes: row.usageMinutes,
      usageHours: Math.round((row.usageMinutes / 60) * 10) / 10
    }));
  }

  async peakHours() {
    const rows = await this.occupancy
      .aggregate([
        {
          $group: {
            _id: { $hour: '$recordedTime' },
            avgUsers: { $avg: '$userCount' },
            samples: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();
    return rows.map((row) => ({ hour: row._id, avgUsers: Math.round(row.avgUsers * 10) / 10, samples: row.samples }));
  }

  async lowUsage() {
    const usageCounts = await this.usage
      .aggregate([{ $group: { _id: '$spaceId', count: { $sum: 1 } } }])
      .toArray();
    const countMap = new Map(usageCounts.map((r) => [r._id, r.count]));
    const spaceList = await this.spaces.find({ deletedAt: null }).toArray();
    return spaceList
      .map((space) => ({ spaceId: space._id, spaceName: space.name, capacity: space.capacity, usageCount: countMap.get(space._id) || 0 }))
      .sort((a, b) => a.usageCount - b.usageCount)
      .slice(0, 10);
  }

  async purposeAnalysis() {
    const rows = await this.bookings
      .aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$purpose', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();
    return rows.map((row) => ({ purpose: row._id || 'Khác', count: row.count }));
  }

  async equipmentDemand() {
    const rows = await this.bookings
      .aggregate([
        { $match: { deletedAt: null } },
        { $unwind: { path: '$equipmentRequest', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$equipmentRequest.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      .toArray();
    return rows.map((row) => ({ equipment: row._id || 'Khác', count: row.count }));
  }
}

module.exports = { AnalyticsService };
