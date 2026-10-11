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
    { value: 'all', label: 'Thiết bị' },
    { value: 'may-chieu', label: 'Máy chiếu' },
    { value: 'dieu-hoa', label: 'Điều hòa' },
    { value: 'wifi', label: 'Wifi tốc độ' },
    { value: 'bang-tu', label: 'Bảng từ' }
  ];

  spaces: SpaceItem[] = [
    {
      id: 'b1-104',
      name: 'Phòng B1.104',
      building: 'Tòa nhà B1 - Tầng 1',
      spaceType: 'Giảng đường',
      capacity: 50,
      capacityText: '50 người',
      areaSize: 60,
      hourlyPrice: 60000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Máy chiếu', 'Điều hòa', 'Wifi tốc độ cao'],
      image: SERVER_IMAGES_LINK + 'demo_space_card.png'
    },
    {
      id: 'a2-1',
      name: 'Phòng Họp A2.1',
      building: 'Tòa nhà A - Tầng 2',
      spaceType: 'Phòng họp',
      capacity: 15,
      capacityText: '15 người',
      areaSize: 30,
      hourlyPrice: 120000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Máy chiếu', 'Điều hòa', 'Bảng từ'],
      image: SERVER_IMAGES_LINK + 'demo_space_card.png'
    },
    {
      id: 'thu-vien-2',
      name: 'Khu tự học Thư viện',
      building: 'Tòa nhà Thư viện - Tầng 2',
      spaceType: 'Khu tự học',
      capacity: 120,
      capacityText: '120 người',
      areaSize: 200,
      hourlyPrice: 25000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Wifi tốc độ cao', 'Điều hòa', 'Ổ cắm điện'],
      image: SERVER_IMAGES_LINK + 'demo_space_card.png'
    },
    {
      id: 'a3-301',
      name: 'Giảng đường A3.301',
      building: 'Tòa nhà A3 - Tầng 3',
      spaceType: 'Giảng đường',
      capacity: 80,
      capacityText: '80 người',
      areaSize: 90,
      hourlyPrice: 200000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Máy chiếu', 'Điều hòa', 'Wifi tốc độ cao', 'Bảng từ'],
      image: SERVER_IMAGES_LINK + 'demo_space_card.png'
    },
    {
      id: 'choi-1',
      name: 'Chòi tự học 1',
      building: 'Khuôn viên ngoài trời (Đường Thanh Niên)',
      spaceType: 'Khu tự học',
      capacity: 6,
      capacityText: '6 người',
      areaSize: 15,
      hourlyPrice: 30000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Wifi tốc độ cao', 'Ổ cắm điện'],
      image: SERVER_IMAGES_LINK + 'demo_space_card.png'
    },
    {
      id: 'b2-101',
      name: 'Phòng B2.101',
      building: 'Tòa nhà B2 - Tầng 1',
      spaceType: 'Phòng học',
      capacity: 35,
      capacityText: '35 người',
      areaSize: 45,
      hourlyPrice: 60000,
      status: 'available',
      statusText: 'Trống',
      equipment: ['Điều hòa', 'Bảng từ', 'Wifi tốc độ cao'],
      image: SERVER_IMAGES_LINK + 'demo_space_card.png'
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
    id: 'K224011823',
    major: 'Kinh tế Quốc tế • K22'
  };

  openBookingModal(space: SpaceItem) {
    const floorMatch = space.building.match(/Tầng\s*\d+/i);
    const floor = floorMatch ? floorMatch[0] : 'Tầng 1';

    let currentActivity = 'Phòng hiện hoàn toàn trống, sẵn sàng đăng ký sử dụng ngay';
    let expectedFreeTime = 'Khả dụng cả ngày';
    if (space.status === 'in-use') {
      currentActivity = 'Đang có nhóm sinh viên K23 học tập & thảo luận';
      expectedFreeTime = 'Dự kiến trống lúc 15:00';
    } else if (space.status === 'reserved') {
      currentActivity = 'Đã có bạn đăng ký giữ chỗ trước qua App UEL Space';
      expectedFreeTime = 'Khả dụng sau ca 17:15';
    } else if (space.status === 'maintenance') {
      currentActivity = 'Đang kiểm tra bảo dưỡng thiết bị máy lạnh & đường truyền';
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
        ? space.equipment.map(e => e.includes('Wifi') ? 'Wifi UEL Free' : e.includes('Điều hòa') ? 'Điều hòa 2 chiều' : e.includes('Máy chiếu') ? 'Máy chiếu sắc nét' : e)
        : ['Máy chiếu sắc nét', 'Điều hòa 2 chiều', 'Wifi UEL Free', 'Ổ cắm điện'],
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
      title: `[UEL SPACE] Đặt phòng ${r?.name || 'Học tập'}`,
      roomName: r?.name || 'Phòng học UEL',
      building: r?.building || 'Cơ sở chính UEL',
      code: 'UEL-88392',
      date: new Date().toLocaleDateString('vi-VN'),
      timeSlot: s?.period || 'Ca 3 (13:00 - 15:00)',
      purpose: 'Học tập & Thảo luận nhóm sinh viên',
      bookerName: this.studentInfo.name
    });
  }

  downloadIcs(room?: any, slot?: any) {
    const r = room || this.selectedRoomDetail;
    const s = slot || this.selectedSlot;
    this.googleCalendarService.downloadIcsFile({
      title: `[UEL SPACE] Đặt phòng ${r?.name || 'Học tập'}`,
      roomName: r?.name || 'Phòng học UEL',
      building: r?.building || 'Cơ sở chính UEL',
      code: 'UEL-88392',
      date: new Date().toLocaleDateString('vi-VN'),
      timeSlot: s?.period || 'Ca 3 (13:00 - 15:00)',
      purpose: 'Học tập & Thảo luận nhóm sinh viên',
      bookerName: this.studentInfo.name
    });
  }

  addCourseToGoogleCalendar(course: any, day: any) {
    this.googleCalendarService.openGoogleCalendar({
      title: `[Lớp học UEL] ${course.subject} (${course.code}) - Phòng ${course.room}`,
      roomName: course.room,
      building: course.campus,
      code: course.lhp,
      date: day.date,
      timeSlot: course.time,
      purpose: `Giảng viên: ${course.lecturer} | Số tiết: ${course.periodsTotal} (${course.periodRange})`,
      details: `📚 Môn học: ${course.subject} (${course.code})\n🏛️ Phòng: ${course.room} - ${course.campus}\n👨‍🏫 Giảng viên: ${course.lecturer}\n⏰ Giờ học: ${course.time}\n🌐 Ngôn ngữ: ${course.language}`
    });
  }
}
