<p align="center">
  <img src="my-server/public/images/logo.png" alt="UEL Space Logo" width="280">
</p>

<h1 align="center">🤖 UEL SPACE - ĐỒ ÁN GIẢI PHÁP AI TRONG QUẢN TRỊ & THƯƠNG MẠI HÓA KHÔNG GIAN THÔNG MINH</h1>

<p align="center">
  <strong>ĐỒ ÁN GIẢI PHÁP TRÍ TUỆ NHÂN TẠO (AI SOLUTION PROJECT)</strong><br>
  <em>Hệ thống Sàn Thương mại Không gian tích hợp AI: YOLO11-IndoorCrowd Pure Vision Detection, Ensemble NMS & Trợ lý Ngôn ngữ Tự nhiên Google Gemini Flash</em><br>
  <em>Nền tảng Sàn Thương mại Điện tử Thuê Không gian Làm việc, Hội họp & Sự kiện Thông minh (Smart Space Rental Marketplace)</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI_Solution-YOLO11_Vision_Detection-7C3AED?style=for-the-badge&logo=openai&logoColor=white" alt="AI Solution">
  <img src="https://img.shields.io/badge/Google_Gemini-Flash_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/WebRTC-PeerJS_P2P-FF5722?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC">
  <img src="https://img.shields.io/badge/ONNX_Runtime-WebAssembly_SIMD-005CED?style=for-the-badge&logo=webassembly&logoColor=white" alt="ONNX Runtime Web">
  <img src="https://img.shields.io/badge/Cloudflare_Tunnel-HTTP%2F2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Tunnel">
  <img src="https://img.shields.io/badge/Angular-22.2-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-Atlas_6.8-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

---

## 📖 1. Giới thiệu tổng quan Đồ án Giải pháp AI (AI Solution Overview)

**UEL Space** là **Đồ án Giải pháp Trí tuệ Nhân tạo toàn diện (Full-Stack AI Solution)** ứng dụng trong lĩnh vực quản trị mặt bằng và sàn thương mại điện tử cho thuê không gian thông minh (Smart Space Rental Marketplace). Dự án giải quyết triệt để bài toán lãng phí công suất phòng (40–50% diện tích bỏ trống ngoài giờ cao điểm) và tự động hóa quy trình giám sát hiện diện mà không cần sự can thiệp thủ công của con người.

### 🧠 Hai Trụ Cột Công Nghệ AI Cốt Lõi:

#### 1. Thị giác Máy tính Hiện diện Thông minh (YOLO11-IndoorCrowd Pure Vision Detection):
* **Mô hình Fine-tuned YOLO11-IndoorCrowd:** Kiến trúc thuần Vision Detection (Single-Head Bounding Box Regression) được huấn luyện chuyên sâu 20 epochs trên tập dữ liệu đám đông trong nhà, giảng đường và không gian làm việc chia sẻ (`IndoorCrowd`). Mô hình loại bỏ hoàn toàn gánh nặng tính toán của polygon segmentation để đảm bảo tốc độ phản hồi tức thời.
* **Kết quả Đánh giá Benchmark Chính thức (Epoch 20):**
  * **Precision ($P$):** **`89.83%`** (Độ chính xác nhận diện người cực cao, triệt tiêu báo động giả).
  * **Recall ($R$):** **`66.98%`** (Bắt trọn phần lớn khách thuê ngay cả trong điều kiện ánh sáng yếu hoặc bị bàn ghế che chắn).
  * **Box mAP@0.5:** **`77.62%`** (Chỉ số mAP tại ngưỡng IoU 0.5 đạt tiêu chuẩn SOTA cho bài toán Indoor Surveillance).
  * **Box mAP@0.50:0.95:** **`52.06%`** (Độ khớp biên bao quanh cơ thể người chặt chẽ trên toàn dải IoU).
  * **Độ trễ xử lý (Inference Latency):** **`~18–25 ms`** trên GPU NVIDIA RTX 3050 CUDA (Python Turbo); **`~45–60 ms`** trên Client Edge ONNX WASM SIMD.
  * **Dung lượng mô hình:** Siêu nhẹ chỉ **`5.2 MB`** (`best.pt`) và **`9.4 MB`** (`yolo11n_indoor_crowd.onnx`).
* **Đột phá Khắc phục Hiện tượng Bị Chia Nhỏ Bounding Box Khi Quay Gần (Close-up Box Fragmentation):**
  1. **Adaptive Virtual Zoom-out Letterbox:** Áp dụng hệ số thu nhỏ ảo 25% (`zoomFactor = 0.75`) kết hợp neutral gray padding (`#727272`), đưa toàn bộ cơ thể người quay gần lọt trọn vào Receptive Field của các tầng feature map YOLO11.
  2. **Anatomy-aware Geometric IoS NMS:** Thuật toán hợp nhất hình học dựa trên tỷ lệ giao trên diện tích hộp nhỏ hơn ($\text{IoS} \ge 0.50$) kèm ràng buộc tỷ lệ khung hình cơ thể ($H/W \le 2.6$). Hợp nhất dứt điểm phần thân và chân bị đứt đoạn thành một box duy nhất mà không làm dính hai người đứng cạnh nhau.
  3. **Hardware Face Anchors Integration:** Tích hợp `window.FaceDetector` API tăng tốc phần cứng từ trình duyệt để neo giữ khuôn mặt sinh học, củng cố tọa độ bounding box cơ thể.
