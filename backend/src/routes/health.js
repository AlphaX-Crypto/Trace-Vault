const express = require('express');
const db = require('../db/connection');
const intelligenceService = require('../services/intelligenceService');

const router = express.Router();
const startTime = Date.now();

/**
 * Liveness Probe: GET /health
 * Validates that the Express application process is alive and responsive.
 */
router.get('/', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'ok',
    service: 'tracevault-backend',
    uptime_seconds: uptimeSeconds,
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness Probe: GET /health/ready
 * Verifies that all critical upstream dependencies (PostgreSQL + Python Engine) are operational.
 * Returns 200 if ready, or 503 if any required component is degraded or unavailable.
 */
router.get('/ready', async (req, res) => {
  const [dbHealth, intelligenceHealth] = await Promise.all([
    db.checkHealth(),
    intelligenceService.checkHealth()
  ]);

  const isReady = dbHealth.healthy && intelligenceHealth.reachable;
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not_ready',
    service: 'tracevault-backend',
    checks: {
      database: {
        status: dbHealth.status,
        engine: dbHealth.engine,
        latency_ms: dbHealth.latency_ms
      },
      intelligence: {
        status: intelligenceHealth.status,
        engine: intelligenceHealth.engine
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Dedicated Database Connectivity Health: GET /health/database
 */
router.get('/database', async (req, res) => {
  const dbHealth = await db.checkHealth();
  const statusCode = dbHealth.healthy ? 200 : 503;

  res.status(statusCode).json({
    status: dbHealth.healthy ? 'ok' : 'error',
    service: 'tracevault-backend',
    database: {
      status: dbHealth.status,
      engine: dbHealth.engine,
      latency_ms: dbHealth.latency_ms,
      error: dbHealth.error
    }
  });
});

/**
 * Dedicated Python Intelligence Engine Health: GET /health/intelligence
 */
router.get('/intelligence', async (req, res) => {
  const intelligenceStatus = await intelligenceService.checkHealth();
  const statusCode = intelligenceStatus.reachable ? 200 : 503;

  res.status(statusCode).json({
    status: intelligenceStatus.reachable ? 'ok' : 'degraded',
    service: 'tracevault-backend',
    intelligence_service: {
      reachable: intelligenceStatus.reachable,
      status: intelligenceStatus.status,
      service: intelligenceStatus.service,
      engine: intelligenceStatus.engine,
      error: intelligenceStatus.error
    }
  });
});

module.exports = router;
