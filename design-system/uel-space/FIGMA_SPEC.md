# UEL Space - Đồng Bộ Toàn Diện Figma & Production Spec (100% Match)

> **Mục tiêu:** Tài liệu quy chuẩn thiết kế Figma đối chiếu 1:1 với ứng dụng Live Production tại `https://uelspace-tan.vercel.app` và dự án Stitch Canvas `https://stitch.withgoogle.com/projects/5956414420676624051`.

---

## 1. Hệ Thống Màu & Token Chuẩn (Live Theme)

| Token | Giá trị Hex | Ứng dụng trên Canvas |
|---|---|---|
| **Canvas Dark** | `#070D18` | Nền chính toàn bộ app (Dark mode mặc định) |
| **Card Surface** | `#0B132B` / `#001D3D` | Bề mặt thẻ phòng, panel điều khiển, modal popup |
| **Brand Deep Blue** | `#001428` / `#001D3D` | Sidebar Admin, cột trái màn hình Đăng nhập |
| **Brand Accent Cyan** | `#0284C7` / `#00A3FF` | Nút `[ 📅 Đặt chỗ ngay ]`, Tab active Admin, border focus |
| **CTA Coral / Orange** | `#F97316` | Nút `GỬI` nhận tin, nút `Đăng nhập Admin →`, điểm nhấn |
| **Price Highlight** | `#FBBF24` / `#F59E0B` | Giá phòng `$ 250,000 VNĐ / giờ` |
| **MoMo Payment** | `#A50064` / `#D82D8B` | Badge `MoMo QR`, nút `Thanh toán MoMo & Đặt chỗ` |
| **Status Green** | `#10B981` | Badge `Trống` / `Sẵn sàng` |
| **Status Amber** | `#F59E0B` | Badge `Sắp có lịch` (<30 phút) |
| **Status Red** | `#EF4444` | Badge `Đang sử dụng` |

---

## 2. Chi Tiết Các Màn Hình Đã Chuẩn Hóa Theo 5 Ảnh Thực Tế

### 🖥️ Màn hình 1: Trang Chủ (Homepage - `home.html`)
1. **Top Navbar:**
   - Logo `UEL SPACE` với biểu tượng ghim định vị và dòng phụ `Smart Campus Space Management`.
   - Danh sách tab: `Trang chủ` (active viền xanh cyan), `Bản đồ & Đặt phòng`, `Lịch sử đặt chỗ`, `Về chúng tôi`.
   - Cụm bên phải: Chuông thông báo (chấm cam), nút `🏪 Kênh Người Bán`, profile `👤 Đại diện Doanh nghiệp v`.
2. **Hero Banner:**
   - Ảnh nền chụp thực tế tòa nhà Thư viện UEL góc rộng.
   - Headline: `Find the right space \n Use it smarter`.
   - Subtitle: `Sàn thương mại điện tử chia sẻ văn phòng, phòng họp và bàn làm việc ngắn hạn, tối ưu công suất khai thác cùng công nghệ AI Occupancy.`
   - Thanh tìm kiếm bán trong suốt: `Tìm phòng họp, bàn làm việc, tòa nhà văn phòng đối tác...` kèm nút tròn mũi tên cyan `→`.
   - 4 Pill lọc nhanh kính mờ: `📅 Hôm nay v`, `⏰ 08:00 - 17:00 v`, `👥 Sức chứa v`, `🖥 Tất cả tiện ích v`.
3. **Lưới thẻ phòng (`Không gian sẵn sàng phục vụ`):**
   - Header: `Không gian sẵn sàng phục vụ` - `Tìm thấy 6 phòng phù hợp theo điều kiện lọc` - `Xem trên bản đồ >`.
   - **Thẻ 1 - Boardroom VIP B1:** Ảnh ghế họp, Badge `Trống` (xanh), `Phòng họp VIP` (cam), Vị trí `Central Tower Q.1 - Tầng 12`, Giá `$ 250,000 VNĐ / giờ` (vàng) + tag `MoMo QR` hồng tím, `24 chỗ ngồi | 60 m²`, chips tiện ích `[ AI Occupancy ] [ Màn hình 4K ] [ Cáp quang 1Gbps ] [ Micro hội nghị ]`, nút `[ 📅 Đặt chỗ ngay ]` (xanh cyan).
   - **Thẻ 2 - Private Suite A2:** `TechPark Executive - Tầng 5`, Giá `$ 180,000 VNĐ / giờ`, `12 người | 35 m²`.
   - **Thẻ 3 - Khu Hot Desk Coworking:** `Innovation Hub - Tầng 2`, Giá `$ 35,000 VNĐ / giờ`, `60 chỗ ngồi | 180 m²`.
4. **Footer toàn diện:**
   - 3 Cột danh mục: `LOẠI KHÔNG GIAN`, `MẠNG LƯỚI HUB NỔI BẬT`, `VỀ UEL SPACE`.
   - Hộp nhận bản tin: Input email, checkbox reCAPTCHA `Tôi không phải là người máy`, nút `GỬI →` màu cam.
   - Dòng liên hệ: Địa chỉ Số 669 Đỗ Mười, Hotline 19001239, Logo tròn ĐH Kinh tế - Luật và icon mạng xã hội.