* **Kiến trúc Chịu lỗi Hybrid 3 Tầng:**
  * **Server GPU Microservice:** FastAPI / PyTorch CUDA (Port 5001) với Warmup Kernel chống trễ.
  * **Client Edge AI:** WebAssembly SIMD ONNX Runtime Web chạy trực tiếp trên card đồ họa/CPU của trình duyệt người dùng.
  * **COCO-SSD Fallback:** Đảm bảo hệ thống vẫn đếm người ổn định trên các thiết bị đời cũ.

#### 2. Trợ lý Ngôn ngữ Tự nhiên & Đặt phòng 1 chạm (Conversational AI & Context-RAG):
* **Lõi Google Gemini Flash:** Tiếp nhận yêu cầu tự nhiên tiếng Việt, bóc tách thực thể (sức chứa, giá tiền, trang thiết bị, thời gian).
* **Context-RAG thời gian thực:** Truy xuất dữ liệu phòng trực tiếp từ MongoDB Atlas nạp vào ngữ cảnh để tư vấn chính xác 100%.
* **Kiến trúc chịu lỗi 3 tầng (Circuit Breaker):** Cloud Gemini API $\rightarrow$ Server Heuristics Regex Engine ($<5\text{ms}$) $\rightarrow$ Client Local Offline Fallback.
* **Đặt phòng nhanh 1 chạm:** Tự động tạo thẻ xem trước và điều hướng thẳng sang thanh toán MoMo / đồng bộ Google Calendar.

---

## 📊 2. Bảng So sánh Hiệu năng Mô hình (Benchmark Comparison Matrix)

| Chỉ số Đánh giá | YOLO11n Stock COCO | **YOLO11-IndoorCrowd (Dự án)** | ONNX Runtime Web (Client Edge) |
| :--- | :---: | :---: | :---: |
| **Loại bài toán (Task)** | Object Detection (80 classes) | **Pure Person Detection (1 class)** | Pure Person Detection (WASM SIMD) |
| **Tập dữ liệu huấn luyện** | COCO 2017 (Tổng quát) | **IndoorCrowd (Giảng đường, Coworking, Phòng họp)** | IndoorCrowd (Quantized / FP32) |
| **Box Precision ($P$)** | 78.4% | **89.83%** | 88.5% |
| **Box Recall ($R$)** | 59.2% | **66.98%** | 65.4% |
| **Box mAP@0.5** | 61.3% | **77.62%** | 75.8% |
| **Box mAP@0.50:0.95** | 38.5% | **52.06%** | 50.9% |
| **Inference Latency** | ~22 ms (CUDA) | **~18–25 ms (RTX 3050 CUDA)** | ~45–60 ms (Browser CPU/GPU) |
| **Trọng số Model Size** | 5.6 MB | **5.2 MB (`best.pt`)** | **9.4 MB (`.onnx`)** |
| **Cơ chế chống gộp người** | Greedy NMS ($0.45$) | **Anatomy IoS NMS + Face Anchors** | Dual NMS + Virtual Zoom Letterbox |
| **Yêu cầu phần cứng** | CUDA GPU | **CUDA GPU hoặc CPU i5+** | **Không cần GPU (Chạy mọi trình duyệt)** |

---

## ✨ 3. Ma trận tính năng cốt lõi (Core Feature Matrix)

### 🌐 PHẦN 1: CỔNG NGƯỜI DÙNG (USER PORTAL)

