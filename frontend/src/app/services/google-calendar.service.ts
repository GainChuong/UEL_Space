import { Injectable } from '@angular/core';

export interface CalendarEventData {
  title?: string;
  roomName: string;
  building?: string;
  code?: string;
  date?: string; // DD/MM/YYYY or YYYY-MM-DD
  timeSlot?: string; // "08:00 - 11:30" or "07:00 -> 11h00"
  bookerName?: string;
  purpose?: string;
  details?: string;
  location?: string;
}

export interface UserCalendarEvent {
  id: string;
  title: string;
  time: string; // e.g. "07:30 - 11:45"
  start: string; // "07:30"
  end: string;   // "11:45"
  date?: string; // "YYYY-MM-DD"
  type: string;
  isBusy: boolean;
  location?: string;
  room?: string;
  organizer?: string;
  lecturer?: string;
  conflictsWith?: string[];
}

export interface SuggestedTimeSlot {
  label: string;
  period: string;
  start: string;
  end: string;
  hours: number;
  isBusy: boolean;
  conflictTitle?: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {

  /**
   * Tính số giờ thuê thực tế giữa 2 mốc thời gian (VD: "08:00" đến "11:30" => 3.5 giờ)
   */
  calculateDuration(startTime: string, endTime: string): number {
    try {
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      const startMin = sH * 60 + (sM || 0);
      const endMin = eH * 60 + (eM || 0);
      if (endMin <= startMin) return 1; // Tối thiểu 1 giờ
      const diffHours = (endMin - startMin) / 60;
      return Math.round(diffHours * 10) / 10;
    } catch {
      return 2;
    }
  }

  /**
   * Tạo URL thêm sự kiện 1-Click vào Google Calendar Web / Mobile App
   */
  generateGoogleCalendarUrl(event: CalendarEventData): string {
    const title = event.title || `[UEL Space] Thuê ${event.roomName} - ${event.purpose || 'Hội họp & Làm việc'}`;
    const location = event.location || `Phòng ${event.roomName}, ${event.building || 'Tòa nhà văn phòng đối tác'}, Hệ thống UEL Space, TP.HCM`;
    
    const details = event.details || [
      `🏢 Nền tảng: UEL Space - Smart Office Sharing & Rental Platform`,
      `📍 Không gian: ${event.roomName} (${event.building || 'Tòa nhà đối tác'})`,
      `🎟️ Mã đặt chỗ: ${event.code || 'UEL-88392'}`,
      `👤 Khách thuê / Doanh nghiệp: ${event.bookerName || 'Khách thuê UEL Space Member'}`,
      `⏰ Khung giờ thuê: ${event.timeSlot || 'Khung giờ linh hoạt'}`,
      `📌 Mục đích: ${event.purpose || 'Làm việc, hội họp hoặc tổ chức sự kiện'}`,
      `---------------------------------------`,
      `⚠️ LƯU Ý CHECK-IN & GIÁM SÁT AI OCCUPANCY:`,
      `• Vui lòng quét mã QR tại cửa phòng để xác nhận hiện diện khi nhận phòng.`,
      `• Hệ thống AI Occupancy tự động giám sát số lượng thực tế, cảnh báo quá giờ và hỗ trợ trả phòng sớm giải phóng chỗ.`
    ].join('\n');

    const { startFormatted, endFormatted } = this.formatCalendarDates(event.date, event.timeSlot);

    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startFormatted}/${endFormatted}`,
      details: details,
      location: location,
      sf: 'true',
      output: 'xml'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Tạo URL nhúng trực tiếp Google Calendar View
   */
  generateEmbedUrl(userOrRoom?: string, mode: 'AGENDA' | 'WEEK' | 'MONTH' = 'AGENDA', targetDate?: string): string {
    // URL nhúng chính thức của Google Calendar với timezone chuẩn Việt Nam Asia/Ho_Chi_Minh
    const baseSrc = encodeURIComponent('vi.vietnamese#holiday@group.v.calendar.google.com');
    let url = `https://calendar.google.com/calendar/embed?src=${baseSrc}&ctz=Asia%2FHo_Chi_Minh&mode=${mode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;
    if (targetDate) {
      // dates=YYYYMM01/YYYYMM28
      const cleaned = targetDate.replace(/-/g, '');
      if (cleaned.length >= 8) {
        url += `&dates=${cleaned}/${cleaned}`;
      }
    }
    return url;
  }

