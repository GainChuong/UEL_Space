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

  ngOnInit() {
    this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots();
  }

  ngAfterViewInit() {}

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

  filterByCategory(catName: string) {
    this.activeCategory = catName;
    this.activeStatus = null;
    this.selectedBuilding = {
      id: 'filter-category',
      name: `Không gian: ${catName}`,
      rooms: this.generateMockRooms(20, catName === 'Tất cả' ? undefined : catName)
    };
  }

  filterByStatus(statusObj: any) {
    this.activeStatus = statusObj.code;
    this.selectedBuilding = {
      id: 'filter-status',
      name: `Trạng thái: ${statusObj.text}`,
      rooms: this.generateMockRooms(20, this.activeCategory === 'Tất cả' ? undefined : this.activeCategory, statusObj.code)
    };
  }

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

  openBookingModal(room: any) {
    if (room.status === 'available' || room.status === 'reserved') {
      this.selectedRoomToBook = room;
      this.bookingSuccess = false;
      this.customBookingDate = new Date().toISOString().split('T')[0];
      this.customStartTime = '13:00';
      this.customEndTime = '15:00';
      this.customDurationHours = 2;
      const rawUrl = this.googleCalendarService.generateEmbedUrl(room.name, 'AGENDA');
      this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
      this.onTimeOrDateChange();
    }
  }

  onTimeOrDateChange(): void {
    this.customDurationHours = this.googleCalendarService.calculateDuration(this.customStartTime, this.customEndTime);
    if (this.selectedRoomToBook) {
      this.selectedRoomToBook.totalPrice = (this.selectedRoomToBook.hourlyPrice || 60000) * this.customDurationHours;
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
      title: `[UEL SPACE] Đặt phòng ${r.name || 'Học tập'}`,
      roomName: r.name || 'Phòng học UEL',
      building: r.building || this.selectedBuilding?.name || 'Cơ sở chính UEL',
      code: 'UEL-88392',
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Học tập & Thảo luận nhóm sinh viên',
      bookerName: this.studentInfo.name
    });
  }

  checkConflict() {
    if (!this.customStartTime || !this.customEndTime) {
      this.hasConflict = false;
      this.conflictReason = '';
      return;
    }

    const busyClasses = [
      { start: '07:30', end: '11:45', title: 'Kinh tế lượng ứng dụng', room: 'B1.202' },
      { start: '15:15', end: '17:15', title: 'Pháp luật đại cương', room: 'A1.305' }
    ];

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const selStart = toMinutes(this.customStartTime);
    const selEnd = toMinutes(this.customEndTime);

    const conflict = busyClasses.find(c => {
      const cStart = toMinutes(c.start);
      const cEnd = toMinutes(c.end);
      return Math.max(selStart, cStart) < Math.min(selEnd, cEnd);
    });

    if (conflict) {
      this.hasConflict = true;
      this.conflictReason = `Trùng giờ học "${conflict.title}" (${conflict.start} - ${conflict.end}) tại ${conflict.room}`;
    } else {
      this.hasConflict = false;
      this.conflictReason = '';
    }
  }

  constructor(
    private googleCalendarService: GoogleCalendarService,
    private sanitizer: DomSanitizer
  ) {}

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
      title: `[UEL SPACE] Đặt phòng ${r?.name || 'Học tập'}`,
      roomName: r?.name || 'Phòng học UEL',
      building: r?.building || this.selectedBuilding?.name || 'Cơ sở chính UEL',
      code: 'UEL-88392',
      date: this.customBookingDate,
      timeSlot: s?.time || `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Học tập & Thảo luận nhóm sinh viên',
      bookerName: this.studentInfo.name
    });
  }

  downloadIcs(room?: any, slot?: any) {
    const r = room || this.selectedRoomToBook;
    const s = slot || this.selectedSlot;
    this.googleCalendarService.downloadIcsFile({
      title: `[UEL SPACE] Đặt phòng ${r?.name || 'Học tập'}`,
      roomName: r?.name || 'Phòng học UEL',
      building: r?.building || this.selectedBuilding?.name || 'Cơ sở chính UEL',
      code: 'UEL-88392',
      date: this.customBookingDate,
      timeSlot: s?.time || `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Học tập & Thảo luận nhóm sinh viên',
      bookerName: this.studentInfo.name
    });
  }

  openRoomDetail(room: any) {
    this.selectedRoomDetail = room;
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
    const hourlyPrice = targetRoom.hourlyPrice || 60000;
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
          userEmail: currentUser.email || 'student@st.uel.edu.vn'
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
}
