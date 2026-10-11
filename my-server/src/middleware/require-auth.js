const { AppError } = require('../common/app-error');
const { ROLES } = require('../common/constants');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return next(AppError.unauthorized('Cần đăng nhập để thực hiện thao tác này'));
  }
  req.user = req.session.user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.user || (req.session && req.session.user);
    if (!user) return next(AppError.unauthorized());
    if (!roles.includes(user.role)) {
      return next(AppError.forbidden('Tài khoản không có quyền thực hiện thao tác này'));
    }
    next();
  };
}

function optionalAuth(req, res, next) {
  if (req.session && req.session.user) req.user = req.session.user;
  next();
}

const requireAdmin = requireRole(ROLES.ADMIN);
const requireManager = requireRole(ROLES.ADMIN, ROLES.SPACE_MANAGER);

module.exports = { requireAuth, optionalAuth, requireRole, requireAdmin, requireManager };
