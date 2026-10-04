const db = require('../db/connection');

class ReportRepository {
  /**
   * Retrieves all reports for a given case
   * @param {string} caseId
   * @returns {Promise<Array<Object>>}
   */
  async getReportsByCaseId(caseId) {
    const sql = `
      SELECT id, case_id, analysis_id, title, status, report_payload, created_at, updated_at
      FROM reports
      WHERE case_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query(sql, [caseId]);
    return result.rows;
  }

  /**
   * Retrieves a single report by ID
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async getReportById(id) {
    const sql = `
      SELECT id, case_id, analysis_id, title, status, report_payload, created_at, updated_at
      FROM reports
      WHERE id = $1;
    `;
    const result = await db.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Creates a new report record
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createReport({
    case_id,
    analysis_id = null,
    title,
    status = 'DRAFT',
    report_payload = {}
  }) {
    const sql = `
      INSERT INTO reports (case_id, analysis_id, title, status, report_payload)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await db.query(sql, [
      case_id,
      analysis_id,
      title,
      status,
      JSON.stringify(report_payload)
    ]);
    return result.rows[0];
  }

  /**
   * Updates report status and/or payload
   * @param {number|string} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateReport(id, { status, report_payload = null }) {
    let sql;
    let values;
    if (report_payload !== null) {
      sql = `
        UPDATE reports
        SET status = COALESCE($2, status),
            report_payload = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;
      values = [id, status, JSON.stringify(report_payload)];
    } else {
      sql = `
        UPDATE reports
        SET status = COALESCE($2, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;
      values = [id, status];
    }
    const result = await db.query(sql, values);
    return result.rows[0];
  }
}

module.exports = new ReportRepository();
