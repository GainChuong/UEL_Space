import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SettingsService } from './settings.service';

export interface BookingRecord {
  id: string;
  roomName: string;
  building: string;
  roomType: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "08:00 - 10:00"
  purpose: string;
  capacity: number;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  statusText: string;
  qrCodeUrl?: string;
  createdAt: string;
  totalAmount?: number;
}

const STORAGE_KEY = 'uel_space_booking_records_v1';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private settingsService = inject(SettingsService);

  private initialBookings: BookingRecord[] = [
    {
      id: 'UEL-88392',
      roomName: 'Boardroom VIP B1',
      building: 'Central Tower Q.1 - Tầng 12',
      roomType: 'Phòng họp VIP',
      date: '2026-10-18',
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
      date: '2026-10-17',
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
      date: '2026-10-19',
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
      date: '2026-10-16',
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
      date: '2026-10-20',
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
      date: '2026-10-15',
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
      timeSlot: '14:00 - 16:00',
      purpose: 'Thay đổi lịch công tác (Đã hủy)',
      capacity: 4,
      status: 'cancelled',
      statusText: 'Đã hủy',
      createdAt: '06/10/2026 11:00'
    }
  ];

  private bookingsSubject = new BehaviorSubject<BookingRecord[]>([]);
  public bookings$: Observable<BookingRecord[]> = this.bookingsSubject.asObservable();

  constructor() {
    this.loadBookings();
    this.checkUpcomingReminders();
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
    roomName: string;
    building?: string;
    roomType?: string;
    date: string;
    timeSlot: string;
    purpose?: string;
    capacity?: number;
    totalAmount?: number;
  }): BookingRecord {
    const code = booking.id || 'UEL-' + Math.floor(10000 + Math.random() * 90000);
    const now = new Date();
    const createdAtStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const newRecord: BookingRecord = {
      id: code,
      roomName: booking.roomName,
      building: booking.building || 'UEL Central Space',
      roomType: booking.roomType || 'Không gian làm việc',
      date: booking.date,
      timeSlot: booking.timeSlot,
      purpose: booking.purpose || 'Làm việc & Học tập trên UEL Space',
      capacity: booking.capacity || 4,
      status: 'upcoming',
      statusText: 'Sắp tới',
      createdAt: createdAtStr,
      totalAmount: booking.totalAmount,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${code}`
    };

    const currentList = this.bookingsSubject.value;
    const updated = [newRecord, ...currentList];
    this.bookingsSubject.next(updated);
    this.saveBookings(updated);

    // 1. Gửi thông báo đặt chỗ thành công vào chuông (Icon notification)
    this.settingsService.addNotification({
      title: 'Đặt chỗ thành công',
      message: `Đơn thuê ${booking.roomName} (${code}) vào ngày ${booking.date} (${booking.timeSlot}) đã được kích hoạt thành công.`,
      type: 'success',
      category: 'booking'
    });

    // 2. Nếu ngày sử dụng là hôm nay hoặc ngày mai, gửi thêm thông báo nhắc nhở sắp tới hạn
    this.checkSingleBookingProximity(newRecord);

    return newRecord;
  }

  /**
   * Cập nhật trạng thái đặt chỗ (Hủy đơn, Hoàn tất)
   */
  public updateStatus(id: string, status: 'active' | 'upcoming' | 'completed' | 'cancelled', statusText: string): void {
    const list = this.bookingsSubject.value.map(b => {
      if (b.id === id) {
        return { ...b, status, statusText };
      }
      return b;
    });
    this.bookingsSubject.next(list);
    this.saveBookings(list);

    if (status === 'cancelled') {
      this.settingsService.addNotification({
        title: 'Đã hủy lịch đặt chỗ',
        message: `Đơn thuê mã ${id} đã được hủy thành công. Không gian đã được giải phóng trở lại sàn.`,
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
}
