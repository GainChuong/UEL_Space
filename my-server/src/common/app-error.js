class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }

  static badRequest(message, code = 'VALIDATION_ERROR') {
    return new AppError(400, code, message);
  }

  static unauthorized(message = 'Cần đăng nhập', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }

  static forbidden(message = 'Không có quyền thực hiện thao tác', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }

  static notFound(message = 'Không tìm thấy tài nguyên', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(409, code, message);
  }
}

module.exports = { AppError };
