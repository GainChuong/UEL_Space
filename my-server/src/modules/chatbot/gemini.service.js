/**
 * UEL Space - Gemini AI Chatbot Service
 * Tích hợp Google Gemini AI (Interactions API / generateContent) với JSON Structured Outputs,
 * Context RAG (dữ liệu phòng thực tế từ MongoDB) và Local Heuristic Fallback Engine.
 */

const { env } = require('../../config/env');

class GeminiService {
  constructor() {
    this.apiKey = env.geminiApiKey || '';
    this.model = env.geminiModel || 'gemini-3.8-flash';
    // Circuit Breaker: nếu API gặp lỗi 403 / 429 hoặc offline, tạm ngừng gọi trong 5 phút để tránh nghẽn
    this.circuitBreakerUntil = 0;
    this.failCount = 0;
  }

  /**
   * Xử lý tin nhắn người dùng kết hợp ngữ cảnh không gian và lịch sử trò chuyện
   */
  async processChat({ userMessage, history = [], spaces = [] }) {
    // 1. Chuẩn bị ngữ cảnh RAG về các không gian đang có trong hệ thống
    const spacesContext = spaces.slice(0, 15).map(s => ({
      id: s._id ? s._id.toString() : s.code,
      code: s.code || s._id,
      name: s.name,
      building: s.building || s.location || 'Khuôn viên UEL',
      spaceType: s.spaceType || s.type || 'Không gian đa năng',
      capacity: s.capacity || 20,
      hourlyPrice: s.hourlyPrice || s.pricePerHour || 50000,
      status: s.status || 'AVAILABLE',
      equipment: Array.isArray(s.equipment) ? s.equipment : []
    }));

    // 2. Thử gọi Google Gemini API nếu còn khả dụng và chưa bị ngắt bởi Circuit Breaker
    const now = Date.now();
    if (this.apiKey && now >= this.circuitBreakerUntil) {
      try {
        const geminiResult = await this.callGeminiWithTimeout({
          userMessage,
          history,
          spacesContext,
          timeoutMs: 3000 // Tối ưu thời gian chờ tối đa 3 giây
        });

        if (geminiResult && geminiResult.replyText) {
          this.failCount = 0;
          return {
            ...geminiResult,
            source: 'gemini',
            model: this.model
          };
        }
      } catch (err) {
        this.failCount++;
        // Kích hoạt Circuit Breaker: Nếu bị từ chối truy cập (403/404) hoặc lỗi 2 lần liên tiếp -> cooldown 5 phút
        const isAccessDenied = err.message.includes('denied') || err.message.includes('403') || err.message.includes('404');
        if (isAccessDenied || this.failCount >= 2) {
          this.circuitBreakerUntil = Date.now() + 5 * 60 * 1000;
          console.warn(`[GeminiService] Kích hoạt Circuit Breaker trong 5 phút (Lỗi: ${err.message}). Chuyển sang Ultra-Fast Heuristic Engine.`);
        } else {
          console.warn('[GeminiService] Gemini API gặp sự cố, tự động kích hoạt Local Fallback:', err.message);
        }
      }
    }

    // 3. Fallback sang Local Heuristic Engine thông minh siêu tốc (<5ms)
    const fallbackResult = this.runLocalHeuristicFallback(userMessage, spacesContext);
    return {
      ...fallbackResult,
      source: 'local_fallback',
      model: 'uel-rule-engine-v2'
    };
  }

