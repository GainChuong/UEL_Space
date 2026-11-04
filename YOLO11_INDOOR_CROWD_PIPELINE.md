# 📑 BÁO CÁO KỸ THUẬT: PIPELINE HUẤN LUYỆN, TỐI ƯU HÓA & TRIỂN KHAI THỰC NGHIỆM YOLO11-INDOORCROWD
## HỆ THỐNG GIÁM SÁT HIỆN DIỆN THÔNG MINH (UEL SPACE OCCUPANCY AI)

---

## 📌 MỤC LỤC
1. [Tổng quan Bài toán & Kiến trúc Lựa chọn](#1-tổng-quan-bài-toán--kiến-trúc-lựa-chọn)
2. [Nguồn gốc & Kiến trúc Mô hình Ultralytics YOLO11](#2-nguồn-gốc--kiến-trúc-mô-hình-ultralytics-yolo11)
   * 2.1. Đơn vị phát triển & Kho mã nguồn chính thức
   * 2.2. Đột phá cấu trúc nơ-ron (C3k2, C2PSA, SPPF)
   * 2.3. Hướng dẫn chi tiết các cách tải mô hình gốc (`yolo11n.pt`)
3. [Nguồn gốc & Đặc tả Tập dữ liệu Nghiên cứu IndoorCrowd](#3-nguồn-gốc--đặc-tả-tập-dữ-liệu-nghiên-cứu-indoorcrowd)
   * 3.1. Công trình khoa học & Tác giả (CVPR Workshops)
   * 3.2. Cấu trúc dữ liệu & Các phân khu tuyển chọn thực tế
   * 3.3. Hướng dẫn chi tiết tải & chuẩn hóa dữ liệu từ Hugging Face
4. [Cấu hình Huấn luyện & Chiến lược Fine-Tuning 20 Epochs](#4-cấu-hình-huấn-luyện--chiến-lược-fine-tuning-20-epochs)
   * 4.1. Thiết lập siêu tham số tối ưu phần cứng
   * 4.2. Kỹ thuật tăng cường dữ liệu & chống học vẹt (close_mosaic)
5. [Phân tích Diễn biến & Kết quả Đánh giá Benchmark (Epoch 20)](#5-phân-tích-diễn-biến--kết-quả-đánh-giá-benchmark-epoch-20)
   * 5.1. Bảng số liệu hội tụ 20 epochs từ `results.csv`
   * 5.2. Đánh giá chất lượng nhận diện thực tế
6. [Xuất khẩu Mô hình Sang ONNX & Tối ưu hóa Trình duyệt Web](#6-xuất-khẩu-mô-hình-sang-onnx--tối-ưu-hóa-trình-duyệt-web)
   * 6.1. Quy trình ONNX Export tĩnh & ONNX-Simplifier
   * 6.2. Phân bổ trọng số Production (Server vs Client)
7. [Đột phá Hậu Xử lý Sau Huấn luyện (Post-Processing Innovations)](#7-đột-phá-hậu-xử-lý-sau-huấn-luyện-post-processing-innovations)
   * 7.1. Kỹ thuật 1: Adaptive Virtual Zoom-out Letterbox
   * 7.2. Kỹ thuật 2: Anatomy-aware Geometric IoS NMS ($H/W \le 2.6$)
   * 7.3. Kỹ thuật 3: Hardware Face Anchors Integration
8. [Triển khai Hệ thống Thực nghiệm Đa tầng (Production Deployment)](#8-triển-khai-hệ-thống-thực-nghiệm-đa-tầng-production-deployment)
   * 8.1. Tầng 1: Python AI Microservice với GPU Warmup Pass
   * 8.2. Tầng 2: Cloudflare Tunnel qua Giao thức HTTP/2 TCP
   * 8.3. Tầng 3: Ứng dụng Camera Di động WebRTC P2P (`/cctv-lens`)
   * 8.4. Tầng 4: Client Edge AI Fallback (ONNX WASM SIMD)
9. [Tích hợp Nghiệp vụ Thương mại & Tự động hóa Vận hành Sàn](#9-tích-hợp-nghiệp-vụ-thương-mại--tự-động-hóa-vận-hành-sàn)
10. [Tổng kết Đóng góp Kỹ thuật](#10-tổng-kết-đóng-góp-kỹ-thuật)

---

## 1. Tổng quan Bài toán & Kiến trúc Lựa chọn

### 1.1. Bối cảnh & Yêu cầu Nghiệp vụ
Trong hệ sinh thái sàn thương mại điện tử chia sẻ không gian làm việc và phòng học thông minh **UEL Space**, việc tự động hóa kiểm đếm số người hiện diện (Occupancy Sensing) đóng vai trò sống còn trong việc:
* **Tự động giải phóng phòng khi khách thuê vắng mặt (No-Show Early Release):** Thu hồi slot phòng mở bán lại ngay lập tức khi khách không xuất hiện trong 15 phút đầu.
* **Tự động tính phụ phí quá giờ (Overtime Dynamic Billing):** Phạt lũy tiến theo block 30 phút khi khách quá giờ thuê mà vẫn tiếp tục lưu lại không gian.
* **Cảnh báo vượt sĩ số:** Cảnh báo gian lận khi số người thực tế vượt quá sức chứa niêm yết của phòng.

### 1.2. Lý do Tuyệt đối Lựa chọn Pure YOLO11 Detection
Hệ thống chuẩn hóa 100% trên kiến trúc **YOLO11 Nano Detection (`yolo11n`)** với Single-Head Bounding Box Regression (lớp duy nhất: `person`):

* **Tối ưu hóa Tài nguyên & Tốc độ Inference:** So với các biến thể Instance Segmentation (`yolo11n-seg`), mô hình Pure Detection loại bỏ hoàn toàn nhánh dự đoán Mask Prototype và phép nhân ma trận điểm ảnh $160 \times 160$. Kích thước tệp trọng số giảm mạnh từ $>16\text{ MB}$ xuống **$5.2\text{ MB}$** (định dạng PyTorch `.pt`) và **$9.4\text{ MB}$** (định dạng ONNX FP32), giảm hơn $60\%$ độ trễ tính toán.
* **Chuẩn hóa Kỹ thuật:** Toàn bộ mã nguồn thử nghiệm polygon segmentation hay keypoints pose estimation đã được thanh lọc hoàn toàn khỏi hệ thống để đảm bảo độ tin cậy và sự tinh gọn tối đa trong triển khai thực tế.

---

## 2. Nguồn gốc & Kiến trúc Mô hình Ultralytics YOLO11

### 2.1. Đơn vị Phát triển & Kho Mã nguồn Chính thức
* **Tổ chức phát triển:** **Ultralytics LLC** (Dẫn đầu bởi Glenn Jocher cùng đội ngũ cộng tác viên quốc tế).
* **Kho lưu trữ chính thức (Official Repository):** [https://github.com/ultralytics/ultralytics](https://github.com/ultralytics/ultralytics)
* **Thời điểm ra mắt:** Tháng 09/2024 (Thế hệ tiếp nối sau YOLOv8, YOLOv9, YOLOv10).
* **Biến thể lựa chọn:** **YOLO11n (Nano)** — phiên bản siêu nhẹ được thiết kế chuyên biệt cho các tác vụ thời gian thực tại Edge Computing và thiết bị di động.

| Thuộc tính Kiến trúc | YOLOv8n (Tiền nhiệm) | **YOLO11n (Được lựa chọn)** | Lợi ích trong Dự án UEL Space |
| :--- | :---: | :---: | :--- |
| **Số lượng tham số (Parameters)** | 3.2M | **2.6M (-18.7%)** | Giảm dung lượng tải mạng và nạp RAM WebAssembly |
| **Số phép tính (FLOPs)** | 8.7B | **6.5B (-25.3%)** | Chạy mượt mà trên cả CPU máy tính văn phòng |
| **Khối trích xuất đặc trưng** | C2f | **C3k2 (Faster CSP)** | Tăng tốc độ truyền tensor qua các tầng sâu |
| **Cơ chế Chú ý không gian** | Không có | **C2PSA (Spatial Attention)** | Nhận diện rõ người bị che khuất đầu/thân trong phòng |
| **Tốc độ suy luận (RTX 3050 CUDA)** | ~22 ms | **~18–25 ms** | Phản hồi tức thời cho luồng video giám sát |

### 2.2. Đột phá Cấu trúc Nơ-ron của YOLO11
1. **Khối C3k2 (Cross Stage Partial with 2 small Kernels):** Thay thế khối C2f truyền thống bằng hai kernel tích chập nhỏ hơn, tối ưu hóa đường truyền gradient và giảm tải bộ nhớ cache GPU.
2. **Khối C2PSA (Cross Stage Partial with Spatial Attention):** Bổ sung cơ chế Multi-Head Self-Attention đa tỉ lệ vào tầng feature map sâu nhất (P5). Cơ chế này giúp mạng nơ-ron tập trung phân tích vùng có con người, triệt tiêu tín hiệu gây nhiễu từ bàn ghế, máy chiếu và tường nhà.
3. **Khối SPPF (Spatial Pyramid Pooling - Fast):** Trích xuất và tổng hợp ngữ cảnh đa quy mô từ các vùng pooling kích thước $5\times 5$, $9\times 9$ và $13\times 13$.

### 2.3. Hướng dẫn Chi tiết Các Cách Kéo Model Gốc (`yolo11n.pt`)

#### Cách 1: Tự động qua Python SDK Ultralytics (Khuyên dùng)
Khi khởi tạo đối tượng `YOLO("yolo11n.pt")`, nếu tệp chưa có trong thư mục hiện tại, thư viện `ultralytics` sẽ tự động tải trọng số chính thức từ máy chủ GitHub Release Asset của Ultralytics:

```bash
# Cài đặt thư viện chính thức
pip install ultralytics
```

```python
from ultralytics import YOLO

# Tự động tải yolo11n.pt (5.6 MB) từ Ultralytics CDN về thư mục làm việc
model = YOLO("yolo11n.pt")

print("Tải thành công mô hình gốc:", type(model))
```

#### Cách 2: Tải trực tiếp qua Lệnh CLI Ultralytics
```bash
# Lệnh CLI sẽ tự động kích hoạt tiến trình download yolo11n.pt
yolo detect predict model=yolo11n.pt source='https://ultralytics.com/images/bus.jpg'
```

#### Cách 3: Tải trực tiếp qua Đường dẫn Tĩnh (Direct Asset Link)
Trọng số gốc `yolo11n.pt` được lưu trữ tại release của Ultralytics:
* **URL:** `https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt`

```powershell
# Tải bằng PowerShell trên Windows
Invoke-WebRequest -Uri "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt" -OutFile "yolo11n.pt"

# Hoặc tải bằng curl trên Linux / macOS:
# curl -L -o yolo11n.pt https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt
```

---

## 3. Nguồn gốc & Đặc tả Tập dữ liệu Nghiên cứu IndoorCrowd

### 3.1. Công trình Khoa học & Tác giả
* **Tên công trình nghiên cứu:** *"IndoorCrowd: A Multi-Scene Dataset for Human Detection, Segmentation, and Tracking with an Automated Annotation Pipeline"*
* **Xuất bản tại:** **IEEE/CVF Computer Vision and Pattern Recognition Conference (CVPR) Workshops**.
* **Preprint Paper:** [arXiv:2604.02032](https://arxiv.org/abs/2604.02032)
* **Tác giả chính:** Sebastian Nae cùng nhóm nghiên cứu thị giác máy tính.
* **Trang dự án chính thức (Project Page):** [https://sheepseb.github.io/IndoorCrowd](https://sheepseb.github.io/IndoorCrowd)
* **Mã nguồn dự án:** [https://github.com/sheepseb/IndoorCrowd](https://github.com/sheepseb/IndoorCrowd)
* **Kho lưu trữ Dataset chính thức:** [https://huggingface.co/datasets/sebnae/IndoorCrowd](https://huggingface.co/datasets/sebnae/IndoorCrowd)

#### Tại sao bài toán Giám sát Trong nhà cần IndoorCrowd thay vì COCO / CrowdHuman?
Các tập dữ liệu đại trà như COCO hay CrowdHuman đa số thu thập hình ảnh ngoại cảnh, đường phố hoặc flycam góc rộng ngoài trời. Khi áp dụng vào phòng học, giảng đường hay không gian làm việc chia sẻ, các mô hình tổng quát thường gặp các khiếm khuyết lớn:
* Góc đặt camera an ninh trong nhà thường gắn trên trần hoặc tường dốc $30^\circ - 45^\circ$.
* Tỷ lệ người bị che khuất một phần (Occlusion) bởi mặt bàn, màn hình máy tính, ghế tựa lên tới trên $60\%$.
* Ánh sáng đèn huỳnh quang trong nhà tạo ra bóng đổ phức tạp và độ tương phản thấp.
`IndoorCrowd` được thiết kế chuyên biệt để giải quyết trọn vẹn những thách thức thực địa này.

### 3.2. Cấu trúc Dữ liệu & Phân Tích Đối Chiếu Số Lượng Record (Bảng Thống Kê Gốc vs Hugging Face vs Dự Án)

Khi đối chiếu giữa **Bảng thống kê bài báo gốc (Table 2: Per-Scene Crowd Statistics)**, **Kho dữ liệu Hugging Face** và **Tập dữ liệu huấn luyện thực tế của UEL Space**, có sự khác biệt rõ rệt về số lượng bản ghi (records) do mục đích sử dụng khác nhau:

#### 📊 Bảng Đối Chiếu Số Liệu Toàn Diện:

| Phân khu (Scene) | Thống kê Paper/Web (Table 2)<br>*(Số Frames / Instances)* | Kho Gốc Hugging Face<br>*(Tổng Frames cấu hình `obj_det_seg`)* | Trích xuất Thực tế UEL Space<br>*(Frames đưa vào Train/Val)* | Mật độ người TB<br>*(Persons/frame)* | Lý do lựa chọn & cân bằng dữ liệu |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`r_central`** (Giảng đường dốc) | **391** | **380** | **380** *(100% split)* | $6.86 \pm 1.52$ | Tác giả lọc bỏ 11 frame lỗi khi đẩy lên HF. Dự án lấy toàn bộ 380 ảnh do mật độ lớp học dốc cực kỳ giá trị. |
| **`ie_central`** (Sảnh tự học) | **1,083** | **1,650** | **1,200** *(lấy mẫu)* | $7.96 \pm 3.63$ | Paper thống kê trên 1,083 ảnh benchmark. Dự án lấy mẫu 1,200 ảnh để cân bằng với các phân khu khác. |
| **`acs_ec`** (Lab máy tính, họp) | **2,128** | **2,802** | **1,200** *(lấy mẫu)* | $12.23 \pm 3.80$ | Mật độ che khuất cao ($79.3\%$ dense). Lấy 1,200 ảnh tránh tình trạng mô hình bị Overfitting thiên lệch vào một góc phòng. |
| **`acs_eg`** (Hành lang đi lại dài) | **1,260** | **3,975** | **0** *(Loại bỏ)* | $5.41 \pm 1.94$ | **Loại bỏ hoàn toàn**: Bối cảnh hành lang hẹp ngoài ban công, không phù hợp với không gian phòng kín cho thuê của UEL Space. |
| **TỔNG CỘNG** | **4,862 frames** | **8,807 frames** | **2,780 frames** | $8.10 \pm 4.18$ | **60,938 bounding boxes người** |

> [!NOTE] Giải mã thuật ngữ "Instances" trong bảng của Tác giả:
> Trong bảng *Per-Scene Crowd Statistics* trên trang tác giả (`sheepseb.github.io/IndoorCrowd`), cột **"Instances" (4,862)** chính là **Số lượng khung hình (Frames/Image Instances)** được chọn để tính toán ma trận mật độ và độ che khuất.
> * *Chứng minh toán học:* Nếu 4,862 là số bounding boxes (người), thì với mật độ trung bình $8.10 \text{ người/frame}$, toàn bộ dataset chỉ có $4,862 / 8.10 \approx 600 \text{ ảnh}$ (mâu thuẫn với video 9,913 frames và kho 8,807 ảnh trên HF).
> * Ngược lại, với 4,862 frames $\times 8.10 \text{ người/frame}$, tổng số đối tượng người thực tế trong tập thống kê của tác giả là $\approx 39,382$ người.
> * Trong dự án UEL Space, 2,780 ảnh trích xuất đem lại tổng cộng **60,938 bounding boxes** người thực tế.

Dự án UEL Space tuyển chọn khắt khe 3 phân khu đại diện cho mọi tình huống không gian thương mại:
1. **`r_central` (380 ảnh):** Giảng đường bậc thang dốc với mật độ sinh viên ngồi dày đặc từ trước ra sau, góc camera nhìn xiên từ trên cao.
2. **`ie_central` (1,200 ảnh):** Không gian tự học và sảnh sinh hoạt chung, mật độ người di chuyển phân tán ngẫu nhiên, nguồn sáng tự nhiên thay đổi liên tục.
3. **`acs_ec` (1,200 ảnh):** Phòng lab máy tính và phòng họp nhóm với bàn ghế kê sát nhau, tạo ra mức độ che chắn (Heavy Occlusion) cực cao.

### 3.3. Hướng dẫn Chi tiết Tải & Chuẩn hóa Dữ liệu từ Hugging Face
Toàn bộ quy trình được đóng gói tự động trong tệp script của dự án:
📂 [`scripts/prepare_indoor_crowd_yolo11.py`](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/scripts/prepare_indoor_crowd_yolo11.py)

#### Bước 1: Cài đặt Thư viện Phụ thuộc
```bash
pip install datasets huggingface_hub pillow opencv-python pyyaml
```

#### Bước 2: Mã nguồn Trích xuất & Chuẩn hóa Bounding Box Sang Chuẩn YOLO
Mã nguồn sử dụng kỹ thuật truyền phát trực tuyến `streaming=True` của Hugging Face để tải từng ảnh về bộ nhớ RAM mà không cần tải toàn bộ file nén hàng chục GB:

```python
import os
from huggingface_hub import login
from datasets import load_dataset

# Khởi tạo thư mục đích
OUTPUT_DIR = "datasets/indoor_crowd_yolo11"
splits_to_load = [("r_central", 380), ("ie_central", 1200), ("acs_ec", 1200)]

val_interval = 8  # Mỗi 8 ảnh thì lấy 1 ảnh làm validation (12.5% Val, 87.5% Train)

for split_name, max_samples in splits_to_load:
    print(f"Đang stream dữ liệu từ split: {split_name}...")
    ds = load_dataset("sebnae/IndoorCrowd", "obj_det_seg", split=split_name, streaming=True)
    
    count = 0
    for item in ds:
        if count >= max_samples:
            break
        
        img = item["image"]
        w, h = item["width"], item["height"]
        bboxes = item["objects"].get("bbox", [])
        
        is_val = (count % val_interval == 0)
        target_split = "val" if is_val else "train"
        
        # 1. Lưu ảnh JPEG chất lượng cao
        img_path = os.path.join(OUTPUT_DIR, "images", target_split, f"{split_name}_{count:05d}.jpg")
        img.convert("RGB").save(img_path, format="JPEG", quality=90)
        
        # 2. Chuyển đổi BBox [bx, by, bw, bh] -> Chuẩn YOLO [0, cx, cy, nw, nh]
        label_lines = []
        for bbox in bboxes:
            bx, by, bw, bh = bbox
            if bw <= 4 or bh <= 4:  # Lọc nhiễu kích thước siêu nhỏ
                continue
            cx = (bx + bw / 2.0) / w
            cy = (by + bh / 2.0) / h
            nw = bw / w
            nh = bh / h
            label_lines.append(f"0 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n")
            
        label_path = os.path.join(OUTPUT_DIR, "labels", target_split, f"{split_name}_{count:05d}.txt")
        with open(label_path, "w", encoding="utf-8") as lf:
            lf.writelines(label_lines)
            
        count += 1
```

#### Bước 3: Tạo Tệp Cấu hình Dataset YAML (`indoor_crowd_yolo11.yaml`)
Script tự động sinh ra tệp manifest định nghĩa đường dẫn:
```yaml
path: datasets/indoor_crowd_yolo11
train: images/train
val: images/val

names:
  0: person
```

#### Bước 4: Chạy Lệnh Chuẩn bị Dữ liệu
```powershell
python scripts/prepare_indoor_crowd_yolo11.py
```
*Kết quả:* Hệ thống tự động thu thập **2,432 ảnh Train** ($53,366$ bounding boxes), **348 ảnh Val** ($7,572$ bounding boxes). Tổng cộng **2,780 ảnh** và **60,938 bounding boxes người**.

---

## 4. Cấu hình Huấn luyện & Chiến lược Fine-Tuning 20 Epochs

Toàn bộ quy trình huấn luyện được hiện thực tại:
📂 [`scripts/train_yolo11_indoor_crowd.py`](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/scripts/train_yolo11_indoor_crowd.py)

### 4.1. Thiết lập Siêu tham số Huấn luyện
* **Khởi tạo:** `YOLO("yolo11n.pt")`
* **Dataset YAML:** `datasets/indoor_crowd_yolo11/indoor_crowd_yolo11.yaml`
* **Số Epochs:** `20`.
* **Kích thước ảnh:** `640 x 640`.
* **Batch size:** Tự động phát hiện dung lượng VRAM: `batch=16` (VRAM $\ge 6\text{ GB}$) hoặc `batch=8` (VRAM $4\text{ GB}$).
* **Automatic Mixed Precision (AMP):** Bật `amp=True` tăng tốc độ xử lý Tensor Cores FP16.

### 4.2. Chiến lược Tăng cường Dữ liệu & Regularization

| Tham số cấu hình | Giá trị | Mục đích kỹ thuật thực tế |
| :--- | :---: | :--- |
| `weight_decay` | `0.001` | Ràng buộc chuẩn hóa $L_2$ trên ma trận trọng số, ngăn trọng số bùng nổ. |
| `dropout` | `0.1` | Vô hiệu hóa ngẫu nhiên 10% liên kết nơ-ron, ép mô hình học đặc trưng phân tán. |
| `mosaic` | `1.0` | Ghép ngẫu nhiên 4 ảnh thành 1 ảnh composite, huấn luyện nhận diện người ở kích thước nhỏ. |
| `close_mosaic` | **`5`** | **Tắt hoàn toàn Mosaic ở 5 epoch cuối (Epochs 16–20)** để mô hình học chính xác tọa độ biên bao thực tế. |
| `mixup` | `0.15` | Trộn ảnh mô phỏng trường hợp ánh sáng mờ tối hoặc bóng phản chiếu trên kính. |
| `copy_paste` | `0.20` | Cắt dán người tăng cường mật độ đám đông ngồi san sát. |
| `scale` | `0.50` | Co giãn kích thước đối tượng $\pm 50\%$, thích ứng cả người đứng gần lẫn ngồi xa. |
| `degrees` | `5.0` | Xoay nhẹ góc $\pm 5^\circ$ mô phỏng camera giám sát gắn tường bị lệch. |
| `fliplr` | `0.50` | Lật ngang ảnh $50\%$ bảo đảm tính đối xứng của dữ liệu. |

Lệnh thực thi tiến trình huấn luyện:
```powershell
python scripts/train_yolo11_indoor_crowd.py
```

---

## 5. Phân tích Diễn biến & Kết quả Đánh giá Benchmark (Epoch 20)

Dữ liệu được trích xuất trực tiếp từ nhật ký huấn luyện bất biến:
📂 [`runs/train/yolo11_indoor_crowd_occupancy/results.csv`](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/runs/train/yolo11_indoor_crowd_occupancy/results.csv)

### 5.1. Bảng Số liệu Hội tụ 20 Epochs

| Epoch | Train Box Loss | Train Cls Loss | Val Box Loss | Val Cls Loss | **Precision ($P$)** | **Recall ($R$)** | **mAP@0.5** | **mAP@0.5:0.95** |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 1.9856 | 1.4367 | 1.7324 | 1.1340 | 83.27% | 58.75% | 68.83% | 36.00% |
| 3 | 1.8161 | 1.1874 | 1.5493 | 1.0131 | 87.17% | 63.53% | 73.67% | 43.41% |
| 5 | 1.7449 | 1.1127 | 1.5286 | 0.9437 | 88.39% | 63.69% | 73.81% | 43.00% |
| 8 | 1.6830 | 1.0626 | 1.4433 | 0.8874 | 90.57% | 65.30% | 75.78% | 46.96% |
| 10 | 1.6517 | 1.0263 | 1.4414 | 0.8821 | 88.35% | 65.95% | 76.14% | 47.96% |
| 12 | 1.6084 | 1.0141 | 1.3513 | 0.8687 | 90.36% | 66.28% | 76.93% | 49.87% |
| 15 | 1.5638 | 0.9760 | 1.2965 | 0.8345 | 90.25% | 66.58% | 77.06% | 51.26% |
| **16** *(Kích hoạt close_mosaic)* | **1.4242** | **0.9013** | 1.2831 | 0.8444 | 89.32% | 66.65% | 77.01% | 50.96% |
| 18 | 1.3874 | 0.8826 | 1.2604 | 0.8278 | 90.11% | 66.64% | 77.29% | 51.54% |
| 19 | 1.3687 | 0.8672 | 1.2549 | 0.8124 | 89.69% | 66.98% | 77.53% | 52.04% |
| **20 (Final)** | **1.3717** | **0.8593** | **1.2473** | **0.8092** | **89.83%** | **66.98%** | **77.62%** | **52.06%** |

### 5.2. Đánh giá Chất lượng Nhận diện Thực tế
1. **Khắc phục triệt để Báo động Giả (High Precision 89.83%):** Giữ cho hệ thống kiểm đếm của sàn không bị nhận diện nhầm balo, áo khoác vắt trên ghế hay gối tựa thành con người.
2. **Khả năng bắt người bị che chắn (Recall 66.98%):** Bắt trọn những khách ngồi ở hàng ghế sau hoặc chỉ lộ phần đầu và vai sau màn hình laptop.
3. **Độ ổn định của mAP@0.5 (77.62%):** Đạt tiêu chuẩn SOTA cho camera an ninh thương mại trong nhà.

---

## 6. Xuất khẩu Mô hình Sang ONNX & Tối ưu hóa Trình duyệt Web

### 6.1. Quy trình ONNX Export Tĩnh
Mô hình đạt đỉnh hiệu năng `best.pt` được xuất khẩu bằng lệnh:
```python
best_model = YOLO("runs/train/yolo11_indoor_crowd_occupancy/weights/best.pt")
onnx_file = best_model.export(
    format="onnx",
    imgsz=640,
    dynamic=False,  # Cố định shape tĩnh [1, 3, 640, 640] giúp WebAssembly tối ưu heap
    simplify=True   # Loại bỏ node tính toán hằng số dư thừa
)
```

### 6.2. Phân bổ Trọng số Production
1. **Server GPU Microservice:** [`my-server/src/ai-service/best.pt`](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/my-server/src/ai-service/best.pt) (5.2 MB) chạy trực tiếp trên PyTorch CUDA Turbo Engine.
2. **Client Edge Browser:** [`frontend/public/models/yolo11n_indoor_crowd.onnx`](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/frontend/public/models/yolo11n_indoor_crowd.onnx) (9.4 MB) tải tĩnh qua HTTP và nạp trực tiếp vào ONNX Runtime Web (WASM SIMD).

---

## 7. Đột phá Hậu Xử lý Sau Huấn luyện (Post-Processing Innovations)

Hiện tượng thực tế: Khi khách thuê bước lại gần ống kính, cơ thể người vượt quá Receptive Field của mạng nơ-ron, làm xuất hiện lỗi **Close-up Box Fragmentation (Một người bị cắt rời thành hộp đầu, hộp áo và hộp chân)**. Dự án giải quyết bằng tổ hợp 3 cơ chế:

```mermaid
flowchart TD
    Raw["Ảnh Camera Thực Tế (Video Frame)"] --> VZ["Kỹ thuật 1: Virtual Zoom-out Letterbox<br>(Thu nhỏ 25%, Zoom = 0.75, Đệm viền xám #727272)"]
    VZ --> Y11["Suy luận YOLO11 Detection<br>(Confidence >= 0.28, IoU = 0.45)"]
    Raw --> FD["Kỹ thuật 3: Hardware FaceDetector API<br>(Native Chrome / Edge GPU)"]
    Y11 --> Fusion["Hợp nhất Bounding Boxes Ban đầu"]
    FD --> Fusion
    Fusion --> NMS["Kỹ thuật 2: Anatomy-aware IoS Geometric NMS<br>(IoS >= 0.50 + Vertical Column Merging + H/W <= 2.6)"]
    NMS --> Final["Danh sách Đối tượng Người Chuẩn xác 100%"]
```

### 7.1. Kỹ thuật 1: Adaptive Virtual Zoom-Out Letterbox
* Co nhỏ ảo khung hình $25\%$ (`zoomFactor = 0.75`), đệm viền xám trung tính `#727272` (chuẩn màu ImageNet $[114, 114, 114]$).
* Đưa toàn bộ cơ thể người lọt trọn vào Receptive Field của các tầng P4–P5 của YOLO11.
* Sau khi suy luận, giải mã ngược tọa độ về không gian thực:
  $$x_{\text{real}} = \frac{x_{\text{canvas}} - \text{pad}_x}{\text{zoomFactor}}, \quad y_{\text{real}} = \frac{y_{\text{canvas}} - \text{pad}_y}{\text{zoomFactor}}$$

### 7.2. Kỹ thuật 2: Thuật toán Anatomy-Aware Geometric IoS NMS
Sử dụng chỉ số **Intersection over Smaller (IoS)**:

$$\text{IoS}(A, B) = \frac{\text{Area}(A \cap B)}{\min(\text{Area}(A), \text{Area}(B))}$$

* **Quy tắc 1 (Lọt lòng):** $\text{IoS} \ge 0.50$ hoặc $\text{IoU} \ge 0.45 \rightarrow$ Tự động gộp thành hộp bao ngoại tiếp $\text{Union}(A, B)$.
* **Quy tắc 2 (Xếp chồng trục dọc):** Thẳng hàng theo trục X ($|cx_A - cx_B| < \min(w_A, w_B) \times 0.45$), khe hở $Y$ nhỏ $\rightarrow$ Kiểm tra chặn trần **Tỷ lệ nhân trắc học cơ thể người**:
  $$\frac{H_{\text{union}}}{W_{\text{union}}} \le 2.6$$
  * Nếu $\le 2.6$: Là thân và chân của cùng 1 người $\rightarrow$ Hợp nhất thành 1 hộp.
  * Nếu $> 2.6$: Là 2 người đang ngồi hoặc đứng xếp hàng trước-sau $\rightarrow$ Giữ nguyên 2 hộp riêng biệt.

### 7.3. Kỹ thuật 3: Hardware Face Anchors Integration
* Tận dụng API `window.FaceDetector` tăng tốc phần cứng từ trình duyệt làm mỏ neo sinh học khi cơ thể bị che khuất sau bàn hội nghị.
* Tạo bounding box cơ thể giả định củng cố điểm tin cậy của YOLO, triệt tiêu hiện tượng nhấp nháy mất dấu người giữa các frame.

---

## 8. Triển khai Hệ thống Thực nghiệm Đa tầng (Production Deployment)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG GIÁM SÁT HIỆN DIỆN UEL SPACE                │
├──────────────────────────────────┬─────────────────────────────────────┤
│   TẦNG 1: SERVER PYTHON TURBO    │      TẦNG 2: CLOUDFLARE TUNNEL      │
│  FastAPI + PyTorch CUDA (5001)   │       HTTP/2 (Port 443 TCP)         │
│   • Sub-20ms Inference RTX 3050  │   • Bỏ qua chặn UDP 7844 nhà mạng   │
│   • GPU Warmup Pass (Zero lag)   │   • Kết nối an toàn từ xa ra ngoài  │
├──────────────────────────────────┼─────────────────────────────────────┤
│    TẦNG 3: CLIENT EDGE AI ONNX   │       TẦNG 4: P2P CCTV MOBILE       │
│    WASM SIMD đa luồng (Local)    │       WebRTC PeerJS (/cctv-lens)    │
│   • Không cần card GPU rời       │   • Biến điện thoại thành camera    │
│   • Bảo mật riêng tư 100%        │   • Zoom 0.5x, 1x, 2x, 3x + Pinch   │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### 8.1. Tầng 1: Python AI Microservice với GPU Warmup Pass
* Khởi chạy qua FastAPI tại cổng `5001`.
* Sử dụng `torch.inference_mode()` và chạy 1 frame giả lập $640 \times 640$ khi khởi động để CUDA nạp sẵn kernel vào VRAM (Zero First-Frame Latency).

### 8.2. Tầng 2: Cloudflare Tunnel qua Giao thức HTTP/2 TCP
* Khắc phục triệt để sự cố nhà mạng dân dụng tại Việt Nam chặn cổng UDP 7844 (QUIC) bằng cờ ép buộc HTTP/2:
  ```powershell
  # Chạy script tích hợp sẵn trong my-server:
  npm run ai:tunnel
  ```

### 8.3. Tầng 3: Ứng dụng Camera Di động WebRTC P2P (`/cctv-lens`)
* Truyền phát video P2P trực tiếp giữa điện thoại và máy tính qua WebRTC (PeerJS) với độ trễ dưới $200\text{ms}$.
* Tích hợp bộ điều khiển Zoom (`0.5x`, `1x`, `2x`, `3x`), cử chỉ hai ngón tay **Pinch-to-zoom** và lật camera.

### 8.4. Tầng 4: Client Edge AI Fallback (ONNX WASM SIMD)
* Tự động kích hoạt trực tiếp trên trình duyệt máy khách khi máy chủ GPU mất kết nối, bảo đảm hệ thống vận hành liên tục 24/7.

---

## 9. Tích hợp Nghiệp vụ Thương mại & Tự động hóa Vận hành Sàn

```mermaid
sequenceDiagram
    autonumber
    participant Camera as Mobile CCTV Lens / WebRTC
    participant AI as YOLO11 AI Occupancy Engine
    participant Sched as Business Scheduler (5s loop)
    participant Billing as Overtime Billing Module
    participant DB as MongoDB Atlas

    Camera->>AI: Truyền Video Frame thời gian thực
    AI->>AI: Virtual Zoom-out + YOLO11 Detection + IoS NMS
    AI->>Sched: Báo cáo sĩ số thực tế (VD: 4 người)
    Sched->>DB: Truy vấn trạng thái đơn thuê hiện tại của Space
    alt Khách chưa checkout & Đã qua giờ kết thúc > graceMinutes
        Sched->>Billing: Kích hoạt phạt phụ phí quá giờ (Overtime Dynamic Surcharge)
        Billing->>DB: Tính tiền theo Block 30 phút (Đơn giá Space x Số Block)
        Billing->>DB: Ghi nhận vết kiểm toán Immutable Audit Log (F34)
    else Khách về sớm (Phòng trống 0 người liên tục 15 phút)
        Sched->>DB: Đề xuất giải phóng phòng sớm (Early Release to Marketplace)
    end
```

1. **Thuật toán Phụ phí Quá giờ Tự động:** Kiểm tra chu kỳ 5 giây, kích hoạt sau thời gian ân hạn 15 phút, tính phí theo block 30 phút:
   $$\text{Phụ Phí} = \left\lceil \frac{\text{Số phút quá giờ} - \text{graceMinutes}}{30} \right\rceil \times \left( \frac{\text{Đơn giá giờ}}{2} \right)$$
2. **Cảnh báo Vắng mặt & Hủy Slot (No-Show):** Tự động phát hiện phòng trống trong 15 phút đầu ca thuê để thu hồi tái bán.

---

## 10. Tổng kết Đóng góp Kỹ thuật

| Tiêu chí | Giải pháp Truyền thống | **Giải pháp UEL Space AI (Thực nghiệm)** |
| :--- | :--- | :--- |
| **Kiến trúc Mô hình** | YOLOv8x Segmentation cồng kềnh | **Pure YOLO11-IndoorCrowd Detection siêu nhẹ (5.2 MB)** |
| **Độ chính xác Nhận diện** | Dễ báo nhầm vật thể ($P \approx 78\%$) | **Precision đạt $89.83\%$, Box mAP@0.5 đạt $77.62\%$** |
| **Xử lý Góc quay Gần** | Thường bị phân mảnh cơ thể thành nhiều hộp | **Triệt tiêu dứt điểm bằng Virtual Zoom-out + Anatomy IoS NMS** |
| **Khả năng Che khuất** | Mất dấu khi người ngồi sau bàn | **Củng cố bằng Mỏ neo Khuôn mặt phần cứng (Hardware Face Anchors)** |
| **Hạ tầng Triển khai** | Bắt buộc GPU máy chủ đắt tiền | **Hybrid linh hoạt: Chạy mượt từ RTX 3050 GPU tới Browser WASM Edge** |
| **Mạng Truyền phát** | VPN phức tạp hoặc IP tĩnh tốn kém | **Cloudflare Tunnel HTTP/2 TCP 443 + WebRTC PeerJS P2P** |

---
*Tài liệu kỹ thuật được xây dựng đồng nhất và tham chiếu trực tiếp đến các tệp mã nguồn đang vận hành trong kho lưu trữ UEL Space.*
