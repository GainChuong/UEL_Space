import { Component, OnInit, AfterViewInit, ChangeDetectorRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SERVER_IMAGES_LINK, SERVER_BASE_URL } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { BookingService } from '../../services/booking.service';
import { normalizeSpace, getFallbackMarketplaceSpaces, createSpaceSlug } from '../../services/spaces-data';

@Component({
  imports: [CommonModule, FormsModule, RouterModule, TranslatePipe],
  selector: 'app-map',
  styleUrl: './map.scss',
  templateUrl: './map.html',
})
export class Map implements OnInit, AfterViewInit {
  private router = inject(Router);
  private bookingService = inject(BookingService);
  server_images_link = SERVER_IMAGES_LINK;
  
  // Selection & Modal States
  selectedRoomToBook: any = null;
  selectedRoomDetail: any = null;
  bookingSuccess: boolean = false;
  
  // Filters & Search
  activeCategory: string = 'all';
  activeStatus: string = 'all';
  searchQuery: string = '';
  sortBy: string = 'popular';
  isLoading: boolean = false;

  // Custom Dropdown Open States
  isCategoryOpen: boolean = false;
  isStatusOpen: boolean = false;
  isSortOpen: boolean = false;

  favorites: Set<string> = new Set<string>();

  spaces: any[] = [];
  filteredSpaces: any[] = [];
  currentPage: number = 1;
  pageSize: number = 9;

  // Dataset categories from FatimaSaadNaik/indoor-scenes-dataset
  categories = [
    { id: 'all', name: 'Tất cả phân loại', en: 'All Categories', icon: 'grid', count: 100 },
    { id: 'meeting_room', name: 'Phòng họp VIP', en: 'Meeting Room', icon: 'users', count: 16 },
    { id: 'office', name: 'Văn phòng riêng', en: 'Private Office', icon: 'briefcase', count: 16 },
    { id: 'library', name: 'Thư viện & Co-study', en: 'Library & Co-working', icon: 'book', count: 12 },
    { id: 'classroom', name: 'Giảng đường đa năng', en: 'Smart Classroom', icon: 'graduation-cap', count: 10 },
    { id: 'auditorium', name: 'Hội trường sự kiện', en: 'Auditorium Hall', icon: 'theater', count: 12 },
    { id: 'computerroom', name: 'Phòng máy tính Lab', en: 'Computer Lab', icon: 'monitor', count: 8 },
    { id: 'studio', name: 'Media Studio & Pod', en: 'Media Studio', icon: 'mic', count: 8 },
    { id: 'lobby', name: 'Sảnh chờ & Pods', en: 'Lobby & Pods', icon: 'coffee', count: 18 }
  ];

  // Room Statuses
  statuses = [
    { code: 'all', text: 'Tất cả trạng thái', dot: 'bg-slate-400' },
    { code: 'available', text: 'Trống (Khả dụng)', dot: 'bg-emerald-500' },
    { code: 'in-use', text: 'Đang sử dụng', dot: 'bg-uel-blue dark:bg-sky-400' },
    { code: 'reserved', text: 'Đã đặt', dot: 'bg-amber-500' },
    { code: 'maintenance', text: 'Bảo trì', dot: 'bg-slate-500' }
  ];

  sortOptions = [
    { id: 'popular', text: 'Phổ biến nhất' },
    { id: 'price-asc', text: 'Giá: Thấp đến Cao' },
    { id: 'price-desc', text: 'Giá: Cao đến Thấp' },
    { id: 'rating', text: 'Đánh giá cao nhất' },
    { id: 'capacity', text: 'Sức chứa lớn nhất' }
  ];

  // Client info & schedule cross-reference
  studentInfo = {
    name: 'Nguyễn Trần Kim Giang',
    id: 'MBR-9821',
    major: 'TechFlow Solutions • Doanh nghiệp thành viên'
  };

