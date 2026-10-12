"""
UEL Space - YOLOv11 Server AI Occupancy Detection Microservice
FastAPI + Ultralytics YOLOv11 SOTA Vision Model
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

app = FastAPI(title="UEL Space YOLOv11 Occupancy AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO11 model
try:
    from ultralytics import YOLO
    model_path = os.environ.get("YOLO_MODEL_PATH")
    if not model_path:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(script_dir, "yolo11n.pt"),
            os.path.join(os.getcwd(), "yolo11n.pt"),
            os.path.join(script_dir, "..", "yolo11n.pt"),
            os.path.join(script_dir, "..", "..", "yolo11n.pt"),
            "yolo11n.pt"
        ]
        for p in candidates:
            if os.path.isfile(p):
                model_path = p
                break
        if not model_path:
            model_path = "yolo11n.pt"

    logger.info(f"Loading YOLO11 model from: {model_path}...")
    yolo_model = YOLO(model_path)
    logger.info("YOLO11 model initialized successfully!")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")
    yolo_model = None

class DetectRequest(BaseModel):
    image: str  # Base64 data URL or raw base64 string
    confidenceThreshold: Optional[float] = 0.25
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
        "model": "YOLOv11 Ultralytics",
        "ready": yolo_model is not None,
        "classes": ["person"],
        "timestamp": time.time()
    }

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

        # Run YOLO11 inference focusing on class 0 (person)
        conf = req.confidenceThreshold if req.confidenceThreshold is not None else 0.25
        iou = req.iouThreshold if req.iouThreshold is not None else 0.45

        # classes=[0] filters exclusively for person objects
        results = yolo_model.predict(
            source=pil_image,
            conf=conf,
            iou=iou,
            classes=[0],
            verbose=False
        )

        detected_boxes: List[BoundingBox] = []
        confidences = []

        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                # xyxy format: [x1, y1, x2, y2]
                xyxy = box.xyxy[0].tolist()
                score = float(box.conf[0].item())
                cls_id = int(box.cls[0].item())

                x1, y1, x2, y2 = xyxy
                bx = max(0.0, x1)
                by = max(0.0, y1)
                bw = min(float(img_w), x2) - bx
                bh = min(float(img_h), y2) - by

                if bw > 10 and bh > 10:
                    detected_boxes.append(BoundingBox(
                        x=round(bx, 1),
                        y=round(by, 1),
                        w=round(bw, 1),
                        h=round(bh, 1),
                        confidence=round(score * 100, 1),
                        label="Khách thuê / Nhân sự"
                    ))
                    confidences.append(score)

        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        avg_conf = round(float(np.mean(confidences)) * 100, 1) if confidences else 0.0

        return DetectResponse(
            success=True,
            count=len(detected_boxes),
            confidence=avg_conf,
            boxes=detected_boxes,
            processingTimeMs=elapsed_ms,
            modelName="YOLOv11 SOTA (Ultralytics Server AI)",
            device=str(yolo_model.device)
        )

    except Exception as e:
        logger.error(f"Detection error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting UEL Space YOLOv11 AI Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
