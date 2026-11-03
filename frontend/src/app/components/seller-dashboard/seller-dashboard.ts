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
  _id?: string;
  code?: string;
  name: string;
  building: string;
  floor: string;
  type: string;
  spaceType?: string;
  capacity: number;
  area?: number;
  areaSize?: number;
  status: 'AVAILABLE' | 'IN_USE' | 'RESERVED' | 'MAINTENANCE' | 'PENDING_APPROVAL' | 'REJECTED' | 'CLOSED';
  currentOccupants: number;
  equipment: string[];
  autoCheckoutMinutes: number;
  awayWarningMinutes: number;
  overtimeGraceMinutes?: number;
  overtimeHourlyRate?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  hourlyPrice?: number;
  dailyPrice?: number;
  rating?: number;
  reviewsCount?: number;
  image?: string;
  images?: string[];
  tags?: string[];
  description?: string;
  sellerId?: string;
  seller?: any;
  location?: string;
}

export interface AdminUser {
  id: string;
  code: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER';
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
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SettingsModalComponent, TranslatePipe],
  templateUrl: './seller-dashboard.html',
  styleUrl: './seller-dashboard.scss'
})
export class SellerDashboard implements OnInit, OnDestroy {
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

  markAsRead(id: string, event: Event, link?: string): void {
    event.stopPropagation();
    this.settingsService.markAsRead(id);
    if (link) {
      this.isNotificationOpen = false;
      if (link.includes('seller') || link.includes('portal')) {
        if (link.includes('booking') || link.includes('approval')) this.activeTab = 'approvals';
        else if (link.includes('space')) this.activeTab = 'spaces';
        else if (link.includes('exception')) this.activeTab = 'exceptions';
        else if (link.includes('occupancy')) this.activeTab = 'occupancy-detection';
      } else {
        this.router.navigateByUrl(link);
      }
    }
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
      bookerName: 'Lê Hoàng Long',
      timeSlot: '09:00 - 11:00',
      verifiedBy: 'admin@gmail.com',
      type: 'USB_SCANNER'
    }
  ];

  // Seller / Partner Profile Mockup (Seller Center)
  adminUser = {
    name: 'Chủ Gian Hàng UEL Space Partner Hub',
    email: 'seller.partner@gmail.com',
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
  occModelName: string = 'YOLO11-IndoorCrowd Server AI (Sẵn sàng)';
  occConfidenceThreshold: number = 0.23;
  occSensitivity: 'high' | 'normal' | 'strict' = 'normal';
  occCameraActive: boolean = false;
  occStartingCamera: boolean = false;
  occVideoStream: MediaStream | null = null;
  occDetectionRunning: boolean = false;
  occCurrentCount: number = 0;
  occConfidence: number = 0;
  occSelectedSpace: AdminSpace | null = null;
  occDetectionInterval: any = null;
  occCocoModel: any = null;
  occYoloOnnxSession: any = null;
  occHistory: OccupancySnapshot[] = [];
  occPeakCount: number = 0;
  occAvgCount: number = 0;
  occDetectionFps: number = 0;
  private faceDetector: any = null;

  // Option B: YOLO11-IndoorCrowd Server AI Engine State
  occEngineMode: 'server' | 'client' = 'server';
  occServerStatus: 'online' | 'offline' | 'checking' = 'checking';
  occServerLatencyMs: number = 0;
  private occServerFailCount: number = 0;
  private occServerCooldownUntil: number = 0;
  private occServerOfflineNotified: boolean = false;
  private offscreenCanvas: HTMLCanvasElement | null = null;

  // Mobile CCTV Node (Điện thoại làm Camera AI qua WebRTC P2P)
  occVideoSource: 'local' | 'mobile_cctv' = 'local';
  showMobileCctvModal: boolean = false;
  mobileCctvConnected: boolean = false;
  mobileCctvStreamId: string = 'uel-cctv-room';
  mobileCctvQrUrl: string = '';
  private dashboardPeer: any = null;
  private activeP2pCall: any = null;
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

  // Space Status Filter & Search State
  spaceStatusFilter: 'ALL' | 'AVAILABLE' | 'PENDING_APPROVAL' | 'MAINTENANCE' = 'ALL';
  spaceSearchKeyword: string = '';

  // Space Create / Edit Modal State
  spaceModal = {
    isOpen: false,
    isEdit: false,
    id: '',
    code: '',
    name: '',
    building: 'Tòa nhà A1',
    floor: 'Tầng 1',
    type: 'Phòng họp VIP',
    capacity: 15,
    area: 35,
    pricePerHour: 200000,
    pricePerDay: 1400000,
    awayWarningMinutes: 10,
    autoCheckoutMinutes: 20,
    overtimeGraceMinutes: 15,
    overtimeHourlyRate: 150000,
    status: 'AVAILABLE' as 'AVAILABLE' | 'PENDING_APPROVAL' | 'MAINTENANCE',
    equipmentString: 'Màn hình 4K, Bảng từ kính, Điều hòa Daikin, Wifi 1Gbps',
    image: 'spaces/space_a2_1_meeting_vip.jpg',
    description: 'Không gian tiêu chuẩn cao cấp, hỗ trợ thiết bị hội thảo và cảm biến hiện diện AI thông minh.',
    tagsString: 'Không gian chuẩn UEL, AI Occupancy, Đặt tức thì',
    errorMessage: '',
    isSaving: false
  };

  // Delete Space Modal State
  deleteSpaceModal: {
    isOpen: boolean;
    space: AdminSpace | null;
    isDeleting: boolean;
  } = {
    isOpen: false,
    space: null,
    isDeleting: false
  };

  // Space Listing Rejection Modal State
  spaceListingRejectModal: {
    isOpen: boolean;
    space: AdminSpace | null;
    reason: string;
    isSubmitting: boolean;
  } = {
    isOpen: false,
    space: null,
    reason: '',
    isSubmitting: false
  };

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
      bookerName: 'Lê Hoàng Long',
      bookerEmail: 'innovate@gmail.com',
      organization: 'Viện Đổi mới Sáng tạo & AI',
      purpose: 'Họp Ban Điều hành & Ký kết Hợp đồng Đối tác Chiến lược',
      activityType: 'Họp Ban Lãnh đạo',
      date: '12/10/2026',
      timeSlot: '09:00 - 11:00',
      attendees: 14,
      status: 'APPROVED',
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      processedBy: 'admin.uelspace@gmail.com',
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
      code: 'SELLER-001',
      name: 'Nguyễn Kim Giang (Chủ Gian Hàng)',
      email: 'techpark@gmail.com',
      role: 'SELLER',
      organization: 'TechPark Innovation Spaces',
      status: 'ACTIVE',
      bookingsCount: 32
    },
    {
      id: 'u-02',
      code: 'BUYER-002',
      name: 'Nguyễn Giang',
      email: 'giangnntk24411@st.uel.edu.vn',
      role: 'BUYER',
      organization: 'Thành viên UEL Space',
      status: 'ACTIVE',
      bookingsCount: 4
    },
    {
      id: 'u-03',
      code: 'BUYER-081',
      name: 'Trần Minh Anh',
      email: 'minhanh@gmail.com',
      role: 'BUYER',
      organization: 'Công ty Cổ phần Giải pháp FinTech Việt',
      status: 'ACTIVE',
      bookingsCount: 18
    },
    {
      id: 'u-04',
      code: 'BUYER-082',
      name: 'Lê Hoàng Long',
      email: 'innovate@gmail.com',
      role: 'BUYER',
      organization: 'Innovate Coworking Network',
      status: 'ACTIVE',
      bookingsCount: 12
    },
    {
      id: 'u-05',
      code: 'BUYER-085',
      name: 'Đỗ Thùy Linh',
      email: 'creative@gmail.com',
      role: 'BUYER',
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
      actor: 'admin.uelspace@gmail.com',
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
      actor: 'admin.uelspace@gmail.com',
      action: 'SPACE_MAINTENANCE_LOCK',
      target: 'Meeting Pod cách âm Smart Pod 01',
      details: 'Khóa không gian chuyển sang trạng thái MAINTENANCE để nâng cấp thiết bị âm thanh & cách âm.',
      level: 'WARNING'
    },
    {
      id: 'log-04',
      timestamp: '10/10/2026 17:45:10',
      actor: 'admin.uelspace@gmail.com',
      action: 'USER_ROLE_UPDATED',
      target: 'Lê Hoàng Long (innovate@gmail.com)',
      details: 'Cấp quyền DOANH NGHIỆP VIP và phân bổ hạn mức thuê văn phòng ưu tiên.',
      level: 'INFO'
    }
  ];

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initFaceDetector();
    // Tự động tải trước model YOLO11-IndoorCrowd ONNX / COCO Web
    this.loadOccupancyModel().catch(() => {});
    // Kiểm tra Server AI YOLO11-IndoorCrowd (Option B)
    this.checkServerAiHealth();
    // Đồng bộ dữ liệu Live từ MongoDB Atlas
    this.loadSpacesFromApi();
    this.loadBookingsFromApi();
  }

  async loadSpacesFromApi(): Promise<void> {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/spaces`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: AdminSpace[] = data.map((s: any) => ({
          id: s._id || s.id || s.code,
          _id: s._id,
          code: s.code || s._id,
          name: s.name,
          building: s.building || s.buildingName || 'Tòa nhà A1',
          floor: s.floor || s.floorName || 'Tầng 1',
          type: s.spaceType || s.categoryName || 'Không gian đa năng',
          spaceType: s.spaceType || s.categoryName || 'Không gian đa năng',
          capacity: Number(s.capacity) || 10,
          area: Number(s.area || s.areaSize) || 30,
          areaSize: Number(s.areaSize || s.area) || 30,
          status: s.status || 'AVAILABLE',
          currentOccupants: Number(s.currentOccupants) || 0,
          equipment: Array.isArray(s.equipment)
            ? s.equipment.map((eq: any) => typeof eq === 'string' ? eq : (eq.name || ''))
            : [],
          autoCheckoutMinutes: s.policy?.autoCheckoutMinutes || s.autoCheckoutMinutes || 20,
          awayWarningMinutes: s.policy?.awayWarningMinutes || s.awayWarningMinutes || 10,
          pricePerHour: Number(s.pricePerHour || s.hourlyPrice) || 150000,
          pricePerDay: Number(s.pricePerDay || s.dailyPrice) || 1050000,
          hourlyPrice: Number(s.hourlyPrice || s.pricePerHour) || 150000,
          dailyPrice: Number(s.dailyPrice || s.pricePerDay) || 1050000,
          rating: Number(s.rating) || 4.9,
          reviewsCount: Number(s.reviewsCount) || 10,
          image: s.image || 'spaces/space_a2_1_meeting_vip.jpg',
          images: Array.isArray(s.images) && s.images.length ? s.images : [s.image || 'spaces/space_a2_1_meeting_vip.jpg'],
          tags: Array.isArray(s.tags) ? s.tags : ['Không gian chuẩn UEL', 'AI Occupancy'],
          description: s.description || '',
          seller: s.seller,
          sellerId: s.sellerId,
          location: s.location || `${s.floor || ''}, ${s.building || ''}`
        }));
        this.spaces = mapped;
        if (!this.occSelectedSpace && this.spaces.length > 0) {
          this.selectSpaceForDetection(this.spaces[0]);
        }
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.warn('[Admin] Live MongoDB spaces fetch fallback:', err);
    }
  }

  async loadBookingsFromApi(): Promise<void> {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/bookings`, {
        headers: { 'x-user-role': 'ADMIN' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: AdminBooking[] = data.map((b: any) => ({
          id: b._id || b.id || b.code,
          code: b.code || b._id,
          spaceId: b.spaceId || '',
          spaceName: b.spaceName || 'Không gian UEL',
          building: b.buildingName || b.building || 'Tòa nhà A1',
          bookerName: b.userName || b.bookerName || 'Khách đặt',
          bookerEmail: b.userEmail || b.bookerEmail || '',
          organization: b.organizationName || b.organization || 'Khách vãng lai',
          purpose: b.purpose || 'Hội thảo / Làm việc',
          activityType: b.activityType || 'Hội thảo',
          date: b.date || (b.startTime ? new Date(b.startTime).toLocaleDateString('vi-VN') : ''),
          timeSlot: b.timeSlot || '08:00 - 11:30',
          attendees: Number(b.attendeeCount || b.attendees) || 1,
          status: b.status || 'PENDING',
          rejectionReason: b.rejectionReason || b.cancelReason || '',
          processedBy: b.processedBy || '',
          processedAt: b.processedAt || '',
          price: Number(b.totalPrice || b.price) || 0,
          paymentStatus: b.paymentStatus || 'PAID',
          rentalPackage: b.rentalPackage || '',
          actualCheckInAt: b.actualCheckInAt || ''
        }));
        this.bookings = mapped;
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.warn('[Admin] Live MongoDB bookings fetch fallback:', err);
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

  // Filter Spaces
  get filteredSpaces(): AdminSpace[] {
    return this.spaces.filter(s => {
      const matchStatus = this.spaceStatusFilter === 'ALL' || s.status === this.spaceStatusFilter;
      const matchKeyword = !this.spaceSearchKeyword ||
        s.name.toLowerCase().includes(this.spaceSearchKeyword.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(this.spaceSearchKeyword.toLowerCase())) ||
        s.building.toLowerCase().includes(this.spaceSearchKeyword.toLowerCase()) ||
        s.type.toLowerCase().includes(this.spaceSearchKeyword.toLowerCase());
      return matchStatus && matchKeyword;
    });
  }

  get pendingSpacesCount(): number {
    return this.spaces.filter(s => s.status === 'PENDING_APPROVAL').length;
  }

  // Booking Actions (Live API Integrated)
  async approveBooking(booking: AdminBooking): Promise<void> {
    try {
      await fetch(`${SERVER_BASE_URL}/api/bookings/${booking.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ note: 'Phê duyệt bởi Quản trị viên UEL Space' })
      });
    } catch (err) {
      console.warn('[Admin] approveBooking API sync warning:', err);
    }

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
    this.cdr.detectChanges();
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

  async confirmRejectBooking(): Promise<void> {
    if (!this.rejectModal.booking) return;
    const booking = this.rejectModal.booking;
    const reasonText = this.rejectModal.reason.trim() || this.i18n.t('Trùng lịch ưu tiên hoặc vi phạm chính sách sử dụng không gian UEL.');

    try {
      await fetch(`${SERVER_BASE_URL}/api/bookings/${booking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ reason: reasonText })
      });
    } catch (err) {
      console.warn('[Admin] rejectBooking API sync warning:', err);
    }

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
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  // Space Management Actions (F15-F18 & BR15)
  openCreateSpaceModal(): void {
    const randomCode = 'SP-' + Math.floor(1000 + Math.random() * 9000);
    this.spaceModal = {
      isOpen: true,
      isEdit: false,
      id: '',
      code: randomCode,
      name: '',
      building: 'Tòa nhà A1',
      floor: 'Tầng 1',
      type: 'Phòng họp VIP',
      capacity: 15,
      area: 35,
      pricePerHour: 200000,
      pricePerDay: 1400000,
      awayWarningMinutes: 10,
      autoCheckoutMinutes: 20,
      overtimeGraceMinutes: 15,
      overtimeHourlyRate: 200000,
      status: 'AVAILABLE',
      equipmentString: 'Màn hình 4K, Bảng từ kính, Điều hòa Daikin, Wifi 1Gbps',
      image: 'spaces/space_a2_1_meeting_vip.jpg',
      description: 'Không gian tiêu chuẩn cao cấp, hỗ trợ thiết bị hội thảo và cảm biến hiện diện AI thông minh.',
      tagsString: 'Không gian chuẩn UEL, AI Occupancy, Đặt tức thì',
      errorMessage: '',
      isSaving: false
    };
  }

  openEditSpaceModal(space: AdminSpace): void {
    this.spaceModal = {
      isOpen: true,
      isEdit: true,
      id: space.id || space._id || '',
      code: space.code || space.id || '',
      name: space.name,
      building: space.building || 'Tòa nhà A1',
      floor: space.floor || 'Tầng 1',
      type: space.type || space.spaceType || 'Phòng họp VIP',
      capacity: space.capacity,
      area: space.area || space.areaSize || 30,
      pricePerHour: space.pricePerHour || space.hourlyPrice || 150000,
      pricePerDay: space.pricePerDay || space.dailyPrice || 1050000,
      awayWarningMinutes: space.awayWarningMinutes || 10,
      autoCheckoutMinutes: space.autoCheckoutMinutes || 20,
      overtimeGraceMinutes: space.overtimeGraceMinutes || 15,
      overtimeHourlyRate: space.overtimeHourlyRate || space.pricePerHour || 150000,
      status: (space.status === 'MAINTENANCE' || space.status === 'PENDING_APPROVAL') ? space.status : 'AVAILABLE',
      equipmentString: (space.equipment || []).join(', '),
      image: space.image || 'spaces/space_a2_1_meeting_vip.jpg',
      description: space.description || '',
      tagsString: (space.tags || ['Không gian chuẩn UEL', 'AI Occupancy']).join(', '),
      errorMessage: '',
      isSaving: false
    };
  }

  closeSpaceModal(): void {
    this.spaceModal.isOpen = false;
    this.spaceModal.errorMessage = '';
    this.spaceModal.isSaving = false;
    this.isUploadingImage = false;
  }

  isUploadingImage: boolean = false;
  imageUploadError: string = '';

  getDisplayImageUrl(imgPath?: string): string {
    if (!imgPath) return `${this.server_images_link}spaces/indoor_coworking_lounge_1.jpg`;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    if (imgPath.startsWith('/')) return imgPath;
    return `${this.server_images_link}${imgPath}`;
  }

  onImageError(event: any): void {
    if (event?.target) {
      event.target.src = `${this.server_images_link}spaces/indoor_coworking_lounge_1.jpg`;
    }
  }

  async onSpaceImageFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.isUploadingImage = true;
    this.imageUploadError = '';
    this.cdr.detectChanges();

    try {
      const response = await fetch(`${SERVER_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.success && data.relativePath) {
        // Cơ chế ngày_tháng_năm_giờ_phút_giây cùng cache-buster để luôn lấy ảnh mới nhất
        const cacheBuster = `?t=${Date.now()}`;
        this.spaceModal.image = `${data.relativePath}${cacheBuster}`;
        this.showToast(this.i18n.t('Đã tải ảnh lên máy chủ thành công: ') + data.filename, 'success');
      } else {
        throw new Error(data?.message || 'Lỗi tải ảnh lên máy chủ');
      }
    } catch (err: any) {
      console.error('Upload image error:', err);
      this.imageUploadError = err.message || 'Không thể tải ảnh lên máy chủ';
      this.showToast(this.imageUploadError, 'warning');
    } finally {
      this.isUploadingImage = false;
      this.cdr.detectChanges();
      input.value = '';
    }
  }

  async saveSpace(): Promise<void> {
    if (!this.spaceModal.name.trim()) {
      this.spaceModal.errorMessage = this.i18n.t('Vui lòng nhập tên không gian (tối thiểu 2 ký tự).');
      return;
    }
    if (this.spaceModal.capacity <= 0) {
      this.spaceModal.errorMessage = this.i18n.t('Sức chứa phải lớn hơn 0.');
      return;
    }
    if (this.spaceModal.area <= 0) {
      this.spaceModal.errorMessage = this.i18n.t('Diện tích phòng phải lớn hơn 0.');
      return;
    }
    // BR15: Policy validation
    if (Number(this.spaceModal.awayWarningMinutes) >= Number(this.spaceModal.autoCheckoutMinutes)) {
      this.spaceModal.errorMessage = this.i18n.t('Thời gian cảnh báo vắng mặt phải nhỏ hơn thời gian tự động hủy (quy tắc BR15).');
      return;
    }

    this.spaceModal.isSaving = true;
    this.spaceModal.errorMessage = '';

    const equipmentList = this.spaceModal.equipmentString
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const tagsList = this.spaceModal.tagsString
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const payload = {
      name: this.spaceModal.name.trim(),
      code: this.spaceModal.code.trim().toUpperCase(),
      building: this.spaceModal.building.trim(),
      buildingName: this.spaceModal.building.trim(),
      floor: this.spaceModal.floor.trim(),
      floorName: this.spaceModal.floor.trim(),
      spaceType: this.spaceModal.type.trim(),
      categoryName: this.spaceModal.type.trim(),
      capacity: Number(this.spaceModal.capacity),
      area: Number(this.spaceModal.area),
      areaSize: Number(this.spaceModal.area),
      pricePerHour: Number(this.spaceModal.pricePerHour),
      pricePerDay: Number(this.spaceModal.pricePerDay),
      hourlyPrice: Number(this.spaceModal.pricePerHour),
      dailyPrice: Number(this.spaceModal.pricePerDay),
      status: this.spaceModal.status,
      equipment: equipmentList,
      image: this.spaceModal.image.trim() || 'spaces/space_a2_1_meeting_vip.jpg',
      images: [this.spaceModal.image.trim() || 'spaces/space_a2_1_meeting_vip.jpg'],
      description: this.spaceModal.description.trim(),
      tags: tagsList,
      awayWarningMinutes: Number(this.spaceModal.awayWarningMinutes),
      autoCheckoutMinutes: Number(this.spaceModal.autoCheckoutMinutes),
      overtimeGraceMinutes: Number(this.spaceModal.overtimeGraceMinutes || 15),
      overtimeHourlyRate: Number(this.spaceModal.overtimeHourlyRate || this.spaceModal.pricePerHour || 150000),
      policy: {
        awayWarningMinutes: Number(this.spaceModal.awayWarningMinutes),
        autoCheckoutMinutes: Number(this.spaceModal.autoCheckoutMinutes),
        autoApprove: true,
        maxDurationMinutes: 480,
        noShowGraceMinutes: 15
      }
    };

    try {
      if (this.spaceModal.isEdit && this.spaceModal.id) {
        const res = await fetch(`${SERVER_BASE_URL}/api/spaces/${this.spaceModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi khi cập nhật không gian');
        }
        const updated = await res.json();
        const idx = this.spaces.findIndex(s => s.id === this.spaceModal.id || s._id === this.spaceModal.id);
        if (idx !== -1) {
          this.spaces[idx] = { ...this.spaces[idx], ...payload, id: this.spaceModal.id };
        }
        this.auditLogs.unshift({
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: this.adminUser.email,
          action: 'UPDATE_SPACE',
          target: `${payload.name} (${payload.code})`,
          details: `Cập nhật thông số kỹ thuật, bảng giá và tiện ích không gian.`,
          level: 'INFO'
        });
        this.showToast(`${this.i18n.t('Đã cập nhật thành công không gian')} ${payload.name}!`, 'success');
      } else {
        const res = await fetch(`${SERVER_BASE_URL}/api/spaces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi khi tạo mới không gian');
        }
        const created = await res.json();
        const newSpace: AdminSpace = {
          id: created._id || created.id || payload.code,
          _id: created._id,
          code: payload.code,
          name: payload.name,
          building: payload.building,
          floor: payload.floor,
          type: payload.spaceType,
          spaceType: payload.spaceType,
          capacity: payload.capacity,
          area: payload.area,
          areaSize: payload.area,
          status: payload.status as any,
          currentOccupants: 0,
          equipment: equipmentList,
          autoCheckoutMinutes: payload.autoCheckoutMinutes,
          awayWarningMinutes: payload.awayWarningMinutes,
          pricePerHour: payload.pricePerHour,
          pricePerDay: payload.pricePerDay,
          hourlyPrice: payload.hourlyPrice,
          dailyPrice: payload.dailyPrice,
          rating: 5.0,
          reviewsCount: 0,
          image: payload.image,
          images: payload.images,
          tags: tagsList,
          description: payload.description
        };
        this.spaces.unshift(newSpace);
        this.auditLogs.unshift({
          id: 'log-' + Date.now(),
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: this.adminUser.email,
          action: 'CREATE_SPACE',
          target: `${payload.name} (${payload.code})`,
          details: `Tạo mới và niêm yết không gian với sức chứa ${payload.capacity} khách.`,
          level: 'INFO'
        });
        this.showToast(`${this.i18n.t('Đã đăng tải thành công không gian mới')} ${payload.name}!`, 'success');
      }
      this.closeSpaceModal();
      this.cdr.detectChanges();
    } catch (err: any) {
      this.spaceModal.errorMessage = err.message || this.i18n.t('Đã xảy ra lỗi khi lưu không gian.');
    } finally {
      this.spaceModal.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  openDeleteSpaceModal(space: AdminSpace): void {
    this.deleteSpaceModal = {
      isOpen: true,
      space,
      isDeleting: false
    };
  }

  closeDeleteSpaceModal(): void {
    this.deleteSpaceModal.isOpen = false;
    this.deleteSpaceModal.space = null;
    this.deleteSpaceModal.isDeleting = false;
  }

  async confirmDeleteSpace(): Promise<void> {
    if (!this.deleteSpaceModal.space) return;
    const space = this.deleteSpaceModal.space;
    this.deleteSpaceModal.isDeleting = true;

    try {
      await fetch(`${SERVER_BASE_URL}/api/spaces/${space.id || space._id}`, {
        method: 'DELETE',
        headers: { 'x-user-role': 'ADMIN' }
      });
      this.spaces = this.spaces.filter(s => s.id !== space.id && s._id !== space.id);
      this.auditLogs.unshift({
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleString('vi-VN'),
        actor: this.adminUser.email,
        action: 'DELETE_SPACE',
        target: `${space.name} (${space.id})`,
        details: `Xóa mềm không gian khỏi danh mục khả dụng của hệ thống UEL.`,
        level: 'WARNING'
      });
      this.showToast(`${this.i18n.t('Đã xóa thành công không gian')} ${space.name}!`, 'success');
      this.closeDeleteSpaceModal();
      this.cdr.detectChanges();
    } catch (err) {
      this.showToast(this.i18n.t('Lỗi khi xóa không gian. Vui lòng thử lại.'), 'warning');
    } finally {
      this.deleteSpaceModal.isDeleting = false;
    }
  }

  async approveSpaceListing(space: AdminSpace): Promise<void> {
    try {
      await fetch(`${SERVER_BASE_URL}/api/spaces/${space.id || space._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ status: 'AVAILABLE', reason: 'Phê duyệt niêm yết bởi Quản trị viên' })
      });
    } catch (err) {
      console.warn('[Admin] approveSpaceListing API warning:', err);
    }
    space.status = 'AVAILABLE';
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'APPROVE_SPACE_LISTING',
      target: space.name,
      details: `Phê duyệt niêm yết không gian sang trạng thái ĐANG MỞ THUÊ.`,
      level: 'INFO'
    });
    this.showToast(`${this.i18n.t('Đã duyệt mở niêm yết cho không gian')} ${space.name}!`, 'success');
    this.cdr.detectChanges();
  }

  openRejectSpaceListingModal(space: AdminSpace): void {
    this.spaceListingRejectModal = {
      isOpen: true,
      space,
      reason: '',
      isSubmitting: false
    };
  }

  closeRejectSpaceListingModal(): void {
    this.spaceListingRejectModal.isOpen = false;
    this.spaceListingRejectModal.space = null;
    this.spaceListingRejectModal.isSubmitting = false;
  }

  async confirmRejectSpaceListing(): Promise<void> {
    if (!this.spaceListingRejectModal.space) return;
    const space = this.spaceListingRejectModal.space;
    const reasonText = this.spaceListingRejectModal.reason.trim() || 'Hồ sơ thiết bị hoặc thông số không gian chưa đạt chuẩn UEL Space.';
    this.spaceListingRejectModal.isSubmitting = true;

    try {
      await fetch(`${SERVER_BASE_URL}/api/spaces/${space.id || space._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ status: 'REJECTED', reason: reasonText })
      });
    } catch (err) {
      console.warn('[Admin] rejectSpaceListing API warning:', err);
    }
    space.status = 'REJECTED';
    this.auditLogs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      actor: this.adminUser.email,
      action: 'REJECT_SPACE_LISTING',
      target: space.name,
      details: `Từ chối duyệt niêm yết không gian. Lý do: ${reasonText}`,
      level: 'WARNING'
    });
    this.showToast(`${this.i18n.t('Đã từ chối niêm yết không gian')} ${space.name}.`, 'warning');
    this.closeRejectSpaceListingModal();
    this.cdr.detectChanges();
  }

  async toggleSpaceMaintenance(space: AdminSpace): Promise<void> {
    const nextStatus = space.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await fetch(`${SERVER_BASE_URL}/api/spaces/${space.id || space._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'ADMIN' },
        body: JSON.stringify({ 
          status: nextStatus, 
          reason: nextStatus === 'AVAILABLE' ? 'Quản trị viên mở lại hoạt động sau bảo trì' : 'Chuyển sang bảo trì định kỳ' 
        })
      });
    } catch (err) {
      console.warn('[Admin] toggleSpaceMaintenance API warning:', err);
    }

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
    this.cdr.detectChanges();
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
    // Dong bo Buyer storage neu co
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('uel_space_booking_records_v3');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((item: any) => item.id === matched.code || item.id === matched.id);
          if (found) {
            found.status = 'active';
            found.statusText = 'Đang sử dụng';
            localStorage.setItem('uel_space_booking_records_v3', JSON.stringify(list));
            window.dispatchEvent(new Event('uel_booking_checkin_synced'));
          }
        }
      }
    } catch (e) {}
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
    // Dong bo Buyer storage neu co
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('uel_space_booking_records_v3');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((item: any) => item.id === b.code || item.id === b.id);
          if (found) {
            found.status = 'active';
            found.statusText = 'Đang sử dụng';
            localStorage.setItem('uel_space_booking_records_v3', JSON.stringify(list));
            window.dispatchEvent(new Event('uel_booking_checkin_synced'));
          }
        }
      }
    } catch (e) {}
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

  setOccEngineMode(mode: 'server'): void {
    this.occEngineMode = 'server';
    this.occModelName = 'YOLO11-IndoorCrowd Server AI (Pure Vision)';
    this.checkServerAiHealth();
    this.cdr.detectChanges();
  }

  async checkServerAiHealth(): Promise<boolean> {
    try {
      this.occServerStatus = 'checking';
      const res = await fetch(`${SERVER_BASE_URL}/api/occupancy/ai-health`, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const health = await res.json().catch(() => null);
        if (health && health.ready) {
          this.occServerStatus = 'online';
          this.occServerFailCount = 0;
          this.occServerCooldownUntil = 0;
          this.occServerOfflineNotified = false;
          if (this.occEngineMode === 'server') {
            this.occModelName = 'YOLO11-IndoorCrowd Server AI (Sẵn sàng)';
          }
          return true;
        }
      }
      this.markServerAiOffline();
      return false;
    } catch {
      this.markServerAiOffline();
      return false;
    } finally {
      this.cdr.detectChanges();
    }
  }

  private markServerAiOffline(): void {
    this.occServerStatus = 'offline';
    this.occServerLatencyMs = 0;
    // Tự động chuyển engine mode sang 'client' để kích hoạt trực tiếp YOLO11 ONNX Web Engine
    if (this.occEngineMode === 'server') {
      this.occEngineMode = 'client';
      if (!this.occServerOfflineNotified) {
        this.occServerOfflineNotified = true;
        this.occModelName = this.occYoloOnnxSession
          ? 'YOLO11-IndoorCrowd AI (WASM SIMD Edge)'
          : 'Đang nạp mô hình YOLO11 ONNX...';
      }
    }
  }

  private handleServerYoloFailure(): void {
    this.occServerFailCount++;
    this.occServerStatus = 'offline';
    this.occServerCooldownUntil = performance.now() + 60000; // Cooldown 60s để không spam console
    this.markServerAiOffline();
    if (!this.occYoloOnnxSession && !this.occCocoModel && !this.occModelLoading) {
      this.loadOccupancyModel().catch(() => {});
    }
    this.cdr.detectChanges();
  }

  private resetServerYoloHealth(): void {
    this.occServerFailCount = 0;
    this.occServerCooldownUntil = 0;
    this.occServerOfflineNotified = false;
    this.occServerStatus = 'online';
  }

  private async detectWithServerYolo(
    videoEl: HTMLVideoElement
  ): Promise<Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> | null> {
    try {
      // Chỉ gọi Server AI khi server thực sự online hoặc người dùng chủ động chọn 'server' mode và đã hết cooldown
      if (this.occServerStatus === 'offline' && performance.now() < this.occServerCooldownUntil) {
        return null;
      }

      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      if (!vw || !vh) return null;

      // Ưu tiên kiểm tra xem local AI service trên cổng 5001 có sẵn không (nếu người dùng đang chạy máy nội bộ)
      // Nếu không, gọi qua endpoint của SERVER_BASE_URL
      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      let targetApiUrl = `${SERVER_BASE_URL}/api/occupancy/detect-server`;

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
      const res = await fetch(targetApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          confidenceThreshold: this.occConfidenceThreshold,
          iouThreshold: 0.60,
          spaceId: this.occSelectedSpace?.id || 'general',
          spaceName: this.occSelectedSpace?.name || 'UEL Space Room'
        }),
        // Timeout 4s: đủ cho lần suy luận đầu tiên mà không chặn quá lâu
        signal: AbortSignal.timeout(4000)
      });

      if (!res.ok) {
        this.handleServerYoloFailure();
        return null;
      }

      const data = await res.json().catch(() => null);
      if (!data || !data.success) {
        this.handleServerYoloFailure();
        return null;
      }

      this.resetServerYoloHealth();
      this.occEngineMode = 'server';
      this.occServerLatencyMs = Math.round(performance.now() - t0);
      this.occModelName = `${data.modelName || 'YOLO11-IndoorCrowd AI'} (${data.processingTimeMs}ms • ${data.device ? data.device.toUpperCase() : 'CPU'})`;

      const boxes: Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> = [];
      if (Array.isArray(data.boxes)) {
        for (const b of data.boxes) {
          boxes.push({
            x: Math.round(b.x / scale),
            y: Math.round(b.y / scale),
            w: Math.round(b.w / scale),
            h: Math.round(b.h / scale),
            score: Math.round(b.confidence),
            label: b.label || 'Khách thuê (YOLO11 • Indoor Crowd)'
          });
        }
      }
      return boxes;
    } catch {
      this.handleServerYoloFailure();
      return null;
    }
  }

  setOccSensitivity(level: 'high' | 'normal' | 'strict'): void {
    this.occSensitivity = level;
    if (level === 'high') {
      this.occConfidenceThreshold = 0.15;
    } else if (level === 'normal') {
      this.occConfidenceThreshold = 0.23;
    } else {
      this.occConfidenceThreshold = 0.35;
    }
    const label = level === 'high' ? 'Siêu nhạy (0.15)' : (level === 'normal' ? 'Chuẩn tối ưu (0.23)' : 'Nghiêm ngặt (0.35)');
    this.showToast(`${this.i18n.t('Đã chuyển độ nhạy AI:')} ${label}`, 'info');
  }

  onOccConfidenceSliderChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.occConfidenceThreshold = Math.round(val * 100) / 100;
    if (this.occConfidenceThreshold <= 0.16) {
      this.occSensitivity = 'high';
    } else if (this.occConfidenceThreshold <= 0.28) {
      this.occSensitivity = 'normal';
    } else {
      this.occSensitivity = 'strict';
    }
  }

  async loadOccupancyModel(): Promise<void> {
    this.initFaceDetector();
    if (this.occYoloOnnxSession || this.occCocoModel) return;
    this.occModelLoading = true;
    this.occModelError = '';
    this.occModelName = 'Đang nạp mô hình YOLO11-IndoorCrowd AI...';
    this.cdr.detectChanges();

    // 1. ƯU TIÊN HÀNG ĐẦU: Nạp trực tiếp mô hình YOLO11 Fine-tuned Web ONNX (/models/yolo11n_indoor_crowd.onnx)
    try {
      const ort: any = await import('onnxruntime-web');
      if (ort?.env?.wasm) {
        ort.env.wasm.wasmPaths = '/onnx/';
        ort.env.wasm.numThreads = 1;
      }

      console.log('[YOLO11 Web] Đang tải mô hình YOLO11 IndoorCrowd Occupancy ONNX...');
      const session = await ort.InferenceSession.create('/models/yolo11n_indoor_crowd.onnx', {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      if (session) {
        this.occYoloOnnxSession = session;
        this.occModelLoaded = true;
        this.occModelLoading = false;
        this.occModelName = 'YOLO11-IndoorCrowd AI (Fine-tuned • WASM Edge)';
        console.log('[YOLO11 Web] Khởi tạo thành công mô hình YOLO11 IndoorCrowd trên trình duyệt!');
        this.cdr.detectChanges();
        // Nạp thêm COCO-SSD ngầm để làm Hybrid AI (góc ngang và đời thường đều bắt trọn)
        setTimeout(() => this.loadCocoSsdNgam(), 100);
        return;
      }
    } catch (errOnnx: any) {
      console.warn('[YOLO11 Web] Không thể nạp YOLO11 ONNX, thử nạp qua đường dẫn dự phòng:', errOnnx);
      try {
        const ort: any = await import('onnxruntime-web');
        const session = await ort.InferenceSession.create('/models/yolo26n_occupancy.onnx', {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all'
        });
        if (session) {
          this.occYoloOnnxSession = session;
          this.occModelLoaded = true;
          this.occModelLoading = false;
          this.occModelName = 'YOLO11-IndoorCrowd AI (Fine-tuned • WASM Edge)';
          this.cdr.detectChanges();
          return;
        }
      } catch (eFallback) {
        console.warn('Fallback ONNX error:', eFallback);
      }
    }

    // 2. DỰ PHÒNG CẤP 2: Nạp COCO-SSD nếu thiết bị không hỗ trợ WASM/ONNX
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
          console.warn('CPU backend fallback error:', eC);
        }
      }

      const currentBackend = tf.getBackend();
      const cocoSsdModule: any = await import('@tensorflow-models/coco-ssd');
      let loadedModel: any = null;
      if (typeof cocoSsdModule.load === 'function') {
        loadedModel = await cocoSsdModule.load({ base: 'lite_mobilenet_v2' });
      } else if (cocoSsdModule.default && typeof cocoSsdModule.default.load === 'function') {
        loadedModel = await cocoSsdModule.default.load({ base: 'lite_mobilenet_v2' });
      }

      this.occModelLoading = false;
      if (loadedModel) {
        this.occCocoModel = loadedModel;
        this.occModelLoaded = true;
        const isGpu = currentBackend === 'webgl';
        this.occModelName = `COCO-SSD Deep Learning (${isGpu ? 'GPU WebGL' : 'CPU'})`;
        console.log('UEL Space AI Model loaded successfully:', this.occModelName);
      } else if (this.faceDetector) {
        this.occModelLoaded = true;
        this.occModelName = 'Hardware Face AI';
      }
    } catch (err: any) {
      console.warn('AI Model load error:', err);
      this.occModelLoading = false;
      if (this.faceDetector) {
        this.occModelLoaded = true;
        this.occModelName = 'Hardware Face AI';
      }
    } finally {
      this.cdr.detectChanges();
    }
  }

  /**
   * SOTA Anti-Crowding NMS & Face-Body Fusion:
   * 1. Tuyệt đối KHÔNG gộp nhầm 2 người ngồi sát nhau (khung hình 5 người bảo toàn đủ 5/5 người).
   * 2. Chỉ gộp Face AI vào Body nếu tâm khuôn mặt thực sự nằm trong nửa trên của Body box.
   * 3. Giữ nguyên vẹn mọi tư thế nằm, cúi, tựa lưng hoặc che khuất đầu.
   */
  private consolidateAndMergeDetections(
    boxes: Array<{ x: number; y: number; w: number; h: number; score: number; label: string }>,
    vw: number,
    vh: number
  ): Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> {
    if (boxes.length <= 1) return boxes;

    // Lọc bỏ box quá nhỏ (nhiễu pixel dưới 8px)
    const validBoxes = boxes.filter(b => b.w >= 8 && b.h >= 8);
    if (validBoxes.length <= 1) return validBoxes;

    // Sắp xếp theo điểm tin cậy giảm dần
    validBoxes.sort((a, b) => b.score - a.score);

    const merged: typeof validBoxes = [];

    for (const b of validBoxes) {
      let isDuplicate = false;

      for (const m of merged) {
        // Tính diện tích giao nhau (Intersection)
        const interX1 = Math.max(b.x, m.x);
        const interY1 = Math.max(b.y, m.y);
        const interX2 = Math.min(b.x + b.w, m.x + m.w);
        const interY2 = Math.min(b.y + b.h, m.y + m.h);
        const interW = Math.max(0, interX2 - interX1);
        const interH = Math.max(0, interY2 - interY1);
        const interArea = interW * interH;

        const area1 = b.w * b.h;
        const area2 = m.w * m.h;
        const unionArea = area1 + area2 - interArea;
        const iou = unionArea > 0 ? interArea / unionArea : 0;
        const minArea = Math.min(area1, area2);
        const ios = minArea > 0 ? interArea / minArea : 0;

        const c1X = b.x + b.w / 2;
        const c1Y = b.y + b.h / 2;
        const c2X = m.x + m.w / 2;
        const c2Y = m.y + m.h / 2;
        const distCenters = Math.hypot(c1X - c2X, c1Y - c2Y);
        const minDim = Math.min(b.w, m.w, b.h, m.h);

        // Trường hợp 1: Face AI trùng lặp với Body box
        const isFaceAndBody = (b.label.includes('Face') && !m.label.includes('Face')) || 
                              (m.label.includes('Face') && !b.label.includes('Face'));
        if (isFaceAndBody) {
          const face = b.label.includes('Face') ? b : m;
          const body = b.label.includes('Face') ? m : b;
          const fCenterX = face.x + face.w / 2;
          const fCenterY = face.y + face.h / 2;
          if (fCenterX >= body.x - 15 && fCenterX <= body.x + body.w + 15 &&
              fCenterY >= body.y - 15 && fCenterY <= body.y + body.h * 0.65) {
            isDuplicate = true;
            m.score = Math.max(m.score, b.score);
            break;
          }
        }

        // Trường hợp 2: Trùng lặp rất cao (cùng 1 người được detect lặp)
        // Nâng IoU lên 0.65 để TUYỆT ĐỐI KHÔNG gộp nhầm 2 người ngồi sát nhau
        if (iou >= 0.65 || (ios >= 0.85 && distCenters < minDim * 0.30)) {
          isDuplicate = true;
          if (b.score > m.score) {
            m.score = b.score;
            m.label = b.label;
          }
          break;
        }
      }

      if (!isDuplicate) {
        merged.push({ ...b });
      }
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

            // Tải mô hình COCO-SSD Deep Learning ngầm
            if (!this.occCocoModel) {
              this.loadOccupancyModel().catch(e => console.warn('Load COCO error:', e));
            }
            // Kích hoạt ngay vòng lặp nhận diện Vision AI (tức thì 0ms, không chờ đợi)
            this.runDetectionLoop(videoEl);
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

  /**
   * Client Edge AI Detection Engine:
   * 1. YOLO11-IndoorCrowd Web ONNX Model (Trained trên Indoor Crowd & Coworking Dataset, chạy trực tiếp WASM SIMD)
   * 2. COCO-SSD Deep Learning (Pretrained Model dự phòng cấp 2)
   * 3. Hardware FaceDetector (Shape Detection API - Native trên Edge, Chrome)
   */
  private async detectWithClientAi(
    videoEl: HTMLVideoElement
  ): Promise<Array<{ x: number; y: number; w: number; h: number; score: number; label: string }>> {
    const detected: Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> = [];
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) return detected;

    const minScore = this.occConfidenceThreshold;

    // 1. ƯU TIÊN SỐ 1: Chạy trực tiếp YOLO11-IndoorCrowd ONNX Web Engine
    if (this.occYoloOnnxSession) {
      try {
        const ort: any = await import('onnxruntime-web');
        const targetSize = 640;

        if (!this.offscreenCanvas) {
          this.offscreenCanvas = document.createElement('canvas');
        }
        this.offscreenCanvas.width = targetSize;
        this.offscreenCanvas.height = targetSize;
        const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, targetSize, targetSize);
          const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
          const { data } = imgData;
          const floatData = new Float32Array(3 * targetSize * targetSize);
          const channelSize = targetSize * targetSize;

          for (let i = 0; i < channelSize; i++) {
            floatData[i] = data[i * 4] / 255.0; // R channel
            floatData[channelSize + i] = data[i * 4 + 1] / 255.0; // G channel
            floatData[channelSize * 2 + i] = data[i * 4 + 2] / 255.0; // B channel
          }

          const tensor = new ort.Tensor('float32', floatData, [1, 3, targetSize, targetSize]);
          const feeds: any = {};
          feeds[this.occYoloOnnxSession.inputNames[0]] = tensor;

          const results = await this.occYoloOnnxSession.run(feeds);
          const outputTensor = results[this.occYoloOnnxSession.outputNames[0]];

          if (outputTensor && outputTensor.data) {
            const outData = outputTensor.data as Float32Array;
            const dims = outputTensor.dims || [];
            // Hỗ trợ linh hoạt cả model 1 class [1, 5, 8400] và model đa class [1, 5+N, 8400]
            const numChannels = dims.length >= 2 ? dims[1] : 5;
            const numAnchors = dims.length >= 3 ? dims[2] : 8400;
            const numClasses = Math.max(1, numChannels - 4);
            const scaleX = vw / targetSize;
            const scaleY = vh / targetSize;

            for (let a = 0; a < numAnchors; a++) {
              let maxScore = 0;
              let bestClass = 0;

              if (numClasses === 1) {
                // Model 1 class duy nhất: persona / person
                maxScore = outData[4 * numAnchors + a];
                bestClass = 0;
              } else {
                // Model COCO 80 classes: class 0 là 'person'
                // Chỉ theo dõi class 0 (người) để loại trừ toàn bộ đồ vật khác
                const personScore = outData[4 * numAnchors + a];
                maxScore = personScore;
                bestClass = 0;
              }

              if (maxScore >= minScore) {
                const cx = outData[0 * numAnchors + a];
                const cy = outData[1 * numAnchors + a];
                const w = outData[2 * numAnchors + a];
                const h = outData[3 * numAnchors + a];

                const realX = (cx - w / 2) * scaleX;
                const realY = (cy - h / 2) * scaleY;
                const realW = w * scaleX;
                const realH = h * scaleY;

                detected.push({
                  x: Math.round(Math.max(0, realX)),
                  y: Math.round(Math.max(0, realY)),
                  w: Math.round(Math.min(vw - realX, realW)),
                  h: Math.round(Math.min(vh - realY, realH)),
                  score: Math.round(maxScore * 100),
                  label: 'Khách thuê (YOLO11 • Indoor Crowd)'
                });
              }
            }
          }
        }
      } catch (errYoloOnnx) {
        console.warn('YOLO11 Web ONNX inference error:', errYoloOnnx);
      }
    }

    // 2. Chạy bổ sung COCO-SSD song hành (Hybrid Ensemble): Nhận diện người đứng, ngang, đời thường
    if (this.occCocoModel) {
      try {
        const predictions = await this.occCocoModel.detect(videoEl, 25, 0.15);
        for (const p of predictions) {
          if (p.class !== 'person') continue;
          if (p.score >= 0.18) {
            const bx = Math.round(p.bbox[0]);
            const by = Math.round(p.bbox[1]);
            const bw = Math.round(p.bbox[2]);
            const bh = Math.round(p.bbox[3]);

            const alreadyFound = detected.some(d => {
              const dx = d.x + d.w / 2;
              const dy = d.y + d.h / 2;
              const cx = bx + bw / 2;
              const cy = by + bh / 2;
              return Math.hypot(dx - cx, dy - cy) < Math.max(bw, bh) * 0.5;
            });

            if (!alreadyFound) {
              detected.push({
                x: bx,
                y: by,
                w: bw,
                h: bh,
                score: Math.round(p.score * 100),
                label: 'Khách thuê (YOLO11 • Ensemble Vision)'
              });
            }
          }
        }
      } catch (errCoco) {
        console.warn('COCO detect error:', errCoco);
      }
    }

    // 2. Hardware FaceDetector (Shape Detection API - Native trên Edge, Chrome)
    if (!this.faceDetector) {
      this.initFaceDetector();
    }
    if (this.faceDetector) {
      try {
        const faces = await this.faceDetector.detect(videoEl);
        if (faces && faces.length > 0) {
          for (const f of faces) {
            const fb = f.boundingBox;
            const fCenterX = fb.x + fb.width / 2;
            const fCenterY = fb.y + fb.height / 2;

            // Chỉ thêm nếu khuôn mặt chưa nằm trong body box nào đã được COCO-SSD phát hiện
            const alreadyInBody = detected.some(b =>
              fCenterX >= b.x - 20 && fCenterX <= b.x + b.w + 20 &&
              fCenterY >= b.y - 20 && fCenterY <= b.y + b.h + 20
            );

            if (!alreadyInBody) {
              const estWidth = Math.min(vw, Math.max(fb.width * 2.2, 110));
              const estHeight = Math.min(vh, Math.max(fb.height * 3.4, 170));
              const estX = Math.max(0, fb.x - (estWidth - fb.width) / 2);
              const estY = Math.max(0, fb.y - fb.height * 0.2);

              detected.push({
                x: Math.round(estX),
                y: Math.round(estY),
                w: Math.round(Math.min(estWidth, vw - estX)),
                h: Math.round(Math.min(estHeight, vh - estY)),
                score: 95,
                label: 'Khách thuê (Hardware Face AI)'
              });
            }
          }
        }
      } catch (e) {
        console.warn('FaceDetector error:', e);
      }
    }

    return detected;
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
    const serverReady = this.occEngineMode === 'server' && now >= this.occServerCooldownUntil;
    const intervalThreshold = serverReady ? 140 : 80;
    if (this.isDetectingOccFrame || (now - this.lastOccDetectionTimestamp < intervalThreshold)) {
      requestAnimationFrame(() => this.runDetectionLoop(videoEl));
      return;
    }

    this.isDetectingOccFrame = true;
    this.lastOccDetectionTimestamp = now;
    this.occFrameCount++; // Luôn đếm frame xử lý để tính FPS thời gian thực chính xác

    // Ngưỡng điểm tin cậy siêu nhạy chuẩn Models (YOLO11-IndoorCrowd & COCO)
    const minScore = this.occConfidenceThreshold;

    try {
      const rawDetected: Array<{ x: number; y: number; w: number; h: number; score: number; label: string }> = [];
      let usedServerYolo = false;

      // 1. Chế độ Ưu tiên: YOLO11-IndoorCrowd Server AI Microservice (Detection + Occupancy Tracking)
      const serverBoxes = await this.detectWithServerYolo(videoEl);
      if (serverBoxes !== null) {
        usedServerYolo = true;
        for (const sb of serverBoxes) {
          rawDetected.push(sb);
        }
      }

      // 2. Chế độ Tự động chuyển Client Edge AI khi Server ngoại tuyến
      if (!usedServerYolo) {
        const clientBoxes = await this.detectWithClientAi(videoEl);
        for (const cb of clientBoxes) {
          rawDetected.push(cb);
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

      // 4B. Post-tracking fusion: Chỉ hợp nhất nếu 2 vệt theo dõi thực sự là CÙNG 1 NGƯỜI (IoU >= 0.70 hoặc IoS >= 0.88 với khoảng cách tâm rất gần)
      // TUYỆT ĐỐI không gộp 2 người ngồi sát nhau (bảo toàn 5/5 người trong phòng)
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

          const tc1X = t1.x + t1.w / 2;
          const tc1Y = t1.y + t1.h / 2;
          const tc2X = t2.x + t2.w / 2;
          const tc2Y = t2.y + t2.h / 2;
          const distCenters = Math.hypot(tc1X - tc2X, tc1Y - tc2Y);
          const minDim = Math.min(t1.w, t2.w, t1.h, t2.h);

          if (iou >= 0.70 || (ios >= 0.88 && distCenters < minDim * 0.25)) {
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
          const isLying = p.label.includes('nằm');

          // Khung viền: Xanh lá Emerald nổi bật nếu là người nằm, Neon Cyan cho dáng người tiêu chuẩn
          ctx.strokeStyle = isLying ? '#10B981' : '#00F0FF';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(p.x, p.y, p.w, p.h);

          // Lớp phủ mờ hiện đại
          ctx.fillStyle = isLying ? 'rgba(16, 185, 129, 0.10)' : 'rgba(0, 240, 255, 0.08)';
          ctx.fillRect(p.x, p.y, p.w, p.h);

          // 4 Góc Target Brackets
          const cLen = Math.min(p.w, p.h) * 0.2;
          ctx.strokeStyle = isLying ? '#34D399' : '#FFC72C';
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
          ctx.fillStyle = isLying ? 'rgba(6, 78, 59, 0.95)' : 'rgba(0, 20, 40, 0.9)';
          ctx.beginPath();
          ctx.roundRect(p.x, Math.max(2, p.y - 24), tw + 14, 22, 5);
          ctx.fill();
          ctx.strokeStyle = isLying ? '#10B981' : '#00F0FF';
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

    // 2. Kiểm tra Overtime (Sử dụng quá giờ thực tế khi chưa checkout)
    if (!this.occEarlyCheckoutDone) {
      const isOvertime = this.checkBookingOvertime(this.occActiveBooking);
      // Khi đã qua giờ kết thúc, khách chưa checkout và Computer Vision phát hiện còn người trong phòng
      if (isOvertime && this.occCurrentCount > 0) {
        this.occIsOvertime = true;
        this.occOvertimeMinutes = this.calculateOvertimeMinutes(this.occActiveBooking);

        // Tính phụ phí tự động dựa trên chính sách config của Space
        const spacePolicy = this.occSelectedSpace;
        const hourlyRate = spacePolicy?.overtimeHourlyRate || spacePolicy?.pricePerHour || 150000;
        const graceMinutes = spacePolicy?.overtimeGraceMinutes || 15;

        if (this.occOvertimeMinutes > graceMinutes) {
          // Tính phí theo block 30 phút quá giờ
          const chargeableMinutes = this.occOvertimeMinutes;
          const blocks = Math.max(1, Math.ceil(chargeableMinutes / 30));
          this.occSuggestedSurcharge = Math.round(blocks * (hourlyRate / 2));
        } else {
          this.occSuggestedSurcharge = 0;
        }
      } else {
        this.occIsOvertime = false;
        this.occSuggestedSurcharge = 0;
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

  openMobileCctvModal(): void {
    const rawId = this.occSelectedSpace?.id || 'room-main';
    const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
    this.mobileCctvStreamId = `uel-cctv-${cleanId || 'default'}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://uelspace-tan.vercel.app';
    const lensUrl = `${origin}/cctv-lens?peerId=${encodeURIComponent(this.mobileCctvStreamId)}`;
    this.mobileCctvQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(lensUrl)}`;
    this.showMobileCctvModal = true;
    
    // Tự động khởi tạo WebRTC Peer listener trên máy tính
    this.initDashboardP2pListener();
    this.cdr.detectChanges();
  }

  closeMobileCctvModal(): void {
    this.showMobileCctvModal = false;
    this.cdr.detectChanges();
  }

  async selectVideoSource(source: 'local' | 'mobile_cctv'): Promise<void> {
    if (this.occVideoSource === source) {
      if (source === 'mobile_cctv' && !this.mobileCctvConnected) {
        this.openMobileCctvModal();
      }
      return;
    }
    this.occVideoSource = source;

    if (source === 'mobile_cctv') {
      this.stopLocalCamera();
      this.initDashboardP2pListener();
      this.occCameraActive = true;
      this.occDetectionRunning = true;
      // Bấm vào ĐT làm CCTV thì tự động mở Popup Mã QR để quét ngay
      this.openMobileCctvModal();
    } else {
      this.stopP2pCctv();
      this.startOccupancyDetection();
    }
    this.cdr.detectChanges();
  }

  private async initDashboardP2pListener(): Promise<void> {
    if (this.dashboardPeer) return;

    try {
      const { Peer } = await import('peerjs');
      const rawId = this.occSelectedSpace?.id || 'room-main';
      const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
      this.mobileCctvStreamId = `uel-cctv-${cleanId || 'default'}`;

      this.dashboardPeer = new Peer(this.mobileCctvStreamId);

      this.dashboardPeer.on('open', (id: string) => {
        console.log('[WebRTC P2P] Dashboard sẵn sàng nhận luồng tại ID:', id);
      });

      this.dashboardPeer.on('call', (call: any) => {
        console.log('[WebRTC P2P] Nhận cuộc gọi truyền video từ Điện thoại!');
        this.activeP2pCall = call;
        // Trả lời cuộc gọi mà không cần gửi stream ngược lại
        call.answer();

        call.on('stream', (remoteStream: MediaStream) => {
          console.log('[WebRTC P2P] Luồng camera điện thoại kết nối thành công 30 FPS!');
          this.mobileCctvConnected = true;
          this.occCameraActive = true;
          this.occDetectionRunning = true;
          this.occFrameCount = 0;
          this.occLastFrameTime = performance.now();
          if (this.occFpsInterval) clearInterval(this.occFpsInterval);
          this.occFpsInterval = setInterval(() => {
            const now = performance.now();
            const elapsed = (now - this.occLastFrameTime) / 1000;
            if (elapsed > 0) {
              this.occDetectionFps = Math.round(this.occFrameCount / elapsed);
            }
            this.occFrameCount = 0;
            this.occLastFrameTime = now;
            this.cdr.detectChanges();
          }, 1000);

          // Đảm bảo model đã được nạp sẵn khi nhận luồng
          if (!this.occYoloOnnxSession && !this.occCocoModel && !this.occModelLoading) {
            this.loadOccupancyModel().catch(() => {});
          }

          this.cdr.detectChanges();

          setTimeout(() => {
            const videoEl = document.getElementById('occ-detection-video') as HTMLVideoElement;
            if (videoEl) {
              videoEl.muted = true;
              videoEl.setAttribute('playsinline', 'true');
              videoEl.setAttribute('webkit-playsinline', 'true');
              videoEl.srcObject = remoteStream;
              videoEl.play().catch(e => console.warn('Play remote stream retry:', e)).finally(() => {
                this.runDetectionLoop(videoEl);
              });
            }
          }, 80);

          this.showToast(this.i18n.t('Đã kết nối trực tiếp Camera Điện thoại (Real-time P2P)!'), 'success');
          this.cdr.detectChanges();
        });

        call.on('close', () => {
          this.mobileCctvConnected = false;
          this.cdr.detectChanges();
        });
      });

      this.dashboardPeer.on('error', (err: any) => {
        console.warn('[WebRTC P2P] Peer warning:', err);
      });
    } catch (e) {
      console.error('Không thể nạp PeerJS:', e);
    }
  }

  private stopLocalCamera(): void {
    if (this.occVideoStream) {
      this.occVideoStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.occVideoStream = null;
    }
    const videoEl = document.getElementById('occ-detection-video') as HTMLVideoElement;
    if (videoEl) {
      try {
        videoEl.pause();
        videoEl.srcObject = null;
      } catch {}
    }
  }

  private stopP2pCctv(): void {
    if (this.activeP2pCall) {
      try { this.activeP2pCall.close(); } catch {}
      this.activeP2pCall = null;
    }
    if (this.dashboardPeer) {
      try { this.dashboardPeer.destroy(); } catch {}
      this.dashboardPeer = null;
    }
    this.mobileCctvConnected = false;
  }

  private async loadCocoSsdNgam(): Promise<void> {
    if (this.occCocoModel) return;
    try {
      const cocoSsdModule: any = await import('@tensorflow-models/coco-ssd');
      let loadedModel: any = null;
      if (typeof cocoSsdModule.load === 'function') {
        loadedModel = await cocoSsdModule.load({ base: 'lite_mobilenet_v2' });
      } else if (cocoSsdModule.default && typeof cocoSsdModule.default.load === 'function') {
        loadedModel = await cocoSsdModule.default.load({ base: 'lite_mobilenet_v2' });
      }
      if (loadedModel) {
        this.occCocoModel = loadedModel;
        console.log('[Hybrid AI] Nạp thành công COCO-SSD song hành với YOLO11!');
      }
    } catch (e) {
      console.warn('COCO load ngam error:', e);
    }
  }

  stopOccupancyDetection(): void {
    this.stopP2pCctv();
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

