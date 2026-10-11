import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SERVER_IMAGES_LINK } from '../../services/api-config';
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
      status: 'available',
      statusText: 'Trống',
      equipment: ['Điều hòa', 'Bảng từ', 'Wifi tốc độ cao'],
      image: SERVER_IMAGES_LINK + 'demo_space_card.png'
    }
  ];

  ngOnInit() {}

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

  // Detailed Room & Booking Modal State (Matching Map tab)
  selectedRoomDetail: any = null;
  selectedSlot: any = null;
  bookingSuccess: boolean = false;

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

    const todaySlots = [
      { period: 'Ca 1 (07:30 - 09:30)', status: 'available', text: 'Trống' },
      { period: 'Ca 2 (09:45 - 11:45)', status: space.status === 'in-use' ? 'in-use' : 'available', text: space.status === 'in-use' ? 'Đang dùng' : 'Trống' },
      { period: 'Ca 3 (13:00 - 15:00)', status: space.status, text: space.statusText },
      { period: 'Ca 4 (15:15 - 17:15)', status: 'available', text: 'Trống' },
      { period: 'Ca 5 (17:30 - 19:30)', status: 'available', text: 'Trống' }
    ];

    this.selectedRoomDetail = {
      name: space.name,
      building: space.building,
      floor: floor,
      type: space.spaceType,
      capacity: space.capacity,
      status: space.status,
      statusText: space.statusText,
      facilities: space.equipment && space.equipment.length > 0 
        ? space.equipment.map(e => e.includes('Wifi') ? 'Wifi UEL Free' : e.includes('Điều hòa') ? 'Điều hòa 2 chiều' : e.includes('Máy chiếu') ? 'Máy chiếu sắc nét' : e)
        : ['Máy chiếu sắc nét', 'Điều hòa 2 chiều', 'Wifi UEL Free', 'Ổ cắm điện'],
      currentActivity: currentActivity,
      expectedFreeTime: expectedFreeTime,
      todaySlots: todaySlots
    };

    // Default select first available slot
    this.selectedSlot = todaySlots.find(s => s.status === 'available') || todaySlots[0];
    this.bookingSuccess = false;
  }

  selectSlot(slot: any) {
    if (slot.status === 'available') {
      this.selectedSlot = slot;
    }
  }

  closeRoomDetail() {
    this.selectedRoomDetail = null;
    this.bookingSuccess = false;
  }

  closeBookingModal() {
    this.closeRoomDetail();
  }

  // Timetable State & Data
  showTimetableModal: boolean = false;
  previousRoomDetail: any = null;
  currentWeekText: string = 'Tuần 06 (05/10/2026 - 11/10/2026)';

  studentInfo = {
    name: 'Nguyễn Minh Quân',
    id: 'K224011823',
    major: 'Kinh tế Quốc tế • K22'
  };

  weekDays = [
    { key: 't2', name: 'Thứ 2', date: '05/10/2026', isToday: false },
    { key: 't3', name: 'Thứ 3', date: '06/10/2026', isToday: false },
    { key: 't4', name: 'Thứ 4', date: '07/10/2026', isToday: false },
    { key: 't5', name: 'Thứ 5', date: '08/10/2026', isToday: false },
    { key: 't6', name: 'Thứ 6', date: '09/10/2026', isToday: true },
    { key: 't7', name: 'Thứ 7', date: '10/10/2026', isToday: false },
    { key: 'cn', name: 'Chủ Nhật', date: '11/10/2026', isToday: false }
  ];

  timetableRows: Array<{
    roomCode: string;
    campus: string;
    capacity: number;
    schedule: { [key: string]: any };
  }> = [
    {
      roomCode: 'A.707',
      campus: 'Cơ sở chính',
      capacity: 65,
      schedule: {
        t2: null,
        t3: {
          subject: 'Tư duy lập trình',
          code: 'EIMT049',
          lhp: '261EIMT04901',
          room: 'A.707',
          campus: 'Cơ sở chính',
          periodsTotal: '4.5',
          periodRange: 'Tiết: 1-4.5',
          time: '07:00 -> 11h00',
          lecturer: 'TS. Trần Duy Thanh',
          language: 'Tiếng Anh'
        },
        t4: null,
        t5: null,
        t6: {
          subject: 'Kinh tế lượng ứng dụng',
          code: 'ECO023',
          lhp: '261ECO02302',
          room: 'A.707',
          campus: 'Cơ sở chính',
          periodsTotal: '4.5',
          periodRange: 'Tiết: 1-4.5',
          time: '07:00 -> 11h00',
          lecturer: 'TS. Nguyễn Thị Yến',
          language: 'Tiếng Việt'
        },
        t7: null,
        cn: null
      }
    },
    {
      roomCode: 'B1.202',
      campus: 'Cơ sở chính',
      capacity: 70,
      schedule: {
        t2: null,
        t3: null,
        t4: {
          subject: 'Thương mại điện tử',
          code: 'ECOM012',
          lhp: '261ECOM01201',
          room: 'B1.202',
          campus: 'Cơ sở chính',
          periodsTotal: '4.0',
          periodRange: 'Tiết: 6-9.5',
          time: '13:00 -> 17h00',
          lecturer: 'ThS. Lê Hoàng Minh',
          language: 'Tiếng Việt'
        },
        t5: null,
        t6: {
          subject: 'Pháp luật đại cương',
          code: 'LAW001',
          lhp: '261LAW00104',
          room: 'B1.202',
          campus: 'Cơ sở chính',
          periodsTotal: '2.5',
          periodRange: 'Tiết: 8-10',
          time: '15:15 -> 17h15',
          lecturer: 'ThS. Trần Thị Mai',
          language: 'Tiếng Việt'
        },
        t7: null,
        cn: null
      }
    },
    {
      roomCode: 'A2.301',
      campus: 'Cơ sở chính',
      capacity: 80,
      schedule: {
        t2: null,
        t3: null,
        t4: null,
        t5: {
          subject: 'Marketing căn bản',
          code: 'MKT005',
          lhp: '261MKT00503',
          room: 'A2.301',
          campus: 'Cơ sở chính',
          periodsTotal: '4.5',
          periodRange: 'Tiết: 1-4.5',
          time: '07:30 -> 11h30',
          lecturer: 'TS. Phạm Hải Nam',
          language: 'Tiếng Việt'
        },
        t6: null,
        t7: null,
        cn: null
      }
    },
    {
      roomCode: 'B2.104',
      campus: 'Khu tự học',
      capacity: 45,
      schedule: {
        t2: null,
        t3: null,
        t4: null,
        t5: null,
        t6: null,
        t7: null,
        cn: null
      }
    }
  ];

  openTimetableFromDetail(room: any) {
    this.previousRoomDetail = room;
    this.selectedRoomDetail = null;
    this.showTimetableModal = true;
  }

  returnToRoomDetail() {
    if (this.previousRoomDetail) {
      this.selectedRoomDetail = this.previousRoomDetail;
      this.previousRoomDetail = null;
    }
    this.showTimetableModal = false;
  }

  closeTimetableModal() {
    if (this.previousRoomDetail) {
      this.selectedRoomDetail = this.previousRoomDetail;
      this.previousRoomDetail = null;
    }
    this.showTimetableModal = false;
  }

  closeAllModals() {
    this.previousRoomDetail = null;
    this.selectedRoomDetail = null;
    this.showTimetableModal = false;
  }

  bookSlotFromTimetable(roomCode: string, day: any) {
    this.showTimetableModal = false;
    this.previousRoomDetail = null;
    const matchingSpace = this.spaces.find(s => s.name.includes(roomCode));
    if (matchingSpace) {
      this.openBookingModal(matchingSpace);
    } else {
      this.selectedRoomDetail = {
        name: `Phòng ${roomCode}`,
        building: 'Cơ sở chính UEL',
        floor: 'Tầng 2',
        type: 'Phòng học lý thuyết',
        capacity: 50,
        status: 'available',
        statusText: 'Trống',
        facilities: ['Máy chiếu sắc nét', 'Điều hòa 2 chiều', 'Wifi UEL Free'],
        currentActivity: 'Phòng hiện hoàn toàn trống, sẵn sàng đăng ký sử dụng ngay',
        expectedFreeTime: 'Khả dụng cả ngày',
        todaySlots: [
          { period: 'Ca 1 (07:30 - 09:30)', status: 'available', text: 'Trống' },
          { period: 'Ca 2 (09:45 - 11:45)', status: 'available', text: 'Trống' },
          { period: 'Ca 3 (13:00 - 15:00)', status: 'available', text: 'Trống' },
          { period: 'Ca 4 (15:15 - 17:15)', status: 'available', text: 'Trống' },
          { period: 'Ca 5 (17:30 - 19:30)', status: 'available', text: 'Trống' }
        ]
      };
      this.selectedSlot = this.selectedRoomDetail.todaySlots[2];
    }
  }

  constructor(private googleCalendarService: GoogleCalendarService) {}

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
