const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Middleware that attaches a unique correlation ID (X-Request-ID) to each request
 * and logs structured timing and context information upon completion.
 */
function requestCorrelationMiddleware(req, res, next) {
  const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-ID', correlationId);

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const logData = {
      requestId: correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user ? req.user.id : undefined,
      caseId: req.params?.caseId || req.params?.id || undefined
    };

    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} finished with status ${res.statusCode} in ${durationMs}ms`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} finished with status ${res.statusCode} in ${durationMs}ms`, logData);
    } else {
      logger.info(`${req.method} ${req.originalUrl} finished with status ${res.statusCode} in ${durationMs}ms`, logData);
    }
  });

  next();
}

module.exports = requestCorrelationMiddleware;
