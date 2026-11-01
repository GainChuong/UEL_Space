"""
UEL Space - AIRC-SMARTCLASS Dataset Preprocessing for YOLO26
Lọc nhãn Option A (Person & Face Occupancy) và phân chia Train/Val theo Clip
"""

import os
import sys
import glob
import shutil
import random

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Đường dẫn dữ liệu
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_RAW_DIR = os.path.join(
    BASE_DIR, 
    "AIRC-SMARTCLASS A Multi-Modal Classroom Dataset fo", 
    "AIRC-SMARTCLASS A Multi-Modal Classroom Dataset fo", 
    "Data"
)
OUTPUT_DATASET_DIR = os.path.join(BASE_DIR, "datasets", "smartclass_yolo26")

def prepare_yolo26_dataset(include_face=True):
    print("=" * 60)
    print("🚀 BẮT ĐẦU CHUẨN BỊ DỮ LIỆU SMARTCLASS CHO YOLO26 (OPTION A)")
    print("=" * 60)

    frames_dir = os.path.join(DATASET_RAW_DIR, "Frames")
    labels_dir = os.path.join(DATASET_RAW_DIR, "Labels")

    if not os.path.exists(frames_dir) or not os.path.exists(labels_dir):
        print(f"❌ Không tìm thấy thư mục Frames hoặc Labels tại: {DATASET_RAW_DIR}")
        return

    # Danh sách các thư mục clip (001, 002, ..., 045)
    clips = sorted([d for d in os.listdir(frames_dir) if os.path.isdir(os.path.join(frames_dir, d))])
    print(f"📁 Tìm thấy {len(clips)} clip video trong tập dữ liệu.")

    # Phân chia train (85%) và val (15%) theo clip để tránh Data Leakage
    random.seed(42)
    random.shuffle(clips)
    val_count = max(1, int(len(clips) * 0.15))
    val_clips = set(clips[:val_count])
    train_clips = set(clips[val_count:])

    print(f"📊 Phân chia: {len(train_clips)} clips Train, {len(val_clips)} clips Validation.")

    # Tạo cấu trúc thư mục YOLO chuẩn
    for split in ["train", "val"]:
        os.makedirs(os.path.join(OUTPUT_DATASET_DIR, "images", split), exist_ok=True)
        os.makedirs(os.path.join(OUTPUT_DATASET_DIR, "labels", split), exist_ok=True)

    stats = {
        "train_images": 0,
        "val_images": 0,
        "person_boxes": 0,
        "face_boxes": 0,
        "ignored_ac_boxes": 0
    }

    for clip in clips:
        split = "val" if clip in val_clips else "train"
        clip_frames_dir = os.path.join(frames_dir, clip)
        clip_labels_dir = os.path.join(labels_dir, clip)

        frame_files = sorted(glob.glob(os.path.join(clip_frames_dir, "*.jpg")))

        for img_path in frame_files:
            file_stem = os.path.splitext(os.path.basename(img_path))[0]
            txt_path = os.path.join(clip_labels_dir, f"{file_stem}.txt")

            filtered_lines = []
            if os.path.exists(txt_path):
                with open(txt_path, "r", encoding="utf-8") as f:
                    for line in f:
                        parts = line.strip().split()
                        if not parts:
                            continue
                        cls_id = parts[0]

                        # Class 0: person (Body)
                        if cls_id == "0":
                            filtered_lines.append(f"0 {' '.join(parts[1:])}\n")
                            stats["person_boxes"] += 1
                        # Class 1: face (Head / Face)
                        elif cls_id == "1" and include_face:
                            filtered_lines.append(f"1 {' '.join(parts[1:])}\n")
                            stats["face_boxes"] += 1
                        else:
                            stats["ignored_ac_boxes"] += 1

            # Điểm đến
            dst_img = os.path.join(OUTPUT_DATASET_DIR, "images", split, f"{clip}_{file_stem}.jpg")
            dst_txt = os.path.join(OUTPUT_DATASET_DIR, "labels", split, f"{clip}_{file_stem}.txt")

            # Copy file ảnh và lưu file nhãn đã lọc
            shutil.copy2(img_path, dst_img)
            with open(dst_txt, "w", encoding="utf-8") as f_out:
                f_out.writelines(filtered_lines)

            if split == "train":
                stats["train_images"] += 1
            else:
                stats["val_images"] += 1

    # Tạo tệp dataset YAML cho Ultralytics YOLO26
    yaml_content = f"""# UEL Space - SmartClass YOLO26 Occupancy Dataset
path: {OUTPUT_DATASET_DIR.replace(os.sep, '/')}
train: images/train
val: images/val

# Classes
names:
  0: person
  1: face
""" if include_face else f"""# UEL Space - SmartClass YOLO26 Occupancy Dataset
path: {OUTPUT_DATASET_DIR.replace(os.sep, '/')}
train: images/train
val: images/val

# Classes
names:
  0: person
"""

    yaml_path = os.path.join(OUTPUT_DATASET_DIR, "smartclass_yolo26.yaml")
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)

    print("\n" + "=" * 60)
    print("✅ TIỀN XỬ LÝ HOÀN TẤT THÀNH CÔNG!")
    print(f"🖼️ Tổng ảnh Train: {stats['train_images']} ảnh")
    print(f"🖼️ Tổng ảnh Validation: {stats['val_images']} ảnh")
    print(f"👥 Bounding Box Người (Person): {stats['person_boxes']}")
    if include_face:
        print(f"🙂 Bounding Box Khuôn mặt (Face): {stats['face_boxes']}")
    print(f"🚫 Nhãn điều hòa đã loại bỏ: {stats['ignored_ac_boxes']}")
    print(f"📄 Tệp cấu hình YAML: {yaml_path}")
    print("=" * 60)

if __name__ == "__main__":
    prepare_yolo26_dataset(include_face=True)

