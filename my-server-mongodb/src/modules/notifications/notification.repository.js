const { ObjectId } = require('mongodb');

class NotificationRepository {
  constructor(collection) {
    this.collection = collection;
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }

  findForRecipient({ userId, role }) {
    const conditions = [];
    if (userId) {
      conditions.push({ userId });
    }
    if (role && role !== 'ALL') {
      conditions.push({ role });
    }
    conditions.push({ role: 'ALL' });

    const query = conditions.length > 1 ? { $or: conditions } : (conditions[0] || {});
    return this.collection.find(query).sort({ createdAt: -1 }).limit(100).toArray();
  }

  findForUser(userId) {
    return this.findForRecipient({ userId });
  }

  markRead(id, userId) {
    const filter = { $or: [{ _id: id }, { id }] };
    if (ObjectId.isValid(id)) {
      filter.$or.push({ _id: new ObjectId(id) });
    }
    return this.collection.findOneAndUpdate(
      filter,
      { $set: { isRead: true, read: true, readAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    ).then((r) => (r && r.value !== undefined ? r.value : r));
  }

  markAllRead({ userId, role }) {
    const conditions = [];
    if (userId) conditions.push({ userId });
    if (role && role !== 'ALL') conditions.push({ role });
    conditions.push({ role: 'ALL' });
    const query = { $or: conditions, isRead: false };
    return this.collection.updateMany(query, { $set: { isRead: true, read: true, readAt: new Date().toISOString() } });
  }
}

module.exports = { NotificationRepository };
