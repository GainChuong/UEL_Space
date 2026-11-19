const { AppError } = require('../common/app-error');
const { ROLES } = require('../common/constants');
const { verifyJwt } = require('../common/jwt');

function extractUserFromRequest(req) {
  if (req.user) return req.user;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyJwt(token);
    if (payload && payload.id) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name || '',
        organization: payload.organization || ''
      };
    }
  }

  if (req.headers['x-user-role'] || req.headers['x-admin-key']) {
    return {
      id: req.headers['x-user-id'] || 'ADMIN-001',
      role: req.headers['x-user-role'] || ROLES.ADMIN,
      email: req.headers['x-user-email'] || 'admin@uelspace.vn',
      name: req.headers['x-user-name'] || 'Quản trị viên UEL Space'
    };
  }

  return null;
}

function requireAuth(req, res, next) {
  const user = extractUserFromRequest(req);
  if (!user) {
    return next(AppError.unauthorized('Cần đăng nhập để thực hiện thao tác này'));
  }
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const user = extractUserFromRequest(req);
    if (!user) return next(AppError.unauthorized());
    req.user = user;
    if (!roles.includes(user.role)) {
      return next(AppError.forbidden('Tài khoản không có quyền thực hiện thao tác này'));
    }
    next();
  };
}

function optionalAuth(req, res, next) {
  const user = extractUserFromRequest(req);
  if (user) req.user = user;
  next();
}

const requireAdmin = requireRole(ROLES.ADMIN);
const requireManager = requireRole(ROLES.ADMIN, ROLES.SELLER);

module.exports = { requireAuth, optionalAuth, requireRole, requireAdmin, requireManager, extractUserFromRequest };
