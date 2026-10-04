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
  /**
   * Creates a new investigation case in PostgreSQL
   * @param {Object} caseData
   * @param {Object} [user] Authenticated user context
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
  }, user = null) {
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
      if (user && user.id) {
        await caseRepository.addCaseMember(caseId, user.id, 'INVESTIGATOR');
      }
      const combined = { ...newCase, ...created };
      this.cache.set(caseId, combined);
      await auditRepository.logAction({
        userId: user ? user.id : null,
        caseId,
        action: 'CASE_CREATED',
        resourceType: 'CASE',
        resourceId: caseId,
        metadata: { title: newCase.title, priority: newCase.priority, created_by: user?.username }
      });
      logger.info(`New investigation case created in PostgreSQL: ${caseId} [${newCase.priority}] by user ${user?.username || 'system'}`);
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
   * Retrieves cases scoped by the authenticated user's role and assignments
   * @param {Object} user
   * @returns {Promise<Array<Object>>}
   */
  async getCasesForUser(user) {
    await this.ensureInitialized();
    if (!user || user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
      return this.getAllCases();
    }
    const cases = await caseRepository.getAssignedCases(user.id);
    for (const c of cases) {
      this.cache.set(c.case_id, c);
    }
    return cases;
  }

  /**
   * Verifies if a user has access rights to a specific case
   * @param {Object} user
   * @param {string} caseId
   * @returns {Promise<boolean>}
   */
  async canUserAccessCase(user, caseId) {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
      return true;
    }
    if (user.role === 'INVESTIGATOR') {
      return await caseRepository.isUserAssignedToCase(caseId, user.id);
    }
    return false;
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
   * @param {Object} [user] Authenticated user context
   * @returns {Promise<Object>} Draft disclosure request
   */
  async createDisclosureRequest(caseId, requestData = {}, user = null) {
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
      legal_basis: requestData.legal_basis || 'SECTION_91_CRPC',
      attached_evidence: requestData.attached_evidence || requestData.supporting_evidence_ids || [],
      created_at: new Date().toISOString()
    };

    const sahyogSandboxAdapter = require('../adapters/sahyogSandboxAdapter');
    const integrityDigest = sahyogSandboxAdapter.computePayloadIntegrityDigest(disclosureRecord);
    disclosureRecord.payload_integrity_digest = integrityDigest;

    await disclosureRepository.createDisclosureRequest({
      request_id: requestId,
      case_id: caseId,
      target_entity: targetVasp,
      request_type: requestData.request_type || 'SECTION_91_CRPC',
      status: 'DRAFTED_PENDING_DISPATCH',
      request_payload: disclosureRecord
    });

    await auditRepository.logAction({
      userId: user ? user.id : null,
      caseId,
      action: 'DISCLOSURE_REQUEST_CREATED',
      resourceType: 'DISCLOSURE_REQUEST',
      resourceId: requestId,
      metadata: { target_vasp: targetVasp, jurisdiction, drafted_by: user?.username, status: 'DRAFT' }
    });

    logger.info(`Disclosure request drafted for Case ${caseId} targeting ${targetVasp} by ${user?.username || 'system'}`);
    return disclosureRecord;
  }

  /**
   * Retrieves a single disclosure request by ID
   * @param {string} caseId
   * @param {string} requestId
   * @returns {Promise<Object>}
   */
  async getDisclosureRequestById(caseId, requestId) {
    await this.ensureInitialized();
    await this.getCaseById(caseId);
    const req = await disclosureRepository.getDisclosureRequestById(requestId);
    if (!req || req.case_id !== caseId) {
      throw new AppError(`Disclosure request with ID '${requestId}' was not found for Case '${caseId}'.`, 404, 'DISCLOSURE_NOT_FOUND');
    }
    return req;
  }

  /**
   * Dispatches or simulates sandbox execution for a disclosure request
   * @param {string} caseId
   * @param {string} requestId
   * @param {string} action 'SUBMIT' | 'SIMULATE_RESPONSE'
   * @param {Object} [user]
   * @returns {Promise<Object>}
   */
  async executeSandboxDisclosure(caseId, requestId, action = 'SUBMIT', user = null) {
    await this.ensureInitialized();
    const req = await this.getDisclosureRequestById(caseId, requestId);
    const sahyogSandboxAdapter = require('../adapters/sahyogSandboxAdapter');

    let updated;
    if (action === 'SIMULATE_RESPONSE') {
      const simResp = sahyogSandboxAdapter.simulateSandboxResponse(req);
      updated = await disclosureRepository.updateDisclosureStatus(requestId, 'RESPONSE_RECEIVED_SANDBOX', {
        sandbox_response: simResp
      });
      await auditRepository.logAction({
        userId: user ? user.id : null,
        caseId,
        action: 'DISCLOSURE_RESPONSE_SIMULATED',
        resourceType: 'DISCLOSURE_REQUEST',
        resourceId: requestId,
        metadata: { action, actor: user?.username || 'system', status: 'RESPONSE_RECEIVED_SANDBOX' }
      });
    } else {
      const dispatchAck = sahyogSandboxAdapter.dispatchToSandbox(req);
      updated = await disclosureRepository.updateDisclosureStatus(requestId, 'SUBMITTED_SANDBOX', {
        sandbox_submission: dispatchAck,
        payload_integrity_digest: dispatchAck.payload_integrity_digest
      });
      await auditRepository.logAction({
        userId: user ? user.id : null,
        caseId,
        action: 'DISCLOSURE_SUBMITTED_SANDBOX',
        resourceType: 'DISCLOSURE_REQUEST',
        resourceId: requestId,
        metadata: { action: 'SUBMIT', actor: user?.username || 'system', status: 'SUBMITTED_SANDBOX' }
      });
    }

    return updated;
  }

  /**
   * Retrieves transactions associated with a case with pagination and filters
   * @param {string} caseId
   * @param {Object} options { page, limit, rail, search }
   * @returns {Promise<Object>} { transactions, total, page, limit, totalPages }
   */
  async getTransactions(caseId, options = {}) {
    await this.ensureInitialized();
    await this.getCaseById(caseId); // verifies case existence
    const transactionRepository = require('../repositories/transactionRepository');
    return transactionRepository.getTransactionsByCaseId(caseId, options);
  }

  /**
   * Persists a transaction for a case
   * @param {string} caseId
   * @param {Object} txData
   * @returns {Promise<Object>} Persisted transaction
   */
  async createTransaction(caseId, txData = {}) {
    await this.ensureInitialized();
    await this.getCaseById(caseId); // verifies case existence
    const transactionRepository = require('../repositories/transactionRepository');
    const metadata = { ...(txData.metadata || {}), case_id: caseId };
    return transactionRepository.createTransaction({
      ...txData,
      metadata
    });
  }

  /**
   * Persists an evidentiary record for a case
   * @param {string} caseId
   * @param {Object} evidenceData
   * @param {Object} [user]
   * @returns {Promise<Object>} Created evidence record
   */
  async createEvidence(caseId, evidenceData = {}, user = null) {
    await this.ensureInitialized();
    await this.getCaseById(caseId); // verifies case existence

    const evidenceId = evidenceData.evidence_id || `EV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const newEvidence = await evidenceRepository.createEvidence({
      ...evidenceData,
      evidence_id: evidenceId,
      case_id: caseId
    });

    if (user) {
      await auditRepository.logAction({
        userId: user.id,
        caseId,
        action: 'EVIDENCE_CREATED',
        resourceType: 'EVIDENCE',
        resourceId: evidenceId,
        metadata: { type: evidenceData.type, title: evidenceData.title, created_by: user.username }
      });
    }

    return newEvidence;
  }

  /**
   * Retrieves a single evidence record
   * @param {string} caseId
   * @param {string} evidenceId
   * @returns {Promise<Object>}
   */
  async getEvidenceById(caseId, evidenceId) {
    await this.ensureInitialized();
    await this.getCaseById(caseId);
    const ev = await evidenceRepository.getEvidenceById(evidenceId);
    if (!ev || ev.case_id !== caseId) {
      throw new AppError(`Evidence record '${evidenceId}' not found for Case '${caseId}'.`, 404, 'EVIDENCE_NOT_FOUND');
    }
    return ev;
  }

  /**
   * Updates an evidence item's status and investigator notes
   * @param {string} caseId
   * @param {string} evidenceId
   * @param {Object} updates { status, notes }
   * @param {Object} [user]
   * @returns {Promise<Object>}
   */
  async updateEvidenceStatus(caseId, evidenceId, { status, notes = null }, user = null) {
    await this.ensureInitialized();
    await this.getEvidenceById(caseId, evidenceId); // verify exists and belongs to case

    const updated = await evidenceRepository.updateEvidenceStatus(evidenceId, status, notes);

    if (user) {
      await auditRepository.logAction({
        userId: user.id,
        caseId,
        action: 'EVIDENCE_STATUS_CHANGED',
        resourceType: 'EVIDENCE',
        resourceId: evidenceId,
        metadata: { status, updated_by: user.username }
      });
    }

    return updated;
  }

  /**
   * Compiles and creates an Investigation Report for a case
   * @param {string} caseId
   * @param {Object} reportData
   * @param {Object} [user]
   * @returns {Promise<Object>} Created report record
   */
  async createReport(caseId, reportData = {}, user = null) {
    await this.ensureInitialized();
    const caseRecord = await this.getCaseById(caseId);
    const reportRepository = require('../repositories/reportRepository');

    // Retrieve latest analysis if present
    const latestAnalysis = await this.getLatestAnalysis(caseId);
    const evidenceList = await this.getEvidence(caseId);

    const title = reportData.title || `Investigation Dossier — ${caseRecord.case_id}`;
    const status = reportData.status || 'DRAFT';

    const sahyogSandboxAdapter = require('../adapters/sahyogSandboxAdapter');

    const reportPayload = {
      case_id: caseId,
      case_title: caseRecord.title,
      classification: reportData.classification || 'LAW_ENFORCEMENT_SENSITIVE',
      executive_summary: reportData.executive_summary || caseRecord.description || 'Forensic investigation into financial movements across crypto and domestic rails.',
      evidence_schedule: evidenceList.map((e) => ({
        id: e.evidence_id,
        type: e.type,
        description: e.description,
        source: e.source,
        status: e.status,
        classification: e.metadata?.observed_or_derived || 'OBSERVED_FACT'
      })),
      analytical_findings: latestAnalysis ? {
        analysis_id: latestAnalysis.analysis_id,
        risk_score: latestAnalysis.risk_score,
        threat_level: latestAnalysis.threat_level,
        primary_pattern: latestAnalysis.primary_pattern
      } : null,
      investigator_notes: reportData.notes || [],
      compiled_by: user ? user.username : 'Inspector Samarth',
      compiled_at: new Date().toISOString(),
      disclaimer: 'INVESTIGATION REPORT FOR OFFICIAL USE ONLY. Analytical findings are probabilistic assessments derived from graph and behavioral heuristics.'
    };

    const integrityDigest = sahyogSandboxAdapter.computePayloadIntegrityDigest(reportPayload);
    reportPayload.payload_integrity_digest = integrityDigest;

    const newReport = await reportRepository.createReport({
      case_id: caseId,
      analysis_id: latestAnalysis?.analysis_id || null,
      title,
      status,
      report_payload: reportPayload
    });

    if (user) {
      await auditRepository.logAction({
        userId: user.id,
        caseId,
        action: 'REPORT_CREATED',
        resourceType: 'REPORT',
        resourceId: String(newReport.id),
        metadata: { title, status, compiled_by: user.username, digest: integrityDigest }
      });
    }

    return newReport;
  }

  /**
   * Retrieves all reports for a case
   * @param {string} caseId
   * @returns {Promise<Array<Object>>}
   */
  async getReports(caseId) {
    await this.ensureInitialized();
    await this.getCaseById(caseId);
    const reportRepository = require('../repositories/reportRepository');
    return reportRepository.getReportsByCaseId(caseId);
  }

  /**
   * Retrieves a single report by ID
   * @param {string} caseId
   * @param {number|string} reportId
   * @returns {Promise<Object>}
   */
  async getReportById(caseId, reportId) {
    await this.ensureInitialized();
    await this.getCaseById(caseId);
    const reportRepository = require('../repositories/reportRepository');
    const report = await reportRepository.getReportById(reportId);
    if (!report || report.case_id !== caseId) {
      throw new AppError(`Report '${reportId}' not found for Case '${caseId}'.`, 404, 'REPORT_NOT_FOUND');
    }
    return report;
  }

  /**
   * Updates an investigation report status/payload
   * @param {string} caseId
   * @param {number|string} reportId
   * @param {Object} updates
   * @param {Object} [user]
   * @returns {Promise<Object>}
   */
  async updateReport(caseId, reportId, updates = {}, user = null) {
    await this.ensureInitialized();
    await this.getReportById(caseId, reportId);
    const reportRepository = require('../repositories/reportRepository');
    const updated = await reportRepository.updateReport(reportId, updates);

    if (user) {
      await auditRepository.logAction({
        userId: user.id,
        caseId,
        action: 'REPORT_UPDATED',
        resourceType: 'REPORT',
        resourceId: String(reportId),
        metadata: { status: updates.status, updated_by: user.username }
      });
    }

    return updated;
  }

  /**
   * Retrieves all disclosure requests for a case
   * @param {string} caseId
   * @returns {Promise<Array<Object>>}
   */
  async getDisclosureRequests(caseId) {
    await this.ensureInitialized();
    await this.getCaseById(caseId); // verifies case existence
    return disclosureRepository.getDisclosureRequestsByCaseId(caseId);
  }
}

// Export singleton instance
module.exports = new CaseService();
