const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const logger = require('./utils/logger');
const caseRoutes = require('./routes/cases');
const intelligenceService = require('./services/intelligenceService');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const { securityScanMiddleware } = require('./middleware/validation');

const app = express();

// Enable CORS for frontend integration
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global security scanner for forbidden credentials/keys
app.use(securityScanMiddleware);

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'tracevault-backend'
  });
});

app.get('/health/intelligence', async (req, res) => {
  const intelligenceStatus = await intelligenceService.checkHealth();
  const statusCode = intelligenceStatus.reachable ? 200 : 503;
  res.status(statusCode).json({
    status: intelligenceStatus.reachable ? 'ok' : 'degraded',
    service: 'tracevault-backend',
    intelligence_service: intelligenceStatus
  });
});

// Mount API routes
app.use('/api/cases', caseRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
