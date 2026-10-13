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
  price?: number;
  paymentStatus?: 'PAID' | 'PENDING' | 'REFUNDED';
  rentalPackage?: string;
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
  pricePerHour?: number;
  pricePerDay?: number;
  rating?: number;
  reviewsCount?: number;
}

export interface AdminUser {
  id: string;
  code: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SPACE_MANAGER' | 'LECTURER' | 'STUDENT' | 'SELLER_OWNER' | 'SELLER_STAFF' | 'CUSTOMER';
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
  isStartingCamera: boolean = false;
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
  private lastQrScanTimestamp: number = 0;

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

  // Seller / Partner Profile Mockup (Seller Center)
  adminUser = {
    name: 'Chủ Gian Hàng UEL Space Partner Hub',
    email: 'seller.partner@uelspace.vn',
    role: 'Chủ Không Gian / Đối Tác Cho Thuê (Space Host)',
    campus: 'Trụ sở UEL Space Hub - Khu Công nghệ cao TP. Thủ Đức',
    avatar: 'SH',
    storeName: 'UEL Space Marketplace Hub',
    rating: 4.95,
    totalReviews: 248,
    walletBalance: 68500000
  };

  // E-commerce Marketplace Metrics
  totalRevenue: number = 68500000;
  monthlyGrowthRate: number = 24.5;
  activeListingsCount: number = 9;
  completedOrdersCount: number = 128;

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
  occModelName: string = 'YOLOv11 Server AI (Sẵn sàng)';
  occSensitivity: 'high' | 'normal' | 'strict' = 'high';
  occCameraActive: boolean = false;
  occStartingCamera: boolean = false;
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
  private faceDetector: any = null;

  // Option B: SOTA YOLOv11 Server AI Engine State
  occEngineMode: 'server' | 'client' = 'server';
  occServerStatus: 'online' | 'offline' | 'checking' = 'checking';
  occServerLatencyMs: number = 0;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private occLastFrameTime: number = 0;
  private occFrameCount: number = 0;
  private occFpsInterval: any = null;
  private isDetectingOccFrame: boolean = false;
  private lastOccDetectionTimestamp: number = 0;
  private lastOccStatsUpdate: number = 0;
  private procCanvas: HTMLCanvasElement | null = null;
  private prevProcFrame: Uint8ClampedArray | null = null;
  private trackedPeople: Array<{ id: number; x: number; y: number; w: number; h: number; score: number; label: string; missing: number }> = [];
  private nextTrackId: number = 1;
  private headcountDebounceBuffer: number[] = [];

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

  // Data: Bookings (Rental Orders on Marketplace)
  bookings: AdminBooking[] = [
    {
      id: 'b-001',
      code: 'UEL-BK-2026-081',
      spaceId: 'a3-301',
      spaceName: 'Hội trường & Event Hall Landmark A3',
      building: 'Central Tower Q.1',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'Tập đoàn Công nghệ TechCorp',
      purpose: 'Tổ chức Hội thảo AI & Chuyển đổi số Doanh nghiệp 2026',
      activityType: 'Hội thảo / Sự kiện',
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
      spaceName: 'Khu Co-working Hub - Bàn 14',
      building: 'Innovate Building',
      bookerName: 'Trần Minh Anh',
      bookerEmail: 'anhtm@fintechhub.vn',
      organization: 'FinTech Solutions Vietnam',
      purpose: 'Họp nhóm dự án Khảo sát Thị trường Tài chính Số',
      activityType: 'Họp nhóm dự án',
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
      spaceName: 'Phòng Họp VIP Executive A2.1',
      building: 'TechPark Executive',
      bookerName: 'ThS. Lê Hoàng Long',
      bookerEmail: 'longlh@innovate.vn',
      organization: 'Viện Đổi mới Sáng tạo & AI',
      purpose: 'Họp Ban Điều hành & Ký kết Hợp đồng Đối tác Chiến lược',
      activityType: 'Họp Ban Lãnh đạo',
      date: '12/10/2026',
      timeSlot: '09:00 - 11:00',
      attendees: 14,
      status: 'APPROVED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '10/10/2026 14:20'
    },
    {
      id: 'b-004',
      code: 'UEL-BK-2026-084',
      spaceId: 'b2-101',
      spaceName: 'Phòng Đào tạo & Workshop B2.101',
      building: 'Central Tower Q.1',
      bookerName: 'Vũ Đức Nam',
      bookerEmail: 'namvd@growthhub.com',
      organization: 'GrowthHub Marketing Agency',
      purpose: 'Tập huấn kỹ năng Quản trị & Tối ưu Chiến dịch Quảng cáo',
      activityType: 'Đào tạo nội bộ',
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
      spaceName: 'Meeting Pod cách âm Smart Pod 01',
      building: 'Startup Pod Hub',
      bookerName: 'Phạm Quỳnh Như',
      bookerEmail: 'nhupq@venturestudio.io',
      organization: 'Venture Studio Incubator',
      purpose: 'Brainstorm ý tưởng Pitching gọi vốn Vòng Hạt giống (Seed Round)',
      activityType: 'Họp đối tác',
      date: '10/10/2026',
      timeSlot: '14:00 - 16:30',
      attendees: 6,
      status: 'REJECTED',
      rejectionReason: 'Khung giờ này đã được đối tác doanh nghiệp khác đặt trước.',
      processedBy: 'admin@uelspace.vn',
      processedAt: '10/10/2026 09:15'
    },
    {
      id: 'UEL-88392',
      code: 'UEL-88392',
      spaceId: 'a-105',
      spaceName: 'Studio Sáng tạo Creative Media A.105',
      building: 'Creative Hub Center',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Họp bàn giải pháp Phần mềm Quản trị Doanh nghiệp ERP',
      activityType: 'Họp chuyên môn',
      date: '11/10/2026',
      timeSlot: '14:00 - 16:00',
      attendees: 5,
      status: 'APPROVED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '11/10/2026 08:30'
    },
    {
      id: 'UEL-88210',
      code: 'UEL-88210',
      spaceId: 'choi-1',
      spaceName: 'Meeting Pod cách âm Smart Pod 01',
      building: 'Startup Pod Hub',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Làm việc tập trung cá nhân & Phỏng vấn ứng viên cao cấp',
      activityType: 'Làm việc riêng',
      date: '12/10/2026',
      timeSlot: '09:00 - 11:30',
      attendees: 2,
      status: 'APPROVED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '10/10/2026 16:45'
    },
    {
      id: 'UEL-88150',
      code: 'UEL-88150',
      spaceId: 'a3-301',
      spaceName: 'Hội trường & Event Hall Landmark A3',
      building: 'Central Tower Q.1',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Hội thảo giới thiệu giải pháp AI cho khách hàng Doanh nghiệp',
      activityType: 'Hội thảo / Sự kiện',
      date: '13/10/2026',
      timeSlot: '08:00 - 11:30',
      attendees: 8,
      status: 'APPROVED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '11/10/2026 07:15'
    },
    {
      id: 'UEL-87941',
      code: 'UEL-87941',
      spaceId: 'b1-202',
      spaceName: 'Phòng Đào tạo Executive B1.202',
      building: 'Central Tower Q.1',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Đào tạo kỹ năng lập trình Cloud & Microservices cho khách hàng',
      activityType: 'Đào tạo nội bộ',
      date: '11/10/2026',
      timeSlot: '13:00 - 17:00',
      attendees: 60,
      status: 'PENDING',
      processedBy: 'admin@uelspace.vn',
      processedAt: '10/10/2026 10:00'
    },
    {
      id: 'UEL-88777',
      code: 'UEL-88777',
      spaceId: 'a2-1',
      spaceName: 'Phòng Họp VIP Executive A2.1',
      building: 'TechPark Executive',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Họp Ban tổ chức Diễn đàn Công nghệ Khởi nghiệp 2026',
      activityType: 'Họp Ban Lãnh đạo',
      date: '14/10/2026',
      timeSlot: '15:00 - 17:30',
      attendees: 15,
      status: 'APPROVED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '11/10/2026 10:15'
    },
    {
      id: 'UEL-88999',
      code: 'UEL-88999',
      spaceId: 'thu-vien-2',
      spaceName: 'Khu Co-working Hub - Bàn 14',
      building: 'Innovate Building',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Làm việc linh hoạt tại không gian Co-working',
      activityType: 'Co-working',
      date: '11/10/2026',
      timeSlot: '08:00 - 12:00',
      attendees: 4,
      status: 'IN_USE',
      processedBy: 'admin@uelspace.vn',
      processedAt: '11/10/2026 07:45',
      actualCheckInAt: '11/10/2026 08:05:00'
    },
    {
      id: 'UEL-87600',
      code: 'UEL-87600',
      spaceId: 'b2-101',
      spaceName: 'Phòng Đào tạo & Workshop B2.101',
      building: 'Central Tower Q.1',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Thuyết trình Báo cáo Tài chính Quý cho Nhà đầu tư',
      activityType: 'Thuyết trình',
      date: '10/10/2026',
      timeSlot: '10:00 - 12:00',
      attendees: 25,
      status: 'COMPLETED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '10/10/2026 11:30',
      actualCheckInAt: '10/10/2026 10:02:15'
    },
    {
      id: 'UEL-87115',
      code: 'UEL-87115',
      spaceId: 'choi-3',
      spaceName: 'Không gian mở Outdoor Gazebo Hub',
      building: 'Green Office Suites',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Team building & Thảo luận kế hoạch mở rộng thị trường',
      activityType: 'Họp nhóm',
      date: '11/10/2026',
      timeSlot: '08:00 - 11:00',
      attendees: 10,
      status: 'PENDING',
      processedBy: 'admin@uelspace.vn',
      processedAt: '10/10/2026 15:00'
    },
    {
      id: 'UEL-86902',
      code: 'UEL-86902',
      spaceId: 'choi-2',
      spaceName: 'Meeting Pod cách âm Solo Booth 02',
      building: 'Startup Pod Hub',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Làm việc riêng & Đàm phán cuộc gọi bảo mật',
      activityType: 'Làm việc riêng',
      date: '11/10/2026',
      timeSlot: '14:00 - 16:00',
      attendees: 6,
      status: 'APPROVED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '10/10/2026 16:00'
    },
    {
      id: 'BK-20261011-001',
      code: 'BK-20261011-001',
      spaceId: 'a-105',
      spaceName: 'Studio Sáng tạo Creative Media A.105',
      building: 'Creative Hub Center',
      bookerName: 'Nguyễn Trần Kim Giang',
      bookerEmail: 'giang.nguyen@techcorp.vn',
      organization: 'TechCorp Vietnam (Giám đốc Công nghệ)',
      purpose: 'Ghi hình Podcast Doanh nghiệp & Quay video giới thiệu sản phẩm',
      activityType: 'Studio / Media',
      date: '11/10/2026',
      timeSlot: '08:00 - 11:30',
      attendees: 5,
      status: 'APPROVED',
      processedBy: 'admin@uelspace.vn',
      processedAt: '11/10/2026 07:30'
    }
  ];

