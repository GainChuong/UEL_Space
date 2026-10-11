const { BOOKING_STATUS, SESSION_STATUS } = require('../../common/constants');

class BookingRepository {
  constructor({ bookings, usageSessions }) {
    this.collection = bookings;
    this.usageSessions = usageSessions;
  }

  findAll(filter = {}) {
    return this.collection.find({ deletedAt: null, ...filter }).sort({ createdAt: -1 }).toArray();
  }

  findById(id) {
    return this.collection.findOne({ _id: id, deletedAt: null });
  }

  findByCode(code) {
    return this.collection.findOne({ code, deletedAt: null });
  }

  findActiveByUser(userId) {
    return this.collection
      .find({ userId, deletedAt: null, status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.IN_USE] } })
      .sort({ startTime: 1 })
      .toArray();
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }

  update(id, patch) {
    return this.collection
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: patch, $inc: { version: 1 } }, { returnDocument: 'after' })
      .then((result) => (result && result.value !== undefined ? result.value : result));
  }

  conflicting(spaceId, start, end, ignoreBookingId = null) {
    const filter = {
      spaceId,
      deletedAt: null,
      status: { $in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.IN_USE, BOOKING_STATUS.PENDING] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    };
    if (ignoreBookingId) filter._id = { $ne: ignoreBookingId };
    return this.collection.find(filter).toArray();
  }

  findConflictingForSpaces(spaceIds, start, end) {
    if (!spaceIds.length) return Promise.resolve([]);
    return this.collection
      .find({
        spaceId: { $in: spaceIds },
        deletedAt: null,
        status: { $in: [BOOKING_STATUS.APPROVED, BOOKING_STATUS.IN_USE] },
        startTime: { $lt: end },
        endTime: { $gt: start }
      })
      .toArray();
  }

  countActiveSessions(spaceId) {
    return this.usageSessions.countDocuments({
      spaceId,
      status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING] }
    });
  }

  hasUpcomingApproved(spaceId) {
    return this.collection
      .findOne({ spaceId, deletedAt: null, status: BOOKING_STATUS.APPROVED, endTime: { $gt: new Date() } })
      .then(Boolean);
  }

  countByReadyForNoShow(cutoff) {
    return this.collection
      .find({
        deletedAt: null,
        status: BOOKING_STATUS.APPROVED,
        startTime: { $lte: cutoff }
      })
      .toArray();
  }

  async createIndexes() {
    await this.collection.createIndex({ spaceId: 1, startTime: 1, endTime: 1, status: 1 });
    await this.collection.createIndex({ userId: 1, status: 1 });
    await this.collection.createIndex({ code: 1 }, { unique: true, sparse: true });
  }
}

module.exports = { BookingRepository };
