const fs = require('fs');
const path = require('path');
const db = require('./connection');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');

/**
 * Runs all pending migrations sequentially within individual transactions.
 * @returns {Promise<Array<string>>} List of applied migration names
 */
async function runMigrations() {
  // Ensure schema_migrations exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRes = await db.query('SELECT name FROM schema_migrations;');
  const appliedSet = new Set(appliedRes.rows.map(r => r.name));

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const newlyApplied = [];

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    await db.transaction(async (client) => {
      logger.info(`Applying migration: ${file}...`);
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1);',
        [file]
      );
    });

    newlyApplied.push(file);
    logger.info(`Successfully applied migration: ${file}`);
  }

  return newlyApplied;
}

module.exports = {
  runMigrations,
  MIGRATIONS_DIR
};
