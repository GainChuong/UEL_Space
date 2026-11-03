const { getCollection } = require('../../config/db');

class AuthRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findByEmail(email) {
    return this.collection.findOne({ email: String(email).trim().toLowerCase() });
  }

  findById(id) {
    return this.collection.findOne({ _id: id });
  }

  insert(user) {
    return this.collection.insertOne(user).then(() => user);
  }

  update(id, patch) {
    return this.collection
      .findOneAndUpdate({ _id: id }, { $set: patch, $inc: { version: 1 } }, { returnDocument: 'after' })
      .then((result) => (result && result.value !== undefined ? result.value : result));
  }

  async createIndexes() {
    await this.collection.createIndex({ email: 1 }, { unique: true });
  }
}

module.exports = { AuthRepository };
