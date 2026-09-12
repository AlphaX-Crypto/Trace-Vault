const config = require('../config/env');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = config.nodeEnv === 'development' || config.nodeEnv === 'test' ? 'debug' : 'info';

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? (typeof meta === 'object' ? ` ${JSON.stringify(meta)}` : ` ${meta}`) : '';
  return `[${timestamp}] [${level.toUpperCase()}] [TRACEVAULT-BACKEND]: ${message}${metaStr}`;
}

const logger = {
  error: (msg, meta) => {
    if (levels.error <= levels[currentLevel]) {
      console.error(formatMessage('error', msg, meta));
    }
  },
  warn: (msg, meta) => {
    if (levels.warn <= levels[currentLevel]) {
      console.warn(formatMessage('warn', msg, meta));
    }
  },
  info: (msg, meta) => {
    if (levels.info <= levels[currentLevel]) {
      console.log(formatMessage('info', msg, meta));
    }
  },
  debug: (msg, meta) => {
    if (levels.debug <= levels[currentLevel]) {
      console.log(formatMessage('debug', msg, meta));
    }
  }
};

module.exports = logger;
