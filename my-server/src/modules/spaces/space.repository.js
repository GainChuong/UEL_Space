class SpaceRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findAll(filter = {}) {
    return this.collection.find({ deletedAt: null, ...filter }).sort({ name: 1 }).toArray();
  }

  findAllIncludingDeleted(filter = {}) {
    return this.collection.find(filter).sort({ name: 1 }).toArray();
  }

  findById(id) {
    return this.collection.findOne({ _id: id, deletedAt: null });
  }

  findByIds(ids) {
    return this.collection.find({ _id: { $in: ids }, deletedAt: null }).toArray();
  }

  findByCode(code) {
    return this.collection.findOne({ code, deletedAt: null });
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }

  update(id, patch) {
    return this.collection
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $set: patch, $inc: { version: 1 } }, { returnDocument: 'after' })
      .then((result) => (result && result.value !== undefined ? result.value : result));
  }

  softDelete(id) {
    return this.collection.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
  }

  async createIndexes() {
    await this.collection.createIndex({ code: 1 }, { unique: true, sparse: true });
    await this.collection.createIndex({ buildingId: 1, status: 1 });
    await this.collection.createIndex({ name: 'text', description: 'text' });
  }
}

module.exports = { SpaceRepository };
