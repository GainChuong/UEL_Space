import os
import sys
import shutil
import torch
from ultralytics import YOLO

def main():
    device = 0 if torch.cuda.is_available() else "cpu"
    device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    print(f"🔥 Bắt đầu huấn luyện YOLO11n-seg trên: {device_name} (CUDA Device {device})...")

    data_yaml = "D:/Học tập/3rd/PTWNC/DoAnCki/datasets/indoor_crowd_seg/indoor_crowd_seg.yaml"
    output_project = "D:/Học tập/3rd/PTWNC/DoAnCki/runs/segment"

    if not os.path.exists(data_yaml):
        print(f"❌ Không tìm thấy file cấu hình: {data_yaml}")
        sys.exit(1)

    # Nạp mô hình gốc YOLO11n-seg
    print("📦 Nạp weights gốc yolo11n-seg.pt...")
    model = YOLO("yolo11n-seg.pt")

    # Huấn luyện Transfer Learning 10 epochs
    print("🚀 Khởi chạy huấn luyện Transfer Learning 10 epochs (AMP Mixed Precision)...")
    results = model.train(
        data=data_yaml,
        epochs=10,
        imgsz=640,
        batch=8,  # Tối ưu cho RTX 3050 4GB VRAM
        device=device,
        workers=2,
        project=output_project,
        name="yolo11n_indoor_crowd_seg",
        exist_ok=True,
        amp=True,  # FP16 Tensor Cores acceleration
        patience=5,
        save=True,
        plots=True,
        verbose=True
    )

    best_weights = os.path.join(output_project, "yolo11n_indoor_crowd_seg", "weights", "best.pt")
    if not os.path.exists(best_weights):
        best_weights = os.path.join(output_project, "yolo11n_indoor_crowd_seg", "weights", "last.pt")

    print(f"🎉 Huấn luyện thành công! Weights tốt nhất tại: {best_weights}")

    target_dest = "D:/Học tập/3rd/PTWNC/DoAnCki/my-server/src/ai-service/models/yolo11n_indoor_crowd_seg.pt"
    os.makedirs(os.path.dirname(target_dest), exist_ok=True)
    shutil.copy2(best_weights, target_dest)
    print(f"✅ Đã sao chép mô hình vào AI Service: {target_dest}")

if __name__ == "__main__":
    main()

