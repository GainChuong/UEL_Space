const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const { requireObject, requireString, optionalString, requireNumber, optionalNumber } = require('../../common/validate');
const { writeAudit } = require('../../common/audit');

class CatalogService {
  constructor(repository) {
    this.repository = repository;
  }

  listBuildings(filter = {}) {
    return this.repository.listBuildings(filter);
  }

  async createBuilding(input, actorId) {
    requireObject(input);
    const doc = {
      _id: newId(),
      code: requireString(input.code, 'code', { min: 1 }).toUpperCase(),
      name: requireString(input.name, 'name', { min: 2 }),
      areaType: optionalString(input.areaType, 'areaType') || 'CAMPUS',
      address: optionalString(input.address, 'address') || '',
      numberOfFloors: optionalNumber(input.numberOfFloors, 'numberOfFloors', { min: 1, integer: true }) || 1,
      description: optionalString(input.description, 'description') || '',
      mapData: input.mapData || null,
      status: 'ACTIVE',
      createdAt: now(),
      updatedAt: now()
    };
    const existing = await this.repository.findBuildingByCode(doc.code);
    if (existing) throw AppError.conflict('Mã tòa nhà đã tồn tại', 'BUILDING_CODE_EXISTS');
    await this.repository.insertBuilding(doc);
    await writeAudit({ actorId, action: 'CREATE', entityName: 'Building', entityId: doc._id, changes: { code: doc.code } });
    return doc;
  }

  async updateBuilding(id, input, actorId) {
    const patch = { updatedAt: now() };
    if (input.name !== undefined) patch.name = requireString(input.name, 'name', { min: 2 });
    if (input.address !== undefined) patch.address = optionalString(input.address, 'address') || '';
    if (input.areaType !== undefined) patch.areaType = optionalString(input.areaType, 'areaType');
    if (input.numberOfFloors !== undefined) patch.numberOfFloors = requireNumber(input.numberOfFloors, 'numberOfFloors', { min: 1, integer: true });
    if (input.status !== undefined) patch.status = requireString(input.status, 'status');
    const result = await this.repository.updateBuilding(id, patch);
    if (!result) throw AppError.notFound('Không tìm thấy tòa nhà');
    await writeAudit({ actorId, action: 'UPDATE', entityName: 'Building', entityId: id, changes: patch });
    return result;
  }

  listFloors(buildingId) {
    return this.repository.listFloors(buildingId);
  }

  async createFloor(input, actorId) {
    requireObject(input);
    const buildingId = requireString(input.buildingId, 'buildingId');
    const building = await this.repository.findBuildingById(buildingId);
    if (!building) throw AppError.badRequest('Tòa nhà không tồn tại', 'BUILDING_NOT_FOUND');
    const doc = {
      _id: newId(),
      buildingId,
      floorNumber: requireNumber(input.floorNumber, 'floorNumber', { min: 0, integer: true }),
      floorName: optionalString(input.floorName, 'floorName') || `Tầng ${input.floorNumber}`,
      floorMap: optionalString(input.floorMap, 'floorMap') || '',
      description: optionalString(input.description, 'description') || '',
      createdAt: now(),
      updatedAt: now()
    };
    await this.repository.insertFloor(doc);
    await writeAudit({ actorId, action: 'CREATE', entityName: 'Floor', entityId: doc._id, changes: { buildingId, floorNumber: doc.floorNumber } });
    return doc;
  }

  listCategories() {
    return this.repository.listCategories();
  }

  async createCategory(input, actorId) {
    requireObject(input);
    const doc = {
      _id: newId(),
      name: requireString(input.name, 'name', { min: 2 }),
      description: optionalString(input.description, 'description') || '',
      allowedUser: input.allowedUser || 'ALL',
      status: 'ACTIVE',
      createdAt: now(),
      updatedAt: now()
    };
    await this.repository.insertCategory(doc);
    await writeAudit({ actorId, action: 'CREATE', entityName: 'SpaceCategory', entityId: doc._id, changes: { name: doc.name } });
    return doc;
  }

  listEquipment() {
    return this.repository.listEquipment();
  }

  async createEquipment(input, actorId) {
    requireObject(input);
    const doc = {
      _id: newId(),
      code: optionalString(input.code, 'code') || `EQ-${newId().slice(0, 6).toUpperCase()}`,
      name: requireString(input.name, 'name', { min: 2 }),
      type: optionalString(input.type, 'type') || 'GENERAL',
      description: optionalString(input.description, 'description') || '',
      icon: optionalString(input.icon, 'icon') || 'devices',
      status: 'AVAILABLE',
      createdAt: now(),
      updatedAt: now()
    };
    await this.repository.insertEquipment(doc);
    await writeAudit({ actorId, action: 'CREATE', entityName: 'Equipment', entityId: doc._id, changes: { name: doc.name } });
    return doc;
  }
}

module.exports = { CatalogService };
