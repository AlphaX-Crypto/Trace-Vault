const db = require('../db/connection');

const SENSITIVE_KEY_REGEX = /password|secret|token|private[_-]?key|seed[_-]?phrase|mnemonic|auth_header/i;
const HEX_KEY_REGEX = /^(0x)?[0-9a-fA-F]{64}$/;

/**
 * Recursively redacts sensitive keys and values from audit metadata
 */
function sanitizeMetadata(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeMetadata);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'string' && HEX_KEY_REGEX.test(value.trim())) {
      clean[key] = '[REDACTED_SENSITIVE_VALUE]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

class AuditRepository {
  /**
   * Logs an append-only audit trail event
   */
  async logAction({
    userId = null,
    caseId = null,
    action,
    resourceType,
    resourceId = null,
    metadata = {}
  }) {
    let targetCaseId = caseId;
    let safeMetadata = sanitizeMetadata({ ...metadata });

    if (caseId) {
      try {
        const check = await db.query('SELECT 1 FROM cases WHERE case_id = $1 LIMIT 1;', [caseId]);
        if (check.rows.length === 0) {
          targetCaseId = null;
          safeMetadata.unlinked_case_id = caseId;
        }
      } catch (_) {
        targetCaseId = null;
      }
    }


    const sql = `
      INSERT INTO audit_logs (
        user_id, case_id, action, resource_type, resource_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await db.query(sql, [
      userId,
      targetCaseId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(safeMetadata)
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
