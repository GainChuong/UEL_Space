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
    // 1. Pre-filtering RAG: Lọc thô thông minh từ toàn bộ cơ sở dữ liệu để chọn Top 15 ứng viên tối ưu nhất
    const topCandidateSpaces = this.retrieveTopRelevantSpaces(spaces, userMessage, 15);

    const spacesContext = topCandidateSpaces.map(s => ({
      id: s._id ? s._id.toString() : (s.code || s.id),
      code: s.code || s._id,
      name: s.name,
      building: s.building || s.location || 'Khuôn viên UEL',
      spaceType: s.spaceType || s.type || 'Không gian đa năng',
      capacity: s.capacity || 20,
      hourlyPrice: s.hourlyPrice || s.pricePerHour || 50000,
      status: s.status || 'AVAILABLE',
      equipment: Array.isArray(s.equipment)
        ? s.equipment.map(e => (typeof e === 'object' && e ? (e.name || e.label || e.item || '') : String(e))).filter(Boolean)
        : []
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
Bạn là Trợ lý AI chuyên nghiệp của Hệ thống Cho Thuê & Quản trị Không gian UEL Space (Hỗ trợ đa dạng nhu cầu: Phòng họp VIP, Hội trường sự kiện, Văn phòng doanh nghiệp, Studio sáng tạo, Co-working Hot Desk & Không gian tự học).
Nhiệm vụ của bạn:
1. Trả lời thân thiện, lịch sự, chuyên nghiệp bằng tiếng Việt.
2. Dưới đây là danh sách Top 15 không gian phù hợp nhất được thuật toán UEL Space trích xuất thông minh từ toàn bộ cơ sở dữ liệu dựa trên nhu cầu của người dùng:
${JSON.stringify(spacesContext, null, 2)}
3. Khớp nhu cầu người dùng (họp đối tác, hội thảo, đào tạo, làm việc nhóm, cá nhân, sự kiện, giá tiền, trang thiết bị, tình trạng phòng AVAILABLE/OCCUPIED):
   - Nếu phòng AVAILABLE: Tư vấn nhiệt tình và khuyến khích người dùng đặt giữ chỗ ngay.
   - Nếu phòng OCCUPIED: Nhắc nhở phòng đang có ca sử dụng, người dùng có thể tham khảo đặt cho ca/ngày khác hoặc chọn phòng AVAILABLE tương đương trong danh sách.
   - Nếu yêu cầu của người dùng không có phòng nào khớp 100% (ví dụ: cần 150 chỗ nhưng phòng lớn nhất là 100 chỗ): Giải thích minh bạch lý do và gợi ý phương án tốt nhất trong danh sách kèm giải pháp đề xuất.
4. BẮT BUỘC trả về kết quả định dạng JSON chuẩn (Structured Output) theo schema sau:
{
  "replyText": "Văn bản phản hồi tự nhiên, giải thích rõ lý do gợi ý phòng",
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
   * Trích xuất các tiêu chí tìm kiếm từ câu hỏi người dùng (sức chứa, mục đích, thiết bị, địa điểm, ngân sách)
   */
  extractSearchCriteria(userQuery = '') {
    const lower = userQuery.toLowerCase();
    const normalized = this.removeVietnameseTones(lower);

    // 1. Trích xuất sức chứa (Capacity)
    let minCapacity = null;
    const capMatch = lower.match(/(\d{1,3})\s*(?:người|nguoi|chỗ|cho|bàn|ban|slot|ghế|ghe|thành viên|thanh vien)/i);
    if (capMatch) {
      minCapacity = parseInt(capMatch[1], 10);
    } else if (normalized.includes('1 minh') || normalized.includes('ca nhan') || normalized.includes('mot minh') || normalized.includes('rieng tu')) {
      minCapacity = 1;
    } else if (normalized.includes('2 nguoi') || normalized.includes('hai nguoi') || normalized.includes('doi ban')) {
      minCapacity = 2;
    } else if (normalized.includes('nhom 4') || normalized.includes('nhom 5') || normalized.includes('nhom nho') || normalized.includes('nhom ban')) {
      minCapacity = 5;
    } else if (normalized.includes('nhom 10') || normalized.includes('10 nguoi')) {
      minCapacity = 10;
    } else if (normalized.includes('nhom 20') || normalized.includes('lop hoc')) {
      minCapacity = 20;
    } else if (normalized.includes('dong nguoi') || normalized.includes('hoi truong') || normalized.includes('su kien')) {
      minCapacity = 50;
    }

    // 2. Trích xuất loại không gian / mục đích sử dụng (Types & Intent)
    const types = [];
    if (/(họp|hop|meeting|vip|đối tác|ban giám đốc|thảo luận|hội ý)/i.test(lower)) {
      types.push('họp', 'meeting', 'vip');
    }
    if (/(tự học|tu hoc|yên tĩnh|yen tinh|đọc sách|doc sach|focus|ôn thi)/i.test(lower)) {
      types.push('tự học', 'study', 'focus', 'yên tĩnh');
    }
    if (/(hot desk|coworking|co-working|làm việc|lam viec|bàn linh hoạt|văn phòng chia sẻ)/i.test(lower)) {
      types.push('hot desk', 'coworking', 'linh hoạt');
    }
    if (/(pod|podcast|cách âm|cach am|studio|thu âm|ghi hình|livestream|media)/i.test(lower)) {
      types.push('pod', 'studio', 'cách âm', 'media', 'podcast');
    }
    if (/(hội trường|hoi truong|sự kiện|su kien|event|hall|workshop|seminar|hội thảo|gala|tiệc|tiec)/i.test(lower)) {
      types.push('hội trường', 'sự kiện', 'hall', 'event', 'workshop', 'gala');
    }
    if (/(lab|phòng lab|robotics|thực hành|tin học|máy tính)/i.test(lower)) {
      types.push('lab', 'robotics', 'thực hành');
    }

    // 3. Trích xuất trang thiết bị (Equipment)
    const equipment = [];
    if (/(màn hình|man hinh|tivi|tv|4k)/i.test(lower)) equipment.push('màn hình', '4k', 'tivi');
    if (/(máy chiếu|may chieu|projector)/i.test(lower)) equipment.push('máy chiếu', 'projector');
    if (/(bảng|bang|whiteboard|bút viết)/i.test(lower)) equipment.push('bảng', 'whiteboard');
    if (/(mic|micro|âm thanh|am thanh|loa|speaker)/i.test(lower)) equipment.push('mic', 'micro', 'âm thanh');
    if (/(cách âm|cach am|chống ồn)/i.test(lower)) equipment.push('cách âm');
    if (/(điều hòa|dieu hoa|máy lạnh|may lanh)/i.test(lower)) equipment.push('điều hòa', 'máy lạnh');

    // 4. Trích xuất địa điểm / tòa nhà (Locations)
    const locations = [];
    if (/(tòa a|toa a|block a|khu a)/i.test(lower)) locations.push('tòa a', 'khu a');
    if (/(tòa b|toa b|block b|khu b)/i.test(lower)) locations.push('tòa b', 'khu b');
    if (/(thư viện|thu vien|library)/i.test(lower)) locations.push('thư viện');
    if (/(thủ đức|thu duc|linh xuân|linh trung)/i.test(lower)) locations.push('thủ đức');
    if (/(quận 1|quan 1|trung tâm|q1)/i.test(lower)) locations.push('quận 1');

    // 5. Trích xuất ngân sách (Budget)
    let maxPrice = null;
    const priceMatch = lower.match(/(?:dưới|duoi|tối đa|toi da|khoảng|khoang|<)\s*(\d{1,3})(?:k|\.000|000)/i);
    if (priceMatch) {
      maxPrice = parseInt(priceMatch[1], 10) * 1000;
    } else if (normalized.includes('gia re') || normalized.includes('tiet kiem') || normalized.includes('sinh vien')) {
      maxPrice = 80000;
    }

    const isBookingIntent = /(đặt phòng|dat phong|book|giữ chỗ|giu cho|thuê ngay|thue ngay)/i.test(lower);

    return {
      minCapacity,
      types,
      equipment,
      locations,
      maxPrice,
      isBookingIntent
    };
  }

  /**
   * Pre-filtering RAG: Lọc thô và xếp hạng Top 15 không gian thích hợp nhất từ toàn bộ cơ sở dữ liệu
   */
  retrieveTopRelevantSpaces(spaces = [], userQuery = '', limit = 15) {
    if (!Array.isArray(spaces) || spaces.length === 0) {
      return [];
    }

    const criteria = this.extractSearchCriteria(userQuery);

    // 1. Lọc bỏ các phòng không hợp lệ:
    // - Đã xóa (soft-deleted deletedAt != null)
    // - Đang bảo trì (MAINTENANCE) theo quyết định Edge Case
    const validSpaces = spaces.filter(s => {
      if (s.deletedAt) return false;
      const statusUpper = (s.status || '').toUpperCase();
      if (statusUpper === 'MAINTENANCE' || statusUpper === 'BẢO TRÌ') return false;
      return true;
    });

    if (validSpaces.length <= limit) {
      return validSpaces;
    }

    // 2. Chấm điểm mức độ phù hợp (Multi-Criteria Scoring Engine)
    const scoredSpaces = validSpaces.map(s => {
      let score = 10; // Điểm cơ sở
      const statusUpper = (s.status || '').toUpperCase();

      // Quyết định Edge Case: Ưu tiên AVAILABLE (+40), giữ OCCUPIED (+10) ở nhóm điểm thấp hơn
      if (statusUpper === 'AVAILABLE') {
        score += 40;
      } else if (statusUpper === 'OCCUPIED') {
        score += 10;
      }

      // Sức chứa (Capacity)
      const cap = Number(s.capacity) || 0;
      if (criteria.minCapacity !== null) {
        if (cap >= criteria.minCapacity) {
          const diff = cap - criteria.minCapacity;
          if (diff <= 5) {
            score += 50; // Vừa vặn hoàn hảo, tiết kiệm chi phí
          } else if (diff <= 15) {
            score += 35; // Rất phù hợp
          } else if (diff <= 40) {
            score += 20; // Đủ sức chứa
          } else {
            score += 10; // Phòng lớn hơn nhiều, vẫn có thể dùng
          }
        } else {
          // Quyết định Edge Case: Relaxed Ranking (Mềm dẻo)
          // Nếu không có phòng đủ sức chứa, phạt dựa trên tỷ lệ thiếu hụt: phòng càng gần mức yêu cầu thì nhận phạt càng ít
          const missingRatio = (criteria.minCapacity - cap) / criteria.minCapacity; // 0.1 -> 0.99
          score -= Math.round(15 + missingRatio * 45); // Phạt từ -15 (gần đủ) đến -60 (quá nhỏ)
        }
      } else {
        // Nếu người dùng không chỉ định số người cụ thể, ưu tiên nhẹ phòng phổ thông 6 - 30 chỗ
        if (cap >= 6 && cap <= 30) {
          score += 10;
        }
      }

      // Loại phòng / Mục đích sử dụng (Space Type / Name / Description)
      const searchBlob = `${s.name || ''} ${s.spaceType || ''} ${s.categoryName || ''} ${s.description || ''}`.toLowerCase();
      const normalizedBlob = this.removeVietnameseTones(searchBlob);

      if (criteria.types.length > 0) {
        let typeMatched = false;
        for (const t of criteria.types) {
          const normT = this.removeVietnameseTones(t);
          if (searchBlob.includes(t) || normalizedBlob.includes(normT)) {
            typeMatched = true;
            break;
          }
        }
        if (typeMatched) {
          score += 35;
        }
      }

      // Trang thiết bị (Equipment)
      if (criteria.equipment.length > 0 && Array.isArray(s.equipment)) {
        let eqMatchCount = 0;
        const eqStrings = s.equipment.map(e => {
          if (typeof e === 'object' && e) return (e.name || e.label || e.item || '').toLowerCase();
          return String(e).toLowerCase();
        });
        const eqBlob = eqStrings.join(' ');
        const normalizedEqBlob = this.removeVietnameseTones(eqBlob);

        for (const eq of criteria.equipment) {
          const normEq = this.removeVietnameseTones(eq);
          if (eqBlob.includes(eq) || normalizedEqBlob.includes(normEq)) {
            eqMatchCount++;
          }
        }
        score += Math.min(eqMatchCount * 20, 60); // Tối đa +60 điểm cho thiết bị
      }

      // Tòa nhà / Khu vực (Building / Location)
      if (criteria.locations.length > 0) {
        const locBlob = `${s.building || ''} ${s.location || ''} ${s.address || ''}`.toLowerCase();
        const normalizedLocBlob = this.removeVietnameseTones(locBlob);
        let locMatched = false;
        for (const loc of criteria.locations) {
          const normLoc = this.removeVietnameseTones(loc);
          if (locBlob.includes(loc) || normalizedLocBlob.includes(normLoc)) {
            locMatched = true;
            break;
          }
        }
        if (locMatched) {
          score += 30;
        }
      }

      // Ngân sách / Mức giá (Price / Budget)
      const price = Number(s.hourlyPrice || s.pricePerHour) || 50000;
      if (criteria.maxPrice !== null) {
        if (price <= criteria.maxPrice) {
          score += 25;
        } else if (price > criteria.maxPrice * 1.4) {
          score -= 20;
        }
      }

      // Tie-breaker nhẹ: ưu tiên phòng có mức giá hợp lý hơn
      score += (1 - Math.min(price, 1000000) / 1000000) * 5;

      return {
        ...s,
        _ragScore: score
      };
    });

    // Sắp xếp giảm dần theo điểm và lấy Top 15
    scoredSpaces.sort((a, b) => b._ragScore - a._ragScore);
    return scoredSpaces.slice(0, limit);
  }

  /**
   * Local Heuristics Fallback Engine khi API offline hoặc lỗi
   * Vận hành trực tiếp trên tập Top 15 không gian đã được Pre-filtering RAG xếp hạng
   */
  runLocalHeuristicFallback(userQuery, spacesContext) {
    const criteria = this.extractSearchCriteria(userQuery);
    const wantsBook = criteria.isBookingIntent;

    // Chọn ra 2-3 phòng điểm cao nhất và đang AVAILABLE (hoặc phòng đầu danh sách)
    let availableMatches = spacesContext.filter(s => s.status === 'AVAILABLE');
    if (availableMatches.length === 0) {
      availableMatches = spacesContext;
    }
    const topMatches = availableMatches.slice(0, 3);
    const recommendedSpaceIds = topMatches.map(m => m.id || m.code || (m._id ? m._id.toString() : ''));

    let replyText = '';
    if (wantsBook && topMatches.length > 0) {
      replyText = `Tôi đã tìm được không gian **${topMatches[0].name}** tại **${topMatches[0].building || 'Khuôn viên UEL'}** (${topMatches[0].capacity} chỗ ngồi) hoàn toàn phù hợp để bạn đặt giữ chỗ ngay:`;
    } else if (criteria.minCapacity) {
      replyText = `Dựa trên yêu cầu quy mô khoảng **${criteria.minCapacity} người**, đây là các không gian tối ưu nhất được chọn lọc từ toàn bộ hệ thống đang sẵn sàng phục vụ bạn:`;
    } else if (criteria.equipment.length > 0) {
      replyText = `Dưới đây là các không gian **được trang bị đầy đủ ${criteria.equipment.join(', ')}** với đường truyền internet tốc độ cao:`;
    } else if (criteria.types.includes('tự học') || criteria.types.includes('yên tĩnh')) {
      replyText = `Gợi ý các không gian **yên tĩnh, đầy đủ tiện ích và chi phí tối ưu nhất** dành cho bạn:`;
    } else {
      replyText = `Dưới đây là các **không gian cho thuê tiêu biểu và phù hợp nhất** được chọn lọc từ cơ sở dữ liệu UEL Space:`;
    }

    const firstId = topMatches[0] ? (topMatches[0].id || topMatches[0].code || (topMatches[0]._id ? topMatches[0]._id.toString() : '')) : '';
    return {
      replyText,
      intent: wantsBook ? 'BOOK_SPACE' : 'RECOMMEND_SPACE',
      recommendedSpaceIds,
      quickPrompts: [
        'Phòng họp VIP có máy chiếu',
        'Bàn làm việc Hot Desk / Coworking',
        'Focus Pod cách âm riêng tư'
      ],
      bookingProposal: wantsBook && topMatches.length > 0 ? {
        spaceId: firstId,
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
