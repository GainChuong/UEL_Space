const { connectToDb, closeDb } = require('../config/db');
const { now } = require('../common/id');
const { SPACE_STATUS } = require('../common/constants');

const SELLERS = [
  {
    _id: 'seller-techpark',
    code: 'SELLER-TECHPARK',
    fullName: 'Nguyễn Trần Kim Giang',
    brandName: 'TechPark Executive Spaces',
    email: 'techpark.executive@uelspace.vn',
    phoneNumber: '0908112233',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    rating: 4.96,
    reviewsCount: 128,
    responseRate: '99%',
    verified: true,
    badge: 'SuperHost • Đối tác Hạng Vàng',
    description: 'Chuyên cung cấp văn phòng riêng cao cấp, phòng họp VIP chuẩn quốc tế và phòng đào tạo tại trung tâm TP.HCM.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-innovate',
    code: 'SELLER-INNOVATE',
    fullName: 'Lê Hoàng Long',
    brandName: 'Innovate Co-working Network',
    email: 'innovate.hub@uelspace.vn',
    phoneNumber: '0918223344',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    rating: 4.92,
    reviewsCount: 215,
    responseRate: '98%',
    verified: true,
    badge: 'SuperHost • Mạng lưới Co-working',
    description: 'Chuỗi không gian làm việc chia sẻ, Hot Desk và Meeting Pod cách âm hiện đại bậc nhất khu Công nghệ cao Thủ Đức.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-landmark',
    code: 'SELLER-LANDMARK',
    fullName: 'Trần Minh Khoa',
    brandName: 'Landmark Convention & Event Corp',
    email: 'landmark.events@uelspace.vn',
    phoneNumber: '0938334455',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    rating: 4.94,
    reviewsCount: 76,
    responseRate: '95%',
    verified: true,
    badge: 'Chuyên gia Sự kiện & Hội thảo',
    description: 'Hệ thống hội trường bậc thang, sảnh sự kiện quy mô từ 50 đến 400 khách trang bị âm thanh ánh sáng chuyên nghiệp.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-uel',
    code: 'SELLER-UEL',
    fullName: 'TS. Trịnh Thị Kim Chi',
    brandName: 'Ban Quản trị Cơ sở vật chất UEL Space',
    email: 'bql.csvc@uel.edu.vn',
    phoneNumber: '02837244555',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    rating: 4.89,
    reviewsCount: 94,
    responseRate: '97%',
    verified: true,
    badge: 'Đại học Kinh tế - Luật Official',
    description: 'Không gian học thuật, phòng máy tính thực hành chuyên sâu và giảng đường đa năng chất lượng cao phục vụ sinh viên và doanh nghiệp.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  },
  {
    _id: 'seller-creative',
    code: 'SELLER-CREATIVE',
    fullName: 'Đỗ Thùy Linh',
    brandName: 'Creative Hub Media Studios',
    email: 'media.lab@uelspace.vn',
    phoneNumber: '0988556677',
    role: 'SELLER',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    rating: 4.97,
    reviewsCount: 63,
    responseRate: '100%',
    verified: true,
    badge: 'Studio Sáng tạo Đạt chuẩn',
    description: 'Tổ hợp phòng quay livestream, studio thu âm podcast và phòng chụp sản phẩm thương mại điện tử chuyên nghiệp.',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now()
  }
];

const MARKETPLACE_SPACES = [
  {
    _id: 'a2-1',
    code: 'A2-1',
    name: 'Phòng Họp VIP Executive A2.1 (Meeting Room)',
    sellerId: 'seller-techpark',
    spaceType: 'Phòng họp VIP',
    categoryName: 'Phòng họp VIP',
    building: 'TechPark Executive',
    buildingName: 'TechPark Executive - Tầng 2',
    floor: 'Tầng 2',
    location: 'TechPark Tower, Khu Công nghệ cao, TP. Thủ Đức',
    capacity: 15,
    areaSize: 35,
    hourlyPrice: 350000,
    dailyPrice: 2400000,
    rating: 4.96,
    reviewsCount: 88,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_meeting_room_1.jpg',
    images: [
      'spaces/indoor_meeting_room_1.jpg',
      'spaces/indoor_meeting_room_2.jpg',
      'spaces/indoor_meeting_room_3.jpg'
    ],
    tags: ['SuperHost', 'AI Occupancy', 'Màn hình 4K', 'Đặt tức thì'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'meeting_room',
      caption: 'This meeting room there is a long table with chairs around it in a room with a picture hanging on the wall',
      fileName: 'Conference_640x480.jpg'
    },
    description: 'Phòng họp VIP cách âm chuẩn quốc tế, trang bị hệ thống Teleconference 4K, micro chống ồn đa hướng. • Scene Description: "This meeting room there is a long table with chairs around it in a room with a picture hanging on the wall"',
    equipment: ['Màn hình 4K cảm ứng', 'Micro hội nghị đa hướng', 'Cáp quang 1Gbps', 'Bảng kính cường lực', 'AI Occupancy Sensor']
  },
  {
    _id: 'b2-101',
    code: 'B2-101',
    name: 'Văn phòng riêng Private Suite B2.101 (Office)',
    sellerId: 'seller-techpark',
    spaceType: 'Văn phòng riêng',
    categoryName: 'Văn phòng riêng',
    building: 'TechPark Executive',
    buildingName: 'TechPark Executive - Tầng 6',
    floor: 'Tầng 6',
    location: 'TechPark Tower, Khu Công nghệ cao, TP. Thủ Đức',
    capacity: 35,
    areaSize: 55,
    hourlyPrice: 500000,
    dailyPrice: 3500000,
    rating: 4.95,
    reviewsCount: 42,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_office_1.jpg',
    images: [
      'spaces/indoor_office_1.jpg',
      'spaces/indoor_office_2.jpg',
      'spaces/indoor_office_3.jpg'
    ],
    tags: ['SuperHost', 'Khóa vân tay', 'Điều hòa 24/7', 'Bàn giám đốc'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'office',
      caption: 'This office there is a laptop computer sitting on a table in front of a bookshelf filled with books',
      fileName: 'office_001.jpg'
    },
    description: 'Văn phòng riêng cao cấp với Smart Lock, bàn làm việc công thái học và tủ tài liệu bảo mật. • Scene Description: "This office there is a laptop computer sitting on a table in front of a bookshelf filled with books"',
    equipment: ['Khóa Smart Lock', 'Bàn làm việc giám đốc', 'Điều hòa độc lập 24/7', 'Bảng từ kính', 'Tủ hồ sơ bảo mật']
  },
  {
    _id: 'thu-vien-2',
    code: 'LIB-F2',
    name: 'Khu Bàn làm việc linh hoạt Co-working Hub (Library)',
    sellerId: 'seller-innovate',
    spaceType: 'Bàn làm việc linh hoạt',
    categoryName: 'Bàn làm việc linh hoạt',
    building: 'Innovation Hub',
    buildingName: 'Innovation Hub - Tầng 2',
    floor: 'Tầng 2',
    location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
    capacity: 120,
    areaSize: 180,
    hourlyPrice: 45000,
    dailyPrice: 250000,
    rating: 4.92,
    reviewsCount: 215,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_library_1.jpg',
    images: [
      'spaces/indoor_library_1.jpg',
      'spaces/indoor_library_2.jpg',
      'spaces/indoor_library_3.jpg'
    ],
    tags: ['Co-working', 'Cổng sạc Type-C', 'Pantry cà phê', 'Yên tĩnh'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'library',
      caption: 'these two men are sitting at a table playing a game of chess in a library with bookshelves in the background',
      fileName: 'library_0023.jpg'
    },
    description: 'Không gian làm việc mở tràn ngập ánh sáng tự nhiên, quầy pantry cà phê miễn phí và bàn làm việc yên tĩnh. • Scene Description: "these two men are sitting at a table playing a game of chess in a library with bookshelves in the background"',
    equipment: ['Wifi công suất lớn Aruba', 'Cổng sạc Type-C & Power Plug', 'Đèn chống cận Ergonomic', 'Tủ locker cá nhân', 'Pantry trà & cà phê']
  },
  {
    _id: 'choi-1',
    code: 'CHOI-01',
    name: 'Focus Pod 1 Cách Âm Smart Booth (Office Pod)',
    sellerId: 'seller-innovate',
    spaceType: 'Meeting Pod cách âm',
    categoryName: 'Meeting Pod cách âm',
    building: 'Innovation Hub',
    buildingName: 'Innovation Hub - Sảnh A',
    floor: 'Tầng 1',
    location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
    capacity: 4,
    areaSize: 12,
    hourlyPrice: 70000,
    dailyPrice: 450000,
    rating: 4.94,
    reviewsCount: 56,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_office_4.jpg',
    images: [
      'spaces/indoor_office_4.jpg',
      'spaces/indoor_office_5.jpg'
    ],
    tags: ['Cách âm 35dB', 'Màn hình họp Zoom', 'Quạt thông gió'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'office',
      caption: 'hardwood flooring in a home office with a desk, chair and computer on top of a wooden desk',
      fileName: 'office_004.jpg'
    },
    description: 'Cabin cách âm 35dB thế hệ mới, trang bị màn hình họp trực tuyến và hệ thống lọc khí lưu thông liên tục. • Scene Description: "hardwood flooring in a home office with a desk, chair and computer on top of a wooden desk"',
    equipment: ['Kính cách âm 3 lớp', 'Màn hình họp trực tuyến 32 inch', 'Hệ thống thông gió cưỡng bức', 'Đèn LED tùy chỉnh độ sáng']
  },
  {
    _id: 'choi-2',
    code: 'CHOI-02',
    name: 'Meeting Pod Solo Booth 02 (Lobby Lounge)',
    sellerId: 'seller-innovate',
    spaceType: 'Meeting Pod cách âm',
    categoryName: 'Meeting Pod cách âm',
    building: 'Innovation Hub',
    buildingName: 'Innovation Hub - Sảnh B',
    floor: 'Tầng 2',
    location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
    capacity: 2,
    areaSize: 8,
    hourlyPrice: 50000,
    dailyPrice: 320000,
    rating: 4.91,
    reviewsCount: 38,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_lobby_1.jpg',
    images: [
      'spaces/indoor_lobby_1.jpg',
      'spaces/indoor_lobby_2.jpg'
    ],
    tags: ['Solo Booth', 'Cuộc gọi bảo mật', 'Sạc không dây'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'waitingroom',
      caption: 'This waitingroom several chairs and tables in a room with bookshelves and a book case in the corner of the room',
      fileName: 'waitingroom_0012.jpg'
    },
    description: 'Pod làm việc cá nhân yên tĩnh tuyệt đối, lý tưởng cho các cuộc gọi phỏng vấn, đàm phán quan trọng. • Scene Description: "This waitingroom several chairs and tables in a room with bookshelves and a book case in the corner of the room"',
    equipment: ['Cách âm cao cấp', 'Bàn làm việc gọn nhẹ', 'Sạc không dây Qi', 'Đèn cảm ứng chuyển động']
  },
  {
    _id: 'a3-301',
    code: 'A3-301',
    name: 'Hội trường & Event Hall Landmark A3 (Auditorium)',
    sellerId: 'seller-landmark',
    spaceType: 'Không gian sự kiện',
    categoryName: 'Không gian sự kiện',
    building: 'Landmark Lounge',
    buildingName: 'Landmark Lounge - Tầng 8',
    floor: 'Tầng 8',
    location: 'Landmark Tower, 208 Nguyễn Hữu Cảnh, Q. Bình Thạnh',
    capacity: 100,
    areaSize: 150,
    hourlyPrice: 750000,
    dailyPrice: 5200000,
    rating: 4.95,
    reviewsCount: 76,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_auditorium_1.jpg',
    images: [
      'spaces/indoor_auditorium_1.jpg',
      'spaces/indoor_auditorium_2.jpg',
      'spaces/indoor_auditorium_3.jpg'
    ],
    tags: ['Sự kiện 100 khách', 'Màn hình LED', 'Âm thanh vòm', 'Bục phát biểu'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'auditorium',
      caption: 'rows of blue chairs in a large auditorium with a podium on the side of the stage and a podium on the other side of the stage',
      fileName: 'auditorium_0001.jpg'
    },
    description: 'Không gian sự kiện sang trọng đẳng cấp với view toàn cảnh thành phố, màn hình LED P2.5 siêu nét và dàn âm thanh vòm. • Scene Description: "rows of blue chairs in a large auditorium with a podium on the side of the stage and a podium on the other side of the stage"',
    equipment: ['Màn hình LED P2.5', 'Dàn âm thanh Line Array', 'Micro Shure không dây', 'Bục phát biểu', 'Khu vực check-in riêng']
  },
  {
    _id: 'a-hoi-truong',
    code: 'A-HT',
    name: 'Hội trường Lớn Tòa A - Grand Auditorium',
    sellerId: 'seller-landmark',
    spaceType: 'Không gian sự kiện',
    categoryName: 'Không gian sự kiện',
    building: 'Central Tower',
    buildingName: 'Central Tower Q.1 - Tầng 1',
    floor: 'Tầng 1',
    location: 'Central Tower, 58 Lê Duẩn, Quận 1, TP.HCM',
    capacity: 350,
    areaSize: 320,
    hourlyPrice: 1200000,
    dailyPrice: 8500000,
    rating: 4.93,
    reviewsCount: 51,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_auditorium_4.jpg',
    images: [
      'spaces/indoor_auditorium_4.jpg',
      'spaces/indoor_auditorium_1.jpg'
    ],
    tags: ['Quy mô 350 khách', 'Sân khấu lớn', 'Ánh sáng biểu diễn'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'auditorium',
      caption: 'this is an old photo of a large auditorium with red seats and a chandelier hanging from the ceiling',
      fileName: 'auditorium_0045.jpg'
    },
    description: 'Hội trường lớn bậc thang trang bị hệ thống âm thanh ánh sáng biểu diễn, sân khấu rộng và phòng kỹ thuật riêng. • Scene Description: "this is an old photo of a large auditorium with red seats and a chandelier hanging from the ceiling"',
    equipment: ['Sân khấu lớn 60m²', 'Dàn ánh sáng sân khấu DMX', 'Hệ thống lạnh trung tâm', 'Phòng kỹ thuật điều khiển âm thanh']
  },
  {
    _id: 'b1-104',
    code: 'B1-104',
    name: 'Phòng B1.104 - Giảng đường đa năng (Classroom)',
    sellerId: 'seller-uel',
    spaceType: 'Giảng đường',
    categoryName: 'Giảng đường',
    building: 'Tòa nhà B1',
    buildingName: 'Tòa nhà B1 - Tầng 1',
    floor: 'Tầng 1',
    location: 'Khuôn viên UEL Space Hub, P. Linh Xuân, TP. Thủ Đức',
    capacity: 50,
    areaSize: 60,
    hourlyPrice: 120000,
    dailyPrice: 800000,
    rating: 4.88,
    reviewsCount: 64,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_classroom_1.jpg',
    images: [
      'spaces/indoor_classroom_1.jpg',
      'spaces/indoor_classroom_2.jpg',
      'spaces/indoor_classroom_3.jpg'
    ],
    tags: ['Giảng đường 50 chỗ', 'Máy chiếu Sony', 'Điều hòa 2 chiều'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'classroom',
      caption: 'rows of desks with red chairs in a classroom with windows and drapes on the windowsills',
      fileName: 'classroom_0008.jpg'
    },
    description: 'Phòng học đa năng tiêu chuẩn học thuật, trang bị máy chiếu công suất lớn, bảng từ chống lóa và điều hòa 2 chiều. • Scene Description: "rows of desks with red chairs in a classroom with windows and drapes on the windowsills"',
    equipment: ['Máy chiếu Full HD', 'Điều hòa công suất lớn', 'Bảng từ bút lông', 'Hệ thống micro trợ giảng']
  },
  {
    _id: 'b1-lab202',
    code: 'B1-LAB202',
    name: 'Phòng Thực hành Tin học B1.202 (Computer Lab)',
    sellerId: 'seller-uel',
    spaceType: 'Phòng máy tính',
    categoryName: 'Phòng máy tính',
    building: 'Tòa nhà B1',
    buildingName: 'Tòa nhà B1 - Tầng 2',
    floor: 'Tầng 2',
    location: 'Khuôn viên UEL Space Hub, P. Linh Xuân, TP. Thủ Đức',
    capacity: 40,
    areaSize: 75,
    hourlyPrice: 250000,
    dailyPrice: 1700000,
    rating: 4.90,
    reviewsCount: 39,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_computerroom_1.jpg',
    images: [
      'spaces/indoor_computerroom_1.jpg',
      'spaces/indoor_computerroom_2.jpg',
      'spaces/indoor_computerroom_3.jpg'
    ],
    tags: ['40 PC Core i7', 'Mạng Gigabit', 'Máy chiếu'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'computerroom',
      caption: 'This computerroom there are many computers sitting on the desks in a room with wood flooring and a large window',
      fileName: 'computerroom_0019.jpg'
    },
    description: 'Phòng máy thực hành hiện đại trang bị 40 máy tính Core i7 16GB RAM, mạng gigabit tốc độ cao phục vụ phân tích dữ liệu và lập trình. • Scene Description: "This computerroom there are many computers sitting on the desks in a room with wood flooring and a large window"',
    equipment: ['40 Máy tính Core i7 16GB', 'Hạ tầng switch mạng Gigabit', 'Máy chiếu giảng viên', 'Phần mềm bản quyền']
  },
  {
    _id: 'a-105',
    code: 'A-105',
    name: 'Studio Sáng tạo Creative Media A.105 (Studio)',
    sellerId: 'seller-creative',
    spaceType: 'Studio sáng tạo',
    categoryName: 'Studio sáng tạo',
    building: 'Creative Hub Center',
    buildingName: 'Creative Hub Center - Tầng 4',
    floor: 'Tầng 4',
    location: 'Creative Hub, 42 Nguyễn Huệ, Quận 1, TP.HCM',
    capacity: 16,
    areaSize: 45,
    hourlyPrice: 300000,
    dailyPrice: 2100000,
    rating: 4.97,
    reviewsCount: 63,
    instantBooking: true,
    status: SPACE_STATUS.AVAILABLE,
    image: 'spaces/indoor_studio_1.jpg',
    images: [
      'spaces/indoor_studio_1.jpg',
      'spaces/indoor_studio_2.jpg',
      'spaces/indoor_studio_3.jpg'
    ],
    tags: ['Phông xanh', 'Đèn quay Nanlite', 'Micro Rode', 'Livestream 4K'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: 'tv_studio',
      caption: 'This tv studio there is a group of people that are standing in front of a news set with a television set in the background',
      fileName: 'tv_studio_0004.jpg'
    },
    description: 'Studio ghi hình và podcast chuyên nghiệp tích hợp hệ thống phông xanh, đèn chiếu sáng studio Nanlite, micro thu âm Rode. • Scene Description: "This tv studio there is a group of people that are standing in front of a news set with a television set in the background"',
    equipment: ['Phông xanh kéo tự động', 'Bộ đèn LED studio Nanlite', 'Micro Rode PodMic', 'Bàn trộn âm thanh RodeCaster Pro', 'Màn hình preview 4K']
  }
];

async function seedMarketplace() {
  console.log('🚀 Bắt đầu cập nhật Sellers và Spaces Marketplace lên MongoDB Atlas...');
  try {
    const db = await connectToDb();
    const usersCol = db.collection('users');
    const spacesCol = db.collection('spaces');

    // 1. Upsert Sellers
    console.log(`📦 [1/2] Đang cập nhật ${SELLERS.length} tài khoản Seller / Space Host...`);
    for (const seller of SELLERS) {
      await usersCol.updateOne(
        { _id: seller._id },
        { $set: seller },
        { upsert: true }
      );
      console.log(`   -> Seller [${seller.code}]: "${seller.brandName}" (${seller.fullName})`);
    }

    // 2. Map Sellers to Spaces and Upsert
    console.log(`🏛️ [2/2] Đang cập nhật ${MARKETPLACE_SPACES.length} không gian cho thuê liên kết Seller...`);
    const sellerMap = new Map(SELLERS.map(s => [s._id, s]));

    for (const space of MARKETPLACE_SPACES) {
      const seller = sellerMap.get(space.sellerId);
      const spaceDoc = {
        ...space,
        seller: seller ? {
          id: seller._id,
          name: seller.fullName,
          brandName: seller.brandName,
          avatar: seller.avatar,
          rating: seller.rating,
          reviewsCount: seller.reviewsCount,
          verified: seller.verified,
          badge: seller.badge
        } : null,
        operatingHours: { open: '07:00', close: '22:00' },
        policy: {
          autoApprove: true,
          maxDurationMinutes: 480,
          noShowGraceMinutes: 15,
          awayWarningMinutes: 10,
          autoCheckoutMinutes: 20
        },
        deletedAt: null,
        updatedAt: now()
      };

      await spacesCol.updateOne(
        { _id: space._id },
        { $set: spaceDoc },
        { upsert: true }
      );
      console.log(`   -> Space [${space.code}]: "${space.name}" • Host: "${spaceDoc.seller?.brandName}" • Giá: ${space.hourlyPrice.toLocaleString('vi-VN')} đ/h`);
    }

    console.log('✅ THÀNH CÔNG! Đã cập nhật toàn bộ Marketplace Sellers và Spaces lên MongoDB Atlas Cloud.');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật MongoDB Atlas:', err);
  } finally {
    await closeDb();
  }
}

seedMarketplace();
