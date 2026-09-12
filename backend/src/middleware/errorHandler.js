const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Centralized application error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal server error occurred.';
  let details = err.details || undefined;

  // Handle Axios errors from external services (like Python Intelligence Engine)
  if (err.isAxiosError) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      statusCode = 502;
      code = 'INTELLIGENCE_ENGINE_UNAVAILABLE';
      message = 'Python Intelligence Engine is currently unavailable. Please check that the intelligence service is running.';
    } else if (err.response) {
      statusCode = err.response.status >= 500 ? 502 : err.response.status;
      code = err.response.data?.detail ? 'INTELLIGENCE_ENGINE_ERROR' : code;
      message = err.response.data?.detail || 'Error response from Python Intelligence Engine.';
    } else {
      statusCode = 502;
      code = 'INTELLIGENCE_COMMUNICATION_ERROR';
      message = 'Failed to communicate with the Python Intelligence Engine.';
    }
  }

  // Handle JSON parse syntax errors from bad request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Malformed JSON payload received in request body.';
  }

  // Log error (with stack trace only internally on logger)
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`, {
      code,
      stack: err.stack,
      details
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`, {
      code,
      details
    });
  }

  const responsePayload = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details !== undefined && details !== null) {
    responsePayload.error.details = details;
  }

  // Never expose internal stack traces to clients in production/development responses
  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
