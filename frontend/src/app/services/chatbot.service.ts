import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, timeout } from 'rxjs';
import { SERVER_IMAGES_LINK, SERVER_BASE_URL } from './api-config';
import { GoogleCalendarService } from './google-calendar.service';

export interface ChatbotSpace {
  id: string;
  name: string;
  building: string;
  spaceType: string;
  capacity: number;
  capacityText: string;
  areaSize?: number;
  hourlyPrice: number;
  status: 'available' | 'in-use' | 'reserved' | 'maintenance' | 'restricted';
  statusText: string;
  equipment: string[];
  image: string;
  score?: number;
  matchReason?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestedSpaces?: ChatbotSpace[];
  quickActions?: { label: string; query: string; icon?: string }[];
  bookingSummary?: {
    bookingCode: string;
    spaceName: string;
    building: string;
    date: string;
    timeSlot: string;
    durationHours: number;
    amount: number;
    status: 'CONFIRMED' | 'PENDING_PAYMENT';
    googleCalendarUrl?: string;
  };
  isTyping?: boolean;
  source?: 'gemini' | 'local_fallback';
  model?: string;
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  preview: string;
  messageCount: number;
  updatedAt: string | Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private http = inject(HttpClient);
  private googleCalendarService = inject(GoogleCalendarService);

  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();

  private isThinkingSubject = new BehaviorSubject<boolean>(false);
  public isThinking$: Observable<boolean> = this.isThinkingSubject.asObservable();

  private currentModelSubject = new BehaviorSubject<string>('gemini-3.8-flash');
  public currentModel$: Observable<string> = this.currentModelSubject.asObservable();

  private currentSourceSubject = new BehaviorSubject<'gemini' | 'local_fallback'>('gemini');
  public currentSource$: Observable<'gemini' | 'local_fallback'> = this.currentSourceSubject.asObservable();

  // Khóa định danh phiên trò chuyện lưu trữ trên MongoDB Atlas & LocalStorage
  public sessionId = '';

  private defaultQuickPrompts = [
    { icon: 'meeting', label: 'Phòng họp 10 người có máy chiếu', query: 'Tìm phòng họp khoảng 10 người có máy chiếu và màn hình 4K' },
    { icon: 'study', label: 'Chỗ ngồi tự học yên tĩnh giá rẻ', query: 'Gợi ý bàn tự học yên tĩnh cho sinh viên giá tiết kiệm' },
    { icon: 'pod', label: 'Focus Pod cách âm cá nhân', query: 'Tôi cần một Focus Pod cách âm để gọi điện và phỏng vấn trực tuyến' },
    { icon: 'event', label: 'Hội trường sự kiện 100 khách', query: 'Tìm hội trường tổ chức sự kiện workshop khoảng 100 người' }
  ];

  // Kho dữ liệu không gian cục bộ (Dùng cho Local Heuristics Fallback khi mất mạng)
  private fallbackSpacesDatabase: ChatbotSpace[] = [
    {
      id: 'b1-104',
      name: 'Boardroom VIP B1',
      building: 'Tòa B1 - Tầng 1 (UEL)',
      spaceType: 'Phòng họp VIP',
      capacity: 24,
      capacityText: '24 chỗ ngồi',
      hourlyPrice: 250000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Micro hội nghị', 'Điều hòa 2 chiều'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a2_1_meeting_vip.jpg'
    },
    {
      id: 'a2-1',
      name: 'Private Suite A2',
      building: 'Tòa A2 - Tầng 2 (UEL)',
      spaceType: 'Văn phòng riêng',
      capacity: 12,
      capacityText: '12 người',
      hourlyPrice: 180000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Điều hòa', 'Cáp quang 1Gbps', 'Bảng kính', 'Màn hình 4K'],
      image: SERVER_IMAGES_LINK + 'spaces/space_b2_101_private_office.jpg'
    },
    {
      id: 'thu-vien-2',
      name: 'Khu Hot Desk Coworking',
      building: 'Thư viện Trung tâm UEL - Tầng 2',
      spaceType: 'Bàn làm việc linh hoạt',
      capacity: 60,
      capacityText: '60 chỗ ngồi',
      hourlyPrice: 35000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Cáp quang 1Gbps', 'Điều hòa', 'Ổ cắm điện', 'Tủ locker', 'Không gian yên tĩnh'],
      image: SERVER_IMAGES_LINK + 'spaces/space_thu_vien_coworking.jpg'
    },
    {
      id: 'a3-301',
      name: 'Hội trường Event & Workshop A3',
      building: 'Tòa A3 Multiplex - Tầng 3 (UEL)',
      spaceType: 'Không gian sự kiện',
      capacity: 100,
      capacityText: '100 khách',
      hourlyPrice: 450000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Màn hình 4K', 'Âm thanh vòm', 'Cáp quang 1Gbps', 'Sân khấu'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a3_301_event_hall.jpg'
    },
    {
      id: 'choi-1',
      name: 'Focus Pod 1 Cách Âm',
      building: 'Chòi Tự Học Suối Nhum (UEL)',
      spaceType: 'Meeting Pod',
      capacity: 4,
      capacityText: '4 người',
      hourlyPrice: 70000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Cách âm chuẩn', 'Màn hình họp trực tuyến', 'Cáp quang 1Gbps', 'Điều hòa cá nhân'],
      image: SERVER_IMAGES_LINK + 'spaces/space_choi_1_focus_pod.jpg'
    }
  ];

