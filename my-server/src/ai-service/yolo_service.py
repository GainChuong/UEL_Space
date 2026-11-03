"""
UEL Space - YOLO11-IndoorCrowd Server AI Occupancy Detection Microservice
FastAPI + Ultralytics YOLO11 Fine-tuned on IndoorCrowd Dataset (Pure Vision Detection)
No Pose estimation, no clutter - single streamlined high-precision person detector.
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

app = FastAPI(title="UEL Space YOLO11 IndoorCrowd Occupancy AI", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load YOLO11-IndoorCrowd Fine-tuned Detection Model
yolo_model = None

try:
    from ultralytics import YOLO
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    det_candidates = [
        os.path.join(script_dir, "best.pt"),
        os.path.join(root_dir, "runs", "train", "yolo26_indoor_crowd_occupancy", "weights", "best.pt"),
        os.environ.get("YOLO_MODEL_PATH"),
        os.path.join(script_dir, "yolo11n.pt"),
        "yolo11n.pt"
    ]
    det_path = None
    for p in det_candidates:
        if p and os.path.isfile(p):
            det_path = p
            break

    if not det_path:
        det_path = "yolo11n.pt"

    logger.info(f"Loading YOLO11-IndoorCrowd Detection model from: {det_path}...")
    yolo_model = YOLO(det_path)
    logger.info(f"YOLO11 Detection model ({os.path.basename(det_path)}) initialized successfully on device: {yolo_model.device}!")

except Exception as e:
    logger.error(f"Failed to load YOLO11 model: {e}")

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
        "device": str(yolo_model.device) if yolo_model else "offline"
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

        # Default confidence: 0.28 (optimal balance on IndoorCrowd F1-curve), NMS IoU: 0.45
        base_conf = float(req.confidenceThreshold) if req.confidenceThreshold is not None else 0.28
        iou_thresh = float(req.iouThreshold) if req.iouThreshold is not None else 0.45

        # Run pure YOLO11 Person Detection (Class 0: Person)
        det_results = yolo_model.predict(
            source=pil_image,
            conf=base_conf,
            iou=iou_thresh,
            classes=[0],
            verbose=False
        )

        raw_candidates = []
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

                # Minimum size filter
                if bw < 14 or bh < 18:
                    continue

                # Human aspect ratio filter: filters out flat tables, cardboard boxes, long wires
                ar = bw / bh
                if ar > 2.2 or ar < 0.12:
                    continue

                raw_candidates.append({
                    "box": [bx, by, bw, bh],
                    "score": score,
                    "label": "Khách thuê (YOLO11 • Indoor Crowd)"
                })

        # Greedy NMS deduplication
        raw_candidates.sort(key=lambda c: c["score"], reverse=True)
        final_boxes: List[dict] = []
        for cand in raw_candidates:
            c_box = cand["box"]
            is_dup = False
            for fb in final_boxes:
                if compute_iou(c_box, fb["box"]) >= iou_thresh:
                    is_dup = True
                    break
            if not is_dup:
                final_boxes.append(cand)

        detected_boxes: List[BoundingBox] = []
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

        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        avg_conf = round(float(np.mean(confidences)) * 100, 1) if confidences else 0.0

        model_desc = "YOLO11-IndoorCrowd Server AI (Python Native)"
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
    logger.info(f"Starting UEL Space YOLO11 AI Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
