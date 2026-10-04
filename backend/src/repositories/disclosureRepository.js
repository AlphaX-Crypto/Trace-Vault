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

  /**
   * Retrieves a single disclosure request by request_id or id
   * @param {string|number} requestId
   * @returns {Promise<Object|null>}
   */
  async getDisclosureRequestById(requestId) {
    const isNumeric = Number.isInteger(Number(requestId)) && !String(requestId).startsWith('DR-') && !String(requestId).startsWith('REQ-');
    let sql;
    let values;
    if (isNumeric) {
      sql = `SELECT * FROM disclosure_requests WHERE id = $1;`;
      values = [Number(requestId)];
    } else {
      sql = `SELECT * FROM disclosure_requests WHERE request_id = $1;`;
      values = [String(requestId)];
    }
    const result = await db.query(sql, values);
    return result.rows[0] || null;
  }

  /**
   * Updates disclosure request status and optionally response/audit metadata in payload
   * @param {string|number} requestId
   * @param {string} status
   * @param {Object} [payloadPatch]
   * @returns {Promise<Object>}
   */
  async updateDisclosureStatus(requestId, status, payloadPatch = null) {
    const existing = await this.getDisclosureRequestById(requestId);
    if (!existing) return null;

    let payload = typeof existing.request_payload === 'object' && existing.request_payload !== null
      ? existing.request_payload
      : {};

    if (payloadPatch) {
      payload = { ...payload, ...payloadPatch };
    }

    const sql = `
      UPDATE disclosure_requests
      SET status = $2,
          request_payload = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(sql, [existing.id, status, JSON.stringify(payload)]);
    return result.rows[0] || null;
  }
}

module.exports = new DisclosureRepository();
