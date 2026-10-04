const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEV_FALLBACK_JWT_SECRET = 'tracevault_dev_jwt_secret_key_change_in_production_2026';

const config = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || process.env.BACKEND_PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  pythonIntelligenceUrl: (
    process.env.INTELLIGENCE_ENGINE_URL ||
    process.env.PYTHON_INTELLIGENCE_URL ||
    'http://localhost:8000'
  ).replace(/\/+$/, ''),
  intelligenceTimeout: parseInt(process.env.INTELLIGENCE_TIMEOUT || '15000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  trustProxy: process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1',
  rateLimits: {
    loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10', 10),
    analyzeMax: parseInt(process.env.RATE_LIMIT_ANALYZE_MAX || '20', 10),
    disclosureMax: parseInt(process.env.RATE_LIMIT_DISCLOSURE_MAX || '30', 10),
    generalMax: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '300', 10)
  }
};

/**
 * Validates configuration parameters.
 * In production mode, enforces that all security-critical variables
 * are explicitly and securely configured.
 *
 * @param {Object} [envOverrides] Optional overrides for unit testing validation
 * @throws {Error} If production configuration is invalid or missing
 */
function validateConfig(envOverrides = {}) {
  const env = {
    nodeEnv: envOverrides.nodeEnv || config.nodeEnv,
    jwtSecret: envOverrides.jwtSecret !== undefined ? envOverrides.jwtSecret : process.env.JWT_SECRET,
    databaseUrl: envOverrides.databaseUrl !== undefined ? envOverrides.databaseUrl : config.databaseUrl,
    corsOrigin: envOverrides.corsOrigin !== undefined ? envOverrides.corsOrigin : config.corsOrigin
  };

  if (env.nodeEnv === 'production') {
    const errors = [];

    if (!env.jwtSecret || env.jwtSecret === DEV_FALLBACK_JWT_SECRET) {
      errors.push('JWT_SECRET must be set to a custom secure secret in production (fallback dev secret is forbidden).');
    } else if (env.jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production.');
    }

    if (!env.databaseUrl) {
      errors.push('DATABASE_URL must be specified in production.');
    }

    if (!env.corsOrigin || env.corsOrigin === '*') {
      errors.push('CORS_ORIGIN cannot be a wildcard (*) in production. Specify exact trusted origin(s).');
    }

    if (errors.length > 0) {
      const message = `[FATAL] Production configuration validation failed:\n  - ${errors.join('\n  - ')}`;
      const err = new Error(message);
      err.code = 'CONFIG_VALIDATION_FAILED';
      err.errors = errors;
      throw err;
    }
  }

  return true;
}

config.validateConfig = validateConfig;
config.DEV_FALLBACK_JWT_SECRET = DEV_FALLBACK_JWT_SECRET;

module.exports = config;

