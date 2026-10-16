import { SPACES_100_DATA } from './spaces_100_data';

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
        brandName: 'Ban Quản trị Cơ sở vật chất UEL Space',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
        rating: 4.89,
        reviewsCount: 94,
        verified: true,
        badge: 'Đại học Kinh tế - Luật Official'
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
    return SPACES_100_DATA;
}
