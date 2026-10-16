import { Component, OnInit, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SERVER_IMAGES_LINK, SERVER_BASE_URL } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { normalizeSpace, getFallbackMarketplaceSpaces } from '../../services/spaces-data';

@Component({
  imports: [CommonModule, FormsModule, TranslatePipe],
  selector: 'app-map',
  styleUrl: './map.scss',
  templateUrl: './map.html',
})
export class Map implements OnInit, AfterViewInit {
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

  studentSchedule: Array<{
    id: string;
    time: string;
    title: string;
    room: string;
    lecturer?: string;
    type: string;
    isBusy: boolean;
    conflictsWith: string[];
  }> = [
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
  calendarViewMode: 'picker' | 'embed' = 'picker';
  customBookingDate: string = new Date().toISOString().split('T')[0];
  customStartTime: string = '13:00';
  customEndTime: string = '15:00';
  customDurationHours: number = 2;
  googleEmbedSafeUrl: SafeResourceUrl | null = null;
  suggestedGoogleSlots: any[] = [];

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
    this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots();
    
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
    this.closeAllDropdowns();
    this.filterSpaces();
  }

  selectStatus(statusCode: string) {
    this.activeStatus = statusCode;
    this.closeAllDropdowns();
    this.filterSpaces();
  }

  selectSort(sortId: string) {
    this.sortBy = sortId;
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
    this.filterSpaces();
  }

  onSortChange() {
    this.filterSpaces();
  }

  resetFilters() {
    this.activeCategory = 'all';
    this.activeStatus = 'all';
    this.searchQuery = '';
    this.sortBy = 'popular';
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

  // Room Detail & Booking Modal Controllers
  openRoomDetail(room: any) {
    this.selectedRoomDetail = normalizeSpace(room);
    this.cdr.detectChanges();
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
    const rawUrl = this.googleCalendarService.generateEmbedUrl(r.name, 'AGENDA');
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    this.onTimeOrDateChange();
    this.cdr.detectChanges();
  }

  closeBookingModal() {
    this.selectedRoomToBook = null;
    this.bookingSuccess = false;
    this.cdr.detectChanges();
  }

  onTimeOrDateChange(): void {
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
  }

  selectGooglePresetSlot(slot: any): void {
    this.customStartTime = slot.start;
    this.customEndTime = slot.end;
    this.customDurationHours = slot.hours;
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
    if (!this.customStartTime || !this.customEndTime) {
      this.hasConflict = false;
      this.conflictReason = '';
      return;
    }

    const busyReservations = [
      { start: '07:30', end: '11:45', title: 'Họp chiến lược Ban Điều Hành quý IV', room: 'Boardroom VIP B1' },
      { start: '15:15', end: '17:15', title: 'Làm việc cùng Quỹ Đầu Tư mạo hiểm', room: 'Private Suite A2' }
    ];

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const selStart = toMinutes(this.customStartTime);
    const selEnd = toMinutes(this.customEndTime);

    const conflict = busyReservations.find(c => {
      const cStart = toMinutes(c.start);
      const cEnd = toMinutes(c.end);
      return Math.max(selStart, cStart) < Math.min(selEnd, cEnd);
    });

    if (conflict) {
      this.hasConflict = true;
      this.conflictReason = `Trùng lịch với ca thuê trước: "${conflict.title}" (${conflict.start} - ${conflict.end}) tại ${conflict.room}`;
    } else {
      this.hasConflict = false;
      this.conflictReason = '';
    }
  }

  confirmBooking() {
    if (this.selectedRoomToBook && !this.hasConflict) {
      this.selectedRoomToBook.status = 'in-use';
      this.selectedRoomToBook.statusText = 'Đang sử dụng';
      this.bookingSuccess = true;
      this.addToGoogleCalendar(this.selectedRoomToBook, this.selectedSlot);
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
