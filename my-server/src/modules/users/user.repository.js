class UserRepository {
  constructor({ users, bookings }) {
    this.collection = users;
    this.bookings = bookings;
  }

  findAll(filter = {}) {
    return this.collection.find({ ...filter }).sort({ createdAt: -1 }).toArray();
  }

  findById(id) {
    return this.collection.findOne({ _id: id });
  }

  update(id, patch) {
    return this.collection
      .findOneAndUpdate({ _id: id }, { $set: patch, $inc: { version: 1 } }, { returnDocument: 'after' })
      .then((r) => r.value);
  }

  async bookingsCount(userId) {
    return this.bookings.countDocuments({ userId, deletedAt: null });
  }

  async countsByUser() {
    const rows = await this.bookings
      .aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$userId', count: { $sum: 1 } } }])
      .toArray();
    return new Map(rows.map((r) => [r._id, r.count]));
  }
}

module.exports = { UserRepository };
