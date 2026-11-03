class ScheduleRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findAll(filter = {}) {
    return this.collection.find({ ...filter }).sort({ startTime: 1 }).toArray();
  }

  findBySpace(spaceId) {
    return this.collection.find({ spaceId }).sort({ startTime: 1 }).toArray();
  }

  overlapping(spaceId, start, end) {
    return this.collection
      .find({ spaceId, status: { $ne: 'CANCELLED' }, startTime: { $lt: end }, endTime: { $gt: start } })
      .toArray();
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }
}

module.exports = { ScheduleRepository };
