export function normalizeSpace(space: any) {
    const rawStatus = (space.statusKey || space.status || 'AVAILABLE').toString().toUpperCase();
    let normStatus = 'available';
    let statusText = 'Trống (Khả dụng)';

    if (rawStatus === 'OCCUPIED' || rawStatus === 'IN-USE' || rawStatus === 'IN_USE') {
      normStatus = 'in-use';
      statusText = 'Đang sử dụng';
    } else if (rawStatus === 'RESERVED') {
      normStatus = 'reserved';
      statusText = 'Đã đặt';
    } else if (rawStatus === 'MAINTENANCE') {
      normStatus = 'maintenance';
      statusText = 'Bảo trì';
    } else if (rawStatus === 'RESTRICTED' || rawStatus === 'CLOSED') {
      normStatus = 'maintenance';
      statusText = 'Hạn chế';
    }

    const hourlyPrice = space.hourlyPrice || 120000;
    const dailyPrice = space.dailyPrice || (hourlyPrice * 7);

    // Normalize equipment array
    let facilitiesList: string[] = [];
    if (Array.isArray(space.equipment) && space.equipment.length > 0) {
      facilitiesList = space.equipment.map((e: any) => typeof e === 'string' ? e : (e.name || 'Thiết bị thông minh'));
    } else if (Array.isArray(space.facilities) && space.facilities.length > 0) {
      facilitiesList = space.facilities;
    } else {
      facilitiesList = ['AI Occupancy Detection', 'Màn hình 4K', 'Cáp quang 1Gbps', 'Bảng kính tương tác', 'Máy pha cà phê'];
    }

    const datasetInfo = space.dataset || {
      name: 'FatimaSaadNaik/indoor-scenes-dataset',
      category: space.datasetCategory || 'office',
      caption: space.description || 'Không gian làm việc & hội họp tiêu chuẩn cao',
      fileName: 'scene_photo.jpg'
    };

    return {
      ...space,
      id: space._id || space.id || space.code || 'sp-' + Math.random().toString(36).substring(7),
      _id: space._id || space.id,
      name: space.name,
      type: space.spaceType || space.categoryName || space.type || 'Không gian làm việc',
      capacity: space.capacity || 10,
      areaSize: space.area || space.areaSize || 25,
      floor: space.floorName || space.floor || 'Tầng 1',
      building: space.buildingName || space.building || space.location || 'UEL Central Space',
      location: space.location || space.buildingName || space.building || 'Khuôn viên UEL',
      status: normStatus,
      statusKey: normStatus,
      statusText: statusText,
      hourlyPrice: hourlyPrice,
      dailyPrice: dailyPrice,
      rating: space.rating || 4.9,
      reviewsCount: space.reviewsCount || 45,
      seller: space.seller || {
        name: 'Ban Quản trị UEL Space',
        brandName: 'Ban Quản trị Cơ sở vật chất UEL',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
        rating: 4.9,
        reviewsCount: 120,
        verified: true,
        badge: 'Chính chủ • Đại học Kinh tế - Luật'
      },
      images: (space.images && space.images.length > 0) ? space.images : [space.image || 'spaces/indoor_meeting_room_1.jpg'],
      facilities: facilitiesList,
      tags: space.tags || ['SuperHost', 'AI Occupancy', 'Đặt tức thì'],
      dataset: datasetInfo,
      datasetCategory: datasetInfo.category,
      currentActivity: space.currentActivity || (normStatus === 'in-use' ? 'Đang có doanh nghiệp đối tác họp chiến lược' : 'Không gian hiện hoàn toàn trống, sẵn sàng tiếp nhận đặt chỗ ngay'),
      expectedFreeTime: space.expectedFreeTime || (normStatus === 'in-use' ? 'Dự kiến trống lúc 15:00' : 'Khả dụng cả ngày'),
      todaySlots: space.todaySlots || [
        { period: 'Ca 1 (07:30 - 09:30)', status: 'available', text: 'Trống' },
        { period: 'Ca 2 (09:45 - 11:45)', status: normStatus === 'in-use' ? 'in-use' : 'available', text: normStatus === 'in-use' ? 'Đang dùng' : 'Trống' },
        { period: 'Ca 3 (13:00 - 15:00)', status: normStatus, text: normStatus === 'in-use' ? 'Đang dùng' : 'Trống' },
        { period: 'Ca 4 (15:15 - 17:15)', status: 'available', text: 'Trống' },
        { period: 'Ca 5 (17:30 - 19:30)', status: 'available', text: 'Trống' }
      ]
    };
}