  constructor() {
    this.initSession();
    this.loadSessionHistory();
  }

  /**
   * Khởi tạo Session ID cố định trong phiên làm việc
   */
  private initSession(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      let savedSession = localStorage.getItem('uel_space_chat_session_id');
      if (!savedSession) {
        savedSession = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('uel_space_chat_session_id', savedSession);
      }
      this.sessionId = savedSession;
    } else {
      this.sessionId = 'sess_' + Date.now();
    }
  }

  /**
   * Tải lịch sử tin nhắn từ Backend MongoDB hoặc LocalStorage fallback
   */
  public async loadSessionHistory(): Promise<void> {
    try {
      const url = `${SERVER_BASE_URL}/api/chatbot/history?sessionId=${encodeURIComponent(this.sessionId)}`;
      const res: any = await firstValueFrom(this.http.get(url));

      if (res && res.ok && Array.isArray(res.messages) && res.messages.length > 0) {
        const parsedMsgs: ChatMessage[] = res.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        this.messagesSubject.next(parsedMsgs);
        return;
      }
    } catch (e) {
      console.warn('[ChatbotService] Không thể tải lịch sử từ Backend, kiểm tra LocalStorage...', e);
    }

    // Kiểm tra LocalStorage nếu Backend chưa có lịch sử
    if (typeof window !== 'undefined' && window.localStorage) {
      const localHistory = localStorage.getItem('uel_space_chat_messages_' + this.sessionId);
      if (localHistory) {
        try {
          const parsed = JSON.parse(localHistory).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          if (parsed.length > 0) {
            this.messagesSubject.next(parsed);
            return;
          }
        } catch (err) {}
      }
    }

    // Nếu hoàn toàn mới, nạp tin nhắn Chào mừng
    this.setInitialWelcomeMessage();
  }

  /**
   * Thiết lập lời chào mở đầu thân thiện, chuyên nghiệp của Trợ lý AI UEL Space
   */
  public setInitialWelcomeMessage(): void {
    const welcomeMsg: ChatMessage = {
      id: 'welcome-init',
      sender: 'bot',
      text: `Xin chào! Tôi là **Trợ lý Không gian UEL Space**, luôn sẵn sàng hỗ trợ bạn:\n\n- Tìm nhanh phòng họp, chòi tự học, hội trường phù hợp sĩ số & tiện ích.\n- Tra cứu lịch trống, đối chiếu bảng giá và hỗ trợ giữ chỗ trong 1 chạm.\n- Tự động đồng bộ Google Calendar và hướng dẫn thanh toán MoMo tiện lợi.\n\nBạn đang cần tìm không gian cho bao nhiêu người hoặc có nhu cầu đặc biệt nào không?`,
      timestamp: new Date(),
      quickActions: this.defaultQuickPrompts,
      source: 'gemini',
      model: 'uel-assistant'
    };
    this.messagesSubject.next([welcomeMsg]);
  }

  public toggleChat(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  public openChat(): void {
    this.isOpenSubject.next(true);
  }

  public closeChat(): void {
    this.isOpenSubject.next(false);
  }

  /**
   * Khởi động một cuộc trò chuyện hoàn toàn mới
   */
  public startNewSession(): void {
    const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    this.sessionId = newSessionId;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('uel_space_chat_session_id', newSessionId);
    }
    this.setInitialWelcomeMessage();
  }

  /**
   * Lấy danh sách các cuộc hội thoại đã lưu để người dùng xem lại
   */
  public async getSessionsList(): Promise<ChatSessionSummary[]> {
    let localIndex: ChatSessionSummary[] = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem('uel_space_chat_sessions_index');
        if (raw) localIndex = JSON.parse(raw);
      } catch (e) {}
    }

    try {
      const sessionIds = localIndex.map(s => s.sessionId).join(',');
      const url = `${SERVER_BASE_URL}/api/chatbot/sessions?sessionIds=${encodeURIComponent(sessionIds)}`;
      const res: any = await firstValueFrom(this.http.get(url));
      if (res && res.ok && Array.isArray(res.sessions) && res.sessions.length > 0) {
        const map = new Map<string, ChatSessionSummary>();
        localIndex.forEach(s => map.set(s.sessionId, s));
        res.sessions.forEach((s: any) => map.set(s.sessionId, { ...s, updatedAt: new Date(s.updatedAt) }));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('uel_space_chat_sessions_index', JSON.stringify(merged));
        }
        return merged;
      }
    } catch (e) {
      console.warn('[ChatbotService] Dùng danh sách phiên lưu cục bộ:', e);
    }

    return localIndex;
  }

  /**
   * Chuyển sang một phiên trò chuyện cũ để xem lại và tiếp tục chat
   */
  public async switchSession(targetSessionId: string): Promise<void> {
    if (!targetSessionId) return;
    this.sessionId = targetSessionId;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('uel_space_chat_session_id', targetSessionId);
    }
    await this.loadSessionHistory();
  }

  /**
   * Xóa một cuộc hội thoại cụ thể
   */
  public async deleteSession(targetSessionId: string): Promise<void> {
    try {
      const url = `${SERVER_BASE_URL}/api/chatbot/history?sessionId=${encodeURIComponent(targetSessionId)}`;
      await firstValueFrom(this.http.delete(url));
    } catch (err) {}

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('uel_space_chat_messages_' + targetSessionId);
      try {
        const raw = localStorage.getItem('uel_space_chat_sessions_index');
        if (raw) {
          const list: ChatSessionSummary[] = JSON.parse(raw);
          const filtered = list.filter(s => s.sessionId !== targetSessionId);
          localStorage.setItem('uel_space_chat_sessions_index', JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    if (this.sessionId === targetSessionId) {
      this.startNewSession();
    }
  }

  /**
   * Xóa sạch lịch sử hội thoại hiện tại
   */
  public async resetChat(): Promise<void> {
    await this.deleteSession(this.sessionId);
  }

  /**
   * Xử lý gửi tin nhắn từ người dùng - Gọi Backend Gemini API hoặc Local Fallback
   */
  public async handleUserMessage(userQuery: string): Promise<void> {
    const trimmed = userQuery.trim();
    if (!trimmed) return;

    // 1. Cập nhật ngay tin nhắn của người dùng lên giao diện (Optimistic UI)
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    const currentList = this.messagesSubject.value;
    const updatedWithUser = [...currentList, userMsg];
    this.messagesSubject.next(updatedWithUser);
    this.saveToLocalStorage(updatedWithUser);

    // 2. Kích hoạt trạng thái suy nghĩ
    this.isThinkingSubject.next(true);

    // 3. Gửi request đến Backend Node.js (/api/chatbot/message)
    try {
      const payload = {
        sessionId: this.sessionId,
        userMessage: trimmed,
        history: currentList.slice(-10).map(m => ({
          sender: m.sender,
          text: m.text
        }))
      };

      const res: any = await firstValueFrom(
        this.http.post(`${SERVER_BASE_URL}/api/chatbot/message`, payload).pipe(
          timeout(3500)
        )
      );

      if (res && res.ok && res.botReply) {
        const botReply: ChatMessage = {
          ...res.botReply,
          timestamp: new Date(res.botReply.timestamp || Date.now())
        };

        if (res.source) this.currentSourceSubject.next(res.source);
        if (res.model) this.currentModelSubject.next(res.model);

        const finalList = [...this.messagesSubject.value, botReply];
        this.messagesSubject.next(finalList);
        this.saveToLocalStorage(finalList);
        this.isThinkingSubject.next(false);
        return;
      }
    } catch (err) {
      console.warn('[ChatbotService] API Backend không phản hồi kịp thời, kích hoạt ngay lập tức Local Client Fallback:', err);
    }

    // 4. Nếu mất mạng hoàn toàn hoặc Server Backend chưa bật -> Kích hoạt ngay lập tức Local Heuristics (0ms delay)
    const fallbackResult = this.processLocalFallback(trimmed);
    const botReply: ChatMessage = {
      id: 'bot-fallback-' + Date.now(),
      sender: 'bot',
      text: fallbackResult.replyText,
      timestamp: new Date(),
      suggestedSpaces: fallbackResult.recommendedSpaces,
      quickActions: fallbackResult.recommendedSpaces.length === 0 ? this.defaultQuickPrompts : undefined,
      source: 'local_fallback',
      model: 'uel-rule-engine-v2'
    };

    this.currentSourceSubject.next('local_fallback');
    this.currentModelSubject.next('uel-rule-engine-v2');

    const finalList = [...this.messagesSubject.value, botReply];
    this.messagesSubject.next(finalList);
    this.saveToLocalStorage(finalList);
    this.isThinkingSubject.next(false);
  }

  /**
   * Lưu tin nhắn vào LocalStorage làm bản sao lưu an toàn và cập nhật chỉ mục phiên
   */
  private saveToLocalStorage(messages: ChatMessage[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(
          'uel_space_chat_messages_' + this.sessionId,
          JSON.stringify(messages.slice(-50))
        );

        // Tự động ghi lại metadata của phiên để người dùng xem lại lịch sử
        const firstUserMsg = messages.find(m => m.sender === 'user');
        const lastMsg = messages[messages.length - 1];
        if (firstUserMsg) {
          const raw = localStorage.getItem('uel_space_chat_sessions_index');
          let list: ChatSessionSummary[] = raw ? JSON.parse(raw) : [];
          const idx = list.findIndex(s => s.sessionId === this.sessionId);
          const meta: ChatSessionSummary = {
            sessionId: this.sessionId,
            title: firstUserMsg.text.length > 45 ? firstUserMsg.text.substring(0, 42) + '...' : firstUserMsg.text,
            preview: lastMsg ? (lastMsg.text ? (lastMsg.text.length > 65 ? lastMsg.text.substring(0, 62) + '...' : lastMsg.text) : '') : '',
            messageCount: messages.length,
            updatedAt: new Date().toISOString()
          };
          if (idx >= 0) {
            list[idx] = meta;
          } else {
            list.unshift(meta);
          }
          localStorage.setItem('uel_space_chat_sessions_index', JSON.stringify(list.slice(0, 25)));
        }
      } catch (e) {}
    }
  }

  /**
   * Tạo đơn đặt phòng tự động 1 chạm từ Chatbot
   */
  public executeQuickBooking(space: ChatbotSpace, hours: number = 2): {
    bookingCode: string;
    totalAmount: number;
    date: string;
    timeSlot: string;
    googleCalendarUrl: string;
  } {
    const bookingCode = 'BK-AI-' + Math.floor(100000 + Math.random() * 900000);
    const today = new Date().toISOString().split('T')[0];
    const startTime = '08:00';
    const endTime = '10:00';
    const timeSlot = `${startTime} - ${endTime} (${hours} tiếng)`;
    const totalAmount = Math.round(space.hourlyPrice * hours);

    const googleCalendarUrl = this.googleCalendarService.generateGoogleCalendarUrl({
      title: `[UEL SPACE] Đặt ${space.name} (Tự động bởi AI Chatbot)`,
      roomName: space.name,
      building: space.building,
      date: today,
      timeSlot: `${startTime} - ${endTime}`,
      purpose: 'Học tập & Làm việc tự động hoá qua Chatbot UEL',
      bookerName: 'Khách hàng UEL Space'
    });

    const confirmationMsg: ChatMessage = {
      id: 'cfm-' + Date.now(),
      sender: 'bot',
      text: `🎉 **ĐẶT PHÒNG THÀNH CÔNG TRONG 1 CHẠM!**\n\nHệ thống UEL Space đã giữ chỗ phòng **${space.name}** cho bạn.\n- **Mã đặt phòng:** \`${bookingCode}\`\n- **Địa điểm:** ${space.building}\n- **Thời gian:** Hôm nay (${timeSlot})\n- **Tổng thanh toán:** ${totalAmount.toLocaleString('vi-VN')} VNĐ\n\nBạn có thể thêm ngay lịch này vào Google Calendar hoặc thanh toán MoMo Sandbox bên dưới!`,
      timestamp: new Date(),
      bookingSummary: {
        bookingCode,
        spaceName: space.name,
        building: space.building,
        date: today,
        timeSlot,
        durationHours: hours,
        amount: totalAmount,
        status: 'CONFIRMED',
        googleCalendarUrl
      },
      source: this.currentSourceSubject.value,
      model: this.currentModelSubject.value
    };

    const finalList = [...this.messagesSubject.value, confirmationMsg];
    this.messagesSubject.next(finalList);
    this.saveToLocalStorage(finalList);

    return {
      bookingCode,
      totalAmount,
      date: today,
      timeSlot,
      googleCalendarUrl
    };
  }

  /**
   * Bộ xử lý NLP Local Fallback khi hoàn toàn offline
   */
  private processLocalFallback(query: string): { replyText: string; recommendedSpaces: ChatbotSpace[] } {
    const lower = query.toLowerCase();
    const normalized = this.removeVietnameseTones(lower);

    let requestedCapacity: number | null = null;
    const capacityMatch = lower.match(/(\d{1,3})\s*(?:nguoi|ban|cho|slot)/i);
    if (capacityMatch && capacityMatch[1]) {
      requestedCapacity = parseInt(capacityMatch[1], 10);
    } else if (normalized.includes('1 minh') || normalized.includes('ca nhan')) {
      requestedCapacity = 1;
    } else if (normalized.includes('4-6') || normalized.includes('nhom 5')) {
      requestedCapacity = 5;
    }

    const wantsMeeting = normalized.includes('hop') || normalized.includes('meeting') || normalized.includes('vip');
    const wantsQuiet = normalized.includes('tu hoc') || normalized.includes('yen tinh') || normalized.includes('hot desk');
    const wantsPod = normalized.includes('pod') || normalized.includes('cach am');
    const wantsDisplay = normalized.includes('man hinh') || normalized.includes('may chieu') || normalized.includes('4k');

    const scored = this.fallbackSpacesDatabase.map(space => {
      let score = 0;
      if (space.status === 'available') score += 40;
      if (requestedCapacity !== null) {
        if (space.capacity >= requestedCapacity) {
          score += (space.capacity - requestedCapacity <= 5) ? 40 : 20;
        } else {
          score -= 30;
        }
      }
      if (wantsMeeting && space.spaceType.includes('họp')) score += 30;
      if (wantsQuiet && space.spaceType.includes('Bàn')) score += 30;
      if (wantsPod && space.spaceType.includes('Pod')) score += 35;
      if (wantsDisplay && space.equipment.some(e => e.includes('Màn hình') || e.includes('4K'))) score += 25;

      return { ...space, score };
    });

    scored.sort((a, b) => (b.score || 0) - (a.score || 0));
    const topMatches = scored.slice(0, 2);

    let replyText = '';
    if (requestedCapacity) {
      replyText = `🎯 [Offline Mode] Đã lọc không gian cho nhóm **${requestedCapacity} người** phù hợp nhất:`;
    } else if (wantsDisplay) {
      replyText = `🖥️ [Offline Mode] Các không gian **có sẵn màn hình 4K / máy chiếu** đang trống:`;
    } else {
      replyText = `⚡ [Offline Mode] Dưới đây là các **không gian trống lý tưởng nhất** bạn có thể đặt nhanh:`;
    }

    return { replyText, recommendedSpaces: topMatches };
  }

  private removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}
