const { SESSION_STATUS } = require('../../common/constants');

class UsageRepository {
  constructor({ usageSessions, presenceRecords, releaseCases }) {
    this.sessions = usageSessions;
    this.presence = presenceRecords;
    this.releaseCases = releaseCases;
  }

  findSessionById(id) {
    return this.sessions.findOne({ _id: id });
  }

  findActiveSessionByBooking(bookingId) {
    return this.sessions.findOne({ bookingId, status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING] } });
  }

  findActiveSessionByUser(userId) {
    return this.sessions.findOne({ userId, status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING] } });
  }

  findSessionsForUser(userId) {
    return this.sessions.find({ userId }).sort({ checkInTime: -1 }).toArray();
  }

  findActiveSessions() {
    return this.sessions.find({ status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.WARNING] } }).toArray();
  }

  findSessionsBySpace(spaceId) {
    return this.sessions.find({ spaceId }).sort({ checkInTime: -1 }).toArray();
  }

  insertSession(doc) {
    return this.sessions.insertOne(doc).then(() => doc);
  }

  updateSession(id, patch) {
    return this.sessions
      .findOneAndUpdate({ _id: id }, { $set: patch, $inc: { version: 1 } }, { returnDocument: 'after' })
      .then((r) => (r && r.value !== undefined ? r.value : r));
  }

  insertPresence(doc) {
    return this.presence.insertOne(doc).then(() => doc);
  }

  findPresenceByUsage(usageId) {
    return this.presence.find({ usageId }).sort({ recordedTime: -1 }).toArray();
  }

  insertReleaseCase(doc) {
    return this.releaseCases.insertOne(doc).then(() => doc);
  }

  findReleaseCases(filter = {}) {
    return this.releaseCases.find(filter).sort({ detectedTime: -1 }).toArray();
  }

  findReleaseCaseById(id) {
    return this.releaseCases.findOne({ _id: id });
  }

  updateReleaseCase(id, patch) {
    return this.releaseCases.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r));
  }
}

module.exports = { UsageRepository };
