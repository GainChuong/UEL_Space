const { newId, now } = require('../../common/id');
const { occupancyLevel } = require('../../common/constants');

class OccupancyService {
  constructor(repository, { usageRepository, spaceRepository } = {}) {
    this.repository = repository;
    this.usage = usageRepository;
    this.spaces = spaceRepository;
  }

  groupActiveBySpace(sessions) {
    const map = new Map();
    for (const session of sessions) {
      const current = map.get(session.spaceId) || { userCount: 0, sessionCount: 0 };
      current.userCount += session.expectedUserCount || 1;
      current.sessionCount += 1;
      map.set(session.spaceId, current);
    }
    return map;
  }

  async live() {
    const [spaces, activeSessions] = await Promise.all([
      this.spaces.findAll({}),
      this.usage.findActiveSessions()
    ]);
    const grouped = this.groupActiveBySpace(activeSessions);
    return spaces.map((space) => {
      const info = grouped.get(space._id) || { userCount: 0, sessionCount: 0 };
      const rate = space.capacity > 0 ? Math.round((info.userCount / space.capacity) * 100) : 0;
      return {
        spaceId: space._id,
        spaceName: space.name,
        building: space.buildingName || '',
        capacity: space.capacity,
        currentUsers: info.userCount,
        activeSessions: info.sessionCount,
        occupancyRate: rate,
        level: occupancyLevel(rate),
        status: space.status
      };
    });
  }

  async snapshot() {
    const live = await this.live();
    const recordedTime = now();
    const docs = live.map((row) => ({
      _id: newId(),
      spaceId: row.spaceId,
      spaceName: row.spaceName,
      recordedTime,
      userCount: row.currentUsers,
      capacity: row.capacity,
      occupancyRate: row.occupancyRate,
      level: row.level,
      dataSource: 'CRON_SNAPSHOT'
    }));
    await this.repository.insertMany(docs);
    return docs;
  }

  history(filter = {}) {
    const query = {};
    if (filter.spaceId) query.spaceId = filter.spaceId;
    if (filter.from || filter.to) {
      query.recordedTime = {};
      if (filter.from) query.recordedTime.$gte = new Date(filter.from);
      if (filter.to) query.recordedTime.$lte = new Date(filter.to);
    }
    return this.repository.find(query);
  }
}

module.exports = { OccupancyService };
