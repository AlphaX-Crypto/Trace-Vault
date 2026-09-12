const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info(`TRACEVAULT Backend running on port ${config.port} [${config.nodeEnv}]`);
  logger.info(`Target Python Intelligence URL: ${config.pythonIntelligenceUrl}`);
  logger.info(`Health check available at http://localhost:${config.port}/health`);
});

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
