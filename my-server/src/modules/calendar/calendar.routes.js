/**
 * Calendar Routes - Google Calendar Live Integration
 */

const express = require('express');
const { extractUserFromRequest } = require('../../middleware/require-auth');

function calendarRoutes({ calendarService } = {}) {
  const router = express.Router();

  // 1. Lấy URL ủy quyền Google OAuth 2.0
  router.get('/connect-url', (req, res) => {
    try {
      const currentUser = extractUserFromRequest(req);
      const redirectUri = req.query.redirect_uri || 'http://localhost:4200/calendar-callback';
      const userEmail = (currentUser?.email || req.query.email || '').trim().toLowerCase();
      const authUrl = calendarService.getAuthUrl(redirectUri, userEmail);
      res.json({ success: true, authUrl });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Trao đổi Authorization Code lấy Tokens
  router.post('/callback', async (req, res) => {
    try {
      const currentUser = extractUserFromRequest(req);
      const { code, redirectUri, email } = req.body;
      const userEmail = (currentUser?.email || email || '').trim().toLowerCase();
      const result = await calendarService.exchangeCodeForTokens({
        code,
        redirectUri: redirectUri || 'http://localhost:4200/calendar-callback',
        userEmail
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // 3. Kiểm tra trạng thái kết nối
  router.get('/status', async (req, res) => {
    try {
      const currentUser = extractUserFromRequest(req);
      const email = (currentUser?.email || req.query.email || '').trim().toLowerCase();
      const status = await calendarService.getConnectionStatus(email);
      res.json({ success: true, ...status });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Hủy kết nối
  router.post('/disconnect', async (req, res) => {
    try {
      const currentUser = extractUserFromRequest(req);
      const email = (currentUser?.email || req.body?.email || '').trim().toLowerCase();
      const result = await calendarService.disconnect(email);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Lấy lịch bận FreeBusy thực tế theo ngày (Hỗ trợ cả GET & POST)
  const handleFreeBusy = async (req, res) => {
    try {
      const currentUser = extractUserFromRequest(req);
      const email = (req.body?.email || req.query?.email || currentUser?.email || '').trim().toLowerCase();
      const date = req.body?.date || req.query?.date || '';
      const result = await calendarService.getFreeBusy({ userEmail: email, dateStr: date });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
  router.get('/freebusy', handleFreeBusy);
  router.post('/freebusy', handleFreeBusy);

  // 6. Tự động tạo sự kiện đặt phòng vào Google Calendar
  router.post('/events', async (req, res) => {
    try {
      const currentUser = extractUserFromRequest(req);
      const { email, bookingData } = req.body;
      const userEmail = (currentUser?.email || email || '').trim().toLowerCase();
      const result = await calendarService.createBookingEvent(userEmail, bookingData || req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { calendarRoutes };
