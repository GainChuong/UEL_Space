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
    const title = event.title || `[UEL SPACE] Mượn phòng ${event.roomName} - ${event.purpose || 'Học tập / Nghiên cứu'}`;
    const location = event.location || `Phòng ${event.roomName}, ${event.building || 'Tòa nhà A/B'}, Trường ĐH Kinh tế - Luật (UEL), Số 669 Đỗ Mười, P. Linh Xuân, TP.HCM`;
    
    const details = event.details || [
      `🏛️ Đơn vị: Trường Đại học Kinh tế - Luật (UEL)`,
      `📍 Không gian: Phòng ${event.roomName} (${event.building || 'Cơ sở chính'})`,
      `🎟️ Mã xác nhận vé: ${event.code || 'UEL-88392'}`,
      `👤 Người đăng ký: ${event.bookerName || 'Sinh viên UEL'}`,
      `⏰ Khung giờ sử dụng: ${event.timeSlot || 'Ca học chính khóa'}`,
      `📌 Mục đích: ${event.purpose || 'Học tập và sinh hoạt nhóm'}`,
      `---------------------------------------`,
      `⚠️ LƯU Ý CHECK-IN THỰC TẾ (F09/F21):`,
      `• Vui lòng có mặt và Check-in mã QR tại kiosk trước 15 phút.`,
      `• Nếu quá 15 phút chưa check-in, hệ thống sẽ tự động thu hồi phòng (No-show).`
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
    const title = event.title || `[UEL SPACE] Mượn phòng ${event.roomName}`;
    const location = event.location || `Phòng ${event.roomName}, Trường ĐH Kinh tế - Luật (UEL)`;
    const description = (event.details || `Mã đặt chỗ: ${event.code || 'UEL-88392'} - Phòng ${event.roomName}`).replace(/\n/g, '\\n');
    
    const { startFormatted, endFormatted } = this.formatCalendarDates(event.date, event.timeSlot);
    const nowFormatted = this.formatUtcDate(new Date());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UEL SPACE//Campus Space Management//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:uel-space-${Date.now()}@uel.edu.vn`,
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
      `DESCRIPTION:Nhắc nhở Check-in QR Phòng ${event.roomName}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `uel-space-${event.roomName}-${event.code || 'booking'}.ics`);
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
