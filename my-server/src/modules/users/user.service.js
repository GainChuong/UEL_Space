const { AppError } = require('../../common/app-error');
const { ROLE_LIST, USER_STATUS } = require('../../common/constants');
const { requireEnum } = require('../../common/validate');
const { publicUser } = require('../../common/presenters');
const { writeAudit } = require('../../common/audit');

class UserService {
  constructor(repository) {
    this.repository = repository;
  }

  async list(filter = {}) {
    const query = {};
    if (filter.role) query.role = filter.role;
    if (filter.status) query.status = filter.status;
    if (filter.keyword) {
      query.$or = [
        { fullName: { $regex: filter.keyword, $options: 'i' } },
        { email: { $regex: filter.keyword, $options: 'i' } },
        { code: { $regex: filter.keyword, $options: 'i' } }
      ];
    }
    const [users, counts] = await Promise.all([this.repository.findAll(query), this.repository.countsByUser()]);
    return users.map((user) => ({ ...publicUser(user), bookingsCount: counts.get(user._id) || 0 }));
  }

  async detail(id) {
    const user = await this.repository.findById(id);
    if (!user) throw AppError.notFound('Không tìm thấy người dùng');
    return { ...publicUser(user), bookingsCount: await this.repository.bookingsCount(id) };
  }

  async update(id, input, actorId) {
    const user = await this.repository.findById(id);
    if (!user) throw AppError.notFound('Không tìm thấy người dùng');
    const patch = {};
    if (input.role !== undefined) patch.role = requireEnum(input.role, 'role', ROLE_LIST);
    if (input.status !== undefined) patch.status = requireEnum(input.status, 'status', Object.values(USER_STATUS));
    if (input.fullName !== undefined) patch.fullName = String(input.fullName).trim();
    if (Object.keys(patch).length === 0) throw AppError.badRequest('Không có trường nào để cập nhật');
    patch.updatedAt = new Date();
    const updated = await this.repository.update(id, patch);
    await writeAudit({ actorId, action: 'UPDATE', entityName: 'User', entityId: id, changes: patch, level: 'WARNING' });
    return publicUser(updated);
  }
}

module.exports = { UserService };
