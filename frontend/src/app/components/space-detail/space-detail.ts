import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { ReviewsService, SpaceReview } from '../../services/reviews.service';
import { SellersService, SellerProfile } from '../../services/sellers.service';
import { getFallbackMarketplaceSpaces, normalizeSpace, createSpaceSlug, createSlug } from '../../services/spaces-data';
import { SERVER_BASE_URL, SERVER_IMAGES_LINK } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-space-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  templateUrl: './space-detail.html',
  styleUrls: ['./space-detail.scss']
})
export class SpaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private googleCalendarService = inject(GoogleCalendarService);
  private reviewsService = inject(ReviewsService);
  private sellersService = inject(SellersService);
  private bookingService = inject(BookingService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);

  spaceId: string = '';
  space: any = null;
  isLoading: boolean = true;
  selectedImageIndex: number = 0;


  // Reviews & Comments State
  reviews: SpaceReview[] = [];
  averageRating: number = 4.9;
  totalReviewsCount: number = 45;
  activeRatingFilter: number = 0; // 0 = All

  // New Comment Form
  newCommentText: string = '';
  newCommentRating: number = 5;
  newCommentPurpose: string = 'Họp đối tác & Làm việc nhóm';
  newCommentAuthorName: string = '';
  isSubmittingComment: boolean = false;
  commentSuccessToast: boolean = false;

  // Booking & Calendar State
  customBookingDate: string = new Date().toISOString().split('T')[0];
  customStartTime: string = '09:00';
  customEndTime: string = '11:00';
  customDurationHours: number = 2;
  googleEmbedSafeUrl: SafeResourceUrl | null = null;
  suggestedGoogleSlots: any[] = [];
  activeCalendarTab: 'picker' | 'embed' = 'picker';
  calendarEmbedMode: 'AGENDA' | 'WEEK' | 'MONTH' = 'AGENDA';
  showCalendarIframeModal: boolean = false;
  hasConflict: boolean = false;
  conflictReason: string = '';
  userScheduleEvents: any[] = [];

  // Custom UEL Brand Date & Time Picker Dropdown State
  isDatePickerOpen: boolean = false;
  isStartTimePickerOpen: boolean = false;
  isEndTimePickerOpen: boolean = false;
  calendarViewYear: number = new Date().getFullYear();
  calendarViewMonth: number = new Date().getMonth();
  calendarDays: any[] = [];
  timeOptions: any[] = [];

  // Booking Modal & Success Confirmation
  bookingSuccess: boolean = false;
  confirmedBookingCode: string = '';

  // MoMo Payment Gateway
  momoModal = {
    isOpen: false,
    orderId: '',
    payUrl: '',
    qrCodeUrl: '',
    amount: 0
  };

  // Toast
  toastMessage: string = '';
  showToast: boolean = false;

  defaultFallbackImage = '/images/spaces/indoor_coworking_lounge_1.jpg';
  server_images_link = SERVER_IMAGES_LINK;

  studentInfo = {
    name: 'Khách hàng UEL Space',
    email: 'khachhang@uel.edu.vn',
    org: 'Doanh nghiệp / Đơn vị Hợp tác'
  };

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAllDropdowns();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.closeAllDropdowns();
  }

  closeAllDropdowns(): void {
    this.isDatePickerOpen = false;
    this.isStartTimePickerOpen = false;
    this.isEndTimePickerOpen = false;
  }

  ngOnInit(): void {
    this.initCalendar();
    // Check saved user
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) this.studentInfo.name = u.name;
        if (u.email) this.studentInfo.email = u.email;
        this.newCommentAuthorName = u.name || '';
      }
    } catch {}

    this.refreshCalendarAndSlots();

    // Lắng nghe thay đổi không gian qua tham số URL (/spaces/:id)
    this.route.paramMap.subscribe(params => {
      this.spaceId = params.get('id') || '';
      if (this.spaceId) {
        this.loadSpaceDetails(this.spaceId);
      } else {
        this.router.navigate(['/map']);
      }
    });

    // Chuyển trực tiếp sang trang /sellers/:id nếu có ?seller=xxx trên URL
    this.route.queryParamMap.subscribe(queryParams => {
      const sellerQuery = queryParams.get('seller');
      if (sellerQuery) {
        this.navigateToSellerPage(sellerQuery);
      }
    });
  }

  async loadSpaceDetails(id: string) {
    this.isLoading = true;
    this.selectedImageIndex = 0;
    this.cdr.detectChanges();

    const cleanParam = decodeURIComponent(id || '').trim().toLowerCase();

    // 1. Tra cứu trong dataset nội bộ phong phú (Fallback dataset 100 phòng)
    const fallbackList = getFallbackMarketplaceSpaces();
    const localMatch = fallbackList.find(s => {
      const norm = normalizeSpace(s);
      return (
        norm.slug === cleanParam ||
        norm.slug?.endsWith('-' + cleanParam) ||
        (norm.code && norm.code.toLowerCase() === cleanParam) ||
        (norm._id && norm._id.toString() === cleanParam) ||
        (norm.id && norm.id.toString() === cleanParam) ||
        createSlug(norm.name || '').includes(cleanParam)
      );
    });

    if (localMatch) {
      this.space = normalizeSpace(localMatch);
    }

    // 2. Thử truy vấn API Backend để có dữ liệu thời gian thực mới nhất
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/spaces/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        const serverData = json.data || json;
        if (serverData && (serverData.name || serverData._id)) {
          this.space = normalizeSpace(serverData);
        }
      }
    } catch (e) {
      console.warn('API /api/spaces/:id lỗi, giữ dữ liệu fallback phong phú:', e);
    }

    if (!this.space && fallbackList.length > 0) {
      // Nếu không tìm thấy id chính xác, mở phòng đầu tiên làm đại diện
      this.space = normalizeSpace(fallbackList[0]);
    }

    if (this.space) {
      this.initCalendarAndReviews();
    }

    this.isLoading = false;
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Recommended Similar Spaces State
  recommendedSpaces: any[] = [];

  initCalendarAndReviews() {
    this.customDurationHours = this.googleCalendarService.calculateDuration(this.customStartTime, this.customEndTime);
    const rawUrl = this.googleCalendarService.generateEmbedUrl(this.space.name, 'AGENDA');
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);

    // Nạp reviews và tính rating
    this.loadReviews();
    // Nạp các không gian tương tự đề xuất
    this.loadRecommendedSpaces();
  }

  loadRecommendedSpaces() {
    const allSpaces = getFallbackMarketplaceSpaces().map(s => normalizeSpace(s));
    const currentId = this.space._id || this.space.id || this.spaceId;
    const currentCategory = (this.space.dataset?.category || this.space.datasetCategory || '').toLowerCase();
    const currentType = (this.space.type || this.space.spaceType || '').toLowerCase();

    // Lọc các phòng khác phòng hiện tại, ưu tiên cùng phân loại hoặc cùng loại hình
    const otherSpaces = allSpaces.filter(s => (s._id || s.id) !== currentId);

    const scored = otherSpaces.map(s => {
      let score = 0;
      const sCat = (s.dataset?.category || s.datasetCategory || '').toLowerCase();
      const sType = (s.type || s.spaceType || '').toLowerCase();
      if (sCat && currentCategory && sCat === currentCategory) score += 50;
      if (sType && currentType && sType === currentType) score += 30;
      if (s.status === 'available') score += 10;
      return { ...s, score };
    });

    scored.sort((a, b) => b.score - a.score);
    this.recommendedSpaces = scored.slice(0, 4);
  }

  navigateToSpace(targetSpace: any) {
    if (!targetSpace) return;
    const targetSlug = targetSpace.slug || createSpaceSlug(targetSpace);
    if (targetSlug) {
      this.router.navigate(['/spaces', targetSlug]);
    }
  }

  loadReviews() {
    const spaceKey = this.space._id || this.space.id || this.spaceId;
    this.reviews = this.reviewsService.getReviewsForSpace(spaceKey);
    this.totalReviewsCount = this.reviews.length;
    if (this.reviews.length > 0) {
      const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
      this.averageRating = Number((sum / this.reviews.length).toFixed(1));
    } else {
      this.averageRating = this.space.rating || 4.9;
    }
  }

  get filteredReviews(): SpaceReview[] {
    if (this.activeRatingFilter === 0) return this.reviews;
    return this.reviews.filter(r => r.rating === this.activeRatingFilter);
  }

  filterReviewsByRating(stars: number) {
    this.activeRatingFilter = this.activeRatingFilter === stars ? 0 : stars;
  }

  toggleReviewLike(review: SpaceReview) {
    const isLiked = this.reviewsService.toggleLike(review.id);
    review.userLiked = isLiked;
    review.likes = Math.max(0, review.likes + (isLiked ? 1 : -1));
  }

  submitNewComment() {
    if (!this.newCommentText.trim()) return;

    this.isSubmittingComment = true;
    const author = this.newCommentAuthorName.trim() || this.studentInfo.name || 'Khách thuê UEL Space';
    const spaceKey = this.space._id || this.space.id || this.spaceId;

    const added = this.reviewsService.addReview({
      spaceId: spaceKey,
      userName: author,
      userAvatar: `/images/avatars/user_avatar_${(Math.floor(Math.random() * 4) + 1)}.svg`,
      userRole: 'Khách hàng đã xác thực đặt phòng',
      organization: this.studentInfo.org,
      rating: this.newCommentRating,
      comment: this.newCommentText.trim(),
      rentalPurpose: this.newCommentPurpose
    });

    this.reviews.unshift(added);
    this.totalReviewsCount = this.reviews.length;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = Number((sum / this.reviews.length).toFixed(1));

    this.newCommentText = '';
    this.isSubmittingComment = false;
    this.commentSuccessToast = true;
    setTimeout(() => {
      this.commentSuccessToast = false;
      this.cdr.detectChanges();
    }, 4000);

    this.triggerToast('Đánh giá của bạn đã được xuất bản thành công!');
    this.cdr.detectChanges();
  }

  // Gallery Navigation
  setSelectedImage(index: number) {
    this.selectedImageIndex = index;
  }

  nextImage() {
    if (!this.space?.images?.length) return;
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.space.images.length;
  }

  prevImage() {
    if (!this.space?.images?.length) return;
    this.selectedImageIndex = (this.selectedImageIndex - 1 + this.space.images.length) % this.space.images.length;
  }

  getMainImageUrl(): string {
    if (!this.space) return this.defaultFallbackImage;
    if (this.space.images && this.space.images.length > this.selectedImageIndex) {
      return this.getRawImageUrl(this.space.images[this.selectedImageIndex]);
    }
    return this.getRawImageUrl(this.space.image);
  }

  getRawImageUrl(img: string): string {
    if (!img) return this.defaultFallbackImage;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${this.server_images_link}${img.replace(/^\//, '')}`;
  }

  handleImageError(event: any) {
    if (event && event.target && event.target.src !== this.defaultFallbackImage) {
      event.target.src = this.defaultFallbackImage;
    }
  }

  // Booking Time Calculation & Dynamic Calendar Sync
  onTimeOrDateChange(): void {
    this.customDurationHours = this.googleCalendarService.calculateDuration(this.customStartTime, this.customEndTime);
    this.refreshCalendarAndSlots();
  }

  // --- Custom UEL Brand Date & Time Picker Methods ---
  initCalendar(): void {
    if (this.customBookingDate) {
      const parts = this.customBookingDate.split('-');
      if (parts.length === 3) {
        this.calendarViewYear = parseInt(parts[0], 10);
        this.calendarViewMonth = parseInt(parts[1], 10) - 1;
      }
    }
    this.generateCalendarDays();
    this.generateTimeOptions();
  }

  generateCalendarDays(): void {
    const year = this.calendarViewYear;
    const month = this.calendarViewMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay(); // 0 is Sunday
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Monday = 1 ... Sunday = 7
    const prevDaysCount = startDayOfWeek - 1;

    const days: any[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month trailing days
    for (let i = prevDaysCount - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dStr = this.formatDateToString(prevDate);
      days.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === this.customBookingDate,
        isPast: dStr < todayStr
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const curDate = new Date(year, month, i);
      const dStr = this.formatDateToString(curDate);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === this.customBookingDate,
        isPast: dStr < todayStr
      });
    }

    // Next month leading days to complete full 35 or 42 grid
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dStr = this.formatDateToString(nextDate);
      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === this.customBookingDate,
        isPast: dStr < todayStr
      });
    }

    this.calendarDays = days;
  }

  private formatDateToString(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  generateTimeOptions(): void {
    const list: any[] = [];
    for (let h = 7; h <= 21; h++) {
      for (const m of ['00', '30']) {
        if (h === 21 && m === '30') continue;
        const hh = h < 10 ? `0${h}` : `${h}`;
        const timeStr = `${hh}:${m}`;
        list.push({
          time: timeStr,
          label: timeStr
        });
      }
    }
    this.timeOptions = list;
  }

  toggleDatePicker(event: Event): void {
    event.stopPropagation();
    this.isDatePickerOpen = !this.isDatePickerOpen;
    this.isStartTimePickerOpen = false;
    this.isEndTimePickerOpen = false;
  }

  toggleStartTimePicker(event: Event): void {
    event.stopPropagation();
    this.isStartTimePickerOpen = !this.isStartTimePickerOpen;
    this.isDatePickerOpen = false;
    this.isEndTimePickerOpen = false;
  }

  toggleEndTimePicker(event: Event): void {
    event.stopPropagation();
    this.isEndTimePickerOpen = !this.isEndTimePickerOpen;
    this.isDatePickerOpen = false;
    this.isStartTimePickerOpen = false;
  }

  prevMonth(event: Event): void {
    event.stopPropagation();
    if (this.calendarViewMonth === 0) {
      this.calendarViewMonth = 11;
      this.calendarViewYear--;
    } else {
      this.calendarViewMonth--;
    }
    this.generateCalendarDays();
  }

  nextMonth(event: Event): void {
    event.stopPropagation();
    if (this.calendarViewMonth === 11) {
      this.calendarViewMonth = 0;
      this.calendarViewYear++;
    } else {
      this.calendarViewMonth++;
    }
    this.generateCalendarDays();
  }

  selectCalendarDate(dateStr: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.customBookingDate = dateStr;
    this.isDatePickerOpen = false;
    this.generateCalendarDays();
    this.onTimeOrDateChange();
  }

  selectQuickDate(preset: 'today' | 'tomorrow' | 'weekend', event?: Event): void {
    if (event) event.stopPropagation();
    const d = new Date();
    if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (preset === 'weekend') {
      const day = d.getDay();
      const diff = day === 6 ? 0 : (day === 0 ? 6 : 6 - day);
      d.setDate(d.getDate() + diff);
    }
    this.calendarViewYear = d.getFullYear();
    this.calendarViewMonth = d.getMonth();
    this.selectCalendarDate(this.formatDateToString(d));
  }

  selectStartTime(timeStr: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.customStartTime = timeStr;
    this.isStartTimePickerOpen = false;
    this.onTimeOrDateChange();
  }

  selectEndTime(timeStr: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.customEndTime = timeStr;
    this.isEndTimePickerOpen = false;
    this.onTimeOrDateChange();
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Chọn ngày';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  getMonthYearTitle(): string {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return `${monthNames[this.calendarViewMonth]}, ${this.calendarViewYear}`;
  }

  refreshCalendarAndSlots(): void {
    this.userScheduleEvents = this.googleCalendarService.getUserEventsForDate(this.customBookingDate, this.studentInfo.email);
    this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots(this.customBookingDate, this.studentInfo.email);
    
    const rawEmbed = this.googleCalendarService.generateEmbedUrl(this.studentInfo.email, this.calendarEmbedMode, this.customBookingDate);
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawEmbed);

    this.checkConflict();
    this.cdr.detectChanges();
  }

  checkConflict(): void {
    const check = this.googleCalendarService.checkConflict(
      this.customBookingDate,
      this.customStartTime,
      this.customEndTime,
      this.studentInfo.email
    );
    this.hasConflict = check.hasConflict;
    this.conflictReason = check.reason;
  }

  setCalendarEmbedMode(mode: 'AGENDA' | 'WEEK' | 'MONTH'): void {
    this.calendarEmbedMode = mode;
    const rawEmbed = this.googleCalendarService.generateEmbedUrl(this.studentInfo.email, this.calendarEmbedMode, this.customBookingDate);
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawEmbed);
    this.cdr.detectChanges();
  }

  selectGooglePresetSlot(preset: any): void {
    this.customStartTime = preset.start;
    this.customEndTime = preset.end;
    this.onTimeOrDateChange();
  }

  calculateTotalPrice(): number {
    const rate = this.space?.hourlyPrice || 120000;
    return rate * this.customDurationHours;
  }

  // Direct Booking Execution
  proceedDirectBooking(): void {
    if (!this.space || this.space.status !== 'available' || this.hasConflict) return;

    const totalAmount = this.calculateTotalPrice();
    const bookingCode = 'BK-AIRBNB-' + Math.floor(100000 + Math.random() * 900000);
    this.confirmedBookingCode = bookingCode;

    // Khởi tạo MoMo Gateway Test
    fetch(`${SERVER_BASE_URL}/api/payments/momo/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: totalAmount,
        bookingId: this.space._id || this.space.id || 'airbnb-booking',
        orderInfo: `Thanh toán thuê ${this.space.name} (${this.customBookingDate}: ${this.customStartTime}-${this.customEndTime})`
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.momoModal = {
            isOpen: true,
            orderId: data.orderId,
            payUrl: data.payUrl || '',
            qrCodeUrl: data.qrCodeUrl || '',
            amount: totalAmount
          };
          this.cdr.detectChanges();
        } else {
          this.completeBookingSuccess();
        }
      })
      .catch(() => {
        this.completeBookingSuccess();
      });
  }

  completeBookingSuccess(): void {
    this.bookingSuccess = true;
    this.space.status = 'in-use';
    this.space.statusText = 'Đang sử dụng';

    const duration = this.customDurationHours || 2;
    const totalAmount = Math.round((this.space.hourlyPrice || 100000) * duration);

    // Đồng bộ Realtime sang Lịch sử đặt chỗ & gửi thông báo chuông
    this.bookingService.addBooking({
      id: this.confirmedBookingCode,
      roomName: this.space.name,
      building: this.space.building,
      roomType: this.space.category || 'Phòng họp & Văn phòng',
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Họp đối tác & Làm việc tự động hoá UEL Space',
      capacity: this.space.capacity || 10,
      totalAmount
    });

    // Lưu ngay vào lịch cá nhân người dùng để cập nhật trạng thái bận
    this.googleCalendarService.addBookingToCalendar({
      roomName: this.space.name,
      date: this.customBookingDate,
      startTime: this.customStartTime,
      endTime: this.customEndTime,
      code: this.confirmedBookingCode,
      userEmail: this.studentInfo.email
    });

    // Làm mới lại lịch sau khi đặt thành công
    this.refreshCalendarAndSlots();
    this.cdr.detectChanges();
  }

  confirmMomoPaymentSuccess(): void {
    this.momoModal.isOpen = false;
    this.completeBookingSuccess();
  }

  closeMomoModal(): void {
    this.momoModal.isOpen = false;
  }

  openGoogleCalendarExternal(): void {
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Lịch trống ${this.space?.name || 'Không gian'}`,
      roomName: this.space?.name || 'Không gian',
      building: this.space?.building || 'UEL Central Space',
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Tra cứu & Đặt không gian làm việc',
      bookerName: this.studentInfo.name
    });
  }

  downloadIcsFile(): void {
    this.googleCalendarService.downloadIcsFile({
      title: `[UEL SPACE] Lịch thuê ${this.space?.name || 'Không gian'}`,
      roomName: this.space?.name || 'Không gian',
      building: this.space?.building || 'UEL Central Space',
      code: this.confirmedBookingCode || 'UEL-BOOKING',
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Làm việc & Hội họp chuyên nghiệp',
      bookerName: this.studentInfo.name
    });
  }

  triggerToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  // ==================== SELLER PROFILE NAVIGATION ====================
  navigateToSellerPage(sellerIdOrBrand?: string): void {
    const targetId = sellerIdOrBrand || 
                     this.space?.sellerId || 
                     this.space?.seller?.id || 
                     this.space?.seller?.code ||
                     this.space?.seller?.brandName || 
                     this.space?.seller?.name ||
                     'seller-techpark';

    const profile = this.sellersService.getSellerById(targetId);
    const id = profile?.id || targetId;
    this.router.navigate(['/sellers', id]);
  }
}
