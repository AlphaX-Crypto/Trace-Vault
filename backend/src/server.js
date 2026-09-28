const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');

// Validate configuration requirements on startup
try {
  config.validateConfig();
} catch (err) {
  logger.error(err.message);
  process.exit(1);
}

const server = app.listen(config.port, () => {
  logger.info(`TRACEVAULT Backend Server running on port ${config.port} [${config.nodeEnv}]`);
  logger.info(`Configured Python Intelligence Engine URL: ${config.pythonIntelligenceUrl}`);
});


process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

module.exports = server;
