import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { SettingsService } from './settings.service';
import { BOOKINGS_API_URL } from './api-config';

export interface BookingRecord {
  id: string;
  spaceId?: string;
  roomName: string;
  building: string;
  roomType: string;
  date: string; // YYYY-MM-DD (Check-in Date)
  endDate?: string; // YYYY-MM-DD (Check-out Date)
  startTime?: string; // HH:mm (Check-in Time)
  endTime?: string; // HH:mm (Check-out Time)
  timeSlot: string; // e.g. "08:00 - 10:00"
  purpose: string;
  capacity: number;
  status: 'pending' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  statusText: string;
  qrCodeUrl?: string;
  createdAt: string;
  totalAmount?: number;
  cancelReason?: string;
  cancelledAt?: string;
}

const STORAGE_KEY = 'uel_space_booking_records_v3';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private settingsService = inject(SettingsService);
  private http = inject(HttpClient);

  private initialBookings: BookingRecord[] = [
    {
      id: 'UEL-88392',
      roomName: 'Boardroom VIP B1',
      building: 'Central Tower Q.1 - Tầng 12',
      roomType: 'Phòng họp VIP',
      date: '2026-11-02',
      endDate: '2026-11-02',
      startTime: '14:00',
      endTime: '16:00',
      timeSlot: '14:00 - 16:00',
      purpose: 'Họp chiến lược ký kết hợp đồng đối tác B2B',
      capacity: 24,
      status: 'upcoming',
      statusText: 'Sắp tới',
      createdAt: '11/10/2026 14:00'
    },
    {
      id: 'UEL-88210',
      roomName: 'Private Suite A2',
      building: 'TechPark Executive Hub - Tầng 5',
      roomType: 'Văn phòng riêng',
      date: '2026-11-03',
      endDate: '2026-11-03',
      startTime: '09:00',
      endTime: '11:30',
      timeSlot: '09:00 - 11:30',
      purpose: 'Làm việc tập trung cùng đội ngũ sáng lập',
      capacity: 12,
      status: 'upcoming',
      statusText: 'Sắp tới',
      createdAt: '11/10/2026 09:00'
    },
    {
      id: 'UEL-88150',
      roomName: 'Khu Hot Desk Coworking',
      building: 'Innovation Hub Q.2 - Tầng 2',
      roomType: 'Bàn làm việc linh hoạt',
      date: '2026-11-04',
      endDate: '2026-11-04',
      startTime: '08:00',
      endTime: '17:00',
      timeSlot: '08:00 - 17:00',
      purpose: 'Gói làm việc linh hoạt theo ngày cho 3 nhân sự',
      capacity: 60,
      status: 'upcoming',
      statusText: 'Sắp tới',
      createdAt: '10/10/2026 16:30'
    },
    {
      id: 'UEL-87941',
      roomName: 'Hội trường Workshop A3',
      building: 'Landmark Lounge - Tầng 8',
      roomType: 'Không gian sự kiện',
      date: '2026-11-05',
      endDate: '2026-11-05',
      startTime: '13:00',
      endTime: '17:00',
      timeSlot: '13:00 - 17:00',
      purpose: 'Tổ chức sự kiện Demo Day kết nối nhà đầu tư',
      capacity: 100,
      status: 'upcoming',
      statusText: 'Sắp tới',
      createdAt: '09/10/2026 09:30'
    },
    {
      id: 'UEL-88777',
      roomName: 'Focus Pod 1 Cách Âm',
      building: 'Green Office Suites - Tầng 3',
      roomType: 'Meeting Pod',
      date: '2026-11-02',
      endDate: '2026-11-02',
      startTime: '15:00',
      endTime: '17:30',
      timeSlot: '15:00 - 17:30',
      purpose: 'Phỏng vấn ứng viên cấp cao trực tuyến',
      capacity: 4,
      status: 'upcoming',
      statusText: 'Sắp tới',
      createdAt: '11/10/2026 10:15'
    },
    {
      id: 'UEL-88999',
      roomName: 'Creative Studio Lab B2',
      building: 'TechPark Executive Hub - Tầng 6',
      roomType: 'Phòng họp sáng tạo',
      date: '2026-11-02',
      endDate: '2026-11-02',
      startTime: '08:00',
      endTime: '12:00',
      timeSlot: '08:00 - 12:00',
      purpose: 'Workshop lên ý tưởng sản phẩm mới',
      capacity: 20,
      status: 'active',
      statusText: 'Đang sử dụng',
      createdAt: '11/10/2026 07:45'
    },
    {
      id: 'UEL-87600',
      roomName: 'Boardroom VIP B1',
      building: 'Central Tower Q.1 - Tầng 12',
      roomType: 'Phòng họp VIP',
      date: '2026-10-10',
      endDate: '2026-10-10',
      startTime: '10:00',
      endTime: '12:00',
      timeSlot: '10:00 - 12:00',
      purpose: 'Họp cổ đông thường niên quý III',
      capacity: 24,
      status: 'completed',
      statusText: 'Đã hoàn thành',
      createdAt: '08/10/2026 15:20'
    },
    {
      id: 'UEL-87112',
      roomName: 'Focus Pod 1 Cách Âm',
      building: 'Green Office Suites - Tầng 3',
      roomType: 'Meeting Pod',
      date: '2026-10-08',
      endDate: '2026-10-08',
      startTime: '14:00',
      endTime: '16:00',
      timeSlot: '14:00 - 16:00',
      purpose: 'Phỏng vấn ứng viên cấp cao (Đã hủy)',
      capacity: 4,
      status: 'cancelled',
      statusText: 'Đã hủy',
      cancelReason: 'Thay đổi lịch công tác đột xuất của ban giám đốc',
      cancelledAt: '07/10/2026 16:30',
      createdAt: '06/10/2026 11:00'
    }
  ];

  private bookingsSubject = new BehaviorSubject<BookingRecord[]>([]);
  public bookings$: Observable<BookingRecord[]> = this.bookingsSubject.asObservable();

  constructor() {
    this.loadBookings();
    this.checkUpcomingReminders();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const updated = JSON.parse(event.newValue);
            if (Array.isArray(updated)) {
              this.bookingsSubject.next(updated);
            }
          } catch {}
        }
      });
      window.addEventListener('uel_booking_checkin_synced', () => {
        this.loadBookings();
      });
    }
  
  }

  private loadBookings(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.bookingsSubject.next(parsed);
            return;
          }
        } catch (e) {
          console.warn('[BookingService] Failed to parse stored bookings:', e);
        }
      }
    }
    // Default fallback
    this.bookingsSubject.next(this.initialBookings);
    this.saveBookings(this.initialBookings);
  }

  private saveBookings(list: BookingRecord[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  }

  public getBookings(): BookingRecord[] {
    return this.bookingsSubject.value;
  }

  /**
   * Tạo lượt đặt mới realtime, tự động lưu và gửi thông báo hệ thống vào Icon chuông
   */
  public addBooking(booking: {
    id?: string;
    spaceId?: string;
    roomName: string;
    building?: string;
    roomType?: string;
    date: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    timeSlot: string;
    purpose?: string;
    capacity?: number;
    totalAmount?: number;
  }): BookingRecord {
    const code = booking.id || 'UEL-' + Math.floor(10000 + Math.random() * 90000);
    const now = new Date();
    const createdAtStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Phân tích startTime và endTime từ timeSlot nếu chưa truyền trực tiếp
    let sTime = booking.startTime || '';
    let eTime = booking.endTime || '';
    if ((!sTime || !eTime) && booking.timeSlot && booking.timeSlot.includes('-')) {
      const parts = booking.timeSlot.split('-').map(p => p.trim());
      if (parts.length === 2) {
        sTime = parts[0];
        eTime = parts[1];
      }
    }

    const newRecord: BookingRecord = {
      id: code,
      spaceId: booking.spaceId,
      roomName: booking.roomName,
      building: booking.building || 'UEL Central Space',
      roomType: booking.roomType || 'Không gian làm việc',
      date: booking.date,
      endDate: booking.endDate || booking.date,
      startTime: sTime,
      endTime: eTime,
      timeSlot: booking.timeSlot,
      purpose: booking.purpose || 'Làm việc & Học tập trên UEL Space',
      capacity: booking.capacity || 4,
      status: 'pending',
      statusText: 'Chờ duyệt',
      createdAt: createdAtStr,
      totalAmount: booking.totalAmount,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${code}`
    };

    const currentList = this.bookingsSubject.value;
    const updated = [newRecord, ...currentList];
    this.bookingsSubject.next(updated);
    this.saveBookings(updated);

    // 1. Gửi thông báo gửi đơn chờ duyệt vào chuông
    this.settingsService.addNotification({
      title: 'Đơn đặt chỗ đang chờ duyệt',
      message: `Đơn thuê ${booking.roomName} (${code}) ngày ${booking.date} (${booking.timeSlot}) đã được gửi và đang chờ đối tác/hệ thống xét duyệt.`,
      type: 'info',
      category: 'booking'
    });

    // Mô phỏng cơ chế sàn (như Shopee / Agoda): Sau 12 giây đối tác tự động duyệt đơn -> Chuyển sang 'Sắp tới' (upcoming)
    setTimeout(() => {
      this.approveBooking(code);
    }, 12000);

    // 2. Đồng bộ trực tiếp lên MongoDB Atlas thông qua API
    this.syncBookingToBackend(newRecord);

    // 3. Nếu ngày sử dụng là hôm nay hoặc ngày mai, gửi thêm thông báo nhắc nhở sắp tới hạn
    this.checkSingleBookingProximity(newRecord);

    return newRecord;
  }

  /**
   * Đồng bộ đơn đặt phòng lên Backend MongoDB Atlas
   */
  private syncBookingToBackend(record: BookingRecord): void {
    try {
      const currentUser = (this.settingsService as any).currentUserSubject?.value || this.settingsService.defaultStudentUser;
      const payload = {
        code: record.id,
        spaceId: record.spaceId || 'a2-1',
        spaceName: record.roomName,
        buildingName: record.building,
        date: record.date,
        usageDate: record.date,
        startTime: record.startTime || '09:00',
        endTime: record.endTime || '11:00',
        timeSlot: record.timeSlot,
        purpose: record.purpose || 'Thuê không gian làm việc',
        activityType: 'MEETING',
        expectedUserCount: Number(record.capacity) || 4,
        totalAmount: record.totalAmount || 0,
        userEmail: currentUser.email,
        userName: currentUser.name
      };

      this.http.post<any>(BOOKINGS_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role || 'BUYER',
          'x-user-email': currentUser.email,
          'x-user-id': currentUser.id
        }
      }).subscribe({
        next: (res) => {
          console.log('[BookingService] Đơn thuê đã được cập nhật thành công lên MongoDB Atlas:', res);
        },
        error: (err) => {
          console.warn('[BookingService] Không thể ghi trực tiếp lên MongoDB Atlas (offline/mock fallback):', err.message);
        }
      });
    } catch (e) {
      console.warn('[BookingService] Exception khi đồng bộ MongoDB:', e);
    }
  }

  /**
   * Thực hiện check-in trực tiếp: chuyển trạng thái sang 'active' (Đang sử dụng)
   */
  public checkIn(id: string): void {
    const target = this.bookingsSubject.value.find(b => b.id === id);
    this.updateStatus(id, 'active', 'Đang sử dụng');
    this.settingsService.addNotification({
      title: 'Check-in thành công! 🏢',
      message: `Mã đặt chỗ ${id} (${target?.roomName || 'Không gian'}) đã được check-in thành công. Trạng thái chuyển sang Đang sử dụng.`,
      type: 'success',
      category: 'presence'
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('uel_booking_checkin_synced'));
    }
  }

  /**
   * Tự động hoặc thủ công phê duyệt đơn đặt phòng (Chờ duyệt -> Sắp tới)
   */
  public approveBooking(id: string): void {
    const target = this.bookingsSubject.value.find(b => b.id === id);
    if (!target || target.status !== 'pending') return;

    this.updateStatus(id, 'upcoming', 'Sắp tới');
    this.settingsService.addNotification({
      title: 'Đơn đặt chỗ đã được phê duyệt! 🎉',
      message: `Đơn thuê ${target.roomName} (${target.id}) ngày ${target.date} (${target.timeSlot}) đã được đối tác phê duyệt. Bạn có thể xem mã QR Check-in.`,
      type: 'success',
      category: 'booking'
    });
  }

  /**
   * Cập nhật trạng thái đặt chỗ (Hủy đơn, Hoàn tất, v.v.)
   */
  public updateStatus(
    id: string, 
    status: 'pending' | 'active' | 'upcoming' | 'completed' | 'cancelled', 
    statusText: string,
    cancelReason?: string
  ): void {
    const list = this.bookingsSubject.value.map(b => {
      if (b.id === id) {
        const now = new Date();
        const cancelledAtStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return { 
          ...b, 
          status, 
          statusText,
          ...(cancelReason ? { cancelReason, cancelledAt: cancelledAtStr } : {})
        };
      }
      return b;
    });
    this.bookingsSubject.next(list);
    this.saveBookings(list);

    if (status === 'cancelled') {
      this.settingsService.addNotification({
        title: 'Đã hủy lịch đặt chỗ',
        message: `Đơn thuê mã ${id} đã được hủy thành công. Lý do: "${cancelReason || 'Người dùng yêu cầu hủy'}".`,
        type: 'warning',
        category: 'booking'
      });
    }
  }

  /**
   * Rà soát các lịch đặt chỗ sắp diễn ra (hôm nay hoặc ngày mai) để bắn thông báo nhắc nhở lên Icon chuông
   */
  public checkUpcomingReminders(): void {
    const list = this.bookingsSubject.value;
    list.forEach(item => {
      if (item.status === 'upcoming') {
        this.checkSingleBookingProximity(item);
      }
    });
  }

  private checkSingleBookingProximity(booking: BookingRecord): void {
    if (!booking.date) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);

    const diffTime = bookingDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Kiểm tra xem đã gửi thông báo nhắc nhở cho đơn này chưa trong phiên này
    const reminderKey = `uel_notified_reminder_${booking.id}_${booking.date}`;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (sessionStorage.getItem(reminderKey)) {
        return;
      }
    }

    if (diffDays === 0) {
      this.settingsService.addNotification({
        title: 'Nhắc nhở: Lịch sử dụng không gian hôm nay!',
        message: `Bạn có lịch sử dụng ${booking.roomName} hôm nay (${booking.timeSlot}). Vui lòng chuẩn bị mã QR trên vé để check-in tại Kiosk.`,
        type: 'warning',
        category: 'presence'
      });
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(reminderKey, 'true');
      }
    } else if (diffDays === 1) {
      this.settingsService.addNotification({
        title: 'Lịch sử dụng không gian vào ngày mai',
        message: `Lịch hẹn thuê ${booking.roomName} của bạn sẽ diễn ra vào ngày mai (${booking.date} lúc ${booking.timeSlot}).`,
        type: 'info',
        category: 'booking'
      });
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(reminderKey, 'true');
      }
    }
  }
  /**
   * Helper chuyển chuỗi HH:mm thành số phút từ đầu ngày
   */
  public timeToMinutes(timeStr?: string): number | null {
    if (!timeStr || !timeStr.includes(':')) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  /**
   * Kiểm tra giao thoa giữa 2 khoảng thời gian
   */
  public timeRangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
    return Math.max(startA, startB) < Math.min(endA, endB);
  }

  /**
   * Kiểm tra xem một phòng cụ thể có bị trùng lịch trong ngày & khung giờ được chọn hay không
   */
  public isSpaceBooked(
    spaceIdentifier: { id?: string; code?: string; name?: string; slug?: string },
    checkInDate: string,
    checkOutDate: string,
    checkInTime: string,
    checkOutTime: string
  ): { isBooked: boolean; conflictBooking?: BookingRecord } {
    if (!checkInDate) return { isBooked: false };

    const inMins = this.timeToMinutes(checkInTime) ?? (8 * 60);
    const outMins = this.timeToMinutes(checkOutTime) ?? (17 * 60);

    const targetId = (spaceIdentifier.id || '').toLowerCase().trim();
    const targetCode = (spaceIdentifier.code || '').toLowerCase().trim();
    const targetName = (spaceIdentifier.name || '').toLowerCase().trim();

    const activeBookings = this.bookingsSubject.value.filter(
      b => b.status === 'active' || b.status === 'upcoming' || b.status === 'pending'
    );

    for (const b of activeBookings) {
      // 1. So khớp định danh phòng
      const bSpaceId = (b.spaceId || '').toLowerCase().trim();
      const bRoomName = (b.roomName || '').toLowerCase().trim();

      const isSameRoom = (targetId && bSpaceId && targetId === bSpaceId) ||
                         (targetCode && bSpaceId && targetCode === bSpaceId) ||
                         (targetName && bRoomName && targetName === bRoomName);

      if (!isSameRoom) continue;

      // 2. So khớp ngày (giao thoa giữa [checkInDate, checkOutDate] và [b.date, b.endDate])
      const bStartDate = b.date;
      const bEndDate = b.endDate || b.date;
      const qStartDate = checkInDate;
      const qEndDate = checkOutDate || checkInDate;

      const dateOverlap = (qStartDate <= bEndDate) && (qEndDate >= bStartDate);
      if (!dateOverlap) continue;

      // 3. So khớp khung giờ
      let bStartMins = this.timeToMinutes(b.startTime);
      let bEndMins = this.timeToMinutes(b.endTime);

      if (bStartMins === null || bEndMins === null) {
        if (b.timeSlot && b.timeSlot.includes('-')) {
          const parts = b.timeSlot.split('-').map(p => p.trim());
          bStartMins = this.timeToMinutes(parts[0]);
          bEndMins = this.timeToMinutes(parts[1]);
        }
      }

      // Nếu không parse được giờ của booking, coi như chiếm trọn ngày
      if (bStartMins === null || bEndMins === null) {
        return { isBooked: true, conflictBooking: b };
      }

      if (this.timeRangesOverlap(inMins, outMins, bStartMins, bEndMins)) {
        return { isBooked: true, conflictBooking: b };
      }
    }

    return { isBooked: false };
  }
}
