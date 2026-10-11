class IncidentRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findAll(filter = {}) {
    return this.collection.find({ deletedAt: null, ...filter }).sort({ reportTime: -1 }).toArray();
  }

  findById(id) {
    return this.collection.findOne({ _id: id, deletedAt: null });
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }

  update(id, patch) {
    return this.collection
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: patch, $inc: { version: 1 } }, { returnDocument: 'after' })
      .then((r) => (r && r.value !== undefined ? r.value : r));
  }
}

module.exports = { IncidentRepository };
