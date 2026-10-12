const fs = require('fs');

async function main() {
  const apiKey = 'AQ.Ab8RN6KVPoQitzy8CKEj941C9fe2AHs8X9nE59DgmeFsNb8JFA';
  const url = 'https://stitch.googleapis.com/mcp';
  const projectId = '15917314834578745602';
  const designSystemId = 'assets/80112c3d779646669e7a95c674ec0325';

  console.log('Sending request to generate Seller Center Overview screen...');

  const prompt = `Create an exact, high-fidelity pixel-accurate desktop dashboard screen for UEL Space Seller Center (Kênh Người Bán) - Tab 1: Tổng quan Gian hàng & Doanh thu:
Viewport size: 2560px width by 1440px height. Full desktop responsive presentation.

LAYOUT STRUCTURE:
1. FIXED LEFT SIDEBAR (w-72 / 288px width, background deep navy blue #001428 with subtle dark architectural blur overlay, text white, border-r border-[#002D5C]/80):
   - TOP HEADER:
     Official UEL SPACE white brand logo with university crest ('UEL SPACE' bold white, 'Smart Campus Space Management' subtitle).
   - NAVIGATION MENU:
     * Section label: 'VẬN HÀNH GIAN HÀNG' (uppercase, 11px, bold, tracking-wider, text-slate-400, px-3 py-2)
     * Tab 1 (ACTIVE): 'Tổng quan & Doanh thu' (bg #003B71 text white font-bold rounded-xl px-3.5 py-2.5, dashboard grid icon)
     * Tab 2 (INACTIVE): 'Quản lý Đơn thuê (Booking Orders)' with badge '5' in white pill (text-slate-300 px-3.5 py-2.5, clipboard-check icon)
     * Tab 3 (INACTIVE): 'Xử lý Vi phạm & Hủy slot' with badge '2' in white pill (text-slate-300 px-3.5 py-2.5, alert-triangle icon)
     * Tab 4 (INACTIVE): 'Trạm Check-in Gian hàng' with pill 'KIOSK' (text-slate-300 px-3.5 py-2.5, qr-code icon)
     * Section label: 'SẢN PHẨM & KHÁCH HÀNG' (uppercase, 11px, bold, tracking-wider, text-slate-400, px-3 pt-4 pb-1)
     * Tab 5 (INACTIVE): 'Không gian & Giá niêm yết' (building icon, text-slate-300)
     * Tab 6 (INACTIVE): 'Khách thuê & Nhân viên' (users icon, text-slate-300)
     * Tab 7 (INACTIVE): 'Lịch sử Giao dịch & Nhật ký' (file-text icon, text-slate-300)
     * Tab 8 (INACTIVE): 'Giám sát Sĩ số IoT & AI' (eye icon, text-slate-300)
   - BOTTOM STORE INFO CARD (pinned to bottom of sidebar, bg-black/25 p-3.5 rounded-xl border border-white/10 mx-3 mb-4):
     * Top line: Star 4.95 (248 reviews) on left + green pill 'ĐỐI TÁC XÁC MINH' on right
     * Middle line: 'UEL Space Marketplace Hub' (text-slate-400 font-mono text-xs)
     * Bottom line: 'Số dư ví khả dụng:' (text-slate-400) + '68,500,000 đ' (vibrant gold/amber-400 font-black text-sm)

2. MAIN CANVAS AREA (flex-1, background #F8FAFC, overflow-y-auto):
   - TOPBAR HEADER (h-16 / 64px, background white #FFFFFF, border-b border-slate-200 px-8 flex items-center justify-between):
     * Left breadcrumb: 'Kênh Người Bán (Seller Center)' (text-xs text-slate-400) / 'TỔNG QUAN GIAN HÀNG & DOANH THU' (text-sm font-black text-slate-900 uppercase)
     * Right actions:
       - Button 'Quét QR Khách Check-in' (Navy blue #003B71 bg, text white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2)
       - Campus tag: 'Gian hàng: UEL Space Partner Hub' (pill with light blue bg, text-blue-700 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200)
       - Notification bell with red badge '4' (rounded-xl border border-slate-200 p-2)
       - Profile: User avatar + 'Chủ Gian Hàng UEL Space Partner Hub' (font-bold text-xs text-slate-900) / 'seller.partner@uelspace.vn' (text-[10px] text-slate-400)

   - MAIN DASHBOARD BODY (padding 32px, space-y-6):
     * BENTO GRID METRIC KPI CARDS (4 columns):
       - Card 1: 'DOANH THU GIAN HÀNG (T10)' (slate-500 font-semibold text-xs) with small amber dollar icon box
         * Value: '68,500,000 đ' (font Montserrat font-black 32px text-slate-900)
         * Sub: '+24.5% tăng trưởng tháng này' (emerald-600 font-bold text-xs flex items-center gap-1)
       - Card 2: 'ĐƠN THUÊ CHỜ XÁC NHẬN' (slate-500 font-semibold text-xs) with small clock icon box
         * Value: '5' (font Montserrat font-black 32px text-slate-900)
         * Sub: 'Cần chốt giữ slot cho khách >' (slate-500 text-xs font-medium)
       - Card 3: 'TỶ LỆ LẤP ĐẦY GIAN HÀNG' (slate-500 font-semibold text-xs) with small bar chart icon box
         * Value: '78.4%' (font Montserrat font-black 32px text-slate-900)
         * Sub: '192 khách thuê & đối tác đang check-in' (slate-500 text-xs font-medium)
       - Card 4: 'LISTING ĐANG NIÊM YẾT' (slate-500 font-semibold text-xs) with small check-circle icon box
         * Value: '9 không gian' (font Montserrat font-black 32px text-slate-900)
         * Sub: 'Sẵn sàng đón khách thuê đặt trực tuyến' (slate-500 text-xs font-medium)
       (All 4 cards have white bg, border 1px solid #E2E8F0, rounded-2xl, p-6, shadow-xs)

     * LOWER SECTION (2 columns: left 2/3 and right 1/3):
       - LEFT CARD (2/3 width, bg white, border 1px solid #E2E8F0, rounded-3xl, p-7, shadow-xs):
         * Header: 'Hiệu suất khai thác theo Phân khu Không gian' (Montserrat bold 18px text-slate-900) + Subtitle 'Tỷ lệ lấp đầy & đơn giá doanh thu trung bình thời gian thực' (text-xs text-slate-400)
         * Top-right badge: 'Cập nhật IoT AI: 5 phút/lần' (bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-lg)
         * 4 Progress Bars:
           1. 'Central Tower Q.1 (Hội trường Landmark & Phòng đào tạo)' - 92% with emerald tag 'Doanh thu top 1' | Progress bar: #003B71 Navy filled to 92%
           2. 'TechPark Executive Hub (Phòng họp VIP Teleconference)' - 85% | Progress bar: #334155 Slate filled to 85%
           3. 'Innovation Hub Q.2 (Bàn làm việc linh hoạt Co-working)' - 78% | Progress bar: #334155 Slate filled to 78%
           4. 'Startup Pod Hub & Creative Media Studio' - 64% | Progress bar: #334155 Slate filled to 64%

       - RIGHT CARD (1/3 width, bg white, border 1px solid #E2E8F0, rounded-3xl, p-7, shadow-xs, flex column justify-between):
         * Header: 'Đơn thuê cần xác nhận' (Montserrat bold 18px text-slate-900) + pill badge '5 đơn' (slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full)
         * Order Card 1 (bg #F8FAFC, border 1px solid #E2E8F0, rounded-2xl, p-4, mb-4):
           - Top: 'Hội trường & Event Hall Landmark A3' (font-bold text-xs text-slate-900) + badge 'UEL-BK-2026-001' (bg white border text-xs px-2 py-0.5 rounded)
           - Line 1: 'Khách thuê: Nguyễn Trần Kim Giang (Tập đoàn Công nghệ TechCorp)' (text-xs text-slate-600)
           - Line 2: 'Thời gian: 13:00 - 17:00 • 11/10/2026' (text-xs text-slate-500)
           - Buttons: Primary button 'Chấp nhận đơn' (bg #003B71 text white text-xs font-bold py-2 px-4 rounded-xl flex-1) and Secondary button 'Từ chối' (bg white border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl)
         * Order Card 2 (bg #F8FAFC, border 1px solid #E2E8F0, rounded-2xl, p-4, mb-4):
           - Top: 'Khu Co-working Hub - Bàn 14' (font-bold text-xs text-slate-900) + badge 'UEL-BK-2026-002'
           - Line 1: 'Khách thuê: Trần Minh Anh (FinTech Solutions Vietnam)'
           - Line 2: 'Thời gian: 08:00 - 11:30 • 11/10/2026'
           - Buttons: Primary button 'Chấp nhận đơn' and Secondary button 'Từ chối'
         * Bottom CTA link button: 'Xem toàn bộ đơn thuê →' (w-full py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold text-center hover:bg-slate-100)

TYPOGRAPHY & COLORS:
- Sidebar: Deep Navy #001428, Active item #003B71
- Main area: Background #F8FAFC, Card containers #FFFFFF
- Headings: Montserrat (bold 700/800)
- Body: Roboto Flex / Roboto
- Accents: Primary Navy #003B71, Emerald #10B981, Amber #F59E0B
Ensure perfect pixel-alignment, clean spacing, modern enterprise SaaS look exactly matching the provided screenshot.`;

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
  fs.writeFileSync('scratch/stitch_seller_overview_result.json', JSON.stringify(data, null, 2));
  console.log('Result saved to scratch/stitch_seller_overview_result.json');
}

main().catch(console.error);
