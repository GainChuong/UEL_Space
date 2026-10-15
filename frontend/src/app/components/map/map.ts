import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SERVER_IMAGES_LINK, SERVER_BASE_URL } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';
import { GoogleCalendarService } from '../../services/google-calendar.service';

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

  favorites: Set<string> = new Set<string>();

  spaces: any[] = [];
  filteredSpaces: any[] = [];

  // Dataset categories from FatimaSaadNaik/indoor-scenes-dataset
  categories = [
    { id: 'all', name: 'Tất cả không gian', en: 'All Spaces', icon: 'grid', count: 10 },
    { id: 'meeting_room', name: 'Phòng họp VIP', en: 'Meeting Room', icon: 'users', count: 2 },
    { id: 'office', name: 'Văn phòng riêng', en: 'Private Office', icon: 'briefcase', count: 2 },
    { id: 'library', name: 'Thư viện & Co-study', en: 'Library & Co-working', icon: 'book', count: 1 },
    { id: 'classroom', name: 'Giảng đường đa năng', en: 'Smart Classroom', icon: 'graduation-cap', count: 1 },
    { id: 'auditorium', name: 'Hội trường sự kiện', en: 'Auditorium Hall', icon: 'theater', count: 2 },
    { id: 'computerroom', name: 'Phòng máy tính Lab', en: 'Computer Lab', icon: 'monitor', count: 1 },
    { id: 'studio', name: 'Media Studio & Pod', en: 'Media Studio', icon: 'mic', count: 1 },
    { id: 'lobby', name: 'Sảnh chờ & Pods', en: 'Lobby & Pods', icon: 'coffee', count: 1 }
  ];

  // Room Statuses
  statuses = [
    { code: 'all', text: 'Tất cả trạng thái', dot: 'bg-slate-400' },
    { code: 'available', text: 'Trống (Khả dụng)', dot: 'bg-emerald-500 animate-pulse' },
    { code: 'in-use', text: 'Đang sử dụng', dot: 'bg-uel-blue' },
    { code: 'reserved', text: 'Đã đặt', dot: 'bg-amber-500' },
    { code: 'maintenance', text: 'Bảo trì', dot: 'bg-slate-500' }
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
    this.spaces = this.getFallbackMarketplaceSpaces().map(s => this.normalizeSpace(s));
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
          this.spaces = dataList.map(s => this.normalizeSpace(s));
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
      this.spaces = this.getFallbackMarketplaceSpaces().map(s => this.normalizeSpace(s));
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
      return dsCat === 'lobby' || dsCat === 'waitingroom' || type.includes('sảnh') || type.includes('pod') || name.includes('booth') || name.includes('lounge') || name.includes('lobby');
    }
    return false;
  }

  normalizeSpace(space: any) {
    const rawStatus = (space.statusKey || space.status || 'AVAILABLE').toString().toUpperCase();
    let normStatus = 'available';
    let statusText = 'Trống (Khả dụng)';

    if (rawStatus === 'OCCUPIED' || rawStatus === 'IN-USE' || rawStatus === 'IN_USE') {
      normStatus = 'in-use';
      statusText = 'Đang sử dụng';
    } else if (rawStatus === 'RESERVED') {
      normStatus = 'reserved';
      statusText = 'Đã đặt';
    } else if (rawStatus === 'MAINTENANCE') {
      normStatus = 'maintenance';
      statusText = 'Bảo trì';
    } else if (rawStatus === 'RESTRICTED' || rawStatus === 'CLOSED') {
      normStatus = 'maintenance';
      statusText = 'Hạn chế';
    }

    const hourlyPrice = space.hourlyPrice || 120000;
    const dailyPrice = space.dailyPrice || (hourlyPrice * 7);

    // Normalize equipment array
    let facilitiesList: string[] = [];
    if (Array.isArray(space.equipment) && space.equipment.length > 0) {
      facilitiesList = space.equipment.map((e: any) => typeof e === 'string' ? e : (e.name || 'Thiết bị thông minh'));
    } else if (Array.isArray(space.facilities) && space.facilities.length > 0) {
      facilitiesList = space.facilities;
    } else {
      facilitiesList = ['AI Occupancy Detection', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Bảng kính tương tác', 'Máy pha cà phê'];
    }

    const datasetInfo = space.dataset || {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: space.datasetCategory || 'office',
      caption: space.description || 'Không gian làm việc & hội họp tiêu chuẩn cao',
      fileName: 'scene_photo.jpg'
    };

    return {
      ...space,
      id: space._id || space.id || space.code || 'sp-' + Math.random().toString(36).substring(7),
      _id: space._id || space.id,
      name: space.name,
      type: space.spaceType || space.categoryName || space.type || 'Không gian làm việc',
      capacity: space.capacity || 10,
      areaSize: space.area || space.areaSize || 25,
      floor: space.floorName || space.floor || 'Tầng 1',
      building: space.buildingName || space.building || space.location || 'UEL Central Space',
      location: space.location || space.buildingName || space.building || 'Khuôn viên UEL',
      status: normStatus,
      statusKey: normStatus,
      statusText: statusText,
      hourlyPrice: hourlyPrice,
      dailyPrice: dailyPrice,
      rating: space.rating || 4.9,
      reviewsCount: space.reviewsCount || 45,
      seller: space.seller || {
        name: 'Ban Quản trị UEL Space',
        brandName: 'Ban Quản trị Cơ sở vật chất UEL',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
        rating: 4.9,
        reviewsCount: 120,
        verified: true,
        badge: 'Chính chủ • Đại học Kinh tế - Luật'
      },
      images: (space.images && space.images.length > 0) ? space.images : [space.image || 'spaces/indoor_meeting_room_1.jpg'],
      facilities: facilitiesList,
      tags: space.tags || ['SuperHost', 'AI Occupancy', 'Đặt tức thì'],
      dataset: datasetInfo,
      datasetCategory: datasetInfo.category,
      currentActivity: space.currentActivity || (normStatus === 'in-use' ? 'Đang có doanh nghiệp đối tác họp chiến lược' : 'Không gian hiện hoàn toàn trống, sẵn sàng tiếp nhận đặt chỗ ngay'),
      expectedFreeTime: space.expectedFreeTime || (normStatus === 'in-use' ? 'Dự kiến trống lúc 15:00' : 'Khả dụng cả ngày'),
      todaySlots: space.todaySlots || [
        { period: 'Ca 1 (07:30 - 09:30)', status: 'available', text: 'Trống' },
        { period: 'Ca 2 (09:45 - 11:45)', status: normStatus === 'in-use' ? 'in-use' : 'available', text: normStatus === 'in-use' ? 'Đang dùng' : 'Trống' },
        { period: 'Ca 3 (13:00 - 15:00)', status: normStatus, text: normStatus === 'in-use' ? 'Đang dùng' : 'Trống' },
        { period: 'Ca 4 (15:15 - 17:15)', status: 'available', text: 'Trống' },
        { period: 'Ca 5 (17:30 - 19:30)', status: 'available', text: 'Trống' }
      ]
    };
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

  getRawImageUrl(img: string): string {
    if (!img) return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80';
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

  filterByCategory(catId: string) {
    this.activeCategory = catId;
    this.filterSpaces();
  }

  filterByStatus(statusCode: string) {
    this.activeStatus = statusCode;
    this.filterSpaces();
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
    this.selectedRoomDetail = this.normalizeSpace(room);
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
    const r = this.normalizeSpace(room);
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

  private getFallbackMarketplaceSpaces(): any[] {
    return [
      {
        _id: 'a2-1',
        name: 'Phòng Họp VIP Executive A2.1 (Meeting Room)',
        spaceType: 'Phòng họp VIP',
        categoryName: 'Phòng họp VIP',
        building: 'TechPark Executive',
        floor: 'Tầng 2',
        location: 'TechPark Tower, Khu Công nghệ cao, TP. Thủ Đức',
        capacity: 15,
        area: 35,
        hourlyPrice: 350000,
        dailyPrice: 2400000,
        rating: 4.96,
        reviewsCount: 88,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_meeting_room_1.jpg',
        images: [
          'spaces/indoor_meeting_room_1.jpg',
          'spaces/indoor_meeting_room_2.jpg',
          'spaces/indoor_meeting_room_3.jpg'
        ],
        tags: ['SuperHost', 'AI Occupancy', 'Màn hình 4K', 'Đặt tức thì'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'meeting_room',
          caption: 'This meeting room there is a long table with chairs around it in a room with a picture hanging on the wall',
          fileName: 'Conference_640x480.jpg'
        },
        seller: {
          id: 'seller-techpark',
          name: 'Trần Minh Quân',
          brandName: 'TechPark Executive Spaces',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
          rating: 4.96,
          reviewsCount: 142,
          verified: true,
          badge: 'SuperHost • Văn phòng Hạng A'
        },
        equipment: ['Màn hình 4K cảm ứng', 'Micro hội nghị đa hướng', 'Cáp quang 1Gbps', 'Bảng kính cường lực', 'AI Occupancy Sensor']
      },
      {
        _id: 'b2-101',
        name: 'Văn phòng riêng Private Suite B2.101 (Office)',
        spaceType: 'Văn phòng riêng',
        categoryName: 'Văn phòng riêng',
        building: 'TechPark Executive',
        floor: 'Tầng 6',
        location: 'TechPark Tower, Khu Công nghệ cao, TP. Thủ Đức',
        capacity: 35,
        area: 55,
        hourlyPrice: 500000,
        dailyPrice: 3500000,
        rating: 4.95,
        reviewsCount: 42,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_office_1.jpg',
        images: [
          'spaces/indoor_office_1.jpg',
          'spaces/indoor_office_2.jpg',
          'spaces/indoor_office_3.jpg'
        ],
        tags: ['SuperHost', 'Khóa vân tay', 'Điều hòa 24/7', 'Bàn giám đốc'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'office',
          caption: 'This office there is a laptop computer sitting on a table in front of a bookshelf filled with books',
          fileName: 'office_001.jpg'
        },
        seller: {
          id: 'seller-techpark',
          name: 'Trần Minh Quân',
          brandName: 'TechPark Executive Spaces',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
          rating: 4.96,
          reviewsCount: 142,
          verified: true,
          badge: 'SuperHost • Văn phòng Hạng A'
        },
        equipment: ['Khóa Smart Lock', 'Bàn làm việc giám đốc', 'Điều hòa độc lập 24/7', 'Bảng từ kính', 'Tủ hồ sơ bảo mật']
      },
      {
        _id: 'thu-vien-2',
        name: 'Khu Làm Việc & Co-study Library Hub (Library)',
        spaceType: 'Thư viện & Co-study',
        categoryName: 'Thư viện & Co-study',
        building: 'Innovation Hub',
        floor: 'Tầng 2',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        capacity: 120,
        area: 180,
        hourlyPrice: 45000,
        dailyPrice: 250000,
        rating: 4.92,
        reviewsCount: 215,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_library_1.jpg',
        images: [
          'spaces/indoor_library_1.jpg',
          'spaces/indoor_library_2.jpg',
          'spaces/indoor_library_3.jpg'
        ],
        tags: ['Co-working', 'Cổng sạc Type-C', 'Pantry cà phê', 'Yên tĩnh'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'library',
          caption: 'these two men are sitting at a table playing a game of chess in a library with bookshelves in the background',
          fileName: 'library_0023.jpg'
        },
        seller: {
          id: 'seller-innovate',
          name: 'Lê Hoàng Long',
          brandName: 'Innovate Co-working Network',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          rating: 4.92,
          reviewsCount: 215,
          verified: true,
          badge: 'SuperHost • Mạng lưới Co-working'
        },
        equipment: ['Wifi công suất lớn Aruba', 'Cổng sạc Type-C & Power Plug', 'Đèn chống cận Ergonomic', 'Tủ locker cá nhân', 'Pantry trà & cà phê']
      },
      {
        _id: 'choi-1',
        name: 'Focus Pod 1 Cách Âm Smart Booth (Office)',
        spaceType: 'Văn phòng riêng',
        categoryName: 'Văn phòng riêng',
        building: 'Innovation Hub',
        floor: 'Tầng 1',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        capacity: 4,
        area: 12,
        hourlyPrice: 70000,
        dailyPrice: 450000,
        rating: 4.94,
        reviewsCount: 56,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_office_4.jpg',
        images: [
          'spaces/indoor_office_4.jpg',
          'spaces/indoor_office_5.jpg'
        ],
        tags: ['Cách âm 35dB', 'Màn hình họp Zoom', 'Quạt thông gió'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'office',
          caption: 'hardwood flooring in a home office with a desk, chair and computer on top of a wooden desk',
          fileName: 'office_004.jpg'
        },
        seller: {
          id: 'seller-innovate',
          name: 'Lê Hoàng Long',
          brandName: 'Innovate Co-working Network',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          rating: 4.92,
          reviewsCount: 215,
          verified: true,
          badge: 'SuperHost • Mạng lưới Co-working'
        },
        equipment: ['Kính cách âm 3 lớp', 'Màn hình họp trực tuyến 32 inch', 'Hệ thống thông gió cưỡng bức', 'Đèn LED tùy chỉnh độ sáng']
      },
      {
        _id: 'choi-2',
        name: 'Meeting Pod Solo Booth 02 (Lobby & Lounge)',
        spaceType: 'Sảnh chờ & Pods',
        categoryName: 'Sảnh chờ & Pods',
        building: 'Innovation Hub',
        floor: 'Tầng 2',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        capacity: 2,
        area: 8,
        hourlyPrice: 50000,
        dailyPrice: 320000,
        rating: 4.91,
        reviewsCount: 38,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_lobby_1.jpg',
        images: [
          'spaces/indoor_lobby_1.jpg',
          'spaces/indoor_lobby_2.jpg'
        ],
        tags: ['Solo Booth', 'Cuộc gọi bảo mật', 'Sạc không dây'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'lobby',
          caption: 'This waitingroom several chairs and tables in a room with bookshelves and a book case in the corner of the room',
          fileName: 'waitingroom_0012.jpg'
        },
        seller: {
          id: 'seller-innovate',
          name: 'Lê Hoàng Long',
          brandName: 'Innovate Co-working Network',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          rating: 4.92,
          reviewsCount: 215,
          verified: true,
          badge: 'SuperHost • Mạng lưới Co-working'
        },
        equipment: ['Cách âm cao cấp', 'Bàn làm việc gọn nhẹ', 'Sạc không dây Qi', 'Đèn cảm ứng chuyển động']
      },
      {
        _id: 'a3-301',
        name: 'Hội Trường & Event Hall Landmark A3 (Auditorium)',
        spaceType: 'Hội trường sự kiện',
        categoryName: 'Hội trường sự kiện',
        building: 'Landmark Lounge',
        floor: 'Tầng 8',
        location: 'Landmark Tower, 208 Nguyễn Hữu Cảnh, Q. Bình Thạnh',
        capacity: 100,
        area: 150,
        hourlyPrice: 750000,
        dailyPrice: 5200000,
        rating: 4.95,
        reviewsCount: 76,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_auditorium_1.jpg',
        images: [
          'spaces/indoor_auditorium_1.jpg',
          'spaces/indoor_auditorium_2.jpg',
          'spaces/indoor_auditorium_3.jpg'
        ],
        tags: ['Sự kiện 100 khách', 'Màn hình LED', 'Âm thanh vòm', 'Bục phát biểu'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'auditorium',
          caption: 'rows of blue chairs in a large auditorium with a podium on the side of the stage and a podium on the other side of the stage',
          fileName: 'auditorium_0001.jpg'
        },
        seller: {
          id: 'seller-landmark',
          name: 'Nguyễn Bích Ngọc',
          brandName: 'Landmark Convention Corp',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
          rating: 4.88,
          reviewsCount: 310,
          verified: true,
          badge: 'Đối tác Doanh nghiệp Uy tín'
        },
        equipment: ['Màn hình LED P2.5', 'Dàn âm thanh Line Array', 'Micro Shure không dây', 'Bục phát biểu', 'Khu vực check-in riêng']
      },
      {
        _id: 'a-hoi-truong',
        name: 'Hội Trường Lớn Grand Auditorium Tòa A (Auditorium)',
        spaceType: 'Hội trường sự kiện',
        categoryName: 'Hội trường sự kiện',
        building: 'Central Tower',
        floor: 'Tầng 1',
        location: 'Central Tower, 58 Lê Duẩn, Quận 1, TP.HCM',
        capacity: 350,
        area: 320,
        hourlyPrice: 1200000,
        dailyPrice: 8500000,
        rating: 4.93,
        reviewsCount: 51,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_auditorium_4.jpg',
        images: [
          'spaces/indoor_auditorium_4.jpg',
          'spaces/indoor_auditorium_1.jpg'
        ],
        tags: ['Quy mô 350 khách', 'Sân khấu lớn', 'Ánh sáng biểu diễn'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'auditorium',
          caption: 'this is an old photo of a large auditorium with red seats and a chandelier hanging from the ceiling',
          fileName: 'auditorium_0045.jpg'
        },
        seller: {
          id: 'seller-landmark',
          name: 'Nguyễn Bích Ngọc',
          brandName: 'Landmark Convention Corp',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
          rating: 4.88,
          reviewsCount: 310,
          verified: true,
          badge: 'Đối tác Doanh nghiệp Uy tín'
        },
        equipment: ['Sân khấu lớn 60m²', 'Dàn ánh sáng sân khấu DMX', 'Hệ thống lạnh trung tâm', 'Phòng kỹ thuật điều khiển âm thanh']
      },
      {
        _id: 'b1-104',
        name: 'Phòng Giảng Đường Đa Năng B1.104 (Classroom)',
        spaceType: 'Giảng đường đa năng',
        categoryName: 'Giảng đường đa năng',
        building: 'Tòa nhà B1',
        floor: 'Tầng 1',
        location: 'Khuôn viên UEL Space Hub, P. Linh Xuân, TP. Thủ Đức',
        capacity: 50,
        area: 60,
        hourlyPrice: 120000,
        dailyPrice: 800000,
        rating: 4.88,
        reviewsCount: 64,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_classroom_1.jpg',
        images: [
          'spaces/indoor_classroom_1.jpg',
          'spaces/indoor_classroom_2.jpg',
          'spaces/indoor_classroom_3.jpg'
        ],
        tags: ['Giảng đường 50 chỗ', 'Máy chiếu Sony', 'Điều hòa 2 chiều'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'classroom',
          caption: 'rows of desks with red chairs in a classroom with windows and drapes on the windowsills',
          fileName: 'classroom_0008.jpg'
        },
        seller: {
          id: 'seller-uel',
          name: 'Đặng Tuấn Anh',
          brandName: 'Ban Quản trị UEL Space',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
          rating: 4.94,
          reviewsCount: 189,
          verified: true,
          badge: 'Ban Quản trị • Đại học Kinh tế - Luật'
        },
        equipment: ['Máy chiếu Full HD', 'Điều hòa công suất lớn', 'Bảng từ bút lông', 'Hệ thống micro trợ giảng']
      },
      {
        _id: 'b1-lab202',
        name: 'Phòng Thực Hành Tin Học B1.202 (Computer Lab)',
        spaceType: 'Phòng máy tính Lab',
        categoryName: 'Phòng máy tính Lab',
        building: 'Tòa nhà B1',
        floor: 'Tầng 2',
        location: 'Khuôn viên UEL Space Hub, P. Linh Xuân, TP. Thủ Đức',
        capacity: 40,
        area: 75,
        hourlyPrice: 250000,
        dailyPrice: 1700000,
        rating: 4.90,
        reviewsCount: 39,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_computerroom_1.jpg',
        images: [
          'spaces/indoor_computerroom_1.jpg',
          'spaces/indoor_computerroom_2.jpg',
          'spaces/indoor_computerroom_3.jpg'
        ],
        tags: ['40 PC Core i7', 'Mạng Gigabit', 'Máy chiếu'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'computerroom',
          caption: 'This computerroom there are many computers sitting on the desks in a room with wood flooring and a large window',
          fileName: 'computerroom_0019.jpg'
        },
        seller: {
          id: 'seller-uel',
          name: 'Đặng Tuấn Anh',
          brandName: 'Ban Quản trị UEL Space',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
          rating: 4.94,
          reviewsCount: 189,
          verified: true,
          badge: 'Ban Quản trị • Đại học Kinh tế - Luật'
        },
        equipment: ['40 Máy tính Core i7 16GB', 'Hạ tầng switch mạng Gigabit', 'Máy chiếu giảng viên', 'Phần mềm bản quyền']
      },
      {
        _id: 'a-105',
        name: 'Studio Sáng Tạo Creative Media A.105 (Studio)',
        spaceType: 'Media Studio & Pod',
        categoryName: 'Media Studio & Pod',
        building: 'Creative Hub Center',
        floor: 'Tầng 4',
        location: 'Creative Hub, 42 Nguyễn Huệ, Quận 1, TP.HCM',
        capacity: 16,
        area: 45,
        hourlyPrice: 300000,
        dailyPrice: 2100000,
        rating: 4.97,
        reviewsCount: 63,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_studio_1.jpg',
        images: [
          'spaces/indoor_studio_1.jpg',
          'spaces/indoor_studio_2.jpg',
          'spaces/indoor_studio_3.jpg'
        ],
        tags: ['Phông xanh', 'Đèn quay Nanlite', 'Micro Rode', 'Livestream 4K'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'studio',
          caption: 'This tv studio there is a group of people that are standing in front of a news set with a television set in the background',
          fileName: 'tv_studio_0004.jpg'
        },
        seller: {
          id: 'seller-creative',
          name: 'Vũ Thảo My',
          brandName: 'Creative Hub Media Studios',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
          rating: 4.95,
          reviewsCount: 78,
          verified: true,
          badge: 'Studio Chuyên nghiệp • Creator Hub'
        },
        equipment: ['Phông xanh kéo tự động', 'Bộ đèn LED studio Nanlite', 'Micro Rode PodMic', 'Bàn trộn âm thanh RodeCaster Pro', 'Màn hình preview 4K']
      }
    ];
  }
}
