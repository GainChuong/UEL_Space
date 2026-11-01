const { AppError } = require('../../common/app-error');
const { newId, now } = require('../../common/id');
const { SPACE_STATUS, SPACE_STATUS_LIST, DEFAULT_POLICY } = require('../../common/constants');
const { requireObject, requireString, optionalString, requireNumber, optionalNumber, requireEnum } = require('../../common/validate');
const { decorateSpace, timeRangeOverlaps, toMinutes } = require('../../common/presenters');
const { writeAudit } = require('../../common/audit');

class SpaceService {
  constructor(repository, { catalogRepository, bookingRepository, scheduleRepository } = {}) {
    this.repository = repository;
    this.catalog = catalogRepository;
    this.bookings = bookingRepository;
    this.schedules = scheduleRepository;
  }

  async resolveRefs(input, existing = {}) {
    let buildingId = input.buildingId ?? existing.buildingId ?? null;
    let floorId = input.floorId ?? existing.floorId ?? null;
    let categoryId = input.categoryId ?? existing.categoryId ?? null;

    let buildingName = existing.buildingName || input.buildingName || input.building || '';
    let floorName = existing.floorName || input.floorName || input.floor || '';
    let categoryName = existing.categoryName || input.categoryName || input.spaceType || '';

    if (this.catalog) {
      if (buildingId && buildingId !== existing.buildingId) {
        try {
          const building = await this.catalog.findBuildingById(buildingId);
          if (building) buildingName = building.name;
        } catch (_) {}
      }
      if (floorId) {
        try {
          const floor = await this.catalog.findFloorById(floorId);
          if (floor) {
            floorName = floor.floorName;
            const parent = await this.catalog.findBuildingById(floor.buildingId);
            if (parent) {
              buildingId = parent._id;
              buildingName = parent.name;
            }
          }
        } catch (_) {}
      }
      if (categoryId) {
        try {
          const category = await this.catalog.findCategoryById(categoryId);
          if (category) categoryName = category.name;
        } catch (_) {}
      }
    }

    if (!buildingName) buildingName = input.building || input.buildingName || 'Tòa nhà A1';
    if (!floorName) floorName = input.floor || input.floorName || 'Tầng 1';
    if (!categoryName) categoryName = input.spaceType || input.categoryName || 'Không gian đa năng';

    return { buildingId, floorId, categoryId, buildingName, floorName, categoryName };
  }

  normalizeEquipment(raw) {
    if (raw === undefined) return undefined;
    if (!Array.isArray(raw)) throw AppError.badRequest('Trường "equipment" phải là mảng');
    return raw.map((item) => {
      if (typeof item === 'string') return { id: null, name: item, quantity: 1, condition: 'GOOD' };
      return {
        id: item.id || null,
        name: String(item.name || '').trim(),
        quantity: Number(item.quantity || 1),
        condition: item.condition || 'GOOD'
      };
    });
  }

