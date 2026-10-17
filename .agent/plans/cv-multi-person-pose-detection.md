# Plan: Nâng cấp Computer Vision - Nhận diện Đa người & Tư thế khó (Lying Down / Occluded Head)

## 1. Bối cảnh & Mục tiêu
- **Vấn đề 1:** Khung hình có 5 người thì chỉ quét được 3/5 người do thuật toán NMS và logic gộp hộp quá tay (`deltaX <= maxW * 0.45`, `IoU >= 0.25`), khiến những người ngồi sát nhau hoặc chồng một phần hình học bị gộp thành 1 người.
- **Vấn đề 2:** Khó nhận diện người nằm trên sofa/thảm/sàn hoặc các tư thế cúi gục/che khuất phần đầu do các mô hình Object Detection thông thường chỉ nhạy với dáng người thẳng đứng và khuôn mặt.
- **Mục tiêu:**
  1. Tách biệt chính xác từng cá nhân trong đám đông / phòng học nhóm (5/5 người ngồi sát nhau vẫn nhận diện đủ 5 box riêng biệt).
  2. Bắt trọn 100% người nằm, gục mặt, hoặc tư thế khuất đầu thông qua Dual-Head Ensemble (YOLOv11 Detection + YOLOv11 Pose 17 khớp xương) trên Server, kết hợp Adaptive Aspect Ratio trên Client Edge AI.

## 2. Kiến trúc & Các thành phần triển khai

### Thành phần 1: Server AI Microservice (`my-server/src/ai-service/yolo_service.py`)
- Khởi tạo thêm mô hình **YOLOv11 Pose Estimation** (`yolo11n-pose.pt`) chạy song song cùng `yolo11n.pt`.
- Nhận diện 17 keypoints của cơ thể người (vai, khuỷu, cổ tay, hông, đầu gối, mắt cá chân). Kể cả khi đầu bị che khuất hoặc úp mặt, khung xương thân/chân vẫn được nhận diện chắc chắn.
- **Smart Ensemble Fusion:**
  - Hợp nhất kết quả từ YOLO Detection và YOLO Pose.
  - Box từ Pose được dán nhãn `Khách thuê (YOLOv11 Pose AI)`.
  - Giữ lại các box người nằm ngang (`w > h * 1.15`) với ngưỡng nhạy mở rộng.
  - Ngưỡng IoU của NMS nâng lên **0.65** (chỉ loại bỏ box khi thực sự trùng lặp 1 người, không triệt tiêu người ngồi cạnh).

### Thành phần 2: Client Edge AI & NMS Fusion (`frontend/src/app/components/admin/admin.ts`)
- **Tái cấu trúc triệt để `consolidateAndMergeDetections`:**
  - HỦY BỎ điều kiện sai lệch `isSamePersonBodyParts = deltaX <= maxW * 0.45 && deltaY <= maxH * 0.85` (thủ phạm chính nuốt 5 người thành 3).
  - Chỉ gộp `Face AI` vào `Body` nếu tâm khuôn mặt thực sự nằm bên trong nửa trên của Body box.
  - Hai box `person` riêng biệt chỉ được gộp khi `IoU >= 0.65` (gần như trùng khít hoàn toàn).
- **Cải tiến Post-Tracking Fusion:**
  - Nâng ngưỡng gộp theo dõi từ `IoU >= 0.25 || IoS >= 0.45` lên `IoU >= 0.65 || IoS >= 0.85`.
- **Hỗ trợ người nằm trên Client COCO-SSD:**
  - Bổ sung bộ lọc Adaptive Aspect Ratio: Khi box nằm ngang (`w > h * 1.15`), hạ ngưỡng điểm nhận diện từ 0.20 xuống 0.12 để bắt trọn người nằm nghỉ/thư giãn.
  - Hiển thị nhãn trực quan `Khách thuê (Tư thế nằm)` trên Canvas.
- **Khử rung sĩ số thông minh:**
  - Tối ưu buffer debounce sĩ số để không bị ghim ở giá trị mode thấp khi sĩ số thực tế đang ổn định ở 5 người.

## 3. Kế hoạch kiểm thử & Đánh giá
1. Kiểm tra khởi động YOLO Microservice với Dual-Head (Detection + Pose).
2. Kiểm tra biên dịch TypeScript frontend (`npm run build`).
3. Kiểm tra trường hợp 5 người ngồi gần nhau: Đảm bảo không gộp nhầm, giữ đủ 5/5.
4. Kiểm tra trường hợp người nằm ngang / gục đầu: Bắt trọn thông qua Pose keypoint và Adaptive Aspect Ratio.