  bookingSlots = [
    { id: 'slot-1', time: '07:30 - 09:30', period: 'Ca 1 (Sáng)' },
    { id: 'slot-2', time: '09:45 - 11:45', period: 'Ca 2 (Sáng)' },
    { id: 'slot-3', time: '13:00 - 15:00', period: 'Ca 3 (Chiều)' },
    { id: 'slot-4', time: '15:15 - 17:15', period: 'Ca 4 (Chiều)' },
    { id: 'slot-5', time: '17:30 - 19:30', period: 'Ca 5 (Tối)' }
  ];

  selectedSlot: any = null;
  hasConflict: boolean = false;
  conflictReason: string = '';

  studentSchedule: any[] = [
    {
      id: 'sched-1',
      time: '07:30 - 11:45',
      title: 'Họp chiến lược Ban Điều Hành quý IV',
      room: 'Boardroom VIP B1',
      lecturer: 'Chủ trì: CEO',
      type: 'meeting',
      isBusy: true,
      conflictsWith: ['slot-1', 'slot-2']
    },
    {
      id: 'sched-2',
      time: '11:45 - 13:00',
      title: 'Nghỉ trưa & Networking Cafe',
      room: '',
      type: 'free',
      isBusy: false,
      conflictsWith: []
    },
    {
      id: 'sched-3',
      time: '13:00 - 15:00',
      title: 'Trống lịch (Khung giờ lý tưởng thuê phòng)',
      room: '',
      type: 'free',
      isBusy: false,
      conflictsWith: []
    },
    {
      id: 'sched-4',
      time: '15:15 - 17:15',
      title: 'Làm việc cùng Quỹ Đầu Tư mạo hiểm',
      room: 'Private Suite A2',
      lecturer: 'Đối tác VCs',
      type: 'meeting',
      isBusy: true,
      conflictsWith: ['slot-4']
    },
    {
      id: 'sched-5',
      time: '17:30 - 20:00',
      title: 'Trống lịch (Tự do làm việc cá nhân)',
      room: '',
      type: 'free',
      isBusy: false,
      conflictsWith: []
    }
  ];

  // Google Calendar Integration State
  calendarViewMode: 'list' | 'embed' = 'list';
  embedCalendarViewMode: 'AGENDA' | 'WEEK' | 'MONTH' = 'AGENDA';
  customBookingDate: string = new Date().toISOString().split('T')[0];
  customStartTime: string = '13:00';
  customEndTime: string = '15:00';
  customDurationHours: number = 2;
  googleEmbedSafeUrl: SafeResourceUrl | null = null;
  suggestedGoogleSlots: any[] = [];

  // Custom UEL Brand Date & Time Picker Dropdown State
  isDatePickerOpen: boolean = false;
  isStartTimePickerOpen: boolean = false;
  isEndTimePickerOpen: boolean = false;
  calendarViewYear: number = new Date().getFullYear();
  calendarViewMonth: number = new Date().getMonth();
  calendarDays: any[] = [];
  timeOptions: any[] = [];

  // MoMo Sandbox Payment State
  momoModal = {
    isOpen: false,
    qrCodeUrl: '',
    payUrl: '',
    orderId: '',
    amount: 0,
    roomName: '',
    slotText: '',
    loading: false
  };

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initCalendar();
    this.refreshCalendarAndSlots();
    
