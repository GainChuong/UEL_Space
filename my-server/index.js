/**
 * my server mongo db
 * Express + MongoDB Atlas (Layered Architecture)
 * Phục vụ RESTful API, Static Assets, Google OAuth 2.0 và Quản lý cơ sở vật chất
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');

const { env } = require('./src/config/env');
const { connectToDb, getCollection } = require('./src/config/db');
const { errorHandler } = require('./src/common/error-handler');
const { startJobs } = require('./src/jobs/scheduler');
const { toLegacySpace } = require('./src/common/presenters');

// Import Modules Routes
const { authRoutes } = require('./src/modules/auth/auth.routes');
const { spaceRoutes } = require('./src/modules/spaces/space.routes');
const { bookingRoutes } = require('./src/modules/bookings/booking.routes');
const { catalogRoutes } = require('./src/modules/catalog/catalog.routes');
const { organizationRoutes } = require('./src/modules/organizations/organization.routes');
const { userRoutes } = require('./src/modules/users/user.routes');
const { usageRoutes } = require('./src/modules/usage/usage.routes');
const { occupancyRoutes } = require('./src/modules/occupancy/occupancy.routes');
const { incidentRoutes } = require('./src/modules/incidents/incident.routes');
const { feedbackRoutes } = require('./src/modules/feedback/feedback.routes');
const { auditRoutes } = require('./src/modules/audit/audit.routes');
const { analyticsRoutes } = require('./src/modules/analytics/analytics.routes');
const { scheduleRoutes } = require('./src/modules/schedules/schedule.routes');
const { notificationRoutes } = require('./src/modules/notifications/notification.routes');
const { paymentRoutes } = require('./src/modules/payments/payment.routes');
const { chatbotRoutes } = require('./src/modules/chatbot/chatbot.routes');
const { platformAdminRoutes } = require('./src/modules/platform-admin/platform-admin.routes');
const { PlatformAdminService } = require('./src/modules/platform-admin/platform-admin.service');
const { uploadRoutes } = require('./src/modules/upload/upload.routes');
const { calendarRoutes } = require('./src/modules/calendar/calendar.routes');
const { CalendarService } = require('./src/modules/calendar/calendar.service');

// Import Repositories & Services để lắp ráp Dependency Injection
const { CatalogRepository } = require('./src/modules/catalog/catalog.repository');
const { BookingRepository } = require('./src/modules/bookings/booking.repository');
const { ScheduleRepository } = require('./src/modules/schedules/schedule.repository');
const { SpaceRepository } = require('./src/modules/spaces/space.repository');
const { NotificationRepository } = require('./src/modules/notifications/notification.repository');
const { NotificationService } = require('./src/modules/notifications/notification.service');
const { OrganizationRepository } = require('./src/modules/organizations/organization.repository');
const { MembershipRepository } = require('./src/modules/organizations/membership.repository');
const { OrganizationService } = require('./src/modules/organizations/organization.service');
const { UsageRepository } = require('./src/modules/usage/usage.repository');
const { UserRepository } = require('./src/modules/users/user.repository');
const { seed } = require('./src/seed/seed');

async function bootstrap() {
  const app = express();
  const port = env.port || 3000;

  // 1. Logger & Middlewares
  app.use(morgan('dev'));
  app.use(
    cors({
      origin: (origin, callback) => {
        // Cho phép các request không có origin (ví dụ curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.vercel.app') ||
          origin.includes('onrender.com') ||
          origin === env.clientOrigin
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Phục vụ tài nguyên tĩnh (Hình ảnh phòng học, logo...)
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/images', express.static(path.join(__dirname, 'public/images')));

  // Session middleware
  app.use(
    session({
      secret: env.sessionSecret || 'uel-space-secret-key-2026',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
      }
    })
  );

  // 2. Kết nối MongoDB Atlas thật
  console.log('[my server mongo db] Đang kết nối tới MongoDB Atlas...');
  const db = await connectToDb();
  console.log(`[my server mongo db] Đã kết nối cơ sở dữ liệu MongoDB Atlas: "${db.databaseName}"`);

  // Tự động kiểm tra dữ liệu mẫu
  const spacesCount = await db.collection('spaces').countDocuments();
  if (spacesCount === 0) {
    console.log('[my server mongo db] Database chưa có dữ liệu. Đang tự động chạy seed...');
    await seed();
  }

  // 3. Khởi tạo Context Collections
  const collections = {
    users: getCollection('users'),
    spaces: getCollection('spaces'),
    bookings: getCollection('bookings'),
    organizations: getCollection('organizations'),
    memberships: getCollection('memberships'),
    buildings: getCollection('buildings'),
    floors: getCollection('floors'),
    categories: getCollection('space_categories'),
    equipment: getCollection('equipment'),
    usageSessions: getCollection('usage_sessions'),
    presenceRecords: getCollection('presence_records'),
    releaseCases: getCollection('release_cases'),
    notifications: getCollection('notifications'),
    occupancyRecords: getCollection('occupancy_records'),
    incidents: getCollection('incidents'),
    feedback: getCollection('feedback'),
    auditLogs: getCollection('audit_logs'),
    schedules: getCollection('schedules'),
    chatSessions: getCollection('chat_sessions'),
    chatLearnedIntents: getCollection('chat_learned_intents')
  };

  // 4. Lắp ráp Services & Repositories dùng chung
  const catalogRepository = new CatalogRepository({
    buildings: collections.buildings,
    floors: collections.floors,
    categories: collections.categories,
    equipment: collections.equipment
  });
  const bookingRepository = new BookingRepository(collections);
  const scheduleRepository = new ScheduleRepository(collections.schedules);
  const spaceRepository = new SpaceRepository(collections.spaces);
  const notificationRepository = new NotificationRepository(collections.notifications);
  const notificationService = new NotificationService(notificationRepository);
  const organizationRepository = new OrganizationRepository(collections.organizations);
  const membershipRepository = new MembershipRepository(collections.memberships);
  const organizationService = new OrganizationService(organizationRepository, membershipRepository);
  const usageRepository = new UsageRepository(collections);
  const userRepository = new UserRepository(collections);

  // 5. Mount API Routes
  app.get('/', (req, res) => {
    res.json({
      status: 'ONLINE',
      system: 'UEL Space RESTful API & Asset Server',
      database: 'MongoDB Atlas Cloud',
      connectedDb: db.databaseName,
      time: new Date().toISOString()
    });
  });

  // RESTful Modular API Routes
  app.use('/api/auth', authRoutes({ users: collections.users, organizationService }));
  app.use(
    '/api/spaces',
    spaceRoutes({
      spaces: collections.spaces,
      catalogRepository,
      bookingRepository,
      scheduleRepository,
      notificationService
    })
  );
  app.use(
    '/api/bookings',
    bookingRoutes({
      ...collections,
      spaceRepository,
      scheduleRepository,
      notificationService,
      userRepository
    })
  );
  app.use(
    '/api/payments',
    paymentRoutes({
      bookingRepository,
      spaceRepository,
      notificationService,
      db
    })
  );
  app.use(
    '/api/catalog',
    catalogRoutes({
      buildings: collections.buildings,
      floors: collections.floors,
      categories: collections.categories,
      equipment: collections.equipment
    })
  );
  app.use('/api/organizations', organizationRoutes(collections));
  app.use('/api/users', userRoutes(collections));
  app.use(
    '/api/usage',
    usageRoutes({
      ...collections,
      bookingRepository,
      spaceRepository,
      notificationService
    })
  );
  app.use(
    '/api/occupancy',
    occupancyRoutes({
      ...collections,
      usageRepository,
      spaceRepository
    })
  );
  app.use(
    '/api/incidents',
    incidentRoutes({
      ...collections,
      spaceRepository,
      notificationService
    })
  );
  app.use(
    '/api/feedback',
    feedbackRoutes({
      ...collections,
      usageRepository,
      spaceRepository
    })
  );
  app.use('/api/audit', auditRoutes(collections));
  app.use('/api/analytics', analyticsRoutes(collections));
  app.use('/api/schedules', scheduleRoutes(collections));
  app.use('/api/notifications', notificationRoutes({ ...collections, notificationService }));
  app.use(
    '/api/chatbot',
    chatbotRoutes({
      spaces: collections.spaces,
      chatSessions: collections.chatSessions,
      chatLearnedIntents: collections.chatLearnedIntents,
      bookings: collections.bookings
    })
  );

  // Platform Super Admin Control Center
  const platformAdminService = new PlatformAdminService({ ...collections, notificationService });
  app.use('/api/admin', platformAdminRoutes(platformAdminService));
  app.use('/api/upload', uploadRoutes());

  // Google Calendar Live Integration Service & Routes (Option C)
  const calendarService = new CalendarService({ usersCollection: collections.users, db });
  app.use('/api/calendar', calendarRoutes({ calendarService }));

  // 6. LEGACY ROUTES (Tương thích ngược 100% với Frontend hiện tại)
  // GET /spaces - Đọc trực tiếp từ MongoDB Atlas
  app.get('/spaces', async (req, res, next) => {
    try {
      const rawSpaces = await collections.spaces.find({ deletedAt: null }).sort({ name: 1 }).toArray();
      const legacySpaces = rawSpaces.map(toLegacySpace);
      res.json(legacySpaces);
    } catch (err) {
      next(err);
    }
  });

  // GET /spaces/:id - Đọc chi tiết phòng từ MongoDB Atlas
  app.get('/spaces/:id', async (req, res, next) => {
    try {
      const space = await collections.spaces.findOne({ _id: req.params.id, deletedAt: null });
      if (!space) {
        return res.status(404).json({ message: 'Không tìm thấy phòng trong cơ sở dữ liệu!' });
      }
      res.json(toLegacySpace(space));
    } catch (err) {
      next(err);
    }
  });

  // 7. Global Error Handler
  app.use(errorHandler);

  // 8. Background Jobs (No-show, Presence, Occupancy Snapshot)
  startJobs();

  // 9. Lắng nghe trên cổng (0.0.0.0 cho Render / Cloud Host)
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 my server mongo db đang chạy tại: http://localhost:${port}`);
    console.log(`📡 Cơ sở dữ liệu: MongoDB Atlas Cloud (${db.databaseName})`);
    console.log(`🖼️ Static Images phục vụ tại: http://localhost:${port}/images/`);
    ensureYoloAiService();
  });
}

function ensureYoloAiService() {
  const externalUrl = process.env.AI_SERVICE_URL;
  fetch('http://127.0.0.1:5001/health')
    .then(r => r.json())
    .then(data => {
      console.log(`🤖 YOLO11-IndoorCrowd Computer Vision Microservice sẵn sàng (${data.model}) tại cổng 5001`);
    })
    .catch(() => {
      // Nếu AI service được deploy tách riêng (Cloud) thì không tự khởi chạy cục bộ
      if (externalUrl) {
        console.log(`🤖 YOLO11-IndoorCrowd Microservice cấu hình ngoài (AI_SERVICE_URL=${externalUrl}), bỏ qua khởi chạy cục bộ.`);
        return;
      }

      console.log('🚀 Đang khởi động SOTA YOLO11-IndoorCrowd Computer Vision AI Service (port 5001)...');
      const { spawn } = require('child_process');
      const fs = require('fs');
      const path = require('path');

      // BẮT BUỘC chuyển hướng stdout/stderr ra file log:
      // nếu dùng stdio: 'ignore', tiến trình Python (py launcher + uvicorn)
      // sẽ không khởi động được trên Windows.
      const logPath = path.join(__dirname, 'src', 'ai-service', 'yolo_service.log');
      let logFd = null;
      try {
        logFd = fs.openSync(logPath, 'a');
      } catch (err) {
        console.warn('Không mở được file log YOLO service:', err.message);
      }

      const venvPy = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
      const pyCandidates = process.platform === 'win32'
  ? [
      venvPy,
      'C:\\Users\\legal\\AppData\\Local\\Programs\\Python\\Python313\\python.exe',
      'py',
      'python3',
      'python'
    ]
  : ['python3', 'python'];
let pyCmd = pyCandidates[0];
for (const cand of pyCandidates) {
  if (cand.includes('\\') || cand.includes('/')) {
    if (fs.existsSync(cand)) { pyCmd = cand; break; }
  } else {
    pyCmd = cand;
    break;
  }
}
      try {
        const pyArgs = pyCmd === 'py' ? ['-3.13', 'src/ai-service/yolo_service.py'] : ['src/ai-service/yolo_service.py'];
      const aiProc = spawn(pyCmd, pyArgs, {
          cwd: __dirname,
          detached: true,
          stdio: logFd === null ? 'ignore' : ['ignore', logFd, logFd],
          windowsHide: true,
          // Ghi đè PORT: nếu không, tiến trình con kế thừa PORT=3000 của Express
          // (hoặc PORT do Render cấp) và bị lỗi "address already in use".
          env: { ...process.env, PORT: '5001' }
        });
        aiProc.on('error', (err) => {
          console.warn(`Không thể khởi chạy YOLO service (${pyCmd}):`, err.message);
        });
        aiProc.unref();
      } catch (err) {
        console.warn('Không thể khởi chạy YOLO service:', err.message);
      }
    });
}

bootstrap().catch((error) => {
  console.error('❌ [FATAL] Lỗi khởi động my server mongo db:', error);
  process.exit(1);
});
