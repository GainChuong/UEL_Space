const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { SpaceRepository } = require('./space.repository');
const { SpaceService } = require('./space.service');
const { SpaceController } = require('./space.controller');
const { optionalAuth, requireManager } = require('../../middleware/require-auth');

function buildSpaceService(collections) {
  return new SpaceService(new SpaceRepository(collections.spaces), {
    catalogRepository: collections.catalogRepository,
    bookingRepository: collections.bookingRepository,
    scheduleRepository: collections.scheduleRepository
  });
}

function spaceRoutes(collections) {
  const router = Router();
  const service = buildSpaceService(collections);
  const controller = new SpaceController(service);

  router.get('/', optionalAuth, asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.detail));
  router.post('/', requireManager, asyncHandler(async (req, res, next) => {
    const created = await service.create(req.body, req.user?.id);
    if (collections.notificationService) {
      collections.notificationService.create({
        role: 'ADMIN',
        category: 'space',
        type: 'info',
        title: 'Yêu cầu kiểm duyệt không gian mới',
        message: `Gian hàng vừa đăng tải không gian "${created.name}" (${created.code || ''}). Vui lòng kiểm duyệt.`,
        link: '/admin'
      }).catch(() => {});
    }
    res.status(201).json(created);
  }));
  router.put('/:id', requireManager, asyncHandler(controller.update));
  router.delete('/:id', requireManager, asyncHandler(controller.remove));
  router.patch('/:id/status', requireManager, asyncHandler(controller.changeStatus));

  return router;
}

module.exports = { spaceRoutes, buildSpaceService };
