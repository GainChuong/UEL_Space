"""
UEL Space - YOLO11-IndoorCrowd Server AI Occupancy Detection Microservice
FastAPI + Ultralytics YOLO11 Fine-tuned on IndoorCrowd Dataset (CUDA Accelerated)
Pure Vision Detection - Sub-5ms GPU Turbo Mode with Warmup and torch.inference_mode()
"""

import os
import sys
import time
import base64
import io
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("UEL_YOLO11")

app = FastAPI(title="UEL Space YOLO11 IndoorCrowd Occupancy AI (Turbo GPU)", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Device Selection & Model Initialization
yolo_model = None
yolo_seg_model = None
device_name = "CPU"
target_device = "cpu"

try:
    import torch
    from ultralytics import YOLO

    has_cuda = torch.cuda.is_available()
    if has_cuda:
        target_device = "cuda:0"
        gpu_name = torch.cuda.get_device_name(0)
        device_name = f"{gpu_name} (CUDA Turbo)"
        logger.info(f"🚀 CUDA Detected: {device_name}")
    else:
        target_device = "cpu"
        device_name = "CPU"
        logger.info("⚡ Running on CPU device")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # 1.1 Detection Model (YOLO11 Detection)
    det_candidates = [
        os.path.join(script_dir, "models", "best.pt"),
        os.path.join(script_dir, "best.pt"),
        os.path.join(root_dir, "runs", "train", "yolo26_indoor_crowd_occupancy", "weights", "best.pt"),
        os.environ.get("YOLO_MODEL_PATH"),
        os.path.join(script_dir, "yolo11n.pt"),
        "yolo11n.pt"
    ]
    det_path = next((p for p in det_candidates if p and os.path.isfile(p)), "yolo11n.pt")
    logger.info(f"Loading YOLO11-IndoorCrowd Detection model from: {det_path}...")
    yolo_model = YOLO(det_path)
    if has_cuda:
        yolo_model.to(target_device)

    # 1.2 Segmentation Model (YOLO11n-seg Fine-tuned on IndoorCrowd)
    seg_candidates = [
        os.path.join(script_dir, "models", "yolo11n_indoor_crowd_seg.pt"),
        os.path.join(root_dir, "runs", "segment", "yolo11n_indoor_crowd_seg", "weights", "best.pt"),
        os.path.join(script_dir, "yolo11n-seg.pt"),
        "yolo11n-seg.pt"
    ]
    seg_path = next((p for p in seg_candidates if p and os.path.isfile(p)), None)
    if seg_path:
        logger.info(f"Loading YOLO11n-seg Segmentation model from: {seg_path}...")
        yolo_seg_model = YOLO(seg_path)
        if has_cuda:
            yolo_seg_model.to(target_device)
        logger.info(f"🔥 YOLO11n-seg model ({os.path.basename(seg_path)}) initialized successfully on: {device_name}!")

    # Warmup pass so the first user frame has zero CUDA compilation latency
    try:
        dummy = np.zeros((640, 640, 3), dtype=np.uint8)
        with torch.inference_mode():
            if yolo_model:
                yolo_model.predict(source=dummy, verbose=False, device=target_device)
            if yolo_seg_model:
                yolo_seg_model.predict(source=dummy, verbose=False, device=target_device)
        logger.info("🔥 YOLO11 GPU Kernel Warmup completed successfully!")
    except Exception as ew:
        logger.warning(f"Warmup warning: {ew}")

    logger.info(f"Dual-Head Ensemble AI (Detection + Segmentation) ready on: {device_name}!")

except Exception as e:
    logger.error(f"Failed to load YOLO11 models: {e}")

class DetectRequest(BaseModel):
    image: str  # Base64 data URL or raw base64 string
    confidenceThreshold: Optional[float] = 0.28
    iouThreshold: Optional[float] = 0.45
    spaceId: Optional[str] = "general"
    spaceName: Optional[str] = "UEL Space Room"

class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float
    confidence: float
    label: str

class DetectResponse(BaseModel):
    success: bool
    count: int
    confidence: float
    boxes: List[BoundingBox]
    polygons: Optional[List[List[List[float]]]] = None  # Đa giác viền phân đoạn từng người [[ [x, y], ... ]]
    processingTimeMs: float
    modelName: str
    device: str

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "model": "YOLO11-IndoorCrowd Pure Vision SOTA",
        "ready": yolo_model is not None,
        "classes": ["person"],
        "timestamp": time.time(),
        "device": device_name
    }

