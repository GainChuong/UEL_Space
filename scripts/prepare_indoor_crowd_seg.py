import os
import sys
import json
import numpy as np
import cv2
from pycocotools import mask as mask_util
from datasets import load_dataset
from tqdm import tqdm

# Đảm bảo cache lưu tại ổ D
os.environ["HF_HOME"] = "D:/Học tập/3rd/PTWNC/DoAnCki/.hf_cache"

token_path = os.path.expanduser("~/.cache/huggingface/token")
hf_token = None
if os.path.exists(token_path):
    with open(token_path, "r", encoding="utf-8") as f:
        hf_token = f.read().strip()

BASE_DIR = "D:/Học tập/3rd/PTWNC/DoAnCki/datasets/indoor_crowd_seg"
TRAIN_IMG_DIR = os.path.join(BASE_DIR, "images", "train")
VAL_IMG_DIR = os.path.join(BASE_DIR, "images", "val")
TRAIN_LBL_DIR = os.path.join(BASE_DIR, "labels", "train")
VAL_LBL_DIR = os.path.join(BASE_DIR, "labels", "val")

for d in [TRAIN_IMG_DIR, VAL_IMG_DIR, TRAIN_LBL_DIR, VAL_LBL_DIR]:
    os.makedirs(d, exist_ok=True)

# Mục tiêu: 1,000 train + 200 val = 1,200 ảnh chọn lọc
TARGET_TRAIN = 1000
TARGET_VAL = 200
TOTAL_TARGET = TARGET_TRAIN + TARGET_VAL

print(f"🚀 Bắt đầu tải và chuyển đổi {TOTAL_TARGET} mẫu từ sebnae/IndoorCrowd sang định dạng YOLO11-seg...")

splits = ["acs_ec", "acs_eg", "ie_central", "r_central"]
per_split = TOTAL_TARGET // len(splits)

saved_count = 0
train_count = 0
val_count = 0

for split in splits:
    if saved_count >= TOTAL_TARGET:
        break
    print(f"\n📦 Đang nạp stream từ split: {split}...")
    ds = load_dataset("sebnae/IndoorCrowd", "obj_det_seg", split=split, streaming=True, token=hf_token)
    
    split_saved = 0
    for sample in ds:
        if split_saved >= per_split and saved_count >= TOTAL_TARGET:
            break

        image = sample.get("image")
        if image is None:
            continue

        w, h = image.size
        objs = sample.get("objects", {})
        rle_masks = objs.get("rle_mask", [])
        if not rle_masks or len(rle_masks) == 0:
            continue

        # Phân chia train/val
        is_val = (saved_count % 6 == 0) and (val_count < TARGET_VAL)
        if is_val:
            img_dir = VAL_IMG_DIR
            lbl_dir = VAL_LBL_DIR
        else:
            img_dir = TRAIN_IMG_DIR
            lbl_dir = TRAIN_LBL_DIR

        file_prefix = f"ic_{split}_{saved_count:05d}"
        img_path = os.path.join(img_dir, f"{file_prefix}.jpg")
        lbl_path = os.path.join(lbl_dir, f"{file_prefix}.txt")

        # Lưu ảnh JPG
        image.convert("RGB").save(img_path, quality=88)

        # Chuyển đổi RLE sang Polygon YOLOv11-seg
        label_lines = []
        for rle_item in rle_masks:
            try:
                if isinstance(rle_item, str):
                    rle = json.loads(rle_item)
                else:
                    rle = dict(rle_item)

                if isinstance(rle.get("counts"), str):
                    rle["counts"] = rle["counts"].encode("utf-8")

                mask = mask_util.decode(rle)
                if mask is None or mask.sum() < 20:
                    continue

                contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    if len(cnt) < 3:
                        continue
                    # Đơn giản hóa đa giác tránh thừa điểm
                    epsilon = 0.003 * cv2.arcLength(cnt, True)
                    approx = cv2.approxPolyDP(cnt, epsilon, True)
                    pts = approx.reshape(-1, 2)
                    if len(pts) < 3:
                        continue

                    # Chuẩn hóa tọa độ [0.0 - 1.0]
                    norm_pts = []
                    for px, py in pts:
                        nx = max(0.0, min(1.0, float(px) / w))
                        ny = max(0.0, min(1.0, float(py) / h))
                        norm_pts.append(f"{nx:.6f} {ny:.6f}")

                    # 0 là class 'person'
                    line = "0 " + " ".join(norm_pts)
                    label_lines.append(line)
            except Exception as e:
                continue

        if len(label_lines) == 0:
            if os.path.exists(img_path):
                os.remove(img_path)
            continue

        with open(lbl_path, "w", encoding="utf-8") as f_lbl:
            f_lbl.write("\n".join(label_lines) + "\n")

        saved_count += 1
        split_saved += 1
        if is_val:
            val_count += 1
        else:
            train_count += 1

        if saved_count % 50 == 0 or saved_count == TOTAL_TARGET:
            print(f"  -> Đã lưu {saved_count}/{TOTAL_TARGET} ảnh (Train: {train_count}, Val: {val_count})")

        if saved_count >= TOTAL_TARGET:
            break

# Tạo file indoor_crowd_seg.yaml
yaml_content = f"""# UEL Space - IndoorCrowd YOLO11-seg Dataset
path: D:/Học tập/3rd/PTWNC/DoAnCki/datasets/indoor_crowd_seg
train: images/train
val: images/val

names:
  0: person
"""

yaml_path = os.path.join(BASE_DIR, "indoor_crowd_seg.yaml")
with open(yaml_path, "w", encoding="utf-8") as fy:
    fy.write(yaml_content)

print(f"\n🎉 HOÀN TẤT CHUẨN BỊ DATASET TẠI: {yaml_path}")
print(f"Tổng số ảnh Train: {train_count}, Val: {val_count}")

