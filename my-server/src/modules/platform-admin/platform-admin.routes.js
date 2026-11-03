const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { requireAdmin } = require('../../middleware/require-auth');

function platformAdminRoutes(service) {
  const router = Router();

  // 1. Thống kê tổng quan sàn
  router.get('/metrics', requireAdmin, asyncHandler(async (req, res) => {
    const data = await service.getPlatformMetrics();
    res.json(data);
  }));

  // 2. Kiểm duyệt Listing
  router.get('/listings', requireAdmin, asyncHandler(async (req, res) => {
    const data = await service.getListings({
      status: req.query.status,
      keyword: req.query.keyword
    });
    res.json(data);
  }));

  router.patch('/listings/:id/moderate', requireAdmin, asyncHandler(async (req, res) => {
    const { action, reason } = req.body;
    const data = await service.moderateListing(req.params.id, action, {
      reason,
      adminId: req.user?.id || 'ADMIN-001'
    });
    res.json(data);
  }));

  // 3. Quản lý Tài khoản & KYC
  router.get('/users', requireAdmin, asyncHandler(async (req, res) => {
    const data = await service.getUsers({
      role: req.query.role,
      status: req.query.status,
      kycStatus: req.query.kycStatus
    });
    res.json(data);
  }));

  router.patch('/users/:id/kyc', requireAdmin, asyncHandler(async (req, res) => {
    const { status, kycStatus, verifiedBadge } = req.body;
    const data = await service.updateUserKycOrStatus(req.params.id, {
      status,
      kycStatus,
      verifiedBadge,
      adminId: req.user?.id || 'ADMIN-001'
    });
    res.json(data);
  }));

  // 4. Quản lý Escrow & Lệnh giải ngân
  router.get('/escrow', requireAdmin, asyncHandler(async (req, res) => {
    const data = await service.getEscrowPayouts();
    res.json(data);
  }));

  router.post('/escrow/settle/:id', requireAdmin, asyncHandler(async (req, res) => {
    const data = await service.settlePayout(req.params.id, req.user?.id || 'ADMIN-001');
    res.json(data);
  }));

  // 5. Quản lý Tranh chấp / Khiếu nại
  router.get('/disputes', requireAdmin, asyncHandler(async (req, res) => {
    const data = await service.getDisputes();
    res.json(data);
  }));

  router.patch('/disputes/:id/resolve', requireAdmin, asyncHandler(async (req, res) => {
    const { decision, refundAmount, penaltyAmount, notes } = req.body;
    const data = await service.resolveDispute(req.params.id, {
      decision,
      refundAmount,
      penaltyAmount,
      notes,
      adminId: req.user?.id || 'ADMIN-001'
    });
    res.json(data);
  }));

  // 6. Cấu hình Tham số Sàn
  router.get('/config', requireAdmin, asyncHandler(async (req, res) => {
    res.json(service.getConfig());
  }));

  router.put('/config', requireAdmin, asyncHandler(async (req, res) => {
    const data = service.updateConfig(req.body, req.user?.id || 'ADMIN-001');
    res.json(data);
  }));

  return router;
}

module.exports = { platformAdminRoutes };
