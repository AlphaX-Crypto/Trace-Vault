const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const logger = require('./utils/logger');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/cases');
const investigationRoutes = require('./routes/investigations');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const { securityScanMiddleware } = require('./middleware/validation');
const { generalApiLimiter } = require('./middleware/rateLimiter');
const requestCorrelationMiddleware = require('./middleware/requestCorrelation');

const app = express();

// Trust proxy if configured (e.g. behind Nginx or Cloudflare in production)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Vite React dev friendly; production CSP documented for reverse proxy
  crossOriginEmbedderPolicy: false,
  hsts: config.nodeEnv === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'sameorigin' }
}));

// Enable CORS for frontend integration
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-ID']
}));

// Body parsing middleware with bounded payload size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Attach correlation ID (X-Request-ID) and structured request duration logging
app.use(requestCorrelationMiddleware);

// Global security scanner for forbidden credentials/keys
app.use(securityScanMiddleware);

// Health check endpoints (Public) - Liveness, Readiness, Database, Intelligence
app.use('/health', healthRoutes);


// General API Rate Limiting for all /api endpoints
app.use('/api', generalApiLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/investigations', investigationRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
