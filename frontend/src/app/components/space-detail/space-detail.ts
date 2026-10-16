import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { ReviewsService, SpaceReview } from '../../services/reviews.service';
import { getFallbackMarketplaceSpaces, normalizeSpace } from '../../services/spaces-data';
import { SERVER_BASE_URL, SERVER_IMAGES_LINK } from '../../services/api-config';
import { TranslatePipe } from '../../services/translate.pipe';

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

  defaultFallbackImage = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80';
  server_images_link = SERVER_IMAGES_LINK;

  studentInfo = {
    name: 'Khách hàng UEL Space',
    email: 'khachhang@uel.edu.vn',
    org: 'Doanh nghiệp / Đơn vị Hợp tác'
  };

  ngOnInit(): void {
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

    this.suggestedGoogleSlots = this.googleCalendarService.getSuggestedSlots();

    // Lắng nghe thay đổi không gian qua tham số URL (/spaces/:id)
    this.route.paramMap.subscribe(params => {
      this.spaceId = params.get('id') || '';
      if (this.spaceId) {
        this.loadSpaceDetails(this.spaceId);
      } else {
        this.router.navigate(['/map']);
      }
    });
  }

  async loadSpaceDetails(id: string) {
    this.isLoading = true;
    this.selectedImageIndex = 0;
    this.cdr.detectChanges();

    // 1. Tra cứu trong dataset nội bộ phong phú (Fallback dataset 100 phòng)
    const fallbackList = getFallbackMarketplaceSpaces();
    const localMatch = fallbackList.find(s => 
      s._id === id || 
      s.id === id || 
      s.code === id ||
      (s.name && s.name.toLowerCase().includes(id.toLowerCase()))
    );

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

  initCalendarAndReviews() {
    this.customDurationHours = this.googleCalendarService.calculateDuration(this.customStartTime, this.customEndTime);
    const rawUrl = this.googleCalendarService.generateEmbedUrl(this.space.name, 'AGENDA');
    this.googleEmbedSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);

    // Nạp reviews và tính rating
    this.loadReviews();
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
      userAvatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 50)}?w=120&h=120&fit=crop`,
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

  // Booking Time Calculation
  onTimeOrDateChange(): void {
    this.customDurationHours = this.googleCalendarService.calculateDuration(this.customStartTime, this.customEndTime);
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
    if (!this.space || this.space.status !== 'available') return;

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

    // Thêm vào Google Calendar
    this.googleCalendarService.openGoogleCalendar({
      title: `[UEL SPACE] Đặt ${this.space.name}`,
      roomName: this.space.name,
      building: this.space.building,
      code: this.confirmedBookingCode,
      date: this.customBookingDate,
      timeSlot: `${this.customStartTime} - ${this.customEndTime}`,
      purpose: 'Họp đối tác & Làm việc tự động hoá UEL Space',
      bookerName: this.studentInfo.name
    });

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
}
