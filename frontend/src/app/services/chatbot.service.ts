import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SERVER_IMAGES_LINK, SERVER_BASE_URL } from './api-config';
import { GoogleCalendarService } from './google-calendar.service';

export interface ChatbotSpace {
  id: string;
  name: string;
  building: string;
  spaceType: string;
  capacity: number;
  capacityText: string;
  areaSize: number;
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
  quickActions?: { label: string; query: string }[];
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
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  // Kho dữ liệu không gian thực tế đồng bộ với UEL Space
  private spacesDatabase: ChatbotSpace[] = [
    {
      id: 'b1-104',
      name: 'Boardroom VIP B1',
      building: 'Central Tower Q.1 - Tầng 12',
      spaceType: 'Phòng họp VIP',
      capacity: 24,
      capacityText: '24 chỗ ngồi',
      areaSize: 60,
      hourlyPrice: 250000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Micro hội nghị', 'Điều hòa 2 chiều'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a2_1_meeting_vip.jpg'
    },
    {
      id: 'a2-1',
      name: 'Private Suite A2',
      building: 'TechPark Executive - Tầng 5',
      spaceType: 'Văn phòng riêng',
      capacity: 12,
      capacityText: '12 người',
      areaSize: 35,
      hourlyPrice: 180000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Điều hòa', 'Cáp quang 1Gbps', 'Bảng kính', 'Màn hình 4K'],
      image: SERVER_IMAGES_LINK + 'spaces/space_b2_101_private_office.jpg'
    },
    {
      id: 'thu-vien-2',
      name: 'Khu Hot Desk Coworking',
      building: 'Innovation Hub - Tầng 2',
      spaceType: 'Bàn làm việc linh hoạt',
      capacity: 60,
      capacityText: '60 chỗ ngồi',
      areaSize: 180,
      hourlyPrice: 35000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Cáp quang 1Gbps', 'Điều hòa', 'Ổ cắm điện', 'Tủ locker', 'Không gian yên tĩnh'],
      image: SERVER_IMAGES_LINK + 'spaces/space_thu_vien_coworking.jpg'
    },
    {
      id: 'a3-301',
      name: 'Hội trường Event & Workshop A3',
      building: 'Landmark Lounge - Tầng 8',
      spaceType: 'Không gian sự kiện',
      capacity: 100,
      capacityText: '100 khách',
      areaSize: 150,
      hourlyPrice: 450000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Màn hình 4K', 'Âm thanh vòm', 'Cáp quang 1Gbps', 'Sân khấu'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a3_301_event_hall.jpg'
    },
    {
      id: 'choi-1',
      name: 'Focus Pod 1 Cách Âm',
      building: 'Green Office Suites - Tầng 3',
      spaceType: 'Meeting Pod',
      capacity: 4,
      capacityText: '4 người',
      areaSize: 12,
      hourlyPrice: 70000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Cách âm chuẩn', 'Màn hình họp trực tuyến', 'Cáp quang 1Gbps', 'Điều hòa cá nhân'],
      image: SERVER_IMAGES_LINK + 'spaces/space_choi_1_focus_pod.jpg'
    },
    {
      id: 'b2-101',
      name: 'Creative Studio Lab B2',
      building: 'Creative Hub Center - Tầng 4',
      spaceType: 'Studio sáng tạo',
      capacity: 16,
      capacityText: '16 người',
      areaSize: 45,
      hourlyPrice: 200000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Phông xanh livestream', 'Đèn quay chuyên nghiệp', 'Micro thu âm', 'Màn hình 4K'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a_105_creative_media.jpg'
    },
    {
      id: 'a1-202',
      name: 'Phòng Thảo Luận Nhóm A1',
      building: 'Innovation Hub - Tầng 3',
      spaceType: 'Phòng học nhóm',
      capacity: 8,
      capacityText: '8 người',
      areaSize: 22,
      hourlyPrice: 90000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Bảng kính tương tác', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Ổ cắm điện đa năng'],
      image: SERVER_IMAGES_LINK + 'spaces/space_b1_104_lecture_hall.jpg'
    }
  ];

  // Danh sách gợi ý truy vấn nhanh (Quick prompt chips)
  public readonly defaultQuickPrompts = [
    { label: '👥 Học nhóm 4-6 người', query: 'Tìm phòng học nhóm 4-6 người có bảng kính' },
    { label: '🖥️ Phòng có máy chiếu trống', query: 'Phòng có màn hình hoặc máy chiếu đang trống' },
    { label: '🤫 Tự học yên tĩnh giá rẻ', query: 'Không gian tự học yên tĩnh giá sinh viên' },
    { label: '⚡ Đặt nhanh phòng gần nhất', query: 'Gợi ý phòng trống khả dụng ngay bây giờ' },
    { label: '🏢 Phòng họp VIP trên 15 người', query: 'Phòng họp VIP trên 15 người có mic' }
  ];

  // Trạng thái mở/đóng cửa sổ chat
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();

  // Trạng thái tin nhắn
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();

  // Trạng thái đang trả lời (Typing indicator)
  private isThinkingSubject = new BehaviorSubject<boolean>(false);
  public isThinking$: Observable<boolean> = this.isThinkingSubject.asObservable();

  constructor(private googleCalendarService: GoogleCalendarService) {
    this.initWelcomeMessage();
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

  public resetChat(): void {
    this.messagesSubject.next([]);
    this.initWelcomeMessage();
  }

  private initWelcomeMessage(): void {
    const welcomeMsg: ChatMessage = {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Xin chào! 👋 Tôi là **UEL Space Assistant** – Trợ lý đặt phòng thông minh.\n\nNếu bạn đang bận rộn và không có thời gian tìm kiếm thủ công, chỉ cần nhắn yêu cầu (số người, thời gian, thiết bị) hoặc chọn nhanh gợi ý bên dưới, tôi sẽ tìm và hỗ trợ **đặt chỗ tự động trong 1 chạm** ngay!',
      timestamp: new Date(),
      quickActions: this.defaultQuickPrompts
    };
    this.messagesSubject.next([welcomeMsg]);
  }

  /**
   * Xử lý gửi tin nhắn từ người dùng
   */
  public async handleUserMessage(userQuery: string): Promise<void> {
    const trimmed = userQuery.trim();
    if (!trimmed) return;

    // 1. Thêm tin nhắn của User
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    const currentList = this.messagesSubject.value;
    this.messagesSubject.next([...currentList, userMsg]);

    // 2. Kích hoạt hiệu ứng đang suy nghĩ
    this.isThinkingSubject.next(true);

    // 3. Xử lý NLU và tìm kiếm không gian (mô phỏng độ trễ tự nhiên 600ms)
    setTimeout(() => {
      const { replyText, recommendedSpaces } = this.processNlpQuery(trimmed);

      const botReply: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: replyText,
        timestamp: new Date(),
        suggestedSpaces: recommendedSpaces,
        quickActions: recommendedSpaces.length === 0 ? this.defaultQuickPrompts : undefined
      };

      this.isThinkingSubject.next(false);
      this.messagesSubject.next([...this.messagesSubject.value, botReply]);
    }, 600);
  }

  /**
   * Bộ xử lý NLP Rule-based & Heuristics tiếng Việt chuyên sâu cho UEL Space
   */
  private processNlpQuery(query: string): { replyText: string; recommendedSpaces: ChatbotSpace[] } {
    const lower = query.toLowerCase();
    const normalized = this.removeVietnameseTones(lower);

    // 1. Trích xuất sức chứa (Capacity)
    let requestedCapacity: number | null = null;
    const capacityMatch = lower.match(/(?:cho|nhom|tam|khoang|can|tim)?\s*(\d{1,3})\s*(?:nguoi|ban|cho|slot|thanh vien)/i)
      || lower.match(/(\d{1,3})\s*nguoi/i);
    if (capacityMatch && capacityMatch[1]) {
      requestedCapacity = parseInt(capacityMatch[1], 10);
    } else if (normalized.includes('1 minh') || normalized.includes('ca nhan') || normalized.includes('1 nguoi')) {
      requestedCapacity = 1;
    } else if (normalized.includes('4-6') || normalized.includes('4 den 6')) {
      requestedCapacity = 5;
    } else if (normalized.includes('tren 15') || normalized.includes('hon 15')) {
      requestedCapacity = 18;
    } else if (normalized.includes('tren 20') || normalized.includes('hon 20')) {
      requestedCapacity = 24;
    }

    // 2. Trích xuất loại không gian (Space Type)
    const wantsMeeting = normalized.includes('hop') || normalized.includes('meeting') || normalized.includes('vip') || normalized.includes('thao luan');
    const wantsPrivate = normalized.includes('rieng') || normalized.includes('suite') || normalized.includes('van phong');
    const wantsQuietSelfStudy = normalized.includes('tu hoc') || normalized.includes('yen tinh') || normalized.includes('hot desk') || normalized.includes('coworking');
    const wantsEvent = normalized.includes('su kien') || normalized.includes('event') || normalized.includes('workshop') || normalized.includes('hoi truong');
    const wantsPod = normalized.includes('pod') || normalized.includes('cach am') || normalized.includes('goi dien') || normalized.includes('phong nho');
    const wantsStudio = normalized.includes('studio') || normalized.includes('lab') || normalized.includes('quay phim') || normalized.includes('livestream');

    // 3. Trích xuất tiện ích (Amenities)
    const wantsDisplay = normalized.includes('may chieu') || normalized.includes('man hinh') || normalized.includes('4k') || normalized.includes('tivi') || normalized.includes('screen');
    const wantsBoard = normalized.includes('bang') || normalized.includes('bang kinh') || normalized.includes('smartboard');
    const wantsSoundMic = normalized.includes('mic') || normalized.includes('micro') || normalized.includes('am thanh') || normalized.includes('loa');
    const wantsBudget = normalized.includes('re') || normalized.includes('tiet kiem') || normalized.includes('sinh vien') || normalized.includes('gia thap');

    // 4. Chấm điểm & Xếp hạng (Scoring & Ranking)
    const scoredSpaces = this.spacesDatabase.map(space => {
      let score = 0;
      const reasons: string[] = [];

      // Ưu tiên cao nhất: Đang trống
      if (space.status === 'available') {
        score += 50;
        reasons.push('Khả dụng ngay');
      }

      // Khớp sức chứa
      if (requestedCapacity !== null) {
        if (space.capacity >= requestedCapacity) {
          const capDiff = space.capacity - requestedCapacity;
          if (capDiff <= 5) {
            score += 45;
            reasons.push(`Sức chứa tối ưu (${space.capacityText})`);
          } else if (capDiff <= 15) {
            score += 30;
            reasons.push(`Sức chứa rộng rãi (${space.capacityText})`);
          } else {
            score += 15;
          }
        } else {
          score -= 40; // Không đủ sức chứa
        }
      }

      // Khớp loại không gian
      if (wantsMeeting && (space.spaceType.includes('Phòng họp') || space.spaceType.includes('Thảo luận'))) {
        score += 35;
        reasons.push('Chuyên dụng hội họp');
      }
      if (wantsPrivate && space.spaceType.includes('Văn phòng riêng')) {
        score += 35;
        reasons.push('Không gian riêng tư');
      }
      if (wantsQuietSelfStudy && (space.spaceType.includes('Bàn làm việc') || space.spaceType.includes('Pod') || space.spaceType.includes('Thảo luận'))) {
        score += 35;
        reasons.push('Yên tĩnh, phù hợp tự học');
      }
      if (wantsEvent && space.spaceType.includes('sự kiện')) {
        score += 40;
        reasons.push('Sân khấu & Hội trường chuẩn sự kiện');
      }
      if (wantsPod && space.spaceType.includes('Pod')) {
        score += 40;
        reasons.push('Cách âm tuyệt đối');
      }
      if (wantsStudio && space.spaceType.includes('Studio')) {
        score += 40;
        reasons.push('Đầy đủ thiết bị quay chụp');
      }

      // Khớp tiện ích
      if (wantsDisplay) {
        const hasDisplay = space.equipment.some(e => e.includes('Màn hình') || e.includes('4K'));
        if (hasDisplay) {
          score += 25;
          reasons.push('Có màn hình 4K / máy chiếu');
        }
      }
      if (wantsBoard) {
        const hasBoard = space.equipment.some(e => e.includes('Bảng'));
        if (hasBoard) {
          score += 20;
          reasons.push('Có bảng kính tương tác');
        }
      }
      if (wantsSoundMic) {
        const hasMic = space.equipment.some(e => e.includes('Micro') || e.includes('âm thanh'));
        if (hasMic) {
          score += 25;
          reasons.push('Trang bị micro & âm thanh chuẩn');
        }
      }

      // Khớp tiêu chí tiết kiệm
      if (wantsBudget) {
        if (space.hourlyPrice <= 100000) {
          score += 30;
          reasons.push(`Giá ưu đãi (${space.hourlyPrice.toLocaleString('vi-VN')}đ/h)`);
        }
      }

      return {
        ...space,
        score,
        matchReason: reasons.slice(0, 3).join(' • ')
      };
    });

    // Lọc và sắp xếp theo điểm số
    const sorted = scoredSpaces
      .filter(s => (s.score || 0) > 20)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    // Nếu không khớp chính xác, trả về các phòng còn trống tốt nhất
    const finalResults = sorted.length > 0
      ? sorted.slice(0, 2)
      : this.spacesDatabase.filter(s => s.status === 'available').slice(0, 2);

    // Xây dựng câu thoại phản hồi tự nhiên
    let replyText = '';
    if (finalResults.length > 0) {
      if (requestedCapacity) {
        replyText = `🎯 Tôi đã phân tích yêu cầu nhóm khoảng **${requestedCapacity} người** và tìm thấy **${finalResults.length} không gian tối ưu nhất** đang trống cho bạn:`;
      } else if (wantsDisplay) {
        replyText = `🖥️ Dưới đây là các không gian **có sẵn màn hình 4K / máy chiếu sắc nét** và đang khả dụng để đặt ngay:`;
      } else if (wantsQuietSelfStudy) {
        replyText = `🤫 Gợi ý các không gian **tự học yên tĩnh, đường truyền 1Gbps ổn định và chi phí tối ưu nhất**:`;
      } else {
        replyText = `⚡ Dựa trên trạng thái thời gian thực, đây là các **không gian trống lý tưởng nhất** bạn có thể đặt nhanh:`;
      }
    } else {
      replyText = `Hiện tại tôi chưa tìm thấy phòng phù hợp tuyệt đối 100% với tiêu chí. Bạn hãy thử chọn các gợi ý nhanh bên dưới hoặc điều chỉnh lại yêu cầu nhé!`;
    }

    return { replyText, recommendedSpaces: finalResults };
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

    // Thêm tin nhắn xác nhận hoàn tất vào hội thoại
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
      }
    };

    this.messagesSubject.next([...this.messagesSubject.value, confirmationMsg]);

    return {
      bookingCode,
      totalAmount,
      date: today,
      timeSlot,
      googleCalendarUrl
    };
  }

  /**
   * Chuyển đổi tiếng Việt có dấu sang không dấu để phân tích từ khóa
   */
  private removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}
