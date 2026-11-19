# UEL Space

Nền tảng chia sẻ, đặt chỗ và quản trị không gian làm việc, học tập, hội họp và sự kiện thông minh tích hợp trí tuệ nhân tạo.

---

## 1. Tổng quan

UEL Space là ứng dụng web mô hình sàn giao dịch hai chiều kết nối ba nhóm đối tượng: Khách thuê (Buyer), Chủ không gian (Seller) và Quản trị viên nền tảng (Admin). Hệ thống hỗ trợ trọn vẹn quy trình từ tìm kiếm, lọc không gian, đặt chỗ, thanh toán trực tuyến, đồng bộ lịch cá nhân đến nhận phòng qua mã QR, giám sát sĩ số thực tế bằng thị giác máy tính và đối soát thanh toán.

### Các phân hệ chính

- **Phân hệ Khách thuê (Marketplace)**: Tìm kiếm và lọc không gian đa tiêu chí, xem bản đồ và danh mục tập trung, xem chi tiết phòng và hồ sơ đối tác, đặt chỗ, thanh toán qua cổng MoMo Sandbox, đồng bộ Google Calendar hai chiều, quản lý lịch sử đơn thuê, xuất trình vé QR Check-in và tương tác với trợ lý ảo AI.
- **Phân hệ Chủ không gian (Seller Center)**: Quản lý danh mục không gian và bảng giá, phê duyệt hoặc từ chối yêu cầu đặt phòng, vận hành trạm Kiosk quét mã QR Check-in, theo dõi sĩ số phòng theo thời gian thực qua Camera AI hoặc thiết bị di động (Mobile CCTV WebRTC), xử lý ngoại lệ (No-show, quá giờ, vượt sĩ số) và theo dõi doanh thu.
- **Phân hệ Quản trị nền tảng (Admin Website)**: Giám sát chỉ số vận hành toàn sàn, kiểm duyệt không gian niêm yết, xác thực định danh tài khoản (eKYC), điều phối đơn thuê, quản lý dòng tiền ký quỹ (Escrow), phân xử tranh chấp dựa trên bằng chứng AI, cấu hình tham số hệ thống và tra cứu nhật ký kiểm toán (Audit Logs).

---

## 2. Công nghệ sử dụng

- **Front-end**: Angular 22.2 (SPA), TypeScript, Tailwind CSS 3.4, RxJS, ONNX Runtime Web, PeerJS (WebRTC P2P).
- **Back-end**: Node.js 20+, Express.js 4.19, Native MongoDB Driver (`mongodb` v6.8.0) theo kiến trúc phân lớp (Route - Controller - Service - Repository).
- **Cơ sở dữ liệu**: MongoDB Atlas (`uel_space`).
- **Xác thực và Phân quyền**: JSON Web Token (JWT HS256), Google OAuth 2.0, phân quyền theo vai trò (RBAC: `BUYER`, `SELLER`, `ADMIN`).
- **Tích hợp AI và Dịch vụ ngoài**:
  - Thị giác máy tính: Microservice Python (FastAPI / PyTorch CUDA) chạy mô hình YOLO11-IndoorCrowd kết hợp cơ chế suy luận dự phòng trên trình duyệt (ONNX Runtime Web).
  - Trợ lý hội thoại: Google Gemini API kết hợp kỹ thuật Retrieval-Augmented Generation (RAG) trên dữ liệu không gian thực tế.
  - Thanh toán và Lịch: MoMo Payment Gateway (Sandbox, xác thực chữ ký HMAC-SHA256) và Google Calendar API / iCalendar (.ICS).

---

## 3. Cấu trúc thư mục