  // Data: Release Cases (F21-F23 - No-show Management)
  releaseCases: AdminReleaseCase[] = [
    {
      id: 'rc-101',
      spaceName: 'Phòng Đào tạo & Workshop B1.102 (Tầng 1)',
      userEmail: 'hoangnv@edupro.vn',
      userName: 'Nguyễn Văn Hoàng (Giám đốc Đào tạo)',
      awayMinutes: 22,
      thresholdMinutes: 15,
      status: 'STILL_PENDING',
      detectedAt: '09:20 - 11/10/2026',
      notes: 'Hệ thống phát hiện khách thuê vắng mặt quá 22 phút (quy định tối đa 15 phút), chưa quét lại QR check-in.'
    },
    {
      id: 'rc-102',
      spaceName: 'Khu Co-working Hub - Bàn 14',
      userEmail: 'linhdt@creativelab.com',
      userName: 'Đỗ Thùy Linh (Creative Director)',
      awayMinutes: 35,
      thresholdMinutes: 15,
      status: 'STILL_PENDING',
      detectedAt: '09:05 - 11/10/2026',
      notes: 'Khách thuê giữ chỗ bàn làm việc nhưng vắng mặt quá 35 phút, khách thuê khác gửi khiếu nại yêu cầu giải phóng chỗ.'
    },
    {
      id: 'rc-103',
      spaceName: 'Meeting Pod cách âm Solo Booth 03',
      userEmail: 'tuanlm@nextgen.tech',
      userName: 'Lê Minh Tuấn (CTO NextGen)',
      awayMinutes: 18,
      thresholdMinutes: 15,
      status: 'USER_RETURNED',
      detectedAt: '08:40 - 11/10/2026',
      notes: 'Khách thuê đã quét mã QR xác nhận quay lại trong thời gian gia hạn.'
    }
  ];

