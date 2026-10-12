const { SPACE_STATUS } = require('../constants');

const STATUS_TEXT = {
  AVAILABLE: 'Trống',
  RESERVED: 'Đã đặt trước',
  OCCUPIED: 'Đang sử dụng',
  MAINTENANCE: 'Đang bảo trì',
  CLOSED: 'Tạm đóng'
};

const STATUS_KEY = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'in-use',
  MAINTENANCE: 'maintenance',
  CLOSED: 'closed'
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

function decorateSpace(space) {
  if (!space) return space;
  const status = space.status || SPACE_STATUS.AVAILABLE;
  const capacity = space.capacity ?? 0;
  const currentOccupants = space.currentOccupants ?? 0;
  return {
    ...space,
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
  toLegacySpace
};
