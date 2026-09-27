const AppError = require('../utils/appError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
};

module.exports = notFoundHandler;
