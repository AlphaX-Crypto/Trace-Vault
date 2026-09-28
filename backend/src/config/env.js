const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
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
  jwtSecret: process.env.JWT_SECRET || 'tracevault_dev_jwt_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  rateLimits: {
    loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10', 10),
    analyzeMax: parseInt(process.env.RATE_LIMIT_ANALYZE_MAX || '20', 10),
    disclosureMax: parseInt(process.env.RATE_LIMIT_DISCLOSURE_MAX || '30', 10),
    generalMax: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '300', 10)
  }
};

module.exports = config;
