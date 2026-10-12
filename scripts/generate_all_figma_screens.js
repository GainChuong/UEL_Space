const { callFigma } = require('./figma_client');

// Utility to create clean visual designs on Figma
async function buildDesignSystemAndScreens() {
  console.log('🚀 Starting Figma Canvas Generation for UEL Space...');

  // Phase 1: Setup Fonts, Colors, Cover & Tokens
  const phase1Code = `
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    // Clear existing children on page for clean presentation
    for (const child of figma.currentPage.children) {
      child.remove();
    }

    // Helper functions
    function createColor(r, g, b, a = 1) {
      return [{ type: 'SOLID', color: { r: r/255, g: g/255, b: b/255 }, opacity: a }];
    }

    // ==========================================
    // SCREEN 1: COVER & BRAND TOKENS (X: 0)
    // ==========================================
    const cover = figma.createFrame();
    cover.name = '00. Cover & Design System';
    cover.resize(1440, 1024);
    cover.x = 0;
    cover.y = 0;
    cover.fills = createColor(1, 29, 61); // UEL Deep Navy #011D3D
    cover.cornerRadius = 24;

    const logoText = figma.createText();
    logoText.characters = 'UEL SPACE';
    logoText.fontSize = 56;
    logoText.fontName = { family: 'Inter', style: 'Bold' };
    logoText.fills = createColor(255, 255, 255);
    logoText.x = 120;
    logoText.y = 160;
    cover.appendChild(logoText);

    const tagBadge = figma.createFrame();
    tagBadge.name = 'Badge';
    tagBadge.resize(320, 44);
    tagBadge.x = 120;
    tagBadge.y = 240;
    tagBadge.cornerRadius = 22;
    tagBadge.fills = createColor(255, 121, 0, 0.15);
    tagBadge.strokes = createColor(255, 121, 0);
    tagBadge.strokeWeight = 1.5;
    
    const tagText = figma.createText();
    tagText.characters = 'Smart Campus & Office Sharing Platform';
    tagText.fontSize = 14;
    tagText.fontName = { family: 'Inter', style: 'Semi Bold' };
    tagText.fills = createColor(255, 121, 0);
    tagText.x = 18;
    tagText.y = 13;
    tagBadge.appendChild(tagText);
    cover.appendChild(tagBadge);

    const descText = figma.createText();
    descText.characters = 'Nền tảng Quản trị & Chia sẻ Không gian Học tập, Làm việc Linh hoạt\\nĐại học Kinh tế - Luật (ĐHQG-HCM) • Tích hợp MoMo Sandbox & AI IoT Camera';
    descText.fontSize = 20;
    descText.fontName = { family: 'Inter', style: 'Regular' };
    descText.fills = createColor(200, 215, 235);
    descText.x = 120;
    descText.y = 310;
    cover.appendChild(descText);

    // Color Palette Swatches
    const colors = [
      { name: 'UEL Deep Navy', hex: '#011D3D', r: 1, g: 29, b: 61 },
      { name: 'UEL Accent Blue', hex: '#003B71', r: 0, g: 59, b: 113 },
      { name: 'UEL Primary Orange', hex: '#FF7900', r: 255, g: 121, b: 0 },
      { name: 'MoMo Brand Pink', hex: '#A50064', r: 165, g: 0, b: 100 },
      { name: 'Emerald Available', hex: '#10B981', r: 16, g: 185, b: 129 },
      { name: 'Amber In-Use/Warning', hex: '#F59E0B', r: 245, g: 158, b: 11 }
    ];

    colors.forEach((c, idx) => {
      const card = figma.createFrame();
      card.name = c.name;
      card.resize(170, 160);
      card.x = 120 + idx * 195;
      card.y = 440;
      card.cornerRadius = 16;
      card.fills = createColor(255, 255, 255, 0.08);
      card.strokes = createColor(255, 255, 255, 0.15);
      card.strokeWeight = 1;

      const swatch = figma.createRectangle();
      swatch.resize(146, 80);
      swatch.x = 12;
      swatch.y = 12;
      swatch.cornerRadius = 10;
      swatch.fills = createColor(c.r, c.g, c.b);
      card.appendChild(swatch);

      const label = figma.createText();
      label.characters = c.name;
      label.fontSize = 12;
      label.fontName = { family: 'Inter', style: 'Semi Bold' };
      label.fills = createColor(255, 255, 255);
      label.x = 12;
      label.y = 104;
      card.appendChild(label);

      const hexLabel = figma.createText();
      hexLabel.characters = c.hex;
      hexLabel.fontSize = 11;
      hexLabel.fontName = { family: 'Inter', style: 'Regular' };
      hexLabel.fills = createColor(180, 195, 215);
      hexLabel.x = 12;
      hexLabel.y = 126;
      card.appendChild(hexLabel);

      cover.appendChild(card);
    });

    // Site Pages Index
    const pagesNote = figma.createText();
    pagesNote.characters = 'CÁC MÀN HÌNH NẰM BÊN PHẢI (PANEL WORKFLOW):\\n1. [Home] Giao diện Tìm kiếm & Danh sách không gian (Giá theo giờ & Đặt chỗ MoMo)\\n2. [Map] Sơ đồ tương tác khuôn viên UEL & Đối chiếu Thời khóa biểu\\n3. [Booking] Quản lý vé đặt chỗ cá nhân & QR Check-in Code\\n4. [About] Giới thiệu giải pháp Smart Campus & Office Sharing\\n5. [Admin] Dashboard điều hành & Giám sát AI Computer Vision Camera IoT\\n6. [Login] Cổng đăng nhập bảo mật SSO Sinh viên & Khách ngoài';
    pagesNote.fontSize = 14;
    pagesNote.lineHeight = { value: 24, unit: 'PIXELS' };
    pagesNote.fontName = { family: 'Inter', style: 'Regular' };
    pagesNote.fills = createColor(160, 185, 215);
    pagesNote.x = 120;
    pagesNote.y = 660;
    cover.appendChild(pagesNote);

    return { success: true, coverId: cover.id };
  `;

  console.log('📦 Executing Phase 1: Cover & Tokens...');
  const res1 = await callFigma(phase1Code, 'Generate Cover Frame & Color Tokens');
  console.log('Phase 1 result:', res1?.result?.content?.[0]?.text || 'Done');

  // Phase 2: Home Screen (X: 1600)
  const phase2Code = `
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    function createColor(r, g, b, a = 1) {
      return [{ type: 'SOLID', color: { r: r/255, g: g/255, b: b/255 }, opacity: a }];
    }

    const home = figma.createFrame();
    home.name = '01. Home - Không gian sẵn sàng phục vụ';
    home.resize(1440, 1024);
    home.x = 1600;
    home.y = 0;
    home.fills = createColor(248, 250, 252); // #F8FAFC
    home.cornerRadius = 24;

    // Header Navbar
    const header = figma.createFrame();
    header.name = 'Navbar';
    header.resize(1440, 72);
    header.fills = createColor(255, 255, 255);
    header.strokes = createColor(226, 232, 240);
    header.strokeWeight = 1;

    const brand = figma.createText();
    brand.characters = 'UEL SPACE';
    brand.fontSize = 20;
    brand.fontName = { family: 'Inter', style: 'Bold' };
    brand.fills = createColor(0, 59, 113);
    brand.x = 64;
    brand.y = 24;
    header.appendChild(brand);

    const navLinks = ['Trang chủ', 'Bản đồ phòng', 'Vé đặt chỗ', 'Giới thiệu', 'Quản trị Admin'];
    navLinks.forEach((link, i) => {
      const t = figma.createText();
      t.characters = link;
      t.fontSize = 14;
      t.fontName = { family: 'Inter', style: i === 0 ? 'Bold' : 'Medium' };
      t.fills = i === 0 ? createColor(0, 59, 113) : createColor(100, 116, 139);
      t.x = 320 + i * 140;
      t.y = 27;
      header.appendChild(t);
    });

    const userBtn = figma.createFrame();
    userBtn.name = 'User Profile';
    userBtn.resize(160, 40);
    userBtn.x = 1216;
    userBtn.y = 16;
    userBtn.cornerRadius = 20;
    userBtn.fills = createColor(241, 245, 249);
    const userTxt = figma.createText();
    userTxt.characters = 'Nguyễn Giang • K24';
    userTxt.fontSize = 12;
    userTxt.fontName = { family: 'Inter', style: 'Semi Bold' };
    userTxt.fills = createColor(15, 23, 42);
    userTxt.x = 16;
    userTxt.y = 12;
    userBtn.appendChild(userTxt);
    header.appendChild(userBtn);

    home.appendChild(header);

    // Hero Banner
    const hero = figma.createFrame();
    hero.name = 'Hero Banner';
    hero.resize(1312, 200);
    hero.x = 64;
    hero.y = 96;
    hero.cornerRadius = 24;
    hero.fills = createColor(1, 29, 61);

    const heroTitle = figma.createText();
    heroTitle.characters = 'Tìm & Đặt chỗ Không gian Học tập UEL';
    heroTitle.fontSize = 32;
    heroTitle.fontName = { family: 'Inter', style: 'Bold' };
    heroTitle.fills = createColor(255, 255, 255);
    heroTitle.x = 48;
    heroTitle.y = 40;
    hero.appendChild(heroTitle);

    const heroSub = figma.createText();
    heroSub.characters = 'Hệ thống phòng tự học, phòng họp và giảng đường thông minh • Thanh toán MoMo Sandbox QR';
    heroSub.fontSize = 15;
    heroSub.fontName = { family: 'Inter', style: 'Regular' };
    heroSub.fills = createColor(203, 213, 225);
    heroSub.x = 48;
    heroSub.y = 90;
    hero.appendChild(heroSub);

    // Filter Bar inside Hero
    const filterBox = figma.createFrame();
    filterBox.name = 'Search Bar';
    filterBox.resize(1216, 56);
    filterBox.x = 48;
    filterBox.y = 124;
    filterBox.cornerRadius = 14;
    filterBox.fills = createColor(255, 255, 255);

    const searchIconText = figma.createText();
    searchIconText.characters = '🔍 Tìm kiếm tên phòng, tòa nhà, thiết bị máy chiếu...';
    searchIconText.fontSize = 13;
    searchIconText.fontName = { family: 'Inter', style: 'Regular' };
    searchIconText.fills = createColor(148, 163, 184);
    searchIconText.x = 24;
    searchIconText.y = 19;
    filterBox.appendChild(searchIconText);

    const btnFilter = figma.createFrame();
    btnFilter.name = 'Filter Button';
    btnFilter.resize(140, 40);
    btnFilter.x = 1060;
    btnFilter.y = 8;
    btnFilter.cornerRadius = 10;
    btnFilter.fills = createColor(255, 121, 0);
    const btnTxt = figma.createText();
    btnTxt.characters = 'Tìm phòng ngay';
    btnTxt.fontSize = 13;
    btnTxt.fontName = { family: 'Inter', style: 'Bold' };
    btnTxt.fills = createColor(255, 255, 255);
    btnTxt.x = 22;
    btnTxt.y = 12;
    btnFilter.appendChild(btnTxt);
    filterBox.appendChild(btnFilter);

    hero.appendChild(filterBox);
    home.appendChild(hero);

    // Section Title
    const secTitle = figma.createText();
    secTitle.characters = 'Không gian sẵn sàng phục vụ (8 không gian)';
    secTitle.fontSize = 20;
    secTitle.fontName = { family: 'Inter', style: 'Bold' };
    secTitle.fills = createColor(15, 23, 42);
    secTitle.x = 64;
    secTitle.y = 320;
    home.appendChild(secTitle);

    // Sample Room Cards (3 cards row)
    const sampleRooms = [
      { name: 'Phòng B1.104', bldg: 'Tòa nhà B1 - Tầng 1', price: '60.000 VNĐ / giờ', cap: '50 chỗ ngồi', status: 'Khả dụng', color: [16, 185, 129] },
      { name: 'Phòng Họp A2.1', bldg: 'Tòa nhà A - Tầng 2', price: '120.000 VNĐ / giờ', cap: '15 chỗ ngồi', status: 'Khả dụng', color: [16, 185, 129] },
      { name: 'Khu tự học Thư viện', bldg: 'Thư viện - Tầng 2', price: '25.000 VNĐ / giờ', cap: '120 chỗ ngồi', status: 'Khả dụng', color: [16, 185, 129] }
    ];

    sampleRooms.forEach((rm, i) => {
      const card = figma.createFrame();
      card.name = rm.name;
      card.resize(416, 440);
      card.x = 64 + i * 448;
      card.y = 360;
      card.cornerRadius = 20;
      card.fills = createColor(255, 255, 255);
      card.strokes = createColor(226, 232, 240);
      card.strokeWeight = 1;

      // Card Image mockup
      const img = figma.createRectangle();
      img.resize(416, 200);
      img.fills = createColor(226, 232, 240);
      card.appendChild(img);

      // Status pill
      const pill = figma.createFrame();
      pill.resize(80, 28);
      pill.x = 16;
      pill.y = 16;
      pill.cornerRadius = 14;
      pill.fills = createColor(rm.color[0], rm.color[1], rm.color[2]);
      const pillTxt = figma.createText();
      pillTxt.characters = rm.status;
      pillTxt.fontSize = 11;
      pillTxt.fontName = { family: 'Inter', style: 'Bold' };
      pillTxt.fills = createColor(255, 255, 255);
      pillTxt.x = 14;
      pillTxt.y = 7;
      pill.appendChild(pillTxt);
      card.appendChild(pill);

      // MoMo Badge
      const momoPill = figma.createFrame();
      momoPill.resize(80, 28);
      momoPill.x = 320;
      momoPill.y = 16;
      momoPill.cornerRadius = 14;
      momoPill.fills = createColor(165, 0, 100);
      const momoTxt = figma.createText();
      momoTxt.characters = 'MoMo QR';
      momoTxt.fontSize = 11;
      momoTxt.fontName = { family: 'Inter', style: 'Bold' };
      momoTxt.fills = createColor(255, 255, 255);
      momoTxt.x = 14;
      momoTxt.y = 7;
      momoPill.appendChild(momoTxt);
      card.appendChild(momoPill);

      // Card Body
      const cTitle = figma.createText();
      cTitle.characters = rm.name;
      cTitle.fontSize = 18;
      cTitle.fontName = { family: 'Inter', style: 'Bold' };
      cTitle.fills = createColor(15, 23, 42);
      cTitle.x = 20;
      cTitle.y = 220;
      card.appendChild(cTitle);

      const cBldg = figma.createText();
      cBldg.characters = '📍 ' + rm.bldg;
      cBldg.fontSize = 12;
      cBldg.fontName = { family: 'Inter', style: 'Regular' };
      cBldg.fills = createColor(100, 116, 139);
      cBldg.x = 20;
      cBldg.y = 248;
      card.appendChild(cBldg);

      const cPrice = figma.createText();
      cPrice.characters = rm.price;
      cPrice.fontSize = 15;
      cPrice.fontName = { family: 'Inter', style: 'Bold' };
      cPrice.fills = createColor(255, 121, 0);
      cPrice.x = 20;
      cPrice.y = 280;
      card.appendChild(cPrice);

      const cCap = figma.createText();
      cCap.characters = '👥 ' + rm.cap + ' • Wifi, Máy chiếu, Máy lạnh';
      cCap.fontSize = 12;
      cCap.fontName = { family: 'Inter', style: 'Regular' };
      cCap.fills = createColor(71, 85, 105);
      cCap.x = 20;
      cCap.y = 310;
      card.appendChild(cCap);

      // Book Now Button
      const bookBtn = figma.createFrame();
      bookBtn.name = 'Book Button';
      bookBtn.resize(376, 44);
      bookBtn.x = 20;
      bookBtn.y = 370;
      bookBtn.cornerRadius = 12;
      bookBtn.fills = createColor(0, 59, 113);
      const bookTxt = figma.createText();
      bookTxt.characters = 'Thanh toán MoMo & Đặt chỗ';
      bookTxt.fontSize = 13;
      bookTxt.fontName = { family: 'Inter', style: 'Bold' };
      bookTxt.fills = createColor(255, 255, 255);
      bookTxt.x = 100;
      bookTxt.y = 13;
      bookBtn.appendChild(bookTxt);
      card.appendChild(bookBtn);

      home.appendChild(card);
    });

    return { success: true, homeId: home.id };
  `;

  console.log('📦 Executing Phase 2: Home Screen...');
  const res2 = await callFigma(phase2Code, 'Generate Home Screen Frame');
  console.log('Phase 2 result:', res2?.result?.content?.[0]?.text || 'Done');

  // Phase 3: Map Screen (X: 3200)
  const phase3Code = `
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    function createColor(r, g, b, a = 1) {
      return [{ type: 'SOLID', color: { r: r/255, g: g/255, b: b/255 }, opacity: a }];
    }

    const mapFrame = figma.createFrame();
    mapFrame.name = '02. Map - Sơ đồ khuôn viên & TKB';
    mapFrame.resize(1440, 1024);
    mapFrame.x = 3200;
    mapFrame.y = 0;
    mapFrame.fills = createColor(241, 245, 249);
    mapFrame.cornerRadius = 24;

    // Header Navbar
    const header = figma.createFrame();
    header.name = 'Navbar';
    header.resize(1440, 72);
    header.fills = createColor(255, 255, 255);
    header.strokes = createColor(226, 232, 240);
    header.strokeWeight = 1;

    const brand = figma.createText();
    brand.characters = 'UEL SPACE • MAP';
    brand.fontSize = 20;
    brand.fontName = { family: 'Inter', style: 'Bold' };
    brand.fills = createColor(0, 59, 113);
    brand.x = 64;
    brand.y = 24;
    header.appendChild(brand);
    mapFrame.appendChild(header);

    // Left Sidebar: Categories & Buildings
    const sidebar = figma.createFrame();
    sidebar.name = 'Sidebar Filter';
    sidebar.resize(320, 920);
    sidebar.x = 32;
    sidebar.y = 88;
    sidebar.cornerRadius = 20;
    sidebar.fills = createColor(255, 255, 255);
    sidebar.strokes = createColor(226, 232, 240);
    sidebar.strokeWeight = 1;

    const sbTitle = figma.createText();
    sbTitle.characters = 'Danh mục Không gian';
    sbTitle.fontSize = 16;
    sbTitle.fontName = { family: 'Inter', style: 'Bold' };
    sbTitle.fills = createColor(15, 23, 42);
    sbTitle.x = 24;
    sbTitle.y = 24;
    sidebar.appendChild(sbTitle);

    const cats = ['Tất cả phòng (20)', 'Giảng đường lớn', 'Thư viện & Tự học', 'Phòng họp hội nghị', 'Phòng máy tính Lab'];
    cats.forEach((c, idx) => {
      const item = figma.createFrame();
      item.resize(272, 44);
      item.x = 24;
      item.y = 64 + idx * 52;
      item.cornerRadius = 12;
      item.fills = idx === 0 ? createColor(0, 59, 113, 0.08) : createColor(248, 250, 252);
      const itTxt = figma.createText();
      itTxt.characters = c;
      itTxt.fontSize = 13;
      itTxt.fontName = { family: 'Inter', style: idx === 0 ? 'Bold' : 'Medium' };
      itTxt.fills = idx === 0 ? createColor(0, 59, 113) : createColor(71, 85, 105);
      itTxt.x = 16;
      itTxt.y = 13;
      item.appendChild(itTxt);
      sidebar.appendChild(item);
    });

    mapFrame.appendChild(sidebar);

    // Interactive Map Canvas Area
    const mapCanvas = figma.createFrame();
    mapCanvas.name = 'Campus Interactive Map';
    mapCanvas.resize(680, 920);
    mapCanvas.x = 376;
    mapCanvas.y = 88;
    mapCanvas.cornerRadius = 20;
    mapCanvas.fills = createColor(226, 232, 240); // Map background

    const mapTitle = figma.createText();
    mapTitle.characters = 'Bản đồ số Trực quan Khuôn viên UEL';
    mapTitle.fontSize = 16;
    mapTitle.fontName = { family: 'Inter', style: 'Bold' };
    mapTitle.fills = createColor(15, 23, 42);
    mapTitle.x = 24;
    mapTitle.y = 24;
    mapCanvas.appendChild(mapTitle);

    // Building Blocks on Map
    const bldgs = [
      { name: 'TÒA A (Hành chính & Hội trường)', x: 180, y: 140, w: 320, h: 160, color: [0, 59, 113] },
      { name: 'TÒA B1 (Giảng đường & Lab)', x: 100, y: 360, w: 220, h: 180, color: [2, 132, 199] },
      { name: 'TÒA B2 (Phòng học thường)', x: 360, y: 360, w: 220, h: 180, color: [2, 132, 199] },
      { name: 'THƯ VIỆN & TỰ HỌC', x: 220, y: 600, w: 260, h: 150, color: [16, 185, 129] },
      { name: 'Chòi 1', x: 80, y: 790, w: 90, h: 60, color: [245, 158, 11] },
      { name: 'Chòi 2', x: 200, y: 790, w: 90, h: 60, color: [245, 158, 11] },
      { name: 'Chòi 3', x: 320, y: 790, w: 90, h: 60, color: [245, 158, 11] }
    ];

    bldgs.forEach(b => {
      const block = figma.createFrame();
      block.name = b.name;
      block.resize(b.w, b.h);
      block.x = b.x;
      block.y = b.y;
      block.cornerRadius = 16;
      block.fills = createColor(b.color[0], b.color[1], b.color[2]);

      const label = figma.createText();
      label.characters = b.name;
      label.fontSize = 12;
      label.fontName = { family: 'Inter', style: 'Bold' };
      label.fills = createColor(255, 255, 255);
      label.x = 16;
      label.y = 16;
      block.appendChild(label);

      mapCanvas.appendChild(block);
    });

    mapFrame.appendChild(mapCanvas);

    // Right Panel: Selected Room Details & Time Slot Cross-check
    const rightPanel = figma.createFrame();
    rightPanel.name = 'Room Detail & Schedule';
    rightPanel.resize(328, 920);
    rightPanel.x = 1080;
    rightPanel.y = 88;
    rightPanel.cornerRadius = 20;
    rightPanel.fills = createColor(255, 255, 255);
    rightPanel.strokes = createColor(226, 232, 240);
    rightPanel.strokeWeight = 1;

    const rHeader = figma.createText();
    rHeader.characters = 'Phòng B1.104';
    rHeader.fontSize = 20;
    rHeader.fontName = { family: 'Inter', style: 'Bold' };
    rHeader.fills = createColor(0, 59, 113);
    rHeader.x = 24;
    rHeader.y = 24;
    rightPanel.appendChild(rHeader);

    const rSub = figma.createText();
    rSub.characters = 'Tòa nhà B1 - Tầng 1 • Sức chứa 50 người';
    rSub.fontSize = 12;
    rSub.fontName = { family: 'Inter', style: 'Regular' };
    rSub.fills = createColor(100, 116, 139);
    rSub.x = 24;
    rSub.y = 54;
    rightPanel.appendChild(rSub);

    // Price Box
    const pBox = figma.createFrame();
    pBox.resize(280, 72);
    pBox.x = 24;
    pBox.y = 86;
    pBox.cornerRadius = 12;
    pBox.fills = createColor(165, 0, 100, 0.08);
    pBox.strokes = createColor(165, 0, 100, 0.2);
    pBox.strokeWeight = 1;

    const pTitle = figma.createText();
    pTitle.characters = 'Chi phí thuê (MoMo Sandbox QR):';
    pTitle.fontSize = 11;
    pTitle.fontName = { family: 'Inter', style: 'Semi Bold' };
    pTitle.fills = createColor(165, 0, 100);
    pTitle.x = 16;
    pTitle.y = 14;
    pBox.appendChild(pTitle);

    const pAmount = figma.createText();
    pAmount.characters = '120.000 VNĐ / Ca 2 giờ';
    pAmount.fontSize = 16;
    pAmount.fontName = { family: 'Inter', style: 'Bold' };
    pAmount.fills = createColor(165, 0, 100);
    pAmount.x = 16;
    pAmount.y = 38;
    pBox.appendChild(pAmount);

    rightPanel.appendChild(pBox);

    // Today Schedule Shifts (Cross-reference UEL)
    const schTitle = figma.createText();
    schTitle.characters = 'Lịch các ca trong ngày hôm nay:';
    schTitle.fontSize = 13;
    schTitle.fontName = { family: 'Inter', style: 'Bold' };
    schTitle.fills = createColor(15, 23, 42);
    schTitle.x = 24;
    schTitle.y = 180;
    rightPanel.appendChild(schTitle);

    const shifts = [
      { name: 'Ca 1 (07:30 - 09:30)', status: 'Trống', bg: [16, 185, 129] },
      { name: 'Ca 2 (09:45 - 11:45)', status: 'Lớp LHP', bg: [225, 29, 72] },
      { name: 'Ca 3 (13:00 - 15:00)', status: 'Trống', bg: [16, 185, 129] },
      { name: 'Ca 4 (15:15 - 17:15)', status: 'Trống', bg: [16, 185, 129] },
      { name: 'Ca 5 (17:30 - 19:30)', status: 'Trống', bg: [16, 185, 129] }
    ];

    shifts.forEach((s, idx) => {
      const shiftCard = figma.createFrame();
      shiftCard.resize(280, 48);
      shiftCard.x = 24;
      shiftCard.y = 210 + idx * 56;
      shiftCard.cornerRadius = 10;
      shiftCard.fills = createColor(248, 250, 252);
      shiftCard.strokes = createColor(226, 232, 240);
      shiftCard.strokeWeight = 1;

      const sTxt = figma.createText();
      sTxt.characters = s.name;
      sTxt.fontSize = 12;
      sTxt.fontName = { family: 'Inter', style: 'Medium' };
      sTxt.fills = createColor(15, 23, 42);
      sTxt.x = 12;
      sTxt.y = 15;
      shiftCard.appendChild(sTxt);

      const sTag = figma.createFrame();
      sTag.resize(60, 24);
      sTag.x = 208;
      sTag.y = 12;
      sTag.cornerRadius = 6;
      sTag.fills = createColor(s.bg[0], s.bg[1], s.bg[2]);
      const sTagTxt = figma.createText();
      sTagTxt.characters = s.status;
      sTagTxt.fontSize = 10;
      sTagTxt.fontName = { family: 'Inter', style: 'Bold' };
      sTagTxt.fills = createColor(255, 255, 255);
      sTagTxt.x = 14;
      sTagTxt.y = 5;
      sTag.appendChild(sTagTxt);
      shiftCard.appendChild(sTag);

      rightPanel.appendChild(shiftCard);
    });

    // Action button
    const actBtn = figma.createFrame();
    actBtn.resize(280, 48);
    actBtn.x = 24;
    actBtn.y = 520;
    actBtn.cornerRadius = 12;
    actBtn.fills = createColor(165, 0, 100);
    const actTxt = figma.createText();
    actTxt.characters = 'Thanh toán MoMo & Đặt ca này';
    actTxt.fontSize = 13;
    actTxt.fontName = { family: 'Inter', style: 'Bold' };
    actTxt.fills = createColor(255, 255, 255);
    actTxt.x = 42;
    actTxt.y = 15;
    actBtn.appendChild(actTxt);
    rightPanel.appendChild(actBtn);

    mapFrame.appendChild(rightPanel);

    return { success: true, mapId: mapFrame.id };
  `;

  console.log('📦 Executing Phase 3: Map Screen...');
  const res3 = await callFigma(phase3Code, 'Generate Map Screen Frame');
  console.log('Phase 3 result:', res3?.result?.content?.[0]?.text || 'Done');

  // Phase 4: Booking & Passes Screen (X: 4800)
  const phase4Code = `
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    function createColor(r, g, b, a = 1) {
      return [{ type: 'SOLID', color: { r: r/255, g: g/255, b: b/255 }, opacity: a }];
    }

    const booking = figma.createFrame();
    booking.name = '03. Booking - Quản lý Vé đặt chỗ & QR Check-in';
    booking.resize(1440, 1024);
    booking.x = 4800;
    booking.y = 0;
    booking.fills = createColor(248, 250, 252);
    booking.cornerRadius = 24;

    // Header Navbar
    const header = figma.createFrame();
    header.name = 'Navbar';
    header.resize(1440, 72);
    header.fills = createColor(255, 255, 255);
    header.strokes = createColor(226, 232, 240);
    header.strokeWeight = 1;

    const brand = figma.createText();
    brand.characters = 'UEL SPACE • VÉ ĐẶT CHỖ';
    brand.fontSize = 20;
    brand.fontName = { family: 'Inter', style: 'Bold' };
    brand.fills = createColor(0, 59, 113);
    brand.x = 64;
    brand.y = 24;
    header.appendChild(brand);
    booking.appendChild(header);

    // Title
    const bTitle = figma.createText();
    bTitle.characters = 'Vé Đặt chỗ Của bạn';
    bTitle.fontSize = 28;
    bTitle.fontName = { family: 'Inter', style: 'Bold' };
    bTitle.fills = createColor(15, 23, 42);
    bTitle.x = 64;
    bTitle.y = 110;
    booking.appendChild(bTitle);

    const bSub = figma.createText();
    bSub.characters = 'Quản lý vé check-in, đối soát thanh toán MoMo Sandbox và đồng bộ lịch học Google Calendar';
    bSub.fontSize = 14;
    bSub.fontName = { family: 'Inter', style: 'Regular' };
    bSub.fills = createColor(100, 116, 139);
    bSub.x = 64;
    bSub.y = 150;
    booking.appendChild(bSub);

    // Main Ticket Pass Card (Featured Active Ticket)
    const ticketCard = figma.createFrame();
    ticketCard.name = 'Ticket Pass - UEL-88392';
    ticketCard.resize(800, 480);
    ticketCard.x = 64;
    ticketCard.y = 190;
    ticketCard.cornerRadius = 24;
    ticketCard.fills = createColor(255, 255, 255);
    ticketCard.strokes = createColor(226, 232, 240);
    ticketCard.strokeWeight = 1;

    // Ticket Header Banner
    const tHead = figma.createFrame();
    tHead.resize(800, 110);
    tHead.fills = createColor(1, 29, 61);
    tHead.cornerRadius = 24;

    const tCode = figma.createText();
    tCode.characters = 'VÉ CHECK-IN: UEL-88392';
    tCode.fontSize = 18;
    tCode.fontName = { family: 'Inter', style: 'Bold' };
    tCode.fills = createColor(255, 121, 0);
    tCode.x = 32;
    tCode.y = 28;
    tHead.appendChild(tCode);

    const tStatus = figma.createText();
    tStatus.characters = '✓ ĐÃ DUYỆT • ĐÃ THANH TOÁN MOMO';
    tStatus.fontSize = 12;
    tStatus.fontName = { family: 'Inter', style: 'Bold' };
    tStatus.fills = createColor(16, 185, 129);
    tStatus.x = 32;
    tStatus.y = 60;
    tHead.appendChild(tStatus);
    ticketCard.appendChild(tHead);

    // Ticket Body Info
    const rName = figma.createText();
    rName.characters = 'Phòng Thực hành Tin học B1.202';
    rName.fontSize = 22;
    rName.fontName = { family: 'Inter', style: 'Bold' };
    rName.fills = createColor(15, 23, 42);
    rName.x = 32;
    rName.y = 140;
    ticketCard.appendChild(rName);

    const rLocation = figma.createText();
    rLocation.characters = '📍 Tòa nhà B1 - Tầng 2 • Khuôn viên Đại học Kinh tế - Luật';
    rLocation.fontSize = 13;
    rLocation.fontName = { family: 'Inter', style: 'Regular' };
    rLocation.fills = createColor(100, 116, 139);
    rLocation.x = 32;
    rLocation.y = 175;
    ticketCard.appendChild(rLocation);

    // Detail rows
    const details = [
      { label: 'Thời gian:', val: 'Hôm nay • Ca 3 (13:00 - 15:00)' },
      { label: 'Người đặt:', val: 'Nguyễn Trần Kim Giang (giangnntk24411@st.uel.edu.vn)' },
      { label: 'Chi phí:', val: '300.000 VNĐ (MoMo Sandbox TransId: MM-98214)' },
      { label: 'Mục đích:', val: 'Thực hành lập trình & Đồ án tốt nghiệp ITB' }
    ];

    details.forEach((d, idx) => {
      const row = figma.createText();
      row.characters = d.label + ' ' + d.val;
      row.fontSize = 13;
      row.fontName = { family: 'Inter', style: 'Regular' };
      row.fills = createColor(51, 65, 85);
      row.x = 32;
      row.y = 220 + idx * 36;
      ticketCard.appendChild(row);
    });

    // QR Code Box on right
    const qrBox = figma.createFrame();
    qrBox.resize(220, 220);
    qrBox.x = 540;
    qrBox.y = 140;
    qrBox.cornerRadius = 16;
    qrBox.fills = createColor(248, 250, 252);
    qrBox.strokes = createColor(203, 213, 225);
    qrBox.strokeWeight = 1;

    const qrInner = figma.createRectangle();
    qrInner.resize(160, 160);
    qrInner.x = 30;
    qrInner.y = 15;
    qrInner.fills = createColor(15, 23, 42); // QR Code silhouette
    qrBox.appendChild(qrInner);

    const qrNote = figma.createText();
    qrNote.characters = 'Quét tại Kiosk AI Camera';
    qrNote.fontSize = 11;
    qrNote.fontName = { family: 'Inter', style: 'Bold' };
    qrNote.fills = createColor(100, 116, 139);
    qrNote.x = 42;
    qrNote.y = 185;
    qrBox.appendChild(qrNote);

    ticketCard.appendChild(qrBox);

    // Action buttons footer
    const gCalBtn = figma.createFrame();
    gCalBtn.resize(260, 44);
    gCalBtn.x = 32;
    gCalBtn.y = 400;
    gCalBtn.cornerRadius = 12;
    gCalBtn.fills = createColor(255, 255, 255);
    gCalBtn.strokes = createColor(203, 213, 225);
    gCalBtn.strokeWeight = 1.5;

    const gTxt = figma.createText();
    gTxt.characters = '📅 Thêm vào Google Calendar';
    gTxt.fontSize = 12;
    gTxt.fontName = { family: 'Inter', style: 'Bold' };
    gTxt.fills = createColor(15, 23, 42);
    gTxt.x = 40;
    gTxt.y = 14;
    gCalBtn.appendChild(gTxt);
    ticketCard.appendChild(gCalBtn);

    const dlIcsBtn = figma.createFrame();
    dlIcsBtn.resize(160, 44);
    dlIcsBtn.x = 308;
    dlIcsBtn.y = 400;
    dlIcsBtn.cornerRadius = 12;
    dlIcsBtn.fills = createColor(241, 245, 249);
    const dlTxt = figma.createText();
    dlTxt.characters = 'Tải file .ICS';
    dlTxt.fontSize = 12;
    dlTxt.fontName = { family: 'Inter', style: 'Semi Bold' };
    dlTxt.fills = createColor(51, 65, 85);
    dlTxt.x = 45;
    dlTxt.y = 14;
    dlIcsBtn.appendChild(dlTxt);
    ticketCard.appendChild(dlIcsBtn);

    booking.appendChild(ticketCard);

    return { success: true, bookingId: booking.id };
  `;

  console.log('📦 Executing Phase 4: Booking Screen...');
  const res4 = await callFigma(phase4Code, 'Generate Booking Screen Frame');
  console.log('Phase 4 result:', res4?.result?.content?.[0]?.text || 'Done');

  // Phase 5: Admin Dashboard & AI Camera Screen (X: 6400)
  const phase5Code = `
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    function createColor(r, g, b, a = 1) {
      return [{ type: 'SOLID', color: { r: r/255, g: g/255, b: b/255 }, opacity: a }];
    }

    const admin = figma.createFrame();
    admin.name = '04. Admin - Dashboard & AI Computer Vision Camera';
    admin.resize(1440, 1024);
    admin.x = 6400;
    admin.y = 0;
    admin.fills = createColor(248, 250, 252);
    admin.cornerRadius = 24;

    // Sidebar
    const side = figma.createFrame();
    side.name = 'Admin Sidebar';
    side.resize(260, 1024);
    side.fills = createColor(1, 29, 61);

    const aBrand = figma.createText();
    aBrand.characters = 'UEL SPACE ADMIN';
    aBrand.fontSize = 16;
    aBrand.fontName = { family: 'Inter', style: 'Bold' };
    aBrand.fills = createColor(255, 121, 0);
    aBrand.x = 24;
    aBrand.y = 32;
    side.appendChild(aBrand);

    const aNavs = [
      { name: '📊 Tổng quan KPI', active: false },
      { name: '🏢 Quản lý Không gian', active: false },
      { name: '📋 Duyệt Đơn Đặt chỗ', active: false },
      { name: '📷 AI Camera IoT (Vision)', active: true },
      { name: '🔍 Trạm Check-in QR Kiosk', active: false },
      { name: '⚙️ Cấu hình Hệ thống', active: false }
    ];

    aNavs.forEach((m, idx) => {
      const item = figma.createFrame();
      item.resize(220, 44);
      item.x = 20;
      item.y = 96 + idx * 56;
      item.cornerRadius = 12;
      item.fills = m.active ? createColor(255, 121, 0) : createColor(255, 255, 255, 0.05);

      const itTxt = figma.createText();
      itTxt.characters = m.name;
      itTxt.fontSize = 13;
      itTxt.fontName = { family: 'Inter', style: m.active ? 'Bold' : 'Medium' };
      itTxt.fills = createColor(255, 255, 255);
      itTxt.x = 16;
      itTxt.y = 13;
      item.appendChild(itTxt);
      side.appendChild(item);
    });

    admin.appendChild(side);

    // Main Header
    const topBar = figma.createFrame();
    topBar.resize(1180, 72);
    topBar.x = 260;
    topBar.y = 0;
    topBar.fills = createColor(255, 255, 255);
    topBar.strokes = createColor(226, 232, 240);
    topBar.strokeWeight = 1;

    const barTitle = figma.createText();
    barTitle.characters = 'Giám sát Công suất Thực tế • AI Computer Vision IoT Camera';
    barTitle.fontSize = 18;
    barTitle.fontName = { family: 'Inter', style: 'Bold' };
    barTitle.fills = createColor(15, 23, 42);
    barTitle.x = 32;
    barTitle.y = 26;
    topBar.appendChild(barTitle);

    admin.appendChild(topBar);

    // AI Camera Video Feed Box (Left 700px)
    const videoFeed = figma.createFrame();
    videoFeed.name = 'AI Live Camera Feed';
    videoFeed.resize(680, 500);
    videoFeed.x = 292;
    videoFeed.y = 100;
    videoFeed.cornerRadius = 20;
    videoFeed.fills = createColor(15, 23, 42); // Dark camera viewport

    // Person Detection Bounding Boxes Mockup
    const pBox1 = figma.createFrame();
    pBox1.resize(120, 240);
    pBox1.x = 160;
    pBox1.y = 140;
    pBox1.cornerRadius = 8;
    pBox1.fills = createColor(16, 185, 129, 0.15);
    pBox1.strokes = createColor(16, 185, 129);
    pBox1.strokeWeight = 2;
    const bTag1 = figma.createText();
    bTag1.characters = 'Person #1 • 98%';
    bTag1.fontSize = 10;
    bTag1.fontName = { family: 'Inter', style: 'Bold' };
    bTag1.fills = createColor(16, 185, 129);
    bTag1.x = 8;
    bTag1.y = 6;
    pBox1.appendChild(bTag1);
    videoFeed.appendChild(pBox1);

    const pBox2 = figma.createFrame();
    pBox2.resize(130, 250);
    pBox2.x = 340;
    pBox2.y = 130;
    pBox2.cornerRadius = 8;
    pBox2.fills = createColor(16, 185, 129, 0.15);
    pBox2.strokes = createColor(16, 185, 129);
    pBox2.strokeWeight = 2;
    const bTag2 = figma.createText();
    bTag2.characters = 'Person #2 • 94%';
    bTag2.fontSize = 10;
    bTag2.fontName = { family: 'Inter', style: 'Bold' };
    bTag2.fills = createColor(16, 185, 129);
    bTag2.x = 8;
    bTag2.y = 6;
    pBox2.appendChild(bTag2);
    videoFeed.appendChild(pBox2);

    // Video Feed Live HUD
    const hud = figma.createText();
    hud.characters = '● LIVE • Hardware Face AI + Vision • 24 FPS • Environment Cam';
    hud.fontSize = 11;
    hud.fontName = { family: 'Inter', style: 'Bold' };
    hud.fills = createColor(16, 185, 129);
    hud.x = 24;
    hud.y = 24;
    videoFeed.appendChild(hud);

    admin.appendChild(videoFeed);

    // Right Analytics Panel (440px)
    const statPanel = figma.createFrame();
    statPanel.name = 'AI Real-time Headcount Stats';
    statPanel.resize(430, 500);
    statPanel.x = 990;
    statPanel.y = 100;
    statPanel.cornerRadius = 20;
    statPanel.fills = createColor(255, 255, 255);
    statPanel.strokes = createColor(226, 232, 240);
    statPanel.strokeWeight = 1;

    const pTitle = figma.createText();
    pTitle.characters = 'Số người thực tế trong phòng';
    pTitle.fontSize = 14;
    pTitle.fontName = { family: 'Inter', style: 'Semi Bold' };
    pTitle.fills = createColor(100, 116, 139);
    pTitle.x = 24;
    pTitle.y = 24;
    statPanel.appendChild(pTitle);

    const pCount = figma.createText();
    pCount.characters = '2 NGƯỜI';
    pCount.fontSize = 36;
    pCount.fontName = { family: 'Inter', style: 'Bold' };
    pCount.fills = createColor(0, 59, 113);
    pCount.x = 24;
    pCount.y = 52;
    statPanel.appendChild(pCount);

    const alertOvertime = figma.createFrame();
    alertOvertime.resize(382, 80);
    alertOvertime.x = 24;
    alertOvertime.y = 120;
    alertOvertime.cornerRadius = 12;
    alertOvertime.fills = createColor(255, 241, 242);
    alertOvertime.strokes = createColor(244, 63, 94);
    alertOvertime.strokeWeight = 1;

    const otTitle = figma.createText();
    otTitle.characters = '⏰ Cảnh báo Quá giờ (Overtime)';
    otTitle.fontSize = 13;
    otTitle.fontName = { family: 'Inter', style: 'Bold' };
    otTitle.fills = createColor(225, 29, 72);
    otTitle.x = 16;
    otTitle.y = 14;
    alertOvertime.appendChild(otTitle);

    const otDesc = figma.createText();
    otDesc.characters = 'Ca đặt kết thúc lúc 11:30 nhưng vẫn còn người trong phòng.\\nTự động gợi ý phụ phí: 50.000đ / block 30 phút.';
    otDesc.fontSize = 11;
    otDesc.fontName = { family: 'Inter', style: 'Regular' };
    otDesc.fills = createColor(159, 18, 57);
    otDesc.x = 16;
    otDesc.y = 36;
    alertOvertime.appendChild(otDesc);

    statPanel.appendChild(alertOvertime);

    // Early Checkout Alert
    const alertEarly = figma.createFrame();
    alertEarly.resize(382, 80);
    alertEarly.x = 24;
    alertEarly.y = 220;
    alertEarly.cornerRadius = 12;
    alertEarly.fills = createColor(236, 253, 245);
    alertEarly.strokes = createColor(16, 185, 129);
    alertEarly.strokeWeight = 1;

    const eaTitle = figma.createText();
    eaTitle.characters = '✓ Tự động Nhận diện Trả phòng sớm';
    eaTitle.fontSize = 13;
    eaTitle.fontName = { family: 'Inter', style: 'Bold' };
    eaTitle.fills = createColor(5, 150, 105);
    eaTitle.x = 16;
    eaTitle.y = 14;
    alertEarly.appendChild(eaTitle);

    const eaDesc = figma.createText();
    eaDesc.characters = 'Phát hiện phòng trống liên tục 3 phút -> Đề xuất giải phóng\\nkhung giờ lên Marketplace cho sinh viên khác đặt ngay.';
    eaDesc.fontSize = 11;
    eaDesc.fontName = { family: 'Inter', style: 'Regular' };
    eaDesc.fills = createColor(6, 95, 70);
    eaDesc.x = 16;
    eaDesc.y = 36;
    alertEarly.appendChild(eaDesc);

    statPanel.appendChild(alertEarly);

    admin.appendChild(statPanel);

    return { success: true, adminId: admin.id };
  `;

  console.log('📦 Executing Phase 5: Admin Screen...');
  const res5 = await callFigma(phase5Code, 'Generate Admin Dashboard & AI Cam Frame');
  console.log('Phase 5 result:', res5?.result?.content?.[0]?.text || 'Done');

  // Phase 6: About & Login Screens (X: 8000 & 9600)
  const phase6Code = `
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    function createColor(r, g, b, a = 1) {
      return [{ type: 'SOLID', color: { r: r/255, g: g/255, b: b/255 }, opacity: a }];
    }

    // ==========================================
    // SCREEN: ABOUT (X: 8000)
    // ==========================================
    const about = figma.createFrame();
    about.name = '05. About - Giới thiệu UEL Space';
    about.resize(1440, 1024);
    about.x = 8000;
    about.y = 0;
    about.fills = createColor(248, 250, 252);
    about.cornerRadius = 24;

    const abTitle = figma.createText();
    abTitle.characters = 'Về Dự án UEL Space Ecosystem';
    abTitle.fontSize = 32;
    abTitle.fontName = { family: 'Inter', style: 'Bold' };
    abTitle.fills = createColor(1, 29, 61);
    abTitle.x = 120;
    abTitle.y = 120;
    about.appendChild(abTitle);

    const abSub = figma.createText();
    abSub.characters = 'Mô hình Quản trị Không gian Thông minh & Chia sẻ Tài nguyên Cơ sở vật chất trường Đại học';
    abSub.fontSize = 16;
    abSub.fontName = { family: 'Inter', style: 'Medium' };
    abSub.fills = createColor(100, 116, 139);
    abSub.x = 120;
    abSub.y = 170;
    about.appendChild(abSub);

    const pillars = [
      { title: '1. Đặt chỗ & Đối chiếu TKB', desc: 'Tự động kiểm tra trùng lịch học chính khóa theo tín chỉ sinh viên UEL, ngăn ngừa xung đột lịch theo Quy chế đào tạo.' },
      { title: '2. Thanh toán Số MoMo Sandbox', desc: 'Thanh toán trực tiếp bằng mã QR MoMo Sandbox chuẩn bảo mật HMAC-SHA256, tự động cấp vé check-in tức thì.' },
      { title: '3. AI Computer Vision IoT', desc: 'Nhận diện số người thực tế trong phòng, phát hiện quá tải công suất, cảnh báo quá giờ và tự động thu hồi phòng trống.' }
    ];

    pillars.forEach((p, idx) => {
      const card = figma.createFrame();
      card.resize(360, 240);
      card.x = 120 + idx * 420;
      card.y = 240;
      card.cornerRadius = 20;
      card.fills = createColor(255, 255, 255);
      card.strokes = createColor(226, 232, 240);
      card.strokeWeight = 1;

      const pt = figma.createText();
      pt.characters = p.title;
      pt.fontSize = 16;
      pt.fontName = { family: 'Inter', style: 'Bold' };
      pt.fills = createColor(0, 59, 113);
      pt.x = 24;
      pt.y = 28;
      card.appendChild(pt);

      const pd = figma.createText();
      pd.characters = p.desc;
      pd.fontSize = 13;
      pd.lineHeight = { value: 22, unit: 'PIXELS' };
      pd.fontName = { family: 'Inter', style: 'Regular' };
      pd.fills = createColor(71, 85, 105);
      pd.x = 24;
      pd.y = 70;
      card.appendChild(pd);

      about.appendChild(card);
    });

    // ==========================================
    // SCREEN: LOGIN (X: 9600)
    // ==========================================
    const login = figma.createFrame();
    login.name = '06. Login - Cổng Đăng nhập UEL SSO';
    login.resize(1440, 1024);
    login.x = 9600;
    login.y = 0;
    login.fills = createColor(255, 255, 255);
    login.cornerRadius = 24;

    // Left Visual Column (640px)
    const leftHero = figma.createFrame();
    leftHero.resize(640, 1024);
    leftHero.fills = createColor(1, 29, 61);

    const lBrand = figma.createText();
    lBrand.characters = 'UEL SPACE';
    lBrand.fontSize = 40;
    lBrand.fontName = { family: 'Inter', style: 'Bold' };
    lBrand.fills = createColor(255, 255, 255);
    lBrand.x = 80;
    lBrand.y = 200;
    leftHero.appendChild(lBrand);

    const lMotto = figma.createText();
    lMotto.characters = 'Cổng đăng nhập hệ thống Quản lý Không gian học tập và nghiên cứu Trường Đại học Kinh tế - Luật.';
    lMotto.fontSize = 16;
    lMotto.lineHeight = { value: 26, unit: 'PIXELS' };
    lMotto.fontName = { family: 'Inter', style: 'Regular' };
    lMotto.fills = createColor(203, 213, 225);
    lMotto.x = 80;
    lMotto.y = 260;
    leftHero.appendChild(lMotto);

    login.appendChild(leftHero);

    // Right Form Column
    const rForm = figma.createFrame();
    rForm.resize(480, 560);
    rForm.x = 800;
    rForm.y = 230;
    rForm.fills = createColor(255, 255, 255);

    const fTitle = figma.createText();
    fTitle.characters = 'Đăng nhập Tài khoản';
    fTitle.fontSize = 28;
    fTitle.fontName = { family: 'Inter', style: 'Bold' };
    fTitle.fills = createColor(15, 23, 42);
    fTitle.x = 0;
    fTitle.y = 0;
    rForm.appendChild(fTitle);

    const fSub = figma.createText();
    fSub.characters = 'Sử dụng Email UEL (@st.uel.edu.vn) hoặc Email đối tác';
    fSub.fontSize = 13;
    fSub.fontName = { family: 'Inter', style: 'Regular' };
    fSub.fills = createColor(100, 116, 139);
    fSub.x = 0;
    fSub.y = 40;
    rForm.appendChild(fSub);

    // Google SSO Button
    const ssoBtn = figma.createFrame();
    ssoBtn.resize(480, 52);
    ssoBtn.x = 0;
    ssoBtn.y = 90;
    ssoBtn.cornerRadius = 14;
    ssoBtn.fills = createColor(255, 255, 255);
    ssoBtn.strokes = createColor(203, 213, 225);
    ssoBtn.strokeWeight = 1.5;

    const ssoTxt = figma.createText();
    ssoTxt.characters = 'Sign in with Google (UEL Workspace)';
    ssoTxt.fontSize = 14;
    ssoTxt.fontName = { family: 'Inter', style: 'Semi Bold' };
    ssoTxt.fills = createColor(15, 23, 42);
    ssoTxt.x = 120;
    ssoTxt.y = 16;
    ssoBtn.appendChild(ssoTxt);
    rForm.appendChild(ssoBtn);

    login.appendChild(rForm);

    // Zoom all screens into view
    figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);

    return { success: true, aboutId: about.id, loginId: login.id };
  `;

  console.log('📦 Executing Phase 6: About & Login Screens...');
  const res6 = await callFigma(phase6Code, 'Generate About & Login Frames');
  console.log('Phase 6 result:', res6?.result?.content?.[0]?.text || 'Done');

  console.log('🎉 ALL FIGMA SCREENS GENERATED SUCCESSFULLY!');
}

buildDesignSystemAndScreens().catch(console.error);
