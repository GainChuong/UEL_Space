import { Component, OnInit, OnDestroy, NgZone, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import jsQR from 'jsqr';
import { SERVER_BASE_URL, SERVER_IMAGES_LINK } from '../../services/api-config';
import { SettingsService } from '../../services/settings.service';
import { SettingsModalComponent } from '../common/settings-modal/settings-modal';
import { TranslatePipe } from '../../services/translate.pipe';
import { I18nService } from '../../services/i18n.service';

export interface AdminBooking {
  id: string;
  code: string;
  spaceId: string;
  spaceName: string;
  building: string;
  bookerName: string;
  bookerEmail: string;
  organization: string;
  purpose: string;
  activityType: string;
  date: string;
  timeSlot: string;
  attendees: number;
  status: 'PENDING' | 'APPROVED' | 'IN_USE' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  processedBy?: string;
  processedAt?: string;
  actualCheckInAt?: string;
  hasConflictWarning?: boolean;
}

export interface QrCheckInRecord {
  timestamp: string;
  bookingCode: string;
  spaceName: string;
  bookerName: string;
  timeSlot: string;
  verifiedBy: string;
  type: 'CAMERA' | 'USB_SCANNER' | 'MANUAL' | 'OVERRIDE';
  notes?: string;
}

export interface AdminReleaseCase {
  id: string;
  spaceName: string;
  userEmail: string;
  userName: string;
  awayMinutes: number;
  thresholdMinutes: number;
  status: 'STILL_PENDING' | 'USER_RETURNED' | 'SPACE_RELEASED' | 'ESCALATED';
  detectedAt: string;
  notes: string;
}

export interface AdminSpace {
  id: string;
  name: string;
  building: string;
  floor: string;
  type: string;
  capacity: number;
  status: 'AVAILABLE' | 'IN_USE' | 'RESERVED' | 'MAINTENANCE';
  currentOccupants: number;
  equipment: string[];
  autoCheckoutMinutes: number;
  awayWarningMinutes: number;
}

export interface AdminUser {
  id: string;
  code: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SPACE_MANAGER' | 'LECTURER' | 'STUDENT';
  organization: string;
  status: 'ACTIVE' | 'SUSPENDED';
  bookingsCount: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface OccupancySnapshot {
  timestamp: string;
  spaceName: string;
  detectedCount: number;
  capacity: number;
  occupancyRate: number;
  confidence: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SettingsModalComponent, TranslatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin implements OnInit, OnDestroy {
  public settingsService = inject(SettingsService);
  private router = inject(Router);
  private i18n = inject(I18nService);

  ngOnDestroy(): void {
    this.stopCamera();
    this.stopOccupancyDetection();
  }

  server_images_link = SERVER_IMAGES_LINK;
  Math = Math;

  // Dropdown states for notification and avatar
  isNotificationOpen = false;
  isProfileOpen = false;
  activeNotifTab: 'all' | 'unread' = 'all';

  // Navigation State
  activeTab: 'overview' | 'approvals' | 'exceptions' | 'spaces' | 'users' | 'audit' | 'qr-checkin' | 'occupancy-detection' = 'overview';
  searchFilter: string = '';
  selectedBuildingFilter: string = 'all';
  isMobileSidebarOpen: boolean = false;

  // Toggle dropdowns
  toggleNotification(event: Event): void {
    event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
    this.isProfileOpen = false;
  }

  toggleProfile(event: Event): void {
    event.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
    this.isNotificationOpen = false;
  }

  openSettings(): void {
    this.isProfileOpen = false;
    this.settingsService.openSettings();
  }

  handleLogout(): void {
    this.isProfileOpen = false;
    this.settingsService.logout();
    this.stopCamera();
    this.stopOccupancyDetection();
    this.router.navigate(['/']);
  }

  handleLogin(): void {
    this.isProfileOpen = false;
    this.router.navigate(['/login']);
  }

  markAsRead(id: string, event: Event): void {
    event.stopPropagation();
    this.settingsService.markAsRead(id);
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.settingsService.markAllAsRead();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isNotificationOpen = false;
    this.isProfileOpen = false;
  }

  // QR Check-in Station State
  scannerInputCode: string = '';
  isProcessingScan: boolean = false;
  cameraActive: boolean = false;
  cameraFacingMode: 'user' | 'environment' = 'environment';
  isSwitchingCamera: boolean = false;
  videoStream: MediaStream | null = null;
  cameraError: string = '';
  qrScanningRunning: boolean = false;
  recentScanFeedback: { type: 'SUCCESS' | 'WARNING'; title: string; subtitle: string } | null = null;
  private isScanningFrame: boolean = false;
  private qrCanvas: HTMLCanvasElement | null = null;
  private barcodeDetector: any = null;
  private lastScannedCode: string = '';
  private lastScannedTime: number = 0;

  // Scan Result Feedback State
  scanResult: {
    status: 'IDLE' | 'SUCCESS' | 'ERROR';
    message: string;
    booking: AdminBooking | null;
    isOverrideAllowed?: boolean;
    reason?: string;
  } = {
    status: 'IDLE',
    message: '',
    booking: null
  };

  // Recent Check-in Logs at Station
  recentCheckIns: QrCheckInRecord[] = [
    {
      timestamp: '11/10/2026 10:15:32',
      bookingCode: 'UEL-88392',
      spaceName: 'Phòng A.105 (Tầng 1)',
      bookerName: 'Nguyễn Văn An (K21)',
      timeSlot: '14:00 - 16:00',
      verifiedBy: 'Trạm Cổng Tòa A (Kiosk 01)',
      type: 'CAMERA'
    },
    {
      timestamp: '11/10/2026 09:05:14',
      bookingCode: 'UEL-BK-2026-083',
      spaceName: 'Phòng Họp A2.1',
      bookerName: 'ThS. Lê Hoàng Long',
      timeSlot: '09:00 - 11:00',
      verifiedBy: 'admin@uel.edu.vn',
      type: 'USB_SCANNER'
    }
  ];

  // Admin Profile Mockup
  adminUser = {
    name: 'Quản trị viên Hệ thống UEL',
    email: 'admin@uel.edu.vn',
    role: 'System Administrator (Toàn quyền)',
    campus: 'Trường Đại học Kinh tế - Luật (UEL) - Thủ Đức',
    avatar: 'AD'
  };

  // Toast Notification
  toast: { show: boolean; message: string; type: 'success' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'success'
  };

  // Occupancy Detection State
  occModelLoaded: boolean = false;
  occModelLoading: boolean = false;
  occModelError: string = '';
  occCameraActive: boolean = false;
  occVideoStream: MediaStream | null = null;
  occDetectionRunning: boolean = false;
  occCurrentCount: number = 0;
  occConfidence: number = 0;
  occSelectedSpace: AdminSpace | null = null;
  occDetectionInterval: any = null;
  occCocoModel: any = null;
  occHistory: OccupancySnapshot[] = [];
  occPeakCount: number = 0;
  occAvgCount: number = 0;
  occDetectionFps: number = 0;
  private occLastFrameTime: number = 0;
  private occFrameCount: number = 0;
  private occFpsInterval: any = null;

  // FlexSpace AI Core Differentiator State
  occActiveBooking: AdminBooking | null = null;
  occFacingMode: 'user' | 'environment' = 'environment';
  occIsSwitchingFacing: boolean = false;
  occIsOverCapacity: boolean = false;
  occOverCapacityCount: number = 0;
  occIsOvertime: boolean = false;
  occOvertimeMinutes: number = 0;
  occSuggestedSurcharge: number = 0;
  occEmptyRoomSeconds: number = 0;
  occIsEarlyCheckoutSuggested: boolean = false;
  occSurchargeApplied: boolean = false;
  occEarlyCheckoutDone: boolean = false;
  occOvercapacityHandled: boolean = false;
  occSimulateOvertimeActive: boolean = false;

  // Rejection Modal State
  rejectModal: {
    isOpen: boolean;
    booking: AdminBooking | null;
    reason: string;
    suggestedReason: string;
  } = {
    isOpen: false,
    booking: null,
    reason: '',
    suggestedReason: ''
  };

  // Detail Modal State
  detailModal: {
    isOpen: boolean;
    booking: AdminBooking | null;
  } = {
    isOpen: false,
    booking: null
  };

  // Instant Check-in & Auto-Approval Success Modal
  scanSuccessModal: {
    isOpen: boolean;
    booking: AdminBooking | null;
  } = {
    isOpen: false,
    booking: null
  };

  closeScanSuccessModal(): void {
    this.scanSuccessModal.isOpen = false;
    this.scanSuccessModal.booking = null;
    this.lastScannedCode = '';
    this.cdr.detectChanges();
  }

  viewApprovalsTab(): void {
    this.scanSuccessModal.isOpen = false;
    this.activeTab = 'approvals';
    this.cdr.detectChanges();
  }

  viewSpacesTab(): void {
    this.scanSuccessModal.isOpen = false;
    this.activeTab = 'spaces';
    this.cdr.detectChanges();
  }

  // Data: Bookings
  bookings: AdminBooking[] = [
    {
      id: 'b-001',
      code: 'UEL-BK-2026-081',
      spaceId: 'a3-301',
      spaceName: 'Giảng đường A3.301',
      building: 'Tòa nhà A3',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL',
      purpose: 'Tổ chức Workshop AI & Business Analytics',
      activityType: 'Hội thảo / Workshop',
      date: '11/10/2026',
      timeSlot: '13:00 - 17:00',
      attendees: 75,
      status: 'PENDING',
      hasConflictWarning: false
    },
    {
      id: 'b-002',
      code: 'UEL-BK-2026-082',
      spaceId: 'thu-vien-2',
      spaceName: 'Khu tự học Thư viện (Tầng 2)',
      building: 'Tòa nhà Thư viện',
      bookerName: 'Trần Minh Anh',
      bookerEmail: 'anhtm@st.uel.edu.vn',
      organization: 'Nhóm Nghiên cứu Khoa học Kinh tế',
      purpose: 'Thảo luận chuyên đề Khảo sát Kinh tế vĩ mô',
      activityType: 'Học nhóm',
      date: '11/10/2026',
      timeSlot: '08:00 - 11:30',
      attendees: 12,
      status: 'PENDING',
      hasConflictWarning: true
    },
    {
      id: 'b-003',
      code: 'UEL-BK-2026-083',
      spaceId: 'a2-1',
      spaceName: 'Phòng Họp A2.1',
      building: 'Tòa nhà A',
      bookerName: 'ThS. Lê Hoàng Long',
      bookerEmail: 'longlh@uel.edu.vn',
      organization: 'Khoa Hệ thống Thông tin',
      purpose: 'Họp Hội đồng nghiệm thu đề tài NCKH cấp Trường',
      activityType: 'Họp chuyên môn',
      date: '12/10/2026',
      timeSlot: '09:00 - 11:00',
      attendees: 14,
      status: 'APPROVED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '10/10/2026 14:20'
    },
    {
      id: 'b-004',
      code: 'UEL-BK-2026-084',
      spaceId: 'b2-101',
      spaceName: 'Phòng B2.101',
      building: 'Tòa nhà B2',
      bookerName: 'Vũ Đức Nam',
      bookerEmail: 'namvd@st.uel.edu.vn',
      organization: 'Đoàn Thanh niên - Hội Sinh viên',
      purpose: 'Tập huấn kỹ năng Cán bộ Đoàn Hội',
      activityType: 'Sinh hoạt Đoàn Hội',
      date: '12/10/2026',
      timeSlot: '17:30 - 20:30',
      attendees: 30,
      status: 'PENDING',
      hasConflictWarning: false
    },
    {
      id: 'b-005',
      code: 'UEL-BK-2026-079',
      spaceId: 'choi-1',
      spaceName: 'Chòi tự học 1',
      building: 'Đường Thanh Niên',
      bookerName: 'Phạm Quỳnh Như',
      bookerEmail: 'nhupq@st.uel.edu.vn',
      organization: 'Nhóm Khởi nghiệp UEL',
      purpose: 'Brainstorm ý tưởng Pitching cuộc thi UEL Hackathon',
      activityType: 'Tự học',
      date: '10/10/2026',
      timeSlot: '14:00 - 16:30',
      attendees: 6,
      status: 'REJECTED',
      rejectionReason: 'Trùng lịch bảo dưỡng hệ thống ổ cắm điện khuôn viên ngoài trời.',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '10/10/2026 09:15'
    },
    {
      id: 'UEL-88392',
      code: 'UEL-88392',
      spaceId: 'a-105',
      spaceName: 'Phòng A.105',
      building: 'Tòa A - Tầng 1',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Thảo luận bài tập nhóm PTWNC & Lập trình Web nâng cao',
      activityType: 'Học nhóm',
      date: '11/10/2026',
      timeSlot: '14:00 - 16:00',
      attendees: 5,
      status: 'APPROVED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '11/10/2026 08:30'
    },
    {
      id: 'UEL-88210',
      code: 'UEL-88210',
      spaceId: 'choi-1',
      spaceName: 'Chòi tự học 1',
      building: 'Chòi tự học 1 - Đường Thanh Niên',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Học cá nhân & làm đồ án tốt nghiệp K24',
      activityType: 'Tự học',
      date: '12/10/2026',
      timeSlot: '09:00 - 11:30',
      attendees: 2,
      status: 'APPROVED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '10/10/2026 16:45'
    },
    {
      id: 'UEL-88150',
      code: 'UEL-88150',
      spaceId: 'a3-301',
      spaceName: 'Phòng A3.301',
      building: 'Tòa A3 - Tầng 3',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Thảo luận đề tài nghiên cứu khoa học NCKH',
      activityType: 'Học nhóm',
      date: '13/10/2026',
      timeSlot: '08:00 - 11:30',
      attendees: 8,
      status: 'APPROVED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '11/10/2026 07:15'
    },
    {
      id: 'UEL-87941',
      code: 'UEL-87941',
      spaceId: 'b1-202',
      spaceName: 'Phòng B1.202',
      building: 'Tòa B1 - Tầng 2',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Họp CLB Tiếng Anh UEL & Ban Chủ nhiệm ITB',
      activityType: 'Học nhóm',
      date: '11/10/2026',
      timeSlot: '13:00 - 17:00',
      attendees: 60,
      status: 'PENDING',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '10/10/2026 10:00'
    },
    {
      id: 'UEL-88777',
      code: 'UEL-88777',
      spaceId: 'a2-1',
      spaceName: 'Phòng Họp A2.1',
      building: 'Tòa nhà A - Tầng 2',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Họp Ban tổ chức Cuộc thi Hackathon UEL 2026',
      activityType: 'Họp chuyên môn',
      date: '14/10/2026',
      timeSlot: '15:00 - 17:30',
      attendees: 15,
      status: 'APPROVED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '11/10/2026 10:15'
    },
    {
      id: 'UEL-88999',
      code: 'UEL-88999',
      spaceId: 'thu-vien-2',
      spaceName: 'Khu tự học Thư viện (Tầng 2)',
      building: 'Tòa nhà Thư viện - Tầng 2',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Học tập trung tại khu vực yên tĩnh Thư viện',
      activityType: 'Tự học',
      date: '11/10/2026',
      timeSlot: '08:00 - 12:00',
      attendees: 4,
      status: 'IN_USE',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '11/10/2026 07:45',
      actualCheckInAt: '11/10/2026 08:05:00'
    },
    {
      id: 'UEL-87600',
      code: 'UEL-87600',
      spaceId: 'b2-101',
      spaceName: 'Phòng B2.101',
      building: 'Tòa B2 - Tầng 1',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Thuyết trình nhóm Kinh tế lượng',
      activityType: 'Thuyết trình',
      date: '10/10/2026',
      timeSlot: '10:00 - 12:00',
      attendees: 25,
      status: 'COMPLETED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '10/10/2026 11:30',
      actualCheckInAt: '10/10/2026 10:02:15'
    },
    {
      id: 'UEL-87115',
      code: 'UEL-87115',
      spaceId: 'choi-3',
      spaceName: 'Chòi tự học 3',
      building: 'Đường Thanh Niên',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Ôn tập thi giữa kỳ cùng các bạn trong CLB',
      activityType: 'Tự học',
      date: '11/10/2026',
      timeSlot: '08:00 - 11:00',
      attendees: 10,
      status: 'PENDING',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '10/10/2026 15:00'
    },
    {
      id: 'UEL-86902',
      code: 'UEL-86902',
      spaceId: 'choi-2',
      spaceName: 'Chòi tự học 2',
      building: 'Đường Thanh Niên',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Tự học và đọc tài liệu chuyên đề Big Data',
      activityType: 'Tự học',
      date: '11/10/2026',
      timeSlot: '14:00 - 16:00',
      attendees: 6,
      status: 'APPROVED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '10/10/2026 16:00'
    },
    {
      id: 'BK-20261011-001',
      code: 'BK-20261011-001',
      spaceId: 'a-105',
      spaceName: 'Phòng A.105',
      building: 'Tòa A - Tầng 1',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      purpose: 'Thảo luận đề tài Website Quản lý Không gian UEL Space',
      activityType: 'Học nhóm',
      date: '11/10/2026',
      timeSlot: '08:00 - 11:30',
      attendees: 5,
      status: 'APPROVED',
      processedBy: 'admin@uel.edu.vn',
      processedAt: '11/10/2026 07:30'
    }
  ];

  // Data: Release Cases (F21-F23)
  releaseCases: AdminReleaseCase[] = [
    {
      id: 'rc-101',
      spaceName: 'Phòng học B1.102 (Tầng 1)',
      userEmail: 'hoangnv@st.uel.edu.vn',
      userName: 'Nguyễn Văn Hoàng',
      awayMinutes: 22,
      thresholdMinutes: 15,
      status: 'STILL_PENDING',
      detectedAt: '09:20 - 11/10/2026',
      notes: 'Hệ thống phát hiện vắng mặt quá 22 phút (quy định tối đa 15 phút), chưa quét lại QR check-in.'
    },
    {
      id: 'rc-102',
      spaceName: 'Khu tự học Thư viện - Bàn 14',
      userEmail: 'linhdt@st.uel.edu.vn',
      userName: 'Đỗ Thùy Linh',
      awayMinutes: 35,
      thresholdMinutes: 15,
      status: 'STILL_PENDING',
      detectedAt: '09:05 - 11/10/2026',
      notes: 'Bỏ đồ giữ chỗ tại thư viện nhưng không có mặt, sinh viên khác gửi khiếu nại qua hệ thống.'
    },
    {
      id: 'rc-103',
      spaceName: 'Chòi tự học 3 (Đường Thanh Niên)',
      userEmail: 'tuanlm@st.uel.edu.vn',
      userName: 'Lê Minh Tuấn',
      awayMinutes: 18,
      thresholdMinutes: 15,
      status: 'USER_RETURNED',
      detectedAt: '08:40 - 11/10/2026',
      notes: 'Sinh viên đã quét mã QR xác nhận quay lại trong thời gian gia hạn.'
    }
  ];

  // Data: Spaces
  spaces: AdminSpace[] = [
    {
      id: 'a3-301',
      name: 'Giảng đường A3.301',
      building: 'Tòa nhà A3',
      floor: 'Tầng 3',
      type: 'Giảng đường',
      capacity: 80,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Máy chiếu Laser', 'Âm thanh không dây', 'Điều hòa 2 chiều', 'Wifi UEL HighSpeed'],
      autoCheckoutMinutes: 20,
      awayWarningMinutes: 10
    },
    {
      id: 'a2-1',
      name: 'Phòng Họp A2.1',
      building: 'Tòa nhà A',
      floor: 'Tầng 2',
      type: 'Phòng họp',
      capacity: 15,
      status: 'RESERVED',
      currentOccupants: 0,
      equipment: ['Màn hình tương tác', 'Micro đa hướng', 'Điều hòa', 'Bảng kính'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8
    },
    {
      id: 'thu-vien-2',
      name: 'Khu tự học Thư viện',
      building: 'Tòa nhà Thư viện',
      floor: 'Tầng 2',
      type: 'Khu tự học',
      capacity: 120,
      status: 'IN_USE',
      currentOccupants: 92,
      equipment: ['Wifi công suất lớn', 'Bàn có cổng sạc Type-C', 'Đèn chống cận'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 10
    },
    {
      id: 'b2-101',
      name: 'Phòng B2.101',
      building: 'Tòa nhà B2',
      floor: 'Tầng 1',
      type: 'Phòng học',
      capacity: 35,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Máy chiếu', 'Bảng từ xanh', 'Điều hòa'],
      autoCheckoutMinutes: 20,
      awayWarningMinutes: 10
    },
    {
      id: 'choi-1',
      name: 'Chòi tự học 1',
      building: 'Đường Thanh Niên',
      floor: 'Khuôn viên ngoài trời',
      type: 'Khu tự học ngoài trời',
      capacity: 6,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Ổ cắm sạc chống nước', 'Đèn LED chiếu sáng', 'Wifi UEL Outdoor'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8
    },
    {
      id: 'a-105',
      name: 'Phòng A.105',
      building: 'Tòa nhà A',
      floor: 'Tầng 1',
      type: 'Phòng học',
      capacity: 35,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Máy chiếu Laser', 'Điều hòa 2 chiều', 'Wifi UEL HighSpeed'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 10
    },
    {
      id: 'b1-202',
      name: 'Phòng B1.202',
      building: 'Tòa nhà B1',
      floor: 'Tầng 2',
      type: 'Giảng đường',
      capacity: 60,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Âm thanh không dây', 'Máy chiếu', 'Điều hòa', 'Wifi HighSpeed'],
      autoCheckoutMinutes: 20,
      awayWarningMinutes: 10
    },
    {
      id: 'choi-2',
      name: 'Chòi tự học 2',
      building: 'Đường Thanh Niên',
      floor: 'Khuôn viên ngoài trời',
      type: 'Khu tự học ngoài trời',
      capacity: 6,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Ổ cắm sạc chống nước', 'Đèn LED chiếu sáng', 'Wifi UEL Outdoor'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8
    },
    {
      id: 'choi-3',
      name: 'Chòi tự học 3',
      building: 'Đường Thanh Niên',
      floor: 'Khuôn viên ngoài trời',
      type: 'Khu tự học ngoài trời',
      capacity: 10,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Ổ cắm sạc chống nước', 'Đèn LED chiếu sáng', 'Wifi UEL Outdoor'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8
    }
  ];

  // Data: Users & Roles
  users: AdminUser[] = [
    {
      id: 'u-01',
      code: 'ADMIN-001',
      name: 'Quản trị viên Hệ thống UEL',
      email: 'admin@uel.edu.vn',
      role: 'ADMIN',
      organization: 'Phòng QTTTS & TT Quản lý Hạ tầng',
      status: 'ACTIVE',
      bookingsCount: 0
    },
    {
      id: 'u-02',
      code: 'MGR-002',
      name: 'Quản lý Không gian Thư viện',
      email: 'library_mgr@uel.edu.vn',
      role: 'SPACE_MANAGER',
      organization: 'Thư viện Trung tâm UEL',
      status: 'ACTIVE',
      bookingsCount: 4
    },
    {
      id: 'u-03',
      code: 'K24411',
      name: 'Nguyễn Trần Kim Giang',
      email: 'giangnntk24411@st.uel.edu.vn',
      role: 'STUDENT',
      organization: 'CLB ITB UEL (Chủ nhiệm)',
      status: 'ACTIVE',
      bookingsCount: 18
    },
    {
      id: 'u-04',
      code: 'GV-HTTT',
      name: 'ThS. Lê Hoàng Long',
      email: 'longlh@uel.edu.vn',
      role: 'LECTURER',
      organization: 'Khoa Hệ thống Thông tin',
      status: 'ACTIVE',
      bookingsCount: 12
    },
    {
      id: 'u-05',
      code: 'K23405',
      name: 'Đỗ Thùy Linh',
      email: 'linhdt@st.uel.edu.vn',
      role: 'STUDENT',
      organization: 'Sinh viên Khoa Luật Kinh tế',
      status: 'SUSPENDED',
      bookingsCount: 5
    }
  ];

  // Data: Audit Logs (F34)
  auditLogs: AuditLogItem[] = [
    {
      id: 'log-01',
      timestamp: '11/10/2026 09:28:14',
      actor: 'admin@uel.edu.vn',
      action: 'APPROVE_BOOKING',
      target: 'Phòng Họp A2.1 (UEL-BK-2026-083)',
      details: 'Phê duyệt thành công lịch họp NCKH Khoa HTTT.',
      level: 'INFO'
    },
    {
      id: 'log-02',
      timestamp: '11/10/2026 09:12:00',
      actor: 'SYSTEM_JOB_F38',
      action: 'AUTO_CHECKOUT_TRIGGERED',
      target: 'Khu tự học Thư viện (linhdt@st.uel.edu.vn)',
      details: 'Tự động giải phóng chỗ do vắng mặt quá 35 phút (ngưỡng 15 phút).',
      level: 'WARNING'
    },
    {
      id: 'log-03',
      timestamp: '11/10/2026 08:30:22',
      actor: 'admin@uel.edu.vn',
      action: 'SPACE_MAINTENANCE_LOCK',
      target: 'Chòi tự học 1 (Đường Thanh Niên)',
      details: 'Khóa không gian chuyển sang trạng thái MAINTENANCE để sửa chữa đường điện.',
      level: 'WARNING'
    },
    {
      id: 'log-04',
      timestamp: '10/10/2026 17:45:10',
      actor: 'admin@uel.edu.vn',
      action: 'USER_ROLE_UPDATED',
      target: 'ThS. Lê Hoàng Long (longlh@uel.edu.vn)',
      details: 'Cấp quyền LECTURER và phân bổ quyền mượn phòng hội thảo ưu tiên.',
      level: 'INFO'
    }
  ];

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Preload COCO-SSD model in background so turning on IoT camera is instant
    this.loadOccupancyModel();
    if (!this.occSelectedSpace && this.spaces.length > 0) {
      this.selectSpaceForDetection(this.spaces[0]);
    }
  }

  // Filter Bookings
  get filteredBookings(): AdminBooking[] {
    return this.bookings.filter(b => {
      const matchSearch = !this.searchFilter || 
        b.code.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        b.bookerName.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        b.spaceName.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        b.organization.toLowerCase().includes(this.searchFilter.toLowerCase());

      const matchBuilding = this.selectedBuildingFilter === 'all' || b.building.includes(this.selectedBuildingFilter);

      return matchSearch && matchBuilding;
    });
  }

  get pendingBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'PENDING').length;
  }

  get activeExceptionsCount(): number {
    return this.releaseCases.filter(r => r.status === 'STILL_PENDING').length;
  }

  // Booking Actions
  approveBooking(booking: AdminBooking): void {
    booking.status = 'APPROVED';
    booking.processedBy = this.adminUser.email;
    booking.processedAt = new Date().toLocaleString('vi-VN');

    // Add Audit Log
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'APPROVE_BOOKING',
      target: `${booking.spaceName} (${booking.code})`,
      details: `${this.i18n.t('Đã phê duyệt yêu cầu đặt phòng cho')} ${booking.bookerName} (${booking.organization}).`,
      level: 'INFO'
    });

    this.showToast(`${this.i18n.t('Đã phê duyệt thành công yêu cầu')} ${booking.code}!`, 'success');
  }

  openRejectModal(booking: AdminBooking): void {
    this.rejectModal.booking = booking;
    this.rejectModal.reason = '';
    this.rejectModal.suggestedReason = '';
    this.rejectModal.isOpen = true;
  }

  closeRejectModal(): void {
    this.rejectModal.isOpen = false;
    this.rejectModal.booking = null;
  }

  applySuggestedReason(reason: string): void {
    this.rejectModal.reason = reason;
  }

  confirmRejectBooking(): void {
    if (!this.rejectModal.booking) return;
    const booking = this.rejectModal.booking;
    const reasonText = this.rejectModal.reason.trim() || this.i18n.t('Trùng lịch ưu tiên hoặc vi phạm chính sách sử dụng không gian UEL.');

    booking.status = 'REJECTED';
    booking.rejectionReason = reasonText;
    booking.processedBy = this.adminUser.email;
    booking.processedAt = new Date().toLocaleString('vi-VN');

    // Add Audit Log
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'REJECT_BOOKING',
      target: `${booking.spaceName} (${booking.code})`,
      details: `${this.i18n.t('Từ chối yêu cầu của')} ${booking.bookerName}. ${this.i18n.t('Lý do:')} ${reasonText}`,
      level: 'WARNING'
    });

    this.closeRejectModal();
    this.showToast(`${this.i18n.t('Đã từ chối yêu cầu')} ${booking.code}. ${this.i18n.t('Thông báo và lý do đã gửi tới người dùng.')}`, 'warning');
  }

  // Release Case Actions (F21-F23)
  handleReleaseAction(rc: AdminReleaseCase, action: 'USER_RETURNED' | 'SPACE_RELEASED' | 'ESCALATED'): void {
    rc.status = action;

    let logMsg = '';
    if (action === 'USER_RETURNED') {
      logMsg = `${this.i18n.t('Xác nhận người dùng')} ${rc.userName} ${this.i18n.t('đã trở lại vị trí tại')} ${rc.spaceName}.`;
      this.showToast(this.i18n.t('Đã ghi nhận người dùng đã có mặt!'), 'success');
    } else if (action === 'SPACE_RELEASED') {
      logMsg = `${this.i18n.t('Cưỡng chế giải phóng không gian')} ${rc.spaceName} ${this.i18n.t('sau vắng mặt')} ${rc.awayMinutes} ${this.i18n.t('phút')}.`;
      this.showToast(`${this.i18n.t('Đã giải phóng')} ${rc.spaceName} ${this.i18n.t('cho sinh viên khác đặt chỗ!')}`, 'warning');
    } else {
      logMsg = `${this.i18n.t('Chuyển tiếp báo cáo vi phạm giữ chỗ của')} ${rc.userEmail} ${this.i18n.t('sang Hội đồng Kỷ luật & QTTTS.')}`;
      this.showToast(this.i18n.t('Đã chuyển tiếp ca vi phạm sang cấp quản lý!'), 'info');
    }

    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: `RELEASE_CASE_${action}`,
      target: `${rc.spaceName}`,
      details: logMsg,
      level: action === 'SPACE_RELEASED' ? 'WARNING' : 'INFO'
    });
  }

  // Space Management Actions (F15-F18)
  toggleSpaceMaintenance(space: AdminSpace): void {
    if (space.status === 'MAINTENANCE') {
      space.status = 'AVAILABLE';
      this.showToast(`${this.i18n.t('Không gian')} ${space.name} ${this.i18n.t('đã mở lại hoạt động bình thường!')}`, 'success');
    } else {
      space.status = 'MAINTENANCE';
      this.showToast(`${this.i18n.t('Đã khóa không gian')} ${space.name} ${this.i18n.t('sang trạng thái BẢO TRÌ!')}`, 'warning');
    }

    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'TOGGLE_SPACE_STATUS',
      target: space.name,
      details: `${this.i18n.t('Chuyển trạng thái sang')} ${space.status}.`,
      level: 'INFO'
    });
  }

  // Detail Modal
  openDetailModal(booking: AdminBooking): void {
    this.detailModal.booking = booking;
    this.detailModal.isOpen = true;
  }

  closeDetailModal(): void {
    this.detailModal.isOpen = false;
    this.detailModal.booking = null;
  }

  showToast(message: string, type: 'success' | 'warning' | 'info' = 'success'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast.show = false;
    }, 3800);
  }

  // QR Station & Scanner Actions (F09/F38)
  openQuickScanModal(): void {
    this.activeTab = 'qr-checkin';
    this.resetScanResult();
    this.startCamera();
  }

  async startCamera(): Promise<void> {
    this.cameraError = '';
    if (!navigator?.mediaDevices?.getUserMedia) {
      this.cameraError = this.i18n.t('Trình duyệt không hỗ trợ WebRTC Camera API hoặc đang chạy không bảo mật (yêu cầu HTTPS/localhost).');
      this.cameraActive = false;
      return;
    }

    try {
      // 1. Dọn dẹp stream cũ nếu có (dừng trực tiếp không delay)
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => {
          try { track.stop(); } catch {}
        });
        this.videoStream = null;
      }

      // Kích hoạt ngay cameraActive để Angular render thẻ <video> ngay lập tức
      this.cameraActive = true;
      this.cdr.detectChanges();

      // 2. Yêu cầu quyền và lấy camera ngay lập tức với constraint lý tưởng
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: this.cameraFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (errConstraint) {
        console.warn('Lấy camera theo facingMode thất bại, fallback sang video cơ bản:', errConstraint);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      this.videoStream = stream;

      // 3. Gắn stream vào video element ngay lập tức
      const videoEl = document.getElementById('qr-scanner-video') as HTMLVideoElement;
      if (videoEl) {
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('webkit-playsinline', 'true');
        videoEl.muted = true;
        videoEl.srcObject = stream;
        try {
          await videoEl.play();
        } catch (ePlay) {
          console.warn('Video play retry needed:', ePlay);
          videoEl.muted = true;
          await videoEl.play().catch(err2 => console.error('Final play retry failed:', err2));
        }
        this.qrScanningRunning = true;
        this.runQrScanningLoop(videoEl);
      }

      const modeName = this.cameraFacingMode === 'environment' 
        ? this.i18n.t('Camera sau') 
        : this.i18n.t('Camera trước');
      this.showToast(`${this.i18n.t('Đã bật')} ${modeName}!`, 'info');
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      this.cameraActive = false;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.cameraError = this.i18n.t('Quyền truy cập Camera bị từ chối. Vui lòng cấp quyền Camera trong cài đặt trình duyệt để tiếp tục.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        this.cameraError = this.i18n.t('Không tìm thấy thiết bị Camera/Webcam trên thiết bị này.');
      } else {
        this.cameraError = this.i18n.t('Không thể kết nối Camera: ') + (err?.message || this.i18n.t('Chưa cấp quyền hoặc thiết bị bận. Vui lòng thử lại hoặc dùng ô nhập mã bên dưới.'));
      }
      this.cdr.detectChanges();
    }
  }

  stopCamera(): void {
    this.qrScanningRunning = false;
    const videoEl = document.getElementById('qr-scanner-video') as HTMLVideoElement;
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.srcObject = null;
      } catch {}
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.videoStream = null;
    }
    this.cameraActive = false;
    this.isSwitchingCamera = false;
    this.cdr.detectChanges();
  }

  async toggleCameraFacing(): Promise<void> {
    if (!this.cameraActive || this.isSwitchingCamera) return;
    if (!navigator?.mediaDevices?.getUserMedia) return;

    this.isSwitchingCamera = true;
    const nextFacingMode: 'user' | 'environment' = this.cameraFacingMode === 'environment' ? 'user' : 'environment';

    try {
      // 1. Lấy luồng camera mới TRƯỚC khi tắt luồng cũ để camera KHÔNG BỊ TẮT hay chớp tắt màn hình
      let newStream: MediaStream | null = null;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: nextFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch {
        // Fallback ideal facingMode nếu exact không được hỗ trợ trên thiết bị
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      }

      if (newStream) {
        const oldStream = this.videoStream;
        this.videoStream = newStream;
        this.cameraFacingMode = nextFacingMode;

        // 2. Chuyển đổi trực tiếp luồng hiển thị trên video element
        const videoEl = document.getElementById('qr-scanner-video') as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = newStream;
          videoEl.play().catch(e => console.warn('Lỗi play khi chuyển cam:', e));
        }

        // 3. Tắt các track của luồng cũ ở chế độ nền (mượt mà, không gián đoạn viewfinder)
        if (oldStream) {
          oldStream.getTracks().forEach(track => {
            try { track.stop(); } catch {}
          });
        }

        const modeName = this.cameraFacingMode === 'environment' 
          ? this.i18n.t('Camera sau') 
          : this.i18n.t('Camera trước');
        this.showToast(`${this.i18n.t('Đã chuyển sang')} ${modeName}!`, 'info');
      }
    } catch (err: any) {
      console.warn('Lỗi khi đổi camera:', err);
      this.showToast(this.i18n.t('Thiết bị chỉ có 1 camera hoặc không thể chuyển đổi.'), 'warning');
    } finally {
      this.isSwitchingCamera = false;
      this.cdr.detectChanges();
    }
  }

  private runQrScanningLoop(videoEl: HTMLVideoElement): void {
    if (!this.qrScanningRunning || !this.cameraActive) return;

    // Tạm dừng lấy frame mới khi Modal thành công đang mở
    if (this.scanSuccessModal.isOpen) {
      requestAnimationFrame(() => this.runQrScanningLoop(videoEl));
      return;
    }

    if (!this.isScanningFrame && videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      this.isScanningFrame = true;
      this.scanFrameWithJsQr(videoEl);
    }

    if (this.qrScanningRunning) {
      requestAnimationFrame(() => this.runQrScanningLoop(videoEl));
    }
  }

  private scanFrameWithJsQr(videoEl: HTMLVideoElement): void {
    try {
      if (!this.qrCanvas) {
        this.qrCanvas = document.createElement('canvas');
      }
      // Dùng 640px cho mobile để xử lý siêu mượt và chính xác cao
      const width = Math.min(videoEl.videoWidth, 640);
      const height = Math.round((videoEl.videoHeight / videoEl.videoWidth) * width);
      this.qrCanvas.width = width;
      this.qrCanvas.height = height;

      const ctx = this.qrCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });
        if (qrCode && qrCode.data) {
          this.handleDetectedQrCode(qrCode.data);
        }
      }
    } catch {
      // ignore context error
    } finally {
      this.isScanningFrame = false;
    }
  }

  private handleDetectedQrCode(rawCode: string): void {
    if (!rawCode || !rawCode.trim()) return;
    const cleanCode = rawCode.trim();
    const now = Date.now();

    // Prevent duplicate triggers within 3 seconds for same code
    if (cleanCode === this.lastScannedCode && (now - this.lastScannedTime) < 3000) {
      return;
    }

    this.lastScannedCode = cleanCode;
    this.lastScannedTime = now;

    // Physical vibration feedback on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([120, 60, 120]); } catch {}
    }

    this.playScanBeep();

    this.ngZone.run(() => {
      this.recentScanFeedback = {
        type: 'SUCCESS',
        title: this.i18n.t('Đã quét thấy mã QR!'),
        subtitle: `${cleanCode.length > 28 ? cleanCode.slice(0, 25) + '...' : cleanCode}`
      };
      setTimeout(() => {
        this.recentScanFeedback = null;
        this.cdr.detectChanges();
      }, 4000);

      this.processQrCode(cleanCode, 'CAMERA');
      this.cdr.detectChanges();
    });
  }

  private playScanBeep(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.16);
      }
    } catch {}
  }

  processQrCode(rawCode?: string, scanType: 'CAMERA' | 'USB_SCANNER' | 'MANUAL' | 'OVERRIDE' = 'MANUAL'): void {
    let code = (rawCode || this.scannerInputCode || '').trim();
    if (!code) {
      this.showToast(this.i18n.t('Vui lòng quét hoặc nhập mã đặt chỗ QR.'), 'warning');
      return;
    }

    // Extract booking ID/code if URL or JSON format
    if (code.startsWith('http://') || code.startsWith('https://')) {
      try {
        const url = new URL(code);
        code = url.searchParams.get('code') || url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop() || code;
      } catch {}
    } else if (code.startsWith('{') && code.endsWith('}')) {
      try {
        const parsed = JSON.parse(code);
        code = parsed.code || parsed.id || parsed.bookingId || code;
      } catch {}
    }

    this.scannerInputCode = '';

    const normalized = code.toUpperCase();
    let matched = this.bookings.find(b => 
      b.code.toUpperCase() === normalized || 
      b.id.toUpperCase() === normalized ||
      b.code.toUpperCase().includes(normalized) ||
      normalized.includes(b.code.toUpperCase())
    );

    // If no pre-existing match in mock list,
    // dynamically generate an active booking linked to student Nguyen Tran Kim Giang
    if (!matched) {
      const dynamicBooking: AdminBooking = {
        id: code,
        code: code.length > 25 ? (code.slice(0, 20) + '...') : code,
        spaceId: 'a-105',
        spaceName: 'Phòng A.105',
        building: 'Tòa A - Tầng 1',
        bookerName: 'Nguyễn Trần Kim Giang',
        bookerEmail: 'giangnntk24411@st.uel.edu.vn',
        organization: 'CLB ITB UEL (Chủ nhiệm)',
        purpose: 'Xác thực hiện diện phòng học qua mã QR',
        activityType: 'Học nhóm',
        date: new Date().toLocaleDateString('vi-VN'),
        timeSlot: '08:00 - 11:30',
        attendees: 5,
        status: 'PENDING'
      };
      this.bookings.unshift(dynamicBooking);
      matched = dynamicBooking;
    }

    if (matched.status === 'REJECTED') {
      this.scanResult = {
        status: 'ERROR',
        message: `${this.i18n.t('Đơn đặt chỗ')} ${matched.code} ${this.i18n.t('đã bị TỪ CHỐI trước đó!')}`,
        booking: matched,
        isOverrideAllowed: true,
        reason: matched.rejectionReason || this.i18n.t('Đơn bị từ chối do trùng lịch học hoặc vi phạm quy định cơ sở vật chất.')
      };
      this.showToast(this.i18n.t('Đơn đã bị từ chối trước đó!'), 'warning');
      this.cdr.detectChanges();
      return;
    }

    if (matched.status === 'CANCELLED') {
      this.scanResult = {
        status: 'ERROR',
        message: `${this.i18n.t('Đơn đặt chỗ')} ${matched.code} ${this.i18n.t('đã bị HỦY bởi người đặt!')}`,
        booking: matched,
        isOverrideAllowed: true,
        reason: this.i18n.t('Sinh viên đã chủ động hủy lịch trước giờ diễn ra.')
      };
      this.showToast(this.i18n.t('Đơn này đã bị hủy!'), 'warning');
      this.cdr.detectChanges();
      return;
    }

    // Check-in Success & Auto Approval -> Transition status directly to IN_USE
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN');

    matched.status = 'IN_USE';
    matched.actualCheckInAt = `${dateStr} ${timeStr}`;
    matched.processedBy = this.adminUser.email;
    matched.processedAt = `${dateStr} ${timeStr}`;

    // Update room in spaces array to IN_USE
    const targetSpace = this.spaces.find(s => 
      (matched && s.id === matched.spaceId) || 
      (matched && s.name.toLowerCase().includes(matched.spaceName.toLowerCase())) ||
      (matched && matched.spaceName.toLowerCase().includes(s.name.toLowerCase()))
    );
    if (targetSpace) {
      targetSpace.status = 'IN_USE';
      targetSpace.currentOccupants = Math.max(targetSpace.currentOccupants + (matched.attendees || 1), 1);
    }

    // Clear any pending no-show exception for this room/user
    this.releaseCases = this.releaseCases.filter(rc => rc.spaceName !== matched.spaceName && rc.userEmail !== matched.bookerEmail);

    // Append to Recent Check-ins
    this.recentCheckIns.unshift({
      timestamp: `${dateStr} ${timeStr}`,
      bookingCode: matched.code,
      spaceName: matched.spaceName,
      bookerName: matched.bookerName,
      timeSlot: matched.timeSlot,
      verifiedBy: this.adminUser.email,
      type: scanType
    });

    // Append to Audit Trail
    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      timestamp: `${dateStr} ${timeStr}`,
      actor: this.adminUser.email,
      action: 'QR_CHECKIN_VERIFIED',
      target: `${matched.code} (${matched.spaceName})`,
      details: `${this.i18n.t('Check-in xác thực có mặt thành công cho')} ${matched.bookerName} (${matched.bookerEmail}) ${this.i18n.t('qua')} ${scanType}. ${this.i18n.t('Kích hoạt trạng thái Đang sử dụng (IN_USE).')}`,
      level: 'INFO'
    });

    this.scanResult = {
      status: 'SUCCESS',
      message: `${this.i18n.t('Xác thực Check-in THÀNH CÔNG cho')} ${matched.bookerName}!`,
      booking: matched
    };

    // Open Instant Verification Modal
    this.scanSuccessModal = {
      isOpen: true,
      booking: matched
    };

    this.showToast(`${this.i18n.t('Check-in thành công:')} ${matched.bookerName} ${this.i18n.t('đã vào')} ${matched.spaceName}!`, 'success');
    this.cdr.detectChanges();

    // Directly update status to MongoDB Atlas via Backend API
    try {
      fetch(`${SERVER_BASE_URL}/api/bookings/qr-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          actor: this.adminUser.email
        })
      })
        .then(res => res.json())
        .then(apiRes => {
          if (apiRes && apiRes.success && apiRes.booking) {
            console.log('[Admin Station] Đã đồng bộ trạng thái IN_USE lên DB Atlas thành công:', apiRes.booking);
            if (apiRes.booking.bookerName) matched.bookerName = apiRes.booking.bookerName;
            if (apiRes.booking.bookerEmail) matched.bookerEmail = apiRes.booking.bookerEmail;
            if (apiRes.booking.spaceName) matched.spaceName = apiRes.booking.spaceName;
            matched.status = 'IN_USE';
            this.cdr.detectChanges();
          }
        })
        .catch(fetchErr => {
          console.warn('[Admin Station] Ghi nhận check-in local, API backend offline:', fetchErr);
        });
    } catch (e) {
      console.warn('[Admin Station] Call API checkin error:', e);
    }
  }

  adminOverrideCheckIn(): void {
    if (!this.scanResult.booking) return;
    const b = this.scanResult.booking;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('vi-VN');

    b.status = 'IN_USE';
    b.actualCheckInAt = `${dateStr} ${timeStr} (${this.i18n.t('Ghi đè bởi')} ${this.adminUser.name})`;

    this.recentCheckIns.unshift({
      timestamp: `${dateStr} ${timeStr}`,
      bookingCode: b.code,
      spaceName: b.spaceName,
      bookerName: b.bookerName,
      timeSlot: b.timeSlot,
      verifiedBy: `${this.adminUser.email} (Override)`,
      type: 'OVERRIDE',
      notes: this.i18n.t('Quản trị viên đã ghi đè quyền và cấp phép check-in đặc cách.')
    });

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      timestamp: `${dateStr} ${timeStr}`,
      actor: this.adminUser.email,
      action: 'ADMIN_OVERRIDE_CHECKIN',
      target: `${b.code} (${b.spaceName})`,
      details: `${this.i18n.t('Admin ghi đè quyền check-in đặc cách cho đơn')} ${b.code} (${b.bookerName}).`,
      level: 'WARNING'
    });

    this.scanResult = {
      status: 'SUCCESS',
      message: `${this.i18n.t('ĐÃ GHI ĐÈ & DUYỆT ĐẶC CÁCH VÀO PHÒNG cho')} ${b.bookerName}!`,
      booking: b
    };

    this.showToast(`${this.i18n.t('Admin Override thành công cho')} ${b.bookerName}!`, 'success');

    // Sync override status to MongoDB Atlas
    try {
      fetch(`${SERVER_BASE_URL}/api/bookings/qr-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: b.code,
          actor: `${this.adminUser.email} (Override)`
        })
      }).catch(() => {});
    } catch {}
  }

  resetScanResult(): void {
    this.scanResult = {
      status: 'IDLE',
      message: '',
      booking: null
    };
  }

  // ===== OCCUPANCY DETECTION (Computer Vision & FlexSpace AI Core) =====

  selectSpaceForDetection(space: AdminSpace): void {
    this.occSelectedSpace = space;
    this.occCurrentCount = 0;
    this.occConfidence = 0;
    this.occPeakCount = 0;
    this.occAvgCount = 0;
    this.occHistory = [];
    this.occSurchargeApplied = false;
    this.occEarlyCheckoutDone = false;
    this.occOvercapacityHandled = false;
    this.occEmptyRoomSeconds = 0;
    this.occIsEarlyCheckoutSuggested = false;
    this.occIsOvertime = false;
    this.occIsOverCapacity = false;
    this.occSimulateOvertimeActive = false;

    // Tự động liên kết đơn đặt chỗ thực tế của không gian này
    const matched = this.bookings.find(b => 
      (b.spaceId === space.id || b.spaceName.toLowerCase().includes(space.name.toLowerCase())) &&
      (b.status === 'IN_USE' || b.status === 'APPROVED')
    );

    if (matched) {
      this.occActiveBooking = matched;
    } else {
      // Đơn đặt chỗ mẫu liên kết không gian để giám sát
      const anyBooking = this.bookings.find(b => b.spaceId === space.id);
      this.occActiveBooking = anyBooking || {
        id: 'FLX-' + space.id,
        code: 'FLX-BK-2026',
        spaceId: space.id,
        spaceName: space.name,
        building: space.building,
        bookerName: 'Nguyễn Trần Kim Giang',
        bookerEmail: 'giangnntk24411@st.uel.edu.vn',
        organization: 'CLB ITB UEL (Chủ nhiệm)',
        purpose: 'Đặt chỗ làm việc & học tập linh hoạt',
        activityType: 'Học nhóm',
        date: new Date().toLocaleDateString('vi-VN'),
        timeSlot: '08:00 - 11:30',
        attendees: Math.min(space.capacity, 4),
        status: 'IN_USE'
      };
    }

    if (this.occDetectionRunning) {
      this.evaluateFlexSpaceAiRules();
    }
  }

  async loadOccupancyModel(): Promise<void> {
    if (this.occModelLoaded && this.occCocoModel) return;
    this.occModelLoading = true;
    this.occModelError = '';
    try {
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      await import('@tensorflow/tfjs');
      this.occCocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      this.occModelLoaded = true;
      this.occModelLoading = false;
      console.log('FlexSpace AI COCO-SSD Model preloaded successfully!');
    } catch (err: any) {
      this.occModelLoading = false;
      this.occModelError = this.i18n.t('Không thể tải model AI. Vui lòng kiểm tra kết nối mạng và thử lại. Chi tiết: ') + (err?.message || err);
      console.error('COCO-SSD model load error:', err);
    }
  }

  async startOccupancyDetection(): Promise<void> {
    if (!this.occSelectedSpace && this.spaces.length > 0) {
      this.selectSpaceForDetection(this.spaces[0]);
    }

    if (!this.occSelectedSpace) {
      this.showToast(this.i18n.t('Vui lòng chọn không gian cần giám sát trước!'), 'warning');
      return;
    }

    // Đảm bảo model đã tải
    if (!this.occCocoModel) {
      await this.loadOccupancyModel();
    }
    if (!this.occCocoModel) return;

    try {
      this.stopOccupancyDetection();
      const constraints: MediaStreamConstraints = { 
        video: { 
          facingMode: { ideal: this.occFacingMode },
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        },
        audio: false
      };
      this.occVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.occCameraActive = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        const videoEl = document.getElementById('occ-detection-video') as HTMLVideoElement;
        if (videoEl && this.occVideoStream) {
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('webkit-playsinline', 'true');
          videoEl.muted = true;
          videoEl.srcObject = this.occVideoStream;
          videoEl.play().then(() => {
            this.occDetectionRunning = true;
            this.occFrameCount = 0;
            this.occLastFrameTime = performance.now();
            this.occFpsInterval = setInterval(() => {
              const now = performance.now();
              const elapsed = (now - this.occLastFrameTime) / 1000;
              this.occDetectionFps = elapsed > 0 ? Math.round(this.occFrameCount / elapsed) : 0;
              this.occFrameCount = 0;
              this.occLastFrameTime = now;
            }, 2000);
            this.runDetectionLoop(videoEl);
          }).catch(e => console.warn('Video play error on occ camera:', e));
        }
      }, 150);
    } catch (err: any) {
      this.occCameraActive = false;
      this.occModelError = this.i18n.t('Không thể truy cập Camera: ') + (err?.message || this.i18n.t('Chưa cấp quyền hoặc thiết bị không có webcam.'));
      this.cdr.detectChanges();
    }
  }

  async toggleOccCameraFacing(): Promise<void> {
    if (!this.occCameraActive || this.occIsSwitchingFacing) return;
    this.occIsSwitchingFacing = true;
    const nextFacing = this.occFacingMode === 'environment' ? 'user' : 'environment';

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      const oldStream = this.occVideoStream;
      this.occVideoStream = newStream;
      this.occFacingMode = nextFacing;

      const videoEl = document.getElementById('occ-detection-video') as HTMLVideoElement;
      if (videoEl) {
        videoEl.srcObject = newStream;
        await videoEl.play().catch(e => console.warn('Play error:', e));
      }

      if (oldStream) {
        oldStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
      }
      this.showToast(`${this.i18n.t('Camera IoT đã chuyển sang')} ${nextFacing === 'environment' ? this.i18n.t('Cam sau') : this.i18n.t('Cam trước')}!`, 'info');
    } catch (e) {
      console.warn('Lỗi đổi cam IoT:', e);
      this.showToast(this.i18n.t('Không thể đổi camera hoặc thiết bị chỉ có 1 camera.'), 'warning');
    } finally {
      this.occIsSwitchingFacing = false;
      this.cdr.detectChanges();
    }
  }

  private runDetectionLoop(videoEl: HTMLVideoElement): void {
    if (!this.occDetectionRunning || !this.occCocoModel) return;

    const canvas = document.getElementById('occ-detection-canvas') as HTMLCanvasElement;
    if (!canvas || !videoEl.videoWidth) {
      requestAnimationFrame(() => this.runDetectionLoop(videoEl));
      return;
    }

    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d')!;

    this.occCocoModel.detect(videoEl).then((predictions: any[]) => {
      if (!this.occDetectionRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const people = predictions.filter((p: any) => p.class === 'person' && p.score > 0.45);

      people.forEach((person: any, idx: number) => {
        const [x, y, w, h] = person.bbox;
        const score = Math.round(person.score * 100);

        // Bounding box
        ctx.strokeStyle = '#FF7900';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);

        // Corner brackets
        const cornerLen = Math.min(w, h) * 0.2;
        ctx.strokeStyle = '#FFC72C';
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke();

        // Label background
        const label = `#${idx + 1} • ${score}%`;
        ctx.font = 'bold 12px Roboto, system-ui';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0, 59, 113, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x, y - 22, textWidth + 12, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, x + 6, y - 7);
      });

      this.ngZone.run(() => {
        this.occCurrentCount = people.length;
        this.occConfidence = people.length > 0
          ? Math.round(people.reduce((sum: number, p: any) => sum + p.score, 0) / people.length * 100)
          : 0;

        if (people.length > this.occPeakCount) {
          this.occPeakCount = people.length;
        }

        // Đánh giá các quy tắc nghiệp vụ FlexSpace AI
        this.evaluateFlexSpaceAiRules();

        // Track history every ~5 seconds
        if (this.occHistory.length === 0 ||
            (Date.now() - new Date(this.occHistory[0]?.timestamp || 0).getTime()) > 5000) {
          const now = new Date();
          this.occHistory.unshift({
            timestamp: now.toLocaleTimeString('vi-VN'),
            spaceName: this.occSelectedSpace?.name || '',
            detectedCount: people.length,
            capacity: this.occSelectedSpace?.capacity || 0,
            occupancyRate: this.occSelectedSpace ? Math.round((people.length / this.occSelectedSpace.capacity) * 100) : 0,
            confidence: this.occConfidence
          });
          if (this.occHistory.length > 50) this.occHistory.pop();

          // Update average
          const total = this.occHistory.reduce((s, h) => s + h.detectedCount, 0);
          this.occAvgCount = Math.round(total / this.occHistory.length);
        }
      });

      this.occFrameCount++;
      requestAnimationFrame(() => this.runDetectionLoop(videoEl));
    }).catch((err: any) => {
      console.warn('Detection frame error:', err);
      if (this.occDetectionRunning) {
        requestAnimationFrame(() => this.runDetectionLoop(videoEl));
      }
    });
  }

  evaluateFlexSpaceAiRules(): void {
    if (!this.occActiveBooking) return;

    // 1. Kiểm tra Overcapacity (Vượt số lượng đăng ký thỏa thuận)
    if (this.occActiveBooking.attendees > 0) {
      if (this.occCurrentCount > this.occActiveBooking.attendees) {
        this.occIsOverCapacity = true;
        this.occOverCapacityCount = this.occCurrentCount - this.occActiveBooking.attendees;
      } else {
        this.occIsOverCapacity = false;
        this.occOverCapacityCount = 0;
      }
    }

    // 2. Kiểm tra Overtime (Sử dụng quá giờ)
    if (!this.occEarlyCheckoutDone) {
      const isOvertime = this.occSimulateOvertimeActive || this.checkBookingOvertime(this.occActiveBooking);
      if (isOvertime && this.occCurrentCount > 0) {
        this.occIsOvertime = true;
        this.occOvertimeMinutes = this.calculateOvertimeMinutes(this.occActiveBooking);
        // Gợi ý phụ phí theo block 30 phút (+50.000 VNĐ / block 30p)
        const blocks = Math.max(1, Math.ceil(this.occOvertimeMinutes / 30));
        this.occSuggestedSurcharge = blocks * 50000;
      } else {
        this.occIsOvertime = false;
      }
    }

    // 3. Kiểm tra Early Checkout (Rời phòng sớm)
    if (this.occActiveBooking.status === 'IN_USE' && !this.occEarlyCheckoutDone && !this.occIsOvertime) {
      if (this.occCurrentCount === 0) {
        this.occEmptyRoomSeconds += 1;
        // Kích hoạt gợi ý khi phát hiện phòng trống
        if (this.occEmptyRoomSeconds >= 3) {
          this.occIsEarlyCheckoutSuggested = true;
        }
      } else {
        this.occEmptyRoomSeconds = 0;
        this.occIsEarlyCheckoutSuggested = false;
      }
    } else {
      this.occEmptyRoomSeconds = 0;
      this.occIsEarlyCheckoutSuggested = false;
    }
  }

  private checkBookingOvertime(booking: AdminBooking): boolean {
    try {
      const parts = booking.timeSlot.split('-');
      if (parts.length < 2) return false;
      const endParts = parts[1].trim().split(':');
      if (endParts.length < 2) return false;
      const endHour = parseInt(endParts[0], 10);
      const endMinute = parseInt(endParts[1], 10);

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      return (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute));
    } catch {
      return false;
    }
  }

  private calculateOvertimeMinutes(booking: AdminBooking): number {
    if (this.occSimulateOvertimeActive) return 25;
    try {
      const parts = booking.timeSlot.split('-');
      if (parts.length < 2) return 15;
      const endParts = parts[1].trim().split(':');
      const endHour = parseInt(endParts[0], 10);
      const endMinute = parseInt(endParts[1], 10);

      const now = new Date();
      const diff = (now.getHours() * 60 + now.getMinutes()) - (endHour * 60 + endMinute);
      return Math.max(15, diff);
    } catch {
      return 15;
    }
  }

  toggleSimulateOvertime(): void {
    this.occSimulateOvertimeActive = !this.occSimulateOvertimeActive;
    this.evaluateFlexSpaceAiRules();
    this.showToast(this.occSimulateOvertimeActive ? 'Đã bật mô phỏng tình huống Quá giờ (+25 phút)' : 'Đã tắt mô phỏng Quá giờ', 'info');
  }

  applyOvertimeSurcharge(): void {
    if (!this.occActiveBooking) return;
    this.occSurchargeApplied = true;
    const amountStr = this.occSuggestedSurcharge.toLocaleString('vi-VN');
    this.showToast(`${this.i18n.t('Đã áp dụng phụ phí quá giờ')} ${amountStr} VNĐ (${this.occOvertimeMinutes} phút) ${this.i18n.t('vào hóa đơn của')} ${this.occActiveBooking.bookerName}!`, 'success');

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'OVERTIME_SURCHARGE_APPLIED',
      target: `${this.occActiveBooking.code} - ${this.occSelectedSpace?.name}`,
      details: `FlexSpace AI phát hiện khách sử dụng quá giờ ${this.occOvertimeMinutes} phút (sĩ số thực tế: ${this.occCurrentCount} người). Chủ không gian áp dụng phụ phí ${amountStr} VNĐ theo block 30 phút.`,
      level: 'WARNING'
    });
    this.cdr.detectChanges();
  }

  confirmEarlyCheckout(): void {
    if (!this.occActiveBooking || !this.occSelectedSpace) return;
    this.occEarlyCheckoutDone = true;
    this.occIsEarlyCheckoutSuggested = false;

    // 1. Cập nhật trạng thái booking sang COMPLETED
    this.occActiveBooking.status = 'COMPLETED';

    // 2. Giải phóng không gian ngay lập tức để người khác đặt
    this.occSelectedSpace.status = 'AVAILABLE';
    this.occSelectedSpace.currentOccupants = 0;

    this.showToast(`${this.i18n.t('Đã xác nhận trả phòng sớm!')} ${this.occSelectedSpace.name} ${this.i18n.t('đã được giải phóng và sẵn sàng cho khách khác đặt ngay.')}`, 'success');

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'EARLY_CHECKOUT_SLOT_RELEASED',
      target: `${this.occActiveBooking.code} - ${this.occSelectedSpace.name}`,
      details: `FlexSpace AI nhận diện phòng trống trước thời gian kết thúc đặt chỗ. Chủ không gian xác nhận trả phòng sớm, giải phóng khung giờ còn dư đưa trở lại sàn Marketplace.`,
      level: 'INFO'
    });
    this.cdr.detectChanges();
  }

  handleOvercapacityWarning(): void {
    if (!this.occActiveBooking) return;
    this.occOvercapacityHandled = true;
    const extraFee = this.occOverCapacityCount * 30000;
    this.showToast(`${this.i18n.t('Đã ghi nhận phụ thu')} +${this.occOverCapacityCount} người (${extraFee.toLocaleString('vi-VN')} VNĐ) cho đơn ${this.occActiveBooking.code}!`, 'warning');

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'OVERCAPACITY_DETECTED',
      target: `${this.occActiveBooking.code} - ${this.occSelectedSpace?.name}`,
      details: `FlexSpace AI phát hiện ${this.occCurrentCount} người (vượt ${this.occOverCapacityCount} người so với đăng ký ${this.occActiveBooking.attendees} người). Đã ghi nhận phụ phí và cảnh báo sử dụng vượt quá thỏa thuận.`,
      level: 'WARNING'
    });
    this.cdr.detectChanges();
  }

  stopOccupancyDetection(): void {
    this.occDetectionRunning = false;
    if (this.occVideoStream) {
      this.occVideoStream.getTracks().forEach(track => track.stop());
      this.occVideoStream = null;
    }
    this.occCameraActive = false;
    this.occIsSwitchingFacing = false;
    if (this.occFpsInterval) {
      clearInterval(this.occFpsInterval);
      this.occFpsInterval = null;
    }
    this.cdr.detectChanges();
  }

  getOccupancyLevel(): { label: string; color: string; bgColor: string } {
    if (!this.occSelectedSpace || this.occCurrentCount === 0) {
      return { label: 'Trống', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' };
    }
    const rate = this.occCurrentCount / this.occSelectedSpace.capacity;
    if (rate < 0.5) return { label: 'Thấp', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' };
    if (rate < 0.8) return { label: 'Trung bình', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' };
    if (rate <= 1) return { label: 'Cao', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' };
    return { label: 'Quá tải', color: 'text-rose-600', bgColor: 'bg-rose-50 border-rose-200' };
  }

  saveOccupancySnapshot(): void {
    if (!this.occSelectedSpace) return;
    const now = new Date();
    const snapshot: OccupancySnapshot = {
      timestamp: now.toLocaleString('vi-VN'),
      spaceName: this.occSelectedSpace.name,
      detectedCount: this.occCurrentCount,
      capacity: this.occSelectedSpace.capacity,
      occupancyRate: Math.round((this.occCurrentCount / this.occSelectedSpace.capacity) * 100),
      confidence: this.occConfidence
    };
    this.occHistory.unshift(snapshot);

    this.occSelectedSpace.currentOccupants = this.occCurrentCount;

    this.auditLogs.unshift({
      id: 'aud-' + Date.now(),
      timestamp: now.toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'OCCUPANCY_SNAPSHOT',
      target: this.occSelectedSpace.name,
      details: `${this.i18n.t('Ghi nhận')} ${this.occCurrentCount}/${this.occSelectedSpace.capacity} ${this.i18n.t('người')} (${snapshot.occupancyRate}% ${this.i18n.t('công suất')}) ${this.i18n.t('qua AI Computer Vision. Confidence:')} ${this.occConfidence}%.`,
      level: this.occCurrentCount > this.occSelectedSpace.capacity ? 'WARNING' : 'INFO'
    });

    this.showToast(`${this.i18n.t('Đã lưu snapshot:')} ${this.occCurrentCount} ${this.i18n.t('người tại')} ${this.occSelectedSpace.name}`, 'success');
  }
}
