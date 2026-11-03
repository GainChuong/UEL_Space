class OccupancyRepository {
  constructor(collection) {
    this.collection = collection;
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }

  insertMany(docs) {
    if (!docs.length) return Promise.resolve([]);
    return this.collection.insertMany(docs).then(() => docs);
  }

  find(filter = {}) {
    return this.collection.find(filter).sort({ recordedTime: -1 }).limit(500).toArray();
  }

  findLatestBySpace(spaceId) {
    return this.collection.find({ spaceId }).sort({ recordedTime: -1 }).limit(1).toArray().then((rows) => rows[0] || null);
  }
}

module.exports = { OccupancyRepository };