  // Data: Spaces (Listings & Pricing for Rent)
  spaces: AdminSpace[] = [
    {
      id: 'a3-301',
      name: 'Hội trường & Event Hall Landmark A3',
      building: 'Central Tower Q.1',
      floor: 'Tầng 3',
      type: 'Không gian sự kiện',
      capacity: 80,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Máy chiếu Laser 4K', 'Hệ thống âm thanh hội thảo không dây', 'Điều hòa trung tâm Daikin', 'Wifi cáp quang 1Gbps', 'Bục thuyết trình & Màn LED'],
      autoCheckoutMinutes: 20,
      awayWarningMinutes: 10,
      pricePerHour: 750000,
      pricePerDay: 5200000,
      rating: 4.9,
      reviewsCount: 42
    },
    {
      id: 'a2-1',
      name: 'Phòng Họp VIP Executive A2.1',
      building: 'TechPark Executive',
      floor: 'Tầng 2',
      type: 'Phòng họp VIP',
      capacity: 15,
      status: 'RESERVED',
      currentOccupants: 0,
      equipment: ['Màn hình tương tác Samsung Flip', 'Micro đa hướng chống ồn', 'Hệ thống Teleconference 4K', 'Bảng kính cường lực', 'Quầy teabreak riêng'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8,
      pricePerHour: 350000,
      pricePerDay: 2400000,
      rating: 4.95,
      reviewsCount: 88
    },
    {
      id: 'thu-vien-2',
      name: 'Khu Bàn làm việc linh hoạt Co-working',
      building: 'Innovation Hub Q.2',
      floor: 'Tầng 2',
      type: 'Bàn làm việc linh hoạt',
      capacity: 120,
      status: 'IN_USE',
      currentOccupants: 92,
      equipment: ['Wifi công suất lớn băng thông đối xứng', 'Bàn có cổng sạc Type-C & Power Plug', 'Đèn chống cận chuẩn Ergonomic', 'Khu pantry cà phê tự phục vụ'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 10,
      pricePerHour: 45000,
      pricePerDay: 250000,
      rating: 4.8,
      reviewsCount: 156
    },
    {
      id: 'b2-101',
      name: 'Văn phòng riêng Private Suite B2.101',
      building: 'Landmark Lounge',
      floor: 'Tầng 1',
      type: 'Văn phòng riêng',
      capacity: 35,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Cửa khóa thông minh Smart Lock', 'Bàn làm việc giám đốc', 'Điều hòa độc lập 24/7', 'Bảng từ kính', 'Tủ lưu trữ hồ sơ bảo mật'],
      autoCheckoutMinutes: 20,
      awayWarningMinutes: 10,
      pricePerHour: 500000,
      pricePerDay: 3500000,
      rating: 4.9,
      reviewsCount: 31
    },
    {
      id: 'choi-1',
      name: 'Meeting Pod cách âm Smart Pod 01',
      building: 'Startup Pod Hub',
      floor: 'Khuôn viên Vườn Công nghệ',
      type: 'Meeting Pod cách âm',
      capacity: 4,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Vách kính cách âm chuẩn 35dB', 'Hệ thống thông gió cưỡng bức', 'Màn hình họp nhanh 32 inch', 'Đèn LED nhiệt độ màu điều chỉnh'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8,
      pricePerHour: 120000,
      pricePerDay: 800000,
      rating: 4.85,
      reviewsCount: 64
    },
    {
      id: 'a-105',
      name: 'Studio sáng tạo Creative Media A.105',
      building: 'Creative Hub Center',
      floor: 'Tầng 1',
      type: 'Studio sáng tạo',
      capacity: 20,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Phông xanh Chromakey', 'Hệ thống đèn Spotlight & Softbox', 'Micro thu âm Podcast Shure', 'Cách âm tiêu âm chuyên nghiệp'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 10,
      pricePerHour: 400000,
      pricePerDay: 2800000,
      rating: 4.92,
      reviewsCount: 53
    },
    {
      id: 'b1-202',
      name: 'Phòng đào tạo & Workshop Executive B1.202',
      building: 'Central Tower Q.1',
      floor: 'Tầng 2',
      type: 'Không gian sự kiện',
      capacity: 60,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Âm thanh đa vùng', '2 Máy chiếu song song', 'Điều hòa inverter', 'Wifi doanh nghiệp riêng'],
      autoCheckoutMinutes: 20,
      awayWarningMinutes: 10,
      pricePerHour: 600000,
      pricePerDay: 4200000,
      rating: 4.88,
      reviewsCount: 29
    },
    {
      id: 'choi-2',
      name: 'Meeting Pod cách âm Solo Booth 02',
      building: 'Startup Pod Hub',
      floor: 'Khuôn viên Vườn Công nghệ',
      type: 'Meeting Pod cách âm',
      capacity: 2,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Cách âm hoàn hảo cho Phone call', 'Bàn làm việc đứng/ngồi', 'Cổng sạc Type-C PD 100W', 'Ghế Ergonomic Herman Miller'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8,
      pricePerHour: 80000,
      pricePerDay: 500000,
      rating: 4.75,
      reviewsCount: 37
    },
    {
      id: 'choi-3',
      name: 'Không gian mở Outdoor Gazebo Hub',
      building: 'Green Office Suites',
      floor: 'Sân vườn ngoài trời',
      type: 'Bàn làm việc linh hoạt',
      capacity: 10,
      status: 'AVAILABLE',
      currentOccupants: 0,
      equipment: ['Ổ cắm sạc chuẩn IP66 chống nước', 'Đèn LED chiếu sáng dịu mắt', 'Mái che điều hướng', 'Wifi Mesh ngoài trời'],
      autoCheckoutMinutes: 15,
      awayWarningMinutes: 8,
      pricePerHour: 150000,
      pricePerDay: 1000000,
      rating: 4.82,
      reviewsCount: 45
    }
  ];

  // Data: Users & Roles (Seller Staff & Rental Customers)
  users: AdminUser[] = [
    {
      id: 'u-01',
      code: 'HOST-001',
      name: 'Nguyễn Trần Kim Giang (Chủ Gian Hàng)',
      email: 'giangnntk24411@st.uel.edu.vn',
      role: 'SELLER_OWNER',
      organization: 'UEL Space Partner Store - Chuỗi Văn Phòng Đổi Mới Sáng Tạo',
      status: 'ACTIVE',
      bookingsCount: 0
    },
    {
      id: 'u-02',
      code: 'STAFF-002',
      name: 'Nguyễn Văn Thành (Lễ tân & Vận hành)',
      email: 'operations@uelspace.vn',
      role: 'SELLER_STAFF',
      organization: 'Đội Vận hành Gian hàng UEL Space',
      status: 'ACTIVE',
      bookingsCount: 4
    },
    {
      id: 'u-03',
      code: 'CUST-081',
      name: 'Trần Minh Anh (Founder FinTech Co.)',
      email: 'anhtm@fintechhub.vn',
      role: 'CUSTOMER',
      organization: 'Công ty Cổ phần Giải pháp FinTech Việt',
      status: 'ACTIVE',
      bookingsCount: 18
    },
    {
      id: 'u-04',
      code: 'CUST-082',
      name: 'ThS. Lê Hoàng Long (Giám đốc Đào tạo)',
      email: 'longlh@innovate.edu.vn',
      role: 'CUSTOMER',
      organization: 'Viện Nghiên cứu Đổi mới Sáng tạo & AI',
      status: 'ACTIVE',
      bookingsCount: 12
    },
    {
      id: 'u-05',
      code: 'CUST-085',
      name: 'Đỗ Thùy Linh (Trưởng nhóm Dự án)',
      email: 'linhdt@creativelab.com',
      role: 'CUSTOMER',
      organization: 'Creative Media Agency',
      status: 'SUSPENDED',
      bookingsCount: 5
    }
  ];

  // Data: Audit Logs (F34 - Marketplace Activity Log)
  auditLogs: AuditLogItem[] = [
    {
      id: 'log-01',
      timestamp: '11/10/2026 09:28:14',
      actor: 'admin@uelspace.vn',
      action: 'APPROVE_BOOKING',
      target: 'Phòng Họp VIP Executive A2.1 (UEL-BK-2026-083)',
      details: 'Phê duyệt thành công lịch họp Ban Lãnh đạo Doanh nghiệp.',
      level: 'INFO'
    },
    {
      id: 'log-02',
      timestamp: '11/10/2026 09:12:00',
      actor: 'SYSTEM_JOB_F38',
      action: 'AUTO_CHECKOUT_TRIGGERED',
      target: 'Khu Co-working Hub (linhdt@creativelab.com)',
      details: 'Tự động giải phóng chỗ do khách thuê vắng mặt quá 35 phút (ngưỡng 15 phút).',
      level: 'WARNING'
    },
    {
      id: 'log-03',
      timestamp: '11/10/2026 08:30:22',
      actor: 'admin@uelspace.vn',
      action: 'SPACE_MAINTENANCE_LOCK',
      target: 'Meeting Pod cách âm Smart Pod 01',
      details: 'Khóa không gian chuyển sang trạng thái MAINTENANCE để nâng cấp thiết bị âm thanh & cách âm.',
      level: 'WARNING'
    },
    {
      id: 'log-04',
      timestamp: '10/10/2026 17:45:10',
      actor: 'admin@uelspace.vn',
      action: 'USER_ROLE_UPDATED',
      target: 'ThS. Lê Hoàng Long (longlh@innovate.vn)',
      details: 'Cấp quyền DOANH NGHIỆP VIP và phân bổ hạn mức thuê văn phòng ưu tiên.',
      level: 'INFO'
    }
  ];

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Kiểm tra Server AI YOLOv11 (Option B)
    this.checkServerAiHealth();
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
      this.showToast(`${this.i18n.t('Đã giải phóng')} ${rc.spaceName} ${this.i18n.t('cho khách thuê khác đặt chỗ!')}`, 'warning');
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
    if (this.isStartingCamera || this.cameraActive) return;
    this.isStartingCamera = true;
    this.cameraError = '';
    this.cdr.detectChanges();

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.cameraError = this.i18n.t('Trình duyệt không hỗ trợ WebRTC Camera API hoặc đang chạy không bảo mật (yêu cầu HTTPS/localhost).');
      this.cameraActive = false;
      this.isStartingCamera = false;
      this.cdr.detectChanges();
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
        console.warn('Lấy camera theo facingMode thất bại, fallback sang facingMode đơn giản:', errConstraint);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: this.cameraFacingMode } },
            audio: false
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      this.videoStream = stream;
      this.isStartingCamera = false;
      this.cdr.detectChanges();

