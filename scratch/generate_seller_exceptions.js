const fs = require('fs');

async function main() {
  const apiKey = 'AQ.Ab8RN6KVPoQitzy8CKEj941C9fe2AHs8X9nE59DgmeFsNb8JFA';
  const url = 'https://stitch.googleapis.com/mcp';
  const projectId = '15917314834578745602';
  const designSystemId = 'assets/80112c3d779646669e7a95c674ec0325';

  console.log('Sending request to generate Seller Center Exceptions screen...');

  const prompt = `Create an exact, high-fidelity pixel-accurate desktop dashboard screen for UEL Space Seller Center (Kênh Người Bán) - Tab 3: Xử lý Vi phạm & Hủy slot (No-Show):
Viewport size: 2560px width by 1440px height. Full desktop responsive presentation.

LAYOUT STRUCTURE:
1. FIXED LEFT SIDEBAR (w-72 / 288px width, background deep navy blue #001428 with subtle dark architectural blur overlay, text white, border-r border-[#002D5C]/80):
   - TOP HEADER:
     Official UEL SPACE white brand logo with university crest ('UEL SPACE' bold white, 'Smart Campus Space Management' subtitle).
   - NAVIGATION MENU:
     * Section label: 'VẬN HÀNH GIAN HÀNG' (uppercase, 11px, bold, tracking-wider, text-slate-400, px-3 py-2)
     * Tab 1 (INACTIVE): 'Tổng quan & Doanh thu' (dashboard grid icon, text-slate-300 px-3.5 py-2.5)
     * Tab 2 (INACTIVE): 'Quản lý Đơn thuê (Booking Orders)' with badge '5' in white pill (clipboard-check icon, text-slate-300)
     * Tab 3 (ACTIVE): 'Xử lý Vi phạm & Hủy slot' with badge '2' in white pill (bg #003B71 text white font-bold rounded-xl px-3.5 py-2.5, alert-triangle icon)
     * Tab 4 (INACTIVE): 'Trạm Check-in Gian hàng' with pill 'KIOSK' (qr-code icon, text-slate-300)
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
     * Left breadcrumb: 'Kênh Người Bán (Seller Center)' (text-xs text-slate-400) / 'XỬ LÝ VI PHẠM & HỦY SLOT (NO-SHOW)' (text-sm font-black text-slate-900 uppercase)
     * Right actions:
       - Button 'Quét QR Khách Check-in' (Navy blue #003B71 bg, text white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2)
       - Campus tag: 'Gian hàng: UEL Space Partner Hub' (pill with light blue bg, text-blue-700 font-bold text-xs px-3 py-1.5 rounded-full border border-blue-200)
       - Notification bell with red badge '4' (rounded-xl border border-slate-200 p-2)
       - Profile: User avatar + 'Chủ Gian Hàng UEL Space Partner Hub' (font-bold text-xs text-slate-900) / 'seller.partner@uelspace.vn' (text-[10px] text-slate-400)

   - MAIN CONTENT BODY (padding 32px, space-y-6):
     * BUSINESS RULE EXPLANATION BANNER (bg #F8FAFC, border 1px solid #E2E8F0, rounded-2xl, p-5, flex items-start gap-4):
       - Clock / Info icon box (w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0)
       - Content:
         * Title: 'CƠ CHẾ PHÁT HIỆN VẮNG MẶT & THU HỒI CHỖ TỰ ĐỘNG (F21 - F23 & F38)' (uppercase, font-bold 13px text-slate-900 tracking-wider)
         * Description: 'Hệ thống tự động rà quét session mỗi 5 phút. Khi khách thuê vắng mặt quá 15 phút (away_warning_minutes) mà không quét mã QR xác nhận sự hiện diện (Presence Tracking F09), hệ thống tự động đưa vào danh sách ngoại lệ chờ Admin can thiệp hoặc giải phóng chỗ cho khách khác.' (text-xs text-slate-600 leading-relaxed mt-1)

     * 3 EXCEPTION CASES CARDS (3 columns grid, gap 24px, margin-top 24px):
       - Card 1:
         * Top row:
           - Title: 'Phòng Đào tạo & Workshop B1.102 (Tầng 1)' (font-bold text-slate-900 text-sm)
           - User: 'Nguyễn Văn Hoàng (Giám đốc Đào tạo)' (text-xs text-slate-700 font-semibold) / 'hoangnv@edupro.vn' (text-[11px] text-slate-400)
           - Right badge: 'CẦN XỬ LÝ' (rose-50 text-rose-700 border-rose-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0)
         * Metrics box (bg #F8FAFC rounded-2xl p-4 border border-slate-200 space-y-2 mt-4):
           - 'Thời gian vắng mặt:' (slate-500) | '22 phút' (bold text-red-600 font-black)
           - 'Ngưỡng cảnh báo:' (slate-500) | '15 phút' (bold text-slate-800)
           - Note: 'Hệ thống phát hiện khách thuê vắng mặt quá 22 phút (quy định tối đa 15 phút), chưa quét lại QR check-in.' (text-xs text-slate-500 pt-2 border-t border-slate-200)
         * Actions area (pt-3 border-t border-slate-100 space-y-2):
           - Grid 2 buttons:
             * 'Đã quay lại' (white bg, border border-slate-200, text-slate-700, font-semibold text-xs py-2.5 rounded-xl)
             * 'Thu hồi phòng' (Navy blue #003B71 bg, text white, font-bold text-xs py-2.5 rounded-xl)
           - Link below: 'Chuyển tiếp báo cáo vi phạm (Escalate)' (text-slate-400 hover:text-slate-600 text-[11px] font-medium text-center block)

       - Card 2:
         * Top row:
           - Title: 'Khu Co-working Hub - Bàn 14' (font-bold text-slate-900 text-sm)
           - User: 'Đỗ Thùy Linh (Creative Director)' (text-xs text-slate-700 font-semibold) / 'linhdh@creativelab.com' (text-[11px] text-slate-400)
           - Right badge: 'CẦN XỬ LÝ' (rose-50 text-rose-700 border-rose-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0)
         * Metrics box (bg #F8FAFC rounded-2xl p-4 border border-slate-200 space-y-2 mt-4):
           - 'Thời gian vắng mặt:' | '35 phút' (bold text-red-600 font-black)
           - 'Ngưỡng cảnh báo:' | '15 phút' (bold text-slate-800)
           - Note: 'Khách thuê giữ chỗ bàn làm việc nhưng vắng mặt quá 35 phút, khách thuê khác gửi khiếu nại yêu cầu giải phóng chỗ.' (text-xs text-slate-500 pt-2 border-t border-slate-200)
         * Actions area (pt-3 border-t border-slate-100 space-y-2):
           - Grid 2 buttons:
             * 'Đã quay lại' (white bg, border border-slate-200, text-slate-700, font-semibold text-xs py-2.5 rounded-xl)
             * 'Thu hồi phòng' (Navy blue #003B71 bg, text white, font-bold text-xs py-2.5 rounded-xl)
           - Link below: 'Chuyển tiếp báo cáo vi phạm (Escalate)' (text-slate-400 hover:text-slate-600 text-[11px] font-medium text-center block)

       - Card 3:
         * Top row:
           - Title: 'Meeting Pod cách âm Solo Booth 03' (font-bold text-slate-900 text-sm)
           - User: 'Lê Minh Tuấn (CTO NextGen)' (text-xs text-slate-700 font-semibold) / 'tuanlm@nextgen.tech' (text-[11px] text-slate-400)
           - Right badge: 'ĐÃ CÓ MẶT' (emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0)
         * Metrics box (bg #F8FAFC rounded-2xl p-4 border border-slate-200 space-y-2 mt-4):
           - 'Thời gian vắng mặt:' | '10 phút' (text-slate-700 font-bold)
           - 'Ngưỡng cảnh báo:' | '15 phút' (bold text-slate-800)
           - Note: 'Khách thuê đã quét mã QR xác nhận quay lại trong thời gian gia hạn.' (text-xs text-slate-500 pt-2 border-t border-slate-200)
         (No action buttons needed for resolved status)

TYPOGRAPHY & COLORS:
- Sidebar: Deep Navy #001428, Active item #003B71
- Main area: Background #F8FAFC, Card containers #FFFFFF
- Headings: Montserrat (bold 700/800)
- Body: Roboto Flex / Roboto
- Accents: Red/Rose #E11D48, Emerald #10B981, Primary Navy #003B71
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
  fs.writeFileSync('scratch/stitch_seller_exceptions_result.json', JSON.stringify(data, null, 2));
  console.log('Result saved to scratch/stitch_seller_exceptions_result.json');
}

main().catch(console.error);