---

### 🔐 Màn hình 2: Trang Đăng Nhập (Login - `login.html`)
- **Bố cục chia đôi (Split-Screen 58% - 42%):**
  - **Cột trái (Thương hiệu & Hình ảnh học xá):**
    - Logo tròn UEL ĐHQG-HCM góc trên.
    - Slogan lớn: `Find the right space.` (trắng) - `Use it smarter.` (cyan gradient).
    - Đoạn giới thiệu nền tảng chia sẻ văn phòng B2B tích hợp AI giám sát công suất.
  - **Cột phải (Panel Form đăng nhập nền tối `#070D18`):**
    - Link `← Quay lại Trang chủ`.
    - Tiêu đề `Đăng nhập` & mô tả.
    - Tab Switcher: `[ 🏢 Khách thuê / Doanh nghiệp ]` (Active) vs `[ 👤 Đối tác sở hữu không gian ]`.
    - Input `Tài khoản hoặc Email công ty` (nhập mẫu `member@techflow.vn`).
    - Input `Mật khẩu` (icon con mắt ẩn hiện).
    - `☑ Ghi nhớ đăng nhập` | `Quên mật khẩu?`.
    - Nút chính `Đăng nhập →]` (xanh đậm).
    - Nút Google: `G Đăng nhập bằng tài khoản Google`.
    - Hộp tài khoản Quản trị: `● Tài khoản Quản trị viên UEL Space admin@uelspace.vn` + nút cam `Đăng nhập Admin →`.
    - Địa chỉ và hotline chân trang.

---

### 📅 Màn hình 3: Modal Đặt Phòng & Đồng Bộ Google Calendar
- **Khung modal nền tối bo góc lớn:**
  - Header: Icon tòa nhà + `Private Suite A2` + Badge `Tầng 5`, phụ đề `TechPark Executive - Tầng 5 • Mạng lưới UEL Space`, nút đóng `✕`.
  - Thanh trạng thái viền xanh lá: `Phòng đang trống (Khả dụng)` - `Sẵn sàng đặt`.
  - 4 Khối thông số: Loại không gian (`Văn phòng riêng`), Sức chứa tối đa (`12 chỗ ngồi`), Vị trí (`Tầng 5`), Hiện trạng (`Trống`).
  - Danh sách tiện ích: `[ AI Occupancy ] [ Điều hòa 2 chiều ] [ Cáp quang 1Gbps ] [ Bảng kính ]`.
  - Khu vực Google Calendar:
    - Nút chuyển: `[ Chọn giờ ]` (Active) | `[ Xem Lịch Google ]`.
    - 3 Ô nhập: Ngày sử dụng (`10/12/2026`), Giờ bắt đầu (`08:00 AM`), Giờ kết thúc (`10:00 AM`).
    - 6 Khung giờ gợi ý: Sáng sớm (07:30 - 09:30), Giữa sáng (09:45 - 11:45), Đầu chiều (13:00 - 15:00), Cuối chiều (15:15 - 17:15), Đầu tối (17:30 - 19:30), Đêm muộn (19:30 - 21:30).
    - Link ngoài: `Mở App Google Calendar ↗`.
  - Thanh tóm tắt chi phí:
    - Trái: `THỜI GIAN & PHÍ ĐẶT CHỖ (MOMO QR): 180,000đ/giờ x 2 giờ (2026-10-12: 08:00 - 10:00)`.
    - Phải: `360,000 VNĐ` kèm tích xanh `✔ Đồng bộ Google Calendar`.
  - Footer hành động:
    - Nút `Đóng`.
    - Nút MoMo hồng tím nổi bật: `✉ Thanh toán MoMo & Đặt chỗ (360,000đ)`.

---

### 📊 Màn hình 4: Kênh Người Bán / Seller Center (Đầy đủ 5 Tab Chuyên Sâu)

#### Tab 4.1: Tổng quan & Doanh thu (`overview`)
* **KPI Header (4 Thẻ):**
  - Doanh thu gian hàng (T10): `68,500,000 đ` (↗ +24.5% tăng trưởng).
  - Đơn thuê chờ xác nhận: `5` (Cần chốt giữ slot cho khách).
  - Tỷ lệ lấp đầy: `78.4%` (192 khách thuê & đối tác đang check-in).
  - Listing đang niêm yết: `9 không gian` (Sẵn sàng đón khách).
* **Hiệu suất theo phân khu:** Central Tower Q.1 (92% - Top 1), TechPark Hub (85%), Innovation Hub (78%), Startup Pod Hub (64%).
* **Đơn thuê cần xác nhận (Cột phải):** Giảng đường A3.301 và Khu tự học Thư viện kèm nút `Chấp nhận đơn` (cyan) / `Từ chối`.
* **Sidebar Footer:** Rating `⭐ 4.95 (248 reviews)` | `ĐỐI TÁC XÁC MINH` | Số dư: `68,500,000 đ`.

