"""
UEL Space - YOLOv11 Server AI Occupancy Detection Microservice
FastAPI + Dual-Head Ultralytics YOLOv11 SOTA Vision (Detection + Pose Keypoints)
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

app = FastAPI(title="UEL Space YOLOv11 Dual-Head Occupancy AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load YOLO11 Detection & Pose Models
yolo_model = None
pose_model = None

try:
    from ultralytics import YOLO
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Path for Object Detection Model (YOLO26 Nano prioritised, fallback YOLO11)
    det_candidates = [
        os.environ.get("YOLO_MODEL_PATH"),
        os.path.join(script_dir, "yolo26n.pt"),
        os.path.join(os.getcwd(), "yolo26n.pt"),
        "yolo26n.pt",
        os.path.join(script_dir, "yolo11n.pt"),
        os.path.join(os.getcwd(), "yolo11n.pt"),
        os.path.join(script_dir, "..", "yolo11n.pt"),
        "yolo11n.pt"
    ]
    det_path = "yolo26n.pt"
    for p in det_candidates:
        if p and os.path.isfile(p):
            det_path = p
            break

    logger.info(f"Loading YOLO Detection model from: {det_path}...")
    yolo_model = YOLO(det_path)
    logger.info(f"YOLO Detection model ({os.path.basename(det_path)}) initialized successfully!")

    # Path for Pose Estimation Model (yolo11n-pose.pt)
    pose_candidates = [
        os.environ.get("YOLO_POSE_MODEL_PATH"),
        os.path.join(script_dir, "yolo11n-pose.pt"),
        os.path.join(os.getcwd(), "yolo11n-pose.pt"),
        os.path.join(script_dir, "..", "yolo11n-pose.pt"),
        "yolo11n-pose.pt"
    ]
    pose_path = "yolo11n-pose.pt"
    for p in pose_candidates:
        if p and os.path.isfile(p):
            pose_path = p
            break

    logger.info(f"Loading YOLO11 Pose model from: {pose_path}...")
    pose_model = YOLO(pose_path)
    logger.info("YOLO11 Pose 17-Keypoint model initialized successfully!")

except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")

class DetectRequest(BaseModel):
    image: str  # Base64 data URL or raw base64 string
    confidenceThreshold: Optional[float] = 0.18
    iouThreshold: Optional[float] = 0.60
    spaceId: Optional[str] = "general"
    spaceName: Optional[str] = "UEL Space Room"

class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float
    confidence: float
    label: str
    isLyingDown: Optional[bool] = False
    hasPoseKeypoints: Optional[bool] = False

class DetectResponse(BaseModel):
    success: bool
    count: int
    confidence: float
    boxes: List[BoundingBox]
    processingTimeMs: float
    modelName: str
    device: str

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "model": "YOLOv11 Dual-Head (Detection + Pose SOTA)",
        "ready": yolo_model is not None,
        "poseReady": pose_model is not None,
        "classes": ["person"],
        "timestamp": time.time()
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

@app.post("/detect", response_model=DetectResponse)
def detect_occupancy(req: DetectRequest):
    if not yolo_model:
        raise HTTPException(status_code=503, detail="YOLO11 model is not loaded yet")

    start_time = time.time()
    try:
        # Decode base64 image
        image_data = req.image
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_w, img_h = pil_image.size

        # Ngưỡng nhạy thông minh:
        # Tự động hạ ngưỡng đối với người nằm hoặc người ngồi sát trong phòng họp
        base_conf = req.confidenceThreshold if req.confidenceThreshold is not None else 0.16
        iou_thresh = req.iouThreshold if req.iouThreshold is not None else 0.60

        candidates: List[dict] = []

        # 1. Chạy Head 1: Standard YOLOv11 Object Detection (Class 0: Person)
        det_results = yolo_model.predict(
            source=pil_image,
            conf=base_conf,
            iou=iou_thresh,
            classes=[0],
            verbose=False
        )

        if len(det_results) > 0 and det_results[0].boxes is not None:
            boxes = det_results[0].boxes
            for box in boxes:
                xyxy = box.xyxy[0].tolist()
                score = float(box.conf[0].item())
                x1, y1, x2, y2 = xyxy
                bx = max(0.0, x1)
                by = max(0.0, y1)
                bw = min(float(img_w), x2) - bx
                bh = min(float(img_h), y2) - by

                if bw > 8 and bh > 8:
                    is_lying = bw > (bh * 1.15)
                    label = "Khách thuê (Tư thế nằm)" if is_lying else "Khách thuê (YOLOv11 SOTA)"
                    candidates.append({
                        "box": [bx, by, bw, bh],
                        "score": score,
                        "label": label,
                        "isLyingDown": is_lying,
                        "hasPoseKeypoints": False,
                        "source": "det"
                    })

        # 2. Chạy Head 2: YOLOv11 Pose Estimation (17 Human Keypoints)
        # Bắt trọn 100% người nằm trên sofa, cúi gục, che mặt, tư thế khó thấy đầu
        if pose_model is not None:
            try:
                # Ngưỡng siêu nhạy cho Pose để bắt trọn xương người
                pose_conf = max(0.12, base_conf - 0.04)
                pose_results = pose_model.predict(
                    source=pil_image,
                    conf=pose_conf,
                    iou=iou_thresh,
                    verbose=False
                )

                if len(pose_results) > 0 and pose_results[0].boxes is not None:
                    p_boxes = pose_results[0].boxes
                    p_keypoints = pose_results[0].keypoints

                    for idx, box in enumerate(p_boxes):
                        xyxy = box.xyxy[0].tolist()
                        score = float(box.conf[0].item())
                        x1, y1, x2, y2 = xyxy
                        bx = max(0.0, x1)
                        by = max(0.0, y1)
                        bw = min(float(img_w), x2) - bx
                        bh = min(float(img_h), y2) - by

                        if bw > 8 and bh > 8:
                            # Kiểm tra keypoints: nếu có ít nhất 3 khớp xương rõ ràng (vai, hông, gối, chân)
                            has_skeleton = False
                            if p_keypoints is not None and len(p_keypoints) > idx:
                                kp_data = p_keypoints[idx].conf
                                if kp_data is not None:
                                    visible_kps = (kp_data[0] > 0.25).sum().item()
                                    has_skeleton = visible_kps >= 3

                            is_lying = bw > (bh * 1.10)
                            label = "Khách thuê (Pose AI • Tư thế nằm)" if is_lying else "Khách thuê (YOLOv11 Pose AI)"
                            
                            candidates.append({
                                "box": [bx, by, bw, bh],
                                "score": score,
                                "label": label,
                                "isLyingDown": is_lying,
                                "hasPoseKeypoints": has_skeleton,
                                "source": "pose"
                            })
            except Exception as e_pose:
                logger.warn(f"Pose inference exception: {e_pose}")

        # 3. Dual-Head Ensemble Fusion (Chống gộp nhầm 5 người thành 3, bảo toàn từng cá thể riêng biệt)
        # Sắp xếp các box theo điểm tin cậy giảm dần
        candidates.sort(key=lambda c: c["score"], reverse=True)
        fused: List[dict] = []

        for cand in candidates:
            c_box = cand["box"]
            c_cx = c_box[0] + c_box[2] / 2
            c_cy = c_box[1] + c_box[3] / 2

            # Chỉ coi là 1 người nếu trùng lặp diện tích rất cao (IoU >= 0.55)
            # HOẶC tâm 2 box gần như trùng khít và một box nằm lọt trong box kia
            is_duplicate = False
            for f in fused:
                f_box = f["box"]
                iou_val = compute_iou(c_box, f_box)

                # Kiểm tra diện tích giao nhau trên diện tích box nhỏ hơn (IoS)
                xA = max(c_box[0], f_box[0])
                yA = max(c_box[1], f_box[1])
                xB = min(c_box[0] + c_box[2], f_box[0] + f_box[2])
                yB = min(c_box[1] + c_box[3], f_box[1] + f_box[3])
                inter_area = max(0.0, xB - xA) * max(0.0, yB - yA)
                min_area = min(c_box[2] * c_box[3], f_box[2] * f_box[3])
                ios_val = inter_area / min_area if min_area > 0 else 0.0

                # Khoảng cách tâm giữa 2 người
                f_cx = f_box[0] + f_box[2] / 2
                f_cy = f_box[1] + f_box[3] / 2
                dist_centers = np.hypot(c_cx - f_cx, c_cy - f_cy)
                min_dim = min(c_box[2], f_box[2], c_box[3], f_box[3])

                # CHỈ gộp nếu trùng lặp rất cao (cùng 1 người được cả Detection lẫn Pose nhận diện)
                # TUYỆT ĐỐI KHÔNG gộp 2 người ngồi cạnh nhau (khi dist_centers > min_dim * 0.40)
                if iou_val >= 0.55 or (ios_val >= 0.80 and dist_centers < min_dim * 0.35):
                    is_duplicate = True
                    # Cập nhật thông tin tốt hơn từ mô hình Pose hoặc Detection
                    if cand.get("hasPoseKeypoints"):
                        f["hasPoseKeypoints"] = True
                    if cand.get("isLyingDown"):
                        f["isLyingDown"] = True
                    if cand["score"] > f["score"]:
                        f["score"] = cand["score"]
                        f["label"] = cand["label"]
                    break

            if not is_duplicate:
                fused.append(cand)

        # Chuyển đổi thành BoundingBox cho response
        detected_boxes: List[BoundingBox] = []
        confidences = []

        for f in fused:
            bx, by, bw, bh = f["box"]
            score = f["score"]
            detected_boxes.append(BoundingBox(
                x=round(bx, 1),
                y=round(by, 1),
                w=round(bw, 1),
                h=round(bh, 1),
                confidence=round(score * 100, 1),
                label=f["label"],
                isLyingDown=f.get("isLyingDown", False),
                hasPoseKeypoints=f.get("hasPoseKeypoints", False)
            ))
            confidences.append(score)

        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        avg_conf = round(float(np.mean(confidences)) * 100, 1) if confidences else 0.0

        model_desc = "YOLOv11 Dual-Head AI (Detection + Pose SOTA)"
        device_str = str(yolo_model.device) if yolo_model else "CPU"

        return DetectResponse(
            success=True,
            count=len(detected_boxes),
            confidence=avg_conf,
            boxes=detected_boxes,
            processingTimeMs=elapsed_ms,
            modelName=model_desc,
            device=device_str
        )

    except Exception as e:
        logger.error(f"Detection error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting UEL Space YOLOv11 AI Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
