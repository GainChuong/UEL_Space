import { Component, OnInit, OnDestroy, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SERVER_BASE_URL, SERVER_IMAGES_LINK } from '../../services/api-config';
import { SettingsService, UserProfile } from '../../services/settings.service';
import { SettingsModalComponent } from '../common/settings-modal/settings-modal';
import { TranslatePipe } from '../../services/translate.pipe';
import { I18nService } from '../../services/i18n.service';

export interface PlatformListing {
  id: string;
  _id?: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  type: string;
  capacity: number;
  area: number;
  hourlyPrice: number;
  dailyPrice: number;
  status: 'PENDING_APPROVAL' | 'AVAILABLE' | 'REJECTED' | 'MAINTENANCE' | 'CLOSED';
  submittedAt: string;
  seller: {
    storeName: string;
    ownerName: string;
    phone: string;
    email: string;
    verified: boolean;
  };
  image: string;
  equipment: string[];
  description: string;
  rejectionReason?: string;
  suspensionReason?: string;
  complianceChecks: {
    fireSafetyCertified: boolean;
    capacityVerified: boolean;
    equipmentInspected: boolean;
    pricingStandardCompliant: boolean;
  };
}

export interface PlatformUserAccount {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER' | 'SPACE_MANAGER';
  status: 'ACTIVE' | 'SUSPENDED';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  verifiedBadge: boolean;
  organization: string;
  storeName?: string;
  totalBookings: number;
  createdAt: string;
  businessLicenseNumber?: string;
}

export interface PlatformBookingItem {
  id: string;
  code: string;
  spaceName: string;
  building: string;
  sellerName: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone?: string;
  date: string;
  timeSlot: string;
  price: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  status: 'PENDING' | 'APPROVED' | 'IN_USE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  violationAlert?: 'OVERTIME' | 'OVERCROWDED' | 'NO_SHOW' | null;
  overtimeMinutes?: number;
  actualHeadcount?: number;
  capacity?: number;
}

export interface EscrowPayoutBatch {
  id: string;
  sellerName: string;
  sellerEmail: string;
  bankAccount: string;
  totalGross: number;
  platformFee: number;
  netPayout: number;
  completedBookingsCount: number;
  status: 'READY_TO_SETTLE' | 'SETTLED' | 'HELD_FOR_DISPUTE';
  dueTime: string;
  settledAt?: string;
}

export interface PlatformDispute {
  id: string;
  bookingCode: string;
  spaceName: string;
  customerName: string;
  customerEmail: string;
  sellerName: string;
  type: 'OVERTIME_SURCHARGE' | 'FACILITY_DAMAGE' | 'REFUND_REQUEST' | 'NO_SHOW_PENALTY';
  amount: number;
  description: string;
  status: 'OPEN' | 'PENDING_CUSTOMER_FEEDBACK' | 'RESOLVED';
  createdAt: string;
  resolution?: string;
  resolvedAt?: string;
  aiEvidence?: {
    overtimeMinutes?: number;
    headcountPeak?: number;
    emptyRoomConfirmed?: boolean;
    confidence: number;
  } | null;
}