def compute_iou(boxA, boxB):
    # box = [x, y, w, h]
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    interArea = interW * interH

    areaA = boxA[2] * boxA[3]
    areaB = boxB[2] * boxB[3]
    unionArea = areaA + areaB - interArea

    return interArea / unionArea if unionArea > 0 else 0.0

def compute_ios(boxA, boxB):
    """Intersection over Smaller (Độ bao bọc của box nhỏ trong box lớn)"""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    interArea = interW * interH

    areaA = boxA[2] * boxA[3]
    areaB = boxB[2] * boxB[3]
    minArea = min(areaA, areaB)

    return interArea / minArea if minArea > 0 else 0.0

def merge_and_suppress_subboxes(candidates: List[dict], iou_thresh: float = 0.45, max_aspect_ratio: float = 2.6) -> List[dict]:
    """
    Thuật toán NMS Giải phẫu Hình học Cơ thể Người SOTA:
    1. Lọc hiện tượng box con (đầu/thân/áo) lồng trong box người lớn (IoS >= 0.50).
    2. Gộp hiện tượng Xếp chồng trục dọc (Vertical Column Merging: Đầu nằm trên Thân).
    3. Chặn trần tỷ lệ nhân trắc học H/W <= 2.6 để tuyệt đối không gộp 2 người trước-sau.
    """
    if len(candidates) <= 1:
        return candidates

    # Sắp xếp ứng viên theo điểm tin cậy giảm dần
    sorted_cands = sorted(candidates, key=lambda c: c["score"], reverse=True)
    merged: List[dict] = []

    for cand in sorted_cands:
        b = cand["box"]  # [x, y, w, h]
        score = cand["score"]
        is_subpart = False

        for m in merged:
            mb = m["box"]

            iou = compute_iou(b, mb)
            ios = compute_ios(b, mb)

            # Tính tâm ngang trục X
            center_b_x = b[0] + b[2] / 2.0
            center_m_x = mb[0] + mb[2] / 2.0
            x_dist = abs(center_b_x - center_m_x)
            min_width = min(b[2], mb[2])

            # Cùng dải cột dọc X (độ lệch trục X < 45% bề ngang)
            is_same_column = x_dist < min_width * 0.45

            # Hộp bao ngoài giả định nếu hợp nhất
            union_x1 = min(b[0], mb[0])
            union_y1 = min(b[1], mb[1])
            union_x2 = max(b[0] + b[2], mb[0] + mb[2])
            union_y2 = max(b[1] + b[3], mb[1] + mb[3])
            union_w = union_x2 - union_x1
            union_h = union_y2 - union_y1
            union_ar = union_h / max(1.0, union_w)

            # Quy tắc 1: IoS >= 50% (Box nhỏ là mảnh vỡ lọt lòng trong box lớn) hoặc IoU >= iou_thresh
            if iou >= iou_thresh or ios >= 0.50:
                is_subpart = True
                m["box"] = [union_x1, union_y1, union_w, union_h]
                m["score"] = max(m["score"], score)
                if cand.get("poly") and not m.get("poly"):
                    m["poly"] = cand["poly"]
                break

            # Quy tắc 2: Xếp chồng trục dọc (Đầu nằm ngay trên Thân trên cùng 1 người)
            y_overlap = min(b[1] + b[3], mb[1] + mb[3]) - max(b[1], mb[1])
            y_gap = max(b[1], mb[1]) - min(b[1] + b[3], mb[1] + mb[3])

            if is_same_column and (y_overlap > 0 or y_gap < min(b[3], mb[3]) * 0.35):
                if union_ar <= max_aspect_ratio:
                    is_subpart = True
                    m["box"] = [union_x1, union_y1, union_w, union_h]
                    m["score"] = max(m["score"], score)
                    if cand.get("poly") and not m.get("poly"):
                        m["poly"] = cand["poly"]
                    break

        if not is_subpart:
            merged.append(dict(cand))

    return merged