  /**
   * Gọi Gemini API có kiểm soát thời gian chờ (Timeout)
   */
  async callGeminiWithTimeout({ userMessage, history, spacesContext, timeoutMs = 8000 }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Chuẩn hóa lịch sử hội thoại (giữ tối đa 10 tin nhắn gần nhất)
      const recentHistory = (history || []).slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || '' }]
      }));

      const systemInstruction = `
Bạn là Trợ lý AI chuyên nghiệp của Hệ thống Quản lý & Chia sẻ Không gian UEL Space (Trường Đại học Kinh tế - Luật, ĐHQG-HCM).
Nhiệm vụ của bạn:
1. Trả lời thân thiện, lịch sự, chuyên nghiệp bằng tiếng Việt.
2. Dựa vào danh sách không gian thực tế sau đây để tư vấn chính xác:
${JSON.stringify(spacesContext, null, 2)}
3. Khớp nhu cầu người dùng (số người, loại phòng họp/tự học/workshop, tiện ích màn hình/bảng/micro, giá tiền).
4. BẮT BUỘC trả về kết quả định dạng JSON chuẩn (Structured Output) theo schema sau:
{
  "replyText": "Văn bản phản hồi tự nhiên, giải thích lý do gợi ý phòng",
  "intent": "RECOMMEND_SPACE" hoặc "BOOK_SPACE" hoặc "VIEW_SCHEDULE" hoặc "GENERAL_QA",
  "recommendedSpaceIds": ["id_phong_khop_1", "id_phong_khop_2"],
  "quickPrompts": ["Gợi ý nhanh 1", "Gợi ý nhanh 2", "Gợi ý nhanh 3"],
  "bookingProposal": null hoặc { "spaceId": "id_phong", "spaceName": "tên phòng", "durationHours": 2 }
}
`;

      // 1. Thử gọi Interactions API trước
      try {
        const interactionRes = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          },
          body: JSON.stringify({
            model: this.model,
            input: `${systemInstruction}\n\nNgười dùng hỏi: "${userMessage}"`,
            response_format: {
              type: 'text',
              mime_type: 'application/json'
            }
          }),
          signal: controller.signal
        });

        if (interactionRes.ok) {
          const data = await interactionRes.json();
          const rawText = data.output_text || (data.outputs && data.outputs[0]?.text);
          if (rawText) {
            return this.parseStructuredJson(rawText);
          }
        }
      } catch (e) {
        // Tiếp tục thử generateContent
      }

      // 2. Thử gọi generateContent API (chuẩn Google GenAI REST)
      const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const contents = [
        ...recentHistory,
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nNgười dùng hỏi: "${userMessage}"` }]
        }
      ];

      const generateRes = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      if (generateRes.ok) {
        const genData = await generateRes.json();
        const candidateText = genData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return this.parseStructuredJson(candidateText);
        }
      } else {
        const errJson = await generateRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${generateRes.status}`);
      }

      throw new Error('Không nhận được phản hồi hợp lệ từ Gemini');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Phân tích và làm sạch chuỗi JSON trả về từ Gemini
   */
  parseStructuredJson(rawText) {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(clean);
      return {
        replyText: parsed.replyText || 'Tôi đã tìm thấy không gian phù hợp cho bạn.',
        intent: parsed.intent || 'RECOMMEND_SPACE',
        recommendedSpaceIds: Array.isArray(parsed.recommendedSpaceIds) ? parsed.recommendedSpaceIds : [],
        quickPrompts: Array.isArray(parsed.quickPrompts) ? parsed.quickPrompts : [
          'Phòng họp 10 người có máy chiếu',
          'Chỗ ngồi tự học yên tĩnh giá rẻ',
          'Meeting Pod cách âm cá nhân'
        ],
        bookingProposal: parsed.bookingProposal || null
      };
    } catch (err) {
      return {
        replyText: rawText,
        intent: 'GENERAL_QA',
        recommendedSpaceIds: [],
        quickPrompts: ['Tìm phòng họp', 'Tìm bàn tự học', 'Xem bảng giá'],
        bookingProposal: null
      };
    }
  }

  /**
   * Local Heuristics Fallback Engine khi API offline hoặc lỗi
   */
  runLocalHeuristicFallback(userQuery, spacesContext) {
    const lower = userQuery.toLowerCase();
    const normalized = this.removeVietnameseTones(lower);

    // Trích xuất sức chứa
    let reqCapacity = null;
    const matchCap = lower.match(/(\d{1,3})\s*(?:nguoi|ban|cho|slot)/i);
    if (matchCap) {
      reqCapacity = parseInt(matchCap[1], 10);
    } else if (normalized.includes('1 minh') || normalized.includes('ca nhan')) {
      reqCapacity = 1;
    } else if (normalized.includes('nhom 4-6') || normalized.includes('nhom 5')) {
      reqCapacity = 5;
    }

    // Ý định phân loại
    const wantsMeeting = normalized.includes('hop') || normalized.includes('meeting') || normalized.includes('vip');
    const wantsQuiet = normalized.includes('tu hoc') || normalized.includes('yen tinh') || normalized.includes('hot desk') || normalized.includes('coworking');
    const wantsPod = normalized.includes('pod') || normalized.includes('cach am');
    const wantsDisplay = normalized.includes('man hinh') || normalized.includes('may chieu') || normalized.includes('4k');
    const wantsBook = normalized.includes('dat phong') || normalized.includes('giu cho') || normalized.includes('book');

    // Chấm điểm các phòng
    const scored = spacesContext.map(s => {
      let score = 0;
      if (s.status === 'AVAILABLE' || s.status === 'available') score += 40;

      if (reqCapacity !== null) {
        if (s.capacity >= reqCapacity) {
          const diff = s.capacity - reqCapacity;
          score += diff <= 5 ? 40 : 20;
        } else {
          score -= 30;
        }
      }

      if (wantsMeeting && (s.spaceType.includes('họp') || s.spaceType.includes('VIP') || s.name.includes('VIP'))) score += 30;
      if (wantsQuiet && (s.spaceType.includes('tự học') || s.name.includes('Hot Desk') || s.spaceType.includes('Bàn'))) score += 30;
      if (wantsPod && (s.spaceType.includes('Pod') || s.name.includes('Pod'))) score += 35;
      if (wantsDisplay && s.equipment.some(e => e.toLowerCase().includes('màn hình') || e.toLowerCase().includes('4k'))) score += 20;

      return { ...s, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, 2);
    const recommendedSpaceIds = topMatches.map(m => m.id);

    let replyText = '';
    if (wantsBook && topMatches.length > 0) {
      replyText = `Tôi đã tìm được không gian **${topMatches[0].name}** tại **${topMatches[0].building}** hoàn toàn phù hợp để bạn đặt giữ chỗ ngay:`;
    } else if (reqCapacity) {
      replyText = `Dựa trên yêu cầu nhóm khoảng **${reqCapacity} người**, đây là các không gian tối ưu nhất đang sẵn sàng phục vụ bạn:`;
    } else if (wantsDisplay) {
      replyText = `Dưới đây là các không gian **có sẵn màn hình 4K / máy chiếu sắc nét** và đường truyền ổn định:`;
    } else if (wantsQuiet) {
      replyText = `Gợi ý các không gian **tự học yên tĩnh, đầy đủ tiện ích và chi phí tối ưu nhất** cho sinh viên:`;
    } else {
      replyText = `Dưới đây là các **không gian tiêu biểu và đang trống** lý tưởng cho nhu cầu của bạn:`;
    }

    return {
      replyText,
      intent: wantsBook ? 'BOOK_SPACE' : 'RECOMMEND_SPACE',
      recommendedSpaceIds,
      quickPrompts: [
        'Phòng họp 10 người có máy chiếu',
        'Bàn làm việc Hot Desk tự học',
        'Focus Pod cách âm 4 người'
      ],
      bookingProposal: wantsBook && topMatches.length > 0 ? {
        spaceId: topMatches[0].id,
        spaceName: topMatches[0].name,
        durationHours: 2
      } : null
    };
  }

  removeVietnameseTones(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}

module.exports = { GeminiService, geminiService: new GeminiService() };
