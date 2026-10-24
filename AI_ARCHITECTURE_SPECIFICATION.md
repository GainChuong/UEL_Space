# 🤖 BÁO CÁO KỸ THUẬT: HỆ THỐNG AI, DỮ LIỆU, MÔ HÌNH ML/DL & THÔNG SỐ VẬN HÀNH (UEL SPACE)

> **Tài liệu tham chiếu kỹ thuật toàn diện:** Phân tích chi tiết về nguồn dữ liệu thực tế, các kiến trúc mô hình học máy (Machine Learning) & học sâu (Deep Learning), các tầng lọc dữ liệu (Filtering), cùng bảng đối soát thông số kỹ thuật (Hyperparameters) và cơ sở lý luận kỹ thuật.

---

## 📌 MỤC LỤC
1. [Tổng quan Kiến trúc AI Hybrid đa tầng](#1-tổng-quan-kiến-trúc-ai-hybrid-đa-tầng)
2. [Chi tiết Dữ liệu Hệ thống đang sử dụng](#2-chi-tiết-dữ-liệu-hệ-thống-đang-sử-dụng)
3. [Các mô hình Machine Learning & Deep Learning cụ thể](#3-các-mô-hình-machine-learning--deep-learning-cụ-thể)
4. [Các tầng lọc dữ liệu (Filtering Mechanism)](#4-các-tầng-lọc-dữ-liệu-filtering-mechanism)
5. [Bảng cấu hình thông số kỹ thuật & Lý do thiết lập](#5-bảng-cấu-hình-thông-số-kỹ-thuật--lý-do-thiết-lập)
6. [Sơ đồ Luồng xử lý & Cơ chế Chịu lỗi (Circuit Breaker)](#6-sơ-đồ-luồng-xử-lý--cơ-chế-chịu-lỗi-circuit-breaker)

---

## 1. Tổng quan Kiến trúc AI Hybrid đa tầng

Hệ thống **UEL Space** triển khai kiến trúc AI kết hợp giữa **Cloud AI, Server Edge Microservice và Client Edge on-device**:

```
                                      HỆ SINH THÁI AI UEL SPACE
                                                  │
          ┌───────────────────────────────────────┼───────────────────────────────────────┐
          ▼                                       ▼                                       ▼
   [Cloud Generative AI]                 [Server Vision AI]                      [Client Edge AI]
   • Google Gemini Flash 3.8             • Ultralytics YOLOv11 Detection         • TensorFlow.js (WebGL/CPU)
   • Context-RAG từ MongoDB              • Ultralytics YOLOv11 Pose              • MobileNetV2 COCO-SSD
   • JSON Structured Outputs             • Anti-Crowding NMS & Fusion            • Hardware FaceDetector API
   • Circuit Breaker Fallback            • Microservice FastAPI (Port 5001)      • jsQR Kiosk Scanner
```

---

## 2. Chi tiết Dữ liệu Hệ thống đang sử dụng

### 2.1. Dữ liệu ảnh thực nghiệm Không gian (Big Datasets)
1. **Hugging Face Dataset (`FatimaSaadNaik/indoor-scenes-dataset`)**:
   - **Tập tin xử lý:** `my-server/src/seed/extract_indoor_scenes.py`
   - **Cơ chế thu thập:** Sử dụng chế độ Streaming nạp trực tiếp qua thư viện `datasets` của Hugging Face, giải mã ảnh theo nhu cầu (on-demand PIL decode) để đạt tốc độ tối đa.
   - **Số lượng & Phân bố:** 100+ ảnh không gian nội thất phân loại theo mục tiêu:
     - `meeting_room`: 16 ảnh
     - `office`: 16 ảnh
     - `auditorium`: 12 ảnh
     - `classroom`: 10 ảnh
     - `library`: 12 ảnh
     - `computerroom`: 8 ảnh
     - `studio`: 8 ảnh
     - `laboratory`: 6 ảnh
     - `lobby`: 12 ảnh
     - `coworking_lounge`: 6 ảnh
   - **Tập tin Manifest:** `my-server/src/seed/indoor_scenes_manifest.json` ghi nhận đầy đủ kích thước gốc, caption mô tả và đường dẫn lưu trữ tại `public/images/spaces/`.

2. **Unsplash Research Dataset Lite**:
   - **Tập tin xử lý:** `my-server/src/seed/filter_unsplash_spaces.py`
   - **Cơ chế:** Đọc và đối chiếu trên 25.000 ảnh từ file TSV (`photos.tsv000` và `keywords.tsv000`).
   - **Bộ lọc từ khóa mục tiêu:** `meeting room`, `office`, `modern`, `conference room`, `coworking`, `workspace`, `boardroom`, `classroom`, `study`, `library`, `auditorium`, `computer lab`, `desk`, `presentation`, `studio`.
   - **Tối ưu hình ảnh:** Tải về theo chuẩn Web-optimized HD: `?w=1200&h=800&q=85&auto=format&fit=crop` phục vụ các không gian flagship đại diện của sàn.
   - **Tập tin Manifest:** `my-server/src/seed/unsplash_spaces_manifest.json`.

3. **Tập dữ liệu 100 Không gian Listing Sàn Thương mại**:
   - **Tập tin:** `my-server/src/seed/spaces_100_dataset.json` sinh bởi `generate_100_spaces.js`.
   - Gắn kết dữ liệu ảnh với **5 Nhà cung cấp/Chủ gian hàng (Hosts/Sellers)**:
     - *Nguyễn Trần Kim Giang* (`seller-techpark` - TechPark Executive Spaces - 4.96★)
     - *Lê Hoàng Long* (`seller-innovate` - Innovate Co-working Network - 4.92★)
     - *Trần Minh Khoa* (`seller-landmark` - Landmark Convention & Event Corp - 4.94★)
     - *TS. Trịnh Thị Kim Chi* (`seller-uel` - Ban Quản trị CSVC UEL Space - 4.89★)
     - *Đỗ Thùy Linh* (`seller-creative` - Creative Hub Media Studios - 4.97★)

### 2.2. Dữ liệu Cơ sở dữ liệu MongoDB Atlas (7 Phân hệ theo ERD 3NF)
Được chuẩn hóa và nạp qua `my-server/src/seed/seed.js`:
- **Identity Module**: `roles` (Student, Lecturer, Manager, Admin), `users` (thông tin định danh, tài khoản Google OAuth 2.0).
- **Organization Module**: `organizations`, `memberships`.
- **Catalog Module**: `buildings`, `floors`, `categories`, `equipment` (danh mục trang thiết bị: Màn hình 4K, micro đa hướng, Cisco Telepresence,...), `spaces`.
- **Booking & Schedule Module**: `bookings`, `schedules` (lịch đặt trước, chống trùng phòng).
- **Usage & Presence Module**: `usage_sessions`, `presence_records`, `release_cases`.
- **Monitoring Module**: `occupancy_records` (lịch sử đếm sĩ số của AI), `notifications`.
- **Administration Module**: `incidents`, `feedback`, `audit_logs` (vết kiểm toán hoạt động bất biến).

### 2.3. Dữ liệu đầu vào Camera Video Stream thời gian thực
- Luồng video trực tiếp từ thiết bị thông qua WebRTC API (`navigator.mediaDevices.getUserMedia`) với kích thước luồng $1280 \times 720\text{px}$.
- Trước khi gửi lên máy chủ AI, khung hình được vẽ lên Offscreen Canvas, scale về kích thước tối đa 640px chiều rộng và mã hóa chuỗi Base64 JPEG ở mức nén 72%.

---

## 3. Các mô hình Machine Learning & Deep Learning cụ thể

| Mô hình / Công nghệ | Vị trí thực thi | Kiến trúc / Nền tảng | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- |
| **YOLOv11 Nano Detection (`yolo11n.pt`)** | Server Python FastAPI (`my-server/src/ai-service/yolo_service.py`) | CNN SOTA Object Detection (Ultralytics) | Nhận diện đối tượng người (`classes=[0]`) với tốc độ suy luận siêu tốc mili-giây. |
| **YOLOv11 Nano Pose (`yolo11n-pose.pt`)** | Server Python FastAPI (`my-server/src/ai-service/yolo_service.py`) | 17 Keypoints Human Pose Estimation (Ultralytics) | Bắt trọn 17 khớp xương người, phát hiện các tư thế khó (người nằm sofa, cúi gục đầu làm việc, che mặt). |
| **COCO-SSD Lite (`lite_mobilenet_v2`)** | Client Trình duyệt Angular (`frontend/src/app/components/admin/admin.ts`) | MobileNetV2 + Single Shot MultiBox Detector qua TensorFlow.js (`@tensorflow/tfjs`) | Mô hình Client Edge AI dự phòng, chạy trực tiếp trên GPU WebGL hoặc CPU khi mất kết nối máy chủ AI. |
| **Hardware `FaceDetector` API** | Client Trình duyệt Angular (`frontend/src/app/components/admin/admin.ts`) | Shape Detection API phần cứng | Phát hiện khuôn mặt khi cơ thể người bị mặt bàn họp che khuất toàn bộ thân dưới. |
| **Google Gemini Flash (`gemini-3.8-flash`)** | Backend Node.js Express (`my-server/src/modules/chatbot/gemini.service.js`) | Large Language Model (Google Generative AI REST / Interactions API) | Trợ lý Chatbot hiểu ngôn ngữ tự nhiên tiếng Việt, bóc tách thực thể (Intent & Entity) và sinh phản hồi JSON Structured Output. |
| **Adaptive Semantic Intent Cache** | Backend Node.js Express (`my-server/src/modules/chatbot/gemini.service.js`) | Continuous Intent Caching & Feedback Reinforcement (`chat_learned_intents`) | Tự động học và ghi nhớ các cặp [Nhu cầu ⟷ Không gian tối ưu]. Phục vụ khách hàng có cùng nhu cầu siêu tốc (<20ms), tự điều chỉnh trọng số khi khách click hoặc đặt phòng. |
| **Context-RAG Engine** | Backend Node.js Express (`my-server/src/modules/chatbot/gemini.service.js`) | Retrieval-Augmented Generation | Truy xuất top 15 phòng trống từ MongoDB Atlas nạp vào ngữ cảnh của Gemini để tư vấn phòng chính xác 100%. |
| **`jsqr` Engine** | Client Trình duyệt Angular (`frontend/src/app/components/admin/admin.ts`) | Binarization & Reed-Solomon Error Correction | Quét và giải mã mã QR vé điện tử tại Trạm Kiosk Check-in gian hàng. |

---

## 4. Các tầng lọc dữ liệu (Filtering Mechanism)

### 4.1. Lọc dữ liệu thô (Dataset Cleaning Filters)
- **Blacklist Filter:** Loại bỏ ảnh ngoại cảnh hoặc không thuộc môi trường làm việc thông qua danh sách loại trừ:
  ```python
  if any(bad in all_text for bad in ['cat', 'dog', 'animal', 'wedding', 'ferry', 'ocean', 'mountain', 'subway', 'vehicle', 'car', 'food', 'plate', 'dish']):
      continue
  ```
- **Category Taxonomy Filter:** Phân loại văn bản mô tả và từ khóa vào 8 danh mục phòng nghiệp vụ.
- **Deduplication Filter:** Kiểm tra `used_ids` để bảo đảm mỗi không gian niêm yết sở hữu một hình ảnh đặc trưng độc nhất.

### 4.2. Bộ lọc Thị giác máy tính (Vision Post-Processing Filters)
- **Pixel Dimension Threshold:** Hủy bỏ toàn bộ các bounding box có kích thước nhỏ hơn $8 \times 8\text{px}$ để triệt tiêu nhiễu pixel biên.
- **Class Filtering:** Chỉ giữ lại class `0` (Person) trong YOLO và class `'person'` trong COCO-SSD.
- **Aspect Ratio Lying Filter:** Phát hiện tư thế nằm dựa trên tỉ lệ hộp bao:
  $$\text{Aspect Ratio} = \frac{\text{Width}}{\text{Height}} > 1.15 \quad (\text{Detection}) \quad \text{hoặc} \quad > 1.10 \quad (\text{Pose})$$
- **Skeleton Visibility Filter:** Khớp xương được công nhận khi điểm tin cậy $conf > 0.25$, và chỉ xác nhận có khung xương người khi có ít nhất $\ge 3$ khớp xương hợp lệ.

### 4.3. Bộ lọc Hợp nhất Sĩ số Đa tầng (Anti-Crowding NMS & Fusion)
Thuật toán giải quyết triệt để lỗi kinh điển của Object Detection: **"Gộp 5 người ngồi sát nhau thành 3 người"**.
- Tính độ giao nhau trên hợp: $IoU = \frac{\text{InterArea}}{\text{UnionArea}}$.
- Tính độ giao nhau trên diện tích nhỏ hơn: $IoS = \frac{\text{InterArea}}{\min(\text{Area}_1, \text{Area}_2)}$.
- Tính khoảng cách tâm giữa 2 mục tiêu: $\text{dist} = \sqrt{(c_{1x} - c_{2x})^2 + (c_{1y} - c_{2y})^2}$.
- **Nguyên tắc gộp:** Chỉ gộp thành 1 người nếu:
  $$IoU \ge 0.55 - 0.65 \quad \text{HOẶC} \quad (IoS \ge 0.80 - 0.85 \ \land \ \text{dist} < 0.30 \times \min(W, H))$$
  *Tuyệt đối không gộp 2 người ngồi cạnh nhau nếu $\text{dist} \ge 0.35 \times \min(W, H)$.*

### 4.4. Bộ lọc Khử rung sĩ số (Temporal Debounce & Mode Filter)
- Lưu trữ 4 giá trị sĩ số gần nhất vào mảng trượt `headcountDebounceBuffer`.
- Tính **giá trị xuất hiện nhiều nhất (Statistical Mode)** trong bộ đệm để đại diện cho sĩ số hiển thị, triệt tiêu hoàn toàn hiện tượng số đếm nhấp nháy liên tục do camera đổi góc sáng.

### 4.5. Bộ lọc Tìm kiếm Không gian (Marketplace Business Filters)
Định nghĩa trong `space.service.js`:
- Lọc khoảng sức chứa: `minCapacity <= capacity <= maxCapacity`.
- Lọc diện tích: `area >= minArea`.
- Lọc theo trang thiết bị: Kiểm tra mảng thiết bị chứa chuỗi con người dùng yêu cầu (`every(...)`).
- Lọc khung giờ khả dụng: Đối soát với toàn bộ đơn đặt phòng (`bookings`) và lịch học (`schedules`) để loại bỏ các phòng đã có người đặt trong khoảng `[availableAt, endTime]`.

---

## 5. Bảng cấu hình thông số kỹ thuật & Lý do thiết lập

### 5.1. Thông số Thị giác máy tính (Computer Vision & Deep Learning)

| Thông số | Giá trị | File mã nguồn | Lý do thiết lập & Căn cứ kỹ thuật |
| :--- | :---: | :--- | :--- |
| **`confidenceThreshold` (Server Detection)** | `0.16`<br>*(High: 0.12, Normal: 0.16, Strict: 0.22)* | `yolo_service.py:82`<br>`admin.ts:2783` | **Chống bỏ sót người (False Negatives):** Camera phòng họp thường gắn từ trần cao hoặc góc xa. Khách ngồi làm việc thường cúi đầu, bị mặt bàn hoặc màn hình laptop che khuất thân dưới, khiến điểm tin cậy bị tụt xuống khoảng 0.15–0.22. Nếu để mặc định `0.25`–`0.50` của YOLO, mô hình sẽ đếm thiếu người nghiêm trọng. |
| **`pose_conf` (Server Pose)** | `max(0.12, base_conf - 0.04)` | `yolo_service.py:194` | **Bắt trọn tư thế khó:** Người nằm dài trên sofa hoặc tựa lưng gục mặt không có hình dạng hộp người tiêu chuẩn. Mô hình Pose chỉ cần nhận diện các khớp xương với ngưỡng tin cậy thấp là đủ cơ sở khẳng định có người. |
| **`Anti-Crowding IoU`** | `0.60` – `0.65` | `yolo_service.py:83`<br>`admin.ts:2579` | **Bảo toàn số lượng người ngồi cạnh nhau:** Ngưỡng IoU chuẩn của NMS (`0.45`) sẽ xóa nhầm các box của những người ngồi sát nhau trong phòng họp nhóm (vì 2 người kề nhau có thể giao nhau 30–45%). Nâng lên `0.65` giúp bảo toàn đủ 5/5 người. |
| **`dist_centers` Limit** | $< 0.30 \times \min(W, H)$ | `yolo_service.py:272`<br>`admin.ts:2579` | **Tránh gộp sai:** Khoảng cách tâm giữa hai người cạnh nhau luôn lớn hơn $0.35 \times \min(W, H)$. Ngưỡng này là chốt chặn đảm bảo hai cá thể độc lập không bao giờ bị sáp nhập. |
| **`Tracking Alpha` (EMA)** | $\alpha = 0.40$ | `admin.ts:2916` | **Làm mượt tọa độ (Anti-jitter):** Công thức $x_{t} = (1 - \alpha)x_{t-1} + \alpha x_{det}$ với $\alpha = 0.40$ giúp khung bao di chuyển êm dịu theo cử động cơ thể, không bị giật khung. |
| **`missing` Frame Limit** | $\le 2$ frames | `admin.ts:2930` | **Loại bỏ hộp ma (Ghost Boxes):** Cho phép mục tiêu bị che khuất tạm thời trong tối đa 2 frame. Đặt thấp để khi người ra khỏi phòng, khung hình lập tức biến mất mà không để lại vết người ảo. |
| **Chuẩn hóa ảnh gửi Server** | Max Width: $640\text{px}$, JPEG quality: $0.72$ | `admin.ts:2358-2371` | **Tối ưu băng thông mạng:** Giảm dung lượng từ $>2\text{MB}$ xuống còn $<35\text{KB}$, thời gian truyền tải chỉ mất 10–25ms trên mạng 4G/WiFi, giảm tải tính toán cho GPU/CPU máy chủ AI. |
| **Chu kỳ suy luận (Interval)** | Server: $140\text{ms}$ (~7 FPS)<br>Client: $80\text{ms}$ (~12 FPS) | `admin.ts:2773` | **Cân bằng hiệu năng & tài nguyên:** $140\text{ms}$ là tần suất tối ưu để phát hiện sự thay đổi hiện diện người mà không làm nghẽn luồng mạng HTTP hay gây quá nhiệt thiết bị. |

---

### 5.2. Thông số Trợ lý Chatbot AI (Gemini Flash & Context-RAG)

| Thông số | Giá trị | File mã nguồn | Lý do thiết lập & Căn cứ kỹ thuật |
| :--- | :---: | :--- | :--- |
| **`temperature`** | `0.3` | `gemini.service.js:153` | **Triệt tiêu ảo giác (Hallucination):** Ứng dụng đặt phòng thương mại đòi hỏi thông tin chính xác về giá cả và sức chứa. Nhiệt độ thấp (0.3) buộc mô hình tuân thủ tuyệt đối sự thật và trả về chuẩn JSON Structured Output. |
| **`Semantic Cache Latency`** | `< 20ms` (Fast-Path) | `gemini.service.js:126` | **Truy vấn siêu tốc khách hàng có cùng nhu cầu:** Bỏ qua gọi LLM khi gặp các nhu cầu đã được học, giảm độ trễ từ 2.500ms xuống < 20ms (gấp 120 lần) và tiết kiệm 100% token API. |
| **`Initial Confidence Score`** | `1.0` (Ngưỡng $\ge 0.5$) | `gemini.service.js:175` | **Độ tin cậy của tri thức đã học:** Cho phép bộ đệm phục vụ câu trả lời khi điểm tin cậy đạt từ 0.5 trở lên. Nếu bị đánh giá xấu nhiều lần (score < 0.5), hệ thống tự động bypass để Gemini khám phá lại. |
| **`Reinforcement Reward`** | `+5.0 điểm / lượt đặt` | `gemini.service.js:235` | **Tự học từ hành vi chuyển đổi:** Khi khách hàng thực hiện Đặt phòng thành công, không gian đó được cộng 5 điểm thích nghi và tự động đẩy lên vị trí gợi ý số 1 cho các khách sau. |
| **`spacesContext.slice`** | Top `15` phòng | `gemini.service.js:23` | **Tối ưu Token & Giảm độ trễ:** Nạp 15 phòng phù hợp nhất giúp giảm độ dài ngữ cảnh, tăng tốc độ phản hồi của Gemini Flash xuống dưới 1.5 giây và tránh làm phân tán sự chú ý (Attention Dilution). |
| **`timeoutMs`** | `4000ms` (4 giây) | `gemini.service.js:43` | **Bảo đảm trải nghiệm người dùng:** Nếu API đám mây bị nghẽn mạng quá 4 giây, hệ thống tự động ngắt (`AbortController`) và chuyển sang Local Heuristic Engine trả lời tức thì ($<5\text{ms}$). |
| **`Circuit Breaker Cooldown`** | `5 phút` | `gemini.service.js:59` | **Tự bảo vệ hệ thống:** Khi API gặp lỗi 403 (sai key) hoặc 429 (hết quota), hệ thống ngừng gọi trong 5 phút để tránh gửi dồn dập các request lỗi làm chậm ứng dụng. |

---

### 5.3. Thông số Nghiệp vụ Không gian (Business & Monitoring Policies)

| Quy tắc vận hành | Giá trị | File mã nguồn | Lý do thiết lập & Căn cứ kỹ thuật |
| :--- | :---: | :--- | :--- |
| **`noShowGraceMinutes`** | `30 phút` (cảnh báo tại `15 phút`) | `constants.js:73`<br>`scheduler.js:57` | Khoảng thời gian đệm hợp lý cho khách di chuyển trễ trước khi hủy lượt đặt và thu hồi phòng. |
| **`awayWarningMinutes`** | `20 phút` | `constants.js:74` | Cảnh báo hiện tượng khách để lại đồ đạc "giữ chỗ ảo" nhưng không sử dụng thực tế. |
| **`autoCheckoutMinutes`** | `45 phút` | `constants.js:75`<br>`scheduler.js:92` | Tự động trả phòng nếu khách rời phòng quá 45 phút mà không quay lại, giải phóng tài nguyên sàn. |
| **`Early Checkout Threshold`** | $\ge 3\text{ giây}$ liên tục phòng trống | `admin.ts:3141` | Kích hoạt nút xác nhận trả phòng sớm cho chủ gian hàng khi camera xác nhận khách đã rời đi, đưa khung giờ trống lên sàn tái bán ngay lập tức. |
| **`Overtime Surcharge Block`** | Block `30 phút` (+50.000 VNĐ / block) | `admin.ts:3129` | Tự động tính phụ thu khi camera phát hiện khách vẫn sử dụng phòng sau khi hết thời lượng đăng ký. |

---

## 6. Sơ đồ Luồng xử lý & Cơ chế Chịu lỗi (Circuit Breaker)

```
                            QUY TRÌNH XỬ LÝ DUAL-HEAD AI & FALLBACK
                            
  [WebRTC Camera Stream 720p]
              │
              ▼
  [Scale 640px, JPEG q=0.72 (<35KB)]
              │
              ▼
  [Kiểm tra Circuit Breaker Cooldown?]
         ├── Cooldown còn hiệu lực ──────┐
         └── Bình thường                  │
                 │                       │
                 ▼                       │
    [Gửi POST /api/occupancy/detect-server]
                 │                       │
      ┌──────────┴──────────┐            │
      │ Thành công          │ Lỗi / 503  │
      ▼                     ▼            ▼
[FastAPI YOLOv11]      [KÍCH HOẠT CLIENT EDGE AI FALLBACK]
├── Head 1: Detection  ├── Chạy COCO-SSD MobileNetV2 (WebGL/CPU)
├── Head 2: 17 Pose    ├── Chạy Hardware FaceDetector API
└── Anti-Crowding NMS  └── Hợp nhất Face & Body (IoU >= 0.65)
      │                     │
      └──────────┬──────────┘
                 │
                 ▼
    [Temporal EMA Tracking (alpha=0.40, missing<=2)]
                 │
                 ▼
    [Debounce Buffer Mode (Khử rung số trên 4 frames)]
                 │
                 ▼
    [Đánh giá Quy tắc Nghiệp vụ]
    ├── Sĩ số > Đăng ký? ──> Cảnh báo Overcapacity
    ├── Quá giờ thuê?    ──> Gợi ý phụ phí Overtime (+50k/30p)
    └── Phòng trống >=3s ──> Gợi ý giải phóng phòng Early Checkout
```

---
*Tài liệu được khởi tạo và lưu trữ tự động trong hệ thống mã nguồn UEL Space.*
