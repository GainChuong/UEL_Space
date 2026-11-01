class CatalogRepository {
  constructor({ buildings, floors, categories, equipment }) {
    this.buildings = buildings;
    this.floors = floors;
    this.categories = categories;
    this.equipment = equipment;
  }

  listBuildings(filter = {}) {
    return this.buildings.find(filter).sort({ name: 1 }).toArray();
  }

  findBuildingById(id) {
    return this.buildings.findOne({ _id: id });
  }

  findBuildingByCode(code) {
    return this.buildings.findOne({ code });
  }

  insertBuilding(doc) {
    return this.buildings.insertOne(doc).then(() => doc);
  }

  updateBuilding(id, patch) {
    return this.buildings.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r));
  }

  removeBuilding(id) {
    return this.buildings.deleteOne({ _id: id });
  }

  listFloors(buildingId) {
    const filter = buildingId ? { buildingId } : {};
    return this.floors.find(filter).sort({ floorNumber: 1 }).toArray();
  }

  findFloorById(id) {
    return this.floors.findOne({ _id: id });
  }

  insertFloor(doc) {
    return this.floors.insertOne(doc).then(() => doc);
  }

  updateFloor(id, patch) {
    return this.floors.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r));
  }

  removeFloor(id) {
    return this.floors.deleteOne({ _id: id });
  }

  listCategories() {
    return this.categories.find({}).sort({ name: 1 }).toArray();
  }

  findCategoryById(id) {
    return this.categories.findOne({ _id: id });
  }

  insertCategory(doc) {
    return this.categories.insertOne(doc).then(() => doc);
  }

  updateCategory(id, patch) {
    return this.categories.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r));
  }

  listEquipment() {
    return this.equipment.find({}).sort({ name: 1 }).toArray();
  }

  findEquipmentById(id) {
    return this.equipment.findOne({ _id: id });
  }

  insertEquipment(doc) {
    return this.equipment.insertOne(doc).then(() => doc);
  }

  updateEquipment(id, patch) {
    return this.equipment.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).then((r) => (r && r.value !== undefined ? r.value : r));
  }
}

module.exports = { CatalogRepository };
