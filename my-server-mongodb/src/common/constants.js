const SPACE_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
  CLOSED: 'CLOSED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  REJECTED: 'REJECTED'
});

const SPACE_STATUS_LIST = Object.values(SPACE_STATUS);

const BOOKING_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  IN_USE: 'IN_USE',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW'
});

const BOOKING_STATUS_LIST = Object.values(BOOKING_STATUS);

const SESSION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  WARNING: 'WARNING',
  COMPLETED: 'COMPLETED',
  AUTO_CHECKED_OUT: 'AUTO_CHECKED_OUT'
});

const SESSION_STATUS_LIST = Object.values(SESSION_STATUS);

const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
  BUYER: 'BUYER'
});

const ROLE_LIST = Object.values(ROLES);

const WRITE_ROLES = [ROLES.ADMIN, ROLES.SELLER];

const USER_STATUS = Object.freeze({ ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' });

const INCIDENT_SEVERITY = ['LOW', 'MEDIUM', 'HIGH'];
const INCIDENT_STATUS = ['REPORTED', 'IN_PROCESSING', 'RESOLVED'];

const RELEASE_RESULT = [
  'USER_RETURNED',
  'SPACE_RELEASED',
  'STILL_PENDING',
  'ITEM_FOUND',
  'ESCALATED'
];

const NOTIFICATION_CATEGORY = ['system', 'booking', 'presence'];

const ACTIVITY_TYPES = [
  'SELF_STUDY',
  'GROUP_STUDY',
  'TEACHING',
  'CLUB_ACTIVITY',
  'MEETING',
  'WORKSHOP',
  'EVENT'
];

const DEFAULT_POLICY = Object.freeze({
  checkInWindowMinutes: 10,
  noShowGraceMinutes: 30,
  awayWarningMinutes: 20,
  autoCheckoutMinutes: 45,
  maxUsageMinutes: 240,
  maxBookingCount: 5,
  advanceBookingDays: 14,
  cancellationWindowMinutes: 30
});

const occupancyLevel = (rate) => {
  if (rate < 30) return 'LOW';
  if (rate <= 70) return 'MEDIUM';
  if (rate <= 90) return 'HIGH';
  return 'VERY_HIGH';
};

module.exports = {
  SPACE_STATUS,
  SPACE_STATUS_LIST,
  BOOKING_STATUS,
  BOOKING_STATUS_LIST,
  SESSION_STATUS,
  SESSION_STATUS_LIST,
  ROLES,
  ROLE_LIST,
  WRITE_ROLES,
  USER_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_STATUS,
  RELEASE_RESULT,
  NOTIFICATION_CATEGORY,
  ACTIVITY_TYPES,
  DEFAULT_POLICY,
  occupancyLevel
};