| Phân hệ / Màn hình | Tính năng nổi bật & Công nghệ hiện thực |
| :--- | :--- |
| **🏠 Trang chủ & Tìm kiếm Không gian (Homepage)** | • Hero Banner flycam không gian đô thị kết hợp thanh tìm kiếm thông minh bo góc `rounded-full`.<br>• Bộ lọc nhu cầu đa tiêu chí: ngày thuê, khung giờ, sức chứa và trang thiết bị.<br>• Lưới thẻ listing không gian cho thuê: giá giờ/ngày, huy hiệu thanh toán MoMo QR, sức chứa m², chip tiện ích, trạng thái phòng (`available` / `in-use` / `reserved` / `maintenance`), đánh giá sao và nút lưu yêu thích.<br>• Chân trang Deep Navy tích hợp Đăng ký bản tin, Google reCAPTCHA và định vị trụ sở. |
| **🏨 Trang Chi tiết Không gian Toàn diện (Full-Page Airbnb-style `/spaces/:id`)** | • Giao diện chuẩn trải nghiệm Airbnb: Hero banner ảnh HD kèm huy hiệu tầng/tòa nhà, thông tin mô tả chi tiết và tiện nghi nổi bật.<br>• **Thẻ đặt phòng cố định (Sticky Booking Card):** Neo nổi bên phải màn hình khi cuộn trang, tự động tính tổng tiền theo giờ ($P = \text{Đơn giá} \times \text{Số giờ} + \text{Phí}$), tích hợp cổng thanh toán MoMo và nút tạo sự kiện tự động trên **Google Calendar**.<br>• **Phân hệ Đánh giá Đa chiều (Review Ecosystem):** Bảng phân bổ sao 1–5★, danh sách nhận xét thực tế kèm nhãn *Khách đã trải nghiệm (Verified Guest)* và phản hồi của quản trị viên.<br>• **Đề xuất Không gian tương tự (Similar Spaces Carousel):** Tự động gợi ý các không gian cùng tòa nhà/phân khúc giúp khách hàng chuyển đổi mượt mà. |
| **💬 Trợ lý Chatbot AI 1 chạm (Gemini NLP Assistant)** | • **Lõi AI & RAG:** Mô hình Google Gemini Flash kết hợp kỹ thuật Context-RAG (truy xuất dữ liệu phòng từ MongoDB) và ràng buộc JSON Structured Outputs.<br>• **Hiểu ngôn ngữ tự nhiên:** Bóc tách thực thể (sức chứa, tầm giá, mục đích: phòng họp, hội trường, làm việc nhóm, focus pod).<br>• **Kiến trúc chịu lỗi 3 tầng (Circuit Breaker):** Cloud Gemini API $\rightarrow$ Server Heuristics Regex Engine ($<5\text{ms}$) $\rightarrow$ Client Offline Fallback.<br>• **Đặt phòng nhanh 1 chạm:** Tự động tạo thẻ xem trước và điều hướng thẳng sang xác nhận thanh toán chỉ với 1 lượt bấm. |
| **🗺️ Khám phá & Bản đồ Không gian (Space Discovery)** | • Bản đồ tương tác định vị các không gian đang niêm yết trên sàn kèm trạng thái chấm màu thời gian thực.<br>• Thanh lọc hợp nhất: từ khóa tìm kiếm, dropdown phân loại không gian, lọc trạng thái và sắp xếp theo độ phổ biến.<br>• Lưới kết quả tức thời, empty-state khi không khớp bộ lọc, phím tắt đối chiếu Google Calendar và điều hướng nhanh sang trang chi tiết. |
| **📋 Lịch sử Đặt chỗ (Booking History Hub)** | • Banner gradient Electric Cyan hiển thị bộ 3 chỉ số: Tổng số đơn, Đang hoạt động, Đã hoàn tất.<br>• Thẻ đơn thuê thông minh: Mã đặt chỗ, vị trí không gian, khung giờ thuê, mục đích sử dụng, nút xem **Vé QR Check-in**, phím tắt đồng bộ Google Calendar và hủy đơn. |
| **🚀 Về chúng tôi (About Us - Storytelling)** | • Trục kể chuyện 4 chương tương tác: Nghịch lý lãng phí công suất mặt bằng (01), Mô hình sàn Marketplace B2B (02), Thị giác máy tính AI Occupancy Detection (03) và Tầm nhìn chia sẻ không gian làm việc tương lai (04). |
| **🔐 Đăng nhập & Xác thực (SSO Portal)** | • Bố cục Split-Screen: Cột trái Deep Navy Cinematic Hero, cột phải Form đăng nhập thẻ trắng thanh lịch.<br>• Bộ chuyển cổng truy cập (Portal Switcher): **Khách thuê / Doanh nghiệp** và **Đối tác sở hữu không gian (Host)**.<br>• Xác thực Google OAuth 2.0 & SSO đa tài khoản, tự động khởi tạo hồ sơ và phân quyền chính xác theo vai trò (Customer / Host / Platform Admin). |

---

### 💼 PHẦN 2: KÊNH NGƯỜI BÁN & QUẢN TRỊ (SELLER CENTER & ADMIN)

Hệ thống Seller Center bao gồm trọn bộ **8 tab nghiệp vụ hoàn chỉnh** đáp ứng mô hình thương mại hóa không gian cho đối tác chủ gian hàng:

| Tab Nghiệp vụ | Mã quy tắc | Mô tả chi tiết & Công nghệ tích hợp |
| :--- | :---: | :--- |
| **1. Tổng quan & Doanh thu** | F01–F08 | Dashboard Bento Grid 4 KPI: Doanh thu (+24.5%), đơn chờ duyệt, tỷ lệ lấp đầy (78.4%), listing niêm yết; Biểu đồ thanh tiến độ hiệu suất phân khu thời gian thực và widget duyệt nhanh. |
| **2. Quản lý Đơn thuê (Booking Orders)** | F10–F15 | Data Table đa tiêu chí quản lý toàn bộ đơn đặt thuê: Mã đơn, Khách thuê, Không gian, Khung giờ, Cảnh báo trùng lịch, Thao tác phê duyệt hoặc từ chối đơn hàng. |
| **3. Xử lý Vi phạm & Hủy slot (No-Show)** | F21–F23, F38 | Cơ chế tự động rà quét chu kỳ 5 phút, ngưỡng vắng mặt 15 phút (`away_warning_minutes`). Hàng thẻ ngoại lệ hiển thị số phút vắng mặt, badge cảnh báo cấp bách cùng nút can thiệp: *Đã quay lại* hoặc *Thu hồi phòng sớm*. |
| **4. Trạm Check-in Gian hàng (Kiosk Mode)** | F09, F38 | Trạm Kiosk điểm danh sự hiện diện vật lý: Khung ngắm Camera trực tiếp quét mã QR trên vé khách thuê, tích hợp máy quét mã vạch USB cầm tay, tự động chuyển trạng thái phòng sang `IN_USE` loại bỏ nguy cơ No-show. |
| **5. Không gian & Bảng giá niêm yết** | F25–F30 | Lưới thẻ không gian cho thuê thương mại: Quản lý giá giờ/ngày, sức chứa, thời gian hủy tự động, danh mục trang thiết bị và công tắc bật/tắt chế độ bảo trì (`MAINTENANCE`). |
| **6. Khách thuê & Nhân viên gian hàng** | F31–F33 | Bảng quản lý danh mục tài khoản đối tác: Phân cấp vai trò rõ ràng giữa Chủ Gian Hàng (`Host`), Nhân viên Vận hành và Khách thuê Space; quản lý trạng thái tài khoản (*Hoạt động* / *Tạm khóa*). |
| **7. Lịch sử Giao dịch & Nhật ký (Audit Logs)** | F34 | Ghi nhận toàn bộ vết kiểm toán hệ thống bất biến (Immutable Audit Trail): `APPROVE_BOOKING`, `AUTO_CHECKOUT_TRIGGERED`, `SPACE_MAINTENANCE_LOCK`, `USER_ROLE_UPDATED` kèm Actor, Timestamp và Severity Level. |
| **8. Giám sát Sĩ số IoT YOLO11 & Phụ phí Quá giờ** | F38 | • **Mô hình YOLO11-IndoorCrowd:** Nhận diện người chính xác theo thời gian thực trực tiếp trên WebAssembly (WASM SIMD) hoặc GPU Backend, loại bỏ hoàn toàn segmentation dư thừa.<br>• **Anti-Crowding NMS & Anatomy IoS:** Bảo toàn $100\%$ đối tượng khi ngồi san sát nhau và giải quyết triệt để lỗi phân mảnh hộp khi đứng gần.<br>• **Tự động tính phụ phí quá giờ (Overtime Dynamic Billing):** Tự động phát hiện khách chưa checkout khi đã qua giờ kết thúc. Nếu AI nhận diện vẫn còn người vượt số phút ân hạn (`graceMinutes`), hệ thống tự tính phụ phí theo block 30 phút theo bảng giá riêng của từng Space.<br>• **Cảnh báo vượt sĩ số & Trả phòng sớm:** Đối chiếu tức thời sĩ số thực tế với vé đặt chỗ, tự động đề xuất giải phóng phòng tái bán khi khách về sớm. |

---

### 📱 PHẦN 3: CAMERA GIÁM SÁT DI ĐỘNG P2P (MOBILE CCTV LENS `/cctv-lens`)

Biến bất kỳ điện thoại thông minh (iOS / Android) thành một camera giám sát an ninh thông minh truyền hình ảnh thời gian thực về Dashboard quản trị:
* **Kết nối P2P WebRTC (PeerJS):** Truyền phát luồng video độ trễ cực thấp (Sub-second latency) trực tiếp giữa điện thoại và máy tính mà không qua trung gian lưu trữ video đám mây, bảo mật quyền riêng tư tuyệt đối.
* **Bộ điều khiển Zoom Đa tầng (Multi-tier Zoom Controller):**
  * Nút chuyển đổi nhanh các mức phóng to / thu nhỏ: **`0.5x`** (Góc siêu rộng Ultra-Wide), **`1x`** (Tiêu chuẩn), **`2x`**, **`3x`**.
  * Cử chỉ cảm ứng hai ngón tay (**Pinch-to-Zoom**) mượt mà trên màn hình cảm ứng điện thoại.
  * Tự động ưu tiên **Hardware Optical/Sensor Zoom** qua API `MediaTrackConstraints.zoom` và tự kích hoạt **Digital Viewport Zoom** nếu thiết bị không hỗ trợ phần cứng.
* **Tiện ích Hiện trường:** Chuyển đổi camera trước/sau (Flip Camera), bật/tắt đèn Flash trợ sáng và hiển thị chỉ số FPS/Độ phân giải luồng hình ảnh.

---

## 🎨 4. Hệ sinh thái Thiết kế Figma & Google Stitch

Toàn bộ hệ thống giao diện UEL Space được thiết kế vector hóa chuẩn xác 100% tỉ lệ Desktop HD (`2560 x 2048`), lưu trữ và đồng bộ trên **Google Stitch Canvas**:

> 🔗 **Canvas Dự án Google Stitch Chính thức:** [https://stitch.withgoogle.com/projects/15917314834578745602](https://stitch.withgoogle.com/projects/15917314834578745602)  
> 📑 **Tài liệu Manifest chi tiết:** [FIGMA_MANIFEST.md](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/design-system/uel-space/FIGMA_MANIFEST.md)

### 📌 Danh mục 13 Màn hình Vector Chuẩn Thiết kế:
1. **Trang chủ Toàn diện (Homepage Full):** ID `828b17ce1861452d97209d2fe3732b2e` (2560 x 4780 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1UCNEThg4yuIgo3cT0VvnwKpOs8H_QtD1HF8jeGaq_Fp8N740-5Qbh6ZcIOr9S0T0LMnartt1zXEzxjfHI5ldlRDOivn4H5ArLOX7ggdAHQZySTICPxYluJNvfPcGuhah7n_3iy_g4Y7b2BJpRJuUOb7FdW6EjUzcolukkt9dMFL9UsQU6ry2riP1VPw4LLhWDuCTXMqKvuhJcwoos_jHgK7ksbtPlqYKHWHuBvz1TTJAQLdzU0zQ67-M4)
2. **Khám phá & Bản đồ Không gian (Space Discovery):** ID `2058a318b6d34ff2bc6dd7fa61c077d3` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1WCVpvMRJlR3LAYT6tyr_9sFst93Pcj5p0RGr6-vyOiOODB8eyLxK-px_SwRIC5COFxLezWX44QIk3KOGa0WXIwslmJq6tg-tovXXiq6q-HKKnRzAkCTG2t1wVB_LeaUfDlXRceEc7x1iGuXCKxV6gAm-Ij2uPrx-fxmXK_5_RAyEjkFyqLOJxxnDTLQt_IbG-B84uWXZcfstMAFCrcABim9Ncz5jbmmYM2iBG2E6CqyhmvsawuKTOZoUE9)
3. **Lịch sử đặt chỗ của bạn (Booking History):** ID `3ae4c615929448c88f71840468d7dcd8` (2560 x 3470 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1WH5s031ZPgwhfZRGhwkuqpYzoo4oRqhdNXR7r8Yz96FlcowNeVuq_Js5l8aGc3Q2q-mK3DXgKLhsPElX3fMJ2nSz7bEOk3l-XYWy-d4MufnirnPU5UeOduNsLpkOhCj3kz2o0A6EJMItSiMeJleyrtUphhmZovmMyq3WWFAxNnvhZVNybszeh0NY-_KoleSBm9znd_7lr71badaVP7Wk60icKBm2SbUsqDXdC8cMkQ4azNRb6gCbU0-wQc)
4. **Về chúng tôi (About Us - Hành trình kiến tạo):** ID `a778140c646d416f8d4a9e4b961b4542` (2560 x 9468 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1XScs4fNZFYXe5BIVdB3HDxd60ZkiWTfCdWEjQHbWaGvz7K1HQ8fYD158ZQ8sa9m4fJhUU4Q6drwMb10WJsy6an7gABjpK5I5pu1EimO_KFrv3ObfN1AgTHCeot3qUgo3LLOiRLxEWfJycIP0-5IvkhZpVQDWJdFJ3AgoTxL418K-w55nniaIEaGe85D1rinUQhLGh_mLI5HDgS_KdJkcEbTKSzMWcKd7CgKQPGJBKw17TQV-Ym7vgIcCQD)
5. **Màn hình Đăng nhập (Authentication Portal):** ID `73dc9c2a61324c2db2b9919ed1d5d769` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1Uc7tyG1lyoH2iWDQabRfUNPTgs3nYtzgtod1fiUXXNsLddv6fkYpTbciu9gIzD48Pdl4x3hYQelFVHhXWx3baQznEqKAMNGsv9vmRRH2R5d3cjXK8mZdT-vJ20rLarBDnGp3YdGd0vDoujGjcOXGHxe_Dz5aT4SPlR3J2PoYGbdchrwg0pCVzmsqB3AoRXTAG60HvKhWnTldQ8kv4OZ_9FpmwhCuNYaoQLb2w9nqeudE_Fgu-oJK5TSMHG)
6. **Seller Center - Tab 1 (Tổng quan & Doanh thu):** ID `2ae2cd1a656541e58f97aefc4911348a` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1UtR-iL36_KHZRPA20viy5FJ60ufMhWS-OekTQYwMRnoUqGny5UvyMdtR76oSCuO8sdiho8AyGOkuNtBm1aSWa7nLZzt9iyL94Vr6wedIRZRDhVcktS2I6oh-WkV9JlqRYya5pKAMLnPIAg29yU2JwQwzCJRircQ1MGpe7REKJ-CZ9a9CW6VtgpRC-szU26Hj2-oMe8Ihl-xNtjRWq7q6FfsTj2xhCj0mLm94tuXBHNrOI6tibsHEmyw6D_)
7. **Seller Center - Tab 2 (Quản lý Đơn thuê):** ID `48e0e8db4e2b428787673928ea5630a7` (2560 x 2872 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1VlzsMBhmgJEyHYiXbQqT2WoO7rX8vc0ssV0XIONZgH8Y0KifftABXeF8ICosRuT28d5BKsi_oDUAzyN1y4mws6eK23nzO5El_cTS3dBJBINL9iNIer54BpQt1KJ6zh3UUMt9U853mVMYdBoPGSx8SQ5nTFYyRxfW3yI6tGxeGfcg0FA9fg6bgynSwx5MvtboxwSVsv4Eg_v9GkCHIHIgAFc9VDyP9-pt78EWcjoWB1-SHw0BbFvqFun83u)
8. **Seller Center - Tab 3 (Xử lý Vi phạm & Hủy slot):** ID `173d05ebed0c43f9b82f1b360978576f` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1WbLuNhT-tJJvwkQg4Klj2SqRQKZfIB5L53sh558Kso3KH_dhlcd3rd4IvNY0jijw9eUCMBbuAAKMlLMxMzBal1Fhu5NzgD8Zu7Uzsa0qpJTyWnORK_RKF_-33RV2CmGAI0cjswgaGiGR0hcdyfuOsHCGS3IJaJATltIZ6ZKsNxHiPV5EAKrE_33LwklYNNRbsnhLMvBIhvSVLLFgLabhSrAvnv-HT7vGWD5vxxKWBcu4Nb6XXZtSHV5SY)
9. **Seller Center - Tab 4 (Trạm Quét QR & Check-in Kiosk):** ID `da8c9d26d3804fadb9233fc0d2c58cbd` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1UJkKIDTlVdZVoGEf-_h5UWs8xtoVLUTFAdFjvwK7RTSpnN4-coLGZJpD_k02H_EUZr8pfDfEvk4pAY7TYfkZNbB8EUaNH_ieWx6TAu7W4ehFsc-5fd30gYpJBlw5EIfdo-v1zZWwf4xk9dpsmbUE7Jx0_0cY334O1rAUo0-UheuSnCCW5S4HEKzWhVo49KUowBTMl-b-sjc6tlrzgRHelbxZElrwZr6UNroe253eY0X7g982AFMUbd3NKU)
10. **Seller Center - Tab 5 (Không gian & Bảng giá thuê):** ID `271457b1d2914d5b8d71217b9b626fe3` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1X-7kQ2e81hQvrQMNyOghif1pbGDfBwpwyGC05aAQljB4hOj-UypEgDqKK7a-yoVqSj6ZZ5N1d8nhXvc2qkpyCAkVNU-UT2L0_5ZDtKRkg8Dlo4Ihu2LoAlcVPydnvjJBw3Etsb9X7yiqUYtkjcoc_nJYCSdPZfekQ1ljERlliIESmVsXE4qrYqAUXQtKP4wf7WfHEkTj9XqtlMO9x_DuhSuTRIOJP5L2YFgrX8-xSvOyGU-_gT34wvFq67)
11. **Seller Center - Tab 6 (Khách thuê & Nhân viên gian hàng):** ID `db918d248fec4d78a868726189c203bb` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1WwejqmccIP8N14VtA1sGLUkIjKev5VBeJX9PeIqzsoGJsnWd_OTE1LyFHvd1lnyevc-TF8UbQ7u3Jg3IL7QfRSel1jpT3R5zGI8thvG0VdayfbkZN1LYfmpD-j1h6vysQY3fQ2ToFEBUF1NGGeEpp34yxukgBYf4SxTD5s-waeOdNIlb5mz6TMpbS-EJ4m-BR1rSOoBMGhIIMckyT5ofGnzzTxgjygSQw_P3ZFLJmghL9U_ukiLH-xG8EG)
12. **Seller Center - Tab 7 (Lịch sử Giao dịch & Nhật ký Audit Logs):** ID `f95c0ab0daf6487ca3435c2527938414` (2560 x 2048 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1V7FqJDOoNED9MR63q6-WZnpir-XFQB0j_6_XeNxgscf3t1yip0Q4o7IcTWkXagi0wD5JRi4PwrsisxgsvkFD34BQ2KjRZYzqfv7NlQSyaqH2AJAi4lgd_49PesgyvuE4F6XuqiQfRdFdEqj-Sbl-rmKT9gVV45IqCe0JilFl21TnRUyg5L-o3eekSsjvLdokW0DzVTpvNqffVi5NOIXvwk5P9ThGyF8BI-9RZ3KQAO-yXSMJe2ga9FcQjh)
13. **Seller Center - Tab 8 (Giám sát Sĩ số IoT AI & Chống Gian lận):** ID `24d6b73300474913b320a7454652c004` (2560 x 3002 px) - [Xem Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1VG0c3e-saSKAfVzS9omq6Dj1Q4OYncFXhfw1UV5VgwCWoveALIDkalK1sgKlo2uo_IaCXujfsvZFgKcM8uqVMAXsuIvlMhzofFd7nA0AA2NecldstE5vQYiKO7EgZksqLrgHwq2DWzXiEMsrn60Hwi7oBRvFsmbVzo25y7IE1y8A2EPpGI1olrkn-l1ZRaieRGHEwwGLPisaQ0g-ImAjIKb4gf-F2fy2KNXjC4sluGhguJQvfETvMao2_t)

