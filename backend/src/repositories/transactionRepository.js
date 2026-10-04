const db = require('../db/connection');

class TransactionRepository {
  /**
   * Retrieves transactions associated with a case with filtering and pagination
   * Queries transactions where addresses match the case subject or are linked via evidence,
   * or matches case_id stored in metadata.
   *
   * @param {string} caseId Case identifier
   * @param {Object} [options] Query options
   * @param {number} [options.page=1] Page number
   * @param {number} [options.limit=50] Page limit (max 100)
   * @param {string} [options.rail] Optional rail/blockchain filter
   * @param {string} [options.search] Optional search keyword (hash or address)
   * @returns {Promise<{transactions: Array<Object>, total: number, page: number, limit: number, totalPages: number}>}
   */
  async getTransactionsByCaseId(caseId, options = {}) {
    const page = Math.max(1, parseInt(options.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(options.limit || '50', 10)));
    const offset = (page - 1) * limit;

    // First fetch case subject identifier to associate on-chain / entity activity
    const caseRes = await db.query('SELECT subject_identifier, blockchain FROM cases WHERE case_id = $1;', [caseId]);
    const caseRow = caseRes.rows[0];
    const subjectId = caseRow?.subject_identifier || null;

    const whereClauses = [];
    const values = [];
    let paramIndex = 1;

    // Association condition:
    // 1. Transaction metadata explicitly references case_id, OR
    // 2. Transaction is referenced in evidence for this case, OR
    // 3. From/To address matches case subject_identifier
    if (subjectId) {
      whereClauses.push(`(
        (metadata->>'case_id' = $${paramIndex})
        OR transaction_hash IN (SELECT transaction_hash FROM evidence WHERE case_id = $${paramIndex} AND transaction_hash IS NOT NULL)
        OR from_address = $${paramIndex + 1}
        OR to_address = $${paramIndex + 1}
      )`);
      values.push(caseId, subjectId);
      paramIndex += 2;
    } else {
      whereClauses.push(`(
        (metadata->>'case_id' = $${paramIndex})
        OR transaction_hash IN (SELECT transaction_hash FROM evidence WHERE case_id = $${paramIndex} AND transaction_hash IS NOT NULL)
      )`);
      values.push(caseId);
      paramIndex += 1;
    }

    if (options.rail) {
      whereClauses.push(`LOWER(blockchain) = LOWER($${paramIndex})`);
      values.push(options.rail);
      paramIndex += 1;
    }

    if (options.search) {
      const searchPattern = `%${options.search.trim()}%`;
      whereClauses.push(`(
        transaction_hash ILIKE $${paramIndex}
        OR from_address ILIKE $${paramIndex}
        OR to_address ILIKE $${paramIndex}
      )`);
      values.push(searchPattern);
      paramIndex += 1;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching
    const countSql = `SELECT COUNT(*) AS total FROM transactions ${whereSql};`;
    const countRes = await db.query(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);

    // Fetch paginated slice
    const selectSql = `
      SELECT id, transaction_hash, blockchain, timestamp, from_address, to_address,
             asset, amount, transaction_type, block_number, source, metadata, created_at
      FROM transactions
      ${whereSql}
      ORDER BY timestamp DESC NULLS LAST, id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    values.push(limit, offset);

    const result = await db.query(selectSql, values);

    return {
      transactions: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  /**
   * Persists or updates a transaction in PostgreSQL
   * @param {Object} tx
   * @returns {Promise<Object>}
   */
  async createTransaction({
    transaction_hash,
    blockchain = 'ethereum',
    timestamp = null,
    from_address,
    to_address,
    asset = 'ETH',
    amount = 0.0,
    transaction_type = 'transfer',
    block_number = null,
    source = 'blockchain',
    metadata = {}
  }) {
    const sql = `
      INSERT INTO transactions (
        transaction_hash, blockchain, timestamp, from_address,
        to_address, asset, amount, transaction_type, block_number,
        source, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (blockchain, transaction_hash)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        timestamp = EXCLUDED.timestamp,
        metadata = EXCLUDED.metadata
      RETURNING *;
    `;
    const values = [
      transaction_hash,
      blockchain,
      timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      from_address,
      to_address,
      asset,
      amount,
      transaction_type,
      block_number,
      source,
      JSON.stringify(metadata)
    ];

    const result = await db.query(sql, values);
    return result.rows[0];
  }
}

module.exports = new TransactionRepository();
