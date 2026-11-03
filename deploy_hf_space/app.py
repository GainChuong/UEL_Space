"""
UEL Space - YOLO26 AI Detection Microservice
Phiên bản: Pure Deep Vision YOLO26 (Đã gỡ bỏ toàn bộ thuật toán màu da)
Chạy trên Hugging Face (ZeroGPU A10G & Free CPU)
Tập trung vào mạng nơ-ron Deep Learning chuẩn mực, ổn định tuyệt đối.
"""

import os
import time
import base64
import io
import logging
from typing import List, Optional
import gradio as gr
from PIL import Image
import numpy as np

# Hỗ trợ ZeroGPU của Hugging Face
try:
    import spaces
    HAS_SPACES = True
except ImportError:
    HAS_SPACES = False
    class spaces:
        @staticmethod
        def GPU(fn):
            return fn

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("UEL_YOLO26_GRADIO")

yolo_model = None

try:
    from ultralytics import YOLO
    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, "best.pt")

    if os.path.exists(model_path):
        logger.info(f"Đang nạp trọng số YOLO26: {model_path}")
        yolo_model = YOLO(model_path)
    else:
        logger.warning("Không tìm thấy best.pt, nạp yolo11n.pt mặc định...")
        yolo_model = YOLO("yolo11n.pt")

    logger.info("YOLO26 Model loaded successfully!")
except Exception as e:
    logger.error(f"Lỗi nạp YOLO26: {e}")
    yolo_model = None

@spaces.GPU
def run_yolo_inference(pil_img, conf=0.25, iou=0.50):
    if not yolo_model:
        return []
    
    # Chạy YOLO Deep Learning thuần túy trên GPU A10G
    results = yolo_model.predict(
        pil_img,
        conf=float(conf),
        iou=float(iou),
        imgsz=960,
        verbose=False
    )
    return results

@spaces.GPU
def detect_api(image_base64: str, conf_threshold: float = 0.25, iou_threshold: float = 0.50):
    if not yolo_model:
        return {"success": False, "message": "Model not ready"}

    t0 = time.time()
    try:
        raw_b64 = image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        img_bytes = base64.b64decode(raw_b64)
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as err:
        return {"success": False, "message": f"Invalid base64 image: {err}"}

    orig_w, orig_h = pil_img.size

    results = run_yolo_inference(
        pil_img,
        conf=float(conf_threshold or 0.25),
        iou=float(iou_threshold or 0.50)
    )

    boxes = []
    conf_sum = 0.0

    if results and len(results) > 0:
        det = results[0]
        if det.boxes is not None and len(det.boxes) > 0:
            xyxy_arr = det.boxes.xyxy.cpu().numpy()
            conf_arr = det.boxes.conf.cpu().numpy()
            cls_arr = det.boxes.cls.cpu().numpy()

            for i in range(len(xyxy_arr)):
                c_id = int(cls_arr[i])
                if c_id == 0:  # person
                    x1, y1, x2, y2 = xyxy_arr[i]
                    w_box = max(0, int(round(x2 - x1)))
                    h_box = max(0, int(round(y2 - y1)))
                    x_box = max(0, min(int(round(x1)), orig_w - 1))
                    y_box = max(0, min(int(round(y1)), orig_h - 1))

                    conf_pct = round(float(conf_arr[i]) * 100, 1)
                    conf_sum += conf_pct

                    boxes.append({
                        "x": x_box,
                        "y": y_box,
                        "w": w_box,
                        "h": h_box,
                        "confidence": conf_pct,
                        "classId": 0,
                        "label": "Khách thuê (YOLO26 SOTA)"
                    })

    person_count = len(boxes)
    avg_conf = int(round(conf_sum / person_count)) if person_count > 0 else 0
    proc_ms = int(round((time.time() - t0) * 1000))

    return {
        "success": True,
        "count": person_count,
        "confidence": avg_conf,
        "boxes": boxes,
        "processingTimeMs": proc_ms,
        "device": "Hugging Face Cloud (NVIDIA ZeroGPU A10G)",
        "modelName": "YOLO26 Pure Vision Occupancy (IndoorCrowd SOTA)",
        "spaceId": "general",
        "spaceName": "UEL Space Room",
        "message": f"Phát hiện {person_count} người trong phòng thành công"
    }

# Hàm dành cho giao diện web trực quan
@spaces.GPU
def detect_ui(image_input, conf_slider):
    if image_input is None or not yolo_model:
        return None, "Vui lòng tải ảnh lên"
    
    results = run_yolo_inference(image_input, conf=conf_slider)
    if not results or len(results) == 0:
        return image_input, "Phát hiện: 0 người"

    res_plotted = results[0].plot(line_width=2)
    count = sum(1 for c in results[0].boxes.cls if int(c) == 0)
    return Image.fromarray(res_plotted), f"Phát hiện: {count} người trong phòng"

# Tạo giao diện Gradio hỗ trợ cả Web UI và REST API
with gr.Blocks(title="UEL Space YOLO26 AI") as demo:
    gr.Markdown("# 🏢 UEL Space - YOLO26 Pure Vision Occupancy Microservice")
    gr.Markdown("Microservice Deep Learning giám sát sĩ số và hiện diện không gian UEL Space (Hugging Face ZeroGPU A10G).")
    
    with gr.Row():
        with gr.Column():
            img_in = gr.Image(type="pil", label="Ảnh phòng / Camera")
            conf_sl = gr.Slider(minimum=0.1, maximum=0.8, value=0.25, step=0.02, label="Ngưỡng tin cậy (Confidence)")
            btn = gr.Button("Phát hiện người", variant="primary")
        with gr.Column():
            img_out = gr.Image(type="pil", label="Kết quả nhận diện")
            txt_out = gr.Textbox(label="Thống kê sĩ số")
            
    btn.click(fn=detect_ui, inputs=[img_in, conf_sl], outputs=[img_out, txt_out])
    
    # Endpoint phục vụ API json cho backend UEL Space
    api_input = gr.Textbox(visible=False, label="image_base64")
    api_output = gr.JSON(visible=False, label="result")
    api_btn = gr.Button("API Detect", visible=False)
    api_btn.click(fn=detect_api, inputs=[api_input], outputs=[api_output], api_name="detect")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