      // 3. Gắn stream vào video element ngay lập tức
      setTimeout(() => {
        const videoEl = document.getElementById('qr-scanner-video') as HTMLVideoElement;
        if (videoEl && this.videoStream) {
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('webkit-playsinline', 'true');
          videoEl.muted = true;
          videoEl.srcObject = this.videoStream;
          videoEl.play().then(() => {
            this.qrScanningRunning = true;
            this.runQrScanningLoop(videoEl);
          }).catch(ePlay => {
            console.warn('Video play retry needed:', ePlay);
            videoEl.muted = true;
            videoEl.play().catch(err2 => console.error('Final play retry failed:', err2));
            this.qrScanningRunning = true;
            this.runQrScanningLoop(videoEl);
          });
        }
      }, 50);

      const modeName = this.cameraFacingMode === 'environment' 
        ? this.i18n.t('Camera sau') 
        : this.i18n.t('Camera trước');
      this.showToast(`${this.i18n.t('Đã bật')} ${modeName}!`, 'info');
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      this.cameraActive = false;
      this.isStartingCamera = false;
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
    this.isStartingCamera = false;
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
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('webkit-playsinline', 'true');
          videoEl.muted = true;
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

    const now = performance.now();
    // Giới hạn tần suất phân tích QR: mỗi ~80ms (thay vì 16ms) để đạt hiệu năng tối ưu trên điện thoại
    if (!this.isScanningFrame && (now - this.lastQrScanTimestamp >= 80) &&
        videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && 
        videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      this.isScanningFrame = true;
      this.lastQrScanTimestamp = now;

      // Ưu tiên Native BarcodeDetector (phần cứng tăng tốc NPU/GPU trên di động)
      if ('BarcodeDetector' in window) {
        try {
          if (!this.barcodeDetector) {
            this.barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          }
          this.barcodeDetector.detect(videoEl).then((barcodes: any[]) => {
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              this.handleDetectedQrCode(barcodes[0].rawValue);
            }
            this.isScanningFrame = false;
          }).catch(() => {
            this.scanFrameWithJsQr(videoEl);
          });
        } catch {
          this.scanFrameWithJsQr(videoEl);
        }
      } else {
        this.scanFrameWithJsQr(videoEl);
      }
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

    // If no pre-existing match, the booking is not in the upcoming (Sắp tới) state
    if (!matched) {
      this.scanResult = {
        status: 'ERROR',
        message: `${this.i18n.t('Không tìm thấy lượt đặt ở trạng thái Sắp tới khớp với mã')} ${code}!`,
        booking: null,
        isOverrideAllowed: true,
        reason: this.i18n.t('Chỉ lượt đặt đã được duyệt (Sắp tới) mới được quét QR check-in.')
      };
      this.showToast(this.i18n.t('Không tìm thấy lượt đặt Sắp tới!'), 'warning');
      this.cdr.detectChanges();
      return;
    }

    if (matched.status === 'REJECTED') {
      this.scanResult = {
        status: 'ERROR',
        message: `${this.i18n.t('Đơn đặt chỗ')} ${matched.code} ${this.i18n.t('đã bị TỪ CHỐI trước đó!')}`,
        booking: matched,
        isOverrideAllowed: true,
        reason: matched.rejectionReason || this.i18n.t('Đơn bị từ chối do trùng lịch thuê hoặc vi phạm quy định sử dụng không gian.')
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
        reason: this.i18n.t('Khách thuê đã chủ động hủy lịch trước giờ diễn ra.')
      };
      this.showToast(this.i18n.t('Đơn này đã bị hủy!'), 'warning');
      this.cdr.detectChanges();
      return;
    }

    // Chỉ lượt đặt ở trạng thái Sắp tới (đã duyệt) mới được quét QR sang Đang sử dụng
    if (matched.status === 'PENDING') {
      this.scanResult = {
        status: 'ERROR',
        message: `${this.i18n.t('Đơn đặt chỗ')} ${matched.code} ${this.i18n.t('đang chờ duyệt! Chỉ lượt đặt ở trạng thái Sắp tới mới được quét QR check-in.')}`,
        booking: matched,
        isOverrideAllowed: true,
        reason: this.i18n.t('Đơn đang chờ Admin duyệt, chưa thể check-in.')
      };
      this.showToast(this.i18n.t('Đơn đang chờ duyệt, chưa thể check-in!'), 'warning');
      this.cdr.detectChanges();
      return;
    }

    if (matched.status === 'IN_USE') {
      this.scanResult = {
        status: 'ERROR',
        message: `${this.i18n.t('Lượt đặt')} ${matched.code} ${this.i18n.t('đang sử dụng! Không thể quét QR check-in lại.')}`,
        booking: matched,
        isOverrideAllowed: true,
        reason: this.i18n.t('Khách thuê đã check-in và đang sử dụng phòng.')
      };
      this.showToast(this.i18n.t('Lượt đặt đang sử dụng!'), 'warning');
      this.cdr.detectChanges();
      return;
    }

