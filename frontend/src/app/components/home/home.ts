import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SERVER_BASE_URL, SERVER_IMAGES_LINK } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';
import { GoogleCalendarService } from '../../services/google-calendar.service';

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
  server_images_link = SERVER_IMAGES_LINK;
  searchQuery: string = '';
  selectedDateFilter: string = 'Hôm nay';
  selectedTimeSlot: string = '08:00 - 17:00';
  selectedCapacity: string = 'all';
  selectedEquipment: string = 'all';

  activeDropdown: 'date' | 'time' | 'capacity' | 'equipment' | null = null;
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

  equipmentOptions = [
    { value: 'all', label: 'Tất cả tiện ích' },
    { value: 'ai-cam', label: 'AI Occupancy Detection' },
    { value: 'display', label: 'Màn hình 4K / Máy chiếu' },
    { value: 'wifi', label: 'Cáp quang 1Gbps' },
    { value: 'board', label: 'Bảng kính / Smartboard' }
  ];

  spaces: SpaceItem[] = [
    {
      id: 'b1-104',
      name: 'Boardroom VIP B1',
      building: 'Central Tower Q.1 - Tầng 12',
      spaceType: 'Phòng họp VIP',
      capacity: 24,
      capacityText: '24 chỗ ngồi',
      areaSize: 60,
      hourlyPrice: 250000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Micro hội nghị'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a2_1_meeting_vip.jpg'
    },
    {
      id: 'a2-1',
      name: 'Private Suite A2',
      building: 'TechPark Executive - Tầng 5',
      spaceType: 'Văn phòng riêng',
      capacity: 12,
      capacityText: '12 người',
      areaSize: 35,
      hourlyPrice: 180000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Điều hòa', 'Cáp quang 1Gbps', 'Bảng kính'],
      image: SERVER_IMAGES_LINK + 'spaces/space_b2_101_private_office.jpg'
    },
    {
      id: 'thu-vien-2',
      name: 'Khu Hot Desk Coworking',
      building: 'Innovation Hub - Tầng 2',
      spaceType: 'Bàn làm việc linh hoạt',
      capacity: 60,
      capacityText: '60 chỗ ngồi',
      areaSize: 180,
      hourlyPrice: 35000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Cáp quang 1Gbps', 'Điều hòa', 'Ổ cắm điện', 'Tủ locker'],
      image: SERVER_IMAGES_LINK + 'spaces/space_thu_vien_coworking.jpg'
    },
    {
      id: 'a3-301',
      name: 'Hội trường Event & Workshop A3',
      building: 'Landmark Lounge - Tầng 8',
      spaceType: 'Không gian sự kiện',
      capacity: 100,
      capacityText: '100 khách',
      areaSize: 150,
      hourlyPrice: 450000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Màn hình 4K', 'Âm thanh vòm', 'Cáp quang 1Gbps'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a3_301_event_hall.jpg'
    },
    {
      id: 'choi-1',
      name: 'Focus Pod 1 Cách Âm',
      building: 'Green Office Suites - Tầng 3',
      spaceType: 'Meeting Pod',
      capacity: 4,
      capacityText: '4 người',
      areaSize: 12,
      hourlyPrice: 70000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Cách âm chuẩn', 'Màn hình họp trực tuyến', 'Cáp quang 1Gbps'],
      image: SERVER_IMAGES_LINK + 'spaces/space_choi_1_focus_pod.jpg'
    },
    {
      id: 'b2-101',
      name: 'Creative Studio Lab B2',
      building: 'TechPark Executive - Tầng 6',
      spaceType: 'Phòng họp sáng tạo',
      capacity: 20,
      capacityText: '20 người',
      areaSize: 45,
      hourlyPrice: 150000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['AI Occupancy', 'Bảng tương tác', 'Cáp quang 1Gbps', 'Máy chiếu'],
      image: SERVER_IMAGES_LINK + 'spaces/space_a_105_creative_media.jpg'
    }
  ];

  ngOnInit() {
    this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots();
  }

  toggleDropdown(type: 'date' | 'time' | 'capacity' | 'equipment', event?: Event) {
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

  get equipmentLabel(): string {
    const found = this.equipmentOptions.find(o => o.value === this.selectedEquipment);
    return found ? found.label : 'Thiết bị';
  }

  get filteredSpaces(): SpaceItem[] {
    return this.spaces.filter(s => {
      const query = this.searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        s.name.toLowerCase().includes(query) ||
        s.building.toLowerCase().includes(query) ||
        s.spaceType.toLowerCase().includes(query);

      let matchCapacity = true;
      if (this.selectedCapacity === 'small') {
        matchCapacity = s.capacity < 20;
      } else if (this.selectedCapacity === 'medium') {
        matchCapacity = s.capacity >= 20 && s.capacity <= 50;
      } else if (this.selectedCapacity === 'large') {
        matchCapacity = s.capacity > 50;
      }

      let matchEquipment = true;
      if (this.selectedEquipment === 'may-chieu') {
        matchEquipment = s.equipment.includes('Máy chiếu');
      } else if (this.selectedEquipment === 'dieu-hoa') {
        matchEquipment = s.equipment.includes('Điều hòa');
      } else if (this.selectedEquipment === 'wifi') {
        matchEquipment = s.equipment.includes('Wifi tốc độ cao');
      } else if (this.selectedEquipment === 'bang-tu') {
        matchEquipment = s.equipment.includes('Bảng từ');
      }

      return matchQuery && matchCapacity && matchEquipment;
    });
  }

  resetHomeFilters() {
    this.searchQuery = '';
    this.selectedDateFilter = 'Hôm nay';
    this.selectedTimeSlot = '08:00 - 17:00';
    this.selectedCapacity = 'all';
    this.selectedEquipment = 'all';
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

  studentInfo = {
    name: 'Nguyễn Minh Quân',
    id: 'CORP-88392',
    major: 'Đại diện Doanh nghiệp • FinTech Hub'
  };

  openBookingModal(space: SpaceItem) {
    const floorMatch = space.building.match(/Tầng\s*\d+/i);
    const floor = floorMatch ? floorMatch[0] : 'Tầng 1';

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
      type: space.spaceType,
      capacity: space.capacity,
      status: space.status,
      statusText: space.statusText,
      hourlyPrice: pricePerHour,
      totalPrice: pricePerHour * this.customDurationHours,
      facilities: space.equipment && space.equipment.length > 0 
        ? space.equipment.map(e => e.includes('Wifi') ? 'Cáp quang 1Gbps' : e.includes('Điều hòa') ? 'Điều hòa 2 chiều' : e.includes('Máy chiếu') ? 'Màn hình 4K / Máy chiếu' : e)
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

  openGoogleCalendarExternal(): void {
    if (!this.selectedRoomDetail) return;
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt ${this.selectedRoomDetail.name}`,
      roomName: this.selectedRoomDetail.name,
      building: this.selectedRoomDetail.building,
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Học tập & Hoạt động không gian UEL',
      bookerName: this.studentInfo.name
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
      payUrl: '',
      qrCodeUrl: '',
      isProcessing: true,
      loading: true,
      roomName: this.selectedRoomDetail.name || 'Phòng học UEL',
      slotText: `${this.customBookingDate} (${this.customStartTime} - ${this.customEndTime})`
    };

    // Gọi API Backend MoMo Sandbox
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
        this.momoModal.isProcessing = false;
        this.momoModal.loading = false;
        if (data && data.success) {
          this.momoModal.payUrl = data.payUrl || '';
          this.momoModal.qrCodeUrl = data.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0908123456|||0|0|${totalAmount}|${code}|transfer_myqr`;
        } else {
          this.momoModal.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0908123456|||0|0|${totalAmount}|${code}|transfer_myqr`;
        }
      })
      .catch(err => {
        console.warn('MoMo create error:', err);
        this.momoModal.isProcessing = false;
        this.momoModal.loading = false;
        this.momoModal.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0908123456|||0|0|${totalAmount}|${code}|transfer_myqr`;
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
        // Tự động đẩy sự kiện lên Google Calendar sau khi thanh toán thành công
        this.addToGoogleCalendar();
      })
      .catch(() => {
        this.momoModal.isOpen = false;
        this.momoModal.isProcessing = false;
        this.bookingSuccess = true;
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
    private sanitizer: DomSanitizer
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
      bookerName: this.studentInfo.name
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
      bookerName: this.studentInfo.name
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