  /**
   * Lấy danh sách sự kiện lịch trình thực tế của người dùng theo ngày được chọn
   */
  getUserEventsForDate(dateStr?: string, userEmail?: string): UserCalendarEvent[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = dateStr || todayStr;

    // 1. Kiểm tra sự kiện đã lưu trong bộ nhớ cục bộ (nếu người dùng đã đặt phòng trước đó)
    let userCustomEvents: UserCalendarEvent[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`uel_cal_events_${targetDate}`);
        if (stored) {
          userCustomEvents = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Cannot parse stored calendar events:', e);
      }
    }

    // 2. Sinh lịch trình thực tế chuẩn của sinh viên/doanh nhân theo thứ trong tuần
    const parsedDate = new Date(targetDate);
    const dayOfWeek = isNaN(parsedDate.getTime()) ? 1 : parsedDate.getDay(); // 0: CN, 1: T2, ..., 6: T7

    let baseEvents: UserCalendarEvent[] = [];
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Cuối tuần: sáng có workshop/tự học, chiều tối tự do
      baseEvents = [
        {
          id: 'ev-wk-1',
          time: '08:30 - 11:00',
          start: '08:30',
          end: '11:00',
          title: 'Workshop Khởi nghiệp & Đổi mới sáng tạo UEL Space',
          room: 'Creative Studio E2',
          type: 'meeting',
          isBusy: true,
          organizer: 'CLB Khởi nghiệp UEL'
        },
        {
          id: 'ev-wk-2',
          time: '11:00 - 14:00',
          start: '11:00',
          end: '14:00',
          title: 'Trống lịch (Ăn trưa & Thư giãn cuối tuần)',
          type: 'free',
          isBusy: false
        },
        {
          id: 'ev-wk-3',
          time: '14:00 - 17:00',
          start: '14:00',
          end: '17:00',
          title: 'Trống lịch (Khung giờ lý tưởng đặt phòng họp / học nhóm)',
          type: 'free',
          isBusy: false
        },
        {
          id: 'ev-wk-4',
          time: '17:30 - 21:00',
          start: '17:30',
          end: '21:00',
          title: 'Trống lịch (Thời gian cá nhân)',
          type: 'free',
          isBusy: false
        }
      ];
    } else if (dayOfWeek === 2 || dayOfWeek === 4) {
      // Thứ 3 & Thứ 5: Giảng đường & Họp chuyên môn
      baseEvents = [
        {
          id: 'ev-t3-1',
          time: '08:00 - 10:30',
          start: '08:00',
          end: '10:30',
          title: 'Học chuyên đề: Phân tích Dữ liệu Kinh doanh & IoT',
          room: 'Giảng đường B1-302',
          type: 'class',
          isBusy: true,
          organizer: 'Khoa HTTT Kinh tế'
        },
        {
          id: 'ev-t3-2',
          time: '10:30 - 13:30',
          start: '10:30',
          end: '13:30',
          title: 'Trống lịch (Khung giờ trưa lý tưởng làm việc)',
          type: 'free',
          isBusy: false
        },
        {
          id: 'ev-t3-3',
          time: '13:30 - 15:30',
          start: '13:30',
          end: '15:30',
          title: 'Họp hội đồng Đề tài Nghiên cứu Khoa học',
          room: 'Phòng Hội thảo VIP',
          type: 'meeting',
          isBusy: true,
          organizer: 'Phòng QLKH'
        },
        {
          id: 'ev-t3-4',
          time: '15:30 - 17:30',
          start: '15:30',
          end: '17:30',
          title: 'Trống lịch (Khung giờ vàng thuê Hotdesk / Pod)',
          type: 'free',
          isBusy: false
        },
        {
          id: 'ev-t3-5',
          time: '17:30 - 20:30',
          start: '17:30',
          end: '20:30',
          title: 'Trống lịch (Tự do làm việc buổi tối)',
          type: 'free',
          isBusy: false
        }
      ];
    } else {
      // Thứ 2, 4, 6: Lịch điều hành & Quỹ đầu tư
      baseEvents = [
        {
          id: 'ev-t2-1',
          time: '07:30 - 11:45',
          start: '07:30',
          end: '11:45',
          title: 'Họp chiến lược Ban Điều Hành quý IV',
          room: 'Boardroom VIP B1',
          type: 'meeting',
          isBusy: true,
          organizer: 'Ban Giám đốc'
        },
        {
          id: 'ev-t2-2',
          time: '11:45 - 13:00',
          start: '11:45',
          end: '13:00',
          title: 'Nghỉ trưa & Networking Cafe',
          type: 'free',
          isBusy: false
        },
        {
          id: 'ev-t2-3',
          time: '13:00 - 15:00',
          start: '13:00',
          end: '15:00',
          title: 'Trống lịch (Khung giờ lý tưởng thuê phòng)',
          type: 'free',
          isBusy: false
        },
        {
          id: 'ev-t2-4',
          time: '15:15 - 17:15',
          start: '15:15',
          end: '17:15',
          title: 'Làm việc cùng Quỹ Đầu Tư mạo hiểm',
          room: 'Private Suite A2',
          type: 'meeting',
          isBusy: true,
          organizer: 'Đối tác VCs'
        },
        {
          id: 'ev-t2-5',
          time: '17:30 - 20:00',
          start: '17:30',
          end: '20:00',
          title: 'Trống lịch (Tự do làm việc cá nhân)',
          type: 'free',
          isBusy: false
        }
      ];
    }

    // Kết hợp các sự kiện đặt phòng từ trước của người dùng vào danh sách
    return [...baseEvents, ...userCustomEvents];
  }

  /**
   * Lưu một đơn đặt phòng mới vào lịch cá nhân người dùng
   */
  addBookingToCalendar(booking: { roomName: string; date: string; startTime: string; endTime: string; code: string; userEmail?: string }): void {
    if (typeof window === 'undefined') return;
    try {
      const targetDate = booking.date;
      const key = `uel_cal_events_${targetDate}`;
      const existing: UserCalendarEvent[] = JSON.parse(localStorage.getItem(key) || '[]');
      
      const newEvent: UserCalendarEvent = {
        id: `booking-${Date.now()}`,
        time: `${booking.startTime} - ${booking.endTime}`,
        start: booking.startTime,
        end: booking.endTime,
        title: `[UEL Space] Đã đặt ${booking.roomName} (${booking.code})`,
        room: booking.roomName,
        type: 'booking',
        isBusy: true,
        date: targetDate,
        organizer: booking.userEmail || 'Bạn'
      };

      existing.push(newEvent);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.warn('Cannot persist calendar event:', e);
    }
  }

  /**
   * Danh sách khung giờ đề xuất linh hoạt DỰA TRÊN DỮ LIỆU LỊCH TRÌNH THỰC TẾ
   */
  getSuggestedSlots(dateStr?: string, userEmail?: string): SuggestedTimeSlot[] {
    const rawPresets = [
      { label: 'Sáng sớm', period: '07:30 - 09:30', start: '07:30', end: '09:30', hours: 2 },
      { label: 'Giữa sáng', period: '09:45 - 11:45', start: '09:45', end: '11:45', hours: 2 },
      { label: 'Đầu chiều', period: '13:00 - 15:00', start: '13:00', end: '15:00', hours: 2 },
      { label: 'Cuối chiều', period: '15:15 - 17:15', start: '15:15', end: '17:15', hours: 2 },
      { label: 'Đầu tối', period: '17:30 - 19:30', start: '17:30', end: '19:30', hours: 2 },
      { label: 'Đêm muộn', period: '19:30 - 21:30', start: '19:30', end: '21:30', hours: 2 }
    ];

    const events = this.getUserEventsForDate(dateStr, userEmail);
    const busyEvents = events.filter(e => e.isBusy);

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    return rawPresets.map(preset => {
      const pStart = toMinutes(preset.start);
      const pEnd = toMinutes(preset.end);

      // Kiểm tra xem ca này có giao với sự kiện bận nào trong Google Calendar không
      const conflict = busyEvents.find(ev => {
        const evStart = toMinutes(ev.start);
        const evEnd = toMinutes(ev.end);
        return Math.max(pStart, evStart) < Math.min(pEnd, evEnd);
      });

      if (conflict) {
        return {
          ...preset,
          isBusy: true,
          conflictTitle: conflict.title,
          reason: `Trùng lịch: ${conflict.title} (${conflict.start} - ${conflict.end})`
        };
      }

      return {
        ...preset,
        isBusy: false,
        reason: 'Khung giờ hoàn toàn trống trên Google Calendar của bạn'
      };
    });
  }

  /**
   * Kiểm tra xung đột lịch chi tiết giữa khoảng giờ người dùng chọn và lịch Google Calendar thực tế
   */
  checkConflict(dateStr: string, startTime: string, endTime: string, userEmail?: string): { hasConflict: boolean; reason: string } {
    if (!startTime || !endTime) {
      return { hasConflict: false, reason: '' };
    }

    const events = this.getUserEventsForDate(dateStr, userEmail);
    const busyEvents = events.filter(e => e.isBusy);

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const selStart = toMinutes(startTime);
    const selEnd = toMinutes(endTime);

    if (selEnd <= selStart) {
      return { hasConflict: true, reason: 'Giờ kết thúc phải sau giờ bắt đầu' };
    }

    const conflict = busyEvents.find(c => {
      const cStart = toMinutes(c.start);
      const cEnd = toMinutes(c.end);
      return Math.max(selStart, cStart) < Math.min(selEnd, cEnd);
    });

    if (conflict) {
      return {
        hasConflict: true,
        reason: `Trùng lịch trong Google Calendar: "${conflict.title}" (${conflict.start} - ${conflict.end})`
      };
    }

    return { hasConflict: false, reason: '' };
  }

  /**
   * Mở trực tiếp Google Calendar trong tab mới
   */
  openGoogleCalendar(event: CalendarEventData): void {
    const url = this.generateGoogleCalendarUrl(event);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Tải file .ics chuẩn quốc tế cho Apple Calendar, Outlook và Google Calendar
   */
  downloadIcsFile(event: CalendarEventData): void {
    const title = event.title || `[UEL Space] Đặt phòng ${event.roomName}`;
    const location = event.location || `Phòng ${event.roomName}, Hệ thống UEL Space`;
    const description = (event.details || `Mã đặt chỗ: ${event.code || 'UEL-88392'} - Không gian ${event.roomName}`).replace(/\n/g, '\\n');
    
    const { startFormatted, endFormatted } = this.formatCalendarDates(event.date, event.timeSlot);
    const nowFormatted = this.formatUtcDate(new Date());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UEL Space//Smart Office Sharing Platform//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:uelspace-${Date.now()}@uelspace.vn`,
      `DTSTAMP:${nowFormatted}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Nhắc nhở Check-in Phòng ${event.roomName}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `uelspace-${event.roomName}-${event.code || 'booking'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Chuyển đổi ngày và chuỗi giờ (08:00 - 11:30) thành chuỗi ISO dùng cho Calendar (YYYYMMDDTHHmmss)
   */
  private formatCalendarDates(dateStr?: string, timeSlot?: string): { startFormatted: string; endFormatted: string } {
    let targetDate = new Date();
    
    if (dateStr) {
      if (dateStr.includes('/')) {
        // DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          targetDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      } else if (dateStr.includes('-')) {
        // YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
      }
    }

    let startHour = 8;
    let startMin = 0;
    let endHour = 10;
    let endMin = 0;

    if (timeSlot) {
      // Chuẩn hóa dạng: "08:00 - 11:30" hoặc "07:00 -> 11h00"
      const cleaned = timeSlot.replace('->', '-').replace(/h/g, ':');
      const timeParts = cleaned.split('-');
      if (timeParts.length >= 2) {
        const startPieces = timeParts[0].trim().split(':');
        const endPieces = timeParts[1].trim().split(':');

        if (startPieces.length >= 1) startHour = parseInt(startPieces[0], 10) || 8;
        if (startPieces.length >= 2) startMin = parseInt(startPieces[1], 10) || 0;
        if (endPieces.length >= 1) endHour = parseInt(endPieces[0], 10) || (startHour + 2);
        if (endPieces.length >= 2) endMin = parseInt(endPieces[1], 10) || 0;
      }
    }

    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), startHour, startMin, 0);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), endHour, endMin, 0);

    return {
      startFormatted: this.formatLocalDate(startDate),
      endFormatted: this.formatLocalDate(endDate)
    };
  }

  private formatLocalDate(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  private formatUtcDate(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  }
}
