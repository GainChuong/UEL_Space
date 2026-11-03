const { AppError } = require('./app-error');

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireObject(value, message = 'Dữ liệu gửi lên không hợp lệ') {
  if (!isPlainObject(value)) throw AppError.badRequest(message);
  return value;
}

function requireString(value, field, { min = 1, max = 2000, trim = true } = {}) {
  if (typeof value !== 'string') {
    throw AppError.badRequest(`Trường "${field}" phải là chuỗi`);
  }
  const result = trim ? value.trim() : value;
  if (result.length < min) {
    throw AppError.badRequest(`Trường "${field}" phải có ít nhất ${min} ký tự`);
  }
  if (result.length > max) {
    throw AppError.badRequest(`Trường "${field}" vượt quá ${max} ký tự`);
  }
  return result;
}

function optionalString(value, field, options = {}) {
  if (value === undefined || value === null) return undefined;
  if (value === '') return '';
  return requireString(value, field, options);
}

function requireNumber(value, field, { min = -Infinity, max = Infinity, integer = false } = {}) {
  const result = typeof value === 'string' ? Number(value) : value;
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw AppError.badRequest(`Trường "${field}" phải là số`);
  }
  if (integer && !Number.isInteger(result)) {
    throw AppError.badRequest(`Trường "${field}" phải là số nguyên`);
  }
  if (result < min) throw AppError.badRequest(`Trường "${field}" phải >= ${min}`);
  if (result > max) throw AppError.badRequest(`Trường "${field}" phải <= ${max}`);
  return result;
}

function optionalNumber(value, field, options = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  return requireNumber(value, field, options);
}

function requireEnum(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw AppError.badRequest(`Trường "${field}" phải thuộc: ${allowed.join(', ')}`);
  }
  return value;
}

function parseDate(value, field = 'thời gian') {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw AppError.badRequest(`Trường "${field}" không phải ngày giờ hợp lệ (ISO 8601)`);
  }
  return date;
}

function requireArray(value, field, { min = 0, max = Infinity } = {}) {
  if (!Array.isArray(value)) throw AppError.badRequest(`Trường "${field}" phải là mảng`);
  if (value.length < min) throw AppError.badRequest(`Trường "${field}" cần ít nhất ${min} phần tử`);
  if (value.length > max) throw AppError.badRequest(`Trường "${field}" vượt quá ${max} phần tử`);
  return value;
}

module.exports = {
  isPlainObject,
  requireObject,
  requireString,
  optionalString,
  requireNumber,
  optionalNumber,
  requireEnum,
  parseDate,
  requireArray
};
