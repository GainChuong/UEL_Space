const fs = require('fs');

async function main() {
  const apiKey = 'AQ.Ab8RN6KVPoQitzy8CKEj941C9fe2AHs8X9nE59DgmeFsNb8JFA';
  const url = 'https://stitch.googleapis.com/mcp';
  const projectId = '15917314834578745602';
  const designSystemId = 'assets/80112c3d779646669e7a95c674ec0325';

  console.log('Sending request to generate UEL Space Login screen...');

  const prompt = `Create an exact, high-fidelity pixel-accurate desktop authentication screen for UEL Space matching the split-screen layout:
Viewport size: 2560px width by 1440px height. Full desktop responsive presentation.

LAYOUT STRUCTURE (SPLIT SCREEN):
1. LEFT PANEL (58% width, deep navy blue background #001A35 with dark tinted campus library architectural photography background, vignette and blue gradient overlay):
   - TOP-LEFT HEADER (padding 60px 80px):
     Official UEL Logo badge in clean white: Circular university seal with text 'ĐẠI HỌC QUỐC GIA THÀNH PHỐ HỒ CHÍ MINH' / 'TRƯỜNG ĐẠI HỌC KINH TẾ - LUẬT'.
   - BOTTOM-LEFT HERO TEXT BLOCK (padding 80px, pinned towards bottom):
     - Massive bold typography (font Montserrat, 700 weight, 64px, line-height 1.15):
       Line 1: 'Find the right space.' (pure white #FFFFFF)
       Line 2: 'Use it smarter.' (glowing cyan / sky blue #38BDF8)
     - Subtitle paragraph (font Roboto, 18px, text color #94A3B8, max-width 720px, line-height 1.6, margin-top 24px):
       'Nền tảng chia sẻ & cho thuê văn phòng thông minh kết nối doanh nghiệp sở hữu không gian với cá nhân, startup và tổ chức, ứng dụng AI giám sát công suất thực tế.'

2. RIGHT PANEL (42% width, pure white #FFFFFF, elegant rounded left corners border-radius 48px 0 0 48px, shadow-2xl, flex column justify-between, padding 60px 80px):
   - TOP NAVIGATION:
     Link '← Quay lại Trang chủ' (Roboto 14px, #64748B, hover #003B71, font-medium).
   - MAIN AUTHENTICATION CARD (centered vertically):
     - Headline 'Đăng nhập' (Montserrat, bold 800, 36px, #0F172A).
     - Subtitle 'Khám phá và đặt chỗ văn phòng, phòng họp hoặc quản lý không gian của bạn trên UEL Space.' (Roboto 15px, #64748B, margin-top 8px).
     - ROLE SWITCHER TAB BAR (margin-top 28px, background #F1F5F9, padding 6px, rounded-2xl, flex gap-2):
       * Tab 1 (ACTIVE): 'Khách thuê / Doanh nghiệp' (with briefcase icon, white card background #FFFFFF, navy text #003B71, shadow-sm, font-semibold 14px, padding 10px 18px, rounded-xl).
       * Tab 2 (INACTIVE): 'Đối tác sở hữu không gian' (with user/building icon, transparent bg, slate text #64748B, font-medium 14px, padding 10px 18px).
     - FORM INPUTS (margin-top 28px):
       * Label row: 'Tài khoản hoặc Email công ty' (bold 14px #1E293B) and right hint '(Doanh nghiệp, cá nhân hoặc đối tác)' (gray 13px #94A3B8).
       * Input field 1: Filled with 'member@techflow.vn' (bg #F8FAFC, border 1px solid #CBD5E1, rounded-xl, padding 14px 18px, font Roboto 15px #0F172A).
       * Label row: 'Mật khẩu' (bold 14px #1E293B, margin-top 18px).
       * Input field 2: Filled with password bullets '••••••••••' and eye toggle icon on right (bg #F8FAFC, border 1px solid #CBD5E1, rounded-xl, padding 14px 18px).
     - REMEMBER & FORGOT ROW (margin-top 18px, flex justify-between items-center):
       * Left: Checkbox checked (deep navy #003B71 checkmark) + 'Ghi nhớ đăng nhập' (Roboto 14px #334155).
       * Right: 'Quên mật khẩu?' (link #003B71, font-semibold 14px).
     - PRIMARY BUTTON (margin-top 24px):
       * Full-width button: 'Đăng nhập →' (deep rich Navy blue #003B71, text white, font-bold 16px, padding 16px, rounded-xl, shadow-md, text-center).
     - SOCIAL SEPARATOR (margin-top 28px, text-center, relative divider line):
       * Text: 'HOẶC ĐĂNG NHẬP NHANH VỚI GOOGLE' (font-semibold 11px, tracking-widest, color #94A3B8).
     - GOOGLE LOGIN BUTTON (margin-top 18px):
       * Full-width white button with border 1px solid #E2E8F0, rounded-xl, padding 14px, flex items-center justify-center gap-3, shadow-sm.
       * Official multi-color Google 'G' icon + text 'Đăng nhập bằng tài khoản Google' (font-semibold 15px #1E293B).
     - QUICK ADMIN DEMO CALLOUT CARD (margin-top 24px, background #FEF9C3 / #FFFBEB, border 1px solid #FDE68A, rounded-2xl, padding 16px 20px, flex items-center justify-between):
       * Left info: orange status dot '● Tài khoản Quản trị viên UEL Space' (font-bold 13px #92400E) and subtext 'admin@uelspace.vn' (font-mono 12px #B45309).
       * Right CTA: Orange button 'Đăng nhập Admin →' (bg #D97706, text white, font-bold 13px, padding 10px 18px, rounded-xl, shadow-sm).
   - FOOTER INFO (bottom of right panel, text-xs 12px, color #94A3B8, border-t border-slate-100 pt-6 mt-10):
     * Location line: 'Trụ sở chính: Số 669 Đỗ Mười, P. Linh Xuân, TP.HCM | Hỗ trợ đối tác toàn quốc'
     * Bottom row: 'Hotline: 19001239' (left) and '© UEL SPACE 2026' (right).

COLORS & TYPOGRAPHY:
- Primary Navy: #003B71 / #001A35
- Accent Sky: #38BDF8
- Accent Orange: #D97706 / #FF7900
- Background: #F8FAFC and #FFFFFF
- Headings: Montserrat
- Body/Form: Roboto Flex / Roboto
Ensure perfect alignment, clean padding, modern enterprise SaaS look exactly matching the provided screenshot.`;

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
  fs.writeFileSync('scratch/stitch_login_result.json', JSON.stringify(data, null, 2));
  console.log('Result saved to scratch/stitch_login_result.json');
}

main().catch(console.error);
