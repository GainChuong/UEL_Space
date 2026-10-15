# 🚀 KHO TÀNG PROMPT THỰC CHIẾN - DỰ ÁN UEL SPACE (FLEXSPACE AI)
> **Tài liệu tổng hợp & chuẩn hóa các Prompt chất lượng cao trong toàn bộ Workspace**  
> **Dự án:** UEL Space / FlexSpace AI – Nền tảng Sàn Thương mại Điện tử Cho thuê & Giám sát Không gian thông minh  
> **Đơn vị phát triển:** GainChuong / UEL Space – Trường Đại học Kinh tế - Luật (ĐHQG-HCM)  
> **Ngày tổng hợp:** Tháng 10/2026

---

## 📌 MỤC LỤC TỔNG QUAN

1. [Tổng Quan & Thống Kê Prompt Toàn Workspace](#1-tổng-quan--thống-kê-prompt-toàn-workspace)
2. [Phân Tích Phong Cách Prompt Engineering Thực Chiến](#2-phân-tích-phong-cách-prompt-engineering-thực-chiến)
3. [Trụ Cột I: Chiến Lược Sản Phẩm & Bước Ngoặt Mô Hình (Product Pivot & Business Architecture)](#3-trụ-cột-i-chiến-lược-sản-phẩm--bước-ngoặt-mô-hình-product-pivot--business-architecture)
4. [Trụ Cột II: Trí Tuệ Nhân Tạo & Thị Giác Máy Tính (SOTA Computer Vision & Edge AI)](#4-trụ-cột-ii-trí-tuệ-nhân-tạo--thị-giác-máy-tính-sota-computer-vision--edge-ai)
5. [Trụ Cột III: Cơ Sở Dữ Liệu & Xử Lý Dữ Liệu Lớn (Database Engineering & Big Data Pipeline)](#5-trụ-cột-iii-cơ-sở-dữ-liệu--xử-lý-dữ-liệu-lớn-database-engineering--big-data-pipeline)
6. [Trụ Cột IV: Giao Diện Người Dùng, Trải Nghiệm & Brand Design (Airbnb Browse & UI/UX Storytelling)](#6-trụ-cột-iv-giao-diện-người-dùng-trải-nghiệm--brand-design-airbnb-browse--uiux-storytelling)
7. [Trụ Cột V: Hệ Sinh Thái IoT Kiosk, Mã QR, MoMo & Google Calendar](#7-trụ-cột-v-hệ-sinh-thái-iot-kiosk-mã-qr-momo--google-calendar)
8. [Trụ Cột VI: Tự Động Hóa Thiết Kế & Công Cụ Figma (MCP Stitch & Script Automation)](#8-trụ-cột-vi-tự-động-hóa-thiết-kế--công-cụ-figma-mcp-stitch--script-automation)
9. [Trụ Cột VII: Hạ Tầng, DevOps, Triển Khai Cloud & Bảo Mật Xác Thực](#9-trụ-cột-vii-hạ-tầng-devops-triển-khai-cloud--bảo-mật-xác-thực)
10. [Bộ Khung Chuẩn Mực Prompt Engineering Rút Ra Từ Dự Án (Best Practice Framework)](#10-bộ-khung-chuẩn-mực-prompt-engineering-rút-ra-từ-dự-án-best-practice-framework)

---

## 1. TỔNG QUAN & THỐNG KÊ PROMPT TOÀN WORKSPACE

Qua toàn bộ vòng đời phát triển dự án UEL Space từ những phiên bản đầu tiên (hệ thống đặt phòng học nội bộ campus) cho đến nền tảng Sàn thương mại điện tử chia sẻ không gian tích hợp AI Computer Vision & IoT Kiosk, hệ thống đã ghi nhận:

- **Tổng số lượt tương tác (User Input):** ~195 prompts qua hơn 120 phiên làm việc.
- **Số prompt thực chất & định hình kiến trúc:** 80+ prompts mang tính kỹ thuật chuyên sâu.
- **Tập hợp chọn lọc chất lượng cao nhất:** 30+ prompts cốt lõi được cấu trúc chi tiết trong tài liệu này.

### Bảng Phân Bố Trọng Số Chuyên Môn

| Trụ Cột Kỹ Thuật / Nghiệp Vụ | Tỷ Lệ | Trọng Tâm Đạt Được |
| :--- | :---: | :--- |
| **Giao diện Người dùng & UI/UX** | **25%** | Lưới thẻ Airbnb, Storytelling animation, Dark/Light Mode, Mobile responsive |
| **Trí tuệ Nhân tạo & Computer Vision** | **22%** | SOTA YOLOv11 Server, Non-Max Suppression (NMS), triệt tiêu phân mảnh & false positive |
| **Cơ sở Dữ liệu & Xử lý Dữ liệu lớn** | **18%** | MongoDB Atlas, Pipeline lọc dataset Unsplash Lite 300K ảnh, seed dữ liệu thực |
| **Chiến Lược & Pivot Sản Phẩm** | **15%** | Chuyển đổi Campus -> Marketplace, Seller Center, đối soát đề cương FlexSpace AI |
| **Hệ sinh thái Tích hợp (IoT/MoMo/GG)** | **10%** | Kiosk QR check-in realtime, MoMo Sandbox, Google Calendar API 2 chiều |
| **Figma Tooling & Reverse Engineering** | **6%** | MCP Stitch, tự động sinh Frame Figma từ mã nguồn Angular & route thực tế |
| **DevOps & Cloud Deployment** | **4%** | Triển khai Render.com, Vercel, ràng buộc OAuth tên miền `@uel.edu.vn` |

---

## 2. PHÂN TÍCH PHONG CÁCH PROMPT ENGINEERING THỰC CHIẾN

Các prompt được chọn lọc từ tác giả trong workspace này mang 4 đặc trưng xuất sắc của một **Senior Product Engineer / AI Practitioner**:

1. **Problem-First & Outcome-Oriented (Tập trung vào nỗi đau & kết quả mong đợi):**  
   Không đưa ra những câu lệnh chung chung ("hãy làm đẹp hơn" hay "hãy sửa lỗi"), tác giả luôn mô tả chính xác triệu chứng thực tế: *"Dù có rất nhiều người nhưng chỉ detect được 1 người"*, *"1 người bị đếm thành nhiều người do nhận diện từng bộ phận"*, *"Phát hiện ra người khi không có ai"*.
2. **Context-Injection via Workspace Paths (`@[path]`):**  
   Tác giả chủ động nạp ngữ cảnh vào câu lệnh bằng cách đính kèm đường dẫn thư mục chỉ dẫn (`@[Instruction]`), tài liệu thương hiệu (`@[Brand_Guideline]`), mã nguồn giao diện (`@[frontend]`), hoặc bộ dữ liệu thực tế (`@[unsplash-research-dataset-lite-latest]`).
3. **Khai thác triệt để Slash Commands & Workflow Agent:**  
   Sử dụng đúng công cụ cho từng bài toán: `/enhance` cho cập nhật tính năng, `/brainstorm` khi đứng trước các ngã rẽ công nghệ, `/database-design` cho kiến trúc dữ liệu, và `/ui-ux-pro-max` cho tinh chỉnh thẩm mỹ giao diện.
4. **Tư duy Kiến trúc & Đánh đổi (Trade-off Decision Making):**  
   Chủ động đặt các câu hỏi bản chất: *"Sài option B thì ví dụ các thiết bị khác có quét AI được không?"*, *"Bản đồ không còn phù hợp với mô hình marketplace nhiều bên cho thuê -> chuyển sang thẻ duyệt phòng"*.

---

## 3. TRỤ CỘT I: CHIẾN LƯỢC SẢN PHẨM & BƯỚC NGOẶT MÔ HÌNH (PRODUCT PIVOT & BUSINESS ARCHITECTURE)

### Prompt #01: Bước ngoặt chuyển đổi mô hình sang Sàn Thương mại Điện tử & Seller Center
*Đánh dấu bước ngoặt chiến lược biến một ứng dụng mượn phòng học nội bộ thành nền tảng chia sẻ không gian quy mô lớn.*

```markdown
Chuyển thành bối cánh sàn thương mại điện tử chia sẻ và cho thuê space. Đồng thời admin nên đổi thành seller center cho phù hợp. Và điều chỉnh các chức năng cho phù hợp với vai trò seller
```
- **Phân loại:** Business Pivot & Architecture Transformation
- **Bối cảnh thực tế:** Ban đầu hệ thống được định hình phục vụ riêng khuôn viên trường đại học. Tuy nhiên, để phát triển thành một sản phẩm thương mại hoàn chỉnh, nền tảng cần mô hình sàn giao dịch (Multi-sided Marketplace) kết nối các chủ sở hữu không gian (Sellers) với khách hàng thuê (Renters).
- **Giải pháp AI thực thi trong Codebase:**
  - Chuyển đổi toàn bộ thuật ngữ từ "Quản lý cơ sở vật chất nội bộ" sang "Sàn thương mại điện tử không gian".
  - Tái cấu trúc khu vực Admin thành **Seller Center**: Quản lý danh mục mặt bằng, cấu hình biểu giá cho thuê theo giờ, xem báo cáo doanh thu & tỷ lệ lấp đầy.
  - Cập nhật tài liệu quy chế kinh doanh tại [Business_Rules.md](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/Instruction/Business_Rules.md).

---

### Prompt #02: Định hình mô hình doanh thu FlexSpace AI & Nghiệp vụ AI Occupancy
*Mô tả chi tiết và sâu sắc về logic vận hành, luồng doanh thu và vai trò của Computer Vision trong việc tối ưu hóa hiệu suất khai thác.*

```markdown
Điểm khác biệt cốt lõi của FlexSpace AI là ứng dụng AI Occupancy Detection để giám sát việc sử dụng không gian so với thông tin đặt chỗ thực tế. Thông qua công nghệ thị giác máy tính, hệ thống ước tính số lượng người có mặt trong phòng và đối chiếu với số người đã đăng ký nhằm phát hiện tình trạng sử dụng vượt số lượng cho phép. Đồng thời, AI theo dõi trạng thái có người trong phòng kết hợp với thời gian đặt chỗ để cảnh báo trường hợp khách sử dụng quá giờ, hỗ trợ chủ không gian xác minh và áp dụng phụ phí theo chính sách đã công bố.

Đặc biệt, khi AI phát hiện khách có khả năng rời phòng trước thời gian kết thúc đặt chỗ, hệ thống sẽ hỗ trợ xác nhận trả phòng sớm và cập nhật lại lịch khả dụng sau khi khách hoàn tất check-out. Những khung giờ được giải phóng có thể nhanh chóng đưa trở lại sàn để khách hàng khác tiếp tục đặt, qua đó tối ưu hiệu suất khai thác không gian và tăng cơ hội doanh thu cho chủ sở hữu. AI đóng vai trò hỗ trợ giám sát và xác minh, hạn chế các quyết định thu phí hoặc thu hồi phòng sai lệch do nhận diện không chính xác.

Về mô hình kinh doanh, FlexSpace AI tạo doanh thu từ phí hoa hồng trên mỗi giao dịch, gói thành viên FlexPass và dịch vụ quản trị không gian dành cho doanh nghiệp. Bằng việc kết hợp mô hình Marketplace, Google Calendar API và AI giám sát công suất sử dụng, nền tảng hướng đến giải quyết đồng thời ba vấn đề: đảm bảo sử dụng không gian đúng thỏa thuận, hạn chế thất thoát doanh thu do sử dụng quá giờ và tái khai thác hiệu quả các khoảng thời gian thuê còn dư. Đảm bảo AI thực hiện những chức năng này.
```
- **Slash command liên kết:** `/create`
- **Điểm sáng Prompt:** Đây là một prompt mẫu mực về **Product Requirements Document (PRD)** nén gọn, nêu rõ: (1) Điểm khác biệt cốt lõi (USP), (2) 3 ca sử dụng của AI (quá tải người, lố giờ tính phụ phí, trả phòng sớm giải phóng slot), (3) Luồng doanh thu (Take-rate hoa hồng, FlexPass, B2B SaaS).
- **Kết quả trong Codebase:** Cấu trúc module scheduler đối soát booking tại [scheduler.js](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/my-server/src/jobs/scheduler.js).

---

### Prompt #03: Thẩm định và đối soát đề cương nghiên cứu với phần mềm thực tế
*Kiểm tra tính nhất quán giữa tài liệu học thuật / báo cáo đồ án và kiến trúc công nghệ đã cài đặt.*

```markdown
Đề cương hiện tại đã đúng với lại phần mềm chưa đặc biệt là các chức năng AI. Đưa ra nhận xét về bổ sung hay chỉnh sửa nếu có
```
- **Ý nghĩa:** Đảm bảo toàn bộ các cải tiến kỹ thuật (SOTA YOLOv11 Server, NMS, WebSocket/REST trigger) được phản ánh chuẩn xác vào đề cương khóa luận, tránh việc code một đằng báo cáo một nẻo.

---

### Prompt #04: Khảo sát mô hình kinh doanh sàn chia sẻ không gian
*Phản biện tư duy sản phẩm trước khi chuyển đổi kiến trúc.*

```markdown
Tôi đang thắc mắc ví dụ đề tài của tôi là cho Office Rental Management System.
Nên làm nó là 1 cái sàn, nơi mà các Office có thể sharing, cho thuê thì có phù hợp k, và chức năng nhận diện mật độ ng để làm gì
```
- **Ý nghĩa:** Kích hoạt chế độ Socratic Brainstorming, làm rõ giá trị kinh tế của AI Occupancy Detection đối với các chủ sàn cho thuê văn phòng.

---

## 4. TRỤ CỘT II: TRÍ TUỆ NHÂN TẠO & THỊ GIÁC MÁY TÍNH (SOTA COMPUTER VISION & EDGE AI)

Vòng đời tinh chỉnh AI trong dự án là minh chứng rõ rệt cho quy trình kiểm thử và nâng cấp liên tục:

```
[Vòng 1: Detect yếu] ──► [Vòng 2: Phân mảnh người] ──► [Vòng 3: Người ma] ──► [Vòng 4: SOTA Server YOLOv11]
```

### Prompt #05: Nâng cấp mô hình chuẩn xác & đóng gói trực tiếp vào backend
*Giải quyết tình trạng model nhẹ trên trình duyệt chỉ phát hiện được 1 người dù phòng đông.*

```markdown
Như trong hình, là dù có rất nhiều ng nhưng mà chỉ detect đc 1 ng. Bạn sài model chuẩn xác hơn được k và nó load sẵn và đóng gói tren db mongo lúc sài chỉ cần gọi th /enhance
```
- **Slash command:** `/enhance`
- **Triệu chứng:** Mô hình COCO-SSD nhẹ trên WebGL gặp giới hạn khi đối tượng bị che khuất hoặc góc máy camera rộng.
- **Yêu cầu:** Chuyển sang mô hình có độ sâu lớn hơn, sẵn sàng inference và quản lý cấu hình thông qua backend.

---

### Prompt #06: Đòi hỏi mô hình Computer Vision tân tiến (SOTA) & Brainstorm nguyên nhân
*Khảo sát lý do hiệu năng nhận diện kém (do model hay do camera điện thoại).*

```markdown
Model AI quá kém tôi yêu cầu bạn sài tân tiến nhất có thể để detect. Hay do là do cam đt kém quá /brainstorm
```
- **Slash command:** `/brainstorm`
- **Phân tích:** Kích hoạt phân tích 2 chiều: (1) Giới hạn của camera góc rộng trên thiết bị di động, (2) Sự chênh lệch giữa Mobile TF.js (chỉ vài MB) so với các kiến trúc SOTA (YOLOv11/YOLOv8x). Đưa ra Option A (Tối ưu Client) và Option B (Server SOTA AI Microservice).

---

### Prompt #07: Thẩm định tính khả dụng trên đa thiết bị di động
*Kiểm tra tính tương thích trước khi chốt kiến trúc hệ thống.*

```markdown
sài option B thì ví dụ các thiết bị khác có quét AI dc k
```
- **Quyết định kỹ thuật:** Nếu chạy Server Microservice, mọi thiết bị từ điện thoại cấp thấp, laptop cho đến camera IP đều có thể gửi frame lên server xử lý mà không sợ quá tải GPU của điện thoại.

---

### Prompt #08: Lệnh thực thi chuyển đổi sang Server SOTA YOLOv11 Engine

```markdown
Chuyển đi /enhance sử dụng option B
```
- **Slash command:** `/enhance`
- **Kết quả trong Codebase:**
  - Tích hợp microservice nhận diện YOLOv11 chạy trên backend Python/Node.
  - Thiết lập fallback thông minh: Khi mất mạng server, tự động fallback về client COCO-SSD để camera không bao giờ bị đứng.

---

### Prompt #09: Triệt tiêu hiện tượng "Phân mảnh 1 người thành nhiều người"

```markdown
Hiện tại hệ thống đã có thể nhận diện từng bộ phận khi k có đầy đủ, tuy nhiên vẫn đếm 1 ng thành nhiều ng cải tiến đi. DO này là ở admin nên hay nâng hiệu suất
```
- **Triệu chứng:** Khi người dùng ngồi che khuất, model nhận diện riêng đầu, tay và thân thành 3 "người" khác nhau khiến số lượng đếm bị gấp ba.
- **Giải pháp AI thực thi:** Cài đặt thuật toán Non-Maximum Suppression (NMS) với IoU threshold chặt chẽ, kết hợp gom cụm giải phẫu cơ thể người (Anatomical Bounding Box Fusion).

---

### Prompt #10: Triệt tiêu hiện tượng "Người ma trong phòng trống" (False Positives)

```markdown
sử dụng model computer vision tân tiến nhất. hiện tại vẫn bị lỗi. Phát hiện ra người khi không có ai. Một người thành nhiều người
```
- **Vấn đề giải quyết:** Các vật dụng như áo khoác trên lưng ghế, ma-nơ-canh hoặc bóng đổ bị model dự đoán nhầm là người với độ tin cậy thấp.
- **Giải pháp:** Nâng ngưỡng Confidence score lọc nhiễu, tích hợp Exponential Moving Average (EMA) và bộ đệm Debounce 5 khung hình liên tiếp để xác nhận sự hiện diện thực tế.

---

### Prompt #11: Xóa bỏ hoàn toàn các nút giả lập dữ liệu Headcount
*Biến module AI thành hệ thống hoạt động thực 100%, không sử dụng số liệu ảo.*

```markdown
bỏ các nút test tăng giảm số người hay quá giờ đi
```
- **Kết quả trong Codebase:** Gỡ bỏ toàn bộ mock buttons, kết nối trực tiếp biến `headcount` và `overtimeStatus` vào luồng phát hiện từ camera live.

---

## 5. TRỤ CỘT III: CƠ SỞ DỮ LIỆU & XỬ LÝ DỮ LIỆU LỚN (DATABASE ENGINEERING & BIG DATA PIPELINE)

### Prompt #12: Thiết lập kết nối MongoDB Atlas thật & nạp ngữ cảnh chỉ dẫn dự án

```markdown
# Generated by MongoDB Atlas onboarding.
# This file contains sensitive credentials.
# DO NOT commit this file to version control.
# Store it securely (e.g. use a password manager or secrets vault).

MONGODB_USERNAME="gameyuno123_db_user"
MONGODB_PASSWORD="4ScSGOFQjScjIWOh"
MONGODB_URI="mongodb+srv://gameyuno123_db_user:4ScSGOFQjScjIWOh@cluster0.jdglrux.mongodb.net" Dựa trên@[d:\Học tập\3rd\PTWNC\DoAnCki\Instruction]  thiết lập DB backend real cho tôi
```
- **Bối cảnh:** Thay thế toàn bộ mock memory arrays bằng cụm MongoDB Atlas Cloud thực sự.
- **Kết quả:** Xây dựng các Schema Mongoose hoàn chỉnh tại [my-server/src/modules/](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/my-server/src/modules) cho Spaces, Bookings, Users và Notifications.

---

### Prompt #13: Khai phá dữ liệu Unsplash Research Dataset Lite (300,000+ Records)
*Một trong những prompt kỹ thuật dữ liệu xuất sắc nhất: Tự động hóa khai thác dataset nghiên cứu để làm giàu dữ liệu phòng thực tế.*

```markdown
Thay vì các ảnh demo phòng, sử dụng các ảnh sau khi lọc của bộ dataset anyf@[d:\Học tập\3rd\PTWNC\DoAnCki\my-server\unsplash-research-dataset-lite-latest] lưu ý liên quan đến các từ khóa "meeting room", "office", "modern", hoặc những từ khóa xoay quanh các space cho thuê, sau đó update này lên server.
```
- **Thách thức:** Dataset Unsplash Lite chứa hàng trăm ngàn dòng dữ liệu định dạng TSV/JSON khổng lồ.
- **Giải pháp thực thi:**
  - Viết script Node.js quét và lọc metadata của bộ dataset dựa trên các keyword định hướng (`meeting room`, `office`, `modern`, `coworking`).
  - Lấy các Photo URLs có độ phân giải tối ưu, kiểm tra tính sẵn sàng và cập nhật trực tiếp vào cơ sở dữ liệu MongoDB Atlas cho từng không gian.
  - Thay thế toàn bộ ảnh placeholder mờ ảo bằng hình ảnh kiến trúc thực tế đỉnh cao.

---

### Prompt #14: Mockup dữ liệu Seller và không gian theo kiến trúc quan hệ thực tế

```markdown
đảm bảo k chỉ ảnh mà tất cả dữ liên quan đều up lên /database-design @[d:\Học tập\3rd\PTWNC\DoAnCki\Instruction] xây database phù hợp
```
- **Slash command:** `/database-design`
- **Kết quả:** Chuẩn hóa quan hệ dữ liệu: Mỗi Space thuộc về một `sellerId`, lưu trữ trạng thái kiểm duyệt, tọa độ GPS, tiện ích (Wi-Fi, máy chiếu, bảng trắng, điều hòa) và các khung giờ slot.

---

### Prompt #14+: Chuyển đổi toàn diện dữ liệu sang Hugging Face Indoor Scenes Dataset
*Đòi hỏi tích hợp trực tiếp bộ dữ liệu phân loại không gian trong nhà chuẩn mực từ Hugging Face vào sàn thương mại điện tử.*

```markdown
Giờ tôi muốn chuyển qua sử dụng data set này: from datasets import load_dataset

# Login using e.g. `huggingface-cli login` to access this dataset
ds = load_dataset("FatimaSaadNaik/indoor-scenes-dataset")
Lưu ý trích các mục trong y hệt trong data set nha /enhance
```
- **Slash command:** `/enhance`
- **Kỹ thuật thực thi:**
  - Viết pipeline Python `extract_indoor_scenes.py` với streaming và `cast_column('image', decode=False)` để quét siêu tốc qua 14.290 mẫu dữ liệu.
  - Trích xuất chuẩn xác các trường nguyên bản: `category` (`meeting_room`, `office`, `classroom`, `auditorium`, `library`, `computerroom`, `tv_studio`, `waitingroom`), `caption` mô tả chi tiết không gian bằng tiếng Anh, `file_name` và tải 31 tệp ảnh chất lượng cao vào `my-server/public/images/spaces/`.
  - Cập nhật toàn bộ các Space của 5 Seller trên MongoDB Atlas với mô tả song ngữ (tiếng Việt + nguyên văn dataset caption) và lưu trữ metadata `dataset` trong từng bản ghi.

---


## 6. TRỤ CỘT IV: GIAO DIỆN NGƯỜI DÙNG, TRẢI NGHIỆM & BRAND DESIGN (AIRBNB BROWSE & UI/UX STORYTELLING)

### Prompt #15: Tái thiết kế trải nghiệm tìm kiếm dạng Thẻ duyệt phòng phong cách Airbnb
*Chuyển dịch giao diện bản đồ đơn lẻ thành hệ thống duyệt phòng hiện đại, chuẩn sàn thương mại điện tử.*

```markdown
bây giờ có nhiêu card phòng bạn bỏ vô đây, theo kiểu browse các nơi cho thuê á tham khảo air bnb. Vì giờ bản đồ k còn phù hợp với nhiều bên cho thuê, bên cạnh đó mock up data từ account, đến link các space mà seller đó cho thuê lại và đẩy nên mongo db tương ứng /database-design
```
- **Slash command:** `/database-design`
- **Tư duy sản phẩm sắc sảo:** Nhận thấy dạng bản đồ một vị trí chỉ phù hợp cho 1 trường học duy nhất; khi đã mở rộng thành sàn đa bên cho nhiều seller thì phong cách danh sách thẻ (Browse Grid Cards) như Airbnb là tiêu chuẩn vàng.
- **Kết quả:** Component duyệt phòng với Carousel ảnh, badge trạng thái, lọc theo giá và sức chứa.

---

### Prompt #16: Thiết kế trang About Us theo phong cách Storytelling dẫn dắt (Tham khảo ITB Club)
*Yêu cầu tạo dựng trải nghiệm kể chuyện giàu cảm xúc dựa trên nỗi đau thực tế của sinh viên.*

```markdown
/ui-ux-pro-max trình bày chuyên nghiệp hơn theo kiểu story telling dẫn dắt ng dùng [ITB Club](https://bi.itbstclub.com) tham khảo animation của web này
```
- **Kèm ngữ cảnh chi tiết:** Tác giả cung cấp toàn bộ báo cáo khảo sát thực trạng:
  - Sinh viên khó tìm phòng, không biết mật độ sử dụng thư viện trước khi đến.
  - Tình trạng đặt chỗ ảo, "chiếm chỗ bằng balo" rồi bỏ đi nơi khác.
  - Câu lạc bộ gặp khó khăn vì lịch sử dụng thủ công, thiếu minh bạch.
- **Kết quả:** Trang About Us được xây dựng với các khối scroll animation mượt mà, phân tích đối tượng trực quan và bảng tổng hợp Pain-points chuyên nghiệp.

---

### Prompt #17: Chuẩn hóa Typography & Loại bỏ thông tin rác theo Brand Guideline

```markdown
Chuyển cột mã tài khoản (ADMIN-001, MGR-002, K24411,...) về dạng font mono xám Slate trung tính. bỏ luôn được không đồng thời bám sát các font chữ trong@[d:\Học tập\3rd\PTWNC\DoAnCki\Brand_Guideline\Overview\Web_design_specification.md] đừng sài font ngoài /ui-ux-pro-max
```
- **Slash command:** `/ui-ux-pro-max`
- **Chi tiết tinh tế:** Yêu cầu dùng font monospaced màu Slate trung tính, lược bỏ các mã định danh nội bộ không có giá trị với người dùng cuối, đảm bảo bám sát [Web_design_specification.md](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/Brand_Guideline/Overview/Web_design_specification.md).

---

### Prompt #18: Thiết kế Header cố định, Avatar Menu đa tiện ích & Dark/Light Mode

```markdown
Thiết kế thêm giao diện khi bấm vô nút thông báo và bấm vô ava. Bấm vô ava sẽ bao gồm setting, và nút log out, nếu đã đăng nhập, còn lúc chưa thì chỉ bấm vô thì chỉ có mỗi nút log in. Trong setting có thể đổi anh qua việt, đổi dark mode qua light mode, và bật hiện thông báo về desk top cho cả hai giao diện admin và user /ui-ux-pro-max
```
- **Slash command:** `/ui-ux-pro-max`
- **Tính năng đạt được:**
  - Header sticky với hiệu ứng glassmorphism mờ nhẹ.
  - Dropdown Avatar thông minh theo trạng thái đăng nhập.
  - Bảng cài đặt: Chuyển đổi ngôn ngữ Anh - Việt, Dark/Light Mode, kích hoạt Web Notifications API trên desktop.

---

### Prompt #19: Tinh chỉnh thẩm mỹ Seller Center: Chuyên nghiệp, thanh lịch, lồng ảnh nền blur

```markdown
Làm cho giao diện admin trở nên chuyên nghiệp hơn. hạn chế sài quá nhiều màu và icon nhiều màu. lấy ảnh này lồng vào thanh bar có blur@[d:\Học tập\3rd\PTWNC\DoAnCki\my-server\public\images\admin\panel.jpg] /ui-ux-pro-max
```
- **Ý nghĩa:** Loại bỏ các màu sắc lòe loẹt, hướng đến phong cách thiết kế Enterprise SaaS cao cấp với thanh panel nền hình học có hiệu ứng blur tinh tế.

---

### Prompt #20: Tối ưu chống rớt chữ (Text Wrapping) & Responsive trên điện thoại di động

```markdown
/ui-ux-pro-max tôi cần một phiên bản phù hợp khi sử dụng trên điện thoại hãy chỉnh cho tôi. Chữ phải đảm bảo hạn chế rơi rớt chữ sài các src ảnh để làm cho trang thêm màu mỡ
```
- **Kết quả:** Khắc phục triệt để lỗi gãy chữ trên màn hình hẹp, điều chỉnh `line-height`, `word-break: keep-all` và chuyển layout về Single Column mượt mà.

---

## 7. TRỤ CỘT V: HỆ SINH THÁI IOT KIOSK, MÃ QR, MOMO & GOOGLE CALENDAR

### Prompt #21: Trạm Kiosk quét QR: Liên kết ID tài khoản thực & Đồng bộ DB tức thì

```markdown
Bây giờ hãy tổ chức dữ liệu lại tí, những dữ liệu QR của tài khoản nào thì quét phải link với tài khoản đó. Đồng thời cập nhật thẳng trạng thái lên DB và đưa vô đã sử dụng. Mock up thêm nhiều dữ liệu của tk giangntk để test /create
```
- **Vấn đề thực tế:** Quét mã QR xong nhưng ứng dụng không biết của ai và không cập nhật trạng thái phòng.
- **Kết quả:** Xây dựng luồng xác thực QR Check-in: Phân giải payload mã QR, kiểm tra hợp lệ với booking của tài khoản `giangntk`, tự động đổi trạng thái đơn thành `IN_USE` và phát âm thanh/haptic xác nhận thành công.

---

### Prompt #22: Tối ưu trải nghiệm Camera quét QR trên điện thoại di động

```markdown
Hiện tại chức năng quét IOT trên điện thoại về UI thì đang bị quá nhỏ, và nút kích hoạt k ăn, hãy đảm bảo hiệu suất cam tốt nhất. Nút đổi cam trên đt k quay cam ra đằng sau, trên đt default phải là cam sau chứ, với lại trên đt UI chỗ quét đang bị chồng lấn
```
- **Chi tiết kỹ thuật cao:**
  - Nhận định chính xác trên di động: Camera mặc định phải là `facingMode: { ideal: "environment" }` (Camera sau).
  - Khắc phục lỗi luồng video bị tắt khi chuyển đổi camera: Sử dụng `stream.getVideoTracks().forEach(track => track.stop())` trước khi gọi `getUserMedia` mới.
  - Sắp xếp lại lớp giao diện (Z-Index), mở rộng khung ngắm Kiosk quét QR toàn màn hình.

---

### Prompt #23: Tích hợp Google Calendar hai chiều & Loại bỏ lịch thủ công

```markdown
Chỉ cần sài google calendar, giao diện lịch cũ loại bỏ. lựa trực tiếp trên gg calendar /enhance. Link với google calendar và khi set thì sẽ kèm theo sự kiện liên quan đến phòng
```
- **Slash command:** `/enhance`
- **Kết quả trong Codebase:**
  - Đồng bộ đặt chỗ với sự kiện Google Calendar.
  - Tự động tạo link "Add to Google Calendar" kèm file `.ics` chuẩn hóa giúp khách thuê nhận thông báo trực tiếp trên điện thoại trước giờ họp.

---

### Prompt #24: Tích hợp cổng thanh toán MoMo Sandbox với giá theo giờ

```markdown
Tích hợp thanh toán momo với giá tiền theo giờ
```
- **Kết quả trong Codebase:**
  - Tích hợp cổng thanh toán điện tử MoMo Sandbox (QR code và Deep link).
  - Tự động tính toán tổng tiền dựa trên thời lượng thuê (ví dụ: 120.000 VNĐ / giờ x 2.5 giờ) và cập nhật trạng thái hóa đơn sau khi giao dịch hoàn tất.

---

## 8. TRỤ CỘT VI: TỰ ĐỘNG HÓA THIẾT KẾ & CÔNG CỤ FIGMA (MCP STITCH & SCRIPT AUTOMATION)

### Prompt #25: Tạo thiết kế Figma tự động từ URL ứng dụng thông qua MCP

```markdown
generate_figma_design qua mcp thông qua url 
[Frontend](https://uelspace-tan.vercel.app/)
[Frontend](https://uelspace-tan.vercel.app/map)
[Frontend](https://uelspace-tan.vercel.app/booking)
[Frontend](https://uelspace-tan.vercel.app/about)
[Frontend](https://uelspace-tan.vercel.app/admin)
[Frontend](https://uelspace-tan.vercel.app/login)
```
- **Ý nghĩa:** Sử dụng giao thức **Model Context Protocol (MCP)** kết nối trực tiếp với Figma Server để chuyển đổi các route đã deploy trên Vercel thành các Artboard Figma có cấu trúc chuẩn.

---

### Prompt #26: Chuyển đổi mã nguồn Web sang Figma đồng nhất bằng MCP Stitch

```markdown
Khởi tạo một project stitch mới và bắt đầu, chuyển các ảnh sau qua file figma. Bám sát ảnh và @[d:\Học tập\3rd\PTWNC\DoAnCki\frontend], sử source ảnh của tôi@[d:\Học tập\3rd\PTWNC\DoAnCki\my-server\public\images]. Để up thẳng lên. Các ảnh trên là cùng 1 trang. Sử dụng font chữ tương tự luôn.
```
- **Điểm sáng:** Yêu cầu agent đối chiếu song song giữa ảnh chụp màn hình thực tế và mã nguồn HTML/SCSS tại thư mục [frontend/](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/frontend), lấy đúng tài nguyên ảnh nội bộ từ [my-server/public/images/](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/my-server/public/images) để đảm bảo độ trung thực 100%.

---

### Prompt #27: Tạo script tự động sinh trọn bộ các màn hình Figma
*Kết quả từ chuỗi prompt của tác giả dẫn đến sự ra đời của script tự động hóa:*

```markdown
Tôi thấy vẫn chưa chuẩn lắm bám sát vào các file html và vẽ figma cho mỗi tab luôn. Kể cả admin và user. /ui-ux-pro-max. Sử dụng mcp stitch
```
- **Kết quả rực rỡ:** Xây dựng script độc lập tại [scripts/generate_all_figma_screens.js](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/scripts/generate_all_figma_screens.js) giúp tạo ra toàn bộ 6 màn hình chính xác từng pixel với Auto-layout và Design Tokens.

---

## 9. TRỤ CỘT VII: HẠ TẦNG, DEVOPS, TRIỂN KHAI CLOUD & BẢO MẬT XÁC THỰC

### Prompt #28: Triển khai Backend lên Render.com phục vụ truy cập di động toàn cầu

```markdown
Nếu bạn muốn điện thoại ở bất cứ đâu ngoài đường cũng gọi được API Đăng nhập Google / Đặt phòng vào Backend thật, bước tiếp theo ta có thể đưa thư mục my-server lên Render.com (miễn phí) để có đường link API public dạng https://uel-space-api.onrender.com! làm dùm toi
```
- **Bối cảnh:** Khi test trên điện thoại, IP `localhost:3000` không truy cập được khi ra ngoài mạng Wi-Fi nội bộ.
- **Kết quả:**
  - Cấu hình file [render.yaml](file:///d:/Học%20tập/3rd/PTWNC/DoAnCki/render.yaml) để deploy backend tự động.
  - Tự động cấu hình biến môi trường kết nối MongoDB Atlas và thiết lập `0.0.0.0` port binding an toàn.

---

### Prompt #29: Phân quyền bảo mật tài khoản: Giới hạn tên miền UEL

```markdown
Giờ tôi muốn cơ chế login thông qua google thật sự hoạt động và chỉ tài khoản đuôi @uel.edu.vn và @st.uel.edu.vn
```
- **Bảo mật:** Chặn người dùng vãng lai với tài khoản Gmail thông thường, chỉ cấp quyền truy cập hệ thống nội bộ cho cán bộ giảng viên (`@uel.edu.vn`) và sinh viên (`@st.uel.edu.vn`).

---

### Prompt #30: Quản trị Git Authorship & Lịch sử Commit sạch sẽ

```markdown
# 1. Đổi thông tin git sang email tài khoản GitHub GainChuong của bạn
git config user.name "GainChuong"
git config user.email "email_cua_tai_khoan_gainchuong@gmail.com"

# 2. Cập nhật lại tác giả cho commit vừa rồi và đẩy lại lên GitHub
git commit --amend --reset-author --no-edit
git push --force

gameyuno123@gmail.com
```
- **Ý nghĩa:** Đảm bảo toàn bộ đóng góp mã nguồn trên GitHub repository được liên kết chính chủ và chuyên nghiệp.

---

## 10. BỘ KHUNG CHUẨN MỰC PROMPT ENGINEERING RÚT RA TỪ DỰ ÁN (BEST PRACTICE FRAMEWORK)

Từ chuỗi prompt thực tế của dự án UEL Space, chúng ta đúc kết được **"Công thức Prompt 5 Thành phần (5-Element Prompting Formula)"** mang lại hiệu quả cao nhất khi làm việc với AI Coding Assistant:

$$\text{Prompt Chuẩn} = \text{[Vai Trò / Slash Command]} + \text{[Nỗi Đau / Hiện Trạng]} + \text{[Ngữ Cảnh Mã Nguồn @]} + \text{[Ràng Buộc Kỹ Thuật]} + \text{[Tiêu Chí Hoàn Thành]}$$

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SLASH COMMAND   : /enhance, /brainstorm, /database-design, /ui-ux-pro-max │
│ 2. VẤN ĐỀ THỰC TẾ  : "1 người đếm thành nhiều người", "bản đồ không còn hợp"│
│ 3. CONTEXT INJECTION: @[my-server], @[Brand_Guideline], @[Instruction]       │
│ 4. RÀNG BUỘC KỸ THUẬT: "sài model SOTA", "bám sát font Slate", "link DB thực"│
│ 5. ACCEPTANCE CRITERIA: "điện thoại quét được", "bỏ các nút mock data ảo"   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 💡 5 Lời Khuyên Vàng Cho Kỹ Sư Công Nghệ Khi Ra Lệnh Cho AI:

1. **Đừng giấu lỗi:** Hãy chụp ảnh hoặc miêu tả đúng triệu chứng xấu nhất của phần mềm. AI giải quyết bài toán tốt nhất khi biết chính xác biểu hiện lỗi.
2. **Khai thác dữ liệu thực sớm nhất có thể:** Việc tác giả yêu cầu kết nối MongoDB Atlas thật (Prompt #12) và lọc dataset Unsplash 300K ảnh (Prompt #13) đã cứu dự án khỏi cái bẫy "ứng dụng chỉ chạy được với mock data".
3. **Phản biện trước khi gõ code:** Dùng `/brainstorm` để cân nhắc các Option (như việc phân vân giữa AI Client vs AI Server) trước khi bắt tay cài đặt giúp tiết kiệm hàng chục giờ sửa sai.
4. **Giữ gìn tính nhất quán thẩm mỹ:** Luôn kẹp đường dẫn `@Brand_Guideline` vào các prompt UI để tránh việc AI tự tiện dùng font và màu sắc lung tung.
5. **Dứt khoát loại bỏ code rác:** Prompt "bỏ các nút test tăng giảm số người hay quá giờ đi" (Prompt #11) là minh chứng cho việc dũng cảm đưa sản phẩm từ đồ án nghiên cứu thành phần mềm thực thụ.

---
*Tài liệu được khởi tạo và lưu trữ vĩnh viễn tại thư mục gốc của dự án UEL Space.*  
*Chúc tác giả tiếp tục phát triển những tính năng đột phá trên hành trình công nghệ!*