---

## 📊 5. Sơ đồ Thiết kế Hệ thống & Quy trình (System Diagrams)

Hệ thống được mô hình hóa theo các chuẩn kỹ nghệ phần mềm chuyên nghiệp:

* 🔄 **Sơ đồ Quy trình Nghiệp vụ Marketplace (BPMN 2.0):** [Marketplace_Space_BPMN_2_0.drawio](Diagram/BPMN/Campus_Space_BPMN_2_0_Lucid.drawio) (Tương thích hoàn toàn với Camunda & Lucidchart - mô hình hóa trọn vòng đời: Niêm yết, Đặt chỗ, Thanh toán, QR Check-in và Giám sát AI).
* 🗄️ **Mô hình Dữ liệu Sàn Thương mại (ERD - Database Schema):** [Marketplace_Space_ERD.dbml](Diagram/ERD/Campus_Space_ERD.dbml) & [ERD Documentation](Diagram/ERD/Readme.md) (Chuẩn hóa Normalization 3NF, kiến trúc Multi-tenancy phân tách giữa các Host, Soft Deletion, Optimistic Locking).
* 🎯 **Sơ đồ Ca Sử Dụng Sàn (Use Case Diagram):** [Marketplace_Space_UseCase.drawio](Diagram/Use_case/Campus_Space_UseCase_LucidCompatible.drawio) (Phân định rõ 3 tác tử: Khách hàng/Doanh nghiệp thuê, Chủ sở hữu không gian và Quản trị sàn).

