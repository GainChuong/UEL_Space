const { getCollection } = require('../../config/db');
const { newId, now } = require('../../common/id');
const { AppError } = require('../../common/app-error');

class NotificationService {
  constructor(repository) {
    this.repository = repository;
  }

  async create({ userId, category = 'system', type, title, message, relatedEntity = null, relatedId = null, channel = 'IN_APP' }) {
    if (!userId) return null;
    return this.repository.insert({
      _id: newId(),
      userId,
      category,
      type: type || category,
      title: title || 'Thông báo',
      message: message || '',
      relatedEntity,
      relatedId,
      channel,
      isRead: false,
      readAt: null,
      sentTime: now(),
      status: 'SENT',
      createdAt: now()
    });
  }

  listForUser(userId) {
    return this.repository.findForUser(userId);
  }

  async markRead(id, userId) {
    const updated = await this.repository.markRead(id, userId);
    if (!updated) throw AppError.notFound('Không tìm thấy thông báo');
    return updated;
  }

  markAllRead(userId) {
    return this.repository.markAllRead(userId);
  }

  broadcast({ userIds = [], ...notification }) {
    return Promise.all(userIds.map((userId) => this.create({ userId, ...notification })));
  }
}

module.exports = { NotificationService };
