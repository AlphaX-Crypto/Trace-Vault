const crypto = require('crypto');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * CaseService provides an in-memory repository abstraction for TRACEVAULT V2.
 * Cleanly decoupled behind a repository interface so that Phase 5 PostgreSQL
 * can replace the in-memory Maps without changing controllers or API routes.
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
      subject_type: 'WALLET',
      blockchain: 'ethereum',
      subject_identifier: '0x0000000000000000000000000000000000000001',
      status: 'OPEN',
      analysis: null,
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
  createCase({
    title,
    description = '',
    priority = 'MEDIUM',
    crime_type = 'GENERAL_INVESTIGATION',
    subject_type = 'WALLET',
    blockchain = 'ethereum',
    subject_identifier = null
  }) {
    const caseId = this.generateCaseId();
    const now = new Date().toISOString();

    const newCase = {
      case_id: caseId,
      title: title.trim(),
      description: description.trim(),
      crime_type: crime_type.trim(),
      priority: priority.toUpperCase(),
      subject_type: subject_type.toUpperCase(),
      blockchain: blockchain.toLowerCase(),
      subject_identifier: subject_identifier ? subject_identifier.trim() : null,
      status: 'OPEN',
      analysis: null,
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
   * Updates the lifecycle status of an existing case
   * @param {string} caseId
   * @param {string} status OPEN | ANALYZING | ANALYSIS_COMPLETE | REVIEW | CLOSED
   * @returns {Object} Updated case record
   */
  updateCaseStatus(caseId, status) {
    const caseRecord = this.getCaseById(caseId);
    caseRecord.status = status;
    caseRecord.updated_at = new Date().toISOString();
    logger.info(`Case ${caseId} transitioned to status: ${status}`);
    return caseRecord;
  }

  /**
   * Stores an analysis result received from the Python Intelligence Engine
   * @param {string} caseId
   * @param {Object} result Canonical AnalysisResult
   * @returns {Object} Stored result
   */
  saveAnalysisResult(caseId, result) {
    const caseRecord = this.getCaseById(caseId);

    const analysisEntry = {
      ...result,
      analyzed_at: new Date().toISOString()
    };

    if (!this.results.has(caseId)) {
      this.results.set(caseId, []);
    }

    this.results.get(caseId).unshift(analysisEntry);

    // Attach latest analysis directly to case object
    caseRecord.analysis = analysisEntry;
    caseRecord.status = 'ANALYSIS_COMPLETE';
    caseRecord.updated_at = new Date().toISOString();

    if (!caseRecord.subject_identifier && (result.wallet || result.subject)) {
      caseRecord.subject_identifier = result.wallet || result.subject;
    }

    logger.info(`Saved AnalysisResult for Case ${caseId}. Status: ANALYSIS_COMPLETE`);
    return analysisEntry;
  }

  /**
   * Retrieves latest canonical analysis result for a case
   * @param {string} caseId
   * @returns {Object|null}
   */
  getLatestAnalysis(caseId) {
    this.getCaseById(caseId);
    const caseResults = this.results.get(caseId);
    return (caseResults && caseResults.length > 0) ? caseResults[0] : null;
  }

  /**
   * Retrieves all historical analysis results associated with a case
   * @param {string} caseId
   * @returns {Array<Object>} List of analysis results
   */
  getAnalysisResults(caseId) {
    this.getCaseById(caseId);
    return this.results.get(caseId) || [];
  }

  /**
   * Retrieves evidentiary schedule for a case originating from Python analysis
   * @param {string} caseId
   * @returns {Array<Object>} Structured evidence items
   */
  getEvidence(caseId) {
    const latest = this.getLatestAnalysis(caseId);
    return latest?.evidence || [];
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
    const latestResult = this.getLatestAnalysis(caseId);

    const disclosureRecord = {
      request_id: requestId,
      case_id: caseId,
      case_title: caseRecord.title,
      target_vasp: requestData.target_vasp || latestResult?.nearest_vasp?.name || 'UNSPECIFIED_VASP',
      suspect_wallet: requestData.wallet_address || latestResult?.wallet || caseRecord.subject_identifier || 'UNSPECIFIED_WALLET',
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