@app.post("/detect", response_model=DetectResponse)
def detect_occupancy(req: DetectRequest):
    if not yolo_model and not yolo_seg_model:
        raise HTTPException(status_code=503, detail="YOLO11 models are not loaded yet")

    start_time = time.time()
    try:
        # Decode base64 image
        image_data = req.image
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_w, img_h = pil_image.size

        # Default confidence: 0.28 (optimal balance on IndoorCrowd F1-curve), NMS IoU: 0.45
        base_conf = float(req.confidenceThreshold) if req.confidenceThreshold is not None else 0.28
        iou_thresh = float(req.iouThreshold) if req.iouThreshold is not None else 0.45

        raw_candidates = []
        import torch

        # 1. Chạy YOLO11n-seg Segmentation (Ưu tiên SOTA để lấy Mask Đa giác)
        if yolo_seg_model is not None:
            with torch.inference_mode():
                seg_results = yolo_seg_model.predict(
                    source=pil_image,
                    conf=base_conf,
                    iou=iou_thresh,
                    classes=[0],
                    device=target_device,
                    verbose=False
                )
            if len(seg_results) > 0 and seg_results[0].boxes is not None:
                s_boxes = seg_results[0].boxes
                s_masks = seg_results[0].masks
                for i, box in enumerate(s_boxes):
                    xyxy = box.xyxy[0].tolist()
                    score = float(box.conf[0].item())
                    bx = max(0.0, xyxy[0])
                    by = max(0.0, xyxy[1])
                    bw = min(float(img_w), xyxy[2]) - bx
                    bh = min(float(img_h), xyxy[3]) - by
                    if bw < 12 or bh < 14:
                        continue

                    poly_pts = []
                    if s_masks is not None and len(s_masks.xy) > i:
                        raw_poly = s_masks.xy[i]
                        if len(raw_poly) >= 3:
                            # Đơn giản hóa đa giác polygon để gửi siêu tốc qua JSON
                            eps = 0.004 * cv2.arcLength(raw_poly.astype(np.float32), True)
                            approx = cv2.approxPolyDP(raw_poly.astype(np.float32), max(1.5, eps), True).reshape(-1, 2)
                            poly_pts = [[round(float(pt[0]), 1), round(float(pt[1]), 1)] for pt in approx]

                    raw_candidates.append({
                        "box": [bx, by, bw, bh],
                        "score": score,
                        "poly": poly_pts,
                        "label": "Khách thuê (YOLO11 • Ensemble Vision)"
                    })

        # 2. Chạy YOLO11 Detection bổ trợ (nếu có)
        if yolo_model is not None:
            with torch.inference_mode():
                det_results = yolo_model.predict(
                    source=pil_image,
                    conf=base_conf,
                    iou=iou_thresh,
                    classes=[0],
                    device=target_device,
                    verbose=False
                )
            if len(det_results) > 0 and det_results[0].boxes is not None:
                d_boxes = det_results[0].boxes
                for box in d_boxes:
                    xyxy = box.xyxy[0].tolist()
                    score = float(box.conf[0].item())
                    bx = max(0.0, xyxy[0])
                    by = max(0.0, xyxy[1])
                    bw = min(float(img_w), xyxy[2]) - bx
                    bh = min(float(img_h), xyxy[3]) - by
                    if bw < 14 or bh < 18:
                        continue
                    ar = bw / bh
                    if ar > 2.2 or ar < 0.12:
                        continue
                    raw_candidates.append({
                        "box": [bx, by, bw, bh],
                        "score": score,
                        "poly": [],
                        "label": "Khách thuê (YOLO11 • Indoor Crowd)"
                    })

        # 3. Áp dụng bộ lọc NMS Hình học Giải phẫu & Chống vỡ mảnh box
        final_boxes = merge_and_suppress_subboxes(raw_candidates, iou_thresh=iou_thresh, max_aspect_ratio=2.6)

        detected_boxes: List[BoundingBox] = []
        final_polygons: List[List[List[float]]] = []
        confidences = []
        for f in final_boxes:
            bx, by, bw, bh = f["box"]
            score = f["score"]
            detected_boxes.append(BoundingBox(
                x=round(bx, 1),
                y=round(by, 1),
                w=round(bw, 1),
                h=round(bh, 1),
                confidence=round(score * 100, 1),
                label=f["label"]
            ))
            confidences.append(score)
            if f.get("poly") and len(f["poly"]) >= 3:
                final_polygons.append(f["poly"])
            else:
                # Nếu box không có mask (từ det thuần), tạo đa giác chữ nhật bo góc nhẹ
                final_polygons.append([
                    [round(bx, 1), round(by, 1)],
                    [round(bx + bw, 1), round(by, 1)],
                    [round(bx + bw, 1), round(by + bh, 1)],
                    [round(bx, 1), round(by + bh, 1)]
                ])

        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        avg_conf = round(float(np.mean(confidences)) * 100, 1) if confidences else 0.0

        model_desc = f"YOLO11 Dual-Head Ensemble (Det + Seg) ({device_name})"

        return DetectResponse(
            success=True,
            count=len(detected_boxes),
            confidence=avg_conf,
            boxes=detected_boxes,
            polygons=final_polygons,
            processingTimeMs=elapsed_ms,
            modelName=model_desc,
            device=device_name
        )

    except Exception as e:
        logger.error(f"Detection error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting UEL Space YOLO11 AI Service on port {port} with {device_name}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
