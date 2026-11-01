import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SERVER_BASE_URL, SERVER_IMAGES_LINK } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { BookingService } from '../../services/booking.service';
import { normalizeSpace, getFallbackMarketplaceSpaces, createSpaceSlug } from '../../services/spaces-data';

export interface SpaceItem {
  id: string;
  name: string;
  building: string;
  spaceType: string;
  capacity: number;
  capacityText: string;
  areaSize: number;
  hourlyPrice: number;
  status: 'available' | 'in-use' | 'reserved' | 'maintenance';
  statusText: string;
  equipment: string[];
  image: string;
}

@Component({
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private router = inject(Router);
  server_images_link = SERVER_IMAGES_LINK;
  searchQuery: string = '';

  openSpaceDetail(space: any, event?: Event) {
    if (event) event.stopPropagation();
    if (!space) return;
    const targetSlug = space.slug || createSpaceSlug(space);
    if (targetSlug) {
      this.router.navigate(['/spaces', targetSlug]);
    } else {
      this.openBookingModal(space);
    }
  }
  selectedDateFilter: string = 'Hôm nay';
  selectedTimeSlot: string = '08:00 - 17:00';
  selectedCapacity: string = 'all';
  selectedEquipment: string = 'all';

  // 1. Flexible Check-in & Check-out State
  checkInDateStr: string = '2026-11-01';
  checkInDateLabel: string = 'Hôm nay';
  checkInTime: string = '08:00';

  checkOutDateStr: string = '2026-11-01';
  checkOutDateLabel: string = 'Hôm nay';
  checkOutTime: string = '17:00';

  minSelectableDate: string = '2026-11-01';

  checkInPresetOptions = [
    { id: 'today', label: 'Hôm nay' },
    { id: 'tomorrow', label: 'Ngày mai' },
    { id: 'next_monday', label: 'Thứ 2 tới' },
    { id: 'weekend', label: 'Cuối tuần' }
  ];

  checkOutPresetOptions = [
    { id: 'same_day', label: 'Cùng ngày' },
    { id: 'next_day', label: 'Hôm sau' },
    { id: 'plus_2_days', label: '+2 ngày' },
    { id: 'plus_1_week', label: '+1 tuần' }
  ];

  get checkInDate(): string {
    return this.checkInDateLabel;
  }
  set checkInDate(val: string) {
    this.checkInDateLabel = val;
  }

  get checkOutDate(): string {
    return this.checkOutDateLabel;
  }
  set checkOutDate(val: string) {
    this.checkOutDateLabel = val;
  }

  dateOptions: string[] = ['Hôm nay', 'Ngày mai', 'Thứ 2 tới', 'Cuối tuần'];

  formatDateToISO(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  get checkInPillDisplay(): string {
    const dStr = this.formatDisplayDate(this.checkInDateStr);
    const todayStr = this.formatDateToISO(new Date());
    if (this.checkInDateStr === todayStr) {
      return `${this.checkInTime} • Hôm nay (${dStr.slice(0, 5)})`;
    }
    return `${this.checkInTime} • ${dStr}`;
  }

  get checkOutPillDisplay(): string {
    const dStr = this.formatDisplayDate(this.checkOutDateStr);
    if (this.checkOutDateStr === this.checkInDateStr) {
      return `${this.checkOutTime} • Cùng ngày (${dStr.slice(0, 5)})`;
    }
    return `${this.checkOutTime} • ${dStr}`;
  }
  timeOptions: string[] = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '13:00',
    '13:30', '14:00', '14:30', '15:00', '16:00', '17:00',
    '17:30', '18:00', '19:00', '20:00', '21:00'
  ];

  // 2. Capacity State (Direct typing + Up/Down steppers)
  capacityCount: number = 0; // 0 = all

  // 3. Multi-Select Amenities (Checkboxes)
  selectedEquipments: Set<string> = new Set<string>();

  equipmentOptions = [
    { value: 'ai-cam', label: 'AI Occupancy Detection', icon: 'camera' },
    { value: 'display', label: 'Màn hình 4K / Máy chiếu', icon: 'display' },
    { value: 'wifi', label: 'Cáp quang 1Gbps / Wi-Fi', icon: 'wifi' },
    { value: 'board', label: 'Bảng kính / Smartboard', icon: 'board' },
    { value: 'ac', label: 'Điều hòa không khí', icon: 'ac' },
    { value: 'mic', label: 'Micro hội nghị / Âm thanh', icon: 'mic' }
  ];

  activeDropdown: 'checkin' | 'checkout' | 'capacity' | 'equipment' | 'date' | 'time' | null = null;
  showCustomCalendar: boolean = false;
  currentYear: number = 2026;
  currentMonth: number = 9; // 0-indexed: 9 = Tháng 10
  monthNames: string[] = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  selectedCalendarDay: number = 8;

  datePresets = ['Hôm nay', 'Ngày mai', 'Tuần này'];
  timeSlotOptions = ['Tất cả khung giờ', '08:00 - 17:00', '07:00 - 11:30', '13:00 - 17:00', '17:30 - 21:00'];
  
  capacityOptions = [
    { value: 'all', label: 'Sức chứa' },
    { value: 'small', label: 'Dưới 20 người' },
    { value: 'medium', label: '20 - 50 người' },
    { value: 'large', label: 'Trên 50 người' }
  ];



  spaces: any[] = [];
  currentPage: number = 1;
  pageSize: number = 9;

  favorites: Set<string> = new Set<string>();

  ngOnInit() {
    const today = new Date();
    this.minSelectableDate = this.formatDateToISO(today);
    this.checkInDateStr = this.minSelectableDate;
    this.checkOutDateStr = this.minSelectableDate;
    this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots();
    this.googleCalendarService.connectionStatus$.subscribe(st => {
      this.googleCalendarStatus = st;
      this.cdr.detectChanges();
    });
    this.syncCalendarData();
    // Pre-populate from the same rich dataset as the map tab for instant rendering
    this.spaces = getFallbackMarketplaceSpaces().map(s => normalizeSpace(s));
    this.loadSpaces();
  }

  async loadSpaces() {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/spaces`);
      if (res.ok) {
        const json = await res.json();
        const dataList = json.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(dataList) && dataList.length > 0) {
          this.spaces = dataList.map(s => normalizeSpace(s));
          this.cdr.detectChanges();
          return;
        }
      }
    } catch (e) {
      console.warn('Cannot fetch from /api/spaces, using rich dataset marketplace fallback:', e);
    }
    this.cdr.detectChanges();
  }

  getImageUrl(space: any, index: number = 0): string {
    if (!space) return '/images/spaces/indoor_coworking_lounge_1.jpg';
    let img = '';
    if (space.images && space.images.length > index) {
      img = space.images[index];
    } else if (space.image) {
      img = space.image;
    }
    return this.getRawImageUrl(img);
  }

  defaultFallbackImage = '/images/spaces/indoor_coworking_lounge_1.jpg';

  handleImageError(event: any) {
    if (event && event.target && event.target.src !== this.defaultFallbackImage) {
      event.target.src = this.defaultFallbackImage;
    }
  }

  getRawImageUrl(img: string): string {
    if (!img) return this.defaultFallbackImage;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${this.server_images_link}${img.replace(/^\//, '')}`;
  }

  toggleFavorite(id: string, event?: Event) {
    if (event) event.stopPropagation();
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
  }


  // Trigger Search & Scroll to Results
  triggerSearch() {
    this.currentPage = 1;
    this.closeDropdowns();
    if (typeof window !== 'undefined') {
      const el = document.getElementById('spaces-grid-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // Check-in & Check-out Handlers
  selectCheckInPreset(presetId: string) {
    const base = new Date();
    if (presetId === 'today') {
      this.checkInDateStr = this.formatDateToISO(base);
      this.checkInDateLabel = 'Hôm nay';
    } else if (presetId === 'tomorrow') {
      const d = new Date(base);
      d.setDate(d.getDate() + 1);
      this.checkInDateStr = this.formatDateToISO(d);
      this.checkInDateLabel = 'Ngày mai';
    } else if (presetId === 'next_monday') {
      const d = new Date(base);
      const day = d.getDay();
      const diff = (day === 0 ? 1 : 8 - day);
      d.setDate(d.getDate() + diff);
      this.checkInDateStr = this.formatDateToISO(d);
      this.checkInDateLabel = 'Thứ 2 tới';
    } else if (presetId === 'weekend') {
      const d = new Date(base);
      const day = d.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      this.checkInDateStr = this.formatDateToISO(d);
      this.checkInDateLabel = 'Cuối tuần';
    }

    if (this.checkOutDateStr < this.checkInDateStr) {
      this.checkOutDateStr = this.checkInDateStr;
      this.checkOutDateLabel = this.checkInDateLabel;
    }
    this.onFilterChange();
  }

  onCustomCheckInDateChange(val: string) {
    if (!val) return;
    this.checkInDateStr = val;
    this.checkInDateLabel = this.formatDisplayDate(val);
    if (this.checkOutDateStr < this.checkInDateStr) {
      this.checkOutDateStr = this.checkInDateStr;
      this.checkOutDateLabel = this.checkInDateLabel;
    }
    this.onFilterChange();
  }

  selectCheckInDate(date: string) {
    if (date === 'Hôm nay') this.selectCheckInPreset('today');
    else if (date === 'Ngày mai') this.selectCheckInPreset('tomorrow');
    else if (date === 'Thứ 2 tới') this.selectCheckInPreset('next_monday');
    else if (date === 'Cuối tuần') this.selectCheckInPreset('weekend');
    else this.onCustomCheckInDateChange(date);
  }

  selectCheckInTime(time: string) {
    this.checkInTime = time;
    this.onFilterChange();
  }

  selectCheckOutPreset(presetId: string) {
    const base = new Date(this.checkInDateStr || new Date());
    if (presetId === 'same_day') {
      this.checkOutDateStr = this.formatDateToISO(base);
      this.checkOutDateLabel = 'Cùng ngày';
    } else if (presetId === 'next_day') {
      const d = new Date(base);
      d.setDate(d.getDate() + 1);
      this.checkOutDateStr = this.formatDateToISO(d);
      this.checkOutDateLabel = 'Hôm sau';
    } else if (presetId === 'plus_2_days') {
      const d = new Date(base);
      d.setDate(d.getDate() + 2);
      this.checkOutDateStr = this.formatDateToISO(d);
      this.checkOutDateLabel = '+2 ngày';
    } else if (presetId === 'plus_1_week') {
      const d = new Date(base);
      d.setDate(d.getDate() + 7);
      this.checkOutDateStr = this.formatDateToISO(d);
      this.checkOutDateLabel = '+1 tuần';
    }
    this.onFilterChange();
  }

  onCustomCheckOutDateChange(val: string) {
    if (!val) return;
    if (val < this.checkInDateStr) {
      this.checkOutDateStr = this.checkInDateStr;
    } else {
      this.checkOutDateStr = val;
    }
    this.checkOutDateLabel = this.formatDisplayDate(this.checkOutDateStr);
    this.onFilterChange();
  }

  selectCheckOutDate(date: string) {
    if (date === 'Hôm nay' || date === 'Cùng ngày') this.selectCheckOutPreset('same_day');
    else if (date === 'Ngày mai' || date === 'Hôm sau') this.selectCheckOutPreset('next_day');
    else if (date === '+2 ngày') this.selectCheckOutPreset('plus_2_days');
    else if (date === 'Cuối tuần' || date === '+1 tuần') this.selectCheckOutPreset('plus_1_week');
    else this.onCustomCheckOutDateChange(date);
  }

  selectCheckOutTime(time: string) {
    this.checkOutTime = time;
    this.onFilterChange();
  }

  timeToMinutes(hhmm: string): number | null {
    if (!hhmm || !hhmm.includes(':')) return null;
    const [h, m] = hhmm.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  // Capacity Stepper & Direct Typing Handlers
  incrementCapacity(step: number = 1, event?: Event) {
    if (event) event.stopPropagation();
    this.capacityCount = Math.max(0, (this.capacityCount || 0) + step);
    this.onFilterChange();
  }

  decrementCapacity(step: number = 1, event?: Event) {
    if (event) event.stopPropagation();
    this.capacityCount = Math.max(0, (this.capacityCount || 0) - step);
    this.onFilterChange();
  }

  onCapacityInputChange(event: any) {
    const val = parseInt(event.target.value, 10);
    this.capacityCount = isNaN(val) || val < 0 ? 0 : val;
    this.onFilterChange();
  }

  // Multi-Select Equipment Handlers
  toggleEquipment(val: string, event?: Event) {
    if (event) event.stopPropagation();
    if (this.selectedEquipments.has(val)) {
      this.selectedEquipments.delete(val);
    } else {
      this.selectedEquipments.add(val);
    }
    this.onFilterChange();
  }

  isEquipmentSelected(val: string): boolean {
    return this.selectedEquipments.has(val);
  }

  clearEquipments(event?: Event) {
    if (event) event.stopPropagation();
    this.selectedEquipments.clear();
    this.onFilterChange();
  }

  selectAllEquipments(event?: Event) {
    if (event) event.stopPropagation();
    this.equipmentOptions.forEach(eq => this.selectedEquipments.add(eq.value));
    this.onFilterChange();
  }

  get equipmentLabel(): string {
    const count = this.selectedEquipments.size;
    if (count === 0) return 'Tất cả tiện ích';
    if (count === 1) {
      const firstVal = Array.from(this.selectedEquipments)[0];
      const found = this.equipmentOptions.find(o => o.value === firstVal);
      return found ? found.label : '1 tiện ích';
    }
    return `${count} tiện ích đã chọn`;
  }

  toggleDropdown(type: 'checkin' | 'checkout' | 'capacity' | 'equipment' | 'date' | 'time', event?: Event) {
    if (event) event.stopPropagation();
    if (this.activeDropdown === type) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = type;
    }
  }

  closeDropdowns() {
    this.activeDropdown = null;
  }

  selectDatePreset(preset: string) {
    this.selectedDateFilter = preset;
    this.showCustomCalendar = false;
    this.activeDropdown = null;
  }

  toggleCalendar(event?: Event) {
    if (event) event.stopPropagation();
    this.showCustomCalendar = !this.showCustomCalendar;
  }

  get calendarMonthTitle(): string {
    return `${this.monthNames[this.currentMonth]}, ${this.currentYear}`;
  }

  get calendarDaysList(): (number | null)[] {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
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

  selectCalendarDay(day: number | null) {
    if (!day) return;
    this.selectedCalendarDay = day;
    const formattedMonth = (this.currentMonth + 1) < 10 ? `0${this.currentMonth + 1}` : `${this.currentMonth + 1}`;
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    this.selectedDateFilter = `${formattedDay}/${formattedMonth}/${this.currentYear}`;
    this.showCustomCalendar = false;
    this.activeDropdown = null;
  }

  selectTimeSlot(time: string) {
    this.selectedTimeSlot = time;
    this.activeDropdown = null;
  }

  selectCapacity(capVal: string) {
    this.selectedCapacity = capVal;
    this.activeDropdown = null;
  }

  selectEquipment(eqVal: string) {
    this.selectedEquipment = eqVal;
    this.activeDropdown = null;
  }

  get capacityLabel(): string {
    const found = this.capacityOptions.find(o => o.value === this.selectedCapacity);
    return found ? found.label : 'Sức chứa';
  }



  get filteredSpaces(): any[] {
    return this.spaces.filter(s => {
      const query = this.searchQuery.toLowerCase().trim();
      const matchQuery = !query ||
        (s.name || '').toLowerCase().includes(query) ||
        (s.building || s.location || '').toLowerCase().includes(query) ||
        (s.type || '').toLowerCase().includes(query);

      let matchCapacity = true;
      if (this.capacityCount > 0) {
        matchCapacity = (s.capacity || 0) >= this.capacityCount;
      } else if (this.selectedCapacity === 'small') {
        matchCapacity = s.capacity < 20;
      } else if (this.selectedCapacity === 'medium') {
        matchCapacity = s.capacity >= 20 && s.capacity <= 50;
      } else if (this.selectedCapacity === 'large') {
        matchCapacity = s.capacity > 50;
      }

      let matchEquipment = true;
      const facilities: string[] = Array.isArray(s.facilities) ? s.facilities : [];
      const has = (kw: string) => facilities.some(f => (f || '').toLowerCase().includes(kw.toLowerCase()));

      if (this.selectedEquipments.size > 0) {
        for (const eq of this.selectedEquipments) {
          if (eq === 'ai-cam' && !has('AI')) { matchEquipment = false; break; }
          if (eq === 'display' && !(has('Màn hình') || has('Máy chiếu'))) { matchEquipment = false; break; }
          if (eq === 'wifi' && !(has('Cáp quang') || has('Wifi'))) { matchEquipment = false; break; }
          if (eq === 'board' && !has('Bảng')) { matchEquipment = false; break; }
          if (eq === 'ac' && !(has('Điều hòa') || has('Máy lạnh'))) { matchEquipment = false; break; }
          if (eq === 'mic' && !(has('Micro') || has('Âm thanh') || has('Mic'))) { matchEquipment = false; break; }
        }
      } else if (this.selectedEquipment === 'ai-cam') {
        matchEquipment = has('AI');
      } else if (this.selectedEquipment === 'display') {
        matchEquipment = has('Màn hình') || has('Máy chiếu');
      } else if (this.selectedEquipment === 'wifi') {
        matchEquipment = has('Cáp quang') || has('Wifi');
      } else if (this.selectedEquipment === 'board') {
        matchEquipment = has('Bảng');
      }

      // 4. Match Date (Continuity Check across all requested days)
      let matchDate = true;
      if (s.status === 'maintenance' || s.status === 'closed') {
        return false;
      }

      if (this.checkInDateStr && s.availableDates && Array.isArray(s.availableDates)) {
        const requestedDates: string[] = [];
        const start = new Date(this.checkInDateStr);
        const end = new Date(this.checkOutDateStr || this.checkInDateStr);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
          const cur = new Date(start);
          while (cur <= end) {
            requestedDates.push(this.formatDateToISO(cur));
            cur.setDate(cur.getDate() + 1);
          }
        } else {
          requestedDates.push(this.checkInDateStr);
        }

        matchDate = requestedDates.every(d => s.availableDates.includes(d));
      }

      // 5. Match Operating Hours
      let matchHours = true;
      if (s.operatingHours && s.operatingHours.open && s.operatingHours.close) {
        const checkInMins = this.timeToMinutes(this.checkInTime);
        const openMins = this.timeToMinutes(s.operatingHours.open);
        const checkOutMins = this.timeToMinutes(this.checkOutTime);
        const closeMins = this.timeToMinutes(s.operatingHours.close);

        if (checkInMins !== null && openMins !== null && checkInMins < openMins) {
          matchHours = false;
        }
        if (checkOutMins !== null && closeMins !== null && checkOutMins > closeMins) {
          matchHours = false;
        }
      }

      // 6. Match Booking Conflicts (Loại trừ phòng đã có người đặt trong ngày và khung giờ này)
      let isBookedConflict = false;
      if (this.bookingService) {
        const check = this.bookingService.isSpaceBooked(
          { id: s._id || s.id, code: s.code, name: s.name, slug: s.slug },
          this.checkInDateStr,
          this.checkOutDateStr,
          this.checkInTime,
          this.checkOutTime
        );
        isBookedConflict = check.isBooked;
      }

      return matchQuery && matchCapacity && matchEquipment && matchDate && matchHours && !isBookedConflict;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSpaces.length / this.pageSize));
  }

  get paginatedSpaces(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredSpaces.slice(startIndex, startIndex + this.pageSize);
  }

  get pagesList(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push('...');
    }
    pages.push(total);
    return pages;
  }

  changePage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Scroll smoothly to space grid
      if (typeof window !== 'undefined') {
        const el = document.getElementById('spaces-grid-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  resetHomeFilters() {
    this.searchQuery = '';
    this.selectedDateFilter = 'Hôm nay';
    this.selectedTimeSlot = '08:00 - 17:00';
    const today = new Date();
    this.checkInDateStr = this.formatDateToISO(today);
    this.checkInDateLabel = 'Hôm nay';
    this.checkInTime = '08:00';
    this.checkOutDateStr = this.formatDateToISO(today);
    this.checkOutDateLabel = 'Hôm nay';
    this.checkOutTime = '17:00';
    this.capacityCount = 0;
    this.selectedCapacity = 'all';
    this.selectedEquipments.clear();
    this.selectedEquipment = 'all';
    this.currentPage = 1;
    this.closeDropdowns();
  }

  // Detailed Room & Booking Modal State (Google Calendar Live Integration)
  selectedRoomDetail: any = null;
  selectedSlot: any = null;
  bookingSuccess: boolean = false;

  // Google Calendar Live Selection State
  calendarViewMode: 'picker' | 'embed' = 'picker';
  customBookingDate: string = new Date().toISOString().split('T')[0];
  customStartTime: string = '08:00';
  customEndTime: string = '10:00';
  customDurationHours: number = 2;
  googleEmbedSafeUrl: SafeResourceUrl | null = null;
  suggestedGoogleSlots: any[] = [];
  googleCalendarStatus: { isConnected: boolean; email?: string } = { isConnected: false };
  isSyncingCalendar: boolean = false;

  customerInfo = {
    name: 'Nguyễn Minh Quân',
    id: 'CORP-88392',
    email: 'quan.nguyen@corp-partner.vn',
    org: 'Doanh nghiệp Đối tác'
  };

  openBookingModal(space: any) {
    const floorMatch = (space.building || '').match(/Tầng\s*\d+/i);
    const floor = space.floor || (floorMatch ? floorMatch[0] : 'Tầng 1');

    let currentActivity = 'Không gian hiện hoàn toàn trống, sẵn sàng tiếp nhận đặt chỗ ngay';
    let expectedFreeTime = 'Khả dụng cả ngày';
    if (space.status === 'in-use') {
      currentActivity = 'Đang có doanh nghiệp đối tác họp ban điều hành & làm việc';
      expectedFreeTime = 'Dự kiến trống lúc 15:00';
    } else if (space.status === 'reserved') {
      currentActivity = 'Đã có khách thuê đặt giữ chỗ trước qua sàn UEL Space';
      expectedFreeTime = 'Khả dụng sau ca 17:15';
    } else if (space.status === 'maintenance') {
      currentActivity = 'Đang kiểm tra bảo dưỡng hệ thống điều hòa & đường truyền';
      expectedFreeTime = 'Tạm ngưng nhận lịch hôm nay';
    }

    this.customBookingDate = new Date().toISOString().split('T')[0];
    this.customStartTime = '08:00';
    this.customEndTime = '10:00';
    this.customDurationHours = 2;
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.googleCalendarService.generateEmbedUrl(space.name, 'AGENDA')
    );

    const pricePerHour = space.hourlyPrice || 60000;

    this.selectedRoomDetail = {
      name: space.name,
      building: space.building,
      floor: floor,
      type: space.type || space.spaceType,
      capacity: space.capacity,
      status: space.status,
      statusText: space.statusText,
      hourlyPrice: pricePerHour,
      totalPrice: pricePerHour * this.customDurationHours,
      facilities: space.facilities && space.facilities.length > 0
        ? space.facilities
        : ['Màn hình 4K / Máy chiếu', 'Điều hòa 2 chiều', 'Cáp quang 1Gbps', 'Ổ cắm điện'],
      currentActivity: currentActivity,
      expectedFreeTime: expectedFreeTime
    };

    this.selectedSlot = {
      period: `${this.customStartTime} - ${this.customEndTime} (${this.customDurationHours}h)`,
      start: this.customStartTime,
      end: this.customEndTime,
      date: this.customBookingDate,
      status: 'available',
      text: 'Google Calendar'
    };
    this.bookingSuccess = false;
  }

  onTimeOrDateChange(): void {
    this.customDurationHours = this.googleCalendarService.calculateDuration(this.customStartTime, this.customEndTime);
    if (this.selectedRoomDetail) {
      this.selectedRoomDetail.totalPrice = (this.selectedRoomDetail.hourlyPrice || 60000) * this.customDurationHours;
      this.selectedSlot = {
        period: `${this.customStartTime} - ${this.customEndTime} (${this.customDurationHours}h)`,
        start: this.customStartTime,
        end: this.customEndTime,
        date: this.customBookingDate,
        status: 'available',
        text: 'Google Calendar'
      };
    }
  }

  selectGooglePresetSlot(slot: any): void {
    this.customStartTime = slot.start;
    this.customEndTime = slot.end;
    this.customDurationHours = slot.hours;
    this.onTimeOrDateChange();
  }

  async syncCalendarData(): Promise<void> {
    this.isSyncingCalendar = true;
    try {
      await this.googleCalendarService.syncLiveSchedule(this.customBookingDate);
      this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots(this.customBookingDate);
    } catch (e) {
      console.warn('Sync calendar error:', e);
    } finally {
      this.isSyncingCalendar = false;
      this.cdr.detectChanges();
    }
  }

  async connectGoogleCalendar(): Promise<void> {
    this.isSyncingCalendar = true;
    try {
      const res = await this.googleCalendarService.openGoogleAuthPopup();
      if (res.success) {
        await this.syncCalendarData();
      }
    } finally {
      this.isSyncingCalendar = false;
      this.cdr.detectChanges();
    }
  }

  disconnectGoogleCalendar(): void {
    if (!confirm('Bạn có chắc chắn muốn ngắt kết nối Google Calendar?')) return;
    this.googleCalendarService.disconnect().subscribe(() => {
      this.syncCalendarData();
    });
  }

  openGoogleCalendarExternal(): void {
    if (!this.selectedRoomDetail) return;
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt ${this.selectedRoomDetail.name}`,
      roomName: this.selectedRoomDetail.name,
      building: this.selectedRoomDetail.building,
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Học tập & Hoạt động không gian UEL',
      bookerName: this.customerInfo.name
    });
  }

  // MoMo Sandbox Payment Modal State
  momoModal = {
    isOpen: false,
    orderId: '',
    amount: 0,
    payUrl: '',
    qrCodeUrl: '',
    isProcessing: false,
    loading: false,
    bookingCode: '',
    roomName: '',
    slotText: ''
  };

  openMomoPayment() {
    if (!this.selectedRoomDetail || this.selectedRoomDetail.status !== 'available') return;
    const pricePerHour = this.selectedRoomDetail.hourlyPrice || 60000;
    const durationHours = this.customDurationHours || 2;
    const totalAmount = Math.round(pricePerHour * durationHours);
    const code = 'BK-MOMO-' + Date.now().toString().slice(-6);

    this.momoModal = {
      isOpen: true,
      orderId: code,
      bookingCode: code,
      amount: totalAmount,
      payUrl: `https://test-payment.momo.vn/v2/gateway/pay?s=${code}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0908123456|||0|0|${totalAmount}|${code}|transfer_myqr`,
      isProcessing: false,
      loading: false,
      roomName: this.selectedRoomDetail.name || 'Không gian UEL Space',
      slotText: `${this.customBookingDate} (${this.customStartTime} - ${this.customEndTime})`
    };

    // Gọi API Backend MoMo Sandbox ngầm (fire-and-forget)
    fetch(`${SERVER_BASE_URL}/api/payments/momo/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: code,
        amount: totalAmount,
        orderInfo: `Thanh toan thue ${this.selectedRoomDetail.name} (${this.customBookingDate} ${this.customStartTime}-${this.customEndTime})`,
        redirectUrl: `${window.location.origin}/booking-history?paymentSuccess=true&orderId=${code}`
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          if (data.payUrl) this.momoModal.payUrl = data.payUrl;
          if (data.qrCodeUrl) this.momoModal.qrCodeUrl = data.qrCodeUrl;
        }
      })
      .catch(err => {
        console.warn('MoMo create background:', err);
      });
  }

  closeMomoModal() {
    this.momoModal.isOpen = false;
  }

  confirmMomoSuccessTest() {
    this.momoModal.isProcessing = true;
    const code = this.momoModal.bookingCode || 'BK-MOMO-' + Date.now().toString().slice(-6);

    fetch(`${SERVER_BASE_URL}/api/payments/momo/confirm-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: code,
        transId: 'MOMO-SANDBOX-' + Date.now(),
        paymentMethod: 'MOMO'
      })
    })
      .then(res => res.json())
      .then(() => {
        this.momoModal.isOpen = false;
        this.momoModal.isProcessing = false;
        this.bookingSuccess = true;

        if (this.selectedRoomDetail) {
          const dur = this.customDurationHours || 2;
          this.bookingService.addBooking({
            id: code,
            spaceId: this.selectedRoomDetail._id || this.selectedRoomDetail.id || this.selectedRoomDetail.code,
            roomName: this.selectedRoomDetail.name,
            building: this.selectedRoomDetail.building,
            roomType: this.selectedRoomDetail.spaceType || 'Không gian làm việc & Hội thảo',
            date: this.customBookingDate,
            endDate: this.customBookingDate,
            startTime: this.customStartTime,
            endTime: this.customEndTime,
            timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
            purpose: 'Làm việc & Học tập trên UEL Space',
            capacity: this.selectedRoomDetail.capacity || 10,
            totalAmount: Math.round((this.selectedRoomDetail.hourlyPrice || 60000) * dur)
          });
        }

        // Tự động đẩy sự kiện lên Google Calendar sau khi thanh toán thành công
        this.addToGoogleCalendar();
      })
      .catch(() => {
        this.momoModal.isOpen = false;
        this.momoModal.isProcessing = false;
        this.bookingSuccess = true;

        if (this.selectedRoomDetail) {
          const dur = this.customDurationHours || 2;
          this.bookingService.addBooking({
            id: code,
            roomName: this.selectedRoomDetail.name,
            building: this.selectedRoomDetail.building,
            roomType: this.selectedRoomDetail.spaceType || 'Không gian làm việc & Hội thảo',
            date: this.customBookingDate,
            timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
            purpose: 'Làm việc & Học tập trên UEL Space',
            capacity: this.selectedRoomDetail.capacity || 10,
            totalAmount: Math.round((this.selectedRoomDetail.hourlyPrice || 60000) * dur)
          });
        }

        this.addToGoogleCalendar();
      });
  }

  openMomoGatewayDirect() {
    if (this.momoModal.payUrl) {
      window.open(this.momoModal.payUrl, '_blank');
    }
  }

  closeRoomDetail() {
    this.selectedRoomDetail = null;
    this.bookingSuccess = false;
  }

  closeBookingModal() {
    this.closeRoomDetail();
  }

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private bookingService: BookingService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  confirmBooking() {
    if (this.selectedRoomDetail && this.selectedRoomDetail.status === 'available') {
      this.bookingSuccess = true;
    }
  }

  addToGoogleCalendar(room?: any, slot?: any) {
    const r = room || this.selectedRoomDetail;
    const s = slot || this.selectedSlot;
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt không gian ${r?.name || 'Văn phòng'}`,
      roomName: r?.name || 'Phòng họp VIP',
      building: r?.building || 'Tòa nhà văn phòng đối tác',
      code: 'UEL-88392',
      date: new Date().toLocaleDateString('vi-VN'),
      timeSlot: s?.period || 'Ca 3 (13:00 - 15:00)',
      purpose: 'Hội thảo & Họp đối tác doanh nghiệp',
      bookerName: this.customerInfo.name
    });
  }

  downloadIcs(room?: any, slot?: any) {
    const r = room || this.selectedRoomDetail;
    const s = slot || this.selectedSlot;
    this.googleCalendarService.downloadIcsFile({
      title: `[UEL SPACE] Đặt không gian ${r?.name || 'Văn phòng'}`,
      roomName: r?.name || 'Phòng họp VIP',
      building: r?.building || 'Tòa nhà văn phòng đối tác',
      code: 'UEL-88392',
      date: new Date().toLocaleDateString('vi-VN'),
      timeSlot: s?.period || 'Ca 3 (13:00 - 15:00)',
      purpose: 'Hội thảo & Họp đối tác doanh nghiệp',
      bookerName: this.customerInfo.name
    });
  }

  addCourseToGoogleCalendar(course: any, day: any) {
    this.googleCalendarService.openGoogleCalendar({
      title: `[Sự kiện Doanh nghiệp] ${course.subject || 'Hội thảo'} - ${course.room || 'Phòng họp'}`,
      roomName: course.room || 'Phòng họp',
      building: course.campus || 'Hub trung tâm',
      code: course.lhp || 'UEL-EVENT',
      date: day.date,
      timeSlot: course.time,
      purpose: `Chủ trì: ${course.lecturer || 'Ban tổ chức'} | Thời lượng: ${course.periodsTotal || '2h'}`,
      details: `🏢 Sự kiện: ${course.subject}\n🏛️ Địa điểm: ${course.room} - ${course.campus}\n👤 Chủ trì: ${course.lecturer}\n⏰ Thời gian: ${course.time}`
    });
  }
}
