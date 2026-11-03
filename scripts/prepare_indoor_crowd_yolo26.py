"""
UEL Space - Download & Prepare IndoorCrowd Dataset for YOLO26
Tải từ Hugging Face 'sebnae/IndoorCrowd' (config 'obj_det_seg'),
chuyển đổi bbox chuẩn YOLO (class 0: person), chia Train/Val cân đối.
"""

import os
import sys
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from huggingface_hub import login
from datasets import load_dataset

HF_TOKEN = "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"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "datasets", "indoor_crowd_yolo26")

def prepare():
    print("=" * 65)
    print("🚀 BẮT ĐẦU TẢI & CHUẨN HÓA DATASET INDOORCROWD CHO YOLO26")
    print("=" * 65)

    login(token=HF_TOKEN, add_to_git_credential=False)

    for split in ["train", "val"]:
        os.makedirs(os.path.join(OUTPUT_DIR, "images", split), exist_ok=True)
        os.makedirs(os.path.join(OUTPUT_DIR, "labels", split), exist_ok=True)

    splits_to_load = [
        ("r_central", 380),
        ("ie_central", 1200),
        ("acs_ec", 1200)
    ]

    total_train = 0
    total_val = 0
    total_boxes = 0

    val_interval = 8  # Mỗi 8 ảnh thì lấy 1 ảnh làm validation (~12.5% val, 87.5% train)

    for split_name, max_samples in splits_to_load:
        print(f"\n📦 Đang nạp dữ liệu từ split '{split_name}' (tối đa {max_samples} ảnh)...")
        ds = load_dataset("sebnae/IndoorCrowd", "obj_det_seg", split=split_name, streaming=True)

        count = 0
        for item in ds:
            if count >= max_samples:
                break

            img = item["image"]
            w, h = item["width"], item["height"]
            objects = item["objects"]
            bboxes = objects.get("bbox", [])

            is_val = (count % val_interval == 0)
            target_split = "val" if is_val else "train"

            img_filename = f"{split_name}_{count:05d}.jpg"
            label_filename = f"{split_name}_{count:05d}.txt"

            img_path = os.path.join(OUTPUT_DIR, "images", target_split, img_filename)
            label_path = os.path.join(OUTPUT_DIR, "labels", target_split, label_filename)

            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(img_path, format="JPEG", quality=90)

            label_lines = []
            for bbox in bboxes:
                bx, by, bw, bh = bbox
                if bw <= 4 or bh <= 4:
                    continue

                cx = (bx + bw / 2.0) / w
                cy = (by + bh / 2.0) / h
                nw = bw / w
                nh = bh / h

                cx = max(0.0, min(1.0, cx))
                cy = max(0.0, min(1.0, cy))
                nw = max(0.0, min(1.0, nw))
                nh = max(0.0, min(1.0, nh))

                label_lines.append(f"0 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n")
                total_boxes += 1

            with open(label_path, "w", encoding="utf-8") as lf:
                lf.writelines(label_lines)

            if is_val:
                total_val += 1
            else:
                total_train += 1

            count += 1
            if count % 100 == 0:
                print(f"  -> Đã xử lý {count}/{max_samples} ảnh trong '{split_name}'...")

        print(f"✅ Hoàn thành split '{split_name}': {count} ảnh.")

    yaml_content = f"""# UEL Space - IndoorCrowd YOLO26 Occupancy Dataset
path: {OUTPUT_DIR.replace(chr(92), '/')}
train: images/train
val: images/val

# Classes
names:
  0: person
"""
    yaml_path = os.path.join(OUTPUT_DIR, "indoor_crowd_yolo26.yaml")
    with open(yaml_path, "w", encoding="utf-8") as yf:
        yf.write(yaml_content)

    print("\n" + "=" * 65)
    print("🎉 CHUẨN BỊ DATASET THÀNH CÔNG!")
    print(f"📁 Tổng Train images: {total_train} ảnh")
    print(f"📁 Tổng Val images:   {total_val} ảnh")
    print(f"🎯 Tổng Bounding boxes 'person': {total_boxes} boxes")
    print(f"📄 Tệp cấu hình: {yaml_path}")
    print("=" * 65)

if __name__ == "__main__":
    prepare()

