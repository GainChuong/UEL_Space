class FeedbackRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findAll(filter = {}) {
    return this.collection.find(filter).sort({ submitTime: -1 }).toArray();
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }
}

module.exports = { FeedbackRepository };
