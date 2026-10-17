const { SPACE_STATUS } = require('../constants');

const STATUS_TEXT = {
  AVAILABLE: 'Trống',
  RESERVED: 'Đã đặt trước',
  OCCUPIED: 'Đang sử dụng',
  MAINTENANCE: 'Đang bảo trì',
  CLOSED: 'Tạm đóng',
  PENDING_APPROVAL: 'Chờ duyệt',
  REJECTED: 'Từ chối'
};

const STATUS_KEY = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'in-use',
  MAINTENANCE: 'maintenance',
  CLOSED: 'closed',
  PENDING_APPROVAL: 'pending-approval',
  REJECTED: 'rejected'
};

function toMinutes(hhmm) {
  if (typeof hhmm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function timeRangeOverlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function formatTimeSlot(startTime, endTime) {
  const fmt = (d) => {
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  return `${fmt(startTime)} - ${fmt(endTime)}`;
}

function formatDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function createSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createSpaceSlug(space) {
  if (!space) return 'khong-gian';
  if (space.slug && typeof space.slug === 'string') return space.slug;
  const nameSlug = createSlug(space.name || 'khong-gian');
  const code = (space.code || space.id || space._id || '').toString();
  const cleanCode = createSlug(code);
  if (!cleanCode || nameSlug.endsWith(cleanCode) || nameSlug === cleanCode) {
    return nameSlug || 'khong-gian';
  }
  const parts = cleanCode.split('-');
  const lastPart = parts[parts.length - 1];
  if (nameSlug.includes(parts[0]) && parts.length > 1) {
    return `${nameSlug}-${lastPart}`;
  }
  return `${nameSlug}-${cleanCode}`;
}

function decorateSpace(space) {
  if (!space) return space;
  const status = space.status || SPACE_STATUS.AVAILABLE;
  const capacity = space.capacity ?? 0;
  const currentOccupants = space.currentOccupants ?? 0;
  return {
    ...space,
    slug: space.slug || createSpaceSlug(space),
    spaceType: space.categoryName || space.spaceType || 'Khác',
    building: space.buildingName || space.building || '',
    floor: space.floorName || space.floor || '',
    capacityText: `${capacity} người`,
    areaSize: space.area ?? space.areaSize ?? 0,
    statusKey: STATUS_KEY[status] || 'available',
    statusText: STATUS_TEXT[status] || 'Không xác định',
    occupancyRate: capacity > 0 ? Math.round((currentOccupants / capacity) * 100) : 0
  };
}

function toLegacySpace(space) {
  const decorated = decorateSpace(space);
  return {
    id: decorated._id,
    name: decorated.name,
    building: decorated.building,
    spaceType: decorated.spaceType,
    capacity: decorated.capacity ?? 0,
    capacityText: decorated.capacityText,
    areaSize: decorated.areaSize,
    hourlyPrice: decorated.hourlyPrice || 150000,
    dailyPrice: decorated.dailyPrice || ((decorated.hourlyPrice || 150000) * 7),
    rating: decorated.rating || 4.9,
    reviewsCount: decorated.reviewsCount || 48,
    sellerId: decorated.sellerId,
    seller: decorated.seller,
    location: decorated.location || decorated.building,
    tags: decorated.tags || ['SuperHost', 'AI Occupancy', 'Đặt tức thì'],
    instantBooking: decorated.instantBooking !== false,
    images: decorated.images || [decorated.image || 'spaces/space_a2_1_meeting_vip.jpg'],
    status: decorated.statusKey,
    statusText: decorated.statusText,
    equipment: (decorated.equipment || []).map((item) => (typeof item === 'string' ? item : item.name)),
    image: decorated.image || 'spaces/space_a2_1_meeting_vip.jpg'
  };
}

module.exports = {
  STATUS_TEXT,
  STATUS_KEY,
  toMinutes,
  timeRangeOverlaps,
  formatTimeSlot,
  formatDate,
  decorateSpace,
  toLegacySpace,
  createSlug,
  createSpaceSlug
};
