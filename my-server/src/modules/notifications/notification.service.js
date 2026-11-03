const { newId, now } = require('../../common/id');
const { AppError } = require('../../common/app-error');

class NotificationService {
  constructor(repository) {
    this.repository = repository;
    this.sseClients = new Set();

    // Heartbeat định kỳ 25s để giữ kết nối SSE không bị ngắt bởi Proxy/Cloud
    setInterval(() => {
      this.heartbeat();
    }, 25000);
  }

  addSseClient(res, clientInfo = {}) {
    const client = {
      res,
      userId: clientInfo.userId || null,
      role: clientInfo.role || 'CUSTOMER'
    };
    this.sseClients.add(client);

    // Initial connected message
    try {
      res.write(`: connected\n\n`);
    } catch (_) {}

    res.on('close', () => {
      this.sseClients.delete(client);
    });
  }

  heartbeat() {
    for (const client of this.sseClients) {
      try {
        client.res.write(`: heartbeat\n\n`);
      } catch (_) {
        this.sseClients.delete(client);
      }
    }
  }

  pushSse(notification) {
    const rawData = JSON.stringify(notification);
    for (const client of this.sseClients) {
      try {
        const matchesUser = notification.userId && (client.userId === notification.userId);
        const matchesRole = notification.role && (
          notification.role === 'ALL' ||
          client.role === notification.role ||
          (notification.role === 'ADMIN' && client.role === 'ADMIN') ||
          (notification.role === 'SELLER' && client.role === 'SELLER') ||
          (notification.role === 'CUSTOMER' && client.role === 'CUSTOMER')
        );

        if (matchesUser || matchesRole || (!notification.userId && !notification.role)) {
          client.res.write(`data: ${rawData}\n\n`);
        }
      } catch (err) {
        console.warn('[SSE] Lỗi gửi event tới client:', err.message);
        this.sseClients.delete(client);
      }
    }
  }

  async create({
    userId = null,
    role = 'CUSTOMER',
    category = 'system',
    type = 'info',
    title = 'Thông báo mới',
    message = '',
    link = null,
    relatedEntity = null,
    relatedId = null,
    channel = 'IN_APP'
  }) {
    const id = newId();
    const doc = {
      _id: id,
      id,
      userId,
      role,
      category,
      type: type || category || 'info',
      title,
      message,
      link,
      relatedEntity,
      relatedId,
      channel,
      isRead: false,
      read: false,
      readAt: null,
      sentTime: now(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT',
      createdAt: now()
    };

    const saved = await this.repository.insert(doc);
    // Bắn Real-time qua SSE tức thì
    this.pushSse(doc);
    return saved;
  }

  listForRecipient({ userId, role }) {
    return this.repository.findForRecipient({ userId, role });
  }

  listForUser(userId) {
    return this.repository.findForUser(userId);
  }

  async markRead(id, userId) {
    const updated = await this.repository.markRead(id, userId);
    return updated || { success: true };
  }

  markAllRead({ userId, role }) {
    return this.repository.markAllRead({ userId, role });
  }

  broadcast({ userIds = [], ...notification }) {
    return Promise.all(userIds.map((userId) => this.create({ userId, ...notification })));
  }
}

module.exports = { NotificationService };
