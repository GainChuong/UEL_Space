import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../services/translate.pipe';
import { I18nService } from '../../services/i18n.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { BookingService, BookingRecord } from '../../services/booking.service';

@Component({
  imports: [CommonModule, FormsModule, TranslatePipe],
  selector: 'app-booking-history',
  templateUrl: './booking-history.html',
  styleUrl: './booking-history.scss'
})
export class BookingHistory implements OnInit, OnDestroy {
  private i18n = inject(I18nService);
  private googleCalendarService = inject(GoogleCalendarService);
  private bookingService = inject(BookingService);
  private subBookings?: Subscription;
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

  bookings: BookingRecord[] = [];

  ngOnInit() {
    this.subBookings = this.bookingService.bookings$.subscribe(list => {
      this.bookings = list;
    });
  }

  ngOnDestroy() {
    this.subBookings?.unsubscribe();
  }

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
      this.bookingService.updateStatus(booking.id, 'cancelled', 'Đã hủy');
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
