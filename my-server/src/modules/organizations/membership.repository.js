class MembershipRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findByOrganization(organizationId) {
    return this.collection.find({ organizationId }).sort({ startDate: -1 }).toArray();
  }

  findByUser(userId) {
    return this.collection.find({ userId }).toArray();
  }

  findOne(userId, organizationId) {
    return this.collection.findOne({ userId, organizationId });
  }

  insert(doc) {
    return this.collection.insertOne(doc).then(() => doc);
  }

  update(id, patch) {
    return this.collection.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r));
  }
}

module.exports = { MembershipRepository };
