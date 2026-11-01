"""
UEL Space - YOLO26 Occupancy Training & ONNX Web Export Pipeline
Huấn luyện YOLO26 trên GPU cá nhân (NVIDIA RTX) và xuất file ONNX chuẩn Web
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
DATASET_YAML = os.path.join(BASE_DIR, "datasets", "smartclass_yolo26", "smartclass_yolo26.yaml")
WEIGHTS_PRETRAINED = os.path.join(BASE_DIR, "yolo26n.pt")
OUTPUT_RUNS_DIR = os.path.join(BASE_DIR, "runs", "train")

def run_training():
    print("=" * 65)
    print("🚀 BẮT ĐẦU QUY TRÌNH FINE-TUNE YOLO26 NANO OCCUPANCY MODEL")
    print("=" * 65)

    # 1. Kiểm tra tài nguyên GPU / Device
    has_cuda = torch.cuda.is_available()
    device = 0 if has_cuda else "cpu"
    if has_cuda:
        gpu_name = torch.cuda.get_device_name(0)
        vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 * 1024)
        print(f"🔥 Phát hiện GPU: {gpu_name} ({vram_mb:.0f} MB VRAM)")
        batch_size = 16 if vram_mb >= 6000 else 8
    else:
        print("⚠️ Không phát hiện PyTorch CUDA, huấn luyện trên CPU...")
        batch_size = 4

    # 2. Kiểm tra file cấu hình dataset và trọng số khởi tạo
    if not os.path.exists(DATASET_YAML):
        print(f"❌ Chưa có tệp dataset yaml tại: {DATASET_YAML}")
        print("👉 Vui lòng chạy script 'prepare_smartclass_yolo26.py' trước!")
        return

    if not os.path.exists(WEIGHTS_PRETRAINED):
        alt_weight = os.path.join(BASE_DIR, "my-server-mongodb", "src", "ai-service", "yolo26n.pt")
        if os.path.exists(alt_weight):
            pretrained = alt_weight
        else:
            pretrained = "yolo26n.pt"
    else:
        pretrained = WEIGHTS_PRETRAINED

    print(f"📦 Trọng số khởi tạo: {pretrained}")
    print(f"📄 Dataset YAML: {DATASET_YAML}")
    print(f"⚡ Batch size: {batch_size} | Thiết bị: {device}")

    # 3. Nạp mô hình YOLO26
    model = YOLO(pretrained)

    # 4. Huấn luyện (Transfer Learning)
    # Tối ưu cho RTX 3050 4GB: imgsz=640, amp=True (FP16), workers=4
    epochs = 25
    print(f"\n⏳ Bắt đầu huấn luyện {epochs} epochs...")
    results = model.train(
        data=DATASET_YAML,
        epochs=epochs,
        imgsz=640,
        batch=batch_size,
        device=device,
        amp=has_cuda,
        workers=2,
        project=OUTPUT_RUNS_DIR,
        name="yolo26_smartclass_occupancy",
        exist_ok=True,
        save=True,
        plots=True
    )

    best_pt = os.path.join(OUTPUT_RUNS_DIR, "yolo26_smartclass_occupancy", "weights", "best.pt")
    if not os.path.exists(best_pt):
        best_pt = model.trainer.best if hasattr(model, 'trainer') and hasattr(model.trainer, 'best') else pretrained

    print("\n" + "=" * 65)
    print(f"🎉 HUẤN LUYỆN HOÀN TẤT! Trọng số tối ưu nhất: {best_pt}")
    print("=" * 65)

    # 5. Xuất ra định dạng ONNX phục vụ Web (ONNX Runtime Web / Angular)
    print("\n🌐 Đang xuất mô hình sang chuẩn ONNX cho Web Client...")
    export_model = YOLO(best_pt)
    onnx_path = export_model.export(
        format="onnx",
        imgsz=640,
        dynamic=True,
        simplify=True,
        opset=17
    )

    print(f"✅ Xuất ONNX thành công: {onnx_path}")

    # 6. Tự động đồng bộ file ONNX vào Frontend Public và Server AI Service
    target_frontend_dir = os.path.join(BASE_DIR, "frontend", "public", "models")
    target_server_dir = os.path.join(BASE_DIR, "my-server-mongodb", "src", "ai-service")
    os.makedirs(target_frontend_dir, exist_ok=True)

    dest_frontend_onnx = os.path.join(target_frontend_dir, "yolo26n_occupancy.onnx")
    dest_server_onnx = os.path.join(target_server_dir, "yolo26n_occupancy.onnx")
    dest_root_onnx = os.path.join(BASE_DIR, "yolo26n_occupancy.onnx")

    shutil.copy2(onnx_path, dest_frontend_onnx)
    shutil.copy2(onnx_path, dest_server_onnx)
    shutil.copy2(onnx_path, dest_root_onnx)

    print(f"📁 Đã đồng bộ sang Frontend: {dest_frontend_onnx}")
    print(f"📁 Đã đồng bộ sang Server AI: {dest_server_onnx}")
    print(f"📁 Đã lưu bản gốc tại Root: {dest_root_onnx}")
    print("=" * 65)
    print("🚀 SẴN SÀNG CHẠY TRỰC TIẾP TRÊN TRÌNH DUYỆT BẰNG ONNX RUNTIME WEB!")
    print("=" * 65)

if __name__ == "__main__":
    run_training()

