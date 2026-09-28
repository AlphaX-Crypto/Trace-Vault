const fs = require('fs');
const path = require('path');
const db = require('./connection');
const logger = require('../utils/logger');

const SEEDS_DIR = path.resolve(__dirname, '../../../database/seeds');

/**
 * Runs all seed scripts within transactions.
 * @returns {Promise<Array<string>>} List of applied seed scripts
 */
async function runSeeds() {
  if (!fs.existsSync(SEEDS_DIR)) {
    logger.warn(`Seeds directory not found at ${SEEDS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(SEEDS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const appliedSeeds = [];

  for (const file of files) {
    const filePath = path.join(SEEDS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    await db.transaction(async (client) => {
      logger.info(`Applying database seed: ${file}...`);
      await client.query(sql);
    });

    appliedSeeds.push(file);
    logger.info(`Successfully applied seed: ${file}`);
  }

  return appliedSeeds;
}

module.exports = {
  runSeeds,
  SEEDS_DIR
};
