const { ObjectId } = require('mongodb');

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

  async findById(id) {
    if (!id) return null;
    const queries = [
      { _id: id },
      { code: id },
      { slug: id }
    ];

    if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
      try {
        queries.push({ _id: new ObjectId(id) });
      } catch (_) {}
    }

    return this.collection.findOne({
      deletedAt: null,
      $or: queries
    });
  }

  findByIds(ids) {
    return this.collection.find({ _id: { $in: ids }, deletedAt: null }).toArray();
  }

  findByCode(code) {
    return this.collection.findOne({ code, deletedAt: null });
  }

  findBySlug(slug) {
    return this.collection.findOne({ slug, deletedAt: null });
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
    await this.collection.createIndex({ slug: 1 }, { sparse: true });
    await this.collection.createIndex({ buildingId: 1, status: 1 });
    await this.collection.createIndex({ name: 'text', description: 'text' });
  }
}

module.exports = { SpaceRepository };
