const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const { requireString, optionalString, requireObject } = require('../../common/validate');
const { writeAudit } = require('../../common/audit');

class OrganizationService {
  constructor(repository, membershipRepository) {
    this.repository = repository;
    this.memberships = membershipRepository;
  }

  list() {
    return this.repository.findAll();
  }

  async detail(id) {
    const organization = await this.repository.findById(id);
    if (!organization) throw AppError.notFound('Không tìm thấy đơn vị');
    return organization;
  }

  async ensureByName(name) {
    if (!name) return null;
    const existing = await this.repository.findByName(name);
    if (existing) return existing;
    const organization = {
      _id: newId(),
      code: `ORG-${newId().slice(0, 8).toUpperCase()}`,
      name,
      type: 'UNIT',
      domain: 'uel.edu.vn',
      contactEmail: '',
      phone: '',
      parentId: null,
      status: 'ACTIVE',
      createdAt: now(),
      updatedAt: now()
    };
    await this.repository.insert(organization);
    return organization;
  }

  async create(input, actorId) {
    requireObject(input);
    const name = requireString(input.name, 'name', { min: 2 });
    const existing = await this.repository.findByName(name);
    if (existing) throw AppError.conflict('Đơn vị đã tồn tại', 'ORGANIZATION_EXISTS');
    const organization = {
      _id: newId(),
      code: optionalString(input.code, 'code') || `ORG-${newId().slice(0, 8).toUpperCase()}`,
      name,
      type: optionalString(input.type, 'type') || 'UNIT',
      domain: optionalString(input.domain, 'domain') || 'uel.edu.vn',
      contactEmail: optionalString(input.contactEmail, 'contactEmail') || '',
      phone: optionalString(input.phone, 'phone') || '',
      parentId: input.parentId || null,
      status: 'ACTIVE',
      createdAt: now(),
      updatedAt: now()
    };
    await this.repository.insert(organization);
    await writeAudit({ actorId, action: 'CREATE', entityName: 'Organization', entityId: organization._id, changes: { name } });
    return organization;
  }

  async listMembers(organizationId) {
    if (!this.memberships) return [];
    return this.memberships.findByOrganization(organizationId);
  }

  async addMember(organizationId, input, actorId) {
    if (!this.memberships) throw AppError.badRequest('Module thành viên chưa được cấu hình');
    requireObject(input);
    const userId = requireString(input.userId, 'userId');
    await this.detail(organizationId);
    const existing = await this.memberships.findOne(userId, organizationId);
    if (existing) throw AppError.conflict('Người dùng đã là thành viên của đơn vị', 'MEMBERSHIP_EXISTS');
    const membership = {
      _id: newId(),
      userId,
      organizationId,
      organizationRole: optionalString(input.organizationRole, 'organizationRole') || 'MEMBER',
      startDate: now(),
      endDate: null,
      status: 'ACTIVE'
    };
    await this.memberships.insert(membership);
    await writeAudit({ actorId, action: 'ADD_MEMBER', entityName: 'Membership', entityId: membership._id, changes: { userId, organizationId } });
    return membership;
  }
}

module.exports = { OrganizationService };
