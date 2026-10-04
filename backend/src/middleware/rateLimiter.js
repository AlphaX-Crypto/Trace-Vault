const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

// Check if rate limiting should be skipped (e.g., standard tests that are not testing rate limits)
const shouldSkip = () => {
  return process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMITS !== 'true';
};

/**
 * Rate limiter for authentication attempts (Brute-force protection)
 * Window: 15 minutes | Max: 10 requests (configurable)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimits.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

/**
 * Rate limiter for resource-intensive graph intelligence analysis
 * Window: 10 minutes | Max: 20 requests (configurable)
 */
const analyzeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: config.rateLimits.analyzeMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Analysis request rate limit reached. Please wait before submitting further analysis tasks.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

/**
 * Rate limiter for Section 91 CrPC disclosure requisitions
 * Window: 10 minutes | Max: 30 requests (configurable)
 */
const disclosureLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: config.rateLimits.disclosureMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Disclosure requisition draft limit reached. Please wait before drafting additional requests.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

/**
 * General API request limiter
 * Window: 15 minutes | Max: 300 requests
 */
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimits.generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkip,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'General API rate limit reached. Please slow down your requests.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

module.exports = {
  loginLimiter,
  analyzeLimiter,
  disclosureLimiter,
  generalApiLimiter
};