export function getFallbackMarketplaceSpaces(): any[] {
    return [
      {
        _id: 'a2-1',
        name: 'Phòng Họp VIP Executive A2.1 (Meeting Room)',
        spaceType: 'Phòng họp VIP',
        categoryName: 'Phòng họp VIP',
        building: 'TechPark Executive',
        floor: 'Tầng 2',
        location: 'TechPark Tower, Khu Công nghệ cao, TP. Thủ Đức',
        capacity: 15,
        area: 35,
        hourlyPrice: 350000,
        dailyPrice: 2400000,
        rating: 4.96,
        reviewsCount: 88,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_meeting_room_1.jpg',
        images: [
          'spaces/indoor_meeting_room_1.jpg',
          'spaces/indoor_meeting_room_2.jpg',
          'spaces/indoor_meeting_room_3.jpg'
        ],
        tags: ['SuperHost', 'AI Occupancy', 'Màn hình 4K', 'Đặt tức thì'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'meeting_room',
          caption: 'This meeting room there is a long table with chairs around it in a room with a picture hanging on the wall',
          fileName: 'Conference_640x480.jpg'
        },
        seller: {
          id: 'seller-techpark',
          name: 'Trần Minh Quân',
          brandName: 'TechPark Executive Spaces',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
          rating: 4.96,
          reviewsCount: 142,
          verified: true,
          badge: 'SuperHost • Văn phòng Hạng A'
        },
        equipment: ['Màn hình 4K cảm ứng', 'Micro hội nghị đa hướng', 'Cáp quang 1Gbps', 'Bảng kính cường lực', 'AI Occupancy Sensor']
      },
      {
        _id: 'b2-101',
        name: 'Văn phòng riêng Private Suite B2.101 (Office)',
        spaceType: 'Văn phòng riêng',
        categoryName: 'Văn phòng riêng',
        building: 'TechPark Executive',
        floor: 'Tầng 6',
        location: 'TechPark Tower, Khu Công nghệ cao, TP. Thủ Đức',
        capacity: 35,
        area: 55,
        hourlyPrice: 500000,
        dailyPrice: 3500000,
        rating: 4.95,
        reviewsCount: 42,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_office_1.jpg',
        images: [
          'spaces/indoor_office_1.jpg',
          'spaces/indoor_office_2.jpg',
          'spaces/indoor_office_3.jpg'
        ],
        tags: ['SuperHost', 'Khóa vân tay', 'Điều hòa 24/7', 'Bàn giám đốc'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'office',
          caption: 'This office there is a laptop computer sitting on a table in front of a bookshelf filled with books',
          fileName: 'office_001.jpg'
        },
        seller: {
          id: 'seller-techpark',
          name: 'Trần Minh Quân',
          brandName: 'TechPark Executive Spaces',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
          rating: 4.96,
          reviewsCount: 142,
          verified: true,
          badge: 'SuperHost • Văn phòng Hạng A'
        },
        equipment: ['Khóa Smart Lock', 'Bàn làm việc giám đốc', 'Điều hòa độc lập 24/7', 'Bảng từ kính', 'Tủ hồ sơ bảo mật']
      },
      {
        _id: 'thu-vien-2',
        name: 'Khu Làm Việc & Co-study Library Hub (Library)',
        spaceType: 'Thư viện & Co-study',
        categoryName: 'Thư viện & Co-study',
        building: 'Innovation Hub',
        floor: 'Tầng 2',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        capacity: 120,
        area: 180,
        hourlyPrice: 45000,
        dailyPrice: 250000,
        rating: 4.92,
        reviewsCount: 215,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_library_1.jpg',
        images: [
          'spaces/indoor_library_1.jpg',
          'spaces/indoor_library_2.jpg',
          'spaces/indoor_library_3.jpg'
        ],
        tags: ['Co-working', 'Cổng sạc Type-C', 'Pantry cà phê', 'Yên tĩnh'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'library',
          caption: 'these two men are sitting at a table playing a game of chess in a library with bookshelves in the background',
          fileName: 'library_0023.jpg'
        },
        seller: {
          id: 'seller-innovate',
          name: 'Lê Hoàng Long',
          brandName: 'Innovate Co-working Network',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          rating: 4.92,
          reviewsCount: 215,
          verified: true,
          badge: 'SuperHost • Mạng lưới Co-working'
        },
        equipment: ['Wifi công suất lớn Aruba', 'Cổng sạc Type-C & Power Plug', 'Đèn chống cận Ergonomic', 'Tủ locker cá nhân', 'Pantry trà & cà phê']
      },
      {
        _id: 'choi-1',
        name: 'Focus Pod 1 Cách Âm Smart Booth (Office)',
        spaceType: 'Văn phòng riêng',
        categoryName: 'Văn phòng riêng',
        building: 'Innovation Hub',
        floor: 'Tầng 1',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        capacity: 4,
        area: 12,
        hourlyPrice: 70000,
        dailyPrice: 450000,
        rating: 4.94,
        reviewsCount: 56,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_office_4.jpg',
        images: [
          'spaces/indoor_office_4.jpg',
          'spaces/indoor_office_5.jpg'
        ],
        tags: ['Cách âm 35dB', 'Màn hình họp Zoom', 'Quạt thông gió'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'office',
          caption: 'hardwood flooring in a home office with a desk, chair and computer on top of a wooden desk',
          fileName: 'office_004.jpg'
        },
        seller: {
          id: 'seller-innovate',
          name: 'Lê Hoàng Long',
          brandName: 'Innovate Co-working Network',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          rating: 4.92,
          reviewsCount: 215,
          verified: true,
          badge: 'SuperHost • Mạng lưới Co-working'
        },
        equipment: ['Kính cách âm 3 lớp', 'Màn hình họp trực tuyến 32 inch', 'Hệ thống thông gió cưỡng bức', 'Đèn LED tùy chỉnh độ sáng']
      },
      {
        _id: 'choi-2',
        name: 'Meeting Pod Solo Booth 02 (Lobby & Lounge)',
        spaceType: 'Sảnh chờ & Pods',
        categoryName: 'Sảnh chờ & Pods',
        building: 'Innovation Hub',
        floor: 'Tầng 2',
        location: 'Số 15 Xa lộ Hà Nội, P. Linh Trung, TP. Thủ Đức',
        capacity: 2,
        area: 8,
        hourlyPrice: 50000,
        dailyPrice: 320000,
        rating: 4.91,
        reviewsCount: 38,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_lobby_1.jpg',
        images: [
          'spaces/indoor_lobby_1.jpg',
          'spaces/indoor_lobby_2.jpg'
        ],
        tags: ['Solo Booth', 'Cuộc gọi bảo mật', 'Sạc không dây'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'lobby',
          caption: 'This waitingroom several chairs and tables in a room with bookshelves and a book case in the corner of the room',
          fileName: 'waitingroom_0012.jpg'
        },
        seller: {
          id: 'seller-innovate',
          name: 'Lê Hoàng Long',
          brandName: 'Innovate Co-working Network',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
          rating: 4.92,
          reviewsCount: 215,
          verified: true,
          badge: 'SuperHost • Mạng lưới Co-working'
        },
        equipment: ['Cách âm cao cấp', 'Bàn làm việc gọn nhẹ', 'Sạc không dây Qi', 'Đèn cảm ứng chuyển động']
      },
      {
        _id: 'a3-301',
        name: 'Hội Trường & Event Hall Landmark A3 (Auditorium)',
        spaceType: 'Hội trường sự kiện',
        categoryName: 'Hội trường sự kiện',
        building: 'Landmark Lounge',
        floor: 'Tầng 8',
        location: 'Landmark Tower, 208 Nguyễn Hữu Cảnh, Q. Bình Thạnh',
        capacity: 100,
        area: 150,
        hourlyPrice: 750000,
        dailyPrice: 5200000,
        rating: 4.95,
        reviewsCount: 76,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_auditorium_1.jpg',
        images: [
          'spaces/indoor_auditorium_1.jpg',
          'spaces/indoor_auditorium_2.jpg',
          'spaces/indoor_auditorium_3.jpg'
        ],
        tags: ['Sự kiện 100 khách', 'Màn hình LED', 'Âm thanh vòm', 'Bục phát biểu'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'auditorium',
          caption: 'rows of blue chairs in a large auditorium with a podium on the side of the stage and a podium on the other side of the stage',
          fileName: 'auditorium_0001.jpg'
        },
        seller: {
          id: 'seller-landmark',
          name: 'Nguyễn Bích Ngọc',
          brandName: 'Landmark Convention Corp',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
          rating: 4.88,
          reviewsCount: 310,
          verified: true,
          badge: 'Đối tác Doanh nghiệp Uy tín'
        },
        equipment: ['Màn hình LED P2.5', 'Dàn âm thanh Line Array', 'Micro Shure không dây', 'Bục phát biểu', 'Khu vực check-in riêng']
      },
      {
        _id: 'a-hoi-truong',
        name: 'Hội Trường Lớn Grand Auditorium Tòa A (Auditorium)',
        spaceType: 'Hội trường sự kiện',
        categoryName: 'Hội trường sự kiện',
        building: 'Central Tower',
        floor: 'Tầng 1',
        location: 'Central Tower, 58 Lê Duẩn, Quận 1, TP.HCM',
        capacity: 350,
        area: 320,
        hourlyPrice: 1200000,
        dailyPrice: 8500000,
        rating: 4.93,
        reviewsCount: 51,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_auditorium_4.jpg',
        images: [
          'spaces/indoor_auditorium_4.jpg',
          'spaces/indoor_auditorium_1.jpg'
        ],
        tags: ['Quy mô 350 khách', 'Sân khấu lớn', 'Ánh sáng biểu diễn'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'auditorium',
          caption: 'this is an old photo of a large auditorium with red seats and a chandelier hanging from the ceiling',
          fileName: 'auditorium_0045.jpg'
        },
        seller: {
          id: 'seller-landmark',
          name: 'Nguyễn Bích Ngọc',
          brandName: 'Landmark Convention Corp',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
          rating: 4.88,
          reviewsCount: 310,
          verified: true,
          badge: 'Đối tác Doanh nghiệp Uy tín'
        },
        equipment: ['Sân khấu lớn 60m²', 'Dàn ánh sáng sân khấu DMX', 'Hệ thống lạnh trung tâm', 'Phòng kỹ thuật điều khiển âm thanh']
      },
      {
        _id: 'b1-104',
        name: 'Phòng Giảng Đường Đa Năng B1.104 (Classroom)',
        spaceType: 'Giảng đường đa năng',
        categoryName: 'Giảng đường đa năng',
        building: 'Tòa nhà B1',
        floor: 'Tầng 1',
        location: 'Khuôn viên UEL Space Hub, P. Linh Xuân, TP. Thủ Đức',
        capacity: 50,
        area: 60,
        hourlyPrice: 120000,
        dailyPrice: 800000,
        rating: 4.88,
        reviewsCount: 64,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_classroom_1.jpg',
        images: [
          'spaces/indoor_classroom_1.jpg',
          'spaces/indoor_classroom_2.jpg',
          'spaces/indoor_classroom_3.jpg'
        ],
        tags: ['Giảng đường 50 chỗ', 'Máy chiếu Sony', 'Điều hòa 2 chiều'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'classroom',
          caption: 'rows of desks with red chairs in a classroom with windows and drapes on the windowsills',
          fileName: 'classroom_0008.jpg'
        },
        seller: {
          id: 'seller-uel',
          name: 'Đặng Tuấn Anh',
          brandName: 'Ban Quản trị UEL Space',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
          rating: 4.94,
          reviewsCount: 189,
          verified: true,
          badge: 'Ban Quản trị • Đại học Kinh tế - Luật'
        },
        equipment: ['Máy chiếu Full HD', 'Điều hòa công suất lớn', 'Bảng từ bút lông', 'Hệ thống micro trợ giảng']
      },
      {
        _id: 'b1-lab202',
        name: 'Phòng Thực Hành Tin Học B1.202 (Computer Lab)',
        spaceType: 'Phòng máy tính Lab',
        categoryName: 'Phòng máy tính Lab',
        building: 'Tòa nhà B1',
        floor: 'Tầng 2',
        location: 'Khuôn viên UEL Space Hub, P. Linh Xuân, TP. Thủ Đức',
        capacity: 40,
        area: 75,
        hourlyPrice: 250000,
        dailyPrice: 1700000,
        rating: 4.90,
        reviewsCount: 39,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_computerroom_1.jpg',
        images: [
          'spaces/indoor_computerroom_1.jpg',
          'spaces/indoor_computerroom_2.jpg',
          'spaces/indoor_computerroom_3.jpg'
        ],
        tags: ['40 PC Core i7', 'Mạng Gigabit', 'Máy chiếu'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'computerroom',
          caption: 'This computerroom there are many computers sitting on the desks in a room with wood flooring and a large window',
          fileName: 'computerroom_0019.jpg'
        },
        seller: {
          id: 'seller-uel',
          name: 'Đặng Tuấn Anh',
          brandName: 'Ban Quản trị UEL Space',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
          rating: 4.94,
          reviewsCount: 189,
          verified: true,
          badge: 'Ban Quản trị • Đại học Kinh tế - Luật'
        },
        equipment: ['40 Máy tính Core i7 16GB', 'Hạ tầng switch mạng Gigabit', 'Máy chiếu giảng viên', 'Phần mềm bản quyền']
      },
      {
        _id: 'a-105',
        name: 'Studio Sáng Tạo Creative Media A.105 (Studio)',
        spaceType: 'Media Studio & Pod',
        categoryName: 'Media Studio & Pod',
        building: 'Creative Hub Center',
        floor: 'Tầng 4',
        location: 'Creative Hub, 42 Nguyễn Huệ, Quận 1, TP.HCM',
        capacity: 16,
        area: 45,
        hourlyPrice: 300000,
        dailyPrice: 2100000,
        rating: 4.97,
        reviewsCount: 63,
        status: 'AVAILABLE',
        statusKey: 'available',
        statusText: 'Trống (Khả dụng)',
        image: 'spaces/indoor_studio_1.jpg',
        images: [
          'spaces/indoor_studio_1.jpg',
          'spaces/indoor_studio_2.jpg',
          'spaces/indoor_studio_3.jpg'
        ],
        tags: ['Phông xanh', 'Đèn quay Nanlite', 'Micro Rode', 'Livestream 4K'],
        dataset: {
          name: 'FatimaSaadNaik/indoor-scenes-dataset',
          category: 'studio',
          caption: 'This tv studio there is a group of people that are standing in front of a news set with a television set in the background',
          fileName: 'tv_studio_0004.jpg'
        },
        seller: {
          id: 'seller-creative',
          name: 'Vũ Thảo My',
          brandName: 'Creative Hub Media Studios',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
          rating: 4.95,
          reviewsCount: 78,
          verified: true,
          badge: 'Studio Chuyên nghiệp • Creator Hub'
        },
        equipment: ['Phông xanh kéo tự động', 'Bộ đèn LED studio Nanlite', 'Micro Rode PodMic', 'Bàn trộn âm thanh RodeCaster Pro', 'Màn hình preview 4K']
      }
    ];
}
