class OrganizationRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findAll() {
    return this.collection.find({ deletedAt: null }).sort({ name: 1 }).toArray();
  }

  findById(id) {
    return this.collection.findOne({ _id: id });
  }

  findByName(name) {
    return this.collection.findOne({ name });
  }

  insert(organization) {
    return this.collection.insertOne(organization).then(() => organization);
  }

  update(id, patch) {
    return this.collection
      .findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' })
      .then((result) => (result && result.value !== undefined ? result.value : result));
  }
}

module.exports = { OrganizationRepository };