export interface PlatformAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
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
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  server_images_link = SERVER_IMAGES_LINK;
  Math = Math;

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

  // Active Navigation Tab
  activeTab: 'overview' | 'listings' | 'kyc' | 'bookings' | 'escrow' | 'disputes' | 'audit' | 'settings' = 'overview';

  // Mobile sidebar
  isMobileSidebarOpen: boolean = false;
  isNotificationOpen: boolean = false;
  isProfileOpen: boolean = false;
  activeNotifTab: 'all' | 'unread' = 'all';

  toggleNotification(event: Event): void {
    event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
  }

  markAsRead(id: string, event: Event, link?: string): void {
    event.stopPropagation();
    this.settingsService.markAsRead(id);
    if (link) {
      this.isNotificationOpen = false;
      if (link.includes('listings') || link.includes('space')) this.activeTab = 'listings';
      else if (link.includes('kyc') || link.includes('user')) this.activeTab = 'kyc';
      else if (link.includes('booking')) this.activeTab = 'bookings';
      else if (link.includes('escrow')) this.activeTab = 'escrow';
      else if (link.includes('dispute')) this.activeTab = 'disputes';
      else this.router.navigateByUrl(link);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.settingsService.markAllAsRead();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isNotificationOpen = false;
  }

  // Search & Filter State
  searchFilter: string = '';
  listingStatusFilter: 'ALL' | 'PENDING_APPROVAL' | 'AVAILABLE' | 'REJECTED' | 'CLOSED' = 'ALL';
  kycRoleFilter: 'ALL' | 'SELLER' | 'BUYER' | 'ADMIN' | 'SPACE_MANAGER' | 'CUSTOMER' = 'ALL';
  kycStatusFilter: 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' = 'ALL';
  bookingStatusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'IN_USE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' = 'ALL';

  // Super Admin Profile
  adminProfile = {
    name: 'Quản Trị Viên Toàn Sàn UEL Space',
    email: 'admin@gmail.com',
    role: 'SUPER_ADMIN',
    avatar: 'SA',
    title: 'Platform Chief Controller',
    badge: 'MASTER KEY'
  };

  // Toast Notification
  toast: { show: boolean; message: string; type: 'success' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'success'
  };

  // Platform Metrics
  metrics = {
    gmv: 320500000,
    commissionRate: 12,
    commissionEarned: 38460000,
    escrowHolding: 89740000,
    payoutsSettled: 192300000,
    spaces: {
      total: 35,
      active: 28,
      pending: 4,
      suspended: 3
    },
    users: {
      total: 148,
      sellers: 18,
      pendingKyc: 3
    },
    bookings: {
      total: 248,
      active: 16,
      completed: 218
    },
    disputes: {
      pending: 2
    }
  };

  // Platform Listings (Spaces on Moderation)
  listings: PlatformListing[] = [
    {
      id: 'sp-mod-001',
      code: 'UEL-SP-301',
      name: 'Phòng Hội Thảo Công Nghệ Cao VIP 301',
      building: 'Khu Đô thị ĐHQG TP.HCM - Tòa A1',
      floor: 'Tầng 3',
      type: 'Hội thảo & Workshop',
      capacity: 50,
      area: 85,
      hourlyPrice: 350000,
      dailyPrice: 2400000,
      status: 'PENDING_APPROVAL',
      submittedAt: '2026-10-19T14:20:00Z',
      seller: {
        storeName: 'Innovation Hub ĐHQG Partner',
        ownerName: 'Vũ Minh Tuấn',
        phone: '0912 345 678',
        email: 'tuan.vu@dhqg-inno.vn',
        verified: true
      },
      image: 'spaces/space_a2_1_meeting_vip.jpg',
      equipment: ['Màn hình 85 inch 4K', 'Hệ thống âm thanh Shure', 'Camera Dual-Head AI Tracking', 'Bảng kính tương tác'],
      description: 'Không gian tiêu chuẩn cao cấp chuyên tổ chức tọa đàm, demo công nghệ và sự kiện chuyên nghiệp với đầy đủ thiết bị IoT.',
      complianceChecks: {
        fireSafetyCertified: true,
        capacityVerified: true,
        equipmentInspected: true,
        pricingStandardCompliant: true
      }
    },
    {
      id: 'sp-mod-002',
      code: 'UEL-SP-105',
      name: 'Creative Studio & Podcast Pod A.105',
      building: 'Cơ sở 2 - Tòa Thư viện Trung tâm',
      floor: 'Tầng 1',
      type: 'Studio & Sáng tạo',
      capacity: 8,
      area: 25,
      hourlyPrice: 180000,
      dailyPrice: 1200000,
      status: 'PENDING_APPROVAL',
      submittedAt: '2026-10-20T08:15:00Z',
      seller: {
        storeName: 'Media Creatives Studio Hub',
        ownerName: 'Nguyễn Bích Phương',
        phone: '0988 776 554',
        email: 'phuong.media@creatives.vn',
        verified: false
      },
      image: 'spaces/space_b1_hall.jpg',
      equipment: ['Mic thu âm Rode PodMic', 'Đèn LED Key Light', 'Soundcard Focusrite', 'Cách âm tiêu âm 100%'],
      description: 'Phòng thu âm podcast và quay video cá nhân cách âm chuẩn quốc tế, phù hợp cho sáng tạo nội dung chuyên nghiệp.',
      complianceChecks: {
        fireSafetyCertified: true,
        capacityVerified: true,
        equipmentInspected: true,
        pricingStandardCompliant: true
      }
    },
    {
      id: 'sp-mod-003',
      code: 'UEL-SP-402',
      name: 'Phòng Họp Ban Điều Hành Tầng 4 (Executive Room)',
      building: 'Landmark UEL Space Tower Q.1',
      floor: 'Tầng 4',
      type: 'Phòng Họp VIP',
      capacity: 20,
      area: 45,
      hourlyPrice: 280000,
      dailyPrice: 1900000,
      status: 'AVAILABLE',
      submittedAt: '2026-10-15T10:00:00Z',
      seller: {
        storeName: 'Landmark Co-Working Hub',
        ownerName: 'Lê Hoàng Long',
        phone: '0903 881 992',
        email: 'long.le@landmark-space.vn',
        verified: true
      },
      image: 'spaces/space_a1_101.jpg',
      equipment: ['Hệ thống Hội nghị Cisco Webex', 'Bàn họp da cao cấp', 'Máy lọc không khí Daikin'],
      description: 'Không gian đàm phán hợp đồng cao cấp, view toàn cảnh trung tâm thành phố.',
      complianceChecks: {
        fireSafetyCertified: true,
        capacityVerified: true,
        equipmentInspected: true,
        pricingStandardCompliant: true
      }
    },
    {
      id: 'sp-mod-004',
      code: 'UEL-SP-204',
      name: 'Workshop Lab Robotics & IoT Innovation',
      building: 'Khu Công nghệ Cao TP. Thủ Đức',
      floor: 'Tầng 2',
      type: 'Workshop & R&D',
      capacity: 35,
      area: 70,
      hourlyPrice: 220000,
      dailyPrice: 1500000,
      status: 'CLOSED',
      submittedAt: '2026-10-10T09:00:00Z',
      seller: {
        storeName: 'RoboTech Space Partners',
        ownerName: 'Đặng Tuấn Kiệt',
        phone: '0977 123 999',
        email: 'kiet.dang@robotech.vn',
        verified: true
      },
      image: 'spaces/space_c1_201_lab.jpg',
      equipment: ['Bàn thao tác chống tĩnh điện ESD', 'Nguồn điện 3 pha', 'Bộ dụng cụ hàn vi mạch'],
      description: 'Không gian R&D phục vụ nghiên cứu thử nghiệm robot và phần cứng nhúng.',
      suspensionReason: 'Đang bảo trì nâng cấp hệ thống điện 3 pha và phòng cháy chữa cháy định kỳ.',
      complianceChecks: {
        fireSafetyCertified: true,
        capacityVerified: true,
        equipmentInspected: true,
        pricingStandardCompliant: true
      }
    }
  ];

  // Platform Users & KYC Accounts
  users: PlatformUserAccount[] = [
    {
      id: 'usr-101',
      code: 'SELLER-INNOVATE',
      name: 'Lê Hoàng Long',
      email: 'innovate@gmail.com',
      phone: '0912 345 678',
      role: 'SELLER',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      verifiedBadge: true,
      organization: 'Doanh nghiệp Cho thuê Mặt bằng',
      storeName: 'Innovate Coworking Hub',
      totalBookings: 84,
      createdAt: '2026-08-12',
      businessLicenseNumber: '0318992104'
    },
    {
      id: 'usr-102',
      code: 'SELLER-CREATIVE',
      name: 'Đỗ Thùy Linh',
      email: 'creative@gmail.com',
      phone: '0988 776 554',
      role: 'SELLER',
      status: 'ACTIVE',
      kycStatus: 'PENDING',
      verifiedBadge: false,
      organization: 'Studio Media & Sự kiện',
      storeName: 'Creative Hub Media Studios',
      totalBookings: 12,
      createdAt: '2026-10-19',
      businessLicenseNumber: '0319448821'
    },
    {
      id: 'usr-103',
      code: 'BUYER-GIANG',
      name: 'Nguyễn Giang',
      email: 'giangnntk24411@st.uel.edu.vn',
      phone: '0909 332 118',
      role: 'BUYER',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      verifiedBadge: true,
      organization: 'Thành viên UEL Space',
      totalBookings: 19,
      createdAt: '2026-09-02'
    },
    {
      id: 'usr-104',
      code: 'BUYER-MINHANH',
      name: 'Trần Minh Anh',
      email: 'minhanh@gmail.com',
      phone: '0938 123 456',
      role: 'BUYER',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      verifiedBadge: true,
      organization: 'Startup AI Incubator',
      totalBookings: 32,
      createdAt: '2026-08-15'
    },
    {
      id: 'usr-105',
      code: 'SELLER-LANDMARK',
      name: 'Trần Minh Khoa',
      email: 'landmark@gmail.com',
      phone: '0901 888 222',
      role: 'SELLER',
      status: 'SUSPENDED',
      kycStatus: 'REJECTED',
      verifiedBadge: false,
      organization: 'Landmark Convention Corp',
      storeName: 'Landmark Convention Hub',
      totalBookings: 5,
      createdAt: '2026-09-20',
      businessLicenseNumber: '0300998877'
    }
  ];

  // Platform Bookings
  bookings: PlatformBookingItem[] = [
    {
      id: 'bk-01',
      code: 'UEL-BK-2026-081',
      spaceName: 'Hội trường & Event Hall Landmark A3',
      building: 'Central Tower Q.1',
      sellerName: 'Landmark Co-Working Hub',
      bookerName: 'Nguyễn Giang',
      bookerEmail: 'giangnntk24411@st.uel.edu.vn',
      bookerPhone: '0909 332 118',
      date: '2026-10-21',
      timeSlot: '13:30 - 17:30',
      price: 2400000,
      paymentStatus: 'PAID',
      status: 'APPROVED',
      violationAlert: null
    },
    {
      id: 'bk-02',
      code: 'UEL-BK-2026-082',
      spaceName: 'Phòng Họp VIP Executive Room Tầng 4',
      building: 'Landmark UEL Space Tower Q.1',
      sellerName: 'Landmark Co-Working Hub',
      bookerName: 'Trần Minh Anh',
      bookerEmail: 'minhanh@gmail.com',
      bookerPhone: '0938 123 456',
      date: '2026-10-20',
      timeSlot: '09:00 - 11:30',
      price: 700000,
      paymentStatus: 'PAID',
      status: 'IN_USE',
      violationAlert: 'OVERTIME',
      overtimeMinutes: 25,
      capacity: 20,
      actualHeadcount: 18
    },
    {
      id: 'bk-03',
      code: 'UEL-BK-2026-083',
      spaceName: 'Workshop Lab Robotics Tầng 2',
      building: 'Khu Công nghệ Cao TP. Thủ Đức',
      sellerName: 'RoboTech Space Partners',
      bookerName: 'Trần Minh Quang',
      bookerEmail: 'quang.tran@robotics.vn',
      bookerPhone: '0944 555 666',
      date: '2026-10-20',
      timeSlot: '08:00 - 10:00',
      price: 440000,
      paymentStatus: 'PAID',
      status: 'NO_SHOW',
      violationAlert: 'NO_SHOW'
    },
    {
      id: 'bk-04',
      code: 'UEL-BK-2026-079',
      spaceName: 'Phòng Họp A.105 (Tầng 1)',
      building: 'Tòa A1',
      sellerName: 'UEL Innovation Hub',
      bookerName: 'Phạm Thị Mai',
      bookerEmail: 'mai.pham@startup.vn',
      bookerPhone: '0918 222 333',
      date: '2026-10-19',
      timeSlot: '14:00 - 16:00',
      price: 360000,
      paymentStatus: 'PAID',
      status: 'COMPLETED'
    }
  ];

  // Escrow & Payout Batches
  payoutBatches: EscrowPayoutBatch[] = [
    {
      id: 'PO-2026-1001',
      sellerName: 'Landmark Co-Working Hub',
      sellerEmail: 'long.le@landmark-space.vn',
      bankAccount: 'Techcombank •••• 8829 (CTCP Landmark Space)',
      totalGross: 48000000,
      platformFee: 5760000, // 12%
      netPayout: 42240000,
      completedBookingsCount: 14,
      status: 'READY_TO_SETTLE',
      dueTime: '2026-10-21T18:00:00Z'
    },
    {
      id: 'PO-2026-1002',
      sellerName: 'Innovation Hub ĐHQG Partner',
      sellerEmail: 'tuan.vu@dhqg-inno.vn',
      bankAccount: 'Vietcombank •••• 4410 (Trung tâm Inno ĐHQG)',
      totalGross: 26500000,
      platformFee: 3180000, // 12%
      netPayout: 23320000,
      completedBookingsCount: 8,
      status: 'READY_TO_SETTLE',
      dueTime: '2026-10-22T10:00:00Z'
    },
    {
      id: 'PO-2026-0998',
      sellerName: 'RoboTech Space Partners',
      sellerEmail: 'kiet.dang@robotech.vn',
      bankAccount: 'MBBank •••• 9923 (Công ty TNHH RoboTech)',
      totalGross: 72000000,
      platformFee: 8640000,
      netPayout: 63360000,
      completedBookingsCount: 22,
      status: 'SETTLED',
      dueTime: '2026-10-15T14:30:00Z',
      settledAt: '2026-10-15T15:00:00Z'
    }
  ];

  // Disputes & Surcharges
  disputes: PlatformDispute[] = [
    {
      id: 'DISP-801',
      bookingCode: 'UEL-BK-2026-082',
      spaceName: 'Phòng Họp VIP Executive Room Tầng 4',
      customerName: 'ThS. Lê Hoàng Long',
      customerEmail: 'long.le@finance-edu.vn',
      sellerName: 'Landmark Co-Working Hub',
      type: 'OVERTIME_SURCHARGE',
      amount: 350000,
      description: 'Cảm biến AI phát hiện khách dùng quá 25 phút so với lịch hẹn. Host yêu cầu thu thêm phụ phí quá giờ 350.000 ₫.',
      status: 'OPEN',
      createdAt: '2026-10-20T11:45:00Z',
      aiEvidence: {
        overtimeMinutes: 25,
        headcountPeak: 18,
        emptyRoomConfirmed: false,
        confidence: 0.98
      }
    },
    {
      id: 'DISP-802',
      bookingCode: 'UEL-BK-2026-074',
      spaceName: 'Workshop Lab Robotics Tầng 2',
      customerName: 'Trần Minh Quang',
      customerEmail: 'quang.tran@robotics.vn',
      sellerName: 'RoboTech Space Partners',
      type: 'FACILITY_DAMAGE',
      amount: 800000,
      description: 'Mỏ hàn nhiệt và bảng mạch mẫu bị hỏng sau khi thuê. Host khiếu nại yêu cầu trừ cọc bồi thường 800.000 ₫.',
      status: 'PENDING_CUSTOMER_FEEDBACK',
      createdAt: '2026-10-19T16:20:00Z',
      aiEvidence: null
    },
    {
      id: 'DISP-799',
      bookingCode: 'UEL-BK-2026-068',
      spaceName: 'Phòng Hội Thảo B1',
      customerName: 'Trần Thị Thu Hà',
      customerEmail: 'ha.tran@startup.edu.vn',
      sellerName: 'UEL Innovation Hub',
      type: 'REFUND_REQUEST',
      amount: 1200000,
      description: 'Điều hòa phòng hội thảo hỏng không sử dụng được, khách yêu cầu hoàn tiền 100%.',
      status: 'RESOLVED',
      createdAt: '2026-10-17T10:00:00Z',
      resolution: 'Admin đã duyệt hoàn tiền 100% (1.200.000 ₫) cho khách thuê và cảnh báo Host bảo trì thiết bị.',
      resolvedAt: '2026-10-17T15:00:00Z'
    }
  ];

  // Audit Logs
  auditLogs: PlatformAuditLog[] = [
    {
      id: 'log-901',
      timestamp: '20/10/2026 22:15:30',
      actor: 'ADMIN-001 (Super Admin)',
      action: 'APPROVE_LISTING',
      target: 'UEL-SP-402 (Phòng Họp Ban Điều Hành)',
      details: 'Đã phê duyệt niêm yết không gian đạt chuẩn an toàn & PCCC.',
      level: 'INFO'
    },
    {
      id: 'log-902',
      timestamp: '20/10/2026 21:40:12',
      actor: 'AI_DUAL_HEAD_AGENT',
      action: 'OVERTIME_DETECTED',
      target: 'UEL-BK-2026-082 (Executive Room)',
      details: 'Tự động phát hiện sĩ số 18 người sử dụng quá giờ 25 phút. Đề xuất phụ phí 350.000 ₫.',
      level: 'WARNING'
    },
    {
      id: 'log-903',
      timestamp: '20/10/2026 18:05:44',
      actor: 'ADMIN-001 (Super Admin)',
      action: 'SETTLE_PAYOUT_BATCH',
      target: 'PO-2026-0998 (RoboTech Partners)',
      details: 'Quyết toán giải ngân 63.360.000 ₫ sau khi khấu trừ 12% hoa hồng sàn (8.640.000 ₫).',
      level: 'INFO'
    },
    {
      id: 'log-904',
      timestamp: '20/10/2026 15:30:00',
      actor: 'SECURITY_SHIELD',
      action: 'SUSPEND_HOST_ACCOUNT',
      target: 'HOST-0870 (Prime Vũng Tàu)',
      details: 'Khóa tài khoản tạm thời do vi phạm chính sách hủy đơn đột ngột và tài liệu KYC không hợp lệ.',
      level: 'CRITICAL'
    }
  ];

  // Platform Configuration
  platformConfig = {
    commissionRate: 12,
    escrowHoldingHours: 24,
    noShowGraceMinutes: 30,
    autoCheckoutMinutes: 45,
    awayWarningMinutes: 20,
    maxSimultaneousBookings: 5
  };

  // --- Modal States ---
  // 1. Moderate Listing Modal
  moderateModal: {
    isOpen: boolean;
    listing: PlatformListing | null;
    action: 'APPROVE' | 'REJECT' | 'SUSPEND';
    reason: string;
    isSubmitting: boolean;
  } = {
    isOpen: false,
    listing: null,
    action: 'APPROVE',
    reason: '',
    isSubmitting: false
  };

  // 2. KYC Verification Modal
  kycModal: {
    isOpen: boolean;
    user: PlatformUserAccount | null;
    isSubmitting: boolean;
  } = {
    isOpen: false,
    user: null,
    isSubmitting: false
  };

  // 3. Resolve Dispute Modal
  disputeModal: {
    isOpen: boolean;
    dispute: PlatformDispute | null;
    decision: 'REFUND_CUSTOMER_100' | 'PAY_SELLER_FULL' | 'SPLIT_50_50' | 'DISMISS';
    refundAmount: number;
    penaltyAmount: number;
    notes: string;
    isSubmitting: boolean;
  } = {
    isOpen: false,
    dispute: null,
    decision: 'REFUND_CUSTOMER_100',
    refundAmount: 0,
    penaltyAmount: 0,
    notes: '',
    isSubmitting: false
  };

  // 4. Emergency Booking Cancellation Modal (Edge Case 1)
  emergencyBookingModal: {
    isOpen: boolean;
    booking: PlatformBookingItem | null;
    reason: string;
    refund100: boolean;
    isSubmitting: boolean;
  } = {
    isOpen: false,
    booking: null,
    reason: 'Can thiệp khẩn cấp từ Ban Quản trị: Không gian tạm ngừng hoạt động',
    refund100: true,
    isSubmitting: false
  };

  // 5. Payout Settlement Modal (Edge Case 2)
  payoutModal: {
    isOpen: boolean;
    batch: EscrowPayoutBatch | null;
    isSubmitting: boolean;
  } = {
    isOpen: false,
    batch: null,
    isSubmitting: false
  };

  ngOnInit(): void {
    this.fetchBackendData();
  }

  ngOnDestroy(): void {}

  // Fetch real backend data if available, fallback to mock data
  fetchBackendData(): void {
    this.http.get<any>(`${SERVER_BASE_URL}/api/admin/metrics`, {
      headers: { 'x-admin-key': 'uel-space-super-admin-key', 'x-user-role': 'ADMIN' }
    }).subscribe({
      next: (res) => {
        if (res) {
          this.metrics = { ...this.metrics, ...res };
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // Mock fallback is already populated
      }
    });

    this.http.get<any[]>(`${SERVER_BASE_URL}/api/admin/listings`, {
      headers: { 'x-admin-key': 'uel-space-super-admin-key', 'x-user-role': 'ADMIN' }
    }).subscribe({
      next: (res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.listings = res;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  showToast(message: string, type: 'success' | 'warning' | 'info' = 'success'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  // --- 1. Listing Moderation Actions ---
  openModerateModal(listing: PlatformListing, action: 'APPROVE' | 'REJECT' | 'SUSPEND'): void {
    this.moderateModal = {
      isOpen: true,
      listing,
      action,
      reason: action === 'REJECT' ? 'Hình ảnh chưa rõ ràng và bảng giá chưa đồng nhất tiêu chuẩn sàn' : 
              action === 'SUSPEND' ? 'Đình chỉ tạm thời để xác minh phản ánh chất lượng cơ sở vật chất' : '',
      isSubmitting: false
    };
  }

  closeModerateModal(): void {
    this.moderateModal.isOpen = false;
    this.moderateModal.listing = null;
  }

  submitModerateListing(): void {
    if (!this.moderateModal.listing) return;
    this.moderateModal.isSubmitting = true;

    const listing = this.moderateModal.listing;
    const action = this.moderateModal.action;
    const reason = this.moderateModal.reason;

    this.http.patch(`${SERVER_BASE_URL}/api/admin/listings/${listing.id}/moderate`, {
      action,
      reason
    }, {
      headers: { 'x-admin-key': 'uel-space-super-admin-key', 'x-user-role': 'ADMIN' }
    }).subscribe({
      next: () => {
        this.applyLocalListingChange(listing.id, action, reason);
      },
      error: () => {
        // Fallback local update
        this.applyLocalListingChange(listing.id, action, reason);
      }
    });
  }

  private applyLocalListingChange(id: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND', reason: string): void {
    const item = this.listings.find(l => l.id === id);
    if (item) {
      if (action === 'APPROVE') {
        item.status = 'AVAILABLE';
        this.metrics.spaces.active++;
        this.metrics.spaces.pending = Math.max(0, this.metrics.spaces.pending - 1);
        this.showToast(`Đã duyệt thành công không gian "${item.name}" lên sàn UEL Space!`, 'success');
      } else if (action === 'REJECT') {
        item.status = 'REJECTED';
        item.rejectionReason = reason;
        this.metrics.spaces.pending = Math.max(0, this.metrics.spaces.pending - 1);
        this.showToast(`Đã từ chối niêm yết không gian "${item.name}". Lý do đã được gửi tới đối tác.`, 'warning');
      } else if (action === 'SUSPEND') {
        // Edge Case 1: Chặn đặt mới, giữ nguyên đơn hiện hữu
        item.status = 'CLOSED';
        item.suspensionReason = reason;
        this.metrics.spaces.active = Math.max(0, this.metrics.spaces.active - 1);
        this.metrics.spaces.suspended++;
        this.showToast(`Đã đình chỉ không gian "${item.name}". Đã chặn đặt mới, giữ nguyên booking đã đặt theo quy chế sàn.`, 'warning');
      }
    }

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      actor: 'ADMIN-001 (Super Admin)',
      action: `MODERATE_LISTING_${action}`,
      target: item?.code || id,
      details: reason || (action === 'APPROVE' ? 'Duyệt niêm yết thành công' : 'Thao tác điều phối'),
      level: action === 'SUSPEND' ? 'WARNING' : 'INFO'
    });

    this.moderateModal.isOpen = false;
    this.moderateModal.isSubmitting = false;
    this.cdr.detectChanges();
  }

  // --- 2. KYC & User Account Actions ---
  openKycModal(user: PlatformUserAccount): void {
    this.kycModal = {
      isOpen: true,
      user,
      isSubmitting: false
    };
  }

  closeKycModal(): void {
    this.kycModal.isOpen = false;
    this.kycModal.user = null;
  }

  approveKyc(user: PlatformUserAccount): void {
    user.kycStatus = 'VERIFIED';
    user.verifiedBadge = true;
    this.metrics.users.pendingKyc = Math.max(0, this.metrics.users.pendingKyc - 1);
    this.showToast(`Đã cấp tích xanh Đối Tác Xác Minh cho "${user.name}"!`, 'success');

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      actor: 'ADMIN-001 (Super Admin)',
      action: 'APPROVE_KYC_PARTNER',
      target: user.code,
      details: `Xác minh thành công hồ sơ kinh doanh và cấp tích xanh Verified Partner.`,
      level: 'INFO'
    });
    this.closeKycModal();
    this.cdr.detectChanges();
  }

  toggleUserSuspension(user: PlatformUserAccount): void {
    if (user.status === 'ACTIVE') {
      user.status = 'SUSPENDED';
      this.showToast(`Đã tạm khóa tài khoản "${user.name}". Tài khoản không thể đăng listing hoặc tạo booking.`, 'warning');
    } else {
      user.status = 'ACTIVE';
      this.showToast(`Đã mở khóa hoạt động cho tài khoản "${user.name}".`, 'success');
    }

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      actor: 'ADMIN-001 (Super Admin)',
      action: user.status === 'ACTIVE' ? 'UNSUSPEND_USER' : 'SUSPEND_USER',
      target: user.code,
      details: `Trạng thái tài khoản đổi thành ${user.status}`,
      level: user.status === 'SUSPENDED' ? 'WARNING' : 'INFO'
    });
    this.cdr.detectChanges();
  }

  // --- 3. Platform Booking Emergency Actions (Edge Case 1) ---
  openEmergencyCancelBookingModal(booking: PlatformBookingItem): void {
    this.emergencyBookingModal = {
      isOpen: true,
      booking,
      reason: 'Can thiệp khẩn cấp từ Ban Quản trị: Đình chỉ không gian và hoàn tiền 100% cho khách.',
      refund100: true,
      isSubmitting: false
    };
  }

  closeEmergencyCancelBookingModal(): void {
    this.emergencyBookingModal.isOpen = false;
    this.emergencyBookingModal.booking = null;
  }

  submitEmergencyCancelBooking(): void {
    if (!this.emergencyBookingModal.booking) return;
    const booking = this.emergencyBookingModal.booking;
    booking.status = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';

    this.showToast(`Đã hủy booking ${booking.code} và kích hoạt lệnh hoàn trả 100% (${booking.price.toLocaleString()} ₫) cho khách ${booking.bookerName}.`, 'success');

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      actor: 'ADMIN-001 (Super Admin)',
      action: 'EMERGENCY_CANCEL_AND_REFUND',
      target: booking.code,
      details: `Hủy khẩn cấp và hoàn tiền 100%: ${this.emergencyBookingModal.reason}`,
      level: 'WARNING'
    });

    this.closeEmergencyCancelBookingModal();
    this.cdr.detectChanges();
  }

  // --- 4. Escrow Payout Actions (Edge Case 2) ---
  openPayoutModal(batch: EscrowPayoutBatch): void {
    this.payoutModal = {
      isOpen: true,
      batch,
      isSubmitting: false
    };
  }

  closePayoutModal(): void {
    this.payoutModal.isOpen = false;
    this.payoutModal.batch = null;
  }

  executePayout(): void {
    if (!this.payoutModal.batch) return;
    this.payoutModal.isSubmitting = true;

    const batch = this.payoutModal.batch;
    setTimeout(() => {
      batch.status = 'SETTLED';
      batch.settledAt = new Date().toISOString();
      this.metrics.payoutsSettled += batch.netPayout;
      this.metrics.escrowHolding = Math.max(0, this.metrics.escrowHolding - batch.netPayout);

      this.showToast(`Quyết toán thành công lệnh ${batch.id}! Đã chuyển ${batch.netPayout.toLocaleString()} ₫ vào tài khoản của ${batch.sellerName} (Đã giữ lại 12% hoa hồng sàn ${batch.platformFee.toLocaleString()} ₫).`, 'success');

      this.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
        actor: 'ADMIN-001 (Super Admin)',
        action: 'EXECUTE_SELLER_PAYOUT',
        target: batch.id,
        details: `Quyết toán giải ngân ${batch.netPayout.toLocaleString()} ₫ cho ${batch.sellerName} sau khi hoàn tất chu kỳ thuê +24h Escrow.`,
        level: 'INFO'
      });

      this.closePayoutModal();
      this.cdr.detectChanges();
    }, 600);
  }

  // --- 5. Dispute Resolution Actions ---
  openDisputeModal(dispute: PlatformDispute): void {
    this.disputeModal = {
      isOpen: true,
      dispute,
      decision: 'REFUND_CUSTOMER_100',
      refundAmount: dispute.amount,
      penaltyAmount: 0,
      notes: '',
      isSubmitting: false
    };
  }

  closeDisputeModal(): void {
    this.disputeModal.isOpen = false;
    this.disputeModal.dispute = null;
  }

  submitDisputeResolution(): void {
    if (!this.disputeModal.dispute) return;
    const dispute = this.disputeModal.dispute;
    dispute.status = 'RESOLVED';
    
    let decisionText = '';
    if (this.disputeModal.decision === 'REFUND_CUSTOMER_100') {
      decisionText = `Hoàn trả 100% (${dispute.amount.toLocaleString()} ₫) cho khách thuê.`;
    } else if (this.disputeModal.decision === 'PAY_SELLER_FULL') {
      decisionText = `Chấp thuận yêu cầu của Host, trích cọc hoặc thu phụ phí ${dispute.amount.toLocaleString()} ₫.`;
    } else if (this.disputeModal.decision === 'SPLIT_50_50') {
      decisionText = `Hòa giải đôi bên: Mỗi bên chịu 50% (${(dispute.amount / 2).toLocaleString()} ₫).`;
    } else {
      decisionText = `Bác bỏ khiếu nại, giữ nguyên hiện trạng giao dịch ban đầu.`;
    }

    dispute.resolution = `Phán quyết từ Ban Quản trị: ${decisionText} (Ghi chú: ${this.disputeModal.notes || 'Đã đối chiếu chứng cứ AI'})`;
    dispute.resolvedAt = new Date().toISOString();
    this.metrics.disputes.pending = Math.max(0, this.metrics.disputes.pending - 1);

    this.showToast(`Đã giải quyết tranh chấp ${dispute.id} thành công!`, 'success');

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      actor: 'ADMIN-001 (Super Admin)',
      action: 'RESOLVE_DISPUTE',
      target: dispute.id,
      details: dispute.resolution,
      level: 'WARNING'
    });

    this.closeDisputeModal();
    this.cdr.detectChanges();
  }

  // --- 6. Platform Settings Update ---
  savePlatformSettings(): void {
    this.showToast(`Đã lưu cấu hình tham số sàn UEL Space thành công! Hoa hồng sàn: ${this.platformConfig.commissionRate}%, Thời gian Escrow: ${this.platformConfig.escrowHoldingHours}h.`, 'success');
    this.metrics.commissionRate = this.platformConfig.commissionRate;

    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
      actor: 'ADMIN-001 (Super Admin)',
      action: 'UPDATE_PLATFORM_CONFIG',
      target: 'CONFIG_SYSTEM',
      details: `Cập nhật cấu hình: Commission=${this.platformConfig.commissionRate}%, Escrow=${this.platformConfig.escrowHoldingHours}h`,
      level: 'WARNING'
    });
    this.cdr.detectChanges();
  }

  formatEquipment(eq: any): string {
    if (!eq) return '';
    if (typeof eq === 'string') return eq;
    if (Array.isArray(eq)) {
      return eq.map(item => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        return item.name || item.label || item.title || item.item || JSON.stringify(item);
      }).filter(Boolean).join(', ');
    }
    return String(eq);
  }

  // Helper filters
  get filteredListings(): PlatformListing[] {
    return this.listings.filter(l => {
      const matchStatus = this.listingStatusFilter === 'ALL' || l.status === this.listingStatusFilter;
      const matchSearch = !this.searchFilter || 
        l.name.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        l.building.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        l.seller.storeName.toLowerCase().includes(this.searchFilter.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  get filteredUsers(): PlatformUserAccount[] {
    return this.users.filter(u => {
      const matchRole = this.kycRoleFilter === 'ALL' || u.role === this.kycRoleFilter;
      const matchKyc = this.kycStatusFilter === 'ALL' || u.kycStatus === this.kycStatusFilter;
      const matchSearch = !this.searchFilter ||
        u.name.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        u.phone.includes(this.searchFilter);
      return matchRole && matchKyc && matchSearch;
    });
  }

  get filteredBookings(): PlatformBookingItem[] {
    return this.bookings.filter(b => {
      const matchStatus = this.bookingStatusFilter === 'ALL' || b.status === this.bookingStatusFilter;
      const matchSearch = !this.searchFilter ||
        b.code.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        b.spaceName.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        b.bookerName.toLowerCase().includes(this.searchFilter.toLowerCase());
      return matchStatus && matchSearch;
    });
  }
}
