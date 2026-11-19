/**
 * Payment Routes - MoMo Sandbox Endpoints
 */

const express = require('express');

function paymentRoutes({ bookingRepository, spaceRepository, notificationService, db } = {}) {
  const router = express.Router();
  const { PaymentService } = require('./payment.service');
  const paymentService = new PaymentService({
    bookingRepository,
    spaceRepository,
    notificationService,
    db
  });

  // 1. Tạo giao dịch thanh toán MoMo Sandbox
  router.post('/momo/create', async (req, res, next) => {
    try {
      const { orderId, amount, orderInfo, redirectUrl } = req.body;
      const result = await paymentService.createMomoPayment({
        orderId: orderId || `BK-${Date.now()}`,
        amount: amount || 50000,
        orderInfo,
        redirectUrl
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // 2. Xác nhận thanh toán thành công (Dev/Test 1-chạm hoặc từ callback)
  router.post('/momo/confirm-test', async (req, res, next) => {
    try {
      const { orderId, transId, paymentMethod } = req.body;
      const result = await paymentService.confirmPayment({
        orderId,
        transId,
        paymentMethod: paymentMethod || 'MOMO'
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // 3. MoMo IPN (Instant Payment Notification) - Xác thực chữ ký HMAC-SHA256
  router.post('/momo/ipn', async (req, res, next) => {
    try {
      const result = await paymentService.handleMomoIpn(req.body || {});
      res.status(200).json(result);
    } catch (err) {
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(err);
    }
  });

  // 4. Callback sau khi thanh toán trên MoMo chuyển hướng về
  router.get('/momo/callback', async (req, res, next) => {
    try {
      const { resultCode, orderId, transId } = req.query;
      if (resultCode === '0' && orderId) {
        await paymentService.confirmPayment({
          orderId,
          transId,
          paymentMethod: 'MOMO'
        });
        return res.redirect(`http://localhost:4200/booking-history?momoSuccess=true&orderId=${orderId}`);
      }
      return res.redirect(`http://localhost:4200/booking-history?momoFailed=true&orderId=${orderId}`);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { paymentRoutes };