  async buildDocument(input, existing = {}) {
    requireObject(input);
    const refs = await this.resolveRefs(input, existing);
    const capacity = input.capacity !== undefined
      ? requireNumber(input.capacity, 'capacity', { min: 1, max: 10000, integer: true })
      : existing.capacity;

    if (capacity === undefined) throw AppError.badRequest('Trường "capacity" là bắt buộc');

    const policy = {
      ...DEFAULT_POLICY,
      ...(existing.policy || {}),
      ...(input.policy || {})
    };
    if (input.awayWarningMinutes !== undefined) {
      policy.awayWarningMinutes = Number(input.awayWarningMinutes);
    }
    if (input.autoCheckoutMinutes !== undefined) {
      policy.autoCheckoutMinutes = Number(input.autoCheckoutMinutes);
    }
    if (policy.awayWarningMinutes >= policy.autoCheckoutMinutes) {
      throw AppError.badRequest('awayWarningMinutes phải nhỏ hơn autoCheckoutMinutes', 'INVALID_POLICY');
    }

    const equipment = this.normalizeEquipment(input.equipment);

    const hourlyPrice = input.hourlyPrice !== undefined 
      ? Number(input.hourlyPrice) 
      : (input.pricePerHour !== undefined 
        ? Number(input.pricePerHour) 
        : (existing.hourlyPrice ?? existing.pricePerHour ?? 150000));

    const dailyPrice = input.dailyPrice !== undefined 
      ? Number(input.dailyPrice) 
      : (input.pricePerDay !== undefined 
        ? Number(input.pricePerDay) 
        : (existing.dailyPrice ?? existing.pricePerDay ?? hourlyPrice * 7));

    const spaceType = input.spaceType || refs.categoryName || existing.spaceType || 'Phòng họp VIP';
    const mainImage = input.image || (Array.isArray(input.images) && input.images[0]) || existing.image || 'spaces/space_a2_1_meeting_vip.jpg';

    return {
      name: input.name !== undefined ? requireString(input.name, 'name', { min: 2 }) : existing.name,
      code: input.code !== undefined ? requireString(input.code, 'code', { min: 1 }).toUpperCase() : (existing.code || `SP-${newId().slice(0, 6).toUpperCase()}`),
      buildingId: refs.buildingId,
      buildingName: refs.buildingName,
      building: refs.buildingName,
      floorId: refs.floorId,
      floorName: refs.floorName,
      floor: refs.floorName,
      categoryId: refs.categoryId,
      categoryName: refs.categoryName,
      spaceType,
      managedBy: input.managedBy ?? existing.managedBy ?? null,
      parentSpaceId: input.parentSpaceId ?? existing.parentSpaceId ?? null,
      capacity,
      area: input.area !== undefined ? requireNumber(input.area, 'area', { min: 0 }) : (existing.area ?? 30),
      areaSize: input.area !== undefined ? Number(input.area) : (existing.areaSize ?? existing.area ?? 30),
      description: input.description !== undefined ? (optionalString(input.description, 'description') || '') : (existing.description || ''),
      image: mainImage,
      images: Array.isArray(input.images) && input.images.length ? input.images : (existing.images || [mainImage]),
      mapPosition: input.mapPosition ?? existing.mapPosition ?? null,
      allowedUsers: input.allowedUsers ?? existing.allowedUsers ?? 'ALL',
      operatingHours: input.operatingHours ?? existing.operatingHours ?? { open: '07:00', close: '21:00' },
      availableDates: Array.isArray(input.availableDates) ? input.availableDates : (existing.availableDates || []),
      policy,
      equipment: equipment !== undefined ? equipment : (existing.equipment || []),
      status: input.status !== undefined ? requireEnum(input.status, 'status', SPACE_STATUS_LIST) : (existing.status || SPACE_STATUS.AVAILABLE),
      hourlyPrice,
      dailyPrice,
      pricePerHour: hourlyPrice,
      pricePerDay: dailyPrice,
      rating: input.rating !== undefined ? Number(input.rating) : (existing.rating ?? 5.0),
      reviewsCount: input.reviewsCount !== undefined ? Number(input.reviewsCount) : (existing.reviewsCount ?? 0),
      location: input.location ?? existing.location ?? `${refs.floorName}, ${refs.buildingName}`,
      tags: Array.isArray(input.tags) ? input.tags : (existing.tags || ['Không gian chuẩn UEL', 'AI Occupancy']),
      sellerId: input.sellerId ?? existing.sellerId ?? 'seller-uel',
      seller: input.seller ?? existing.seller ?? {
        id: 'seller-uel',
        name: 'Ban Quản trị Không gian UEL',
        brandName: 'UEL Smart Campus',
        avatar: 'assets/images/uel_logo.png',
        rating: 4.95,
        reviewsCount: 120,
        verified: true,
        badge: 'Đơn vị Quản trị Chính thức'
      }
    };
  }

  async list(filters = {}) {
    const filter = {};
    if (filters.buildingId) filter.buildingId = filters.buildingId;
    if (filters.floorId) filter.floorId = filters.floorId;
    if (filters.categoryId) filter.categoryId = filters.categoryId;
    if (filters.status) filter.status = filters.status;
    if (filters.minCapacity || filters.maxCapacity) {
      filter.capacity = {};
      if (filters.minCapacity) filter.capacity.$gte = Number(filters.minCapacity);
      if (filters.maxCapacity) filter.capacity.$lte = Number(filters.maxCapacity);
    }
    if (filters.minArea) filter.area = { $gte: Number(filters.minArea) };
    if (filters.keyword) {
      filter.name = { $regex: String(filters.keyword), $options: 'i' };
    }

    if (filters.date || filters.checkInDate) {
      const startDate = filters.checkInDate || filters.date;
      const endDate = filters.checkOutDate || startDate;
      const requested = [];
      const cur = new Date(startDate);
      const stop = new Date(endDate);
      if (!isNaN(cur.getTime()) && !isNaN(stop.getTime())) {
        while (cur <= stop) {
          requested.push(cur.toISOString().slice(0, 10));
          cur.setDate(cur.getDate() + 1);
        }
      } else {
        requested.push(String(startDate).trim());
      }
      if (requested.length > 0) {
        filter.availableDates = { $all: requested };
      }
    }

    const role = filters.role;
    if (role && role !== 'ADMIN') {
      filter.allowedUsers = { $in: ['ALL', role] };
    }

    let spaces = (await this.repository.findAll(filter)).map(decorateSpace);

    if (filters.equipment) {
      const wanted = String(filters.equipment)
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      spaces = spaces.filter((space) =>
        wanted.every((name) => (space.equipment || []).some((eq) => String(eq.name).toLowerCase().includes(name)))
      );
    }

    if (filters.availableAt && filters.endTime) {
      spaces = await this.filterAvailable(spaces, filters.availableAt, filters.endTime);
    }

    return spaces;
  }

