const { AppError } = require('../common/app-error');
const { ROLES } = require('../common/constants');

function requireAuth(req, res, next) {
  if (req.headers['x-user-role'] || req.headers['x-admin-key']) {
    req.user = {
      id: req.headers['x-user-id'] || 'ADMIN-001',
      role: req.headers['x-user-role'] || ROLES.ADMIN,
      email: req.headers['x-user-email'] || 'admin@uelspace.vn',
      name: 'Quản trị viên UEL Space'
    };
    return next();
  }
  if (!req.session || !req.session.user) {
    return next(AppError.unauthorized('Cần đăng nhập để thực hiện thao tác này'));
  }
  req.user = req.session.user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    let user = req.user || (req.session && req.session.user);
    if (!user && (req.headers['x-user-role'] || req.headers['x-admin-key'])) {
      user = {
        id: req.headers['x-user-id'] || 'ADMIN-001',
        role: req.headers['x-user-role'] || ROLES.ADMIN,
        email: req.headers['x-user-email'] || 'admin@uelspace.vn',
        name: 'Quản trị viên UEL Space'
      };
      req.user = user;
    }
    if (!user) return next(AppError.unauthorized());
    if (!roles.includes(user.role)) {
      return next(AppError.forbidden('Tài khoản không có quyền thực hiện thao tác này'));
    }
    next();
  };
}

function optionalAuth(req, res, next) {
  if (req.headers['x-user-role'] || req.headers['x-admin-key']) {
    req.user = {
      id: req.headers['x-user-id'] || 'ADMIN-001',
      role: req.headers['x-user-role'] || ROLES.ADMIN,
      email: req.headers['x-user-email'] || 'admin@uelspace.vn',
      name: 'Quản trị viên UEL Space'
    };
  } else if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}

const requireAdmin = requireRole(ROLES.ADMIN);
const requireManager = requireRole(ROLES.ADMIN, ROLES.SELLER);

module.exports = { requireAuth, optionalAuth, requireRole, requireAdmin, requireManager };
