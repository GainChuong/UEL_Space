const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'indoor_scenes_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const SELLERS = [
  {
    id: 'seller-techpark',
    name: 'Nguyễn Trần Kim Giang',
    brandName: 'TechPark Executive Spaces',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    rating: 4.96,
    reviewsCount: 128,
    verified: true,
    badge: 'SuperHost • Đối tác Hạng Vàng'
  },
  {
    id: 'seller-innovate',
    name: 'Lê Hoàng Long',
    brandName: 'Innovate Co-working Network',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    rating: 4.92,
    reviewsCount: 215,
    verified: true,
    badge: 'SuperHost • Mạng lưới Co-working'
  },
  {
    id: 'seller-landmark',
    name: 'Trần Minh Khoa',
    brandName: 'Landmark Convention & Event Corp',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    rating: 4.94,
    reviewsCount: 76,
    verified: true,
    badge: 'Chuyên gia Sự kiện & Hội thảo'
  },
  {
    id: 'seller-uel',
    name: 'TS. Trịnh Thị Kim Chi',
    brandName: 'Ban Quản trị Cơ sở vật chất UEL Space',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    rating: 4.89,
    reviewsCount: 94,
    verified: true,
    badge: 'Đại học Kinh tế - Luật Official'
  },
  {
    id: 'seller-creative',
    name: 'Đỗ Thùy Linh',
    brandName: 'Creative Hub Media Studios',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    rating: 4.97,
    reviewsCount: 63,
    verified: true,
    badge: 'Studio Sáng tạo Đạt chuẩn'
  }
];