```text
.
├── frontend/                     # Ứng dụng Front-end (Angular 22.2 + Tailwind CSS 3.4)
│   ├── public/models/            # Trọng số mô hình ONNX phục vụ suy luận tại trình duyệt
│   └── src/app/
│       ├── components/           # Các màn hình và thành phần giao diện (Buyer, Seller, Admin, CCTV, Chatbot)
│       ├── services/             # Dịch vụ gọi RESTful API và quản lý trạng thái
│       ├── guards/               # Functional Route Guards & HTTP Auth Interceptor (JWT)
│       └── i18n/                 # Từ điển đa ngôn ngữ (Tiếng Việt / Tiếng Anh)
├── my-server/                    # Máy chủ Back-end RESTful API (Node.js + Express.js)
│   ├── src/
│   │   ├── ai-service/           # Microservice Python phục vụ mô hình YOLO11-IndoorCrowd
│   │   ├── common/               # Hằng số hệ thống, tiện ích JWT, Slug, kiểm tra dữ liệu và xử lý lỗi
│   │   ├── config/               # Cấu hình biến môi trường và kết nối MongoDB Atlas
│   │   ├── jobs/                 # Tác vụ chạy nền định kỳ (No-show, cảnh báo vắng mặt, thu hồi phòng)
│   │   ├── middleware/           # Xác thực JWT và kiểm tra quyền truy cập theo vai trò
│   │   ├── modules/              # Các module nghiệp vụ (auth, spaces, bookings, payments, calendar, chatbot, occupancy, incidents, platform-admin, notifications)
│   │   └── seed/                 # Script khởi tạo dữ liệu mẫu và chỉ mục (Indexes)
│   └── index.js                  # Điểm khởi chạy ứng dụng Express
├── scripts/                      # Script chuẩn bị dữ liệu và huấn luyện mô hình YOLO11
├── Diagram/                      # Sơ đồ thiết kế hệ thống (BPMN, ERD, Use Case)
└── Brand_Guideline/              # Tài liệu nhận diện thương hiệu
```

---

## 4. Hướng dẫn cài đặt và khởi chạy

### Yêu cầu môi trường

- Node.js >= 20.x và npm >= 10.x
- Python >= 3.10 (tùy chọn nếu chạy Microservice AI trên GPU/CPU cục bộ)
- Kết nối MongoDB Atlas hoặc MongoDB Server

### Bước 1: Khởi chạy Back-end API (`my-server`)

```bash
cd my-server
npm install

# Khởi tạo dữ liệu mẫu (chạy lần đầu nếu cơ sở dữ liệu trống)
npm run seed

# Chạy máy chủ ở chế độ phát triển (mặc định tại http://localhost:3000)
npm run dev
```

### Bước 2: Khởi chạy Microservice AI (Tùy chọn)

Khi khởi chạy `my-server`, hệ thống tự động kích hoạt dịch vụ YOLO11 tại cổng `5001` nếu môi trường Python đã sẵn sàng. Có thể chạy độc lập bằng lệnh:

```bash
cd my-server
npm run ai:start
```

### Bước 3: Khởi chạy Front-end (`frontend`)

```bash
cd frontend
npm install
npm start
```

Truy cập ứng dụng tại địa chỉ: `http://localhost:4200`

---

## 5. Các nhóm API chính

| Nhóm chức năng | Đường dẫn cơ sở | Mô tả |
| :--- | :--- | :--- |
| Xác thực | `/api/auth` | Đăng ký, đăng nhập tài khoản hoặc Google OAuth 2.0, cấp mã JWT |
| Không gian | `/api/spaces` | Tìm kiếm, lọc, xem chi tiết theo ID hoặc Slug, thêm/sửa/ẩn không gian |
| Đặt chỗ | `/api/bookings` | Tạo đơn đặt chỗ, duyệt/từ chối, hủy đơn, đổi lịch, quét QR Check-in và Check-out |
| Thanh toán | `/api/payments` | Khởi tạo giao dịch MoMo Sandbox, xử lý Webhook IPN (HMAC-SHA256) và Callback |
| Giám sát AI | `/api/occupancy` | Nhận diện sĩ số từ khung hình camera và ghi nhận bản ghi công suất |
| Ngoại lệ & Tranh chấp | `/api/incidents` | Ghi nhận vi phạm sĩ số, quá giờ, phụ phí và khiếu nại |
| Lịch & Hỗ trợ | `/api/calendar`, `/api/chatbot`, `/api/notifications` | Đồng bộ Google Calendar, chatbot tư vấn RAG và luồng thông báo SSE |
| Quản trị sàn | `/api/admin` | Số liệu tổng quan, duyệt niêm yết, eKYC, đối soát Escrow, phán quyết tranh chấp và cấu hình |
