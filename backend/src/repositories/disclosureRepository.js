const db = require('../db/connection');

class DisclosureRepository {
  /**
   * Creates a LEA disclosure request record
   * @param {Object} data
   * @returns {Promise<Object>} Created disclosure request
   */
  async createDisclosureRequest({
    request_id,
    case_id,
    analysis_id = null,
    target_entity = 'UNSPECIFIED_VASP',
    request_type = 'SECTION_91_CRPC',
    status = 'DRAFTED_PENDING_DISPATCH',
    request_payload = {}
  }) {
    const sql = `
      INSERT INTO disclosure_requests (
        request_id, case_id, analysis_id, target_entity,
        request_type, status, request_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await db.query(sql, [
      request_id,
      case_id,
      analysis_id,
      target_entity,
      request_type,
      status,
      JSON.stringify(request_payload)
    ]);
    return result.rows[0];
  }

  /**
   * Retrieves all disclosure requests for a case
   * @param {string} caseId
   * @returns {Promise<Array<Object>>}
   */
  async getDisclosureRequestsByCaseId(caseId) {
    const sql = `
      SELECT * FROM disclosure_requests
      WHERE case_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query(sql, [caseId]);
    return result.rows;
  }
}

module.exports = new DisclosureRepository();