const CATEGORY_CONFIGS = {
  meeting_room: {
    type: 'Phòng họp VIP',
    categoryName: 'Phòng họp VIP',
    sellerId: 'seller-techpark',
    capacityRange: [8, 12, 15, 20, 25],
    areaRange: [25, 35, 45, 55],
    priceRange: [250000, 300000, 350000, 420000, 500000],
    equipment: ['Màn hình 4K cảm ứng', 'Micro hội nghị đa hướng', 'Cáp quang 1Gbps', 'Bảng kính cường lực', 'AI Occupancy Sensor', 'Hệ thống Teleconference Cisco'],
    titles: [
      'Phòng Họp VIP Executive Boardroom A2.1',
      'Phòng Họp Hội đồng Quản trị Boardroom Suite',
      'Phòng Hội đàm Quốc tế Diplomat Room',
      'Phòng Họp Nhóm Agile Collaboration Room',
      'Phòng Hội thảo Chuyên gia Round Table',
      'Phòng Họp Chiến lược Summit Suite',
      'Phòng Đàm phán Doanh nghiệp Corner Office',
      'Phòng Họp Trực tuyến Global Telepresence',
      'Phòng Họp Kín Soundproof Glass Suite',
      'Phòng Hội ý Sáng tạo Brainstorm Room',
      'Phòng Họp Ban Giám hiệu C1.201',
      'Phòng Tiếp khách Cấp cao VIP Lounge',
      'Phòng Họp Đa phương tiện Smart Boardroom',
      'Phòng Thuyết trình Dự án Pitch Room',
      'Phòng Giao ban Trực quan Dashboard Room',
      'Phòng Hội chẩn Chuyên đề Solution Room'
    ]
  },
  office: {
    type: 'Văn phòng riêng',
    categoryName: 'Văn phòng riêng',
    sellerId: 'seller-innovate',
    capacityRange: [15, 20, 30, 40, 50],
    areaRange: [40, 55, 75, 95],
    priceRange: [380000, 450000, 500000, 600000, 750000],
    equipment: ['Khóa Smart Lock vân tay', 'Bàn làm việc giám đốc', 'Internet riêng biệt Leased Line', 'Tủ hồ sơ cá nhân', 'Máy in laser đa năng', 'Trạm cà phê espresso'],
    titles: [
      'Văn phòng riêng Private Suite B2.101',
      'Văn phòng Start-up Founder Studio',
      'Văn phòng Doanh nghiệp TechHub Suite',
      'Văn phòng Điều hành CEO Executive Office',
      'Văn phòng Nhóm Dự án Team Pod B3',
      'Văn phòng Tư vấn Luật & Tài chính Legal Corner',
      'Văn phòng Nghiên cứu Fintech Lab',
      'Văn phòng Không gian Mở Co-working Office',
      'Văn phòng Đại diện Enterprise Suite A1',
      'Văn phòng Thiết kế Sáng tạo Design Hub',
      'Văn phòng Kỹ sư Phần mềm Dev Suite',
      'Văn phòng Chuyển giao Công nghệ Tech Transfer',
      'Văn phòng Ươm tạo Khởi nghiệp Incubator Hub',
      'Văn phòng Vườn ươm Doanh nhân Youth Venture',
      'Văn phòng Đối tác Chiến lược Partner Office',
      'Văn phòng Tinh hoa Chuyên gia Senior Suite'
    ]
  },
  auditorium: {
    type: 'Hội trường sự kiện',
    categoryName: 'Hội trường sự kiện',
    sellerId: 'seller-landmark',
    capacityRange: [120, 180, 250, 350, 500],
    areaRange: [150, 220, 320, 450],
    priceRange: [650000, 850000, 1200000, 1500000, 2000000],
    equipment: ['Màn hình LED P2.5 siêu nét', 'Dàn âm thanh Line Array chuẩn concert', 'Sân khấu lớn 60m²', 'Đèn ánh sáng sân khấu DMX', 'Micro không dây chuyên dụng Shure', 'Cabin phiên dịch cabin song ngữ'],
    titles: [
      'Hội trường Lớn Grand Auditorium Tòa A',
      'Hội trường & Event Hall Landmark A3.301',
      'Nhà hát & Trung tâm Hội nghị Quốc tế UEL',
      'Hội trường Bậc thang Amphitheater Tòa B',
      'Trung tâm Sự kiện & Khởi nghiệp Innovation Stage',
      'Hội trường Khai phóng Nghệ thuật & Diễn đàn',
      'Hội trường Diễn thuyết TEDx UEL Hall',
      'Sảnh Hội thảo Chuyên đề Chuyển đổi số',
      'Hội trường Đa năng Convention Center Tầng 5',
      'Khán phòng Hòa nhạc & Nghệ thuật Acoustic Hall',
      'Hội trường Lễ tốt nghiệp & Tôn vinh Doanh nhân',
      'Hội trường Diễn đàn Kinh tế & Luật Forum Hall'
    ]
  },
  classroom: {
    type: 'Giảng đường đa năng',
    categoryName: 'Giảng đường đa năng',
    sellerId: 'seller-uel',
    capacityRange: [40, 50, 60, 75, 90],
    areaRange: [60, 80, 100, 120],
    priceRange: [120000, 150000, 180000, 220000, 260000],
    equipment: ['Máy chiếu Full HD kép', 'Điều hòa công suất lớn', 'Bàn ghế di động xếp cụm', 'Loa trợ giảng âm trần', 'Bảng trượt 3 lớp Nano', 'Camera AI theo dõi giảng viên'],
    titles: [
      'Phòng Giảng Đường Đa Năng B1.104',
      'Phòng Học Thông Minh Smart Classroom C2.305',
      'Giảng đường Bậc thang Hybrid Learning Hall',
      'Phòng Hội thảo Chuyên đề Seminar Room 402',
      'Lớp học Đảo ngược Flipped Classroom Hub',
      'Phòng Đào tạo Doanh nghiệp Corporate Training',
      'Giảng đường Khai phóng Tân tiến C1.102',
      'Phòng Học Trực quan Tương tác Active Learning',
      'Phòng Đào tạo Thạc sĩ & Sau đại học Master Hall',
      'Giảng đường Tiêu chuẩn Quốc tế Global Classroom'
    ]
  },
  library: {
    type: 'Thư viện & Co-study',
    categoryName: 'Thư viện & Co-study',
    sellerId: 'seller-uel',
    capacityRange: [30, 50, 70, 100, 150],
    areaRange: [80, 120, 180, 250],
    priceRange: [450000 / 10, 60000, 80000, 100000],
    equipment: ['Cổng sạc Type-C & Power Plug từng bàn', 'Wifi công suất lớn Aruba', 'Ghế công thái học Ergonomic', 'Đèn bàn bảo vệ thị lực', 'Không gian điều hòa trung tâm 24°C', 'Khu máy tính tra cứu OPAC'],
    titles: [
      'Khu Tự Học & Thư Viện Tri Thức Co-study',
      'Thư viện Số & Cơ sở Dữ liệu Pháp lý',
      'Không gian Đọc Sách Yên tĩnh Silent Study Hall',
      'Khu Nghiên cứu Chuyên sâu Scholar Corner',
      'Phòng Đọc Tài liệu Quý & Luận văn Tiến sĩ',
      'Thư viện Mở 24/7 Digital Knowledge Commons',
      'Khu Thảo luận Nhóm Thư viện Group Study Hub',
      'Không gian Đọc Sáng tạo Creative Reading Lounge',
      'Phòng Tra cứu Dữ liệu Bloomberg & Refinitiv',
      'Góc Học tập Xanh Eco Study Garden',
      'Thư viện Di sản & Văn hóa Kinh tế',
      'Khu Vực Tư liệu Đa phương tiện Media Library'
    ]
  },
  computerroom: {
    type: 'Phòng máy tính Lab',
    categoryName: 'Phòng máy tính Lab',
    sellerId: 'seller-uel',
    capacityRange: [35, 40, 50, 60],
    areaRange: [70, 85, 100, 120],
    priceRange: [180000, 220000, 260000, 320000],
    equipment: ['50 PC Intel Core i7 / 32GB RAM / RTX GPU', 'Mạng LAN gigabit 10Gbps', 'Phần mềm bản quyền Visual Studio / MATLAB / Stata', 'Máy chiếu tương tác 4K', 'Hệ thống lưu điện UPS công nghiệp', 'Điều hòa làm mát máy tính chuyên dụng'],
    titles: [
      'Phòng Máy Tính & Thực Hành Công Nghệ B1.Lab202',
      'Phòng Lab Trí tuệ Nhân tạo & Data Science',
      'Phòng Thực hành Fintech & Giao dịch Chứng khoán Ảo',
      'Phòng Máy Tính Đồ Họa 3D & Render Farm',
      'Phòng Thực hành An ninh Mạng Cyber Security Lab',
      'Phòng Lab Kiểm thử Phần mềm Software QA Lab',
      'Phòng Máy Tính Khởi nghiệp Hackathon Hub',
      'Phòng Thực hành Hệ thống ERP & Chuỗi cung ứng'
    ]
  },
  studio: {
    type: 'Media Studio & Pod',
    categoryName: 'Media Studio & Pod',
    sellerId: 'seller-creative',
    capacityRange: [4, 6, 8, 12],
    areaRange: [20, 30, 45, 60],
    priceRange: [220000, 280000, 350000, 420000],
    equipment: ['Hệ thống cách âm chuẩn Studio STC 55', 'Micro Rode PodMic & Audio Interface GoXLR', 'Đèn LED Key Light Elgato chuyên nghiệp', 'Phông xanh Green Screen cuộn điện', 'Camera 4K Sony Cinema FX3', 'Bàn chỉnh âm thanh cơ học'],
    titles: [
      'Media Studio & Sáng Tạo Số A.105',
      'Phòng Thu Âm Chuyên nghiệp Podcast Studio',
      'Phòng Ghi hình Bài giảng MOOCs Green Screen',
      'Studio Nhiếp ảnh & Sản phẩm Thương mại',
      'Phòng Thu Âm Lồng tiếng & Hậu kỳ Âm thanh',
      'Broadcast Studio Truyền thông Sinh viên',
      'Không gian Sáng tạo Nghệ thuật Art Studio',
      'Phòng Livestream Doanh nghiệp E-commerce Studio'
    ]
  },
  lobby: {
    type: 'Sảnh chờ & Pods',
    categoryName: 'Sảnh chờ & Pods',
    sellerId: 'seller-innovate',
    capacityRange: [2, 4, 6, 12, 20],
    areaRange: [10, 15, 30, 60],
    priceRange: [70000, 95000, 120000, 160000],
    equipment: ['Kính cách âm 3 lớp chuyên dụng', 'Màn hình họp trực tuyến 27 inch', 'Cổng sạc đa năng không dây Qi', 'Quạt thông gió tuần hoàn Fresh Air', 'Sofa bọc nỉ cao cấp chống bám bẩn', 'Bàn cafe chân sắt sơn tĩnh điện'],
    titles: [
      'Focus Pod 1 Cách Âm Smart Booth',
      'Meeting Pod Solo Booth 02',
      'Sảnh Tiếp Đón Doanh nghiệp Executive Lobby',
      'Khu Làm Việc Mở Hot Desk Open Lounge',
      'Góc Cà phê Khởi nghiệp Startup Cafe Lounge',
      'Phone Booth Cách âm Cuộc gọi Bảo mật 01',
      'Phone Booth Cách âm Cuộc gọi Bảo mật 02',
      'Sảnh Chờ VIP Thương gia Business Lounge',
      'Meeting Pod Nhóm 4 Chỗ Collaboration Pod',
      'Khu Thư Giãn Sáng Tạo Brain-Break Lounge',
      'Sảnh Trưng Bày Đổi Mới Sáng Tạo Innovation Lobby',
      'Khu Networking & Kết nối Doanh nhân',
      'Bookstore Cafe Co-working Space',
      'Góc Nghỉ Ngơi & Đọc Báo Kinh Tế Reading Corner',
      'Không gian Giao lưu Cựu sinh viên Alumni Lounge',
      'Sảnh Triển lãm Dự án Khởi nghiệp Venture Gallery',
      'Pod Làm Việc Im Lặng Focus Capsule 03',
      'Khu Vực Chờ Phỏng vấn Tuyển dụng Career Lounge'
    ]
  }
};