---

## 🏗️ 6. Kiến trúc kỹ thuật & Cấu trúc mã nguồn

```
UEL_Space/
├── frontend/                     # Ứng dụng Single Page Application (Angular 22.2 Standalone + Tailwind)
│   ├── public/models/            # Trọng số Edge AI chính thức (yolo11n_indoor_crowd.onnx - 9.4MB)
│   ├── src/app/components/       # Component Modules
│   │   ├── home/                 # Trang chủ sàn Marketplace
│   │   ├── space-detail/         # Trang Chi tiết không gian chuẩn Airbnb (/spaces/:id)
│   │   ├── seller-dashboard/     # Kênh Quản trị & Giám sát AI 8 tab nghiệp vụ
│   │   ├── cctv-lens/            # Camera di động WebRTC P2P kèm bộ điều khiển Zoom (0.5x - 3x)
│   │   ├── map/                  # Khám phá Bản đồ Không gian
│   │   ├── booking-history/      # Quản lý Đơn thuê & Vé QR Code
│   │   └── common/chatbot/       # Widget Trợ lý Khách hàng Chatbot AI 1 chạm
│   ├── src/app/services/         # Client Services (Auth, Space, Booking, Chatbot, Google Calendar, WebRTC)
│   └── src/app/i18n/             # Bộ từ điển song ngữ (Tiếng Việt / English)
├── my-server/                    # RESTful API Backend Server (Node.js 20+ & Express.js 4.19)
│   ├── src/modules/              # Kiến trúc phân tầng Layered Modules (Controller - Service - Repo)
│   │   ├── auth/                 # Google OAuth 2.0 & Quản lý phiên Session
│   │   ├── spaces/               # Nghiệp vụ niêm yết không gian cho thuê, phân loại, giá theo giờ/ngày
│   │   ├── bookings/             # Xử lý đơn thuê, đối soát lịch và chống trùng phòng
│   │   ├── chatbot/              # Gemini AI Service (Context-RAG, Structured Outputs & Fallback)
│   │   ├── occupancy/            # Nhật ký kiểm đếm sĩ số và kết nối IoT AI
│   │   └── audit/                # Lưu vết kiểm toán hoạt động bất biến (F34)
│   ├── src/ai-service/           # Microservice Python AI YOLO11 (yolo_service.py + best.pt 5.2MB)
│   ├── src/seed/                 # Bộ script nạp dữ liệu từ Hugging Face & Unsplash Dataset
│   └── index.js                  # Điểm khởi chạy Express Server chính
├── scripts/                      # Bộ công cụ huấn luyện & xuất khẩu mô hình AI
│   ├── prepare_indoor_crowd_yolo11.py # Chuẩn hóa tập dữ liệu IndoorCrowd (Train/Val/Test)
│   └── train_yolo11_indoor_crowd.py   # Huấn luyện fine-tune YOLO11 Detection 20 epochs
├── design-system/                # Hệ thống thiết kế & Tài liệu kết nối Figma / Stitch
├── Diagram/                      # Sơ đồ thiết kế chuẩn kỹ nghệ phần mềm (BPMN, ERD, Use Case)
└── Brand_Guideline/              # Tiêu chuẩn thương hiệu & Design Specifications
```

---

## 🚀 7. Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### Yêu cầu tiên quyết (Prerequisites)
* **Node.js**: Phiên bản 20.x trở lên.
* **npm**: Phiên bản 10.x trở lên.
* **Python**: Phiên bản 3.10 trở lên (khuyên dùng kèm card đồ họa NVIDIA CUDA để kích hoạt Turbo GPU).
* **MongoDB**: Tài khoản kết nối MongoDB Atlas hoặc máy chủ MongoDB cục bộ.

