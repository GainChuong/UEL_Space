const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { NotificationRepository } = require('./notification.repository');
const { NotificationService } = require('./notification.service');

function notificationRoutes(collections) {
  const router = Router();
  const service = collections.notificationService || new NotificationService(new NotificationRepository(collections.notifications));

  // 1. Real-time Server-Sent Events (SSE) Stream
  router.get('/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const userId = req.query.userId || req.user?.id || req.headers['x-user-id'] || null;
    const role = (req.query.role || req.user?.role || req.headers['x-user-role'] || 'CUSTOMER').toUpperCase();

    service.addSseClient(res, { userId, role });
  });

  // 2. Lấy danh sách thông báo theo đối tượng (User ID hoặc Role)
  router.get('/', asyncHandler(async (req, res) => {
    const userId = req.query.userId || req.user?.id || req.headers['x-user-id'] || null;
    const role = (req.query.role || req.user?.role || req.headers['x-user-role'] || 'CUSTOMER').toUpperCase();

    const notifications = await service.listForRecipient({ userId, role });
    res.json(notifications);
  }));

  // 3. Đánh dấu đã đọc 1 thông báo
  router.post('/:id/read', asyncHandler(async (req, res) => {
    const userId = req.query.userId || req.user?.id || req.headers['x-user-id'] || null;
    const result = await service.markRead(req.params.id, userId);
    res.json(result);
  }));

  // 4. Đánh dấu tất cả đã đọc
  router.post('/read-all', asyncHandler(async (req, res) => {
    const userId = req.query.userId || req.user?.id || req.headers['x-user-id'] || null;
    const role = (req.query.role || req.user?.role || req.headers['x-user-role'] || 'CUSTOMER').toUpperCase();

    const result = await service.markAllRead({ userId, role });
    res.json({ success: true, count: result?.modifiedCount || 0 });
  }));

  // 5. Test trigger thông báo chéo vai trò
  router.post('/trigger', asyncHandler(async (req, res) => {
    const { userId, role = 'CUSTOMER', category = 'system', type = 'info', title, message, link } = req.body;
    const created = await service.create({
      userId,
      role: role.toUpperCase(),
      category,
      type,
      title: title || 'Thông báo hệ thống',
      message: message || 'Nội dung thông báo mới',
      link
    });
    res.status(201).json({ success: true, notification: created });
  }));

  return router;
}

module.exports = { notificationRoutes, NotificationService };
