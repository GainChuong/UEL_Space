/**
 * UEL Space - Chatbot Routes
 * Cung cấp API tiếp nhận tin nhắn, gọi Gemini AI, tra cứu không gian và quản lý lịch sử hội thoại
 */

const express = require('express');
const { geminiService } = require('./gemini.service');
const { ObjectId } = require('mongodb');
const { extractUserFromRequest } = require('../../middleware/require-auth');

function chatbotRoutes({ spaces, chatSessions, chatLearnedIntents, bookings }) {
  const router = express.Router();

  // 1. POST /api/chatbot/message - Gửi tin nhắn & nhận phản hồi từ Adaptive Cache / Gemini AI
  router.post('/message', async (req, res, next) => {
    try {
      const {
        sessionId,
        userMessage,
        history = [],
        userId = null,
        userEmail = null,
        userName = null,
        userRole = null
      } = req.body;

      if (!userMessage || !userMessage.trim()) {
        return res.status(400).json({ ok: false, message: 'Nội dung tin nhắn không được để trống' });
      }

      const activeSessionId = sessionId || 'session_' + Date.now();
      const effectiveUserId = userId || extractUserFromRequest(req)?.id || extractUserFromRequest(req)?._id || null;
      const effectiveUserEmail = userEmail || extractUserFromRequest(req)?.email || null;
      const effectiveUserName = userName || extractUserFromRequest(req)?.name || null;
      const effectiveUserRole = userRole || extractUserFromRequest(req)?.role || null;

      // 1. Trích xuất Bộ nhớ Ngữ cảnh Người dùng (User Memory & History Context)
      let userMemory = null;
      if (effectiveUserId || effectiveUserEmail) {
        try {
          // Lấy lịch sử đặt phòng trước đó của user
          let pastBookings = [];
          if (bookings) {
            const bookingFilter = [];
            if (effectiveUserId) {
              bookingFilter.push({ userId: effectiveUserId }, { 'booker.id': effectiveUserId });
            }
            if (effectiveUserEmail) {
              bookingFilter.push(
                { userEmail: effectiveUserEmail },
                { email: effectiveUserEmail },
                { 'booker.email': effectiveUserEmail }
              );
            }
            if (bookingFilter.length > 0) {
              pastBookings = await bookings
                .find({ $or: bookingFilter })
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray();
            }
          }

          // Lấy lịch sử các phiên chat trước để nhận biết sở thích
          let pastSessions = [];
          if (chatSessions) {
            const sessionFilter = [];
            if (effectiveUserId) sessionFilter.push({ userId: effectiveUserId });
            if (effectiveUserEmail) sessionFilter.push({ userEmail: effectiveUserEmail });
            if (sessionFilter.length > 0) {
              pastSessions = await chatSessions
                .find({
                  sessionId: { $ne: activeSessionId },
                  $or: sessionFilter
                })
                .sort({ updatedAt: -1 })
                .limit(4)
                .toArray();
            }
          }

          const preferredSpaces = new Set();
          pastBookings.forEach(b => {
            const rName = b.spaceName || b.roomName || b.name;
            if (rName) preferredSpaces.add(rName);
          });

          pastSessions.forEach(s => {
            const msgs = s.messages || [];
            msgs.forEach(m => {
              if (Array.isArray(m.suggestedSpaces)) {
                m.suggestedSpaces.forEach(sp => {
                  if (sp.name) preferredSpaces.add(sp.name);
                });
              }
            });
          });

          userMemory = {
            name: effectiveUserName,
            email: effectiveUserEmail,
            role: effectiveUserRole,
            preferredSpaces: Array.from(preferredSpaces).slice(0, 5),
            pastBookingsCount: pastBookings.length,
            pastSessionsCount: pastSessions.length
          };
        } catch (memErr) {
          console.warn('[ChatbotRoutes] Lỗi trích xuất userMemory:', memErr.message);
        }
      }

      // 2. Lấy danh sách không gian thực tế từ MongoDB (lọc bỏ các phòng đã xóa)
      let allSpaces = [];
      if (spaces) {
        allSpaces = await spaces.find({
          $or: [
            { deletedAt: { $exists: false } },
            { deletedAt: null }
          ]
        }).toArray();
      }

      // 3. Gọi GeminiService (Tầng 1: Semantic Cache -> Tầng 2: Gemini RAG -> Tầng 3: Heuristic)
      const aiResponse = await geminiService.processChat({
        userMessage: userMessage.trim(),
        history,
        spaces: allSpaces,
        learnedIntents: chatLearnedIntents,
        userMemory
      });

      // 4. Khớp ID phòng trả về thành đối tượng Space đầy đủ để Frontend render trực tiếp
      const recommendedSpaces = [];
      if (Array.isArray(aiResponse.recommendedSpaceIds)) {
        for (const idOrCode of aiResponse.recommendedSpaceIds) {
          const match = allSpaces.find(s =>
            (s._id && s._id.toString() === idOrCode) ||
            s.code === idOrCode ||
            s.id === idOrCode
          );
          if (match) {
            const rawStatus = (match.status || 'AVAILABLE').toUpperCase();
            recommendedSpaces.push({
              id: match.code || (match._id ? match._id.toString() : match.id),
              name: match.name,
              building: match.building || match.location || 'Khuôn viên UEL',
              spaceType: match.spaceType || match.type || 'Không gian đa năng',
              capacity: match.capacity || 20,
              capacityText: `${match.capacity || 20} chỗ ngồi`,
              hourlyPrice: match.hourlyPrice || match.pricePerHour || 50000,
              status: rawStatus.toLowerCase(),
              statusText: rawStatus === 'AVAILABLE' ? 'Trống' : (rawStatus === 'OCCUPIED' ? 'Đang bận' : 'Bảo trì'),
              equipment: Array.isArray(match.equipment)
                ? match.equipment.map(e => typeof e === 'object' && e ? (e.name || e.label || e.item || '') : String(e)).filter(Boolean)
                : [],
              image: match.image || (match.images && match.images[0]) || '/images/spaces/space_a2_1_meeting_vip.jpg'
            });
          }
        }
      }

      // 5. Định hình tin nhắn Bot kèm thông tin đo lường tự học
      const botMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: aiResponse.replyText,
        timestamp: new Date(),
        suggestedSpaces: recommendedSpaces,
        quickActions: (aiResponse.quickPrompts || []).map(p => ({ label: p, query: p })),
        source: aiResponse.source,
        model: aiResponse.model,
        signature: aiResponse.signature || null,
        confidenceScore: aiResponse.confidenceScore || null,
        hitCount: aiResponse.hitCount || 1,
        latencyMs: aiResponse.latencyMs || 0,
        bookingProposal: aiResponse.bookingProposal || null
      };

      const userRecord = {
        id: 'usr-' + Date.now(),
        sender: 'user',
        text: userMessage.trim(),
        timestamp: new Date()
      };

      // 6. Lưu vết vào MongoDB collection chat_sessions gắn với User
      if (chatSessions) {
        await chatSessions.updateOne(
          { sessionId: activeSessionId },
          {
            $push: { messages: { $each: [userRecord, botMessage] } },
            $set: {
              userId: effectiveUserId,
              userEmail: effectiveUserEmail,
              userName: effectiveUserName,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
      }

      return res.json({
        ok: true,
        sessionId: activeSessionId,
        userMessage: userRecord,
        botReply: botMessage,
        source: aiResponse.source,
        model: aiResponse.model,
        signature: aiResponse.signature || null,
        latencyMs: aiResponse.latencyMs || 0
      });
    } catch (err) {
      next(err);
    }
  });

  // 2. POST /api/chatbot/feedback - Tiếp nhận phản hồi hành vi để tự học và tinh chỉnh trọng số gợi ý
  router.post('/feedback', async (req, res, next) => {
    try {
      const { signature, spaceId, action } = req.body;
      if (!action) {
        return res.status(400).json({ ok: false, message: 'Thiếu trường action (CLICK, BOOK_SUCCESS, THUMBS_UP, THUMBS_DOWN)' });
      }

      const result = await geminiService.applyFeedback({
        learnedIntents: chatLearnedIntents,
        signature,
        spaceId,
        action
      });

      return res.json({
        ok: true,
        message: 'Đã tiếp nhận phản hồi và tự động cập nhật trọng số tri thức thích ứng',
        result
      });
    } catch (err) {
      next(err);
    }
  });

  // 3. GET /api/chatbot/learned-intents - Xem danh sách các mẫu nhu cầu đã tự học và chỉ số hiệu năng
  router.get('/learned-intents', async (req, res, next) => {
    try {
      if (!chatLearnedIntents) {
        return res.json({ ok: true, total: 0, items: [] });
      }

      const items = await chatLearnedIntents
        .find({})
        .sort({ hitCount: -1, conversionCount: -1, updatedAt: -1 })
        .limit(50)
        .toArray();

      const totalHits = items.reduce((acc, cur) => acc + (cur.hitCount || 0), 0);
      const totalConversions = items.reduce((acc, cur) => acc + (cur.conversionCount || 0), 0);

      return res.json({
        ok: true,
        summary: {
          totalLearnedIntents: items.length,
          totalFastRetrievals: totalHits,
          totalConversions,
          conversionRate: totalHits > 0 ? ((totalConversions / totalHits) * 100).toFixed(1) + '%' : '0%'
        },
        items
      });
    } catch (err) {
      next(err);
    }
  });

  // 4. GET /api/chatbot/sessions - Lấy danh sách các cuộc trò chuyện để người dùng xem lại
  router.get('/sessions', async (req, res, next) => {
    try {
      if (!chatSessions) {
        return res.json({ ok: true, sessions: [] });
      }

      const effectiveUserId = req.query.userId || extractUserFromRequest(req)?.id || extractUserFromRequest(req)?._id || null;
      const effectiveUserEmail = req.query.userEmail || extractUserFromRequest(req)?.email || null;
      const sessionIdsParam = req.query.sessionIds;
      let filter = {};

      if (effectiveUserId || effectiveUserEmail) {
        const orClauses = [];
        if (effectiveUserId) orClauses.push({ userId: effectiveUserId });
        if (effectiveUserEmail) orClauses.push({ userEmail: effectiveUserEmail });
        filter = { $or: orClauses };
      } else if (sessionIdsParam) {
        const ids = sessionIdsParam.split(',').map(s => s.trim()).filter(Boolean);
        if (ids.length > 0) {
          filter = { sessionId: { $in: ids } };
        }
      }

      const list = await chatSessions
        .find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(30)
        .toArray();

      const formatted = list.map(s => {
        const msgs = s.messages || [];
        const firstUser = msgs.find(m => m.sender === 'user');
        const lastMsg = msgs[msgs.length - 1];
        return {
          sessionId: s.sessionId,
          title: firstUser ? (firstUser.text.length > 55 ? firstUser.text.substring(0, 52) + '...' : firstUser.text) : 'Tư vấn không gian UEL',
          preview: lastMsg ? (lastMsg.text ? (lastMsg.text.length > 70 ? lastMsg.text.substring(0, 67) + '...' : lastMsg.text) : '') : '',
          messageCount: msgs.length,
          updatedAt: s.updatedAt || s.createdAt || new Date()
        };
      });

      return res.json({ ok: true, sessions: formatted });
    } catch (err) {
      next(err);
    }
  });

  // 5. GET /api/chatbot/history - Lấy toàn bộ lịch sử trò chuyện của phiên
  router.get('/history', async (req, res, next) => {
    try {
      const sessionId = req.query.sessionId;
      if (!sessionId) {
        return res.json({ ok: true, messages: [] });
      }

      if (!chatSessions) {
        return res.json({ ok: true, messages: [] });
      }

      const session = await chatSessions.findOne({ sessionId });
      return res.json({
        ok: true,
        sessionId,
        messages: session ? session.messages || [] : []
      });
    } catch (err) {
      next(err);
    }
  });

  // 6. DELETE /api/chatbot/history - Xóa sạch lịch sử trò chuyện của phiên
  router.delete('/history', async (req, res, next) => {
    try {
      const sessionId = req.query.sessionId;
      if (!sessionId) {
        return res.status(400).json({ ok: false, message: 'Thiếu tham số sessionId' });
      }

      if (chatSessions) {
        await chatSessions.deleteOne({ sessionId });
      }

      return res.json({
        ok: true,
        message: 'Đã xóa toàn bộ lịch sử trò chuyện'
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { chatbotRoutes };
