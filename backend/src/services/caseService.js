const crypto = require('crypto');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const migrator = require('../db/migrator');
const seed = require('../db/seed');
const caseRepository = require('../repositories/caseRepository');
const analysisRepository = require('../repositories/analysisRepository');
const evidenceRepository = require('../repositories/evidenceRepository');
const disclosureRepository = require('../repositories/disclosureRepository');
const auditRepository = require('../repositories/auditRepository');

/**
 * Helper to wrap a promise while attaching synchronous properties
 * for 100% backward-compatibility with non-async legacy call sites and tests.
 */
function wrapPromiseWithProps(obj, promise) {
  if (obj && typeof obj === 'object') {
    Object.assign(promise, obj);
  }
  return promise;
}

/**
 * CaseService provides the investigation orchestration layer for TRACEVAULT V2.
 * Backed authoritatively by PostgreSQL persistence repositories.
 */
class CaseService {
  constructor() {
    this.cache = new Map();
    this.initPromise = null;
    // Auto-initialize schema and seeds
    this.ensureInitialized();
  }

  /**
   * Ensures migrations and seeds are executed before executing DB operations
   */
  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          await migrator.runMigrations();
          await seed.runSeeds();
          // Load pre-existing cases into local cache for synchronous access
          const existing = await caseRepository.getAllCases();
          for (const c of existing) {
            this.cache.set(c.case_id, c);
          }
        } catch (err) {
          logger.error('Failed to initialize database tables or seeds:', err);
          throw err;
        }
      })();
    }
    return this.initPromise;
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
   * Creates a new investigation case in PostgreSQL
   * @param {Object} caseData
   * @returns {Promise<Object>} Created case record
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

    // Keep immediate cache for sync callers
    this.cache.set(caseId, newCase);

    const task = (async () => {
      await this.ensureInitialized();
      const created = await caseRepository.createCase(newCase);
      const combined = { ...newCase, ...created };
      this.cache.set(caseId, combined);
      await auditRepository.logAction({
        caseId,
        action: 'CASE_CREATED',
        resourceType: 'CASE',
        resourceId: caseId,
        metadata: { title: newCase.title, priority: newCase.priority }
      });
      logger.info(`New investigation case created in PostgreSQL: ${caseId} [${newCase.priority}]`);
      return combined;
    })();

    return wrapPromiseWithProps(newCase, task);
  }

  /**
   * Retrieves all registered investigation cases
   * @returns {Promise<Array<Object>>} List of cases
   */
  async getAllCases() {
    await this.ensureInitialized();
    const cases = await caseRepository.getAllCases();
    for (const c of cases) {
      this.cache.set(c.case_id, c);
    }
    return cases;
  }

  /**
   * Retrieves a case by its ID
   * @param {string} caseId
   * @returns {Promise<Object>} Case record
   */
  getCaseById(caseId) {
    const cached = this.cache.get(caseId);

    const task = (async () => {
      await this.ensureInitialized();
      const caseRecord = await caseRepository.getCaseById(caseId);
      if (!caseRecord) {
        throw new AppError(`Case with ID '${caseId}' was not found.`, 404, 'CASE_NOT_FOUND');
      }
      this.cache.set(caseId, caseRecord);
      return caseRecord;
    })();

    if (cached) {
      return wrapPromiseWithProps(cached, task);
    }

    // If not in cache, check if known invalid/non-existent
    return wrapPromiseWithProps(null, task);
  }

  /**
   * Updates the lifecycle status of an existing case
   * @param {string} caseId
   * @param {string} status OPEN | ANALYZING | ANALYSIS_COMPLETE | REVIEW | CLOSED
   * @returns {Promise<Object>} Updated case record
   */
  updateCaseStatus(caseId, status) {
    const cached = this.cache.get(caseId);
    if (cached) {
      cached.status = status;
      cached.updated_at = new Date().toISOString();
    }

    const task = (async () => {
      await this.ensureInitialized();
      // Ensure case exists
      await this.getCaseById(caseId);
      const updated = await caseRepository.updateCaseStatus(caseId, status);
      this.cache.set(caseId, updated);
      logger.info(`Case ${caseId} transitioned to status: ${status} in PostgreSQL`);
      return updated;
    })();

    return wrapPromiseWithProps(cached, task);
  }

  /**
   * Stores an analysis result received from the Python Intelligence Engine
   * Executes atomic transactional writes into PostgreSQL across 7 tables.
   *
   * @param {string} caseId
   * @param {Object} result Canonical AnalysisResult
   * @returns {Promise<Object>} Stored result
   */
  async saveAnalysisResult(caseId, result) {
    await this.ensureInitialized();
    await this.getCaseById(caseId);

    const saved = await analysisRepository.saveAnalysisResult(caseId, result);

    // Update local cache
    const cached = this.cache.get(caseId);
    if (cached) {
      cached.status = 'ANALYSIS_COMPLETE';
      cached.analysis = saved;
      if (!cached.subject_identifier && (result.wallet || result.subject)) {
        cached.subject_identifier = result.wallet || result.subject;
      }
      cached.updated_at = new Date().toISOString();
    }

    logger.info(`Saved AnalysisResult for Case ${caseId}. Status: ANALYSIS_COMPLETE`);
    return saved;
  }

  /**
   * Retrieves latest canonical analysis result for a case
   * @param {string} caseId
   * @returns {Promise<Object|null>}
   */
  async getLatestAnalysis(caseId) {
    await this.ensureInitialized();
    await this.getCaseById(caseId);
    return analysisRepository.getLatestAnalysis(caseId);
  }

  /**
   * Retrieves all historical analysis results associated with a case
   * @param {string} caseId
   * @returns {Promise<Array<Object>>} List of analysis results
   */
  async getAnalysisResults(caseId) {
    await this.ensureInitialized();
    await this.getCaseById(caseId);
    return analysisRepository.getAnalysisResults(caseId);
  }

  /**
   * Retrieves evidentiary schedule for a case originating from Python analysis
   * @param {string} caseId
   * @returns {Promise<Array<Object>>} Structured evidence items
   */
  async getEvidence(caseId) {
    await this.ensureInitialized();
    const rows = await evidenceRepository.getEvidenceByCaseId(caseId);
    if (rows && rows.length > 0) {
      return rows;
    }
    const latest = await this.getLatestAnalysis(caseId);
    return latest?.evidence || [];
  }

  /**
   * Creates a LEA disclosure request record
   * @param {string} caseId
   * @param {Object} requestData
   * @returns {Promise<Object>} Draft disclosure request
   */
  async createDisclosureRequest(caseId, requestData = {}) {
    await this.ensureInitialized();
    const caseRecord = await this.getCaseById(caseId);
    const latestResult = await this.getLatestAnalysis(caseId);

    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const targetVasp = requestData.target_vasp || latestResult?.nearest_vasp?.name || 'UNSPECIFIED_VASP';
    const suspectWallet = requestData.wallet_address || latestResult?.wallet || caseRecord.subject_identifier || 'UNSPECIFIED_WALLET';
    const jurisdiction = requestData.jurisdiction || 'INDIA_LEA';
    const purpose = requestData.purpose || 'CRIMINAL_INVESTIGATION_CRPC_91';

    const disclosureRecord = {
      request_id: requestId,
      case_id: caseId,
      case_title: caseRecord.title,
      target_vasp: targetVasp,
      suspect_wallet: suspectWallet,
      jurisdiction,
      purpose,
      status: 'DRAFTED_PENDING_DISPATCH',
      adapter: 'MOCK_SAHYOG_SANDBOX_ADAPTER',
      created_at: new Date().toISOString()
    };

    await disclosureRepository.createDisclosureRequest({
      request_id: requestId,
      case_id: caseId,
      target_entity: targetVasp,
      request_type: 'SECTION_91_CRPC',
      status: 'DRAFTED_PENDING_DISPATCH',
      request_payload: disclosureRecord
    });

    await auditRepository.logAction({
      caseId,
      action: 'DISCLOSURE_REQUEST_DRAFTED',
      resourceType: 'DISCLOSURE_REQUEST',
      resourceId: requestId,
      metadata: { target_vasp: targetVasp, jurisdiction }
    });

    logger.info(`Disclosure request drafted for Case ${caseId} targeting ${targetVasp}`);
    return disclosureRecord;
  }
}

// Export singleton instance
module.exports = new CaseService();
