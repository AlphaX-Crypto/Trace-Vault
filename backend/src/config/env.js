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
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

module.exports = config;
