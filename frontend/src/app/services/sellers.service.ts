import { Injectable } from '@angular/core';
import { SPACES_100_DATA } from './spaces_100_data';
import { normalizeSpace } from './spaces-data';

export interface SellerRatingCategory {
  name: string;
  score: number;
  icon: string;
}

export interface SellerReviewItem {
  id: string;
  userName: string;
  userAvatar: string;
  userRole: string;
  organization: string;
  rating: number;
  date: string;
  spaceName: string;
  comment: string;
  verifiedBooking: boolean;
  likes: number;
  reply?: {
    date: string;
    comment: string;
  };
}

export interface SellerProfile {
  id: string;
  code: string;
  fullName: string;
  brandName: string;
  email: string;
  phoneNumber: string;
  role: 'SELLER' | 'HOST';
  avatar: string;
  coverImage: string;
  rating: number;
  reviewsCount: number;
  completedBookings: number;
  responseRate: string;
  responseTime: string;
  acceptanceRate: string;
  verified: boolean;
  badge: string;
  tier: string;
  experienceYears: number;
  address: string;
  operatingHours: string;
  description: string;
  highlights: string[];
  certifications: string[];
  ratingCategories: SellerRatingCategory[];
  reviews: SellerReviewItem[];
}

@Injectable({
  providedIn: 'root'
})
export class SellersService {
  private sellersMap: Record<string, SellerProfile> = {
    'seller-techpark': {
      id: 'seller-techpark',
      code: 'SELLER-TECHPARK',
      fullName: 'Nguyễn Trần Kim Giang',
      brandName: 'TechPark Executive Spaces',
      email: 'techpark.executive@uelspace.vn',
      phoneNumber: '0908 112 233',
      role: 'SELLER',
      avatar: '/images/avatars/seller_uel.svg',
        coverImage: '/images/spaces/indoor_coworking_lounge_1.jpg',
      rating: 4.96,
      reviewsCount: 142,
      completedBookings: 320,
      responseRate: '99%',
      responseTime: '< 15 phút',
      acceptanceRate: '98%',
      verified: true,
      badge: 'SuperHost • Đối tác Hạng Vàng',
      tier: 'Đối tác Hạng Vàng (Gold Partner)',
      experienceYears: 5,
      address: 'TechPark Tower, Đường D1, Khu Công nghệ cao, TP. Thủ Đức, TP.HCM',
      operatingHours: '07:30 - 22:00 (Thứ 2 - Chủ Nhật)',
      description: 'TechPark Executive Spaces là đơn vị tiên phong cung cấp giải pháp không gian làm việc chuyên nghiệp, phòng họp cấp cao (Executive Boardroom) và văn phòng riêng biệt lập chuẩn quốc tế. Mọi phòng đều được trang bị hệ thống Teleconference 4K, cảm biến AI Occupancy giám sát sĩ số thông minh và bảo mật vân tay sinh trắc học.',
      highlights: [
        'Hệ thống phòng họp VIP chuẩn Cisco Teleconference 4K',
        'Tích hợp cảm biến AI Occupancy đếm người thời gian thực',
        'Lễ tân chuyên nghiệp đón tiếp khách và phục vụ tea-break',
        'Xuất hóa đơn GTGT điện tử ngay sau khi hoàn thành ca thuê',
        'Check-in tức thì bằng mã QR thông minh tại cổng phòng'
      ],
      certifications: [
        'Đối tác Hạng Vàng UEL Space 2026',
        'Chứng nhận An toàn PCCC & Cứu nạn Cứu hộ Quốc tế',
        'Tiêu chuẩn Xanh Green Office Standard'
      ],
      ratingCategories: [
        { name: 'Chất lượng trang thiết bị & Âm thanh 4K', score: 4.98, icon: 'device' },
        { name: 'Vệ sinh & Không gian cao cấp', score: 4.97, icon: 'clean' },
        { name: 'Tốc độ hỗ trợ & Tinh thần phục vụ', score: 4.99, icon: 'service' },
        { name: 'Độ chính xác so với hình ảnh trên sàn', score: 4.95, icon: 'check' },
        { name: 'Quy trình Check-in QR & Ra vào thông minh', score: 4.96, icon: 'qr' },
        { name: 'Giá trị tương xứng chi phí thuê', score: 4.94, icon: 'value' }
      ],
      reviews: [
        {
          id: 'rev-tp-1',
          userName: 'Trần Minh Anh',
          userAvatar: '/images/avatars/user_avatar_1.svg',
          userRole: 'CEO • FinTech Solutions Vietnam',
          organization: 'Doanh nghiệp Đối tác UEL',
          rating: 5,
          date: '14/10/2026',
          spaceName: 'Boardroom VIP B1 (Meeting Room)',
          comment: 'TechPark Executive luôn là lựa chọn số một cho các cuộc họp HĐQT quan trọng của chúng tôi. Không gian cực kỳ trang trọng, cách âm hoàn hảo, màn hình 4K sắc nét và micro không dây hoạt động trơn tru. Đội ngũ hỗ trợ chu đáo từ khâu tiếp đón tại sảnh.',
          verifiedBooking: true,
          likes: 24,
          reply: {
            date: '14/10/2026',
            comment: 'Cảm ơn anh Minh Anh và ban lãnh đạo FinTech Solutions đã luôn tin tưởng TechPark Executive Spaces. Rất hân hạnh được đồng hành cùng quý công ty trong các sự kiện sắp tới!'
          }
        },
        {
          id: 'rev-tp-2',
          userName: 'ThS. Nguyễn Hoàng Nam',
          userAvatar: '/images/avatars/user_avatar_2.svg',
          userRole: 'Trưởng ban Đổi mới Sáng tạo',
          organization: 'Viện Công nghệ Tài chính UEL',
          rating: 5,
          date: '10/10/2026',
          spaceName: 'Private Suite A2 (Office)',
          comment: 'Phòng làm việc riêng tư, đầy đủ máy chiếu, bảng kính và ổ cắm điện khắp nơi. Cảm biến AI Occupancy đếm số người chính xác, điều hòa bật sẵn mát lạnh trước giờ hẹn. Rất chuyên nghiệp!',
          verifiedBooking: true,
          likes: 15
        },
        {
          id: 'rev-tp-3',
          userName: 'Phạm Quỳnh Như',
          userAvatar: '/images/avatars/user_avatar_3.svg',
          userRole: 'Venture Partner',
          organization: 'NextGen Ventures',
          rating: 5,
          date: '02/10/2026',
          spaceName: 'Boardroom VIP B1 (Meeting Room)',
          comment: 'Các buổi pitching gọi vốn cần sự trang trọng và TechPark đã đáp ứng vượt kỳ vọng. Lễ tân phục vụ nước uống và cà phê thơm ngon, wifi tốc độ cao không bị gián đoạn giây nào.',
          verifiedBooking: true,
          likes: 19
        }
      ]
    },

    'seller-innovate': {
      id: 'seller-innovate',
      code: 'SELLER-INNOVATE',
      fullName: 'Lê Hoàng Long',
      brandName: 'Innovate Co-working Network',
      email: 'innovate.hub@uelspace.vn',
      phoneNumber: '0918 223 344',
      role: 'SELLER',
      avatar: '/images/spaces/indoor_coworking_lounge_1.jpg',
      coverImage: '/images/spaces/indoor_coworking_lounge_1.jpg',
      rating: 4.92,
      reviewsCount: 215,
      completedBookings: 540,
      responseRate: '98%',
      responseTime: '< 20 phút',
      acceptanceRate: '99%',
      verified: true,
      badge: 'SuperHost • Mạng lưới Co-working',
      tier: 'Đối tác Bạch Kim (Platinum Partner)',
      experienceYears: 4,
      address: 'Tòa nhà Innovation Hub, 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức, TP.HCM',
      operatingHours: '07:00 - 23:00 (Mở cửa tất cả các ngày)',
      description: 'Innovate Co-working Network sở hữu chuỗi bàn làm việc linh hoạt (Hot Desk), cabin tự học thông minh và Meeting Pod cách âm hiện đại bậc nhất khu đô thị sáng tạo phía Đông. Không gian mở ngập tràn ánh sáng, trà và cà phê pha máy miễn phí, là cái nôi lý tưởng cho các startup công nghệ và freelancer sáng tạo.',
      highlights: [
        'Khu vực Hot Desk hơn 120 chỗ ngồi kèm cổng sạc Type-C đa năng',
        'Meeting Pod Solo & Focus Booth cách âm tiêu chuẩn 35dB',
        'Pantry cà phê hạt Espresso, trà thảo mộc & nước detox miễn phí',
        'Tủ Locker cá nhân khóa số thông minh an toàn tuyệt đối',
        'Môi trường networking năng động với hơn 50 startup thành viên'
      ],
      certifications: [
        'Top 1 Không Gian Coworking Yêu Thích 2025',
        'Chứng nhận Môi trường Làm việc Xanh (Green Workhub)'
      ],
      ratingCategories: [
        { name: 'Không gian mở & Ánh sáng tự nhiên', score: 4.96, icon: 'clean' },
        { name: 'Độ yên tĩnh tại các Meeting Pod', score: 4.93, icon: 'device' },
        { name: 'Tiện ích Pantry & Cà phê miễn phí', score: 4.97, icon: 'service' },
        { name: 'Hạ tầng mạng cáp quang 1Gbps', score: 4.94, icon: 'check' },
        { name: 'Tốc độ check-in và hỗ trợ tại quầy', score: 4.91, icon: 'qr' },
        { name: 'Mức giá thuê linh hoạt theo giờ', score: 4.95, icon: 'value' }
      ],
      reviews: [
        {
          id: 'rev-in-1',
          userName: 'Lê Quỳnh Giang',
          userAvatar: '/images/avatars/user_avatar_4.svg',
          userRole: 'Product Lead • SmartCity VN',
          organization: 'Startup AI Incubator',
          rating: 5,
          date: '05/10/2026',
          spaceName: 'Khu Hot Desk Coworking Hub',
          comment: 'Innovate Hub có bầu không khí làm việc cực kỳ truyền cảm hứng! Bàn ghế công thái học ngồi cả ngày không đau lưng, mạng internet nhanh như chớp. Giá thuê theo giờ cực kỳ kinh tế cho các bạn làm freelance như mình.',
          verifiedBooking: true,
          likes: 16,
          reply: {
            date: '06/10/2026',
            comment: 'Cảm ơn bạn Giang đã đồng hành cùng Innovate Network. Chúc các dự án AI của bạn gặt hái nhiều thành công rực rỡ!'
          }
        },
        {
          id: 'rev-in-2',
          userName: 'Vũ Đức Thịnh',
          userAvatar: '/images/avatars/user_avatar_1.svg',
          userRole: 'Data Engineer',
          organization: 'K21 Khoa Hệ thống Thông tin UEL',
          rating: 5,
          date: '28/09/2026',
          spaceName: 'Focus Pod 1 Cách Âm Smart Booth',
          comment: 'Cabin Focus Pod cách âm siêu tốt. Mình đã ngồi phỏng vấn online 2 tiếng đồng hồ liên tục mà không hề bị lọt tạp âm bên ngoài vào micro. Quạt thông gió êm ái, ánh sáng LED rất dịu mắt.',
          verifiedBooking: true,
          likes: 21
        }
      ]
    },

    'seller-landmark': {
      id: 'seller-landmark',
      code: 'SELLER-LANDMARK',
      fullName: 'Trần Minh Khoa',
      brandName: 'Landmark Convention & Event Corp',
      email: 'landmark.events@uelspace.vn',
      phoneNumber: '0938 334 455',
      role: 'SELLER',
      avatar: '/images/spaces/indoor_coworking_lounge_1.jpg',
      coverImage: '/images/spaces/indoor_coworking_lounge_1.jpg',
      rating: 4.94,
      reviewsCount: 76,
      completedBookings: 180,
      responseRate: '95%',
      responseTime: '< 30 phút',
      acceptanceRate: '96%',
      verified: true,
      badge: 'Chuyên gia Sự kiện & Hội thảo',
      tier: 'Đối tác Kim Cương (Diamond Partner)',
      experienceYears: 8,
      address: 'Landmark Tower, 208 Nguyễn Hữu Cảnh, P. 22, Q. Bình Thạnh, TP.HCM',
      operatingHours: '08:00 - 22:00 (Hỗ trợ setup đêm theo yêu cầu)',
      description: 'Landmark Convention & Event Corp chuyên quản lý và vận hành hệ thống hội trường bậc thang, phòng hội nghị thượng đỉnh quy mô từ 50 đến 400 khách. Hệ thống trang bị màn hình LED P2.5 siêu nét, dàn âm thanh Line Array hòa âm biểu diễn, hỗ trợ trọn gói kỹ thuật viên âm thanh ánh sáng trực phòng.',
      highlights: [
        'Hội trường lớn 350 khách với sân khấu biểu diễn chuyên nghiệp',
        'Màn hình LED P2.5 kích thước lớn cùng hệ thống đèn sân khấu DMX',
        'Kỹ thuật viên âm thanh ánh sáng túc trực hỗ trợ suốt sự kiện',
        'Sảnh Foyer riêng biệt thuận tiện cho tiệc Tea-Break và Check-in',
        'Hầm đỗ xe ô tô và xe máy sức chứa lớn có thang máy trực tiếp'
      ],
      certifications: [
        'Nhà Cung Cấp Sự Kiện & Hội Nghị Tiêu Chuẩn 5 Sao 2025',
        'Chứng nhận Hệ thống Âm thanh Shure & JBL Chuyên Nghiệp'
      ],
      ratingCategories: [
        { name: 'Quy mô khán phòng & Tầm nhìn sân khấu', score: 4.97, icon: 'clean' },
        { name: 'Màn hình LED & Chất lượng âm thanh', score: 4.96, icon: 'device' },
        { name: 'Kỹ thuật viên túc trực hỗ trợ sự kiện', score: 4.98, icon: 'service' },
        { name: 'Sảnh đón tiếp Foyer & Bãi đỗ xe', score: 4.92, icon: 'check' },
        { name: 'Quy trình ký kết & Xuất hóa đơn nhanh', score: 4.93, icon: 'qr' },
        { name: 'Mức độ hài lòng của khách tham dự', score: 4.95, icon: 'value' }
      ],
      reviews: [
        {
          id: 'rev-lm-1',
          userName: 'Đặng Tuấn Anh',
          userAvatar: '/images/avatars/user_avatar_2.svg',
          userRole: 'Trưởng ban Tổ chức',
          organization: 'Vietnam Tech Summit 2026',
          rating: 5,
          date: '08/10/2026',
          spaceName: 'Hội Trường & Event Hall Landmark A3',
          comment: 'Sự kiện thường niên của chúng tôi với 100 khách mời đã diễn ra thành công mỹ mãn tại Landmark. Màn hình LED cực kỳ sắc nét, kỹ thuật viên âm thanh phối hợp ăn ý từng tiết mục. Khách tham dự đều khen ngợi tầm nhìn đẹp mắt ra sông Sài Gòn.',
          verifiedBooking: true,
          likes: 27,
          reply: {
            date: '09/10/2026',
            comment: 'Landmark Convention rất vinh dự được đóng góp vào thành công của Vietnam Tech Summit. Hẹn gặp lại quý ban tổ chức trong kỳ sự kiện năm sau!'
          }
        }
      ]
    },

    'seller-uel': {
      id: 'seller-uel',
      code: 'SELLER-UEL',
      fullName: 'TS. Trịnh Thị Kim Chi',
      brandName: 'Ban Quản trị Cơ sở vật chất UEL Space',
      email: 'bql.csvc@uel.edu.vn',
      phoneNumber: '028 3724 4555',
      role: 'SELLER',
      avatar: '/images/spaces/indoor_coworking_lounge_1.jpg',
      coverImage: '/images/spaces/indoor_coworking_lounge_1.jpg',
      rating: 4.89,
      reviewsCount: 94,
      completedBookings: 610,
      responseRate: '97%',
      responseTime: '< 10 phút',
      acceptanceRate: '97%',
      verified: true,
      badge: 'Đại học Kinh tế - Luật Official',
      tier: 'Đơn vị Chủ quản ĐHQG',
      experienceYears: 15,
      address: 'Trường Đại học Kinh tế - Luật, 669 QL1A, P. Linh Xuân, TP. Thủ Đức, TP.HCM',
      operatingHours: '07:00 - 21:00 (Các ngày trong tuần)',
      description: 'Ban Quản trị Cơ sở vật chất UEL Space trực tiếp quản lý hệ thống giảng đường đa năng, phòng thực hành máy tính cấu hình cao (Computer Lab) và các phòng hội thảo học thuật. Không gian được bảo dưỡng định kỳ hàng tuần, trang bị máy chiếu công suất lớn, bảng từ chống lóa và điều hòa 2 chiều phục vụ giảng dạy, đào tạo doanh nghiệp.',
      highlights: [
        'Giảng đường đa năng sức chứa từ 50 đến 120 chỗ ngồi',
        'Phòng Lab 40 máy Core i7 RAM 16GB mạng Gigabit chuyên dụng',
        'Khuôn viên xanh rợp bóng cây với bãi đỗ xe rộng rãi thuận tiện',
        'Chính sách ưu đãi đặc biệt cho sinh viên, cựu sinh viên & đối tác liên kết',
        'Hệ thống an ninh và camera giám sát trực 24/7'
      ],
      certifications: [
        'Cơ sở Giáo dục Đạt Chuẩn Kiểm Định Quốc Gia',
        'Hạ tầng Công nghệ Thông tin Chuẩn Đại học Quốc gia TP.HCM'
      ],
      ratingCategories: [
        { name: 'Cấu hình máy tính & Mạng thực hành', score: 4.94, icon: 'device' },
        { name: 'Độ rộng rãi & Bàn ghế giảng đường', score: 4.88, icon: 'clean' },
        { name: 'Hỗ trợ kỹ thuật máy chiếu & Micro', score: 4.92, icon: 'service' },
        { name: 'Chính sách giá hỗ trợ đào tạo', score: 4.96, icon: 'value' },
        { name: 'Môi trường học thuật văn minh', score: 4.91, icon: 'check' },
        { name: 'Quy trình phê duyệt và xác nhận đặt', score: 4.85, icon: 'qr' }
      ],
      reviews: [
        {
          id: 'rev-uel-1',
          userName: 'Đặng Tuấn Anh',
          userAvatar: '/images/avatars/user_avatar_3.svg',
          userRole: 'Giảng viên Doanh nghiệp',
          organization: 'Khoa Hệ thống Thông tin UEL',
          rating: 5,
          date: '04/10/2026',
          spaceName: 'Phòng Thực Hành Tin Học B1.202 (Computer Lab)',
          comment: 'Phòng Lab cấu hình mạnh, cài đặt sẵn toàn bộ môi trường Python, Docker và Tableau cho học viên thực hành. Đội ngũ kỹ thuật hỗ trợ tận tình, nhiệt độ phòng lạnh duy trì rất dễ chịu suốt buổi học.',
          verifiedBooking: true,
          likes: 18
        }
      ]
    },

    'seller-creative': {
      id: 'seller-creative',
      code: 'SELLER-CREATIVE',
      fullName: 'Đỗ Thùy Linh',
      brandName: 'Creative Hub Media Studios',
      email: 'media.lab@uelspace.vn',
      phoneNumber: '0988 556 677',
      role: 'SELLER',
      avatar: '/images/spaces/indoor_coworking_lounge_1.jpg',
      coverImage: '/images/spaces/indoor_coworking_lounge_1.jpg',
      rating: 4.97,
      reviewsCount: 63,
      completedBookings: 155,
      responseRate: '100%',
      responseTime: '< 5 phút',
      acceptanceRate: '99%',
      verified: true,
      badge: 'Studio Sáng tạo Đạt chuẩn',
      tier: 'Đối tác Sáng tạo Hạng A',
      experienceYears: 3,
      address: 'Creative Hub Center, 42 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
      operatingHours: '08:00 - 23:00 (Hỗ trợ quay đêm theo lịch book)',
      description: 'Creative Hub Media Studios là tổ hợp sản xuất nội dung số chuyên nghiệp tọa lạc ngay trung tâm Quận 1. Chúng tôi cung cấp phòng quay livestream 4K, studio ghi hình phông xanh kéo tự động, phòng thu âm podcast trang bị RodeCaster Pro và bộ đèn Nanlite chuyên dụng cho các nhà sáng tạo nội dung và nhãn hàng.',
      highlights: [
        'Phông xanh kéo cơ động cùng hệ thống đèn Nanlite 300W',
        'Bàn trộn âm thanh RodeCaster Pro II kèm 4 micro Rode PodMic',
        'Màn hình Preview Sony 4K 55 inch chuẩn màu Rec.709',
        'Đường truyền internet cáp quang đối xứng 1Gbps cam kết không rớt live',
        'Khu vực phòng thay đồ, bàn trang điểm ánh sáng chuẩn studio'
      ],
      certifications: [
        'Studio Ghi Hình & Podcast Chuẩn Sáng Tạo Nội Dung 2026',
        'Đối tác Kỹ Thuật Độc Quyền Livestream Showroom'
      ],
      ratingCategories: [
        { name: 'Thiết bị ghi hình & Ánh sáng Nanlite', score: 4.99, icon: 'device' },
        { name: 'Chất lượng xử lý tiêu âm & Cách âm', score: 4.98, icon: 'clean' },
        { name: 'Kỹ thuật viên set up đèn & Âm thanh', score: 4.97, icon: 'service' },
        { name: 'Bàn trang điểm & Tiện ích hậu cần', score: 4.95, icon: 'check' },
        { name: 'Đường truyền internet livestream', score: 4.98, icon: 'qr' },
        { name: 'Hiệu quả chi phí cho Creator', score: 4.95, icon: 'value' }
      ],
      reviews: [
        {
          id: 'rev-cr-1',
          userName: 'Vũ Thảo My',
          userAvatar: '/images/avatars/user_avatar_4.svg',
          userRole: 'Content Creator',
          organization: 'Kênh Podcast "Chuyện Nghề AI"',
          rating: 5,
          date: '11/10/2026',
          spaceName: 'Studio Sáng tạo Creative Media A.105',
          comment: 'Chất lượng phòng thu podcast tại Creative Hub đỉnh thực sự! Micro Rode PodMic bắt tiếng cực ấm, phòng cách âm tuyệt đối không nghe thấy tiếng còi xe ngoài đường Nguyễn Huệ. Chị Linh chủ studio hỗ trợ chỉnh màu đèn cực kỳ tận tâm.',
          verifiedBooking: true,
          likes: 31,
          reply: {
            date: '12/10/2026',
            comment: 'Cảm ơn Thảo My! Podcast của bạn rất truyền cảm hứng. Cần hỗ trợ góc quay hay set đèn mới cứ nhắn chị bất cứ lúc nào nhé!'
          }
        }
      ]
    }
  };

