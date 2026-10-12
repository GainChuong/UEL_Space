import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as L from 'leaflet';
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
  private map: L.Map | undefined;
  
  showEmptyState = false;
  selectedBuilding: any = null;
  selectedRoomToBook: any = null;
  selectedRoomDetail: any = null;
  bookingSuccess: boolean = false;
  activeCategory: string = 'Tất cả';
  activeStatus: string | null = null;
  searchQuery: string = '';
  sortBy: string = 'popular';
  viewMode: 'grid' | 'map' = 'grid';
  isLoading: boolean = false;

  favorites: Set<string> = new Set<string>();

  spaces: any[] = [];
  filteredSpaces: any[] = [];

  categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'phong-hop', name: 'Phòng họp VIP' },
    { id: 'van-phong', name: 'Văn phòng riêng' },
    { id: 'hot-desk', name: 'Bàn làm việc linh hoạt' },
    { id: 'su-kien', name: 'Không gian sự kiện' },
    { id: 'pod', name: 'Meeting Pod cách âm' },
    { id: 'studio', name: 'Studio sáng tạo' }
  ];

  statuses = [
    { code: 'available', text: 'Trống', color: 'bg-status-available', shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]' },
    { code: 'in-use', text: 'Đang sử dụng', color: 'bg-status-in-use', shadow: 'shadow-[0_0_8px_rgba(59,130,246,0.4)]' },
    { code: 'reserved', text: 'Đã đặt', color: 'bg-status-reserved', shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]' },
    { code: 'maintenance', text: 'Bảo trì', color: 'bg-status-maintenance', shadow: 'shadow-[0_0_8px_rgba(156,163,175,0.4)]' },
    { code: 'restricted', text: 'Hạn chế', color: 'bg-status-restricted', shadow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' }
  ];

  buildings = [
    { id: 'central-tower', name: 'Central Tower Q.1', top: '58%', left: '55%' },
    { id: 'techpark', name: 'TechPark Executive', top: '61%', left: '68%' },
    { id: 'innovation-hub', name: 'Innovation Hub Q.2', top: '61%', left: '76%' },
    { id: 'landmark-lounge', name: 'Landmark Lounge', top: '41%', left: '53%' },
    { id: 'green-office', name: 'Green Office Suites', top: '72%', left: '33%' },
    { id: 'creative-hub', name: 'Creative Hub Center', top: '55%', left: '63%' },
    { id: 'startup-space', name: 'Startup Pod Hub', top: '55%', left: '70%' }
  ];

  isMobileFilterOpen: boolean = false;

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

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private sanitizer: DomSanitizer
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

    this.loadSpaces();
  }

  ngAfterViewInit() {}

  async loadSpaces() {
    this.isLoading = true;
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/spaces`);
      if (res.ok) {
        const json = await res.json();
        const dataList = json.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(dataList) && dataList.length > 0) {
          this.spaces = dataList.map(s => this.normalizeSpace(s));
          this.filterSpaces();
          this.isLoading = false;
          return;
        }
      }
    } catch (e) {
      console.warn('Cannot fetch from /api/spaces, using rich marketplace fallback:', e);
    }

    // Rich Marketplace Fallback spaces
    this.spaces = this.getFallbackMarketplaceSpaces().map(s => this.normalizeSpace(s));
    this.filterSpaces();
    this.isLoading = false;
  }

  normalizeSpace(space: any) {
    const rawStatus = (space.statusKey || space.status || 'AVAILABLE').toString().toUpperCase();
    let normStatus = 'available';
    let statusText = 'Trống';

    if (rawStatus === 'OCCUPIED' || rawStatus === 'IN-USE') {
      normStatus = 'in-use';
      statusText = 'Đang sử dụng';
    } else if (rawStatus === 'RESERVED') {
      normStatus = 'reserved';
      statusText = 'Đã đặt';
    } else if (rawStatus === 'MAINTENANCE') {
      normStatus = 'maintenance';
      statusText = 'Bảo trì';
    } else if (rawStatus === 'RESTRICTED' || rawStatus === 'CLOSED') {
      normStatus = 'restricted';
      statusText = 'Hạn chế';
    }

    const hourlyPrice = space.hourlyPrice || 120000;
    const dailyPrice = space.dailyPrice || (hourlyPrice * 7);

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
      statusText: space.statusText || statusText,
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
      images: (space.images && space.images.length > 0) ? space.images : [space.image || 'spaces/space_a2_1_meeting_vip.jpg'],
      facilities: (space.equipment && space.equipment.length > 0) ? space.equipment : (space.facilities || ['AI Occupancy Detection', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Bảng kính tương tác', 'Máy pha cà phê']),
      tags: space.tags || ['SuperHost', 'AI Occupancy', 'Đặt tức thì'],
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

  filterByCategory(catName: string) {
    this.activeCategory = catName;
    this.filterSpaces();

    // Đồng thời cập nhật selectedBuilding nếu người dùng chuyển qua bản đồ
    this.selectedBuilding = {
      id: 'filter-category',
      name: `Không gian: ${catName}`,
      rooms: this.filteredSpaces.length > 0 ? this.filteredSpaces : this.generateMockRooms(20, catName === 'Tất cả' ? undefined : catName)
    };
  }

  filterByStatus(statusObj: any) {
    if (this.activeStatus === statusObj.code) {
      this.activeStatus = null;
    } else {
      this.activeStatus = statusObj.code;
    }
    this.filterSpaces();

    this.selectedBuilding = {
      id: 'filter-status',
      name: `Trạng thái: ${statusObj.text}`,
      rooms: this.filteredSpaces.length > 0 ? this.filteredSpaces : this.generateMockRooms(20, this.activeCategory === 'Tất cả' ? undefined : this.activeCategory, statusObj.code)
    };
  }

  onSearchChange() {
    this.filterSpaces();
  }

  onSortChange() {
    this.filterSpaces();
  }

  resetFilters() {
    this.activeCategory = 'Tất cả';
    this.activeStatus = null;
    this.searchQuery = '';
    this.sortBy = 'popular';
    this.filterSpaces();
  }

  filterSpaces() {
    let list = [...this.spaces];

    // Filter Category
    if (this.activeCategory && this.activeCategory !== 'Tất cả') {
      const catLower = this.activeCategory.toLowerCase();
      list = list.filter(s => {
        const type = (s.spaceType || s.type || s.categoryName || '').toLowerCase();
        return type.includes(catLower) || catLower.includes(type);
      });
    }

    // Filter Status
    if (this.activeStatus) {
      const st = this.activeStatus.toLowerCase();
      list = list.filter(s => {
        const spaceStatus = (s.statusKey || s.status || '').toLowerCase();
        return spaceStatus === st;
      });
    }

    // Filter Search Query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const name = (s.name || '').toLowerCase();
        const building = (s.building || s.location || '').toLowerCase();
        const sellerName = (s.seller?.name || s.seller?.brandName || '').toLowerCase();
        const tags = Array.isArray(s.tags) ? s.tags.join(' ').toLowerCase() : '';
        return name.includes(q) || building.includes(q) || sellerName.includes(q) || tags.includes(q);
      });
    }

    // Sort
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

  private generateMockRooms(count = 20, forcedType?: string, forcedStatus?: string) {
    const statusOptions = [
      { code: 'available', text: 'Trống' },
      { code: 'in-use', text: 'Đang sử dụng' },
      { code: 'reserved', text: 'Đã đặt' },
      { code: 'maintenance', text: 'Bảo trì' },
      { code: 'restricted', text: 'Hạn chế' }
    ];

    const types = ['Phòng họp VIP', 'Văn phòng riêng', 'Bàn làm việc linh hoạt', 'Không gian sự kiện', 'Meeting Pod cách âm', 'Studio sáng tạo'];

    return Array.from({ length: count }, (_, i) => {
      const roomNum = 101 + i;
      let statusObj;
      if (forcedStatus) {
        statusObj = statusOptions.find(s => s.code === forcedStatus) || statusOptions[0];
      } else {
        const rand = Math.random();
        if (rand > 0.90) statusObj = statusOptions[4];
        else if (rand > 0.80) statusObj = statusOptions[3];
        else if (rand > 0.65) statusObj = statusOptions[2];
        else if (rand > 0.40) statusObj = statusOptions[1];
        else statusObj = statusOptions[0];
      }

      const roomType = forcedType || types[Math.floor(Math.random() * types.length)];
      const floorNum = Math.floor(roomNum / 100);

      let hourlyPrice = 150000;
      if (roomType === 'Không gian sự kiện') hourlyPrice = 450000;
      else if (roomType === 'Phòng họp VIP') hourlyPrice = 250000;
      else if (roomType === 'Văn phòng riêng') hourlyPrice = 180000;
      else if (roomType === 'Bàn làm việc linh hoạt') hourlyPrice = 35000;
      else if (roomType === 'Meeting Pod cách âm') hourlyPrice = 70000;

      let currentActivity = '';
      let expectedFreeTime = '';
      if (statusObj.code === 'in-use') {
        currentActivity = 'Đang có doanh nghiệp đối tác họp chiến lược';
        expectedFreeTime = 'Dự kiến trống lúc 15:00';
      } else if (statusObj.code === 'reserved') {
        currentActivity = 'Đã có khách thuê đặt trước qua nền tảng UEL Space';
        expectedFreeTime = 'Khả dụng sau ca 17:15';
      } else if (statusObj.code === 'maintenance' || statusObj.code === 'restricted') {
        currentActivity = 'Đang kiểm tra bảo dưỡng định kỳ hệ thống mạng & AI Camera';
        expectedFreeTime = 'Tạm ngưng nhận lịch hôm nay';
      } else {
        currentActivity = 'Không gian hiện hoàn toàn trống, sẵn sàng tiếp nhận đặt chỗ ngay';
        expectedFreeTime = 'Khả dụng cả ngày';
      }

      return {
        name: `Không gian ${roomNum}`,
        number: `${roomNum}`,
        capacity: Math.floor(Math.random() * 40) + 10,
        status: statusObj.code,
        statusText: statusObj.text,
        type: roomType,
        floor: `Tầng ${floorNum}`,
        hourlyPrice: hourlyPrice,
        facilities: ['AI Occupancy Detection', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Bảng kính tương tác', 'Máy pha cà phê'],
        currentActivity: currentActivity,
        expectedFreeTime: expectedFreeTime,
        todaySlots: [
          { period: 'Ca 1 (07:30 - 09:30)', status: 'available', text: 'Trống' },
          { period: 'Ca 2 (09:45 - 11:45)', status: statusObj.code === 'in-use' ? 'in-use' : 'available', text: statusObj.code === 'in-use' ? 'Đang dùng' : 'Trống' },
          { period: 'Ca 3 (13:00 - 15:00)', status: statusObj.code, text: statusObj.code === 'in-use' ? 'Đang dùng' : statusObj.text },
          { period: 'Ca 4 (15:15 - 17:15)', status: 'available', text: 'Trống' },
          { period: 'Ca 5 (17:30 - 19:30)', status: 'available', text: 'Trống' }
        ]
      };
    });
  }

  selectBuilding(building: any) {
    this.activeCategory = 'Tất cả';
    this.activeStatus = null;
    this.selectedBuilding = {
      ...building,
      rooms: this.generateMockRooms(20)
    };
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
      building: r.building || this.selectedBuilding?.name || 'Tòa nhà văn phòng đối tác',
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
      building: r?.building || this.selectedBuilding?.name || 'Tòa nhà văn phòng đối tác',
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
      building: r?.building || this.selectedBuilding?.name || 'Tòa nhà văn phòng đối tác',
      code: 'UEL-88392',
      date: this.customBookingDate,
      timeSlot: s?.time || `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Họp chiến lược & Làm việc doanh nghiệp',
      bookerName: this.studentInfo.name
    });
  }

  openRoomDetail(room: any) {
    this.selectedRoomDetail = this.normalizeSpace(room);
  }

  closeRoomDetail() {
    this.selectedRoomDetail = null;
  }

  proceedToBookingFromDetail() {
    if (this.selectedRoomDetail) {
      const room = this.selectedRoomDetail;
      this.selectedRoomDetail = null;
      this.openBookingModal(room);
    }
  }

  closeBookingModal() {
    this.selectedRoomToBook = null;
    this.bookingSuccess = false;
  }

  closeBuildingDetails() {
    this.selectedBuilding = null;
  }

  triggerEmptyStateDemo() {
    this.showEmptyState = true;
  }

  closeEmptyState() {
    this.showEmptyState = false;
  }

  // MoMo Sandbox Payment State & Handlers
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

  async openMomoPayment(room?: any, slot?: any) {
    const targetRoom = room || this.selectedRoomToBook || this.selectedRoomDetail;
    const targetSlot = slot || this.selectedSlot;
    if (!targetRoom) return;

    const hours = this.customDurationHours || 2;
    const hourlyPrice = targetRoom.hourlyPrice || 120000;
    const totalAmount = Math.round(hourlyPrice * hours);

    this.momoModal = {
      isOpen: true,
      qrCodeUrl: '',
      payUrl: '',
      orderId: '',
      amount: totalAmount,
      roomName: targetRoom.name,
      slotText: targetSlot?.time || `${this.customBookingDate} (${this.customStartTime} - ${this.customEndTime})`,
      loading: true
    };

    try {
      const token = localStorage.getItem('token') || '';
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const res = await fetch(`${SERVER_BASE_URL}/api/payments/momo/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          spaceId: targetRoom.id || targetRoom.number || 'space-map',
          spaceName: targetRoom.name,
          hours: hours,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + hours * 3600000).toISOString(),
          userEmail: currentUser.email || 'partner@uelspace.vn'
        })
      });

      const data = await res.json();
      if (data.success) {
        this.momoModal.orderId = data.orderId;
        this.momoModal.payUrl = data.payUrl;
        this.momoModal.qrCodeUrl = data.qrCodeUrl;
        this.momoModal.loading = false;
      } else {
        alert('Không thể tạo mã thanh toán MoMo: ' + (data.message || 'Lỗi server'));
        this.momoModal.isOpen = false;
      }
    } catch (err: any) {
      console.error('MoMo payment create error:', err);
      alert('Không thể kết nối máy chủ thanh toán MoMo.');
      this.momoModal.isOpen = false;
    }
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
        _id: 'choi-1',
        name: 'Focus Pod 1 Cách Âm Smart Booth',
        spaceType: 'Meeting Pod cách âm',
        categoryName: 'Meeting Pod cách âm',
        capacity: 4,
        area: 15,
        hourlyPrice: 70000,
        dailyPrice: 450000,
        rating: 4.94,
        reviewsCount: 56,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        building: 'Innovation Hub - Sảnh A',
        floor: 'Sân vườn',
        image: 'spaces/space_choi_1_focus_pod.jpg',
        images: ['spaces/space_choi_1_focus_pod.jpg', 'spaces/space_choi_2_solo_pod.jpg'],
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
        equipment: ['Kính cách âm 3 lớp', 'Màn hình họp trực tuyến 32 inch', 'Hệ thống thông gió cưỡng bức', 'Đèn LED tùy chỉnh độ sáng'],
        tags: ['Cách âm 35dB', 'Màn hình họp Zoom', 'Quạt thông gió']
      },
      {
        _id: 'a2-1',
        name: 'Executive Boardroom A2.1',
        spaceType: 'Phòng họp VIP',
        categoryName: 'Phòng họp VIP',
        capacity: 20,
        area: 45,
        hourlyPrice: 250000,
        dailyPrice: 1750000,
        rating: 4.97,
        reviewsCount: 88,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Tòa nhà TechPark Executive, 66 Võ Văn Tần, Q.3, TP.HCM',
        building: 'TechPark Executive',
        floor: 'Tầng 2',
        image: 'spaces/space_a2_1_meeting_vip.jpg',
        images: ['spaces/space_a2_1_meeting_vip.jpg', 'spaces/space_a2_2_boardroom.jpg'],
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
        equipment: ['Hệ thống hội nghị truyền hình 4K Polycom', 'Bảng kính tương tác 85 inch', 'Micro định hướng đa vùng', 'Máy pha cà phê Nespresso cao cấp'],
        tags: ['Hội nghị 4K', 'Cách âm chuẩn Studio', 'Nespresso Coffee']
      },
      {
        _id: 'b1-1',
        name: 'Phòng Hội Thảo B1.101 Smart Hall',
        spaceType: 'Không gian sự kiện',
        categoryName: 'Không gian sự kiện',
        capacity: 120,
        area: 160,
        hourlyPrice: 550000,
        dailyPrice: 3850000,
        rating: 4.91,
        reviewsCount: 73,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Tòa nhà Landmark Convention, 208 Nguyễn Hữu Cảnh, P.22, Bình Thạnh',
        building: 'Landmark Convention',
        floor: 'Tầng 1',
        image: 'spaces/space_b1_1_seminar.jpg',
        images: ['spaces/space_b1_1_seminar.jpg', 'spaces/space_hall_b_grand.jpg'],
        seller: {
          id: 'seller-landmark',
          name: 'Nguyễn Bích Ngọc',
          brandName: 'Landmark Convention & Event Corp',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
          rating: 4.88,
          reviewsCount: 310,
          verified: true,
          badge: 'Đối tác Doanh nghiệp Uy tín'
        },
        equipment: ['Màn hình LED P2.5 siêu nét 300 inch', 'Dàn âm thanh Line Array hội trường', 'Micro không dây Shure 6 kênh', 'Cabin dịch cabin 2 ngôn ngữ'],
        tags: ['Màn hình LED 300 inch', 'Âm thanh Line Array', 'Sức chứa 120 người']
      },
      {
        _id: 'b1-2',
        name: 'Không Gian Thuyết Trình B1.102 Interactive Lab',
        spaceType: 'Không gian sự kiện',
        categoryName: 'Không gian sự kiện',
        capacity: 80,
        area: 110,
        hourlyPrice: 420000,
        dailyPrice: 2940000,
        rating: 4.89,
        reviewsCount: 42,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Tòa nhà Landmark Convention, 208 Nguyễn Hữu Cảnh, P.22, Bình Thạnh',
        building: 'Landmark Convention',
        floor: 'Tầng 1',
        image: 'spaces/space_b1_2_lecture.jpg',
        images: ['spaces/space_b1_2_lecture.jpg'],
        seller: {
          id: 'seller-landmark',
          name: 'Nguyễn Bích Ngọc',
          brandName: 'Landmark Convention & Event Corp',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
          rating: 4.88,
          reviewsCount: 310,
          verified: true,
          badge: 'Đối tác Doanh nghiệp Uy tín'
        },
        equipment: ['2 Máy chiếu laser 4K', 'Hệ thống âm thanh hội thảo', 'Ghế đệm công thái học gấp gọn'],
        tags: ['Thuyết trình Pitching', 'Máy chiếu 4K Laser']
      },
      {
        _id: 'hall-b',
        name: 'Đại Sảnh Sự Kiện Grand Ballroom B',
        spaceType: 'Không gian sự kiện',
        categoryName: 'Không gian sự kiện',
        capacity: 350,
        area: 420,
        hourlyPrice: 1200000,
        dailyPrice: 8400000,
        rating: 4.98,
        reviewsCount: 95,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Tòa nhà Landmark Convention, 208 Nguyễn Hữu Cảnh, P.22, Bình Thạnh',
        building: 'Landmark Convention',
        floor: 'Tầng Trệt',
        image: 'spaces/space_hall_b_grand.jpg',
        images: ['spaces/space_hall_b_grand.jpg', 'spaces/space_b1_1_seminar.jpg'],
        seller: {
          id: 'seller-landmark',
          name: 'Nguyễn Bích Ngọc',
          brandName: 'Landmark Convention & Event Corp',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
          rating: 4.88,
          reviewsCount: 310,
          verified: true,
          badge: 'Đối tác Doanh nghiệp Uy tín'
        },
        equipment: ['Sân khấu nâng hạ tự động', 'Hệ thống chiếu sáng Moving Head', 'Màn hình LED trung tâm 500 inch', 'Hệ thống điện 3 pha công suất lớn'],
        tags: ['Gala & Hội nghị Quốc tế', 'Sức chứa 350 khách', 'Sân khấu chuyên nghiệp']
      },
      {
        _id: 'choi-2',
        name: 'Solo Focus Pod 2 Silent Work Capsule',
        spaceType: 'Meeting Pod cách âm',
        categoryName: 'Meeting Pod cách âm',
        capacity: 2,
        area: 8,
        hourlyPrice: 45000,
        dailyPrice: 280000,
        rating: 4.9,
        reviewsCount: 64,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        building: 'Innovation Hub - Sảnh B',
        floor: 'Sân vườn',
        image: 'spaces/space_choi_2_solo_pod.jpg',
        images: ['spaces/space_choi_2_solo_pod.jpg', 'spaces/space_choi_1_focus_pod.jpg'],
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
        equipment: ['Bàn đứng công thái học nâng hạ', 'Đèn livestream điều chỉnh nhiệt màu', 'Ổ cắm sạc không dây Qi', 'Cách âm tuyệt đối'],
        tags: ['Solo Deep Work', 'Phỏng vấn Online', 'Livestream Studio']
      },
      {
        _id: 'hot-desk-1',
        name: 'Hot Desk Zone - Sàn Co-working Mở FlexSpace',
        spaceType: 'Bàn làm việc linh hoạt',
        categoryName: 'Bàn làm việc linh hoạt',
        capacity: 35,
        area: 90,
        hourlyPrice: 35000,
        dailyPrice: 180000,
        rating: 4.93,
        reviewsCount: 112,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        building: 'Innovation Hub Tầng 3',
        floor: 'Tầng 3',
        image: 'spaces/space_a2_3_creative_hub.jpg',
        images: ['spaces/space_a2_3_creative_hub.jpg'],
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
        equipment: ['Bàn làm việc gỗ sồi tự nhiên', 'Ghế lưới công thái học Herman Miller', 'Trà & Cà phê miễn phí', 'Wifi 6 tốc độ 800Mbps'],
        tags: ['Co-working linh hoạt', 'Trà & Cafe Free', 'Wifi 6 siêu tốc']
      },
      {
        _id: 'studio-media',
        name: 'Media Creator Studio & Podcast Room',
        spaceType: 'Studio sáng tạo',
        categoryName: 'Studio sáng tạo',
        capacity: 8,
        area: 32,
        hourlyPrice: 180000,
        dailyPrice: 1200000,
        rating: 4.96,
        reviewsCount: 47,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Tòa nhà Creative Hub, 120 Hoàng Hoa Thám, Bình Thạnh',
        building: 'Creative Hub Center',
        floor: 'Tầng 4',
        image: 'spaces/space_a2_3_creative_hub.jpg',
        images: ['spaces/space_a2_3_creative_hub.jpg'],
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
        equipment: ['Micro thu âm Rodecaster Pro', 'Đèn Nanlite Forza 300B', 'Phông xanh Green Screen cuộn điện', 'Màn hình kiểm âm Yamaha HS8'],
        tags: ['Thu âm Podcast', 'Quay Video 4K', 'Phòng tiêu âm chuẩn']
      },
      {
        _id: 'a2-2',
        name: 'Conference Room A2.2 Strategy Hub',
        spaceType: 'Phòng họp VIP',
        categoryName: 'Phòng họp VIP',
        capacity: 16,
        area: 38,
        hourlyPrice: 200000,
        dailyPrice: 1400000,
        rating: 4.92,
        reviewsCount: 61,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Tòa nhà TechPark Executive, 66 Võ Văn Tần, Q.3, TP.HCM',
        building: 'TechPark Executive',
        floor: 'Tầng 2',
        image: 'spaces/space_a2_2_boardroom.jpg',
        images: ['spaces/space_a2_2_boardroom.jpg', 'spaces/space_a2_1_meeting_vip.jpg'],
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
        equipment: ['Smart TV Sony 75 inch', 'Loa hội nghị Jabra Speak 710', 'Bảng trắng di động', 'Cáp kết nối HDMI/Type-C đa năng'],
        tags: ['Họp chiến lược', 'Tiện nghi VIP', 'Đặt nhanh']
      },
      {
        _id: 'a2-3',
        name: 'Creative Workshop Lounge A2.3',
        spaceType: 'Văn phòng riêng',
        categoryName: 'Văn phòng riêng',
        capacity: 25,
        area: 55,
        hourlyPrice: 220000,
        dailyPrice: 1540000,
        rating: 4.95,
        reviewsCount: 79,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống',
        location: 'Trường Đại học Kinh tế - Luật, Số 66 Đường 3, P. Linh Xuân, TP. Thủ Đức',
        building: 'Tòa nhà A2 - UEL Campus',
        floor: 'Tầng 2',
        image: 'spaces/space_a2_3_creative_hub.jpg',
        images: ['spaces/space_a2_3_creative_hub.jpg', 'spaces/space_a2_1_meeting_vip.jpg'],
        seller: {
          id: 'seller-uel',
          name: 'Đặng Tuấn Anh',
          brandName: 'Ban Quản trị Cơ sở vật chất UEL Space',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
          rating: 4.94,
          reviewsCount: 189,
          verified: true,
          badge: 'Ban Quản trị • Đại học Kinh tế - Luật'
        },
        equipment: ['Bàn module di động', 'Bảng kính tương tác 3 mặt tường', 'Máy chiếu gần siêu sáng EPSON', 'Khu vực pantry giải khát'],
        tags: ['Workshop Sáng tạo', 'Thiết kế Design Thinking', 'Pantry riêng']
      }
    ];
  }
}
