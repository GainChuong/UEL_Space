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

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {

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
  generateEmbedUrl(roomName?: string, mode: 'AGENDA' | 'WEEK' | 'MONTH' = 'AGENDA'): string {
    const cleanRoom = (roomName || 'UEL').replace(/\s+/g, '_');
    const calendarId = `uel_space_${cleanRoom.toLowerCase()}@group.calendar.google.com`;
    // Sử dụng URL nhúng chính thức của Google Calendar
    return `https://calendar.google.com/calendar/embed?src=vi.vietnamese%23holiday%40group.v.calendar.google.com&ctz=Asia%2FHo_Chi_Minh&mode=${mode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;
  }

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
   * Danh sách khung giờ chuẩn gợi ý đồng bộ Google Calendar
   */
  getSuggestedSlots() {
    return [
      { label: 'Sáng sớm', period: '07:30 - 09:30', start: '07:30', end: '09:30', hours: 2 },
      { label: 'Giữa sáng', period: '09:45 - 11:45', start: '09:45', end: '11:45', hours: 2 },
      { label: 'Đầu chiều', period: '13:00 - 15:00', start: '13:00', end: '15:00', hours: 2 },
      { label: 'Cuối chiều', period: '15:15 - 17:15', start: '15:15', end: '17:15', hours: 2 },
      { label: 'Đầu tối', period: '17:30 - 19:30', start: '17:30', end: '19:30', hours: 2 },
      { label: 'Đêm muộn', period: '19:30 - 21:30', start: '19:30', end: '21:30', hours: 2 }
    ];
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
