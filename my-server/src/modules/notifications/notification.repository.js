class NotificationRepository {
  constructor(collection) {
    this.collection = collection;
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }

  findForUser(userId) {
    return this.collection.find({ userId }).sort({ createdAt: -1 }).limit(100).toArray();
  }

  markRead(id, userId) {
    return this.collection.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true, readAt: new Date() } },
      { returnDocument: 'after' }
    ).then((r) => r.value);
  }

  markAllRead(userId) {
    return this.collection.updateMany({ userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
  }
}

module.exports = { NotificationRepository };
