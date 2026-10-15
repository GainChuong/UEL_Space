import os
import sys
import json
import io

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from datasets import load_dataset, Image as DatasetImage
from PIL import Image as PILImage

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_IMG_DIR = os.path.join(BASE_DIR, '..', '..', 'public', 'images', 'spaces')
MANIFEST_FILE = os.path.join(BASE_DIR, 'indoor_scenes_manifest.json')

os.makedirs(OUTPUT_IMG_DIR, exist_ok=True)

CATEGORY_RULES = {
    'meeting_room': {'target': 'meeting_room', 'max': 5},
    'auditorium': {'target': 'auditorium', 'max': 4},
    'office': {'target': 'office', 'max': 5},
    'classroom': {'target': 'classroom', 'max': 4},
    'library': {'target': 'library', 'max': 4},
    'computerroom': {'target': 'computerroom', 'max': 3},
    'artstudio': {'target': 'studio', 'max': 3},
    'tv_studio': {'target': 'studio', 'max': 3},
    'studio': {'target': 'studio', 'max': 3},
    'laboratory': {'target': 'laboratory', 'max': 3},
    'lobby': {'target': 'lobby', 'max': 3},
    'waitingroom': {'target': 'lobby', 'max': 3}
}

REQUIRED_TARGETS = {
    'meeting_room': 5,
    'auditorium': 4,
    'office': 5,
    'classroom': 4,
    'library': 4,
    'computerroom': 3,
    'studio': 3,
    'lobby': 3
}

print("=" * 60)
print("TRÍCH XUẤT DỮ LIỆU TỪ HUGGING FACE: FatimaSaadNaik/indoor-scenes-dataset")
print("=" * 60)
print(f"Mục tiêu trích xuất: {REQUIRED_TARGETS}")
print(f"Thư mục lưu trữ ảnh: {OUTPUT_IMG_DIR}\n")

print("Đang nạp dataset ở chế độ streaming với decode=False (siêu tốc)...")
ds = load_dataset("FatimaSaadNaik/indoor-scenes-dataset", split="train", streaming=True)
ds = ds.cast_column('image', DatasetImage(decode=False))

collected_by_target = {t: [] for t in REQUIRED_TARGETS}
all_collected = []

scanned = 0
for item in ds:
    scanned += 1
    raw_cat = item.get('category', '')
    
    if raw_cat in CATEGORY_RULES:
        target_name = CATEGORY_RULES[raw_cat]['target']
        current_count = len(collected_by_target[target_name])
        max_needed = REQUIRED_TARGETS[target_name]
        
        if current_count < max_needed:
            raw_caption = item.get('caption', '')
            file_name = item.get('file_name', '')
            img_data = item.get('image')
            
            idx = current_count + 1
            clean_ext = os.path.splitext(file_name)[1] or '.jpg'
            saved_name = f"indoor_{target_name}_{idx}{clean_ext.lower()}"
            save_path = os.path.join(OUTPUT_IMG_DIR, saved_name)
            
            try:
                # Decode only the required image on demand
                raw_bytes = img_data['bytes']
                pil_img = PILImage.open(io.BytesIO(raw_bytes))
                if pil_img.mode != 'RGB':
                    pil_img = pil_img.convert('RGB')
                pil_img.save(save_path, 'JPEG', quality=92)
                
                relative_img_path = f"spaces/{saved_name}"
                
                entry = {
                    'id': f"indoor_{target_name}_{idx}",
                    'category': raw_cat,
                    'target_category': target_name,
                    'caption': raw_caption,
                    'file_name': file_name,
                    'local_image': relative_img_path,
                    'full_path': save_path,
                    'dimensions': {
                        'width': pil_img.width,
                        'height': pil_img.height
                    }
                }
                
                collected_by_target[target_name].append(entry)
                all_collected.append(entry)
                print(f"[{target_name.upper()}] ({idx}/{max_needed}) Raw Cat: '{raw_cat}' -> Đã lưu: {saved_name} ({pil_img.width}x{pil_img.height})")
                print(f"   Caption: \"{raw_caption}\"")
            except Exception as err:
                print(f"Lỗi khi giải mã và lưu ảnh {file_name}: {err}")
    
    if scanned % 500 == 0:
        counts_summary = {k: len(v) for k, v in collected_by_target.items()}
        print(f"... Đã quét {scanned} dòng. Tiến độ: {counts_summary}")
        
    # Stop when all targets are fulfilled
    if all(len(collected_by_target[t]) >= REQUIRED_TARGETS[t] for t in REQUIRED_TARGETS):
        print("\nĐã thu thập đủ 100% mục tiêu từ dataset!")
        break

print(f"\nTổng số mẫu đã quét: {scanned}")
print(f"Tổng số ảnh trích xuất thành công: {len(all_collected)}")

# Write manifest file
with open(MANIFEST_FILE, 'w', encoding='utf-8') as f:
    json.dump({
        'dataset_source': 'FatimaSaadNaik/indoor-scenes-dataset',
        'total_extracted': len(all_collected),
        'categories': {cat: len(items) for cat, items in collected_by_target.items()},
        'items': all_collected
    }, f, indent=2, ensure_ascii=False)

print(f"Đã lưu manifest chi tiết tại: {MANIFEST_FILE}")
print("=" * 60)
