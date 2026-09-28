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
}

module.exports = new EvidenceRepository();
