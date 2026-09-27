const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

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
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      statusCode = 502;
      code = 'INTELLIGENCE_ENGINE_UNAVAILABLE';
      message = 'Python Intelligence Engine is currently unavailable. Please verify the service is running.';
      details = { url: err.config?.url };
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
      statusCode = 504;
      code = 'INTELLIGENCE_ENGINE_TIMEOUT';
      message = 'Python Intelligence Engine timed out while processing the request.';
      details = { timeoutMs: err.config?.timeout };
    } else if (err.response) {
      if (err.response.status === 422) {
        statusCode = 422;
        code = 'INTELLIGENCE_VALIDATION_ERROR';
        message = 'Python Intelligence Engine rejected the request payload validation.';
        details = err.response.data;
      } else if (err.response.status === 400) {
        statusCode = 400;
        code = 'INTELLIGENCE_ENGINE_ERROR';
        message = err.response.data?.detail || 'Error response from Python Intelligence Engine.';
        details = err.response.data;
      } else {
        statusCode = 502;
        code = 'INTELLIGENCE_ENGINE_ERROR';
        message = err.response.data?.detail || 'Error response from Python Intelligence Engine.';
        details = err.response.data;
      }
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

  // Never expose internal stack traces or environment paths in API response
  return ApiResponse.error(res, message, statusCode, code, details);
};

module.exports = errorHandler;
