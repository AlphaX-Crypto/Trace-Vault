const db = require('../db/connection');

class EvidenceRepository {
  /**
   * Retrieves all structured evidence rows for a given case
   * @param {string} caseId
   * @returns {Promise<Array<Object>>}
   */
  async getEvidenceByCaseId(caseId) {
    const sql = `
      SELECT evidence_id, analysis_id, case_id, type, description,
             source, timestamp, status, relevance, transaction_hash,
             block_number, from_address, to_address, amount, asset,
             entity, metadata, created_at
      FROM evidence
      WHERE case_id = $1
      ORDER BY id ASC;
    `;
    const result = await db.query(sql, [caseId]);
    return result.rows;
  }

  /**
   * Retrieves evidence by analysis ID
   * @param {string} analysisId
   * @returns {Promise<Array<Object>>}
   */
  async getEvidenceByAnalysisId(analysisId) {
    const sql = `
      SELECT evidence_id, analysis_id, case_id, type, description,
             source, timestamp, status, relevance, transaction_hash,
             block_number, from_address, to_address, amount, asset,
             entity, metadata, created_at
      FROM evidence
      WHERE analysis_id = $1
      ORDER BY id ASC;
    `;
    const result = await db.query(sql, [analysisId]);
    return result.rows;
  }

  /**
   * Persists an evidence record for a case
   * @param {Object} evidenceData
   * @returns {Promise<Object>} Created evidence row
   */
  async createEvidence({
    evidence_id,
    analysis_id = null,
    case_id,
    type,
    description,
    source = 'investigator_input',
    timestamp = null,
    status = 'Verified',
    relevance = 'HIGH',
    transaction_hash = null,
    block_number = null,
    from_address = null,
    to_address = null,
    amount = null,
    asset = null,
    entity = null,
    metadata = {}
  }) {
    const sql = `
      INSERT INTO evidence (
        evidence_id, analysis_id, case_id, type, description,
        source, timestamp, status, relevance, transaction_hash,
        block_number, from_address, to_address, amount, asset,
        entity, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;
    const values = [
      evidence_id,
      analysis_id,
      case_id,
      type,
      description,
      source,
      timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      status,
      relevance,
      transaction_hash,
      block_number,
      from_address,
      to_address,
      amount !== null && amount !== undefined ? parseFloat(amount) : null,
      asset,
      entity,
      JSON.stringify(metadata)
    ];

    const result = await db.query(sql, values);
    return result.rows[0];
  }

  /**
   * Retrieves a single evidence record by ID or evidence_id
   * @param {string|number} evidenceId
   * @returns {Promise<Object|null>}
   */
  async getEvidenceById(evidenceId) {
    const isNumeric = Number.isInteger(Number(evidenceId)) && !String(evidenceId).startsWith('EV-');
    let sql;
    let values;
    if (isNumeric) {
      sql = `SELECT * FROM evidence WHERE id = $1;`;
      values = [Number(evidenceId)];
    } else {
      sql = `SELECT * FROM evidence WHERE evidence_id = $1;`;
      values = [String(evidenceId)];
    }
    const result = await db.query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Updates evidence status and optional notes
   * @param {string|number} evidenceId
   * @param {string} status
   * @param {string} [notes]
   * @returns {Promise<Object>}
   */
  async updateEvidenceStatus(evidenceId, status, notes = null) {
    const existing = await this.getEvidenceById(evidenceId);
    if (!existing) return null;

    const currentMetadata = typeof existing.metadata === 'object' && existing.metadata !== null
      ? existing.metadata
      : {};

    if (notes !== null) {
      currentMetadata.investigator_notes = notes;
    }

    const sql = `
      UPDATE evidence
      SET status = $2,
          metadata = $3
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(sql, [existing.id, status, JSON.stringify(currentMetadata)]);
    return result.rows[0] || null;
  }
}

module.exports = new EvidenceRepository();
