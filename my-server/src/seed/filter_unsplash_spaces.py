import csv
import os
import sys
import json
import urllib.request
from collections import defaultdict

# Enforce UTF-8 output on Windows console
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', '..', 'unsplash-research-dataset-lite-latest')
KEYWORDS_FILE = os.path.join(DATASET_DIR, 'keywords.tsv000')
PHOTOS_FILE = os.path.join(DATASET_DIR, 'photos.tsv000')
OUTPUT_DIR = os.path.join(BASE_DIR, '..', '..', 'public', 'images', 'spaces')

os.makedirs(OUTPUT_DIR, exist_ok=True)

TARGET_KEYWORDS = {
    'meeting room', 'office', 'modern', 'conference room', 'coworking', 
    'workspace', 'boardroom', 'classroom', 'study', 'library', 'auditorium', 
    'computer lab', 'interior', 'desk', 'presentation', 'business', 'studio'
}

def filter_and_download():
    print(f"1. Đang nạp danh mục từ khóa từ: {KEYWORDS_FILE}")
    photo_keywords = defaultdict(list)
    with open(KEYWORDS_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)
        for row in reader:
            if len(row) >= 2:
                pid = row[0]
                kw = row[1].strip().lower()
                if kw in TARGET_KEYWORDS or any(t in kw for t in ['meeting', 'office', 'modern', 'conference', 'cowork', 'workspace', 'classroom', 'desk']):
                    photo_keywords[pid].append(kw)

    print(f"Tổng số ảnh có từ khóa phù hợp: {len(photo_keywords)}")

    print(f"2. Đang quét 25,000 ảnh từ: {PHOTOS_FILE}")
    categorized = {
        'meeting_room': [],
        'modern_office': [],
        'coworking_workspace': [],
        'classroom_lecture': [],
        'library_study': [],
        'event_auditorium': [],
        'creative_studio': [],
        'focus_pod': []
    }

    with open(PHOTOS_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f, delimiter='\t')
        headers = next(reader)
        pid_idx = headers.index('photo_id')
        url_idx = headers.index('photo_image_url')
        desc_idx = headers.index('photo_description') if 'photo_description' in headers else -1
        ai_desc_idx = headers.index('ai_description') if 'ai_description' in headers else -1

        for row in reader:
            pid = row[pid_idx]
            url = row[url_idx]
            desc = (row[desc_idx] if desc_idx >= 0 else '') or ''
            ai_desc = (row[ai_desc_idx] if ai_desc_idx >= 0 else '') or ''
            kws = photo_keywords.get(pid, [])

            kw_text = " ".join(kws)
            all_text = f"{desc} {ai_desc} {kw_text}".lower()

            # Loại bỏ các ảnh không phải không gian phòng/nội thất
            if any(bad in all_text for bad in ['cat', 'dog', 'animal', 'wedding', 'ferry', 'ocean', 'mountain', 'subway', 'vehicle', 'car', 'food', 'plate', 'dish']):
                continue

            item = {
                'id': pid,
                'url': url,
                'desc': desc,
                'ai_desc': ai_desc,
                'kws': kws[:8]
            }

            # Phân loại cụ thể
            if any(k in all_text for k in ['meeting room', 'conference room', 'boardroom', 'conference table', 'meeting']):
                categorized['meeting_room'].append(item)
            if any(k in all_text for k in ['modern office', 'private office', 'office interior', 'executive office', 'office space']) or ('office' in all_text and 'modern' in all_text):
                categorized['modern_office'].append(item)
            if any(k in all_text for k in ['coworking', 'workspace', 'open plan', 'shared desk', 'communal desk']):
                categorized['coworking_workspace'].append(item)
            if any(k in all_text for k in ['classroom', 'lecture hall', 'lecture', 'training room']):
                categorized['classroom_lecture'].append(item)
            if any(k in all_text for k in ['library', 'study room', 'study area', 'bookshelf', 'reading room']):
                categorized['library_study'].append(item)
            if any(k in all_text for k in ['auditorium', 'event hall', 'stage', 'theater', 'hall']):
                categorized['event_auditorium'].append(item)
            if any(k in all_text for k in ['studio', 'media room', 'creative lab', 'workshop']):
                categorized['creative_studio'].append(item)
            if any(k in all_text for k in ['pod', 'booth', 'phone booth', 'focus', 'solo']):
                categorized['focus_pod'].append(item)

    print("\nKết quả phân loại ảnh theo không gian:")
    for cat, items in categorized.items():
        print(f" - {cat}: {len(items)} ảnh")

    # Chọn lọc các ảnh đẹp nhất, chuẩn nhất cho từng space của UEL Space
    spaces_assignment = [
        {
            'spaceId': 'a2-1',
            'spaceName': 'Phòng Họp VIP Executive A2.1',
            'filename': 'space_a2_1_meeting_vip.jpg',
            'category': 'meeting_room',
            'keywords': ['meeting room', 'boardroom', 'conference table', 'modern']
        },
        {
            'spaceId': 'b1-104',
            'spaceName': 'Phòng B1.104 - Giảng đường đa năng',
            'filename': 'space_b1_104_lecture_hall.jpg',
            'category': 'classroom_lecture',
            'keywords': ['classroom', 'lecture hall', 'modern', 'desk']
        },
        {
            'spaceId': 'thu-vien-2',
            'spaceName': 'Khu Bàn làm việc linh hoạt Co-working Hub',
            'filename': 'space_thu_vien_coworking.jpg',
            'category': 'coworking_workspace',
            'keywords': ['coworking', 'workspace', 'communal desk', 'modern']
        },
        {
            'spaceId': 'a3-301',
            'spaceName': 'Hội trường & Event Hall Landmark A3',
            'filename': 'space_a3_301_event_hall.jpg',
            'category': 'event_auditorium',
            'keywords': ['auditorium', 'event hall', 'stage', 'modern']
        },
        {
            'spaceId': 'b2-101',
            'spaceName': 'Văn phòng riêng Private Suite B2.101',
            'filename': 'space_b2_101_private_office.jpg',
            'category': 'modern_office',
            'keywords': ['office', 'modern', 'private office', 'desk']
        },
        {
            'spaceId': 'choi-1',
            'spaceName': 'Focus Pod 1 Cách Âm / Smart Booth',
            'filename': 'space_choi_1_focus_pod.jpg',
            'category': 'focus_pod',
            'keywords': ['pod', 'booth', 'study', 'modern']
        },
        {
            'spaceId': 'b1-lab202',
            'spaceName': 'Phòng Thực hành Tin học B1.202 (Computer Lab)',
            'filename': 'space_b1_lab202_computer_lab.jpg',
            'category': 'creative_studio',
            'keywords': ['workspace', 'desk', 'computer', 'modern']
        },
        {
            'spaceId': 'a-hoi-truong',
            'spaceName': 'Hội trường Lớn Tòa A (Grand Auditorium)',
            'filename': 'space_a_hoi_truong_grand.jpg',
            'category': 'event_auditorium',
            'keywords': ['auditorium', 'hall', 'presentation', 'modern']
        },
        {
            'spaceId': 'choi-2',
            'spaceName': 'Meeting Pod Solo Booth 02',
            'filename': 'space_choi_2_solo_pod.jpg',
            'category': 'focus_pod',
            'keywords': ['booth', 'desk', 'workspace']
        },
        {
            'spaceId': 'a-105',
            'spaceName': 'Studio Sáng tạo Creative Media A.105',
            'filename': 'space_a_105_creative_media.jpg',
            'category': 'creative_studio',
            'keywords': ['studio', 'media', 'creative', 'modern']
        }
    ]

    print("\n3. Đang tải và tối ưu các ảnh thực tế từ Unsplash vào thư mục public/images/spaces/...")
    used_ids = set()
    result_manifest = []

    for item in spaces_assignment:
        cat = item['category']
        candidates = categorized.get(cat, [])
        # Lấy candidate chưa dùng
        selected = None
        for c in candidates:
            if c['id'] not in used_ids:
                selected = c
                break
        
        if not selected and candidates:
            selected = candidates[0]
        elif not selected:
            # Fallback sang modern_office
            selected = categorized['modern_office'][0]

        used_ids.add(selected['id'])
        # Tải ảnh chất lượng cao 1200x800 web-optimized
        img_url = f"{selected['url']}?w=1200&h=800&q=85&auto=format&fit=crop"
        save_path = os.path.join(OUTPUT_DIR, item['filename'])
        
        print(f"  -> Tải {item['spaceName']} ({item['filename']}) từ Unsplash [{selected['id']}]...")
        try:
            req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=15) as resp, open(save_path, 'wb') as out_f:
                out_f.write(resp.read())
            size_kb = round(os.path.getsize(save_path) / 1024, 1)
            print(f"     [OK] Đã lưu {size_kb} KB")
        except Exception as e:
            print(f"     [LỖI] Không thể tải ảnh: {e}")

        result_manifest.append({
            'spaceId': item['spaceId'],
            'spaceName': item['spaceName'],
            'filename': f"spaces/{item['filename']}",
            'unsplashId': selected['id'],
            'keywords': selected['kws'],
            'desc': selected['desc'] or selected['ai_desc']
        })

    manifest_path = os.path.join(BASE_DIR, 'unsplash_spaces_manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(result_manifest, f, indent=2, ensure_ascii=False)
    print(f"\n4. Đã lưu cấu hình danh sách ảnh vào: {manifest_path}")

if __name__ == '__main__':
    filter_and_download()
