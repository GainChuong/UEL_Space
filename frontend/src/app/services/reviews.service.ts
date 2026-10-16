import { Injectable } from '@angular/core';

export interface SpaceReview {
  id: string;
  spaceId: string;
  userName: string;
  userAvatar: string;
  userRole?: string;
  organization?: string;
  rating: number; // 1 to 5
  date: string;
  comment: string;
  likes: number;
  userLiked?: boolean;
  rentalPurpose?: string; // Ví dụ: Họp ban giám đốc, Hội thảo AI, Chụp ảnh Lookbook, Tự học...
  verifiedStay?: boolean;
  images?: string[];
  reply?: {
    hostName: string;
    hostAvatar: string;
    date: string;
    comment: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private storageKey = 'uel_space_user_reviews';

  // Mock comments database phong phú, chân thực cho các không gian UEL Space (chuẩn phong cách Airbnb)
  private initialReviews: SpaceReview[] = [
    {
      id: 'rev-01',
      spaceId: 'indoor_meeting_room_2',
      userName: 'Trần Minh Anh',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      userRole: 'CEO • FinTech Solutions Vietnam',
      organization: 'Doanh nghiệp Đối tác UEL',
      rating: 5,
      date: '14/10/2026',
      rentalPurpose: 'Họp Hội đồng Quản trị & Ký kết Chiến lược',
      comment: 'Không gian họp cực kỳ sang trọng và chuyên nghiệp! Màn hình 4K sắc nét, hệ thống micro đa hướng bắt âm rất tốt dù đoàn của chúng tôi ngồi kín bàn 12 người. Ghế da cao cấp ngồi suốt 3 tiếng không hề mỏi. Nhân viên hỗ trợ tận tình từ khâu đón tiếp dưới sảnh.',
      likes: 18,
      verifiedStay: true,
      reply: {
        hostName: 'TechPark Executive Spaces',
        hostAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop',
        date: '14/10/2026',
        comment: 'Cảm ơn anh Minh Anh và ban lãnh đạo FinTech Solutions đã tin tưởng UEL Space. Rất vinh hạnh được đồng hành cùng các cuộc họp cấp cao tiếp theo của quý công ty!'
      }
    },
    {
      id: 'rev-02',
      spaceId: 'indoor_meeting_room_2',
      userName: 'ThS. Nguyễn Hoàng Nam',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
      userRole: 'Trưởng ban Đổi mới Sáng tạo',
      organization: 'Viện Công nghệ Tài chính UEL',
      rating: 5,
      date: '10/10/2026',
      rentalPurpose: 'Họp hội đồng bảo vệ đề án tốt nghiệp',
      comment: 'Cảm biến AI Occupancy đếm số người chính xác, điều hòa tự động làm mát trước 10 phút rất chu đáo. Không gian cách âm tuyệt đối, bảo mật tuyệt đối cho các buổi họp mang tính chiến lược của viện.',
      likes: 9,
      verifiedStay: true
    },
    {
      id: 'rev-03',
      spaceId: 'indoor_meeting_room_2',
      userName: 'Lê Quỳnh Giang',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
      userRole: 'Product Lead • SmartCity VN',
      organization: 'Startup AI Incubator',
      rating: 4,
      date: '05/10/2026',
      rentalPurpose: 'Demo sản phẩm cùng nhà đầu tư',
      comment: 'Vị trí đắc địa dễ tìm, bãi đỗ xe rộng rãi. Mạng cáp quang 1Gbps truyền tải stream mượt mà. Điểm cộng lớn là thủ tục check-in bằng mã QR 1 chạm tại cổng cực nhanh.',
      likes: 6,
      verifiedStay: true
    },
    {
      id: 'rev-04',
      spaceId: 'indoor_meeting_room_2',
      userName: 'Vũ Đức Thịnh',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
      userRole: 'Chuyên viên Phân tích Dữ liệu',
      organization: 'K21 Khoa Hệ thống Thông tin UEL',
      rating: 5,
      date: '28/09/2026',
      rentalPurpose: 'Làm việc nhóm dự án Hackathon',
      comment: 'Được đặt phòng với giá trợ giá sinh viên UEL rất hợp lý. Không gian sạch bóng, có máy pha cà phê và nước lọc miễn phí ngoài hành lang.',
      likes: 12,
      verifiedStay: true
    },
    {
      id: 'rev-05',
      spaceId: 'indoor_meeting_room_1',
      userName: 'Đặng Thảo Vy',
      userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop',
      userRole: 'Founder • GreenEdu Hub',
      organization: 'Doanh nghiệp Giáo dục Xanh',
      rating: 5,
      date: '12/10/2026',
      rentalPurpose: 'Workshop đào tạo kỹ năng lãnh đạo',
      comment: 'Bàn ghế bố trí trang nhã chuẩn Airbnb Business. Đầy đủ bảng kính tương tác và bút lông sạch sẽ. Đặt chỗ trên web xong nhận ngay mã QR và tự động add vào Google Calendar rất tiện.',
      likes: 14,
      verifiedStay: true
    },
    {
      id: 'rev-06',
      spaceId: 'indoor_meeting_room_1',
      userName: 'Phạm Minh Trí',
      userAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop',
      userRole: 'Giám đốc Vận hành',
      organization: 'Alpha Venture Partners',
      rating: 5,
      date: '08/10/2026',
      rentalPurpose: 'Thẩm định đầu tư Series A',
      comment: 'Trải nghiệm vượt mong đợi so với các dịch vụ cho thuê văn phòng thông thường. Quy trình tự động hoá cao, không gian yên tĩnh và riêng tư tuyệt đối.',
      likes: 7,
      verifiedStay: true
    },
    {
      id: 'rev-07',
      spaceId: 'thu-vien-2',
      userName: 'Hồ Tuấn Kiệt',
      userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop',
      userRole: 'Sinh viên K22',
      organization: 'Khoa Tài chính - Ngân hàng',
      rating: 5,
      date: '15/10/2026',
      rentalPurpose: 'Ôn tập kỳ thi chứng chỉ CFA',
      comment: 'Khuôn viên Hot Desk cực kỳ yên tĩnh, ánh sáng tự nhiên chan hòa, view nhìn ra công viên Suối Nhum rất thư thái. Ổ cắm điện và cổng sạc Type-C bố trí tại từng ghế.',
      likes: 21,
      verifiedStay: true
    },
    {
      id: 'rev-08',
      spaceId: 'choi-1',
      userName: 'Ngô Mai Phương',
      userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
      userRole: 'Remote Senior UI/UX Designer',
      organization: 'DesignStudio Global',
      rating: 5,
      date: '13/10/2026',
      rentalPurpose: 'Phỏng vấn online với khách hàng US',
      comment: 'Focus Pod cách âm 3 lớp cực đỉnh! Bên ngoài có người đi lại nói chuyện nhưng bên trong yên lặng hoàn toàn, micro thu âm giọng nói trong trẻo.',
      likes: 16,
      verifiedStay: true
    }
  ];

  // Các đánh giá tổng quát được tự động sinh ngẫu nhiên cho bất kỳ spaceId nào chưa có review mẫu riêng
  private generalReviewTemplates = [
    {
      userName: 'Hoàng Nhật Minh',
      userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop',
      userRole: 'Quản lý Dự án Công nghệ',
      rating: 5,
      comment: 'Cực kỳ ưng ý với chất lượng không gian và trang thiết bị hiện đại. Quy trình check-in tự động rất mượt, thanh toán MoMo nhận phòng ngay lập tức.',
      likes: 8
    },
    {
      userName: 'Phan Bảo Ngọc',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      userRole: 'HR & Event Coordinator',
      rating: 5,
      comment: 'Không gian chuẩn gu hiện đại, sạch sẽ và thoáng đãng. Đối tác của chúng tôi rất ấn tượng với hệ thống bảng kính tương tác và máy chiếu sắc nét.',
      likes: 11
    },
    {
      userName: 'Lý Quốc Huy',
      userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop',
      userRole: 'Đại diện Doanh nghiệp Khách mời',
      rating: 4,
      comment: 'Phòng ốc rộng rãi, nhiệt độ điều hòa mát mẻ dễ chịu. Cáp quang tốc độ cao họp video call quốc tế không hề bị giật lag một giây nào.',
      likes: 5
    },
    {
      userName: 'Trịnh Cẩm Tú',
      userAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop',
      userRole: 'Nghiên cứu sinh Kinh tế số',
      rating: 5,
      comment: 'Môi trường làm việc yên tĩnh, tập trung cao độ. Ban quản lý hỗ trợ kỹ thuật siêu nhanh qua kênh Chatbot AI.',
      likes: 15
    }
  ];

  constructor() {}

  /**
   * Lấy toàn bộ đánh giá của một không gian cụ thể
   */
  getReviewsForSpace(spaceId: string): SpaceReview[] {
    const customReviews = this.getStoredUserReviews().filter(r => r.spaceId === spaceId);
    const existing = this.initialReviews.filter(r => r.spaceId === spaceId);

    if (customReviews.length > 0 || existing.length > 0) {
      return [...customReviews, ...existing];
    }

    // Nếu không gian mới chưa có review nào, tự động tạo 3-4 review chân thực chất lượng cao
    return [
      ...customReviews,
      ...this.generateFallbackReviewsForSpace(spaceId)
    ];
  }

  /**
   * Thêm bình luận mới từ người dùng (Lưu vào LocalStorage)
   */
  addReview(reviewData: Omit<SpaceReview, 'id' | 'date' | 'likes'>): SpaceReview {
    const newReview: SpaceReview = {
      ...reviewData,
      id: 'usr-rev-' + Date.now(),
      date: 'Hôm nay lúc ' + new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
      likes: 1,
      userLiked: true,
      verifiedStay: true
    };

    const stored = this.getStoredUserReviews();
    stored.unshift(newReview);
    this.saveStoredUserReviews(stored);

    return newReview;
  }

  /**
   * Thả like cho bình luận
   */
  toggleLike(reviewId: string): boolean {
    const stored = this.getStoredUserReviews();
    const target = stored.find(r => r.id === reviewId);
    if (target) {
      if (target.userLiked) {
        target.likes = Math.max(0, target.likes - 1);
        target.userLiked = false;
      } else {
        target.likes += 1;
        target.userLiked = true;
      }
      this.saveStoredUserReviews(stored);
      return target.userLiked;
    }

    // Với mock data mặc định
    const defaultReview = this.initialReviews.find(r => r.id === reviewId);
    if (defaultReview) {
      if (defaultReview.userLiked) {
        defaultReview.likes = Math.max(0, defaultReview.likes - 1);
        defaultReview.userLiked = false;
      } else {
        defaultReview.likes += 1;
        defaultReview.userLiked = true;
      }
      return defaultReview.userLiked;
    }

    return false;
  }

  private generateFallbackReviewsForSpace(spaceId: string): SpaceReview[] {
    return this.generalReviewTemplates.map((t, idx) => ({
      id: `gen-${spaceId}-${idx}`,
      spaceId: spaceId,
      userName: t.userName,
      userAvatar: t.userAvatar,
      userRole: t.userRole,
      organization: 'Cộng đồng Khách thuê UEL Space',
      rating: t.rating,
      date: `${10 - idx}/10/2026`,
      rentalPurpose: idx % 2 === 0 ? 'Hội thảo & Làm việc chuyên nghiệp' : 'Họp chiến lược & Đào tạo',
      comment: t.comment,
      likes: t.likes,
      verifiedStay: true
    }));
  }

  private getStoredUserReviews(): SpaceReview[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStoredUserReviews(reviews: SpaceReview[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(reviews));
    } catch (e) {
      console.warn('Lỗi lưu review vào LocalStorage:', e);
    }
  }
}