  /**
   * Lấy danh sách tất cả các sellers
   */
  getAllSellers(): SellerProfile[] {
    return Object.values(this.sellersMap);
  }

  /**
   * Lấy chi tiết 1 seller theo ID hoặc Code hoặc BrandName
   */
  getSellerById(idOrCode: string): SellerProfile | null {
    if (!idOrCode) return null;
    const cleanKey = idOrCode.toLowerCase().trim();

    // Check exact id match
    if (this.sellersMap[cleanKey]) {
      return this.sellersMap[cleanKey];
    }

    // Check code or brand name match
    const found = Object.values(this.sellersMap).find(s => 
      s.id.toLowerCase() === cleanKey ||
      s.code.toLowerCase() === cleanKey ||
      s.brandName.toLowerCase().includes(cleanKey) ||
      cleanKey.includes(s.id.toLowerCase())
    );

    if (found) return found;

    // Fallback: Tạo profile động nếu sellerId chưa có trong map
    return {
      id: idOrCode,
      code: idOrCode.toUpperCase(),
      fullName: 'Đại diện Đối tác UEL Space',
      brandName: idOrCode.replace('seller-', '').replace('-', ' ').toUpperCase() + ' Spaces',
      email: 'contact@uelspace.vn',
      phoneNumber: '1900 1239',
      role: 'SELLER',
      avatar: '/images/spaces/indoor_coworking_lounge_1.jpg',
      coverImage: '/images/spaces/indoor_coworking_lounge_1.jpg',
      rating: 4.95,
      reviewsCount: 88,
      completedBookings: 150,
      responseRate: '98%',
      responseTime: '< 15 phút',
      acceptanceRate: '98%',
      verified: true,
      badge: 'SuperHost • Đối tác Xác thực',
      tier: 'Đối tác Tiêu chuẩn UEL Space',
      experienceYears: 3,
      address: 'Khuôn viên Đối tác UEL Space, TP.HCM',
      operatingHours: '07:30 - 22:00',
      description: 'Đối tác cho thuê không gian làm việc và phòng họp tiêu chuẩn cao trên sàn UEL Space, hỗ trợ công nghệ AI Occupancy và thanh toán trực tuyến MoMo.',
      highlights: [
        'Không gian tiện nghi chuẩn quốc tế',
        'Tích hợp công nghệ cảm biến AI thông minh',
        'Bảo mật và hỗ trợ kỹ thuật tận tâm',
        'Hỗ trợ hóa đơn VAT và đặt chỗ linh hoạt'
      ],
      certifications: [
        'Đối tác Xác thực UEL Space Marketplace 2026'
      ],
      ratingCategories: [
        { name: 'Cơ sở vật chất', score: 4.95, icon: 'device' },
        { name: 'Vệ sinh phòng', score: 4.94, icon: 'clean' },
        { name: 'Thái độ phục vụ', score: 4.98, icon: 'service' },
        { name: 'Giá cả hợp lý', score: 4.93, icon: 'value' }
      ],
      reviews: []
    };
  }

  /**
   * Lấy toàn bộ danh sách các spaces do Seller này sở hữu
   */
  getSpacesBySeller(sellerId: string): any[] {
    if (!sellerId) return [];
    const cleanId = sellerId.toLowerCase().trim();

    const matched = SPACES_100_DATA.filter(space => {
      const sId = (space.sellerId || space.seller?.id || '').toLowerCase();
      const sBrand = (space.seller?.brandName || '').toLowerCase();
      return sId === cleanId || sBrand.includes(cleanId) || cleanId.includes(sId);
    });

    return matched.map(s => normalizeSpace(s));
  }
}
