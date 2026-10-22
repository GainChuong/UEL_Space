/**
 * UEL Space - Chatbot Routes
 * Cung cấp API tiếp nhận tin nhắn, gọi Gemini AI, tra cứu không gian và quản lý lịch sử hội thoại
 */

const express = require('express');
const { geminiService } = require('./gemini.service');
const { ObjectId } = require('mongodb');

function chatbotRoutes({ spaces, chatSessions }) {
  const router = express.Router();

  // 1. POST /api/chatbot/message - Gửi tin nhắn & nhận phản hồi từ Gemini AI
  router.post('/message', async (req, res, next) => {
    try {
      const { sessionId, userMessage, history = [] } = req.body;
      if (!userMessage || !userMessage.trim()) {
        return res.status(400).json({ ok: false, message: 'Nội dung tin nhắn không được để trống' });
      }

      const activeSessionId = sessionId || 'session_' + Date.now();
      const currentUserId = req.session?.user?.id || req.session?.user?._id || null;

      // 1. Lấy danh sách không gian thực tế từ MongoDB (lọc bỏ các phòng đã xóa)
      let allSpaces = [];
      if (spaces) {
        allSpaces = await spaces.find({
          $or: [
            { deletedAt: { $exists: false } },
            { deletedAt: null }
          ]
        }).toArray();
      }

      // 2. Gọi GeminiService (kèm Pre-filtering RAG Context và Local Heuristic Fallback)
      const aiResponse = await geminiService.processChat({
        userMessage: userMessage.trim(),
        history,
        spaces: allSpaces
      });

      // 3. Khớp ID phòng trả về thành đối tượng Space đầy đủ để Frontend render trực tiếp
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

      // 4. Định hình tin nhắn Bot
      const botMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: aiResponse.replyText,
        timestamp: new Date(),
        suggestedSpaces: recommendedSpaces,
        quickActions: (aiResponse.quickPrompts || []).map(p => ({ label: p, query: p })),
        source: aiResponse.source,
        model: aiResponse.model,
        bookingProposal: aiResponse.bookingProposal || null
      };

      const userRecord = {
        id: 'usr-' + Date.now(),
        sender: 'user',
        text: userMessage.trim(),
        timestamp: new Date()
      };

      // 5. Lưu vết vào MongoDB collection chat_sessions
      if (chatSessions) {
        await chatSessions.updateOne(
          { sessionId: activeSessionId },
          {
            $push: { messages: { $each: [userRecord, botMessage] } },
            $set: {
              userId: currentUserId,
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
        model: aiResponse.model
      });
    } catch (err) {
      next(err);
    }
  });

  // 2. GET /api/chatbot/sessions - Lấy danh sách các cuộc trò chuyện để người dùng xem lại
  router.get('/sessions', async (req, res, next) => {
    try {
      if (!chatSessions) {
        return res.json({ ok: true, sessions: [] });
      }

      const currentUserId = req.session?.user?.id || req.session?.user?._id || null;
      const sessionIdsParam = req.query.sessionIds;
      let filter = {};

      if (currentUserId) {
        filter = { userId: currentUserId };
      } else if (sessionIdsParam) {
        const ids = sessionIdsParam.split(',').map(s => s.trim()).filter(Boolean);
        if (ids.length > 0) {
          filter = { sessionId: { $in: ids } };
        }
      }

      const list = await chatSessions
        .find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(25)
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

  // 3. GET /api/chatbot/history - Lấy toàn bộ lịch sử trò chuyện của phiên
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

  // 3. DELETE /api/chatbot/history - Xóa sạch lịch sử trò chuyện của phiên
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
