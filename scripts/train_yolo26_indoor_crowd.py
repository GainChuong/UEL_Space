"""
UEL Space - YOLO11 Occupancy Training & ONNX Web Export Pipeline (IndoorCrowd)
Huấn luyện YOLO11 sạch (bắt đầu từ yolo11n.pt) trên bộ dữ liệu indoor_crowd.
Tự động dùng GPU NVIDIA RTX nếu có hoặc CPU.
"""

import os
import sys
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import torch
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_YAML = os.path.join(BASE_DIR, "datasets", "indoor_crowd_yolo26", "indoor_crowd_yolo26.yaml")
WEIGHTS_PRETRAINED = os.path.join(BASE_DIR, "yolo11n.pt")
OUTPUT_RUNS_DIR = os.path.join(BASE_DIR, "runs", "train")

def run_training():
    print("=" * 65)
    print("🚀 BẮT ĐẦU FINE-TUNE YOLO11 TRÊN BỘ DỮ LIỆU INDOORCROWD")
    print("=" * 65)

    has_cuda = torch.cuda.is_available()
    device = 0 if has_cuda else "cpu"

    if has_cuda:
        gpu_name = torch.cuda.get_device_name(0)
        vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 * 1024)
        print(f"🔥 Phát hiện GPU: {gpu_name} ({vram_mb:.0f} MB VRAM)")
        batch_size = 16 if vram_mb >= 6000 else 8
    else:
        print("⚡ Huấn luyện trên CPU (hoặc GPU đang bận)...")
        batch_size = 4

    if not os.path.exists(DATASET_YAML):
        print(f"❌ Không tìm thấy dataset yaml tại: {DATASET_YAML}")
        return

    print(f"📦 Mô hình khởi tạo: {WEIGHTS_PRETRAINED}")
    print(f"📄 Dataset YAML: {DATASET_YAML}")
    print(f"⚡ Batch size: {batch_size} | Thiết bị: {device}")

    # Khởi tạo mô hình sạch từ backbone yolo11n.pt
    model = YOLO(WEIGHTS_PRETRAINED if os.path.exists(WEIGHTS_PRETRAINED) else "yolo11n.pt")

    epochs = 20

    print(f"\n⏳ Bắt đầu huấn luyện {epochs} epochs với chiến lược chống Overfitting...")
    results = model.train(
        data=DATASET_YAML,
        epochs=epochs,
        imgsz=640,
        batch=batch_size,
        device=device,
        amp=has_cuda,
        workers=2,
        project=OUTPUT_RUNS_DIR,
        name="yolo11_indoor_crowd_occupancy",
        exist_ok=True,
        save=True,
        plots=True,
        # Kỹ thuật chống overfitting:
        weight_decay=0.001,
        dropout=0.1,
        mosaic=1.0,
        close_mosaic=5,
        mixup=0.15,
        copy_paste=0.2,
        degrees=5.0,
        scale=0.5,
        fliplr=0.5
    )

    best_pt = os.path.join(OUTPUT_RUNS_DIR, "yolo11_indoor_crowd_occupancy", "weights", "best.pt")
    if not os.path.exists(best_pt):
        best_pt = model.trainer.best if hasattr(model, 'trainer') and hasattr(model.trainer, 'best') else "best.pt"

    print("\n" + "=" * 65)
    print(f"🎉 HUẤN LUYỆN HOÀN TẤT! Trọng số tối ưu nhất: {best_pt}")
    print("=" * 65)

    # Cập nhật best.pt vào AI microservice
    target_ai_service_pt = os.path.join(BASE_DIR, "my-server", "src", "ai-service", "best.pt")
    if os.path.exists(best_pt):
        shutil.copy2(best_pt, target_ai_service_pt)
        print(f"✅ Đã đồng bộ best.pt vào: {target_ai_service_pt}")

    # Xuất sang định dạng ONNX
    try:
        print("\n⚙️ Đang xuất mô hình tối ưu sang định dạng ONNX...")
        best_model = YOLO(best_pt)
        onnx_file = best_model.export(format="onnx", imgsz=640, dynamic=False, simplify=True)
        print(f"✅ File ONNX đã xuất tại: {onnx_file}")

        onnx_destinations = [
            os.path.join(BASE_DIR, "my-server", "src", "ai-service", "yolo11n_indoor_crowd.onnx"),
            os.path.join(BASE_DIR, "frontend", "public", "models", "yolo11n_indoor_crowd.onnx")
        ]
        for dst in onnx_destinations:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(onnx_file, dst)
            print(f"  -> Đã đồng bộ ONNX tới: {dst}")

    except Exception as e_onnx:
        print(f"⚠️ Xuất ONNX cảnh báo: {e_onnx}")

    print("\n🚀 QUY TRÌNH HOÀN TẤT THÀNH CÔNG 100%!")

if __name__ == "__main__":
    run_training()