const BUILDINGS = [
  { name: 'UEL Central Space', location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức' },
  { name: 'TechPark Innovation Tower', location: 'TechPark Tower, Khu Công nghệ cao, TP. Thủ Đức' },
  { name: 'Landmark Convention Hall', location: 'Landmark Tower, 208 Nguyễn Hữu Cảnh, Q. Bình Thạnh, TP.HCM' },
  { name: 'Khu phức hợp Tri thức UEL Hub', location: 'Khuôn viên UEL Space Hub, P. Linh Xuân, TP. Thủ Đức' }
];

const FLOORS = ['Tầng Trệt', 'Tầng 1', 'Tầng 2', 'Tầng 3', 'Tầng 4', 'Tầng 5', 'Tầng 6', 'Tầng 7'];
const STATUSES = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'IN-USE', 'IN-USE', 'RESERVED', 'MAINTENANCE'];

const generatedSpaces = [];
const counters = {};

manifest.items.forEach((item, index) => {
  let targetCat = item.target_category;
  if (targetCat === 'coworking_lounge') {
    targetCat = 'lobby';
  }
  
  if (!counters[targetCat]) counters[targetCat] = 0;
  const catIndex = counters[targetCat]++;
  const cfg = CATEGORY_CONFIGS[targetCat] || CATEGORY_CONFIGS.office;
  
  const title = cfg.titles[catIndex % cfg.titles.length] + ` (${targetCat === 'meeting_room' ? 'Meeting' : targetCat === 'office' ? 'Office' : targetCat === 'auditorium' ? 'Auditorium' : targetCat === 'classroom' ? 'Classroom' : targetCat === 'library' ? 'Library' : targetCat === 'computerroom' ? 'Lab' : targetCat === 'studio' ? 'Studio' : 'Lobby'})`;
  const capacity = cfg.capacityRange[catIndex % cfg.capacityRange.length];
  const area = cfg.areaRange[catIndex % cfg.areaRange.length];
  const hourlyPrice = cfg.priceRange[catIndex % cfg.priceRange.length];
  const dailyPrice = Math.round(hourlyPrice * 6.8 / 1000) * 1000;
  
  const bldg = BUILDINGS[index % BUILDINGS.length];
  const floor = FLOORS[index % FLOORS.length];
  const seller = SELLERS.find(s => s.id === cfg.sellerId) || SELLERS[0];
  const status = STATUSES[index % STATUSES.length];
  const rating = +(4.80 + ((index * 7) % 20) / 100).toFixed(2);
  const reviewsCount = 20 + ((index * 13) % 180);
  
  const code = `${targetCat.substring(0, 3).toUpperCase()}-${(index + 1).toString().padStart(3, '0')}`;
  
  // Gallery images: use item image plus other images from same category
  const images = [item.local_image];
  for (let i = 1; i <= 3; i++) {
    const nextIdx = ((catIndex + i) % 6) + 1;
    images.push(`spaces/indoor_${targetCat}_${nextIdx}.jpg`);
  }

  generatedSpaces.push({
    _id: item.id,
    code: code,
    name: title,
    sellerId: seller.id,
    seller: seller,
    spaceType: cfg.type,
    categoryName: cfg.categoryName,
    building: bldg.name,
    buildingName: `${bldg.name} - ${floor}`,
    floor: floor,
    location: `${bldg.location}, ${floor}`,
    capacity: capacity,
    areaSize: area,
    area: area,
    hourlyPrice: hourlyPrice,
    dailyPrice: dailyPrice,
    rating: rating,
    reviewsCount: reviewsCount,
    instantBooking: true,
    status: status,
    statusKey: status.toLowerCase() === 'available' ? 'available' : status.toLowerCase() === 'in-use' ? 'in-use' : status.toLowerCase() === 'reserved' ? 'reserved' : 'maintenance',
    statusText: status === 'AVAILABLE' ? 'Trống (Khả dụng)' : status === 'IN-USE' ? 'Đang sử dụng' : status === 'RESERVED' ? 'Đã đặt' : 'Bảo trì',
    image: item.local_image,
    images: images,
    tags: ['SuperHost', 'AI Occupancy', 'Màn hình 4K', 'Đặt tức thì', 'Hugging Face Dataset'],
    dataset: {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: targetCat,
      rawCategory: item.category,
      caption: item.caption,
      fileName: item.file_name,
      dimensions: item.dimensions
    },
    description: `${cfg.type} tiêu chuẩn cao tại ${bldg.name}. • Mô tả cảnh gốc Hugging Face: "${item.caption}"`,
    equipment: cfg.equipment
  });
});

const outputPath = path.join(__dirname, 'spaces_100_dataset.json');
fs.writeFileSync(outputPath, JSON.stringify(generatedSpaces, null, 2), 'utf8');

const frontendJsonPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'app', 'services', 'spaces_100_dataset.json');
fs.writeFileSync(frontendJsonPath, JSON.stringify(generatedSpaces, null, 2), 'utf8');

const frontendTsPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'app', 'services', 'spaces_100_data.ts');
const tsContent = `// Auto-generated 100 spaces dataset from FatimaSaadNaik/indoor-scenes-dataset
export const SPACES_100_DATA: any[] = ${JSON.stringify(generatedSpaces, null, 2)};
`;
fs.writeFileSync(frontendTsPath, tsContent, 'utf8');

console.log(`✅ Đã tạo thành công ${generatedSpaces.length} không gian hoàn chỉnh từ manifest!`);
console.log(`   - Backend: ${outputPath}`);
console.log(`   - Frontend JSON: ${frontendJsonPath}`);
console.log(`   - Frontend TS: ${frontendTsPath}`);
