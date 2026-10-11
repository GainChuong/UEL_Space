const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const { INCIDENT_SEVERITY, INCIDENT_STATUS } = require('../../common/constants');
const { requireObject, requireString, optionalString, requireEnum } = require('../../common/validate');
const { writeAudit } = require('../../common/audit');

class IncidentService {
  constructor(repository, { spaceRepository, notificationService } = {}) {
    this.repository = repository;
    this.spaces = spaceRepository;
    this.notifications = notificationService;
  }

  list(filter = {}) {
    const query = {};
    if (filter.spaceId) query.spaceId = filter.spaceId;
    if (filter.status) query.status = filter.status;
    if (filter.reporterId) query.reporterId = filter.reporterId;
    return this.repository.findAll(query);
  }

  async create(input, actor) {
    requireObject(input);
    const spaceId = requireString(input.spaceId, 'spaceId');
    const space = await this.spaces.findById(spaceId);
    if (!space) throw AppError.badRequest('Không gian không tồn tại', 'SPACE_NOT_FOUND');

    if (input.equipmentId) {
      const belongs = (space.equipment || []).some((eq) => eq.id === input.equipmentId);
      if (!belongs) throw AppError.badRequest('Thiết bị không thuộc không gian này', 'EQUIPMENT_NOT_IN_SPACE');
    }

    const incident = {
      _id: newId(),
      spaceId,
      spaceName: space.name,
      equipmentId: input.equipmentId || null,
      reporterId: actor?.id || null,
      reporterName: actor?.name || 'Ẩn danh',
      incidentType: optionalString(input.incidentType, 'incidentType') || 'FACILITY',
      title: requireString(input.title || input.incidentType || 'Sự cố', 'title', { min: 3 }),
      description: requireString(input.description, 'description', { min: 3 }),
      severity: requireEnum((input.severity || 'MEDIUM').toUpperCase(), 'severity', INCIDENT_SEVERITY),
      status: 'REPORTED',
      handlerId: null,
      completedTime: null,
      reportTime: now(),
      version: 1,
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    };
    await this.repository.insert(incident);
    await writeAudit({ actorId: actor?.id, action: 'CREATE', entityName: 'Incident', entityId: incident._id, changes: { spaceId, severity: incident.severity } });
    if (this.notifications && actor?.id) {
      await this.notifications.create({ userId: actor.id, category: 'system', title: 'Đã ghi nhận sự cố', message: `Sự cố tại ${space.name} đã được ghi nhận.` });
    }
    return incident;
  }

  async updateStatus(id, { status, handlerId, note }, actor) {
    const incident = await this.repository.findById(id);
    if (!incident) throw AppError.notFound('Không tìm thấy sự cố');
    const patch = { updatedAt: now() };
    if (status) patch.status = requireEnum(status, 'status', INCIDENT_STATUS);
    if (handlerId) patch.handlerId = handlerId;
    if (note !== undefined) patch.note = optionalString(note, 'note');
    if (patch.status === 'RESOLVED') patch.completedTime = now();
    const updated = await this.repository.update(id, patch);
    await writeAudit({ actorId: actor?.id, action: 'UPDATE_STATUS', entityName: 'Incident', entityId: id, changes: patch });
    return updated;
  }
}

module.exports = { IncidentService };
