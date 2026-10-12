const fs = require('fs');

async function main() {
  const apiKey = 'AQ.Ab8RN6KVPoQitzy8CKEj941C9fe2AHs8X9nE59DgmeFsNb8JFA';
  const url = 'https://stitch.googleapis.com/mcp';
  const projectId = '15917314834578745602';
  const designSystemId = 'assets/80112c3d779646669e7a95c674ec0325';

  console.log('Sending request to generate Seller Center Booking Orders screen...');

  const prompt = `Create an exact, high-fidelity pixel-accurate desktop dashboard screen for UEL Space Seller Center (Kênh Người Bán) - Tab 2: Quản lý Đơn thuê Phòng (Booking Orders):
Viewport size: 2560px width by 1600px height. Full desktop responsive presentation.

LAYOUT STRUCTURE:
1. FIXED LEFT SIDEBAR (w-72 / 288px width, background deep navy blue #001428 with subtle dark architectural blur overlay, text white, border-r border-[#002D5C]/80):
   - TOP HEADER:
     Official UEL SPACE white brand logo with university crest ('UEL SPACE' bold white, 'Smart Campus Space Management' subtitle).
   - NAVIGATION MENU:
     * Section label: 'VẬN HÀNH GIAN HÀNG' (uppercase, 11px, bold, tracking-wider, text-slate-400, px-3 py-2)
     * Tab 1 (INACTIVE): 'Tổng quan & Doanh thu' (dashboard grid icon, text-slate-300 px-3.5 py-2.5)
     * Tab 2 (ACTIVE): 'Quản lý Đơn thuê (Booking Orders)' with badge '5' in white pill (bg #003B71 text white font-bold rounded-xl px-3.5 py-2.5, clipboard-check icon)
     * Tab 3 (INACTIVE): 'Xử lý Vi phạm & Hủy slot' with badge '2' in white pill (text-slate-300, alert-triangle icon)
     * Tab 4 (INACTIVE): 'Trạm Check-in Gian hàng' with pill 'KIOSK' (text-slate-300, qr-code icon)
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
     * Left breadcrumb: 'Kênh Người Bán (Seller Center)' (text-xs text-slate-400) / 'QUẢN LÝ ĐƠN THUÊ PHÒNG (BOOKING ORDERS)' (text-sm font-black text-slate-900 uppercase)
     * Right actions:
       - Button 'Quét QR Khách Check-in' (Navy blue #003B71 bg, text white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2)
       - Campus tag: 'Gian hàng: UEL Space Partner Hub' (pill with light blue bg, text-blue-700 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200)
       - Notification bell with red badge '4' (rounded-xl border border-slate-200 p-2)
       - Profile: User avatar + 'Chủ Gian Hàng UEL Space Partner Hub' (font-bold text-xs text-slate-900) / 'seller.partner@uelspace.vn' (text-[10px] text-slate-400)

   - MAIN TABLE CONTAINER (bg white #FFFFFF, border 1px solid #E2E8F0, rounded-3xl, p-8, m-8, shadow-xs):
     * TOP CONTROLS & FILTER BAR:
       - Search input: 🔍 'Tìm mã đơn, khách thuê, không gian...' (bg #F8FAFC, border 1px solid #E2E8F0, rounded-xl, px-4 py-2, text-xs, w-80)
       - Building dropdown: 'Tất cả Tòa nhà & Hub ▾' (bg #F8FAFC, border 1px solid #E2E8F0, rounded-xl, px-3 py-2, text-xs font-semibold)
       - Right counter: 'Tổng số: 15 đơn • 5 chờ duyệt' (bold 13px, with red dot on 5 chờ duyệt)

     * DATA TABLE:
       Columns:
       1. MÃ ĐƠN & NGÀY
       2. NGƯỜI ĐẶT & TỔ CHỨC
       3. KHÔNG GIAN & KHUNG GIỜ
       4. MỤC ĐÍCH & SỨC CHỨA
       5. TRẠNG THÁI (centered)
       6. THAO TÁC XỬ LÝ (right-aligned)

       Rows (matching screenshot exactly):
       - Row 1:
         * Mã đơn: 'UEL-BK-2026-081' (bold text-slate-900) / '11/10/2026' (text-slate-400)
         * Người đặt: 'Nguyễn Trần Kim Giang' (bold) / 'Tập đoàn Công nghệ TechCorp' / 'giang.nguyen@techcorp.vn'
         * Không gian: 'Hội trường & Event Hall Landmark A3' (bold) / '13:00 - 17:00' (navy blue text) / 'Central Tower Q.1'
         * Mục đích: 'Tổ chức Hội thảo AI & Chuyển đổi số Doanh ...' / '75 người tham dự (Hội thảo / Sự kiện)'
         * Trạng thái: 'CHỜ DUYỆT' (amber pill #FEF3C7, border #FDE68A, text #B45309 font-black text-[11px] px-3 py-1 rounded-full)
         * Thao tác: Eye view icon + Button 'Phê duyệt' (navy blue #003B71 text-white px-3 py-1.5 rounded-lg text-xs font-bold) + Button 'Từ chối' (white border px-3 py-1.5 rounded-lg text-xs font-semibold)

       - Row 2:
         * Mã đơn: 'UEL-BK-2026-082' / '11/10/2026'
         * Người đặt: 'Trần Minh Anh' / 'FinTech Solutions Vietnam' / 'anh.tm@fintechhub.vn'
         * Không gian: 'Khu Co-working Hub - Bàn 14' + badge 'Trùng lịch' (amber tag) / '08:00 - 11:30' / 'Innovate Building'
         * Mục đích: 'Họp nhóm dự án Khảo sát Thị trường Tài chín...' / '12 người tham dự (Họp nhóm dự án)'
         * Trạng thái: 'CHỜ DUYỆT' (amber pill)
         * Thao tác: Eye view icon + Button 'Phê duyệt' + Button 'Từ chối'

       - Row 3:
         * Mã đơn: 'UEL-BK-2026-083' / '12/10/2026'
         * Người đặt: 'ThS. Lê Hoàng Long' / 'Viện Đổi mới Sáng tạo & AI' / 'long.lh@innovate.vn'
         * Không gian: 'Phòng Họp VIP Executive A2.1' / '09:00 - 11:00' / 'TechPark Executive'
         * Mục đích: 'Họp Ban Điều hành & Ký kết Hợp đồng Đối tá...' / '14 người tham dự (Họp Ban Lãnh đạo)'
         * Trạng thái: '✓ ĐÃ DUYỆT' (emerald pill #D1FAE5, border #A7F3D0, text #065F46 font-black text-[11px] px-3 py-1 rounded-full)
         * Thao tác: Eye view icon + 'Đã xử lý' (gray italic text)

       - Row 4:
         * Mã đơn: 'UEL-BK-2026-084' / '12/10/2026'
         * Người đặt: 'Vũ Đức Nam' / 'GrowthHub Marketing Agency' / 'namvd@growthhub.com'
         * Không gian: 'Phòng Đào tạo & Workshop B2.101' / '17:30 - 20:30' / 'Central Tower Q.1'
         * Mục đích: 'Tập huấn kỹ năng Quản trị & Tối ưu Chiến dịc...' / '30 người tham dự (Đào tạo nội bộ)'
         * Trạng thái: 'CHỜ DUYỆT' (amber pill)
         * Thao tác: Eye view icon + Button 'Phê duyệt' + Button 'Từ chối'

       - Row 5:
         * Mã đơn: 'UEL-BK-2026-079' / '10/10/2026'
         * Người đặt: 'Phạm Quỳnh Như' / 'Venture Studio Incubator' / 'nhu.pq@venturestudio.io'
         * Không gian: 'Meeting Pod cách âm Smart Pod 01' / '14:00 - 16:30' / 'Startup Pod Hub'
         * Mục đích: 'Brainstorm ý tưởng Pitching gọi vốn Vòng Hạ...' / '6 người tham dự (Họp đối tác)'
         * Trạng thái: '✕ TỪ CHỐI' (rose pill #FFE4E6, border #FECDD3, text #9F1239 font-black text-[11px] px-3 py-1 rounded-full)
         * Thao tác: Eye view icon + 'Đã xử lý' (gray italic text)

       - Row 6:
         * Mã đơn: 'UEL-88392' / '11/10/2026'
         * Người đặt: 'Nguyễn Trần Kim Giang' / 'TechCorp Vietnam (Giám đốc Công...' / 'giang.nguyen@techcorp.vn'
         * Không gian: 'Studio Sáng tạo Creative Media A.105' / '14:00 - 16:00' / 'Creative Hub Center'
         * Mục đích: 'Họp bàn giải pháp Phần mềm Quản trị Doanh...' / '5 người tham dự (Họp chuyên môn)'
         * Trạng thái: '✓ ĐÃ DUYỆT' (emerald pill)
         * Thao tác: Eye view icon + 'Đã xử lý'

       - Row 7:
         * Mã đơn: 'UEL-88210' / '12/10/2026'
         * Người đặt: 'Nguyễn Trần Kim Giang' / 'TechCorp Vietnam (Giám đốc Công...' / 'giang.nguyen@techcorp.vn'
         * Không gian: 'Meeting Pod cách âm Smart Pod 01' / '09:00 - 11:30' / 'Startup Pod Hub'
         * Mục đích: 'Làm việc tập trung cá nhân & Phỏng vấn ứng ...' / '2 người tham dự (Làm việc riêng)'
         * Trạng thái: '✓ ĐÃ DUYỆT' (emerald pill)
         * Thao tác: Eye view icon + 'Đã xử lý'

       - Row 8:
         * Mã đơn: 'UEL-88150' / '13/10/2026'
         * Người đặt: 'Nguyễn Trần Kim Giang' / 'TechCorp Vietnam (Giám đốc Công...' / 'giang.nguyen@techcorp.vn'
         * Không gian: 'Hội trường & Event Hall Landmark A3' / '08:00 - 11:30' / 'Central Tower Q.1'
         * Mục đích: 'Hội thảo giới thiệu giải pháp AI cho khách hà...' / '8 người tham dự (Hội thảo / Sự kiện)'
         * Trạng thái: '✓ ĐÃ DUYỆT' (emerald pill)
         * Thao tác: Eye view icon + 'Đã xử lý'

       - Row 9:
         * Mã đơn: 'UEL-87941' / '11/10/2026'
         * Người đặt: 'Nguyễn Trần Kim Giang' / 'TechCorp Vietnam (Giám đốc Công...' / 'giang.nguyen@techcorp.vn'
         * Không gian: 'Phòng Đào tạo Executive B1.202' / '13:00 - 17:00' / 'Central Tower Q.1'
         * Mục đích: 'Đào tạo kỹ năng lập trình Cloud & Microservi...' / '60 người tham dự (Đào tạo nội bộ)'
         * Trạng thái: 'CHỜ DUYỆT' (amber pill)
         * Thao tác: Eye view icon + Button 'Phê duyệt' + Button 'Từ chối'

TYPOGRAPHY & COLORS:
- Sidebar: Deep Navy #001428, Active item #003B71
- Main area: Background #F8FAFC, Card containers #FFFFFF
- Headings: Montserrat (bold 700/800)
- Body: Roboto Flex / Roboto
- Primary Action: #003B71
Ensure clean enterprise SaaS data-table styling, high legibility, exact matching to provided screenshot.`;

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
  fs.writeFileSync('scratch/stitch_seller_bookings_result.json', JSON.stringify(data, null, 2));
  console.log('Result saved to scratch/stitch_seller_bookings_result.json');
}

main().catch(console.error);
