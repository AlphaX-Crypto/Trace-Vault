const db = require('../db/connection');

class AuditRepository {
  /**
   * Logs an audit trail event
   */
  async logAction({
    userId = null,
    caseId = null,
    action,
    resourceType,
    resourceId = null,
    metadata = {}
  }) {
    const sql = `
      INSERT INTO audit_logs (
        user_id, case_id, action, resource_type, resource_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await db.query(sql, [
      userId,
      caseId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(metadata)
    ]);
    return result.rows[0];
  }

  /**
   * Retrieves audit logs for a case
   */
  async getAuditLogsByCaseId(caseId) {
    const sql = `
      SELECT * FROM audit_logs
      WHERE case_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query(sql, [caseId]);
    return result.rows;
  }
}

module.exports = new AuditRepository();
