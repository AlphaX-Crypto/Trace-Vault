const db = require('../db/connection');
const logger = require('../utils/logger');

class CaseRepository {
  /**
   * Inserts a new case record into the database
   * @param {Object} caseData
   * @returns {Promise<Object>} Created case row
   */
  async createCase({
    case_id,
    title,
    description = '',
    crime_type = 'GENERAL_INVESTIGATION',
    priority = 'MEDIUM',
    subject_type = 'WALLET',
    blockchain = 'ethereum',
    subject_identifier = null,
    status = 'OPEN'
  }) {
    const sql = `
      INSERT INTO cases (
        case_id, title, description, crime_type, priority,
        subject_type, blockchain, subject_identifier, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      case_id,
      title,
      description,
      crime_type,
      priority,
      subject_type,
      blockchain,
      subject_identifier,
      status
    ];

    const result = await db.query(sql, values);
    const created = result.rows[0];
    created.analysis = null;
    return created;
  }

  /**
   * Retrieves all registered investigation cases, ordered newest first
   * @returns {Promise<Array<Object>>}
   */
  async getAllCases() {
    const result = await db.query('SELECT * FROM cases ORDER BY created_at DESC;');
    const cases = result.rows;

    for (const c of cases) {
      const aRes = await db.query(
        'SELECT analysis_payload FROM analysis_results WHERE case_id = $1 ORDER BY created_at DESC LIMIT 1;',
        [c.case_id]
      );
      c.analysis = aRes.rows.length > 0
        ? (typeof aRes.rows[0].analysis_payload === 'string'
            ? JSON.parse(aRes.rows[0].analysis_payload)
            : aRes.rows[0].analysis_payload)
        : null;
    }

    return cases;
  }

  /**
   * Retrieves a single case by its case_id
   * @param {string} caseId
   * @returns {Promise<Object|null>}
   */
  async getCaseById(caseId) {
    const result = await db.query('SELECT * FROM cases WHERE case_id = $1;', [caseId]);
    if (result.rows.length === 0) return null;

    const caseRecord = result.rows[0];
    const aRes = await db.query(
      'SELECT analysis_payload FROM analysis_results WHERE case_id = $1 ORDER BY created_at DESC LIMIT 1;',
      [caseId]
    );
    caseRecord.analysis = aRes.rows.length > 0
      ? (typeof aRes.rows[0].analysis_payload === 'string'
          ? JSON.parse(aRes.rows[0].analysis_payload)
          : aRes.rows[0].analysis_payload)
      : null;

    return caseRecord;
  }

  /**
   * Updates the lifecycle status of a case
   * @param {string} caseId
   * @param {string} status
   * @returns {Promise<Object|null>}
   */
  async updateCaseStatus(caseId, status) {
    const sql = `
      UPDATE cases
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE case_id = $2
      RETURNING *;
    `;
    const result = await db.query(sql, [status, caseId]);
    return result.rows[0] || null;
  }

  /**
   * Updates subject identifier if previously null or updated
   * @param {string} caseId
   * @param {string} subjectIdentifier
   * @returns {Promise<Object|null>}
   */
  async updateSubjectIdentifier(caseId, subjectIdentifier) {
    const sql = `
      UPDATE cases
      SET subject_identifier = $1, updated_at = CURRENT_TIMESTAMP
      WHERE case_id = $2
      RETURNING *;
    `;
    const result = await db.query(sql, [subjectIdentifier, caseId]);
    return result.rows[0] || null;
  }

  /**
   * Deletes a case by its case_id
   * @param {string} caseId
   * @returns {Promise<boolean>}
   */
  async deleteCase(caseId) {
    const sql = 'DELETE FROM cases WHERE case_id = $1 RETURNING id;';
    const result = await db.query(sql, [caseId]);
    return (result.rowCount > 0);
  }

  /**
   * Assigns a user to a case in case_members table
   * @param {string} caseId Case external ID (e.g. CASE-...)
   * @param {number} userId Numeric user ID
   * @param {string} role Role in case (default: INVESTIGATOR)
   */
  async addCaseMember(caseId, userId, role = 'INVESTIGATOR') {
    const sql = `
      INSERT INTO case_members (case_id, user_id, role)
      VALUES (
        (SELECT id FROM cases WHERE case_id = $1),
        $2,
        $3
      )
      ON CONFLICT (case_id, user_id) DO NOTHING
      RETURNING *;
    `;
    const result = await db.query(sql, [caseId, userId, role]);
    return result.rows[0] || null;
  }

  /**
   * Checks if a user is assigned to a specific case
   * @param {string} caseId
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async isUserAssignedToCase(caseId, userId) {
    const sql = `
      SELECT 1 FROM case_members cm
      JOIN cases c ON c.id = cm.case_id
      WHERE c.case_id = $1 AND cm.user_id = $2
      LIMIT 1;
    `;
    const result = await db.query(sql, [caseId, userId]);
    return (result.rows.length > 0);
  }

  /**
   * Retrieves all cases assigned to a specific user
   * @param {number} userId
   * @returns {Promise<Array<Object>>}
   */
  async getAssignedCases(userId) {
    const sql = `
      SELECT c.* FROM cases c
      JOIN case_members cm ON cm.case_id = c.id
      WHERE cm.user_id = $1
      ORDER BY c.created_at DESC;
    `;
    const result = await db.query(sql, [userId]);
    const cases = result.rows;

    for (const c of cases) {
      const aRes = await db.query(
        'SELECT analysis_payload FROM analysis_results WHERE case_id = $1 ORDER BY created_at DESC LIMIT 1;',
        [c.case_id]
      );
      c.analysis = aRes.rows.length > 0
        ? (typeof aRes.rows[0].analysis_payload === 'string'
            ? JSON.parse(aRes.rows[0].analysis_payload)
            : aRes.rows[0].analysis_payload)
        : null;
    }

    return cases;
  }
}

module.exports = new CaseRepository();