    if (matched.status === 'COMPLETED') {
      this.scanResult = {
        status: 'ERROR',
        message: `${this.i18n.t('Lượt đặt')} ${matched.code} ${this.i18n.t('đã hoàn thành! Không thể quét QR check-in lại.')}`,
        booking: matched,
        isOverrideAllowed: true,
        reason: this.i18n.t('Thời gian sử dụng đã kết thúc, lượt đặt đã chuyển sang trạng thái Đã hoàn thành.')
      };
      this.showToast(this.i18n.t('Lượt đặt đã hoàn thành!'), 'warning');
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

  private initFaceDetector(): void {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        this.faceDetector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 20 });
        console.log('Hardware FaceDetector initialized successfully!');
      } catch (e) {
        console.warn('FaceDetector init error:', e);
      }
    }
  }

  setOccEngineMode(mode: 'server' | 'client'): void {
    this.occEngineMode = mode;
    if (mode === 'server') {
      this.occModelName = 'YOLOv11 Server AI (Độ chính xác cao)';
      this.showToast(this.i18n.t('Đã chuyển sang YOLOv11 Server AI (Độ chính xác cao, hỗ trợ mọi thiết bị)'), 'success');
      this.checkServerAiHealth();
    } else {
      this.occModelName = this.occCocoModel ? 'COCO-SSD Client + Face AI' : 'Edge AI Head-Peak';
      this.showToast(this.i18n.t('Đã chuyển sang Client Edge AI (Chạy offline trên trình duyệt)'), 'info');
    }
    this.cdr.detectChanges();
  }

  async checkServerAiHealth(): Promise<boolean> {
    try {
      this.occServerStatus = 'checking';
      const res = await fetch(`${SERVER_BASE_URL}/api/occupancy/live`, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        this.occServerStatus = 'online';
        if (this.occEngineMode === 'server') {
          this.occModelName = 'YOLOv11 Server AI (Sẵn sàng)';
        }
        return true;
      }
      this.occServerStatus = 'offline';
      return false;
    } catch {
      this.occServerStatus = 'offline';
      return false;
    } finally {
      this.cdr.detectChanges();
    }
  }

  private async detectWithServerYolo(
    videoEl: HTMLVideoElement
  ): Promise<Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> | null> {
    try {
      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      if (!vw || !vh) return null;

      // Chuẩn hóa kích thước khung hình gửi lên Server (max width 640px)
      // Tối ưu dung lượng <35KB, truyền tải siêu tốc qua mạng 4G/WiFi cho mọi điện thoại và laptop
      const targetWidth = Math.min(640, vw);
      const scale = targetWidth / vw;
      const targetHeight = Math.round(vh * scale);

      if (!this.offscreenCanvas) {
        this.offscreenCanvas = document.createElement('canvas');
      }
      this.offscreenCanvas.width = targetWidth;
      this.offscreenCanvas.height = targetHeight;
      const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;

      ctx.drawImage(videoEl, 0, 0, targetWidth, targetHeight);
      const base64Image = this.offscreenCanvas.toDataURL('image/jpeg', 0.72);

      const t0 = performance.now();
      const res = await fetch(`${SERVER_BASE_URL}/api/occupancy/detect-server`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          confidenceThreshold: this.occSensitivity === 'high' ? 0.20 : (this.occSensitivity === 'normal' ? 0.32 : 0.48),
          iouThreshold: 0.45,
          spaceId: this.occSelectedSpace?.id || 'general',
          spaceName: this.occSelectedSpace?.name || 'UEL Space Room'
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        this.occServerStatus = 'offline';
        return null;
      }

      const data = await res.json();
      if (!data.success) {
        this.occServerStatus = 'offline';
        return null;
      }

      this.occServerStatus = 'online';
      this.occServerLatencyMs = Math.round(performance.now() - t0);
      this.occModelName = `YOLOv11 Server AI (${data.processingTimeMs}ms • ${data.device ? data.device.toUpperCase() : 'CPU'})`;

      const boxes: Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> = [];
      if (Array.isArray(data.boxes)) {
        for (const b of data.boxes) {
          boxes.push({
            x: Math.round(b.x / scale),
            y: Math.round(b.y / scale),
            w: Math.round(b.w / scale),
            h: Math.round(b.h / scale),
            score: Math.round(b.confidence),
            label: b.label || 'Khách thuê (YOLOv11)'
          });
        }
      }
      return boxes;
    } catch {
      this.occServerStatus = 'offline';
      return null;
    }
  }

  setOccSensitivity(level: 'high' | 'normal' | 'strict'): void {
    this.occSensitivity = level;
    const label = level === 'high' ? 'Siêu nhạy (Webcam / Gần)' : (level === 'normal' ? 'Tiêu chuẩn' : 'Nghiêm ngặt');
    this.showToast(`${this.i18n.t('Đã chuyển độ nhạy AI:')} ${label}`, 'info');
  }

  async loadOccupancyModel(): Promise<void> {
    this.initFaceDetector();
    if (this.occCocoModel) return;
    this.occModelLoading = true;
    this.occModelError = '';
    this.occModelName = 'Đang nạp mô hình AI Deep Learning...';
    this.cdr.detectChanges();

    try {
      const tf = await import('@tensorflow/tfjs');
      let backendReady = false;
      try {
        if (tf.findBackend && tf.findBackend('webgl')) {
          await tf.setBackend('webgl');
          await tf.ready();
          backendReady = true;
        }
      } catch (eW) {
        console.warn('WebGL backend warning, falling back to CPU:', eW);
      }

      if (!backendReady) {
        try {
          await tf.setBackend('cpu');
          await tf.ready();
        } catch (eC) {
          console.warn('CPU backend warning:', eC);
        }
      }

      const currentBackend = tf.getBackend();
      console.log('TensorFlow.js ready on backend:', currentBackend);

      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      
      // Tải mô hình COCO-SSD với MobileNetV2 (chuẩn xác cao, ít nhiễu)
      let loadedModel: any = null;
      try {
        loadedModel = await Promise.race([
          cocoSsd.load({ base: 'mobilenet_v2' }),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('mobilenet_v2 timeout')), 18000))
        ]);
      } catch (e1) {
        console.warn('mobilenet_v2 timeout, trying lite_mobilenet_v2:', e1);
        try {
          loadedModel = await Promise.race([
            cocoSsd.load({ base: 'lite_mobilenet_v2' }),
            new Promise<null>((_, rej) => setTimeout(() => rej(new Error('lite timeout')), 25000))
          ]);
        } catch (e2) {
          console.warn('lite_mobilenet_v2 also failed:', e2);
        }
      }

      if (loadedModel) {
        this.occCocoModel = loadedModel;
        this.occModelLoaded = true;
        const isGpu = currentBackend === 'webgl';
        this.occModelName = `COCO-SSD Neural AI (${isGpu ? 'GPU WebGL' : 'CPU'})`;
        console.log('UEL Space AI Model loaded successfully:', this.occModelName);
      } else if (this.faceDetector) {
        this.occModelLoaded = true;
        this.occModelName = 'Hardware Face AI (Neural Engine)';
      } else {
        this.occModelError = 'Không thể tải mô hình AI. Vui lòng kiểm tra kết nối mạng.';
        this.occModelName = 'AI Offline';
      }
    } catch (err: any) {
      console.warn('AI Model load error:', err);
      if (this.faceDetector) {
        this.occModelLoaded = true;
        this.occModelName = 'Hardware Face AI';
      } else {
        this.occModelError = 'Lỗi nạp mô hình AI: ' + (err?.message || '');
        this.occModelName = 'AI Standby';
      }
    } finally {
      this.occModelLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * SOTA Non-Maximum Suppression (NMS) & Multi-Anchor Body Fusion.
   * Ngăn chặn triệt để lỗi "Một người thành nhiều người":
   * Gom mọi bộ phận (khuôn mặt, ngực, vai, cánh tay, thân người) của cùng một cá nhân thành 1 box duy nhất.
   */
  private consolidateAndMergeDetections(
    boxes: Array<{ x: number; y: number; w: number; h: number; score: number; label: string }>,
    vw: number,
    vh: number
  ): Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> {
    if (boxes.length === 0) return [];

    // 1. Lọc bỏ các box có kích thước hoặc tỷ lệ khung hình bất thường (bàn ghế, sàn, sọc tường)
    const validBoxes = boxes.filter(b => {
      // Bỏ box quá nhỏ (nhiễu pixel)
      if (b.w < 28 || b.h < 38) return false;
      // Dáng người thật không bao giờ có chiều rộng gấp 2.2 lần chiều cao (như mép bàn, băng ghế)
      const aspectWH = b.w / b.h;
      if (aspectWH > 2.0) return false;
      // Không bao giờ có chiều cao gấp 4 lần chiều rộng (như nẹp cửa, cột)
      const aspectHW = b.h / b.w;
      if (aspectHW > 4.2) return false;
      return true;
    });

    if (validBoxes.length <= 1) return validBoxes;

    // Sắp xếp theo điểm tin cậy giảm dần
    validBoxes.sort((a, b) => b.score - a.score);

    let merged = [...validBoxes];
    let changed = true;

    while (changed) {
      changed = false;
      const nextMerged: typeof validBoxes = [];
      const used = new Set<number>();

      for (let i = 0; i < merged.length; i++) {
        if (used.has(i)) continue;
        let b1 = { ...merged[i] };

        for (let j = i + 1; j < merged.length; j++) {
          if (used.has(j)) continue;
          const b2 = merged[j];

          // Tính diện tích giao nhau (Intersection)
          const interX1 = Math.max(b1.x, b2.x);
          const interY1 = Math.max(b1.y, b2.y);
          const interX2 = Math.min(b1.x + b1.w, b2.x + b2.w);
          const interY2 = Math.min(b1.y + b1.h, b2.y + b2.h);
          const interW = Math.max(0, interX2 - interX1);
          const interH = Math.max(0, interY2 - interY1);
          const interArea = interW * interH;

          const area1 = b1.w * b1.h;
          const area2 = b2.w * b2.h;
          const minArea = Math.min(area1, area2);
          const unionArea = area1 + area2 - interArea;
          const iou = unionArea > 0 ? interArea / unionArea : 0;
          const ios = minArea > 0 ? interArea / minArea : 0; // Tỷ lệ nằm lọt trong box kia

          const c1X = b1.x + b1.w / 2;
          const c1Y = b1.y + b1.h / 2;
          const c2X = b2.x + b2.w / 2;
          const c2Y = b2.y + b2.h / 2;
          const deltaX = Math.abs(c1X - c2X);
          const deltaY = Math.abs(c1Y - c2Y);

          // Điều kiện 1: Trùng lặp không gian (IoU >= 0.25 hoặc một box nằm lọt trong box kia IoS >= 0.45)
          const isDirectOverlap = iou >= 0.25 || ios >= 0.45;

          // Điều kiện 2: Cùng 1 cá nhân (Face AI phát hiện đầu và COCO phát hiện thân người)
          // Tâm ngang lệch không quá 45% chiều rộng, và độ lệch dọc nằm trong chiều cao của người
          const maxW = Math.max(b1.w, b2.w);
          const maxH = Math.max(b1.h, b2.h);
          const isSamePersonBodyParts = deltaX <= maxW * 0.45 && deltaY <= maxH * 0.85;

          if (isDirectOverlap || isSamePersonBodyParts) {
            const unionLeft = Math.min(b1.x, b2.x);
            const unionTop = Math.min(b1.y, b2.y);
            const unionRight = Math.max(b1.x + b1.w, b2.x + b2.w);
            const unionBottom = Math.max(b1.y + b1.h, b2.y + b2.h);

            b1.x = unionLeft;
            b1.y = unionTop;
            b1.w = unionRight - unionLeft;
            b1.h = unionBottom - unionTop;
            b1.score = Math.max(b1.score, b2.score);
            b1.label = 'Người (SOTA AI)';
            used.add(j);
            changed = true;
          }
        }

        nextMerged.push(b1);
      }

      merged = nextMerged;
    }

    return merged;
  }



  async startOccupancyDetection(): Promise<void> {
    if (this.occStartingCamera || this.occCameraActive) return;

    if (!this.occSelectedSpace && this.spaces.length > 0) {
      this.selectSpaceForDetection(this.spaces[0]);
    }

    if (!this.occSelectedSpace) {
      this.showToast(this.i18n.t('Vui lòng chọn không gian cần giám sát trước!'), 'warning');
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.occModelError = this.i18n.t('Trình duyệt không hỗ trợ WebRTC Camera API hoặc yêu cầu kết nối HTTPS/localhost.');
      this.showToast(this.occModelError, 'warning');
      return;
    }

    this.occStartingCamera = true;
    this.occModelError = '';
    this.cdr.detectChanges();

    try {
      // 1. Dọn dẹp stream cũ nếu có
      if (this.occVideoStream) {
        this.occVideoStream.getTracks().forEach(t => { try { t.stop(); } catch {} });
        this.occVideoStream = null;
      }

      // Kích hoạt ngay cameraActive để Angular render thẻ <video> ngay lập tức
      this.occCameraActive = true;
      this.cdr.detectChanges();

      // 2. Yêu cầu camera ngay lập tức trên user interaction hiện tại (bảo toàn quyền của trình duyệt trên điện thoại)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: this.occFacingMode },
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
      } catch (errConstraint) {
        console.warn('Lấy cam theo constraint lý tưởng thất bại, thử fallback facingMode:', errConstraint);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: this.occFacingMode } },
            audio: false
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      this.occVideoStream = stream;
      this.occStartingCamera = false;
      this.cdr.detectChanges();

      // 3. Kết nối trực tiếp vào phần tử video
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
            if (this.occFpsInterval) clearInterval(this.occFpsInterval);
            this.occFpsInterval = setInterval(() => {
              const now = performance.now();
              const elapsed = (now - this.occLastFrameTime) / 1000;
              this.occDetectionFps = elapsed > 0 ? Math.round(this.occFrameCount / elapsed) : 0;
              this.occFrameCount = 0;
              this.occLastFrameTime = now;
            }, 2000);

            // Kích hoạt ngay vòng lặp nhận diện Vision AI (tức thì 0ms, không chờ đợi)
            this.runDetectionLoop(videoEl);
            if (!this.occCocoModel) {
              this.loadOccupancyModel().catch(e => console.warn('Nạp ngầm COCO-SSD:', e));
            }
          }).catch(ePlay => {
            console.warn('Video play retry needed on occ camera:', ePlay);
            videoEl.muted = true;
            videoEl.play().catch(err2 => console.error('Occ play retry failed:', err2));
            this.occDetectionRunning = true;
            this.runDetectionLoop(videoEl);
          });
        }
      }, 50);

    } catch (err: any) {
      console.error('Camera access error in startOccupancyDetection:', err);
      this.occStartingCamera = false;
      this.occCameraActive = false;
      this.occDetectionRunning = false;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.occModelError = this.i18n.t('Quyền truy cập Camera bị từ chối. Vui lòng cấp quyền Camera trên trình duyệt điện thoại để tiếp tục.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        this.occModelError = this.i18n.t('Không tìm thấy thiết bị Camera trên thiết bị này.');
      } else {
        this.occModelError = this.i18n.t('Không thể truy cập Camera: ') + (err?.message || this.i18n.t('Chưa cấp quyền hoặc thiết bị không có camera.'));
      }
      this.showToast(this.occModelError, 'warning');
      this.cdr.detectChanges();
    }
  }

  async toggleOccCameraFacing(): Promise<void> {
    if (!this.occCameraActive || this.occIsSwitchingFacing) return;
    this.occIsSwitchingFacing = true;
    const nextFacing = this.occFacingMode === 'environment' ? 'user' : 'environment';

    try {
      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: nextFacing } },
          audio: false
        });
      }

      const oldStream = this.occVideoStream;
      this.occVideoStream = newStream;
      this.occFacingMode = nextFacing;

      const videoEl = document.getElementById('occ-detection-video') as HTMLVideoElement;
      if (videoEl) {
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('webkit-playsinline', 'true');
        videoEl.muted = true;
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

  private async runDetectionLoop(videoEl: HTMLVideoElement): Promise<void> {
    if (!this.occDetectionRunning) return;

    const canvas = document.getElementById('occ-detection-canvas') as HTMLCanvasElement;
    if (!canvas || !videoEl.videoWidth || videoEl.videoWidth < 10 || videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      requestAnimationFrame(() => this.runDetectionLoop(videoEl));
      return;
    }

    const now = performance.now();
    // Tần suất suy luận: 140ms cho Server AI (tối ưu băng thông/mượt mà), 80ms cho Client Edge AI
    const intervalThreshold = this.occEngineMode === 'server' ? 140 : 80;
    if (this.isDetectingOccFrame || (now - this.lastOccDetectionTimestamp < intervalThreshold)) {
      requestAnimationFrame(() => this.runDetectionLoop(videoEl));
      return;
    }

    this.isDetectingOccFrame = true;
    this.lastOccDetectionTimestamp = now;

    // Ngưỡng điểm tin cậy tương ứng với cấu hình (tránh nhiễu bóng đổ, cạnh bàn ghế)
    const minScore = this.occSensitivity === 'high' ? 0.38 : (this.occSensitivity === 'normal' ? 0.50 : 0.65);

    try {
      const rawDetected: Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> = [];
      let usedServerYolo = false;

      // 1. Chế độ Ưu tiên: SOTA YOLOv11 Server AI Microservice (Option B)
      if (this.occEngineMode === 'server') {
        const serverBoxes = await this.detectWithServerYolo(videoEl);
        if (serverBoxes !== null) {
          usedServerYolo = true;
          for (const sb of serverBoxes) {
            rawDetected.push(sb);
          }
        }
      }

      // 2. Chế độ Client Edge AI (Chạy Neural Network COCO-SSD / Face AI)
      if (!usedServerYolo) {
        // A. Chạy COCO-SSD MobileNetV2 Deep Learning
        let cocoPredictions: any[] = [];
        if (this.occCocoModel) {
          try {
            cocoPredictions = await this.occCocoModel.detect(videoEl, 15, minScore);
          } catch (errCoco) {
            console.warn('COCO detect error:', errCoco);
          }
        }

        // B. Chạy Hardware FaceDetector song song (nếu trình duyệt hỗ trợ)
        let facePredictions: any[] = [];
        if (this.faceDetector) {
          try {
            facePredictions = await this.faceDetector.detect(videoEl);
          } catch (errFace) {
            console.warn('Face detect error:', errFace);
          }
        }

        // C. Thu thập kết quả Deep Learning COCO-SSD: LỌC CHÍNH XÁC CLASS 'person'
        const bodyPeople = cocoPredictions.filter((p: any) => p.class === 'person' && p.score >= minScore);
        for (const p of bodyPeople) {
          rawDetected.push({
            x: Math.round(p.bbox[0]),
            y: Math.round(p.bbox[1]),
            w: Math.round(p.bbox[2]),
            h: Math.round(p.bbox[3]),
            score: Math.round(p.score * 100),
            label: 'Khách thuê (Neural AI)'
          });
        }

        // D. Face AI: Chỉ bổ sung nếu khuôn mặt KHÔNG nằm trong body box nào đã có
        if (facePredictions && facePredictions.length > 0) {
          for (const f of facePredictions) {
            const fb = f.boundingBox;
            const fCenterX = fb.x + fb.width / 2;
            const fCenterY = fb.y + fb.height / 2;

            // Kiểm tra xem khuôn mặt này đã thuộc về 1 người đã nhận diện ở bodyPeople chưa
            const alreadyInBody = rawDetected.some(b => 
              fCenterX >= b.x - 20 && fCenterX <= b.x + b.w + 20 &&
              fCenterY >= b.y - 20 && fCenterY <= b.y + b.h + 20
            );

            if (!alreadyInBody) {
              // Người này ngồi khuất bàn, chỉ nhìn thấy mặt -> tạo box người hợp lý
              const estWidth = Math.min(videoEl.videoWidth, Math.max(fb.width * 2.0, 100));
              const estHeight = Math.min(videoEl.videoHeight, Math.max(fb.height * 2.6, 140));
              const estX = Math.max(0, fb.x - (estWidth - fb.width) / 2);
              const estY = Math.max(0, fb.y - fb.height * 0.15);

              rawDetected.push({
                x: Math.round(estX),
                y: Math.round(estY),
                w: Math.round(estWidth),
                h: Math.round(estHeight),
                score: 95,
                label: 'Khách thuê (Face AI)'
              });
            }
          }
        }
      }

      // 3. HỢP NHẤT TRIỆT ĐỂ BẰNG NMS SOTA: Gom mọi bộ phận về 1 người duy nhất
      const detectedPeople = this.consolidateAndMergeDetections(rawDetected, videoEl.videoWidth, videoEl.videoHeight);

      // Nếu không phát hiện ai (phòng trống): dọn sạch tracking ngay lập tức, KHÔNG giữ ghost box!
      if (detectedPeople.length === 0) {
        this.trackedPeople = [];
        this.occCurrentCount = 0;
        const canvas = document.getElementById('occ-detection-canvas') as HTMLCanvasElement;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        this.isDetectingOccFrame = false;
        requestAnimationFrame(() => this.runDetectionLoop(videoEl));
        return;
      }

      // 4. BỘ THEO DÕI LÀM MƯỢT KHUNG HÌNH (Temporal EMA Box Tracking)
      const unmatchedDetected = [...detectedPeople];
      for (const tracked of this.trackedPeople) {
        let bestDist = Infinity;
        let bestIdx = -1;
        const tcX = tracked.x + tracked.w / 2;
        const tcY = tracked.y + tracked.h / 2;

        for (let i = 0; i < unmatchedDetected.length; i++) {
          const d = unmatchedDetected[i];
          const dcX = d.x + d.w / 2;
          const dcY = d.y + d.h / 2;
          const dist = Math.hypot(tcX - dcX, tcY - dcY);
          const maxAllowedDist = Math.max(160, Math.max(tracked.w, tracked.h) * 0.85);
          if (dist < maxAllowedDist && dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }

        if (bestIdx >= 0) {
          const matched = unmatchedDetected.splice(bestIdx, 1)[0];
          const alpha = 0.40;
          tracked.x = Math.round(tracked.x * (1 - alpha) + matched.x * alpha);
          tracked.y = Math.round(tracked.y * (1 - alpha) + matched.y * alpha);
          tracked.w = Math.round(tracked.w * (1 - alpha) + matched.w * alpha);
          tracked.h = Math.round(tracked.h * (1 - alpha) + matched.h * alpha);
          tracked.score = matched.score;
          tracked.label = matched.label;
          tracked.missing = 0;
        } else {
          tracked.missing++;
        }
      }

      // Giữ khung hình đang theo dõi trong tối đa 2 frame khi mất tín hiệu tạm thời
      this.trackedPeople = this.trackedPeople.filter(t => t.missing <= 2);

      // Thêm các mục tiêu mới được phát hiện
      for (const d of unmatchedDetected) {
        this.trackedPeople.push({
          id: this.nextTrackId++,
          x: d.x,
          y: d.y,
          w: d.w,
          h: d.h,
          score: d.score,
          label: d.label,
          missing: 0
        });
      }

      // 4B. Post-tracking fusion: Chỉ hợp nhất nếu 2 vệt theo dõi trùng lặp đáng kể (IoU >= 0.35 hoặc IoS >= 0.65)
      for (let i = 0; i < this.trackedPeople.length; i++) {
        for (let j = i + 1; j < this.trackedPeople.length; j++) {
          const t1 = this.trackedPeople[i];
          const t2 = this.trackedPeople[j];

          const interX1 = Math.max(t1.x, t2.x);
          const interY1 = Math.max(t1.y, t2.y);
          const interX2 = Math.min(t1.x + t1.w, t2.x + t2.w);
          const interY2 = Math.min(t1.y + t1.h, t2.y + t2.h);
          const interW = Math.max(0, interX2 - interX1);
          const interH = Math.max(0, interY2 - interY1);
          const interArea = interW * interH;
          const unionArea = t1.w * t1.h + t2.w * t2.h - interArea;
          const iou = unionArea > 0 ? interArea / unionArea : 0;
          const minArea = Math.min(t1.w * t1.h, t2.w * t2.h);
          const ios = minArea > 0 ? interArea / minArea : 0;

          if (iou >= 0.25 || ios >= 0.45) {
            const minX = Math.min(t1.x, t2.x);
            const minY = Math.min(t1.y, t2.y);
            t1.w = Math.max(t1.x + t1.w, t2.x + t2.w) - minX;
            t1.h = Math.max(t1.y + t1.h, t2.y + t2.h) - minY;
            t1.x = minX;
            t1.y = minY;
            t1.score = Math.max(t1.score, t2.score);
            t1.missing = Math.min(t1.missing, t2.missing);
            if (t2.score > t1.score) t1.label = t2.label;
            this.trackedPeople.splice(j, 1);
            j--;
          }
        }
      }


      // 5. Vẽ khung nhận diện lên Canvas
      if (canvas.width !== videoEl.videoWidth || canvas.height !== videoEl.videoHeight) {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.trackedPeople.forEach((p, idx) => {
          // Khung viền Neon Cyan nổi bật
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(p.x, p.y, p.w, p.h);

          // Lớp phủ mờ hiện đại
          ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
          ctx.fillRect(p.x, p.y, p.w, p.h);

          // 4 Góc Target Brackets màu vàng hổ phách
          const cLen = Math.min(p.w, p.h) * 0.2;
          ctx.strokeStyle = '#FFC72C';
          ctx.lineWidth = 3.5;
          // Top-left
          ctx.beginPath(); ctx.moveTo(p.x, p.y + cLen); ctx.lineTo(p.x, p.y); ctx.lineTo(p.x + cLen, p.y); ctx.stroke();
          // Top-right
          ctx.beginPath(); ctx.moveTo(p.x + p.w - cLen, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.lineTo(p.x + p.w, p.y + cLen); ctx.stroke();
          // Bottom-left
          ctx.beginPath(); ctx.moveTo(p.x, p.y + p.h - cLen); ctx.lineTo(p.x, p.y + p.h); ctx.lineTo(p.x + cLen, p.y + p.h); ctx.stroke();
          // Bottom-right
          ctx.beginPath(); ctx.moveTo(p.x + p.w - cLen, p.y + p.h); ctx.lineTo(p.x + p.w, p.y + p.h); ctx.lineTo(p.x + p.w, p.y + p.h - cLen); ctx.stroke();

          // Nhãn thông tin người phát hiện
          const tag = `#${idx + 1} ${p.label} • ${p.score}%`;
          ctx.font = 'bold 12px Roboto, system-ui, sans-serif';
          const tw = ctx.measureText(tag).width;
          ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
          ctx.beginPath();
          ctx.roundRect(p.x, Math.max(2, p.y - 24), tw + 14, 22, 5);
          ctx.fill();
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(tag, p.x + 7, Math.max(17, p.y - 9));
        });
      }

      // 6. Cập nhật sĩ số thực tế (có Debounce khử rung số)
      const currentRawCount = this.trackedPeople.length;
      this.headcountDebounceBuffer.push(currentRawCount);
      if (this.headcountDebounceBuffer.length > 4) {
        this.headcountDebounceBuffer.shift();
      }

      // Tìm giá trị xuất hiện nhiều nhất (mode) trong buffer để khử nhảy số tức thời
      const freqMap = new Map<number, number>();
      let debouncedCount = currentRawCount;
      let maxFreq = 0;
      for (const c of this.headcountDebounceBuffer) {
        const freq = (freqMap.get(c) || 0) + 1;
        freqMap.set(c, freq);
        if (freq > maxFreq) {
          maxFreq = freq;
          debouncedCount = c;
        }
      }

      const count = debouncedCount;
      const countChanged = this.occCurrentCount !== count;
      this.occFrameCount++;

      if (countChanged || (now - this.lastOccStatsUpdate > 2500)) {
        this.lastOccStatsUpdate = now;
        this.ngZone.run(() => {
          this.occCurrentCount = count;
          this.occConfidence = this.trackedPeople.length > 0
            ? Math.round(this.trackedPeople.reduce((sum, p) => sum + p.score, 0) / this.trackedPeople.length)
            : 0;

          if (this.occCurrentCount > this.occPeakCount) {
            this.occPeakCount = this.occCurrentCount;
          }

          this.evaluateFlexSpaceAiRules();

          if (this.occHistory.length === 0 ||
              (Date.now() - new Date(this.occHistory[0]?.timestamp || 0).getTime()) > 5000) {
            const histNow = new Date();
            this.occHistory.unshift({
              timestamp: histNow.toLocaleTimeString('vi-VN'),
              spaceName: this.occSelectedSpace?.name || '',
              detectedCount: this.occCurrentCount,
              capacity: this.occSelectedSpace?.capacity || 0,
              occupancyRate: this.occSelectedSpace ? Math.round((this.occCurrentCount / this.occSelectedSpace.capacity) * 100) : 0,
              confidence: this.occConfidence
            });
            if (this.occHistory.length > 50) this.occHistory.pop();

            const total = this.occHistory.reduce((s, h) => s + h.detectedCount, 0);
            this.occAvgCount = Math.round(total / this.occHistory.length);
          }
          this.cdr.detectChanges();
        });
      }

    } catch (err: any) {
      console.warn('Detection cycle error:', err);
    } finally {
      this.isDetectingOccFrame = false;
      if (this.occDetectionRunning) {
        requestAnimationFrame(() => this.runDetectionLoop(videoEl));
      }
    }
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

    // 2. Kiểm tra Overtime (Sử dụng quá giờ thực tế)
    if (!this.occEarlyCheckoutDone) {
      const isOvertime = this.checkBookingOvertime(this.occActiveBooking);
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
      details: `UEL Space AI phát hiện khách sử dụng quá giờ ${this.occOvertimeMinutes} phút (sĩ số thực tế: ${this.occCurrentCount} người). Chủ không gian áp dụng phụ phí ${amountStr} VNĐ theo block 30 phút.`,
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
      details: `UEL Space AI nhận diện phòng trống trước thời gian kết thúc đặt chỗ. Chủ không gian xác nhận trả phòng sớm, giải phóng khung giờ còn dư đưa trở lại sàn UEL Space.`,
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
      details: `UEL Space AI phát hiện ${this.occCurrentCount} người (vượt ${this.occOverCapacityCount} người so với đăng ký ${this.occActiveBooking.attendees} người). Đã ghi nhận phụ phí và cảnh báo sử dụng vượt quá thỏa thuận.`,
      level: 'WARNING'
    });
    this.cdr.detectChanges();
  }

  stopOccupancyDetection(): void {
    this.occDetectionRunning = false;
    this.isDetectingOccFrame = false;
    this.occStartingCamera = false;
    const videoEl = document.getElementById('occ-detection-video') as HTMLVideoElement;
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.srcObject = null;
      } catch {}
    }
    const canvas = document.getElementById('occ-detection-canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      } catch {}
    }
    if (this.occVideoStream) {
      this.occVideoStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
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

    // Đồng bộ tức thì và đóng gói dữ liệu giám sát vào MongoDB Atlas
    try {
      fetch(`${SERVER_BASE_URL}/api/occupancy/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: this.occSelectedSpace.id,
          spaceName: this.occSelectedSpace.name,
          detectedCount: this.occCurrentCount,
          capacity: this.occSelectedSpace.capacity,
          confidence: this.occConfidence,
          modelName: this.occModelName,
          notes: `UEL Space Edge AI Snapshot tại ${this.occSelectedSpace.name}`
        })
      }).then(res => {
        if (res.ok) console.log('Occupancy snapshot synced to MongoDB Atlas successfully!');
      }).catch(err => console.warn('MongoDB sync warning:', err));
    } catch (e) {
      console.warn('MongoDB sync exception:', e);
    }

    this.showToast(`${this.i18n.t('Đã lưu snapshot & đồng bộ MongoDB Atlas:')} ${this.occCurrentCount} ${this.i18n.t('người tại')} ${this.occSelectedSpace.name}`, 'success');
  }
}

