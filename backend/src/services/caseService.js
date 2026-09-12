const crypto = require('crypto');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * CaseService provides an in-memory repository abstraction for Sprint 1.
 * Cleanly decoupled so that Ganesh's PostgreSQL schema repository can be
 * plugged in without altering controllers or higher layers.
 */
class CaseService {
  constructor() {
    this.cases = new Map();
    this.results = new Map();
    this.disclosureRequests = new Map();
    this.seedInitialMockCases();
  }

  /**
   * Seed optional demo cases for initial testing and demonstration
   */
  seedInitialMockCases() {
    const defaultCase = {
      case_id: 'CASE-2026-001',
      title: 'Operation CryptoSweep - Ransomware Cluster',
      description: 'Tracing unhosted wallet associated with multi-stage ransomware extortion.',
      crime_type: 'RANSOMWARE',
      priority: 'HIGH',
      status: 'ACTIVE',
      created_at: new Date('2026-09-08T10:00:00Z').toISOString(),
      updated_at: new Date('2026-09-08T10:00:00Z').toISOString()
    };
    this.cases.set(defaultCase.case_id, defaultCase);
  }

  /**
   * Generates a unique Case ID
   */
  generateCaseId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CASE-${timestamp}-${randomSuffix}`;
  }

  /**
   * Creates a new investigation case
   * @param {Object} caseData
   * @returns {Object} Created case record
   */
  createCase({ title, description = '', priority = 'MEDIUM', crime_type = 'GENERAL_INVESTIGATION' }) {
    const caseId = this.generateCaseId();
    const now = new Date().toISOString();

    const newCase = {
      case_id: caseId,
      title: title.trim(),
      description: description.trim(),
      crime_type: crime_type.trim(),
      priority: priority.toUpperCase(),
      status: 'OPEN',
      created_at: now,
      updated_at: now
    };

    this.cases.set(caseId, newCase);
    logger.info(`New investigation case created: ${caseId} [${newCase.priority}]`);
    return newCase;
  }

  /**
   * Retrieves all registered investigation cases
   * @returns {Array<Object>} List of cases
   */
  getAllCases() {
    return Array.from(this.cases.values());
  }

  /**
   * Retrieves a case by its ID
   * @param {string} caseId
   * @returns {Object} Case record
   */
  getCaseById(caseId) {
    const caseRecord = this.cases.get(caseId);
    if (!caseRecord) {
      throw new AppError(`Case with ID '${caseId}' was not found.`, 404, 'CASE_NOT_FOUND');
    }
    return caseRecord;
  }

  /**
   * Stores an analysis result received from the Python Intelligence Engine
   * @param {string} caseId
   * @param {Object} result
   * @returns {Object} Stored result
   */
  saveAnalysisResult(caseId, result) {
    this.getCaseById(caseId); // Ensure case exists

    const analysisEntry = {
      ...result,
      analyzed_at: new Date().toISOString()
    };

    if (!this.results.has(caseId)) {
      this.results.set(caseId, []);
    }

    this.results.get(caseId).unshift(analysisEntry);

    // Update case updated_at timestamp and mark as ACTIVE if OPEN
    const caseRecord = this.cases.get(caseId);
    caseRecord.updated_at = new Date().toISOString();
    if (caseRecord.status === 'OPEN') {
      caseRecord.status = 'ACTIVE';
    }

    return analysisEntry;
  }

  /**
   * Retrieves analysis results for a specific case
   * @param {string} caseId
   * @returns {Array<Object>} List of analysis results
   */
  getAnalysisResults(caseId) {
    this.getCaseById(caseId); // Ensure case exists
    return this.results.get(caseId) || [];
  }

  /**
   * Creates a LEA disclosure request record (Sprint 1 SAHYOG Sandbox Adapter)
   * @param {string} caseId
   * @param {Object} requestData
   * @returns {Object} Draft disclosure request
   */
  createDisclosureRequest(caseId, requestData = {}) {
    const caseRecord = this.getCaseById(caseId);

    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const latestResults = this.getAnalysisResults(caseId);

    const disclosureRecord = {
      request_id: requestId,
      case_id: caseId,
      case_title: caseRecord.title,
      target_vasp: requestData.target_vasp || latestResults[0]?.nearest_vasp?.name || 'UNSPECIFIED_VASP',
      suspect_wallet: requestData.wallet_address || latestResults[0]?.wallet || 'UNSPECIFIED_WALLET',
      jurisdiction: requestData.jurisdiction || 'INDIA_LEA',
      purpose: requestData.purpose || 'CRIMINAL_INVESTIGATION_CRPC_91',
      status: 'DRAFTED_PENDING_DISPATCH',
      adapter: 'MOCK_SAHYOG_SANDBOX_ADAPTER',
      created_at: new Date().toISOString()
    };

    if (!this.disclosureRequests.has(caseId)) {
      this.disclosureRequests.set(caseId, []);
    }
    this.disclosureRequests.get(caseId).push(disclosureRecord);

    logger.info(`Disclosure request drafted for Case ${caseId} targeting ${disclosureRecord.target_vasp}`);
    return disclosureRecord;
  }
}

// Export singleton instance
module.exports = new CaseService();