#### Tab 4.2: Quản lý Đơn thuê phòng (`approvals` - Booking Orders)
* **Thống kê:** `Tổng số: 15 đơn • 5 chờ duyệt`.
* **Bộ lọc:** Search bar tìm mã đơn + Dropdown `Tất cả Tòa nhà & Hub`.
* **Bảng dữ liệu 6 cột chuẩn:**
  - `MÃ ĐƠN & NGÀY` • `NGƯỜI ĐẶT & TỔ CHỨC` • `KHÔNG GIAN & KHUNG GIỜ` • `MỤC ĐÍCH & SỨC CHỨA` • `TRẠNG THÁI` • `THAO TÁC XỬ LÝ`.
  - Hàng tiêu biểu:
    * `UEL-BK-2026-081`: Nguyễn Trần Kim Giang (CLB ITB UEL) | Giảng đường A3.301 | `CHỜ DUYỆT` (orange) | Nút `Phê duyệt` / `Từ chối`.
    * `UEL-BK-2026-082`: Trần Minh Anh | Khu tự học Thư viện [Trùng lịch] | `CHỜ DUYỆT`.
    * `UEL-BK-2026-083`: ThS. Lê Hoàng Long | Phòng Họp A2.1 | `ĐÃ DUYỆT` (green).
    * `UEL-BK-2026-079`: Phạm Quỳnh Như | Chòi tự học 1 | `TỪ CHỐI` (red).

#### Tab 4.3: Xử lý Vi phạm & Hủy slot (`exceptions` - No-show Tracking)
* **Banner cảnh báo:** `CƠ CHẾ PHÁT HIỆN VẮNG MẶT & THU HỒI CHỖ TỰ ĐỘNG (F21-F23 & F38)` - Tự động rà quét mỗi 5 phút, ngưỡng vắng mặt 15 phút.
* **3 Thẻ ca vi phạm:**
  - `Phòng học B1.102`: Vắng `22 phút` (quy định 15p), chưa quét lại QR. Nút `Đã quay lại` | `Thu hồi phòng` (cyan).
  - `Khu tự học Bàn 14`: Vắng `35 phút`, bỏ đồ giữ chỗ bị khiếu nại. Nút `Đã quay lại` | `Thu hồi phòng`.
  - `Chòi tự học 3`: Vắng `18 phút`, sinh viên đã quét mã gia hạn (`ĐÃ CÓ MẶT` - green).

#### Tab 4.4: Trạm Quét QR & Check-in (`qr-checkin` - Kiosk Mode)
* **Banner trạm:** `PRESENCE VERIFICATION (F09/F38)` - Bộ đếm: `2 LƯỢT QUÉT HÔM NAY` | `43/45 PHÒNG ĐANG MỞ`.
* **Khu vực nhận diện mã QR (Cột trái):** Khung camera chế độ chờ, nút `▶ Bật Camera` / `▶ Kích hoạt Camera ngay`.
* **Kết quả xác thực thực tế (Cột phải):** Khung theo dõi trạng thái quét thời gian thực.

#### Tab 4.5: Danh sách Không gian & Bảng giá niêm yết (`spaces`)
* **Header:** Tiêu đề & nút `+ Đăng tải Không gian mới` (cyan).
* **Lưới 6 thẻ listing chuẩn giá giờ & giá ngày:**
  1. `Hội trường Landmark A3`: `750,000 đ/h` | `5,200,000 đ/ngày` | 80 khách.
  2. `Phòng Họp VIP Executive A2.1`: `350,000 đ/h` | `2,400,000 đ/ngày` | 15 khách.
  3. `Khu Bàn làm việc linh hoạt Co-working`: `45,000 đ/h` | `250,000 đ/ngày` | 120 khách.
  4. `Văn phòng riêng Private Suite B2.101`: `500,000 đ/h` | `3,500,000 đ/ngày`.
  5. `Meeting Pod cách âm Smart Pod 01`: `120,000 đ/h` | `800,000 đ/ngày`.
  6. `Studio sáng tạo Creative Media A.105`: `400,000 đ/h` | `2,800,000 đ/ngày`.

---

### 🗺️ Màn hình 5 & 6: Bản Đồ Tầng & Lịch Sử Đặt Chỗ
- **Bản đồ tầng 2D (`map.html`):** Sidebar lọc 7 danh mục không gian, sơ đồ mặt bằng tầng 2 Thư viện UEL phân vùng màu sắc theo IoT telemetry, drawer thông tin phòng chi tiết.
- **Lịch sử đặt chỗ (`booking-history.html`):** 3 Hộp thống kê (Tổng số 12, Hiện tại 2, Đã xong 10), thẻ vé chi tiết kèm mã QR Check-in và mã PIN `8824`.

---

## 3. Cách Dán Toàn Bộ Vào Figma

Tất cả các bản vẽ trên đã được liên kết đồng bộ tại:
👉 **[https://stitch.withgoogle.com/projects/5956414420676624051](https://stitch.withgoogle.com/projects/5956414420676624051)**

Chỉ cần chọn màn hình trên giao diện Stitch, nhấn **"Copy to Figma"** và dán (`Ctrl + V`) trực tiếp vào file Figma của bạn để có trọn bộ layer và component Auto Layout nguyên bản!