  async filterAvailable(spaces, startTime, endTime) {
    if (!this.bookings) return spaces;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw AppError.badRequest('availableAt/endTime không hợp lệ (ISO 8601)');
    }
    const conflicts = await this.bookings.findConflictingForSpaces(
      spaces.map((s) => s._id),
      start,
      end
    );
    const busyIds = new Set(conflicts.map((b) => b.spaceId));
    return spaces.filter((space) => !busyIds.has(space._id));
  }

  async detail(id) {
    const space = await this.repository.findById(id);
    if (!space) throw AppError.notFound('Không tìm thấy không gian');
    return decorateSpace(space);
  }

  async create(input, actorId) {
    const doc = await this.buildDocument(input);
    if (doc.code) {
      const existing = await this.repository.findByCode(doc.code);
      if (existing) throw AppError.conflict('Mã không gian đã tồn tại', 'SPACE_CODE_EXISTS');
    }
    const space = {
      _id: newId(),
      ...doc,
      status: doc.status || SPACE_STATUS.AVAILABLE,
      currentOccupants: 0,
      version: 1,
      deletedAt: null,
      createdAt: now(),
      updatedAt: now()
    };
    await this.repository.insert(space);
    await writeAudit({ actorId, action: 'CREATE', entityName: 'Space', entityId: space._id, changes: { name: space.name, capacity: space.capacity } });
    return decorateSpace(space);
  }

  async update(id, input, actorId) {
    const existing = await this.repository.findById(id);
    if (!existing) throw AppError.notFound('Không tìm thấy không gian');
    const doc = await this.buildDocument(input, existing);
    const updated = await this.repository.update(id, { ...doc, updatedAt: now() });
    await writeAudit({ actorId, action: 'UPDATE', entityName: 'Space', entityId: id, changes: doc });
    return decorateSpace(updated);
  }

  async remove(id, actorId) {
    const existing = await this.repository.findById(id);
    if (!existing) throw AppError.notFound('Không tìm thấy không gian');
    await this.repository.softDelete(id);
    await writeAudit({ actorId, action: 'DELETE', entityName: 'Space', entityId: id, level: 'WARNING' });
  }

  async changeStatus(id, nextStatus, actorId, reason = '') {
    requireEnum(nextStatus, 'status', SPACE_STATUS_LIST);
    const space = await this.repository.findById(id);
    if (!space) throw AppError.notFound('Không tìm thấy không gian');
    if (space.status === SPACE_STATUS.MAINTENANCE && nextStatus === SPACE_STATUS.AVAILABLE && !reason) {
      throw AppError.badRequest('Cần xác nhận/lý do để đưa không gian từ MAINTENANCE về AVAILABLE', 'MAINTENANCE_CONFIRMATION_REQUIRED');
    }
    const updated = await this.repository.update(id, { status: nextStatus, updatedAt: now() });
    await writeAudit({ actorId, action: 'CHANGE_STATUS', entityName: 'Space', entityId: id, changes: { from: space.status, to: nextStatus, reason } });
    return decorateSpace(updated);
  }

  async setOccupancy(id, currentOccupants) {
    return this.repository.update(id, { currentOccupants: Math.max(0, Number(currentOccupants) || 0), updatedAt: now() });
  }

  async syncStatusFromUsage(spaceId) {
    if (!this.bookings) return null;
    const space = await this.repository.findById(spaceId);
    if (!space) return null;
    if ([SPACE_STATUS.MAINTENANCE, SPACE_STATUS.CLOSED].includes(space.status)) return space;

    const activeSessions = await this.bookings.countActiveSessions
      ? await this.bookings.countActiveSessions(spaceId)
      : 0;
    const hasUpcoming = this.bookings.hasUpcomingApproved
      ? await this.bookings.hasUpcomingApproved(spaceId)
      : false;

    let next = SPACE_STATUS.AVAILABLE;
    if (activeSessions > 0) next = SPACE_STATUS.OCCUPIED;
    else if (hasUpcoming) next = SPACE_STATUS.RESERVED;

    if (next !== space.status) {
      await this.repository.update(spaceId, { status: next, updatedAt: now() });
    }
    return next;
  }
}

module.exports = { SpaceService };
