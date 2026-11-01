import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SERVER_BASE_URL } from './api-config';
import { SettingsService } from './settings.service';

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

export interface GoogleCalendarStatus {
  isConnected: boolean;
  email?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private http = inject(HttpClient);
  private settingsService = inject(SettingsService);

  // Trạng thái kết nối Google Calendar thời gian thực
  public connectionStatus$ = new BehaviorSubject<GoogleCalendarStatus>({ isConnected: false });
  // Bộ nhớ đệm các sự kiện bận thật từ Google Calendar theo ngày: { "2026-11-01": [...] }
  private liveEventsCache = new Map<string, UserCalendarEvent[]>();
  public isLoadingLiveEvents$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // Tự động kiểm tra trạng thái kết nối khi khởi tạo dịch vụ
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.checkConnectionStatus().subscribe();
      }, 500);
    }
  }

  /**
   * Lấy email tài khoản hiện tại của người dùng
   */
  public getCurrentUserEmail(): string {
    try {
      const user = this.settingsService.currentUser;
      if (user?.email) return user.email.trim().toLowerCase();
    } catch {}
    if (typeof window !== 'undefined') {
      try {
        const uStr = localStorage.getItem('uel_current_user') || localStorage.getItem('currentUser');
        if (uStr) {
          const u = JSON.parse(uStr);
          if (u.email) return u.email.trim().toLowerCase();
        }
      } catch {}
    }
    return 'giangnntk24411@st.uel.edu.vn';
  }

  /**
   * 1. Kiểm tra trạng thái đồng bộ Google Calendar từ Backend MongoDB
   */
  checkConnectionStatus(email?: string): Observable<GoogleCalendarStatus> {
    const userEmail = email || this.getCurrentUserEmail();
    if (!userEmail) {
      return of({ isConnected: false });
    }

    return this.http.get<any>(`${SERVER_BASE_URL}/api/calendar/status?email=${encodeURIComponent(userEmail)}`).pipe(
      map(res => {
        const status: GoogleCalendarStatus = {
          isConnected: !!res?.isConnected,
          email: res?.email || userEmail,
          updatedAt: res?.updatedAt
        };
        this.connectionStatus$.next(status);
        return status;
      }),
      catchError(err => {
        console.warn('Cannot check Google Calendar status:', err);
        return of({ isConnected: false });
      })
    );
  }

  /**
   * 2. Lấy URL ủy quyền Google OAuth 2.0 từ Backend
   */
  getConnectUrl(redirectUri?: string, email?: string): Observable<{ success: boolean; authUrl: string }> {
    const userEmail = email || this.getCurrentUserEmail();
    const uri = redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/calendar-callback` : 'http://localhost:4200/calendar-callback');
    return this.http.get<any>(`${SERVER_BASE_URL}/api/calendar/connect-url?redirect_uri=${encodeURIComponent(uri)}&email=${encodeURIComponent(userEmail)}`);
  }

  /**
   * 3. Mở popup đăng nhập và cấp quyền Google Calendar (One-click Connect)
   */
  openGoogleAuthPopup(email?: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      const userEmail = email || this.getCurrentUserEmail();
      const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/calendar-callback` : 'http://localhost:4200/calendar-callback';

      this.getConnectUrl(redirectUri, userEmail).subscribe({
        next: (res) => {
          if (!res.success || !res.authUrl) {
            resolve({ success: false, message: 'Không lấy được URL xác thực Google.' });
            return;
          }

          if (typeof window === 'undefined') {
            resolve({ success: false, message: 'Môi trường SSR không hỗ trợ mở cửa sổ.' });
            return;
          }

          const width = 560;
          const height = 680;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const popup = window.open(
            res.authUrl,
            'uel_google_calendar_auth',
            `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
          );

          if (!popup) {
            // Popup bị chặn bởi trình duyệt -> Chuyển hướng trực tiếp
            window.location.href = res.authUrl;
            return;
          }

          // Lắng nghe tín hiệu postMessage từ tab callback
          const messageHandler = (event: MessageEvent) => {
            if (event.data && event.data.type === 'GOOGLE_CALENDAR_CONNECTED') {
              window.removeEventListener('message', messageHandler);
              clearInterval(pollInterval);
              this.checkConnectionStatus(userEmail).subscribe({
                next: () => resolve({ success: true }),
                error: () => resolve({ success: true })
              });
            }
          };
          window.addEventListener('message', messageHandler);

          // Polling phát hiện đóng cửa sổ
          const pollInterval = setInterval(() => {
            if (popup.closed) {
              clearInterval(pollInterval);
              window.removeEventListener('message', messageHandler);
              // Kiểm tra trạng thái hoàn tất sau khi popup đóng
              setTimeout(() => {
                this.checkConnectionStatus(userEmail).subscribe({
                  next: (st) => resolve({ success: st.isConnected }),
                  error: () => resolve({ success: false })
                });
              }, 600);
            }
          }, 1200);
        },
        error: (err) => {
          resolve({ success: false, message: err?.message || 'Lỗi kết nối máy chủ UEL Space' });
        }
      });
    });
  }

  /**
   * 4. Trao đổi Authorization Code lấy Tokens (gọi bởi trang callback)
   */
  exchangeCode(code: string, redirectUri?: string, email?: string): Observable<any> {
    const userEmail = email || this.getCurrentUserEmail();
    const uri = redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/calendar-callback` : 'http://localhost:4200/calendar-callback');
    return this.http.post<any>(`${SERVER_BASE_URL}/api/calendar/callback`, {
      code,
      redirectUri: uri,
      email: userEmail
    }).pipe(
      tap(res => {
        if (res && res.success) {
          this.connectionStatus$.next({
            isConnected: true,
            email: res.email || userEmail
          });
        }
      })
    );
  }

  /**
   * 5. Hủy liên kết Google Calendar
   */
  disconnect(email?: string): Observable<any> {
    const userEmail = email || this.getCurrentUserEmail();
    return this.http.post<any>(`${SERVER_BASE_URL}/api/calendar/disconnect`, { email: userEmail }).pipe(
      tap(() => {
        this.connectionStatus$.next({ isConnected: false });
        this.liveEventsCache.clear();
      })
    );
  }

  /**
   * 6. Truy vấn lịch bận FreeBusy thực tế từ Google Calendar API qua Backend
   */
  fetchLiveFreeBusy(dateStr?: string, email?: string): Observable<{ success: boolean; isConnected: boolean; busySlots: any[] }> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const userEmail = email || this.getCurrentUserEmail();

    if (!userEmail) {
      return of({ success: false, isConnected: false, busySlots: [] });
    }

    this.isLoadingLiveEvents$.next(true);

    return this.http.get<any>(`${SERVER_BASE_URL}/api/calendar/freebusy?date=${encodeURIComponent(targetDate)}&email=${encodeURIComponent(userEmail)}`).pipe(
      tap(res => {
        this.isLoadingLiveEvents$.next(false);
        if (res && res.isConnected) {
          this.connectionStatus$.next({
            isConnected: true,
            email: res.email || userEmail
          });

          const liveEvents: UserCalendarEvent[] = (res.busySlots || []).map((slot: any) => ({
            id: slot.id || `gcal-${Math.random()}`,
            title: slot.title || 'Lịch bận Google Calendar',
            time: slot.time || `${slot.start} - ${slot.end}`,
            start: slot.start,
            end: slot.end,
            date: targetDate,
            type: 'google-calendar-event',
            isBusy: true,
            organizer: res.email || userEmail
          }));

          this.liveEventsCache.set(targetDate, liveEvents);
        }
      }),
      catchError(err => {
        this.isLoadingLiveEvents$.next(false);
        console.warn('Lỗi khi truy vấn Google Calendar FreeBusy:', err);
        return of({ success: false, isConnected: false, busySlots: [] });
      })
    );
  }

  /**
   * 7. Đồng bộ lịch trực tiếp và trả về Promise danh sách sự kiện
   */
  async syncLiveSchedule(dateStr?: string, email?: string): Promise<UserCalendarEvent[]> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const userEmail = email || this.getCurrentUserEmail();

    return new Promise((resolve) => {
      this.fetchLiveFreeBusy(targetDate, userEmail).subscribe({
        next: () => {
          resolve(this.getUserEventsForDate(targetDate, userEmail));
        },
        error: () => {
          resolve(this.getUserEventsForDate(targetDate, userEmail));
        }
      });
    });
  }

  /**
   * 8. Tự động đẩy sự kiện Đặt phòng vào Google Calendar của người dùng (2-Way Live Sync)
   */
  createLiveEvent(booking: { spaceName: string; date: string; startTime: string; endTime: string; code?: string; building?: string; location?: string }, email?: string): Observable<any> {
    const userEmail = email || this.getCurrentUserEmail();
    return this.http.post<any>(`${SERVER_BASE_URL}/api/calendar/events`, {
      email: userEmail,
      bookingData: booking
    });
  }

  /**
   * Tính số giờ thuê thực tế giữa 2 mốc thời gian (VD: "08:00" đến "11:30" => 3.5 giờ)
   */
  calculateDuration(startTime: string, endTime: string, startDate?: string, endDate?: string): number {
    try {
      const sDateStr = startDate || '2026-01-01';
      const eDateStr = endDate || startDate || '2026-01-01';
      const [sH, sM] = (startTime || '09:00').split(':').map(Number);
      const [eH, eM] = (endTime || '11:00').split(':').map(Number);
      const start = new Date(`${sDateStr}T${String(sH).padStart(2, '0')}:${String(sM || 0).padStart(2, '0')}:00`);
      const end = new Date(`${eDateStr}T${String(eH).padStart(2, '0')}:${String(eM || 0).padStart(2, '0')}:00`);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs <= 0) return 1;
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.max(1, Math.round(diffHours * 10) / 10);
    } catch {
      return 2;
    }
  }

  /**
   * Lấy danh sách sự kiện lịch trình thực tế của người dùng theo ngày được chọn
   * Ưu tiên 1: Dữ liệu thời gian thực từ Google Calendar API (nếu đã kết nối)
   * Ưu tiên 2: Sự kiện đặt phòng trước đó lưu tại LocalStorage
   * Ưu tiên 3: Lịch mẫu thực tế của sinh viên/doanh nhân (Fallback offline)
   */
  getUserEventsForDate(dateStr?: string, userEmail?: string): UserCalendarEvent[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = dateStr || todayStr;

    // 1. Kiểm tra sự kiện đã lưu trong bộ nhớ cục bộ (nếu người dùng đã đặt phòng trước đó)
    let userCustomEvents: UserCalendarEvent[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('uel_cal_events_' + targetDate);
        if (stored) {
          userCustomEvents = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Cannot parse stored calendar events:', e);
      }
    }

    // 2. NẾU ĐÃ CÓ DỮ LIỆU ĐỒNG BỘ THỜI GIAN THỰC TỪ GOOGLE CALENDAR
    if (this.liveEventsCache.has(targetDate)) {
      const liveEvents = this.liveEventsCache.get(targetDate) || [];
      return [...liveEvents, ...userCustomEvents];
    }

    // 3. Khi chưa kết nối Google Calendar hoặc không có lịch bận: Trả về chỉ các sự kiện người dùng đã đặt thực tế
    return [...userCustomEvents];
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
    const baseSrc = encodeURIComponent('vi.vietnamese#holiday@group.v.calendar.google.com');
    let url = `https://calendar.google.com/calendar/embed?src=${baseSrc}&ctz=Asia%2FHo_Chi_Minh&mode=${mode}&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;
    if (targetDate) {
      const cleaned = targetDate.replace(/-/g, '');
      if (cleaned.length >= 8) {
        url += `&dates=${cleaned}/${cleaned}`;
      }
    }
    return url;
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
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          targetDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      } else if (dateStr.includes('-')) {
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
