const { Pool } = require('pg');
const { newDb } = require('pg-mem');
const config = require('../config/env');
const logger = require('../utils/logger');

let pool = null;
let memDb = null;
let isMem = false;

/**
 * Initializes the database connection pool.
 * If DATABASE_URL is provided and not in memory test mode, creates a real pg.Pool.
 * Otherwise creates a high-fidelity in-memory PostgreSQL engine via pg-mem.
 */
function getPool() {
  if (pool) return pool;

  const forceMem = process.env.USE_PG_MEM === 'true' || (!config.databaseUrl && process.env.NODE_ENV === 'test');

  if (!forceMem && config.databaseUrl) {
    logger.info('Initializing real PostgreSQL connection pool...');
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '5000', 10)
    });
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client:', err);
    });
    isMem = false;
  } else {
    logger.info('Initializing in-memory PostgreSQL engine (pg-mem)...');
    memDb = newDb();
    const pgAdapter = memDb.adapters.createPg();
    pool = new pgAdapter.Pool();
    isMem = true;
  }

  return pool;
}

/**
 * Executes a parameterized SQL query
 * @param {string} text SQL statement
 * @param {Array} params Parameter values
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

/**
 * Acquires a client connection from the pool
 * @returns {Promise<Object>} Client instance
 */
async function getClient() {
  const p = getPool();
  return p.connect();
}

/**
 * Executes an atomic transaction.
 * Automatically wraps statements with BEGIN/COMMIT/ROLLBACK.
 * When running with pg-mem, also uses point-in-time snapshot restore for exact transactional isolation.
 *
 * @param {Function} callback async function(client)
 * @returns {Promise<any>} Result of callback
 */
async function transaction(callback) {
  const client = await getClient();
  const snapshot = (isMem && memDb) ? memDb.backup() : null;

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      logger.warn(`Error during ROLLBACK: ${rbErr.message}`);
    }
    if (snapshot) {
      snapshot.restore();
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Closes the connection pool
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
    memDb = null;
    isMem = false;
  }
}

/**
 * Resets the in-memory database (useful between tests)
 */
function resetMemoryDb() {
  if (isMem) {
    if (pool) {
      try { pool.end(); } catch (_) {}
    }
    pool = null;
    memDb = null;
    isMem = false;
  }
}

module.exports = {
  getPool,
  query,
  getClient,
  transaction,
  close,
  resetMemoryDb,
  isMemoryDb: () => isMem
};
