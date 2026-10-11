import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { SERVER_IMAGES_LINK } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';
import { GoogleCalendarService } from '../../services/google-calendar.service';

@Component({
  imports: [CommonModule, TranslatePipe],
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
    { id: 'giang-duong', name: 'Giảng đường' },
    { id: 'thu-vien', name: 'Thư viện' },
    { id: 'phong-hoc', name: 'Phòng học' },
    { id: 'phong-hop', name: 'Phòng họp' },
    { id: 'khu-tu-hoc', name: 'Khu tự học' },
    { id: 'clb', name: 'CLB - Đội nhóm' }
  ];

  statuses = [
    { code: 'available', text: 'Trống', color: 'bg-status-available', shadow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]' },
    { code: 'in-use', text: 'Đang sử dụng', color: 'bg-status-in-use', shadow: 'shadow-[0_0_8px_rgba(59,130,246,0.4)]' },
    { code: 'reserved', text: 'Đã đặt', color: 'bg-status-reserved', shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]' },
    { code: 'maintenance', text: 'Bảo trì', color: 'bg-status-maintenance', shadow: 'shadow-[0_0_8px_rgba(156,163,175,0.4)]' },
    { code: 'restricted', text: 'Hạn chế', color: 'bg-status-restricted', shadow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' }
  ];

  buildings = [
    { id: 'toa-a', name: 'Tòa A', top: '58%', left: '55%' },
    { id: 'toa-b1', name: 'Tòa B1', top: '61%', left: '68%' },
    { id: 'toa-b2', name: 'Tòa B2', top: '61%', left: '76%' },
    { id: 'thu-vien', name: 'Thư viện', top: '41%', left: '53%' },
    { id: 'choi-1', name: 'Chòi tự học 1', top: '72%', left: '33%' },
    { id: 'choi-2', name: 'Chòi tự học 2', top: '55%', left: '63%' },
    { id: 'choi-3', name: 'Chòi tự học 3', top: '55%', left: '70%' }
  ];

  isMobileFilterOpen: boolean = false;

  ngOnInit() {}

  ngAfterViewInit() {}

  private generateMockRooms(count = 20, forcedType?: string, forcedStatus?: string) {
    const statusOptions = [
      { code: 'available', text: 'Trống' },
      { code: 'in-use', text: 'Đang sử dụng' },
      { code: 'reserved', text: 'Đã đặt' },
      { code: 'maintenance', text: 'Bảo trì' },
      { code: 'restricted', text: 'Hạn chế' }
    ];

    const types = ['Phòng học', 'Giảng đường', 'Phòng họp', 'Khu tự học', 'Thư viện'];

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

      let currentActivity = '';
      let expectedFreeTime = '';
      if (statusObj.code === 'in-use') {
        currentActivity = 'Đang có nhóm sinh viên K23 học tập & thảo luận';
        expectedFreeTime = 'Dự kiến trống lúc 15:00';
      } else if (statusObj.code === 'reserved') {
        currentActivity = 'Đã có bạn đăng ký giữ chỗ trước qua App UEL Space';
        expectedFreeTime = 'Khả dụng sau ca 17:15';
      } else if (statusObj.code === 'maintenance' || statusObj.code === 'restricted') {
        currentActivity = 'Đang kiểm tra bảo dưỡng thiết bị máy lạnh & đường truyền';
        expectedFreeTime = 'Tạm ngưng nhận lịch hôm nay';
      } else {
        currentActivity = 'Phòng hiện hoàn toàn trống, sẵn sàng đăng ký sử dụng ngay';
        expectedFreeTime = 'Khả dụng cả ngày';
      }

      return {
        name: `P.${roomNum}`,
        number: `${roomNum}`,
        capacity: Math.floor(Math.random() * 50) + 20,
        status: statusObj.code,
        statusText: statusObj.text,
        type: roomType,
        floor: `Tầng ${floorNum}`,
        facilities: ['Máy chiếu sắc nét', 'Điều hòa 2 chiều', 'Wifi UEL Free', 'Ổ cắm điện từng bàn', 'Bảng viết'],
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

  // Student info & schedule cross-reference
  studentInfo = {
    name: 'Nguyễn Minh Quân',
    id: 'K224011823',
    major: 'Kinh tế Quốc tế • K22'
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
      title: 'Kinh tế lượng ứng dụng',
      room: 'B1.202',
      lecturer: 'TS. Lê Hoàng Minh',
      type: 'class',
      isBusy: true,
      conflictsWith: ['slot-1', 'slot-2']
    },
    {
      id: 'sched-2',
      time: '11:45 - 13:00',
      title: 'Nghỉ trưa',
      room: '',
      type: 'free',
      isBusy: false,
      conflictsWith: []
    },
    {
      id: 'sched-3',
      time: '13:00 - 15:00',
      title: 'Trống lịch học (Giờ tự học)',
      room: '',
      type: 'free',
      isBusy: false,
      conflictsWith: []
    },
    {
      id: 'sched-4',
      time: '15:15 - 17:15',
      title: 'Pháp luật đại cương',
      room: 'A1.305',
      lecturer: 'ThS. Trần Thị Mai',
      type: 'class',
      isBusy: true,
      conflictsWith: ['slot-4']
    },
    {
      id: 'sched-5',
      time: '17:30 - 20:00',
      title: 'Trống lịch học (Tự do)',
      room: '',
      type: 'free',
      isBusy: false,
      conflictsWith: []
    }
  ];

  openBookingModal(room: any) {
    if (room.status === 'available' || room.status === 'reserved') {
      this.selectedRoomToBook = room;
      this.bookingSuccess = false;
      // Default to slot 3 (13:00 - 15:00) which is free
      this.selectedSlot = this.bookingSlots[2];
      this.checkConflict();
    }
  }

  selectBookingSlot(slot: any) {
    this.selectedSlot = slot;
    this.checkConflict();
  }

  checkConflict() {
    if (!this.selectedSlot) {
      this.hasConflict = false;
      this.conflictReason = '';
      return;
    }

    const busyItem = this.studentSchedule.find(
      item => item.isBusy && item.conflictsWith.includes(this.selectedSlot.id)
    );

    if (busyItem) {
      this.hasConflict = true;
      this.conflictReason = `Trùng giờ học "${busyItem.title}" (${busyItem.time}) tại ${busyItem.room}`;
    } else {
      this.hasConflict = false;
      this.conflictReason = '';
    }
  }

  isSlotConflicted(slotId: string): boolean {
    return this.studentSchedule.some(
      item => item.isBusy && item.conflictsWith.includes(slotId)
    );
  }

  constructor(private googleCalendarService: GoogleCalendarService) {}

  confirmBooking() {
    if (this.selectedRoomToBook && !this.hasConflict) {
      this.selectedRoomToBook.status = 'in-use';
      this.selectedRoomToBook.statusText = 'Đang sử dụng';
      this.bookingSuccess = true;
    }
  }

  addToGoogleCalendar(room?: any, slot?: any) {
    const r = room || this.selectedRoomToBook;
    const s = slot || this.selectedSlot;
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt phòng ${r?.name || 'Học tập'}`,
      roomName: r?.name || 'Phòng học UEL',
      building: r?.building || 'Cơ sở chính UEL',
      code: 'UEL-88392',
      date: new Date().toLocaleDateString('vi-VN'),
      timeSlot: s?.time || '13:00 - 15:00',
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
      building: r?.building || 'Cơ sở chính UEL',
      code: 'UEL-88392',
      date: new Date().toLocaleDateString('vi-VN'),
      timeSlot: s?.time || '13:00 - 15:00',
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

  // Timetable State & Data
  showTimetableModal: boolean = false;
  previousRoomDetail: any = null;
  currentWeekText: string = 'Tuần 06 (05/10/2026 - 11/10/2026)';
  timetableFilterCampus: string = 'all';

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
      capacity: 50,
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

  openTimetableModal() {
    this.previousRoomDetail = null;
    this.showTimetableModal = true;
  }

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
    this.previousRoomDetail = null;
    this.showTimetableModal = false;
    this.selectedRoomToBook = {
      name: roomCode,
      capacity: 50,
      type: 'Phòng học lý thuyết',
      status: 'available',
      statusText: 'Trống'
    };
    this.selectedSlot = this.bookingSlots[2];
    this.checkConflict();
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
}
