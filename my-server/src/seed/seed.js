/**
 * UEL Space - Comprehensive Database Seeder
 * Tuân thủ 100% tài liệu Instruction/Entity_Specification.md và Business_Rules.md
 * Xây dựng và chuẩn hóa toàn bộ 7 Database Modules trên MongoDB Atlas Cloud:
 * 1. Identity Module (Roles, Users)
 * 2. Organization Module (Organizations, Memberships)
 * 3. Space & Catalog Module (Buildings, Floors, Categories, Equipment, Spaces)
 * 4. Booking & Schedule Module (Bookings, Schedules)
 * 5. Usage & Presence Module (Usage Sessions, Presence Records, Release Cases)
 * 6. Monitoring Module (Occupancy Records, Notifications)
 * 7. Administration Module (Incidents, Feedback, Audit Logs)
 */

const { connectToDb, closeDb } = require('../config/db');
const { now, newId } = require('../common/id');
const { SPACE_STATUS, BOOKING_STATUS, SESSION_STATUS, ROLES } = require('../common/constants');

async function seed() {
  console.log('🚀 [SEEDER] Bắt đầu xây dựng & nạp toàn diện Cơ sở dữ liệu UEL Space lên MongoDB Atlas...');
  const db = await connectToDb();

  // ==========================================
  // MODULE 1: IDENTITY MODULE (Roles & Users)
  // ==========================================
  console.log('📦 [1/7] Khởi tạo Identity Module (roles, users)...');
  const rolesCol = db.collection('roles');
  const usersCol = db.collection('users');
  await rolesCol.deleteMany({});
  await usersCol.deleteMany({});

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
      avatar: 'https://lh3.googleusercontent.com/avatar_admin.png',
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
      avatar: 'https://lh3.googleusercontent.com/avatar_gv.png',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'USER-GV-02',
      code: 'GV-NGUYENVANAN',
      fullName: 'ThS. Nguyễn Văn An',
      email: 'annv@uel.edu.vn',
      role: 'LECTURER',
      organizationId: 'org-khoa-luat',
      organization: 'Khoa Luật Kinh tế',
      phoneNumber: '0908765432',
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
      fullName: 'Nguyễn Giang',
      email: 'giangnntk24411@st.uel.edu.vn',
      role: 'STUDENT',
      organizationId: 'org-doan-hoi',
      organization: 'Sinh viên UEL',
      phoneNumber: '0912345678',
      authProvider: 'GOOGLE',
      status: 'ACTIVE',
      avatar: 'https://lh3.googleusercontent.com/avatar_student.png',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'USER-SV-02',
      code: 'K214110001',
      fullName: 'Trần Thị Bích Ngọc',
      email: 'ngocttb21411@st.uel.edu.vn',
      role: 'STUDENT',
      organizationId: 'org-clb-tin-hoc',
      organization: 'CLB Tin học UEL',
      phoneNumber: '0918889999',
      authProvider: 'GOOGLE',
      status: 'ACTIVE',
      avatar: '',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'USER-OWNER',
      code: 'ADMIN-OWNER',
      fullName: 'Gain Chuong (Project Owner)',
      email: 'gameyuno123@gmail.com',
      role: 'ADMIN',
      organizationId: 'org-bql-csvc',
      organization: 'Ban Quản trị Cơ sở vật chất UEL',
      phoneNumber: '0988888888',
      authProvider: 'GOOGLE',
      status: 'ACTIVE',
      avatar: '',
      version: 1,
      createdAt: now(),
      updatedAt: now()
    }
  ];
  await usersCol.insertMany(users);

  // ==========================================
  // MODULE 2: ORGANIZATION MODULE
  // ==========================================
  console.log('🏢 [2/7] Khởi tạo Organization Module (organizations, memberships)...');
  const orgCol = db.collection('organizations');
  const memCol = db.collection('memberships');
  await orgCol.deleteMany({});
  await memCol.deleteMany({});

  const organizations = [
    {
      _id: 'org-bql-csvc',
      code: 'CSVC',
      name: 'Ban Quản trị Cơ sở vật chất UEL',
      type: 'ADMINISTRATIVE',
      manager: 'TS. Lê Quản Trị',
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
      manager: 'PGS.TS. Trưởng Khoa HTTT',
      email: 'httt@uel.edu.vn',
      phone: '02837244556',
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'org-khoa-luat',
      code: 'K.LUAT',
      name: 'Khoa Luật Kinh tế',
      type: 'FACULTY',
      manager: 'TS. Trưởng Khoa Luật',
      email: 'luat@uel.edu.vn',
      phone: '02837244559',
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'org-doan-hoi',
      code: 'DOANHOI',
      name: 'Đoàn TNCS Hồ Chí Minh - Hội Sinh viên UEL',
      type: 'STUDENT_ORGANIZATION',
      manager: 'Bí thư Đoàn trường',
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
      manager: 'Giám đốc Thư viện',
      email: 'thuvien@uel.edu.vn',
      phone: '02837244558',
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'org-clb-tin-hoc',
      code: 'CLB-IT',
      name: 'Câu lạc bộ Tin học & Công nghệ UEL (ITC)',
      type: 'CLUB',
      manager: 'Chủ nhiệm CLB',
      email: 'itc@st.uel.edu.vn',
      phone: '0933112233',
      status: 'ACTIVE',
      createdAt: now()
    }
  ];
  await orgCol.insertMany(organizations);

  const memberships = [
    { _id: 'mem-1', userId: 'USER-ADMIN-01', organizationId: 'org-bql-csvc', role: 'MANAGER', startDate: '2023-01-01', status: 'ACTIVE' },
    { _id: 'mem-2', userId: 'USER-GV-01', organizationId: 'org-khoa-httt', role: 'LECTURER', startDate: '2022-09-01', status: 'ACTIVE' },
    { _id: 'mem-3', userId: 'USER-SV-01', organizationId: 'org-doan-hoi', role: 'MEMBER', startDate: '2024-10-01', status: 'ACTIVE' },
    { _id: 'mem-4', userId: 'USER-SV-02', organizationId: 'org-clb-tin-hoc', role: 'LEADER', startDate: '2023-11-01', status: 'ACTIVE' }
  ];
  await memCol.insertMany(memberships);

  // ==========================================
  // MODULE 3: SPACE & CATALOG MODULE
  // ==========================================
  console.log('🏛️ [3/7] Khởi tạo Space & Catalog Module (buildings, floors, categories, equipment, spaces)...');
  const bldgCol = db.collection('buildings');
  const floorCol = db.collection('floors');
  const catCol = db.collection('space_categories');
  const eqCol = db.collection('equipment');
  const spacesCol = db.collection('spaces');

  await bldgCol.deleteMany({});
  await floorCol.deleteMany({});
  await catCol.deleteMany({});
  await eqCol.deleteMany({});
  await spacesCol.deleteMany({});

  const buildings = [
    { _id: 'bldg-a', code: 'A', name: 'Tòa nhà A (Hiệu bộ & Hội trường)', campus: 'UEL Thủ Đức', address: 'Khu phố 3, P. Linh Xuân, TP. Thủ Đức', numberOfFloors: 5, description: 'Khu vực văn phòng làm việc, phòng họp và hội trường A' },
    { _id: 'bldg-b1', code: 'B1', name: 'Tòa nhà B1 (Khu Giảng đường 1)', campus: 'UEL Thủ Đức', address: 'Khuôn viên trung tâm UEL', numberOfFloors: 4, description: 'Giảng đường lớn, phòng học lý thuyết và phòng máy tính' },
    { _id: 'bldg-b2', code: 'B2', name: 'Tòa nhà B2 (Khu Giảng đường 2)', campus: 'UEL Thủ Đức', address: 'Khuôn viên trung tâm UEL', numberOfFloors: 4, description: 'Phòng học lý thuyết, phòng hội thảo và làm việc nhóm' },
    { _id: 'bldg-lib', code: 'LIB', name: 'Tòa nhà Thư viện', campus: 'UEL Thủ Đức', address: 'Đối diện hồ nước UEL', numberOfFloors: 3, description: 'Khu tự học yên tĩnh, phòng đọc sách, thảo luận nhóm' },
    { _id: 'bldg-outdoor', code: 'OUTDOOR', name: 'Khuôn viên ngoài trời', campus: 'UEL Thủ Đức', address: 'Đường Thanh Niên - Vườn tượng', numberOfFloors: 1, description: 'Chòi tự học ngoài trời và hành lang xanh thoáng mát' }
  ];
  await bldgCol.insertMany(buildings);

  const floors = [
    { _id: 'floor-a-1', buildingId: 'bldg-a', floorName: 'Tầng 1', floorNumber: 1, description: 'Hội trường A & Sảnh đón tiếp' },
    { _id: 'floor-a-2', buildingId: 'bldg-a', floorName: 'Tầng 2', floorNumber: 2, description: 'Phòng họp Ban Giám hiệu & Phòng họp A2.1' },
    { _id: 'floor-a-3', buildingId: 'bldg-a', floorName: 'Tầng 3', floorNumber: 3, description: 'Giảng đường A3' },
    { _id: 'floor-b1-1', buildingId: 'bldg-b1', floorName: 'Tầng 1', floorNumber: 1, description: 'Dãy phòng học B1.101 - B1.106' },
    { _id: 'floor-b1-2', buildingId: 'bldg-b1', floorName: 'Tầng 2', floorNumber: 2, description: 'Phòng thực hành máy tính & Lab' },
    { _id: 'floor-b2-1', buildingId: 'bldg-b2', floorName: 'Tầng 1', floorNumber: 1, description: 'Dãy phòng học B2.101 - B2.105' },
    { _id: 'floor-b2-2', buildingId: 'bldg-b2', floorName: 'Tầng 2', floorNumber: 2, description: 'Phòng học nhóm B2.201' },
    { _id: 'floor-lib-1', buildingId: 'bldg-lib', floorName: 'Tầng 1', floorNumber: 1, description: 'Khu mượn trả sách & Quầy thông tin' },
    { _id: 'floor-lib-2', buildingId: 'bldg-lib', floorName: 'Tầng 2', floorNumber: 2, description: 'Khu tự học sinh viên & Phòng máy tra cứu' },
    { _id: 'floor-outdoor-g', buildingId: 'bldg-outdoor', floorName: 'Sân vườn', floorNumber: 0, description: 'Khuôn viên xanh ngoài trời' }
  ];
  await floorCol.insertMany(floors);

  const categories = [
    { _id: 'cat-giang-duong', code: 'CLASSROOM', name: 'Giảng đường', description: 'Phòng học lý thuyết và thuyết trình quy mô lớn (40 - 150 chỗ)' },
    { _id: 'cat-phong-hop', code: 'MEETING_ROOM', name: 'Phòng họp', description: 'Không gian họp hội nghị, làm việc nhóm chuyên biệt (10 - 25 chỗ)' },
    { _id: 'cat-tu-hoc', code: 'STUDY_AREA', name: 'Khu tự học', description: 'Không gian mở dành cho sinh viên tự học, thảo luận (8 - 120 chỗ)' },
    { _id: 'cat-lab', code: 'COMPUTER_LAB', name: 'Phòng máy tính', description: 'Phòng thực hành tin học trang bị máy tính cấu hình cao (40 chỗ)' },
    { _id: 'cat-hoi-truong', code: 'AUDITORIUM', name: 'Hội trường', description: 'Hội trường lớn tổ chức sự kiện, hội thảo toàn trường (300 - 500 chỗ)' }
  ];
  await catCol.insertMany(categories);

  const equipmentList = [
    { _id: 'eq-may-chieu', code: 'EQ-PRJ', name: 'Máy chiếu Full HD', type: 'AV', description: 'Máy chiếu Sony/Panasonic độ nét cao', status: 'AVAILABLE' },
    { _id: 'eq-dieu-hoa', code: 'EQ-AC', name: 'Điều hòa công suất lớn', type: 'CLIMATE', description: 'Điều hòa Daikin inverter', status: 'AVAILABLE' },
    { _id: 'eq-wifi', code: 'EQ-WIFI', name: 'Wifi chuyên dụng Aruba', type: 'NETWORK', description: 'Access point chịu tải cao 100+ user', status: 'AVAILABLE' },
    { _id: 'eq-bang-tu', code: 'EQ-BOARD', name: 'Bảng từ viết bút lông', type: 'FURNITURE', description: 'Bảng chống lóa tiêu chuẩn', status: 'AVAILABLE' },
    { _id: 'eq-tv-hop', code: 'EQ-SMART-TV', name: 'TV họp trực tuyến 75 inch', type: 'AV', description: 'Màn hình cảm ứng tích hợp camera Zoom/Teams', status: 'AVAILABLE' },
    { _id: 'eq-o-cam', code: 'EQ-SOCKET', name: 'Ổ cắm điện từng bàn', type: 'POWER', description: 'Hệ thống điện an toàn cho laptop/sạc', status: 'AVAILABLE' },
    { _id: 'eq-micro', code: 'EQ-MIC', name: 'Micro không dây & Loa âm trần', type: 'AUDIO', description: 'Micro Shure không dây lọc tạp âm', status: 'AVAILABLE' },
    { _id: 'eq-quat-tran', code: 'EQ-FAN', name: 'Quạt trần đảo gió', type: 'CLIMATE', description: 'Quạt làm mát ngoài trời', status: 'AVAILABLE' },
    { _id: 'eq-ban-go', code: 'EQ-DESK', name: 'Bàn ghế gỗ tự nhiên', type: 'FURNITURE', description: 'Bàn ghế chống nước ngoài trời', status: 'AVAILABLE' },
    { _id: 'eq-pc-lab', code: 'EQ-PC', name: 'Máy tính Core i7 16GB RAM', type: 'IT', description: 'PC chuyên dụng thực hành phần mềm', status: 'AVAILABLE' }
  ];
  await eqCol.insertMany(equipmentList);

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
        { id: 'eq-may-chieu', name: 'Máy chiếu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-dieu-hoa', name: 'Điều hòa', quantity: 2, condition: 'GOOD' },
        { id: 'eq-wifi', name: 'Wifi tốc độ cao', quantity: 1, condition: 'GOOD' },
        { id: 'eq-bang-tu', name: 'Bảng từ', quantity: 1, condition: 'GOOD' }
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
        { id: 'eq-may-chieu', name: 'Máy chiếu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-dieu-hoa', name: 'Điều hòa', quantity: 1, condition: 'GOOD' },
        { id: 'eq-bang-tu', name: 'Bảng từ', quantity: 1, condition: 'GOOD' },
        { id: 'eq-tv-hop', name: 'TV họp trực tuyến', quantity: 1, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '08:00', close: '17:30' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: false,
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
        { id: 'eq-wifi', name: 'Wifi tốc độ cao', quantity: 4, condition: 'GOOD' },
        { id: 'eq-dieu-hoa', name: 'Điều hòa', quantity: 6, condition: 'GOOD' },
        { id: 'eq-o-cam', name: 'Ổ cắm điện', quantity: 60, condition: 'GOOD' }
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
      floorId: 'floor-a-3',
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
        { id: 'eq-may-chieu', name: 'Máy chiếu', quantity: 2, condition: 'GOOD' },
        { id: 'eq-dieu-hoa', name: 'Điều hòa', quantity: 4, condition: 'GOOD' },
        { id: 'eq-micro', name: 'Micro không dây', quantity: 2, condition: 'GOOD' }
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
        { id: 'eq-quat-tran', name: 'Quạt trần', quantity: 1, condition: 'GOOD' },
        { id: 'eq-ban-go', name: 'Bàn ghế gỗ', quantity: 1, condition: 'GOOD' },
        { id: 'eq-o-cam', name: 'Ổ cắm điện', quantity: 4, condition: 'GOOD' }
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
        { id: 'eq-may-chieu', name: 'Máy chiếu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-dieu-hoa', name: 'Điều hòa', quantity: 2, condition: 'GOOD' },
        { id: 'eq-wifi', name: 'Wifi tốc độ cao', quantity: 1, condition: 'GOOD' }
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
      _id: 'b1-lab202',
      code: 'B1-LAB202',
      name: 'Phòng Thực hành Tin học B1.202',
      buildingId: 'bldg-b1',
      buildingName: 'Tòa nhà B1 - Tầng 2',
      building: 'Tòa nhà B1 - Tầng 2',
      floorId: 'floor-b1-2',
      floorName: 'Tầng 2',
      categoryId: 'cat-lab',
      categoryName: 'Phòng máy tính',
      spaceType: 'Phòng máy tính',
      capacity: 40,
      area: 75,
      areaSize: 75,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Phòng máy thực hành trang bị 40 PC Core i7, switch mạng gigabit, chuyên học lập trình và phân tích dữ liệu.',
      equipment: [
        { id: 'eq-pc-lab', name: 'Máy tính Core i7', quantity: 40, condition: 'GOOD' },
        { id: 'eq-may-chieu', name: 'Máy chiếu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-dieu-hoa', name: 'Điều hòa', quantity: 2, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '07:30', close: '17:30' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: false,
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
      _id: 'a-hoi-truong',
      code: 'A-HT',
      name: 'Hội trường Lớn Tòa A',
      buildingId: 'bldg-a',
      buildingName: 'Tòa nhà A - Tầng 1',
      building: 'Tòa nhà A - Tầng 1',
      floorId: 'floor-a-1',
      floorName: 'Tầng 1',
      categoryId: 'cat-hoi-truong',
      categoryName: 'Hội trường',
      spaceType: 'Hội trường',
      capacity: 350,
      area: 320,
      areaSize: 320,
      status: SPACE_STATUS.AVAILABLE,
      description: 'Hội trường chính của trường UEL, trang bị sân khấu, hệ thống ánh sáng chuyên nghiệp, màn hình LED lớn.',
      equipment: [
        { id: 'eq-tv-hop', name: 'Màn hình LED sân khấu', quantity: 1, condition: 'GOOD' },
        { id: 'eq-micro', name: 'Dàn âm thanh hội trường', quantity: 4, condition: 'GOOD' },
        { id: 'eq-dieu-hoa', name: 'Hệ thống lạnh trung tâm', quantity: 8, condition: 'GOOD' }
      ],
      image: 'demo_space_card.png',
      operatingHours: { open: '07:00', close: '22:00' },
      allowedUsers: 'ALL',
      policy: {
        autoApprove: false,
        maxDurationMinutes: 480,
        noShowGraceMinutes: 30,
        awayWarningMinutes: 20,
        autoCheckoutMinutes: 45
      },
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    }
  ];
  await spacesCol.insertMany(spaces);

  // ==========================================
  // MODULE 4: BOOKING & SCHEDULE MODULE
  // ==========================================
  console.log('📅 [4/7] Khởi tạo Booking & Schedule Module (bookings, schedules)...');
  const bkCol = db.collection('bookings');
  const schCol = db.collection('schedules');
  await bkCol.deleteMany({});
  await schCol.deleteMany({});

  const bookings = [
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
      status: BOOKING_STATUS.APPROVED,
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
      purpose: 'Họp hội đồng nghiệm thu đề tài NCKH sinh viên',
      attendeeCount: 12,
      status: BOOKING_STATUS.APPROVED,
      checkInCode: '201999',
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null
    },
    {
      _id: 'BK-20261011-003',
      spaceId: 'choi-1',
      spaceName: 'Chòi tự học 1',
      userId: 'USER-SV-02',
      userEmail: 'ngocttb21411@st.uel.edu.vn',
      userName: 'Trần Thị Bích Ngọc',
      startTime: new Date('2026-10-12T09:00:00Z'),
      endTime: new Date('2026-10-12T11:00:00Z'),
      purpose: 'Họp ban kỹ thuật CLB Tin học UEL',
      attendeeCount: 5,
      status: BOOKING_STATUS.PENDING,
      checkInCode: '001234',
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null
    },
    {
      _id: 'BK-20261011-004',
      spaceId: 'thu-vien-2',
      spaceName: 'Khu tự học Thư viện',
      userId: 'USER-SV-01',
      userEmail: 'giangnntk24411@st.uel.edu.vn',
      userName: 'Nguyễn Giang',
      startTime: new Date('2026-10-11T14:00:00Z'),
      endTime: new Date('2026-10-11T16:00:00Z'),
      purpose: 'Tự học ôn thi cuối kỳ',
      attendeeCount: 1,
      status: BOOKING_STATUS.COMPLETED,
      checkInCode: '998877',
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null
    }
  ];
  await bkCol.insertMany(bookings);

  const schedules = [
    {
      _id: 'SCH-PTWNC-01',
      spaceId: 'b1-104',
      organizationId: 'org-khoa-httt',
      courseCode: 'MIS2023',
      courseName: 'Phát triển Web Kinh doanh Nâng cao',
      semester: 'HK1-2026-2027',
      dayOfWeek: 2, // Thứ Ba
      startTime: new Date('2026-10-13T07:00:00Z'),
      endTime: new Date('2026-10-13T11:15:00Z'),
      scheduleType: 'CLASS',
      status: 'ACTIVE',
      createdAt: now()
    },
    {
      _id: 'SCH-CSDL-02',
      spaceId: 'b1-lab202',
      organizationId: 'org-khoa-httt',
      courseCode: 'MIS1005',
      courseName: 'Thực hành Cơ sở Dữ liệu NoSQL',
      semester: 'HK1-2026-2027',
      dayOfWeek: 4, // Thứ Năm
      startTime: new Date('2026-10-15T13:00:00Z'),
      endTime: new Date('2026-10-15T17:15:00Z'),
      scheduleType: 'LAB',
      status: 'ACTIVE',
      createdAt: now()
    }
  ];
  await schCol.insertMany(schedules);

  // ==========================================
  // MODULE 5: USAGE & PRESENCE MODULE
  // ==========================================
  console.log('⏱️ [5/7] Khởi tạo Usage Module (usage_sessions, presence_records, release_cases)...');
  const usCol = db.collection('usage_sessions');
  const prCol = db.collection('presence_records');
  const relCol = db.collection('release_cases');
  await usCol.deleteMany({});
  await prCol.deleteMany({});
  await relCol.deleteMany({});

  const usageSessions = [
    {
      _id: 'US-20261011-001',
      bookingId: 'BK-20261011-004',
      spaceId: 'thu-vien-2',
      spaceName: 'Khu tự học Thư viện',
      userId: 'USER-SV-01',
      checkInTime: new Date('2026-10-11T14:02:00Z'),
      checkOutTime: new Date('2026-10-11T15:58:00Z'),
      checkInMethod: 'QR_CODE',
      checkOutMethod: 'MANUAL',
      status: SESSION_STATUS.COMPLETED,
      lastPresenceAt: new Date('2026-10-11T15:30:00Z'),
      totalAwayMinutes: 0,
      createdAt: now(),
      updatedAt: now()
    }
  ];
  await usCol.insertMany(usageSessions);

  const presenceRecords = [
    {
      _id: 'PR-001',
      usageId: 'US-20261011-001',
      spaceId: 'thu-vien-2',
      userId: 'USER-SV-01',
      recordedTime: new Date('2026-10-11T14:30:00Z'),
      presenceStatus: 'PRESENT',
      dataSource: 'WIFI_PROBE',
      createdAt: now()
    }
  ];
  await prCol.insertMany(presenceRecords);

  // ==========================================
  // MODULE 6: MONITORING MODULE (Occupancy, Notifications)
  // ==========================================
  console.log('📊 [6/7] Khởi tạo Monitoring Module (occupancy_records, notifications)...');
  const occCol = db.collection('occupancy_records');
  const notifCol = db.collection('notifications');
  await occCol.deleteMany({});
  await notifCol.deleteMany({});

  const occupancyRecords = [
    { _id: newId(), spaceId: 'b1-104', spaceName: 'Phòng B1.104', userCount: 42, capacity: 50, rate: 84, recordedTime: new Date('2026-10-11T09:00:00Z') },
    { _id: newId(), spaceId: 'thu-vien-2', spaceName: 'Khu tự học Thư viện', userCount: 95, capacity: 120, rate: 79, recordedTime: new Date('2026-10-11T09:00:00Z') },
    { _id: newId(), spaceId: 'a2-1', spaceName: 'Phòng Họp A2.1', userCount: 10, capacity: 15, rate: 67, recordedTime: new Date('2026-10-11T09:00:00Z') },
    { _id: newId(), spaceId: 'choi-1', spaceName: 'Chòi tự học 1', userCount: 6, capacity: 8, rate: 75, recordedTime: new Date('2026-10-11T09:00:00Z') }
  ];
  await occCol.insertMany(occupancyRecords);

  const notifications = [
    {
      _id: 'NT-001',
      userId: 'USER-SV-01',
      type: 'BOOKING_APPROVED',
      title: 'Đặt phòng thành công!',
      content: 'Lịch đặt Phòng B1.104 ngày 12/10/2026 từ 08:00 - 10:00 đã được phê duyệt.',
      isRead: false,
      createdAt: now()
    },
    {
      _id: 'NT-002',
      userId: 'USER-GV-01',
      type: 'BOOKING_REMINDER',
      title: 'Nhắc nhở lịch họp',
      content: 'Bạn có lịch họp tại Phòng Họp A2.1 vào lúc 13:30 chiều nay.',
      isRead: true,
      createdAt: now()
    }
  ];
  await notifCol.insertMany(notifications);

  // ==========================================
  // MODULE 7: ADMINISTRATION MODULE (Incidents, Feedback, Audit Logs)
  // ==========================================
  console.log('🛡️ [7/7] Khởi tạo Administration Module (incidents, feedback, audit_logs)...');
  const incCol = db.collection('incidents');
  const fbCol = db.collection('feedback');
  const auditCol = db.collection('audit_logs');
  await incCol.deleteMany({});
  await fbCol.deleteMany({});
  await auditCol.deleteMany({});

  const incidents = [
    {
      _id: 'INC-20261011-001',
      spaceId: 'b1-104',
      spaceName: 'Phòng B1.104',
      equipmentName: 'Máy chiếu',
      reporterId: 'USER-SV-01',
      reporterName: 'Nguyễn Giang',
      incidentType: 'HARDWARE',
      description: 'Cáp HDMI kết nối máy chiếu bị lỏng tín hiệu, chập chờn khi chiếu slide.',
      severity: 'LOW',
      status: 'RESOLVED',
      handlerId: 'USER-ADMIN-01',
      reportTime: new Date('2026-10-10T10:00:00Z'),
      completedTime: new Date('2026-10-10T14:30:00Z'),
      createdAt: now(),
      updatedAt: now()
    },
    {
      _id: 'INC-20261011-002',
      spaceId: 'thu-vien-2',
      spaceName: 'Khu tự học Thư viện',
      equipmentName: 'Điều hòa',
      reporterId: 'USER-SV-02',
      reporterName: 'Trần Thị Bích Ngọc',
      incidentType: 'FACILITY',
      description: 'Điều hòa khu vực góc trái phát tiếng kêu rè rè khi hoạt động.',
      severity: 'MEDIUM',
      status: 'IN_PROGRESS',
      handlerId: 'USER-ADMIN-01',
      reportTime: new Date('2026-10-11T08:30:00Z'),
      createdAt: now(),
      updatedAt: now()
    }
  ];
  await incCol.insertMany(incidents);

  const feedbackList = [
    {
      _id: 'FB-001',
      userId: 'USER-SV-01',
      userName: 'Nguyễn Giang',
      spaceId: 'thu-vien-2',
      spaceName: 'Khu tự học Thư viện',
      rating: 5,
      content: 'Không gian thư viện tầng 2 rất yên tĩnh, ánh sáng tốt và wifi cực kỳ ổn định!',
      createdAt: now()
    },
    {
      _id: 'FB-002',
      userId: 'USER-GV-01',
      userName: 'TS. Trịnh Thị Kim Chi',
      spaceId: 'a2-1',
      spaceName: 'Phòng Họp A2.1',
      rating: 5,
      content: 'Màn hình họp trực tuyến rất nét, âm thanh rõ ràng, phù hợp cho các buổi bảo vệ đồ án.',
      createdAt: now()
    },
    {
      _id: 'FB-003',
      userId: 'USER-SV-02',
      userName: 'Trần Thị Bích Ngọc',
      spaceId: 'b1-104',
      spaceName: 'Phòng B1.104',
      rating: 4,
      content: 'Phòng học rộng rãi, điều hòa mát. Đề xuất bổ sung thêm ổ cắm điện ở các dãy bàn sau.',
      createdAt: now()
    }
  ];
  await fbCol.insertMany(feedbackList);

  const auditLogs = [
    {
      _id: newId(),
      actorId: 'SYSTEM',
      action: 'DATABASE_INITIALIZATION',
      entityName: 'System',
      entityId: 'ALL_MODULES',
      level: 'INFO',
      message: 'Hệ thống đã khởi tạo hoàn tất cấu trúc cơ sở dữ liệu trên MongoDB Atlas',
      createdAt: now()
    },
    {
      _id: newId(),
      actorId: 'USER-ADMIN-01',
      action: 'SPACE_CREATED',
      entityName: 'Space',
      entityId: 'b1-104',
      level: 'INFO',
      message: 'Tạo mới không gian Phòng B1.104',
      createdAt: now()
    }
  ];
  await auditCol.insertMany(auditLogs);

  // ==========================================
  // INDEXING TỐI ƯU TRÊN MONGODB ATLAS
  // ==========================================
  console.log('⚡ Thiết lập Indexes tối ưu cho truy vấn...');
  await spacesCol.createIndex({ code: 1 }, { unique: true });
  await spacesCol.createIndex({ buildingId: 1, status: 1 });
  await spacesCol.createIndex({ categoryId: 1 });
  await usersCol.createIndex({ email: 1 }, { unique: true });
  await usersCol.createIndex({ role: 1 });
  await bkCol.createIndex({ spaceId: 1, startTime: 1, endTime: 1 });
  await bkCol.createIndex({ userId: 1, status: 1 });
  await occCol.createIndex({ spaceId: 1, recordedTime: -1 });
  await incCol.createIndex({ spaceId: 1, status: 1 });
  await fbCol.createIndex({ spaceId: 1 });
  await auditCol.createIndex({ createdAt: -1 });

  console.log('✅ [HOÀN TẤT] 100% CƠ SỞ DỮ LIỆU ĐÃ ĐƯỢC XÂY DỰNG & NẠP LÊN MONGODB ATLAS CLOUD THÀNH CÔNG!');
  await closeDb();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ [SEEDER ERROR]:', err);
    process.exit(1);
  });
}

module.exports = { seed };
