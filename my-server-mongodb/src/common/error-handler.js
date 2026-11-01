const { AppError } = require('./app-error');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (!(err instanceof AppError)) {
    console.error(err);
  }
  const status = err instanceof AppError ? err.status : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message = err instanceof AppError ? err.message : 'Lỗi hệ thống';
  res.status(status).json({ error: { code, message } });
}

module.exports = { errorHandler };
