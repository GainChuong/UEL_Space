const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { BookingRepository } = require('./booking.repository');
const { BookingService } = require('./booking.service');
const { requireAuth, requireManager } = require('../../middleware/require-auth');

class BookingController {
  constructor(service) {
    this.service = service;
  }

  create = async (req, res) => {
    res.status(201).json(await this.service.create(req.body, req.user));
  };

  listMine = async (req, res) => {
    res.json(await this.service.listForUser(req.user, { status: req.query.status }));
  };

  listAll = async (req, res) => {
    res.json(await this.service.listForManager({ status: req.query.status, spaceId: req.query.spaceId }));
  };

  detail = async (req, res) => {
    res.json(await this.service.detail(req.params.id, req.user));
  };

  cancel = async (req, res) => {
    res.json(await this.service.cancel(req.params.id, req.body?.reason, req.user));
  };

  approve = async (req, res) => {
    res.json(await this.service.approve(req.params.id, req.user, req.body?.note));
  };

  reject = async (req, res) => {
    res.json(await this.service.reject(req.params.id, req.user, req.body?.reason));
  };

  qrCheckIn = async (req, res) => {
    const rawCode = (req.body?.code || req.body?.rawCode || req.params.id || '').trim();
    if (!rawCode) {
      return res.status(400).json({ success: false, message: 'Thiếu mã QR hoặc mã đặt chỗ' });
    }
    const actor = req.user || { id: 'USER-ADMIN-01', email: 'admin@uel.edu.vn', name: 'Quản trị viên Hệ thống UEL' };
    res.json(await this.service.qrCheckIn(rawCode, actor));
  };
}

function bookingRoutes(collections) {
  const router = Router();
  const service = new BookingService(new BookingRepository(collections), {
    spaceRepository: collections.spaceRepository,
    scheduleRepository: collections.scheduleRepository,
    notificationService: collections.notificationService,
    userRepository: collections.userRepository,
    chatLearnedIntents: collections.chatLearnedIntents
  });
  const controller = new BookingController(service);

  router.post('/qr-checkin', asyncHandler(controller.qrCheckIn));
  router.post('/:id/qr-checkin', asyncHandler(controller.qrCheckIn));
  router.post('/', requireAuth, asyncHandler(controller.create));
  router.get('/me', requireAuth, asyncHandler(controller.listMine));
  router.get('/', requireManager, asyncHandler(controller.listAll));
  router.get('/:id', requireAuth, asyncHandler(controller.detail));
  router.post('/:id/cancel', requireAuth, asyncHandler(controller.cancel));
  router.post('/:id/approve', requireManager, asyncHandler(controller.approve));
  router.post('/:id/reject', requireManager, asyncHandler(controller.reject));

  return router;
}

module.exports = { bookingRoutes, BookingController };
