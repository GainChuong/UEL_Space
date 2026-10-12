const fs = require('fs');

async function main() {
  const apiKey = 'AQ.Ab8RN6KVPoQitzy8CKEj941C9fe2AHs8X9nE59DgmeFsNb8JFA';
  const url = 'https://stitch.googleapis.com/mcp';
  const projectId = '15917314834578745602';
  const designSystemId = 'assets/80112c3d779646669e7a95c674ec0325';

  console.log('Sending request to generate Seller Center Users & Staff screen...');

  const prompt = `Create an exact, high-fidelity pixel-accurate desktop dashboard screen for UEL Space Seller Center (Kênh Người Bán) - Tab 6: Quản lý Khách thuê & Nhân viên gian hàng:
Viewport size: 2560px width by 1440px height. Full desktop responsive presentation.

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
     * Tab 5 (INACTIVE): 'Không gian & Giá niêm yết' (building icon, text-slate-300)
     * Tab 6 (ACTIVE): 'Khách thuê & Nhân viên' (bg #003B71 text white font-bold rounded-xl px-3.5 py-2.5, users icon)
     * Tab 7 (INACTIVE): 'Lịch sử Giao dịch & Nhật ký' (file-text icon, text-slate-300)
     * Tab 8 (INACTIVE): 'Giám sát Sĩ số IoT & AI' (eye icon, text-slate-300)
   - BOTTOM STORE INFO CARD (pinned to bottom of sidebar, bg-black/25 p-3.5 rounded-xl border border-white/10 mx-3 mb-4):
     * Top line: Star 4.95 (248 reviews) on left + green pill 'ĐỐI TÁC XÁC MINH' on right
     * Middle line: 'UEL Space Marketplace Hub' (text-slate-400 font-mono text-xs)
     * Bottom line: 'Số dư ví khả dụng:' (text-slate-400) + '68,500,000 đ' (vibrant gold/amber-400 font-black text-sm)

2. MAIN CANVAS AREA (flex-1, background #F8FAFC, overflow-y-auto):
   - TOPBAR HEADER (h-16 / 64px, background white #FFFFFF, border-b border-slate-200 px-8 flex items-center justify-between):
     * Left breadcrumb: 'Kênh Người Bán (Seller Center)' (text-xs text-slate-400) / 'QUẢN LÝ KHÁCH THUÊ & NHÂN VIÊN GIAN HÀNG' (text-sm font-black text-slate-900 uppercase)
     * Right actions:
       - Button 'Quét QR Khách Check-in' (Navy blue #003B71 bg, text white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2)
       - Campus tag: 'Gian hàng: UEL Space Partner Hub' (pill with light blue bg, text-blue-700 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200)
       - Notification bell with red badge '4' (rounded-xl border border-slate-200 p-2)
       - Profile: User avatar + 'Chủ Gian Hàng UEL Space Partner Hub' (font-bold text-xs text-slate-900) / 'seller.partner@uelspace.vn' (text-[10px] text-slate-400)

   - MAIN TABLE CONTAINER (bg white #FFFFFF, border 1px solid #E2E8F0, rounded-3xl, p-8, m-8, shadow-xs):
     * HEADER:
       - Title: 'Khách thuê & Nhân viên gian hàng' (font-black text-lg text-slate-900 tracking-tight)
       - Subtitle: 'Quản lý danh sách khách hàng doanh nghiệp, khách cá nhân và nhân viên vận hành gian hàng' (text-xs text-slate-400 mt-1)

     * DATA TABLE (5 columns, rounded-2xl border border-slate-200 overflow-hidden mt-6):
       Headers: 'TÀI KHOẢN & HỌ TÊN' | 'EMAIL' | 'VAI TRÒ (ROLE)' | 'ĐƠN VỊ / TỔ CHỨC' | 'TRẠNG THÁI' (center)

       Rows (matching screenshot exactly):
       - Row 1:
         * Avatar badge: 'N' (rounded-full bg-slate-100 border text-xs font-bold text-slate-700 w-8 h-8 flex items-center justify-center)
         * Name: 'Nguyễn Trần Kim Giang (Chủ Gian Hàng)' (font-bold text-slate-900 text-xs)
         * Email: 'giangntk24411@st.uel.edu.vn' (text-slate-600 font-medium text-xs)
         * Role: 'Chủ Gian Hàng (Host)' (black pill bg-slate-900 text-white font-bold text-[10px] px-3 py-1 rounded-full)
         * Organization: 'UEL Space Partner Store - Chuỗi Văn Phòng Đổi Mới Sáng Tạo' (text-slate-600 text-xs)
         * Status: 'Hoạt động' (green pill emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-3 py-1 rounded-full)

       - Row 2:
         * Avatar badge: 'N'
         * Name: 'Nguyễn Văn Thành (Lễ tân & Vận hành)' (font-bold text-slate-900 text-xs)
         * Email: 'operations@uelspace.vn' (text-slate-600 font-medium text-xs)
         * Role: 'Nhân viên Vận hành' (light blue pill bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] px-3 py-1 rounded-full)
         * Organization: 'Đội Vận hành Gian hàng UEL Space' (text-slate-600 text-xs)
         * Status: 'Hoạt động' (green pill emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-3 py-1 rounded-full)

       - Row 3:
         * Avatar badge: 'T'
         * Name: 'Trần Minh Anh (Founder FinTech Co.)' (font-bold text-slate-900 text-xs)
         * Email: 'anhtm@fintechhub.vn' (text-slate-600 font-medium text-xs)
         * Role: 'Khách thuê Space' (light gray pill bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] px-3 py-1 rounded-full)
         * Organization: 'Công ty Cổ phần Giải pháp FinTech Việt' (text-slate-600 text-xs)
         * Status: 'Hoạt động' (green pill emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-3 py-1 rounded-full)

       - Row 4:
         * Avatar badge: 'T'
         * Name: 'ThS. Lê Hoàng Long (Giám đốc Đào tạo)' (font-bold text-slate-900 text-xs)
         * Email: 'longlh@innovate.edu.vn' (text-slate-600 font-medium text-xs)
         * Role: 'Khách thuê Space' (light gray pill bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] px-3 py-1 rounded-full)
         * Organization: 'Viện Nghiên cứu Đổi mới Sáng tạo & AI' (text-slate-600 text-xs)
         * Status: 'Hoạt động' (green pill emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] px-3 py-1 rounded-full)

       - Row 5:
         * Avatar badge: 'Đ'
         * Name: 'Đỗ Thùy Linh (Trưởng nhóm Dự án)' (font-bold text-slate-900 text-xs)
         * Email: 'linhdh@creativelab.com' (text-slate-600 font-medium text-xs)
         * Role: 'Khách thuê Space' (light gray pill bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] px-3 py-1 rounded-full)
         * Organization: 'Creative Media Agency' (text-slate-600 text-xs)
         * Status: 'Tạm khóa' (rose pill rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] px-3 py-1 rounded-full)

TYPOGRAPHY & COLORS:
- Sidebar: Deep Navy #001428, Active item #003B71
- Main area: Background #F8FAFC, Card containers #FFFFFF
- Headings: Montserrat (bold 700/800)
- Body: Roboto Flex / Roboto
- Status: Emerald #10B981, Rose #E11D48
Ensure clean enterprise SaaS data-table styling, exact 1:1 match to the provided screenshot.`;

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
  fs.writeFileSync('scratch/stitch_seller_users_result.json', JSON.stringify(data, null, 2));
  console.log('Result saved to scratch/stitch_seller_users_result.json');
}

main().catch(console.error);
