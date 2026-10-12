import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../services/translate.pipe';
import { I18nService } from '../../services/i18n.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';

export interface BookingRecord {
  id: string;
  roomName: string;
  building: string;
  roomType: string;
  date: string;
  timeSlot: string;
  purpose: string;
  capacity: number;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  statusText: string;
  qrCodeUrl?: string;
  createdAt: string;
}

@Component({
  imports: [CommonModule, FormsModule, TranslatePipe],
  selector: 'app-booking-history',
  templateUrl: './booking-history.html',
  styleUrl: './booking-history.scss'
})
export class BookingHistory implements OnInit {
  private i18n = inject(I18nService);
  private googleCalendarService = inject(GoogleCalendarService);
  searchTerm: string = '';
  selectedTab: string = 'all';
  selectedArea: string = 'all';
  selectedStatusFilter: string = 'all';
  selectedDate: string = '';

  openAreaDropdown: boolean = false;
  openStatusDropdown: boolean = false;
  openDateDropdown: boolean = false;
  
  // Dynamic Month & Year Navigation
  currentYear: number = 2026;
  currentMonth: number = 9; // 0-indexed: 9 = Tháng 10
  monthNames: string[] = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  selectedCalendarDay: number | null = null;

  showQrModal: boolean = false;
  selectedBookingForQr: BookingRecord | null = null;

  areas: string[] = [
    'Tất cả khu vực',
    'Central Tower Q.1',
    'TechPark Executive Hub',
    'Innovation Hub Q.2',
    'Landmark Lounge',
    'Green Office Suites',
    'Startup Pod Hub'
  ];

  statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang sử dụng' },
    { value: 'upcoming', label: 'Sắp tới' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];

  bookings: BookingRecord[] = [
    {
      id: 'UEL-88392',
      roomName: 'Boardroom VIP B1',
      building: 'Central Tower Q.1 - Tầng 12',
      roomType: 'Phòng họp VIP',
      date: '2026-10-12',
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
      date: '2026-10-12',
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
      date: '2026-10-13',
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
      date: '2026-10-11',
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
      date: '2026-10-14',
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
      date: '2026-10-11',
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

  ngOnInit() {}

  toggleAreaDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.openAreaDropdown = !this.openAreaDropdown;
    this.openStatusDropdown = false;
    this.openDateDropdown = false;
  }

  toggleStatusDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.openStatusDropdown = !this.openStatusDropdown;
    this.openAreaDropdown = false;
    this.openDateDropdown = false;
  }

  toggleDateDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.openDateDropdown = !this.openDateDropdown;
    this.openAreaDropdown = false;
    this.openStatusDropdown = false;
  }

  selectAreaOption(area: string) {
    this.selectedArea = area === 'Tất cả khu vực' ? 'all' : area;
    this.openAreaDropdown = false;
  }

  selectStatusOption(val: string) {
    this.selectedStatusFilter = val;
    this.openStatusDropdown = false;
  }

  get calendarMonthTitle(): string {
    return `${this.monthNames[this.currentMonth]}, ${this.currentYear}`;
  }

  get calendarDaysList(): (number | null)[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }

  prevMonth(event?: Event) {
    if (event) event.stopPropagation();
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(event?: Event) {
    if (event) event.stopPropagation();
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  selectBookingCalendarDay(day: number | null) {
    if (!day) return;
    this.selectedCalendarDay = day;
    const formattedMonth = (this.currentMonth + 1) < 10 ? `0${this.currentMonth + 1}` : `${this.currentMonth + 1}`;
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    this.selectedDate = `${this.currentYear}-${formattedMonth}-${formattedDay}`;
    this.openDateDropdown = false;
  }

  closeAllDropdowns() {
    this.openAreaDropdown = false;
    this.openStatusDropdown = false;
    this.openDateDropdown = false;
  }

  formatDisplayDate(dStr: string): string {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedTab = 'all';
    this.selectedArea = 'all';
    this.selectedStatusFilter = 'all';
    this.selectedDate = '';
    this.selectedCalendarDay = null;
    this.closeAllDropdowns();
  }

  get filteredBookings() {
    return this.bookings.filter(b => {
      // 1. Text Search
      const matchSearch = !this.searchTerm ||
                          b.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          b.roomName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          b.building.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          b.purpose.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // 2. Status Tab / Dropdown Filter
      let matchStatus = true;
      if (this.selectedStatusFilter !== 'all') {
        matchStatus = b.status === this.selectedStatusFilter;
      } else if (this.selectedTab === 'active') {
        matchStatus = (b.status === 'active' || b.status === 'upcoming');
      } else if (this.selectedTab === 'completed') {
        matchStatus = b.status === 'completed';
      } else if (this.selectedTab === 'cancelled') {
        matchStatus = b.status === 'cancelled';
      }

      // 3. Area / Building Filter
      let matchArea = true;
      if (this.selectedArea !== 'all' && this.selectedArea !== 'Tất cả khu vực') {
        matchArea = b.building.toLowerCase().includes(this.selectedArea.toLowerCase()) ||
                    b.roomName.toLowerCase().includes(this.selectedArea.toLowerCase());
      }

      // 4. Date Filter
      let matchDate = true;
      if (this.selectedDate) {
        matchDate = b.date === this.selectedDate;
      }

      return matchSearch && matchStatus && matchArea && matchDate;
    });
  }

  get activeCount() {
    return this.bookings.filter(b => b.status === 'active' || b.status === 'upcoming').length;
  }

  get completedCount() {
    return this.bookings.filter(b => b.status === 'completed').length;
  }

  get cancelledCount() {
    return this.bookings.filter(b => b.status === 'cancelled').length;
  }

  openQrModal(booking: BookingRecord) {
    this.selectedBookingForQr = booking;
    this.showQrModal = true;
  }

  closeQrModal() {
    this.showQrModal = false;
    this.selectedBookingForQr = null;
  }

  cancelBooking(booking: BookingRecord) {
    if (confirm(`${this.i18n.t('Bạn có chắc chắn muốn hủy lượt đặt chỗ mã')} ${booking.id} (${booking.roomName})?`)) {
      booking.status = 'cancelled';
      booking.statusText = 'Đã hủy';
    }
  }

  addToGoogleCalendar(booking: BookingRecord) {
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt phòng ${booking.roomName}`,
      roomName: booking.roomName,
      building: booking.building,
      code: booking.id,
      date: booking.date,
      timeSlot: booking.timeSlot,
      purpose: booking.purpose,
      bookerName: 'Khách thuê Doanh nghiệp'
    });
  }

  downloadIcs(booking: BookingRecord) {
    this.googleCalendarService.downloadIcsFile({
      title: `[UEL SPACE] Đặt phòng ${booking.roomName}`,
      roomName: booking.roomName,
      building: booking.building,
      code: booking.id,
      date: booking.date,
      timeSlot: booking.timeSlot,
      purpose: booking.purpose,
      bookerName: 'Khách thuê Doanh nghiệp'
    });
  }
}