---

### Bước 1: Khởi động Backend API Server (`my-server`)

Mở terminal tại thư mục gốc:

```powershell
# Di chuyển vào thư mục backend
cd my-server

# Cài đặt các thư viện phụ thuộc
npm install

# Nạp dữ liệu mẫu 100+ phòng, người dùng & đơn thuê lên MongoDB Atlas (chạy 1 lần đầu)
npm run seed

# Khởi chạy máy chủ phát triển Backend (Cổng mặc định: http://localhost:3000)
npm run dev
```

---

### Bước 2: Khởi động Python YOLO11 AI Microservice (Tùy chọn GPU Server)

Mở một cửa sổ terminal mới:

```powershell
cd my-server

# Khởi chạy microservice YOLO11 Detection CUDA (Cổng mặc định: http://localhost:5001)
npm run ai:start
```

> 🌐 **Chia sẻ GPU Server qua Cloudflare Tunnel (Cho phép Client từ xa truy cập GPU nội bộ):**
> ```powershell
> npm run ai:tunnel
> ```
> *Lệnh tự động thiết lập đường hầm bảo mật qua giao thức **HTTP/2 (Port 443 TCP)**, tương thích 100% với các nhà mạng dân dụng tại Việt Nam (bỏ qua chặn cổng UDP 7844).*

---

### Bước 3: Khởi động Frontend Client (`frontend`)

Mở một cửa sổ terminal mới:

```powershell
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các thư viện Frontend
npm install

# Khởi chạy máy chủ phát triển Angular
npm start
```

Truy cập ứng dụng tại: **`http://localhost:4200`**

---

## 🔑 8. Bảng Tài khoản Thử nghiệm (Test Accounts Matrix)

Hệ thống xác thực qua **Google OAuth 2.0** và đã nạp sẵn các tài khoản thử nghiệm theo phân quyền sàn:

| Loại tài khoản | Địa chỉ Email | Vai trò (Role) | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên Sàn (Platform Admin)** | `admin@uel.edu.vn` | `ADMIN` | Quản trị toàn hệ thống sàn, phê duyệt đối tác & không gian niêm yết, cấu hình vận hành, giám sát nhật ký Audit Log |
| **Khách hàng Doanh nghiệp (Enterprise)** | `chittk@uel.edu.vn` | `ENTERPRISE` | Đặt phòng họp hội nghị cao cấp, thuê hội trường tổ chức sự kiện, quản lý lịch sự kiện và thanh toán doanh nghiệp |
| **Đơn vị Tổ chức Sự kiện (Event Organizer)** | `annv@uel.edu.vn` | `ORGANIZER` | Đặt không gian workshop dài hạn, điều phối khách tham dự, nhận hóa đơn điện tử và thanh toán MoMo QR |
| **Khách hàng Cá nhân (Pro Member / Freelancer)** | `giangnntk24411@st.uel.edu.vn` | `CUSTOMER` | Thuê Hot Desk Co-working, đặt phòng họp nhóm 1 chạm qua Chatbot AI, nhận vé điện tử QR Check-in tức thời |
| **Khách thuê Linh hoạt (Flexible Booker)** | `ngocttb21411@st.uel.edu.vn` | `CUSTOMER` | Đặt chỗ làm việc theo giờ, tìm kiếm không gian qua bản đồ tương tác và quản lý lịch sử đơn thuê |

> 💡 **Kênh Chủ Không gian (Seller Center):** Truy cập hồ sơ Chủ gian hàng đối tác (`seller.partner@uelspace.vn` hoặc tài khoản Host) để quản lý toàn diện 8 tab nghiệp vụ: bảng giá thuê, duyệt đơn, trạm Kiosk quét vé QR Check-in, giám sát sĩ số YOLO11 AI thời gian thực và quản lý phụ phí quá giờ.

---

## 🌐 9. Triển khai Thực tế & Trải nghiệm Trực tiếp (Live Deployment)

* 🚀 **Cổng Trải nghiệm Web (Vercel Production):** [https://uelspace-tan.vercel.app](https://uelspace-tan.vercel.app)
* ⚡ **AI Backend Microservice:** Port `5001` (YOLO11-IndoorCrowd inference `http://127.0.0.1:5001/detect`)
* 📱 **Camera CCTV Di động P2P:** Đường dẫn trực tiếp `/cctv-lens` (Tích hợp WebRTC PeerJS + Floating Zoom 0.5x–3x)

---

<p align="center">
  <strong>© 2026 UEL SPACE PLATFORM · HỆ THỐNG SÀN THƯƠNG MẠI ĐIỆN TỬ KHÔNG GIAN THÔNG MINH AI</strong><br>
  <em>Giải pháp Trí tuệ Nhân tạo Toàn diện trong Quản trị Mặt bằng & Tự động hóa Vận hành Thương mại</em>
</p>
