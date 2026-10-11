/**
 * UEL Space - Database Seeder
 * Khởi tạo dữ liệu mẫu chuẩn theo tài liệu Instruction/Entity_Specification.md
 * Kết nối trực tiếp tới MongoDB Atlas Cloud và nạp dữ liệu.
 */
const { connectToDb, closeDb } = require('../config/db');
const { now, newId } = require('../common/id');
const { SPACE_STATUS } = require('../common/constants');

async function seed() {
  console.log('🚀 [SEEDER] Bắt đầu nạp dữ liệu mẫu vào MongoDB Atlas...');
  const db = await connectToDb();

  // 1. ROLES
  console.log('📦 [1/8] Khởi tạo collection: roles');
  const rolesCol = db.collection('roles');
  await rolesCol.deleteMany({});
  const roles = [
    {
      _id: 'ROLE_STUDENT',
      roleId: 'STUDENT',
      roleName: 'Sinh viên UEL',
      description: 'Sinh viên chính quy, liên thông, cao học trường ĐH Kinh tế - Luật',
      permissions: ['VIEW_SPACE', 'BOOK_STUDY_SPACE', 'CHECK_IN', 'CANCEL_OWN_BOOKING', 'FEEDBACK', 'REPORT_INCIDENT'],
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'ROLE_LECTURER',
      roleId: 'LECTURER',
      roleName: 'Giảng viên UEL',
      description: 'Cán bộ giảng viên, nghiên cứu sinh cơ hữu hoặc thỉnh giảng',
      permissions: ['VIEW_SPACE', 'BOOK_MEETING_ROOM', 'BOOK_CLASSROOM', 'CHECK_IN', 'CANCEL_OWN_BOOKING', 'PRIORITY_BOOKING'],
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'ROLE_MANAGER',
      roleId: 'MANAGER',
      roleName: 'Cán bộ Quản lý Không gian',
      description: 'Cán bộ phòng Quản trị Thiết bị, Thư viện, Văn phòng Đoàn - Hội',
      permissions: ['MANAGE_SPACES', 'APPROVE_BOOKING', 'REJECT_BOOKING', 'VIEW_OCCUPANCY', 'RESOLVE_INCIDENT'],
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'ROLE_ADMIN',
      roleId: 'ADMIN',
      roleName: 'Quản trị viên Hệ thống (System Admin)',
      description: 'Toàn quyền cấu hình tham số hệ thống, phân quyền, kiểm toán, quản lý toàn diện',
      permissions: ['ALL'],
      status: 'ACTIVE',
      createdAt: now()
    }
  ];
  await rolesCol.insertMany(roles);

  // 2. ORGANIZATIONS
  console.log('🏢 [2/8] Khởi tạo collection: organizations');
  const orgCol = db.collection('organizations');
  await orgCol.deleteMany({});
  const organizations = [
    {
      _id: 'org-bql-csvc',
      code: 'CSVC',
      name: 'Ban Quản trị Cơ sở vật chất UEL',
      type: 'ADMINISTRATIVE',
      email: 'csvc@uel.edu.vn',
      phone: '02837244555',
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'org-khoa-httt',
      code: 'K.HTTT',
      name: 'Khoa Hệ thống Thông tin',
      type: 'FACULTY',
      email: 'httt@uel.edu.vn',
      phone: '02837244556',
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'org-doan-hoi',
      code: 'DOANHOI',
      name: 'Đoàn TNCS Hồ Chí Minh - Hội Sinh viên UEL',
      type: 'STUDENT_ORGANIZATION',
      email: 'doanhoi@uel.edu.vn',
      phone: '02837244557',
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'org-thu-vien',
      code: 'THUVIEN',
      name: 'Trung tâm Học liệu & Thư viện UEL',
      type: 'FACILITY',
      email: 'thuvien@uel.edu.vn',
      phone: '02837244558',
      status: 'ACTIVE',
      createdAt: now()
    }
  ];
  await orgCol.insertMany(organizations);

  // 3. BUILDINGS & FLOORS & CATEGORIES (CATALOG)
  console.log('🏛️ [3/8] Khởi tạo catalog: buildings, floors, space_categories');
  const bldgCol = db.collection('buildings');
  const floorCol = db.collection('floors');
  const catCol = db.collection('space_categories');
  await bldgCol.deleteMany({});
  await floorCol.deleteMany({});
  await catCol.deleteMany({});

  const buildings = [
    { _id: 'bldg-a', code: 'A', name: 'Tòa nhà A (Hiệu bộ & Hội trường)', campus: 'UEL Thủ Đức', description: 'Khu vực làm việc và phòng họp hội thảo' },
    { _id: 'bldg-b1', code: 'B1', name: 'Tòa nhà B1 (Khu Giảng đường 1)', campus: 'UEL Thủ Đức', description: 'Giảng đường lớn và phòng học nhóm' },
    { _id: 'bldg-b2', code: 'B2', name: 'Tòa nhà B2 (Khu Giảng đường 2)', campus: 'UEL Thủ Đức', description: 'Phòng học lý thuyết và thảo luận' },
    { _id: 'bldg-lib', code: 'LIB', name: 'Tòa nhà Thư viện', campus: 'UEL Thủ Đức', description: 'Khu tự học yên tĩnh và thảo luận sinh viên' },
    { _id: 'bldg-outdoor', code: 'OUTDOOR', name: 'Khuôn viên ngoài trời', campus: 'UEL Thủ Đức', description: 'Chòi tự học và hành lang xanh' }
  ];
  await bldgCol.insertMany(buildings);

  const floors = [
    { _id: 'floor-a-1', buildingId: 'bldg-a', floorName: 'Tầng 1', floorNumber: 1 },
    { _id: 'floor-a-2', buildingId: 'bldg-a', floorName: 'Tầng 2', floorNumber: 2 },
    { _id: 'floor-b1-1', buildingId: 'bldg-b1', floorName: 'Tầng 1', floorNumber: 1 },
    { _id: 'floor-b1-2', buildingId: 'bldg-b1', floorName: 'Tầng 2', floorNumber: 2 },
    { _id: 'floor-b2-1', buildingId: 'bldg-b2', floorName: 'Tầng 1', floorNumber: 1 },
    { _id: 'floor-lib-2', buildingId: 'bldg-lib', floorName: 'Tầng 2', floorNumber: 2 },
    { _id: 'floor-outdoor-g', buildingId: 'bldg-outdoor', floorName: 'Sân vườn', floorNumber: 0 }
  ];
  await floorCol.insertMany(floors);

  const categories = [
    { _id: 'cat-giang-duong', code: 'CLASSROOM', name: 'Giảng đường', description: 'Phòng học lý thuyết và thuyết trình quy mô lớn' },
    { _id: 'cat-phong-hop', code: 'MEETING_ROOM', name: 'Phòng họp', description: 'Không gian họp hội nghị, làm việc nhóm chuyên biệt' },
    { _id: 'cat-tu-hoc', code: 'STUDY_AREA', name: 'Khu tự học', description: 'Không gian mở dành cho sinh viên tự học và trao đổi' },
    { _id: 'cat-lab', code: 'COMPUTER_LAB', name: 'Phòng máy tính', description: 'Phòng thực hành tin học trang bị PC cấu hình cao' }
  ];
  await catCol.insertMany(categories);

  // 4. SPACES
  console.log('🚪 [4/8] Khởi tạo collection: spaces');
  const spacesCol = db.collection('spaces');
  await spacesCol.deleteMany({});

  const spaces = [
    {
      _id: 'b1-104',
      code: 'B1-104',
      name: 'Phòng B1.104',
      buildingId: 'bldg-b1',
      buildingName: 'Tòa nhà B1 - Tầng 1',
      building: 'Tòa nhà B1 - Tầng 1',
      floorId: 'floor-b1-1',
      floorName: 'Tầng 1',
      categoryId: 'cat-giang-duong',
      categoryName: 'Giảng đường',
      spaceType: 'Giảng đường',
      capacity: 50,
      area: 60,
      areaSize: 60,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Giảng đường đa năng trang bị màn chiếu hiện đại, âm thanh vòm, điều hòa công suất lớn.',
      equipment: [
        { id: 'eq-1', name: 'Máy chiếu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-2', name: 'Điều hòa', quantity: 2, condition: 'GOOD' },
        { id: 'eq-3', name: 'Wifi tốc độ cao', quantity: 1, condition: 'GOOD' },
        { id: 'eq-4', name: 'Bảng từ', quantity: 1, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '07:00', close: '21:00' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: true,
        maxDurationMinutes: 180,
        noShowGraceMinutes: 15,
        awayWarningMinutes: 10,
        autoCheckoutMinutes: 20
      },
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'a2-1',
      code: 'A2-1',
      name: 'Phòng Họp A2.1',
      buildingId: 'bldg-a',
      buildingName: 'Tòa nhà A - Tầng 2',
      building: 'Tòa nhà A - Tầng 2',
      floorId: 'floor-a-2',
      floorName: 'Tầng 2',
      categoryId: 'cat-phong-hop',
      categoryName: 'Phòng họp',
      spaceType: 'Phòng họp',
      capacity: 15,
      area: 30,
      areaSize: 30,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Phòng họp cao cấp phục vụ họp hội nghị, bảo vệ đồ án và thảo luận học thuật.',
      equipment: [
        { id: 'eq-1', name: 'Máy chiếu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-2', name: 'Điều hòa', quantity: 1, condition: 'GOOD' },
        { id: 'eq-4', name: 'Bảng từ', quantity: 1, condition: 'GOOD' },
        { id: 'eq-5', name: 'Màn hình TV họp trực tuyến', quantity: 1, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '08:00', close: '17:30' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: false, // Yêu cầu duyệt cho phòng họp
        maxDurationMinutes: 240,
        noShowGraceMinutes: 15,
        awayWarningMinutes: 15,
        autoCheckoutMinutes: 30
      },
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'thu-vien-2',
      code: 'LIB-F2',
      name: 'Khu tự học Thư viện',
      buildingId: 'bldg-lib',
      buildingName: 'Tòa nhà Thư viện - Tầng 2',
      building: 'Tòa nhà Thư viện - Tầng 2',
      floorId: 'floor-lib-2',
      floorName: 'Tầng 2',
      categoryId: 'cat-tu-hoc',
      categoryName: 'Khu tự học',
      spaceType: 'Khu tự học',
      capacity: 120,
      area: 200,
      areaSize: 200,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Không gian học tập yên tĩnh, ánh sáng tự nhiên tiêu chuẩn, ổ cắm từng bàn.',
      equipment: [
        { id: 'eq-3', name: 'Wifi tốc độ cao', quantity: 4, condition: 'GOOD' },
        { id: 'eq-2', name: 'Điều hòa', quantity: 6, condition: 'GOOD' },
        { id: 'eq-6', name: 'Ổ cắm điện', quantity: 60, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '07:30', close: '20:30' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: true,
        maxDurationMinutes: 360,
        noShowGraceMinutes: 20,
        awayWarningMinutes: 15,
        autoCheckoutMinutes: 30
      },
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'a3-301',
      code: 'A3-301',
      name: 'Giảng đường A3.301',
      buildingId: 'bldg-a',
      buildingName: 'Tòa nhà A3 - Tầng 3',
      building: 'Tòa nhà A3 - Tầng 3',
      floorId: 'floor-a-2',
      floorName: 'Tầng 3',
      categoryId: 'cat-giang-duong',
      categoryName: 'Giảng đường',
      spaceType: 'Giảng đường',
      capacity: 80,
      area: 95,
      areaSize: 95,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Giảng đường bậc thang sức chứa lớn, trang bị hệ thống âm thanh giảng dạy chất lượng cao.',
      equipment: [
        { id: 'eq-1', name: 'Máy chiếu', quantity: 2, condition: 'GOOD' },
        { id: 'eq-2', name: 'Điều hòa', quantity: 4, condition: 'GOOD' },
        { id: 'eq-7', name: 'Micro không dây', quantity: 2, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '07:00', close: '21:00' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: true,
        maxDurationMinutes: 180,
        noShowGraceMinutes: 15,
        awayWarningMinutes: 10,
        autoCheckoutMinutes: 20
      },
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'choi-1',
      code: 'CHOI-01',
      name: 'Chòi tự học 1',
      buildingId: 'bldg-outdoor',
      buildingName: 'Khuôn viên ngoài trời (Đường Thanh Niên)',
      building: 'Khuôn viên ngoài trời (Đường Thanh Niên)',
      floorId: 'floor-outdoor-g',
      floorName: 'Sân vườn',
      categoryId: 'cat-tu-hoc',
      categoryName: 'Khu tự học',
      spaceType: 'Khu tự học',
      capacity: 8,
      area: 15,
      areaSize: 15,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Chòi tự học ngoài trời thoáng đãng, phủ sóng wifi khuôn viên trường, phù hợp làm việc nhóm.',
      equipment: [
        { id: 'eq-8', name: 'Quạt trần', quantity: 1, condition: 'GOOD' },
        { id: 'eq-9', name: 'Bàn ghế gỗ', quantity: 1, condition: 'GOOD' },
        { id: 'eq-6', name: 'Ổ cắm điện', quantity: 4, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '06:00', close: '22:00' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: true,
        maxDurationMinutes: 120,
        noShowGraceMinutes: 15,
        awayWarningMinutes: 10,
        autoCheckoutMinutes: 15
      },
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'b2-101',
      code: 'B2-101',
      name: 'Phòng B2.101',
      buildingId: 'bldg-b2',
      buildingName: 'Tòa nhà B2 - Tầng 1',
      building: 'Tòa nhà B2 - Tầng 1',
      floorId: 'floor-b2-1',
      floorName: 'Tầng 1',
      categoryId: 'cat-giang-duong',
      categoryName: 'Phòng học',
      spaceType: 'Phòng học',
      capacity: 45,
      area: 55,
      areaSize: 55,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Phòng học tiêu chuẩn với đầy đủ trang thiết bị hỗ trợ học tập và thuyết trình.',
      equipment: [
        { id: 'eq-1', name: 'Máy chiếu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-2', name: 'Điều hòa', quantity: 2, condition: 'GOOD' },
        { id: 'eq-3', name: 'Wifi tốc độ cao', quantity: 1, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '07:00', close: '21:00' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: true,
        maxDurationMinutes: 180,
        noShowGraceMinutes: 15,
        awayWarningMinutes: 10,
        autoCheckoutMinutes: 20
      },
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    }
  ];
  await spacesCol.insertMany(spaces);

  // 5. USERS (Tài khoản mẫu)
  console.log('👤 [5/8] Khởi tạo collection: users');
  const usersCol = db.collection('users');
  await usersCol.deleteMany({});

  const users = [
    {
      _id: 'USER-ADMIN-01',
      code: 'ADMIN-001',
      fullName: 'Quản trị viên Hệ thống UEL',
      email: 'admin@uel.edu.vn',
      role: 'ADMIN',
      organizationId: 'org-bql-csvc',
      organization: 'Ban Quản trị Cơ sở vật chất UEL',
      phoneNumber: '02837244555',
      authProvider: 'GOOGLE',
      status: 'ACTIVE',
      avatar: '',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'USER-GV-01',
      code: 'GV-TRINHTHIKIMCHI',
      fullName: 'TS. Trịnh Thị Kim Chi',
      email: 'chittk@uel.edu.vn',
      role: 'LECTURER',
      organizationId: 'org-khoa-httt',
      organization: 'Khoa Hệ thống Thông tin',
      phoneNumber: '0908123456',
      authProvider: 'GOOGLE',
      status: 'ACTIVE',
      avatar: '',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'USER-SV-01',
      code: 'K224111300',
      fullName: 'Nguyễn Giang (Sinh viên)',
      email: 'giangnntk24411@st.uel.edu.vn',
      role: 'STUDENT',
      organizationId: 'org-doan-hoi',
      organization: 'Sinh viên UEL',
      phoneNumber: '0912345678',
      authProvider: 'GOOGLE',
      status: 'ACTIVE',
      avatar: '',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    }
  ];
  await usersCol.insertMany(users);

  // 6. BOOKINGS (Lịch đặt chỗ mẫu)
  console.log('📅 [6/8] Khởi tạo collection: bookings');
  const bookingsCol = db.collection('bookings');
  await bookingsCol.deleteMany({});

  const sampleBookings = [
    {
      _id: 'BK-20261011-001',
      spaceId: 'b1-104',
      spaceName: 'Phòng B1.104',
      userId: 'USER-SV-01',
      userEmail: 'giangnntk24411@st.uel.edu.vn',
      userName: 'Nguyễn Giang',
      startTime: new Date('2026-10-12T08:00:00Z'),
      endTime: new Date('2026-10-12T10:00:00Z'),
      purpose: 'Thảo luận môn Phát triển Web Kinh doanh Nâng cao',
      attendeeCount: 6,
      status: 'APPROVED',
      checkInCode: '104888',
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null
    },
    {
      _id: 'BK-20261011-002',
      spaceId: 'a2-1',
      spaceName: 'Phòng Họp A2.1',
      userId: 'USER-GV-01',
      userEmail: 'chittk@uel.edu.vn',
      userName: 'TS. Trịnh Thị Kim Chi',
      startTime: new Date('2026-10-12T13:30:00Z'),
      endTime: new Date('2026-10-12T15:30:00Z'),
      purpose: 'Họp hội đồng nghiệm thu đề tài NCKH',
      attendeeCount: 12,
      status: 'APPROVED',
      checkInCode: '201999',
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null
    }
  ];
  await bookingsCol.insertMany(sampleBookings);

  // 7. TẠO INDEXES TỐI ƯU TRÊN MONGODB ATLAS
  console.log('⚡ [7/8] Thiết lập indexes tối ưu trên các collections...');
  await spacesCol.createIndex({ code: 1 }, { unique: true });
  await spacesCol.createIndex({ buildingId: 1, status: 1 });
  await usersCol.createIndex({ email: 1 }, { unique: true });
  await bookingsCol.createIndex({ spaceId: 1, startTime: 1, endTime: 1 });
  await bookingsCol.createIndex({ userId: 1, status: 1 });

  // 8. HOÀN TẤT
  console.log('✅ [8/8] HOÀN TẤT SEEDING! Tất cả dữ liệu thực đã được nạp an toàn lên MongoDB Atlas Cloud.');
  await closeDb();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ [SEEDER ERROR]:', err);
    process.exit(1);
  });
}

module.exports = { seed };