    // Check local storage for current user info
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) this.studentInfo.name = u.name;
        if (u.email) this.studentInfo.id = u.email;
      }
    } catch (e) {
      // ignore
    }

    // Synchronously pre-populate from rich dataset spaces so there is zero delay/blank state
    this.spaces = getFallbackMarketplaceSpaces().map(s => normalizeSpace(s));
    this.updateCategoryCounts();
    this.filterSpaces();
    this.isLoading = false;

    // Then asynchronously fetch live spaces from server
    this.loadSpaces();
  }

  ngAfterViewInit() {}

  async loadSpaces() {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/spaces`);
      if (res.ok) {
        const json = await res.json();
        const dataList = json.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(dataList) && dataList.length > 0) {
          this.spaces = dataList.map(s => normalizeSpace(s));
          this.updateCategoryCounts();
          this.filterSpaces();
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
      }
    } catch (e) {
      console.warn('Cannot fetch from /api/spaces, using rich dataset marketplace fallback:', e);
    }

    if (this.spaces.length === 0) {
      this.spaces = getFallbackMarketplaceSpaces().map(s => normalizeSpace(s));
      this.updateCategoryCounts();
      this.filterSpaces();
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  updateCategoryCounts() {
    this.categories.forEach(cat => {
      if (cat.id === 'all') {
        cat.count = this.spaces.length;
      } else {
        cat.count = this.spaces.filter(s => this.matchesCategory(s, cat.id)).length;
      }
    });
  }

  matchesCategory(s: any, catId: string): boolean {
    if (catId === 'all') return true;
    const catLower = catId.toLowerCase();
    const dsCat = (s.dataset?.category || s.datasetCategory || '').toLowerCase();
    const type = (s.spaceType || s.type || s.categoryName || '').toLowerCase();
    const name = (s.name || '').toLowerCase();

    if (dsCat && (dsCat === catLower || dsCat.includes(catLower) || catLower.includes(dsCat))) return true;
    if (type && (type.includes(catLower) || catLower.includes(type))) return true;

    // Semantic bilingual mappings
    if (catLower === 'meeting_room') {
      return dsCat === 'meeting_room' || type.includes('họp') || name.includes('meeting') || name.includes('họp');
    }
    if (catLower === 'office') {
      return dsCat === 'office' || type.includes('văn phòng') || name.includes('office') || name.includes('suite');
    }
    if (catLower === 'library') {
      return dsCat === 'library' || type.includes('thư viện') || type.includes('co-study') || name.includes('library') || name.includes('study');
    }
    if (catLower === 'classroom') {
      return dsCat === 'classroom' || type.includes('giảng đường') || name.includes('classroom') || name.includes('b1.104');
    }
    if (catLower === 'auditorium') {
      return dsCat === 'auditorium' || type.includes('hội trường') || type.includes('sự kiện') || name.includes('auditorium') || name.includes('hall');
    }
    if (catLower === 'computerroom') {
      return dsCat === 'computerroom' || type.includes('máy tính') || name.includes('computer') || name.includes('lab');
    }
    if (catLower === 'studio') {
      return dsCat === 'studio' || dsCat === 'tv_studio' || type.includes('studio') || name.includes('studio') || name.includes('podcast');
    }
    if (catLower === 'lobby') {
      return dsCat === 'lobby' || dsCat === 'waitingroom' || dsCat === 'coworking_lounge' || type.includes('sảnh') || type.includes('pod') || name.includes('booth') || name.includes('lounge') || name.includes('lobby');
    }
    return false;
  }


  getImageUrl(space: any, index: number = 0): string {
    if (!space) return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80';
    let img = '';
    if (space.images && space.images.length > index) {
      img = space.images[index];
    } else if (space.image) {
      img = space.image;
    }
    return this.getRawImageUrl(img);
  }

  defaultFallbackImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80';

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

  // Custom Dropdown Controllers
  toggleCategoryDropdown(event: Event) {
    event.stopPropagation();
    this.isCategoryOpen = !this.isCategoryOpen;
    this.isStatusOpen = false;
    this.isSortOpen = false;
  }

  toggleStatusDropdown(event: Event) {
    event.stopPropagation();
    this.isStatusOpen = !this.isStatusOpen;
    this.isCategoryOpen = false;
    this.isSortOpen = false;
  }

  toggleSortDropdown(event: Event) {
    event.stopPropagation();
    this.isSortOpen = !this.isSortOpen;
    this.isCategoryOpen = false;
    this.isStatusOpen = false;
  }

  closeAllDropdowns() {
    this.isCategoryOpen = false;
    this.isStatusOpen = false;
    this.isSortOpen = false;
    this.isDatePickerOpen = false;
    this.isStartTimePickerOpen = false;
    this.isEndTimePickerOpen = false;
  }

  // --- Custom UEL Brand Date & Time Picker Methods ---
  initCalendar(): void {
    if (this.customBookingDate) {
      const parts = this.customBookingDate.split('-');
      if (parts.length === 3) {
        this.calendarViewYear = parseInt(parts[0], 10);
        this.calendarViewMonth = parseInt(parts[1], 10) - 1;
      }
    }
    this.generateCalendarDays();
    this.generateTimeOptions();
  }

  generateCalendarDays(): void {
    const year = this.calendarViewYear;
    const month = this.calendarViewMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Monday = 1 ... Sunday = 7
    const prevDaysCount = startDayOfWeek - 1;

    const days: any[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month trailing days
    for (let i = prevDaysCount - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dStr = this.formatDateToString(prevDate);
      days.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === this.customBookingDate,
        isPast: dStr < todayStr
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const curDate = new Date(year, month, i);
      const dStr = this.formatDateToString(curDate);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === this.customBookingDate,
        isPast: dStr < todayStr
      });
    }

    // Next month leading days to complete full 35 or 42 grid
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dStr = this.formatDateToString(nextDate);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === this.customBookingDate,
        isPast: dStr < todayStr
      });
    }

    this.calendarDays = days;
  }

  private formatDateToString(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  generateTimeOptions(): void {
    const list: any[] = [];
    for (let h = 7; h <= 21; h++) {
      for (const m of ['00', '30']) {
        if (h === 21 && m === '30') continue;
        const hh = h < 10 ? `0${h}` : `${h}`;
        const timeStr = `${hh}:${m}`;
        list.push({
          time: timeStr,
          label: timeStr
        });
      }
    }
    this.timeOptions = list;
  }

  toggleDatePicker(event: Event): void {
    event.stopPropagation();
    this.isDatePickerOpen = !this.isDatePickerOpen;
    this.isStartTimePickerOpen = false;
    this.isEndTimePickerOpen = false;
    this.isCategoryOpen = false;
    this.isStatusOpen = false;
    this.isSortOpen = false;
  }

  toggleStartTimePicker(event: Event): void {
    event.stopPropagation();
    this.isStartTimePickerOpen = !this.isStartTimePickerOpen;
    this.isDatePickerOpen = false;
    this.isEndTimePickerOpen = false;
    this.isCategoryOpen = false;
    this.isStatusOpen = false;
    this.isSortOpen = false;
  }

  toggleEndTimePicker(event: Event): void {
    event.stopPropagation();
    this.isEndTimePickerOpen = !this.isEndTimePickerOpen;
    this.isDatePickerOpen = false;
    this.isStartTimePickerOpen = false;
    this.isCategoryOpen = false;
    this.isStatusOpen = false;
    this.isSortOpen = false;
  }

  prevMonth(event: Event): void {
    event.stopPropagation();
    if (this.calendarViewMonth === 0) {
      this.calendarViewMonth = 11;
      this.calendarViewYear--;
    } else {
      this.calendarViewMonth--;
    }
    this.generateCalendarDays();
  }

  nextMonth(event: Event): void {
    event.stopPropagation();
    if (this.calendarViewMonth === 11) {
      this.calendarViewMonth = 0;
      this.calendarViewYear++;
    } else {
      this.calendarViewMonth++;
    }
    this.generateCalendarDays();
  }

  selectCalendarDate(dateStr: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.customBookingDate = dateStr;
    this.isDatePickerOpen = false;
    this.generateCalendarDays();
    this.onTimeOrDateChange();
  }

  selectQuickDate(preset: 'today' | 'tomorrow' | 'weekend', event?: Event): void {
    if (event) event.stopPropagation();
    const d = new Date();
    if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (preset === 'weekend') {
      const day = d.getDay();
      const diff = day === 6 ? 0 : (day === 0 ? 6 : 6 - day);
      d.setDate(d.getDate() + diff);
    }
    this.calendarViewYear = d.getFullYear();
    this.calendarViewMonth = d.getMonth();
    this.selectCalendarDate(this.formatDateToString(d));
  }

  selectStartTime(timeStr: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.customStartTime = timeStr;
    this.isStartTimePickerOpen = false;
    this.onTimeOrDateChange();
  }

  selectEndTime(timeStr: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.customEndTime = timeStr;
    this.isEndTimePickerOpen = false;
    this.onTimeOrDateChange();
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Chọn ngày';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  getMonthYearTitle(): string {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return `${monthNames[this.calendarViewMonth]}, ${this.calendarViewYear}`;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAllDropdowns();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeAllDropdowns();
  }

  selectCategory(catId: string) {
    this.activeCategory = catId;
    this.currentPage = 1;
    this.closeAllDropdowns();
    this.filterSpaces();
  }

  selectStatus(statusCode: string) {
    this.activeStatus = statusCode;
    this.currentPage = 1;
    this.closeAllDropdowns();
    this.filterSpaces();
  }

  selectSort(sortId: string) {
    this.sortBy = sortId;
    this.currentPage = 1;
    this.closeAllDropdowns();
    this.filterSpaces();
  }

  getActiveCategoryName(): string {
    if (this.activeCategory === 'all') {
      return `Tất cả phân loại (${this.spaces.length})`;
    }
    const cat = this.categories.find(c => c.id === this.activeCategory);
    return cat ? `${cat.name} (${cat.count})` : 'Tất cả phân loại';
  }

  getActiveStatusName(): string {
    const st = this.statuses.find(s => s.code === this.activeStatus);
    return st ? st.text : 'Tất cả trạng thái';
  }

  getActiveSortName(): string {
    const s = this.sortOptions.find(o => o.id === this.sortBy);
    return s ? s.text : 'Phổ biến nhất';
  }

  filterByCategory(catId: string) {
    this.selectCategory(catId);
  }

  filterByStatus(statusCode: string) {
    this.selectStatus(statusCode);
  }

  onSearchChange() {
    this.currentPage = 1;
    this.filterSpaces();
  }

  onSortChange() {
    this.currentPage = 1;
    this.filterSpaces();
  }

  resetFilters() {
    this.activeCategory = 'all';
    this.activeStatus = 'all';
    this.searchQuery = '';
    this.sortBy = 'popular';
    this.currentPage = 1;
    this.closeAllDropdowns();
    this.filterSpaces();
  }

  filterSpaces() {
    let list = [...this.spaces];

    // Filter by Dataset Category
    if (this.activeCategory && this.activeCategory !== 'all') {
      list = list.filter(s => this.matchesCategory(s, this.activeCategory));
    }

    // Filter by Status
    if (this.activeStatus && this.activeStatus !== 'all') {
      const st = this.activeStatus.toLowerCase();
      list = list.filter(s => {
        const spaceStatus = (s.statusKey || s.status || '').toLowerCase();
        return spaceStatus === st;
      });
    }

    // Filter by Search Query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const name = (s.name || '').toLowerCase();
        const building = (s.building || s.location || '').toLowerCase();
        const sellerName = (s.seller?.name || s.seller?.brandName || '').toLowerCase();
        const dsCaption = (s.dataset?.caption || '').toLowerCase();
        const dsCat = (s.dataset?.category || '').toLowerCase();
        const tags = Array.isArray(s.tags) ? s.tags.join(' ').toLowerCase() : '';
        const facs = Array.isArray(s.facilities) ? s.facilities.join(' ').toLowerCase() : '';
        return name.includes(q) || building.includes(q) || sellerName.includes(q) || dsCaption.includes(q) || dsCat.includes(q) || tags.includes(q) || facs.includes(q);
      });
    }

    // Sort Spaces
    if (this.sortBy === 'price-asc') {
      list.sort((a, b) => (a.hourlyPrice || 0) - (b.hourlyPrice || 0));
    } else if (this.sortBy === 'price-desc') {
      list.sort((a, b) => (b.hourlyPrice || 0) - (a.hourlyPrice || 0));
    } else if (this.sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (this.sortBy === 'capacity') {
      list.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
    }

    this.filteredSpaces = list;
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
      if (typeof window !== 'undefined') {
        const el = document.getElementById('map-spaces-grid-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }

  // Room Detail & Booking Modal Controllers: Mở sang trang chi tiết chuyên biệt (/spaces/:id)
  openRoomDetail(room: any) {
    if (!room) return;
    const targetSlug = room.slug || createSpaceSlug(room);
    if (targetSlug) {
      this.router.navigate(['/spaces', targetSlug]);
      return;
    }
    this.selectedRoomDetail = normalizeSpace(room);
    this.cdr.detectChanges();
  }

  switchSpaceByImage(targetImg: string) {
    if (!targetImg) return;
    const cleanTarget = targetImg.replace(/^\//, '');

    // 1. Tìm xem có space nào có ảnh chính hoặc mã tương ứng với ảnh này không
    const matchedSpace = this.spaces.find(s => {
      const mainImg = (s.image || '').replace(/^\//, '');
      if (mainImg === cleanTarget || mainImg.includes(cleanTarget) || cleanTarget.includes(mainImg)) {
        return true;
      }
      // Khớp theo ID ảnh (ví dụ: indoor_meeting_room_3)
      const targetId = cleanTarget.replace(/\.[^/.]+$/, '').replace(/^spaces\//, '');
      if (s._id === targetId || s.id === targetId || s.code === targetId) {
        return true;
      }
      return false;
    });

    if (matchedSpace && (matchedSpace._id || matchedSpace.id) !== (this.selectedRoomDetail?._id || this.selectedRoomDetail?.id)) {
      this.selectedRoomDetail = normalizeSpace(matchedSpace);
      this.cdr.detectChanges();
    } else if (this.selectedRoomDetail) {
      // Nếu không tìm thấy space card khác, chuyển ảnh hiển thị chính của space hiện tại
      this.selectedRoomDetail.image = targetImg;
      this.cdr.detectChanges();
    }
  }

  closeRoomDetail() {
    this.selectedRoomDetail = null;
    this.cdr.detectChanges();
  }

  proceedToBookingFromDetail() {
    if (this.selectedRoomDetail) {
      const room = this.selectedRoomDetail;
      this.selectedRoomDetail = null;
      this.openBookingModal(room);
    }
  }

  openBookingModal(room: any) {
    const r = normalizeSpace(room);
    this.selectedRoomToBook = r;
    this.bookingSuccess = false;
    this.customBookingDate = new Date().toISOString().split('T')[0];
    this.customStartTime = '13:00';
    this.customEndTime = '15:00';
    this.customDurationHours = 2;
    this.calendarViewMode = 'embed';
    this.refreshCalendarAndSlots();
    this.cdr.detectChanges();
  }

  closeBookingModal() {
    this.selectedRoomToBook = null;
    this.bookingSuccess = false;
    this.cdr.detectChanges();
  }

  refreshCalendarAndSlots(): void {
    this.studentSchedule = this.googleCalendarService.getUserEventsForDate(this.customBookingDate, this.studentInfo.id);
    this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots(this.customBookingDate, this.studentInfo.id);

    const rawUrl = this.googleCalendarService.generateEmbedUrl(this.studentInfo.id, this.embedCalendarViewMode, this.customBookingDate);
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);

    this.customDurationHours = this.googleCalendarService.calculateDuration(this.customStartTime, this.customEndTime);
    if (this.selectedRoomToBook) {
      this.selectedRoomToBook.totalPrice = (this.selectedRoomToBook.hourlyPrice || 120000) * this.customDurationHours;
    }
    this.selectedSlot = {
      id: 'custom-slot',
      time: `${this.customStartTime} - ${this.customEndTime}`,
      period: `${this.customDurationHours} giờ`,
      date: this.customBookingDate
    };

    this.checkConflict();
    this.cdr.detectChanges();
  }

  setCalendarViewMode(mode: 'embed' | 'list'): void {
    this.calendarViewMode = mode;
    this.cdr.detectChanges();
  }

  setEmbedCalendarMode(mode: 'AGENDA' | 'WEEK' | 'MONTH'): void {
    this.embedCalendarViewMode = mode;
    const rawUrl = this.googleCalendarService.generateEmbedUrl(this.studentInfo.id, this.embedCalendarViewMode, this.customBookingDate);
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    this.cdr.detectChanges();
  }

  onTimeOrDateChange(): void {
    this.refreshCalendarAndSlots();
  }

  selectGooglePresetSlot(slot: any): void {
    this.customStartTime = slot.start;
    this.customEndTime = slot.end;
    this.customDurationHours = slot.hours;
    this.onTimeOrDateChange();
  }

  selectScheduleItem(item: any): void {
    if (item.isBusy) return;
    this.customStartTime = item.start;
    this.customEndTime = item.end;
    this.onTimeOrDateChange();
  }

  openGoogleCalendarExternal(room?: any): void {
    const r = room || this.selectedRoomToBook || this.selectedRoomDetail;
    if (!r) return;
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt không gian ${r.name || 'Văn phòng'}`,
      roomName: r.name || 'Phòng họp VIP',
      building: r.building || 'Tòa nhà văn phòng đối tác',
      code: 'UEL-88392',
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Họp chiến lược & Làm việc doanh nghiệp',
      bookerName: this.studentInfo.name
    });
  }

  checkConflict() {
    const check = this.googleCalendarService.checkConflict(
      this.customBookingDate,
      this.customStartTime,
      this.customEndTime,
      this.studentInfo.id
    );
    this.hasConflict = check.hasConflict;
    this.conflictReason = check.reason;
  }

  confirmBooking() {
    if (this.selectedRoomToBook && !this.hasConflict) {
      this.selectedRoomToBook.status = 'in-use';
      this.selectedRoomToBook.statusText = 'Đang sử dụng';
      this.bookingSuccess = true;

      // Lưu sự kiện mới vào lịch cá nhân người dùng
      this.googleCalendarService.addBookingToCalendar({
        roomName: this.selectedRoomToBook.name,
        date: this.customBookingDate,
        startTime: this.customStartTime,
        endTime: this.customEndTime,
        code: 'BK-' + Date.now().toString().slice(-6),
        userEmail: this.studentInfo.id
      });

      this.refreshCalendarAndSlots();
    }
  }

  addToGoogleCalendar(room?: any, slot?: any) {
    const r = room || this.selectedRoomToBook;
    const s = slot || this.selectedSlot;
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt không gian ${r?.name || 'Văn phòng'}`,
      roomName: r?.name || 'Phòng họp VIP',
      building: r?.building || 'Tòa nhà văn phòng đối tác',
      code: 'UEL-88392',
      date: this.customBookingDate,
      timeSlot: s?.time || `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Họp chiến lược & Làm việc doanh nghiệp',
      bookerName: this.studentInfo.name
    });
  }

  downloadIcs(room?: any, slot?: any) {
    const r = room || this.selectedRoomToBook;
    const s = slot || this.selectedSlot;
    this.googleCalendarService.downloadIcsFile({
      title: `[UEL SPACE] Đặt không gian ${r?.name || 'Văn phòng'}`,
      roomName: r?.name || 'Phòng họp VIP',
      building: r?.building || 'Tòa nhà văn phòng đối tác',
      code: 'UEL-88392',
      date: this.customBookingDate,
      timeSlot: s?.time || `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Họp chiến lược & Làm việc doanh nghiệp',
      bookerName: this.studentInfo.name
    });
  }

  // MoMo Payment handlers - Tối ưu 0ms hiển thị tức thì (Optimistic Instant Rendering)
  async openMomoPayment(room?: any, slot?: any) {
    const targetRoom = room || this.selectedRoomToBook || this.selectedRoomDetail;
    const targetSlot = slot || this.selectedSlot;
    if (!targetRoom) return;

    const hours = this.customDurationHours || 2;
    const hourlyPrice = targetRoom.hourlyPrice || 120000;
    const totalAmount = Math.round(hourlyPrice * hours);
    const code = 'BK-MOMO-' + Date.now().toString().slice(-6);

    // Mở popup ngay lập tức 0ms - Không bao giờ để người dùng chờ đợi!
    this.momoModal = {
      isOpen: true,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0908123456|||0|0|${totalAmount}|${code}|transfer_myqr`,
      payUrl: `https://test-payment.momo.vn/v2/gateway/pay?s=${code}`,
      orderId: code,
      amount: totalAmount,
      roomName: targetRoom.name,
      slotText: targetSlot?.time || `${this.customBookingDate} (${this.customStartTime} - ${this.customEndTime})`,
      loading: false
    };

    // Khởi tạo phiên MoMo Gateway ngầm trong background (fire-and-forget)
    fetch(`${SERVER_BASE_URL}/api/payments/momo/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: code,
        amount: totalAmount,
        orderInfo: `Thanh toan thue ${targetRoom.name} (${this.customBookingDate} ${this.customStartTime}-${this.customEndTime})`,
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
        console.warn('MoMo background create:', err);
      });
  }

  closeMomoModal() {
    this.momoModal.isOpen = false;
  }

  async confirmMomoSuccessTest() {
    if (!this.momoModal.orderId) {
      if (this.selectedRoomToBook) {
        this.selectedRoomToBook.status = 'in-use';
        this.selectedRoomToBook.statusText = 'Đang sử dụng';
        this.addToGoogleCalendar(this.selectedRoomToBook, this.selectedSlot);
      }
      this.bookingSuccess = true;
      this.momoModal.isOpen = false;
      return;
    }

    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/payments/momo/confirm-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: this.momoModal.orderId
        })
      });

      const data = await res.json();
      if (data.success) {
        if (this.selectedRoomToBook) {
          this.selectedRoomToBook.status = 'in-use';
          this.selectedRoomToBook.statusText = 'Đang sử dụng';

          this.bookingService.addBooking({
            id: this.momoModal.orderId,
            roomName: this.selectedRoomToBook.name,
            building: this.selectedRoomToBook.building,
            roomType: this.selectedRoomToBook.category || 'Không gian làm việc',
            date: this.customBookingDate,
            timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
            purpose: 'Làm việc & Học tập trên UEL Space',
            capacity: this.selectedRoomToBook.capacity || 10,
            totalAmount: this.momoModal.amount
          });

          this.addToGoogleCalendar(this.selectedRoomToBook, this.selectedSlot);
        }
        this.bookingSuccess = true;
        this.momoModal.isOpen = false;
      } else {
        alert('Xác nhận thanh toán không thành công: ' + (data.message || 'Lỗi'));
      }
    } catch (err) {
      console.error('Error confirming MoMo payment test:', err);
      if (this.selectedRoomToBook) {
        this.selectedRoomToBook.status = 'in-use';
        this.selectedRoomToBook.statusText = 'Đang sử dụng';

        this.bookingService.addBooking({
          id: this.momoModal.orderId,
          roomName: this.selectedRoomToBook.name,
          building: this.selectedRoomToBook.building,
          roomType: this.selectedRoomToBook.category || 'Không gian làm việc',
          date: this.customBookingDate,
          timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
          purpose: 'Làm việc & Học tập trên UEL Space',
          capacity: this.selectedRoomToBook.capacity || 10,
          totalAmount: this.momoModal.amount
        });

        this.addToGoogleCalendar(this.selectedRoomToBook, this.selectedSlot);
      }
      this.bookingSuccess = true;
      this.momoModal.isOpen = false;
    }
  }

  openMomoGatewayDirect() {
    if (this.momoModal.payUrl) {
      window.open(this.momoModal.payUrl, '_blank');
    }
  }

}
