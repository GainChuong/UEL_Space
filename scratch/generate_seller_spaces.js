const fs = require('fs');

async function main() {
  const apiKey = 'AQ.Ab8RN6KVPoQitzy8CKEj941C9fe2AHs8X9nE59DgmeFsNb8JFA';
  const url = 'https://stitch.googleapis.com/mcp';
  const projectId = '15917314834578745602';
  const designSystemId = 'assets/80112c3d779646669e7a95c674ec0325';

  console.log('Sending request to generate Seller Center Spaces & Pricing screen...');

  const prompt = `Create an exact, high-fidelity pixel-accurate desktop dashboard screen for UEL Space Seller Center (Kênh Người Bán) - Tab 5: Danh sách Không gian cho thuê & Bảng giá niêm yết:
Viewport size: 2560px width by 1600px height. Full desktop responsive presentation.

LAYOUT STRUCTURE:
1. FIXED LEFT SIDEBAR (w-72 / 288px width, background deep navy blue #001428 with subtle dark architectural blur overlay, text white, border-r border-[#002D5C]/80):
   - TOP HEADER:
     Official UEL SPACE white brand logo with university crest ('UEL SPACE' bold white, 'Smart Campus Space Management' subtitle).
   - NAVIGATION MENU:
     * Section label: 'VẬN HÀNH GIAN HÀNG' (uppercase, 11px, bold, tracking-wider, text-slate-400, px-3 py-2)
     * Tab 1 (INACTIVE): 'Tổng quan & Doanh thu' (dashboard grid icon, text-slate-300 px-3.5 py-2.5)
     * Tab 2 (INACTIVE): 'Quản lý Đơn thuê (Booking Orders)' with badge '5' in white pill (clipboard-check icon, text-slate-300)
     * Tab 3 (INACTIVE): 'Xử lý Vi phạm & Hủy slot' with badge '2' in white pill (alert-triangle icon, text-slate-300)
     * Tab 4 (INACTIVE): 'Trạm Check-in Gian hàng' with pill 'KIOSK' (qr-code icon, text-slate-300)
     * Section label: 'SẢN PHẨM & KHÁCH HÀNG' (uppercase, 11px, bold, tracking-wider, text-slate-400, px-3 pt-4 pb-1)
     * Tab 5 (ACTIVE): 'Không gian & Giá niêm yết' (bg #003B71 text white font-bold rounded-xl px-3.5 py-2.5, building/store icon)
     * Tab 6 (INACTIVE): 'Khách thuê & Nhân viên' (users icon, text-slate-300)
     * Tab 7 (INACTIVE): 'Lịch sử Giao dịch & Nhật ký' (file-text icon, text-slate-300)
     * Tab 8 (INACTIVE): 'Giám sát Sĩ số IoT & AI' (eye icon, text-slate-300)
   - BOTTOM STORE INFO CARD (pinned to bottom of sidebar, bg-black/25 p-3.5 rounded-xl border border-white/10 mx-3 mb-4):
     * Top line: Star 4.95 (248 reviews) on left + green pill 'ĐỐI TÁC XÁC MINH' on right
     * Middle line: 'UEL Space Marketplace Hub' (text-slate-400 font-mono text-xs)
     * Bottom line: 'Số dư ví khả dụng:' (text-slate-400) + '68,500,000 đ' (vibrant gold/amber-400 font-black text-sm)

2. MAIN CANVAS AREA (flex-1, background #F8FAFC, overflow-y-auto):
   - TOPBAR HEADER (h-16 / 64px, background white #FFFFFF, border-b border-slate-200 px-8 flex items-center justify-between):
     * Left breadcrumb: 'Kênh Người Bán (Seller Center)' (text-xs text-slate-400) / 'DANH SÁCH KHÔNG GIAN & BẢNG GIÁ THUÊ' (text-sm font-black text-slate-900 uppercase)
     * Right actions:
       - Button 'Quét QR Khách Check-in' (Navy blue #003B71 bg, text white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2)
       - Campus tag: 'Gian hàng: UEL Space Partner Hub' (pill with light blue bg, text-blue-700 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200)
       - Notification bell with red badge '4' (rounded-xl border border-slate-200 p-2)
       - Profile: User avatar + 'Chủ Gian Hàng UEL Space Partner Hub' (font-bold text-xs text-slate-900) / 'seller.partner@uelspace.vn' (text-[10px] text-slate-400)

   - MAIN CONTENT CONTAINER (bg white #FFFFFF, border 1px solid #E2E8F0, rounded-3xl, p-8, m-8, shadow-xs):
     * HEADER ROW:
       - Title: 'Danh sách Không gian cho thuê & Bảng giá niêm yết' (font-black text-lg text-slate-900 tracking-tight)
       - Subtitle: 'Quản lý bảng giá thuê theo giờ/ngày, tiện ích đi kèm và trạng thái khả dụng của từng listing' (text-xs text-slate-400 mt-1)
       - Primary CTA Button on top right: '+ Đăng tải Không gian mới' (deep navy #001428 bg, text white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2)

     * 6 COMMERCIAL SPACE LISTING CARDS (grid 3 columns x 2 rows, gap 20px, margin-top 24px):
       - Card 1:
         * Top row: Pill 'KHÔNG GIAN SỰ KIỆN' (blue-100/blue-700 font-extrabold text-[10px] px-2 py-0.5 rounded) + '★ 4.9 (42)' amber | Status 'ĐANG MỞ THUÊ' (green pill emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full)
         * Name: 'Hội trường & Event Hall Landmark A3' (font-bold text-slate-900 text-sm)
         * Location: 'Central Tower Q.1 • Tầng 3' (text-xs text-slate-500)
         * Pricing box (bg #F8FAFC rounded-2xl p-3.5 border border-slate-200 flex justify-between):
           - Left: 'GIÁ THUÊ THEO GIỜ' (10px slate-400) / '750,000 đ /h' (navy-900 font-black text-sm)
           - Right: 'GIÁ TRỌN GÓI NGÀY' (10px slate-400) / '5,200,000 đ /ngày' (amber-600 font-black text-sm)
         * Specs box (border rounded-xl p-3 text-xs space-y-1.5):
           - 'Sức chứa tối đa:' '80 khách'
           - 'Tự động hủy khi vắng:' '10 phút'
         * Amenities badges: 'Máy chiếu Laser 4K', 'Hệ thống âm thanh hội thảo không dây', 'Điều hòa trung tâm Daikin', 'Wifi cáp quang 1Gbps', 'Bục thuyết trình & Màn LED' (gray tags rounded-md text-[10px])
         * Button: 'Tạm ngưng niêm yết (Bảo trì)' (white rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold py-2 w-full)

       - Card 2:
         * Top row: Pill 'PHÒNG HỌP VIP' + '★ 4.95 (58)' | Status 'ĐÃ ĐƯỢC ĐẶT' (amber pill amber-50 text-amber-700 border-amber-200)
         * Name: 'Phòng Họp VIP Executive A2.1'
         * Location: 'TechPark Executive • Tầng 2'
         * Pricing box: '350,000 đ /h' | '2,400,000 đ /ngày'
         * Specs box: 'Sức chứa tối đa: 15 khách' | 'Tự động hủy khi vắng: 8 phút'
         * Amenities: 'Màn hình tương tác Samsung Flip', 'Micro đa hướng chống ồn', 'Hệ thống Teleconference 4K', 'Bảng kính tường lớn', 'Quầy teabreak riêng'
         * Button: 'Tạm ngưng niêm yết (Bảo trì)'

       - Card 3:
         * Top row: Pill 'BÀN LÀM VIỆC LINH HOẠT' + '★ 4.8 (156)' | Status 'KHÁCH ĐANG DÙNG' (sky pill sky-50 text-sky-700 border-sky-200)
         * Name: 'Khu Bàn làm việc linh hoạt Co-working'
         * Location: 'Innovation Hub Q.2 • Tầng 2'
         * Pricing box: '45,000 đ /h' | '250,000 đ /ngày'
         * Specs box: 'Sức chứa tối đa: 120 khách' | 'Tự động hủy khi vắng: 10 phút'
         * Amenities: 'Wifi công suất lớn băng thông đối xứng', 'Bàn có cổng sạc Type C & Power Plug', 'Bàn chống cận chuẩn Ergonomic', 'Khu pantry cà phê tự phục vụ'
         * Button: 'Tạm ngưng niêm yết (Bảo trì)'

       - Card 4:
         * Top row: Pill 'VĂN PHÒNG RIÊNG' + '★ 4.9 (21)' | Status 'ĐANG MỞ THUÊ' (green pill)
         * Name: 'Văn phòng riêng Private Suite B2.101'
         * Location: 'Landmark Lounge • Tầng 1'
         * Pricing box: '500,000 đ /h' | '3,500,000 đ /ngày'
         * Specs box: 'Sức chứa tối đa: 35 khách' | 'Tự động hủy khi vắng: 10 phút'
         * Amenities: 'Cửa khóa thông minh Smart Lock', 'Bàn làm việc giám đốc', 'Điều hòa độc lập 24/7', 'Bảng từ kính', 'Tủ lưu trữ hồ sơ bảo mật'
         * Button: 'Tạm ngưng niêm yết (Bảo trì)'

       - Card 5:
         * Top row: Pill 'MEETING POD CÁCH ÂM' + '★ 4.85 (64)' | Status 'ĐANG MỞ THUÊ' (green pill)
         * Name: 'Meeting Pod cách âm Smart Pod 01'
         * Location: 'Startup Pod Hub • Khuôn viên Vườn Công nghệ'
         * Pricing box: '120,000 đ /h' | '800,000 đ /ngày'
         * Specs box: 'Sức chứa tối đa: 4 khách' | 'Tự động hủy khi vắng: 8 phút'
         * Amenities: 'Vách kính cách âm chuẩn 35dB', 'Hệ thống thông gió cưỡng bức', 'Màn hình họp nhanh 32 inch', 'Đèn LED nhiệt độ màu điều chỉnh'
         * Button: 'Tạm ngưng niêm yết (Bảo trì)'

       - Card 6:
         * Top row: Pill 'STUDIO SÁNG TẠO' + '★ 4.92 (53)' | Status 'ĐANG MỞ THUÊ' (green pill)
         * Name: 'Studio sáng tạo Creative Media A.105'
         * Location: 'Creative Hub Center • Tầng 1'
         * Pricing box: '400,000 đ /h' | '2,800,000 đ /ngày'
         * Specs box: 'Sức chứa tối đa: 20 khách' | 'Tự động hủy khi vắng: 10 phút'
         * Amenities: 'Phông xanh Chromakey', 'Hệ thống đèn Spotlight & Softbox', 'Micro thu âm Podcast Shure', 'Cách âm tiêu âm chuyên nghiệp'
         * Button: 'Tạm ngưng niêm yết (Bảo trì)'

TYPOGRAPHY & COLORS:
- Sidebar: Deep Navy #001428, Active item #003B71
- Main area: Background #F8FAFC, Card containers #FFFFFF
- Headings: Montserrat (bold 700/800)
- Body: Roboto Flex / Roboto
- Accents: Primary Navy #003B71, Emerald #10B981, Amber #F59E0B
Ensure clean enterprise SaaS styling, exact 1:1 match to the provided screenshot.`;

  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'generate_screen_from_text',
      arguments: {
        projectId: projectId,
        designSystem: designSystemId,
        deviceType: 'DESKTOP',
        prompt: prompt
      }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  fs.writeFileSync('scratch/stitch_seller_spaces_result.json', JSON.stringify(data, null, 2));
  console.log('Result saved to scratch/stitch_seller_spaces_result.json');
}

main().catch(console.error);
