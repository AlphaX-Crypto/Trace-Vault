const caseService = require('../services/caseService');
const intelligenceService = require('../services/intelligenceService');
const transactionRepository = require('../repositories/transactionRepository');
const auditRepository = require('../repositories/auditRepository');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Handles wallet analysis by dispatching to the Python Intelligence Engine
 * Orchestrates case status transitions:
 *   OPEN -> ANALYZING -> ANALYSIS_COMPLETE (or reverts to OPEN on error)
 */
const analyzeCaseWallet = async (req, res, next) => {
  const { id } = req.params;
  const { wallet_address, blockchain, max_hops } = req.body;

  try {
    // 1. Verify case exists in repository (throws 404 if not found)
    const existingCase = await caseService.getCaseById(id);

    // 2. Audit log analysis start
    await auditRepository.logAction({
      userId: req.user?.id || null,
      caseId: id,
      action: 'ANALYSIS_STARTED',
      resourceType: 'ANALYSIS',
      resourceId: id,
      metadata: { wallet_address, blockchain, max_hops }
    });

    // 3. Transition case lifecycle status to ANALYZING
    await caseService.updateCaseStatus(id, 'ANALYZING');

    // 4. Dispatch to Python Intelligence Engine
    const analysisResult = await intelligenceService.analyzeWallet({
      caseId: id,
      blockchain,
      walletAddress: wallet_address,
      maxHops: max_hops || 3
    });

    // 5. Store canonical analysis result (transitions status to ANALYSIS_COMPLETE)
    const savedResult = await caseService.saveAnalysisResult(id, analysisResult);

    // 6. Audit log analysis completion
    await auditRepository.logAction({
      userId: req.user?.id || null,
      caseId: id,
      action: 'ANALYSIS_COMPLETED',
      resourceType: 'ANALYSIS',
      resourceId: id,
      metadata: {
        nearest_vasp: savedResult.nearest_vasp?.name,
        risk_score: savedResult.risk_score
      }
    });

    return ApiResponse.success(res, savedResult, 200);
  } catch (error) {
    // Revert case status to OPEN if analysis failed
    try {
      await caseService.updateCaseStatus(id, 'OPEN');
    } catch (_) {
      // Ignore if case didn't exist in the first place
    }

    await auditRepository.logAction({
      userId: req.user?.id || null,
      caseId: id,
      action: 'ANALYSIS_FAILED',
      resourceType: 'ANALYSIS',
      resourceId: id,
      metadata: { error: error.message }
    });

    logger.error(`Analysis failed for Case ${id}: ${error.message}`);
    next(error);
  }
};

/**
 * Retrieves the latest canonical analysis result for a specific case
 * GET /api/cases/:id/analysis
 */
const getCaseAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const analysis = await caseService.getLatestAnalysis(id);

    if (!analysis) {
      throw new AppError(
        `No analysis has been performed for case '${id}' yet.`,
        404,
        'ANALYSIS_NOT_FOUND'
      );
    }

    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'ANALYSIS_VIEWED',
        resourceType: 'ANALYSIS',
        resourceId: id,
        metadata: { username: req.user.username }
      });
    }

    return ApiResponse.success(res, analysis, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the structured forensic evidence schedule for a case
 * GET /api/cases/:id/evidence
 */
const getCaseEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const evidence = await caseService.getEvidence(id);

    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'EVIDENCE_VIEWED',
        resourceType: 'EVIDENCE',
        resourceId: id,
        metadata: { count: evidence.length, username: req.user.username }
      });
    }

    return ApiResponse.success(res, evidence, 200, { count: evidence.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves all historical analysis results associated with a case
 * GET /api/cases/:id/results
 */
const getCaseResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await caseService.getAnalysisResults(id);
    return ApiResponse.success(res, results, 200, { count: results.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatches case transactions to NetworkX Intelligence Engine for multigraph analysis
 * POST /api/cases/:id/graph/analyze
 */
const analyzeCaseGraph = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, max_hops = 4, direction = 'both', rail_filter = null } = req.body || {};

    const hopsNum = parseInt(max_hops, 10);
    if (isNaN(hopsNum) || hopsNum < 1 || hopsNum > 10) {
      throw new AppError('max_hops must be an integer between 1 and 10.', 400, 'INVALID_HOP_DEPTH');
    }

    // Verify case exists in repository (throws 404 if not found)
    const existingCase = await caseService.getCaseById(id);

    // Fetch normalized transactions for this case
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100, rail: rail_filter });

    // Target subject defaults to explicitly passed subject or case subject_identifier
    const targetSubject = subject || existingCase.subject_identifier || null;

    // Dispatch to Python NetworkX intelligence engine
    const graphResult = await intelligenceService.analyzeCaseGraph({
      caseId: id,
      subject: targetSubject,
      maxHops: hopsNum,
      direction,
      railFilter: rail_filter,
      transactions: txData.transactions || []
    });

    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'GRAPH_ANALYSIS_GENERATED',
        resourceType: 'GRAPH',
        resourceId: id,
        metadata: {
          nodeCount: graphResult?.node_count || graphResult?.nodes?.length || 0,
          edgeCount: graphResult?.edge_count || graphResult?.edges?.length || 0,
          max_hops: hopsNum,
          direction
        }
      });
    }

    return ApiResponse.success(res, graphResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Convenience GET endpoint for case graph
 * GET /api/cases/:id/graph
 */
const getCaseGraph = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, max_hops = 4, direction = 'both', rail_filter = null } = req.query || {};

    const hopsNum = parseInt(max_hops, 10);
    if (isNaN(hopsNum) || hopsNum < 1 || hopsNum > 10) {
      throw new AppError('max_hops must be an integer between 1 and 10.', 400, 'INVALID_HOP_DEPTH');
    }

    const existingCase = await caseService.getCaseById(id);
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100, rail: rail_filter });
    const targetSubject = subject || existingCase.subject_identifier || null;

    const graphResult = await intelligenceService.analyzeCaseGraph({
      caseId: id,
      subject: targetSubject,
      maxHops: hopsNum,
      direction,
      railFilter: rail_filter,
      transactions: txData.transactions || []
    });

    return ApiResponse.success(res, graphResult, 200);
  } catch (error) {
    next(error);
  }
};

const PROHIBITED_CREDENTIAL_KEYS = [
  'upi_pin', 'pin', 'mpin', 'otp', 'password', 'cvv', 'card_cvv', 'card_number', 'seed_phrase', 'private_key', 'bank_password'
];

function checkProhibitedCredentials(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, value] of Object.entries(obj)) {
    if (PROHIBITED_CREDENTIAL_KEYS.includes(key.toLowerCase())) {
      throw new AppError(
        `Sensitive authentication credential '${key}' must not be submitted.`,
        400,
        'PROHIBITED_CREDENTIAL_REJECTED'
      );
    }
    if (typeof value === 'object' && value !== null) {
      checkProhibitedCredentials(value);
    }
  }
}

/**
 * Analyzes case risk using Python Multi-Factor & Behavioral Intelligence Engine
 * POST /api/cases/:id/risk/analyze
 */
const analyzeCaseRisk = async (req, res, next) => {
  try {
    const { id } = req.params;
    checkProhibitedCredentials(req.body);

    const { subject } = req.body || {};

    const existingCase = await caseService.getCaseById(id);

    // Retrieve normalized transactions belonging to this case (up to 100 limit)
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100 });

    const targetSubject = subject || existingCase.subject_identifier || null;

    const riskResult = await intelligenceService.analyzeCaseRisk({
      caseId: id,
      subject: targetSubject,
      transactions: txData.transactions || []
    });

    // Record application audit log event
    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'RISK_ANALYSIS_GENERATED',
        resourceType: 'RISK',
        resourceId: id,
        metadata: {
          overall_score: riskResult?.overall_score || 0,
          risk_level: riskResult?.risk_level || 'LOW',
          signal_count: riskResult?.signals?.length || 0,
          transaction_count: txData.transactions?.length || 0
        }
      });
    }

    return ApiResponse.success(res, riskResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Convenience GET endpoint for case risk analysis
 * GET /api/cases/:id/risk
 */
const getCaseRisk = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject } = req.query || {};

    const existingCase = await caseService.getCaseById(id);
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100 });
    const targetSubject = subject || existingCase.subject_identifier || null;

    const riskResult = await intelligenceService.analyzeCaseRisk({
      caseId: id,
      subject: targetSubject,
      transactions: txData.transactions || []
    });

    return ApiResponse.success(res, riskResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Analyzes UPI case transactions using Python Behavioral UPI Fraud Intelligence Engine
 * POST /api/cases/:id/upi/analyze
 */
const analyzeCaseUPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    checkProhibitedCredentials(req.body);

    const { subject_vpa } = req.body || {};

    const existingCase = await caseService.getCaseById(id);

    // Retrieve case transactions filtered to UPI rail only
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100, rail: 'upi' });

    // Ensure crypto transactions do not become UPI events
    const upiTransactions = (txData.transactions || []).filter((tx) => {
      const rail = String(tx.blockchain || tx.rail || '').toLowerCase();
      return rail === 'upi' || rail.includes('upi');
    });

    const targetSubject = subject_vpa ||
      (existingCase.subject_identifier && existingCase.subject_identifier.includes('@')
        ? existingCase.subject_identifier
        : null);

    const upiResult = await intelligenceService.analyzeCaseUPI({
      caseId: id,
      subjectVpa: targetSubject,
      transactions: upiTransactions
    });

    // Record application audit log event
    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'UPI_ANALYSIS_GENERATED',
        resourceType: 'UPI',
        resourceId: id,
        metadata: {
          risk_score: upiResult?.risk_score || 0,
          risk_level: upiResult?.risk_level || 'LOW',
          finding_count: upiResult?.findings?.length || 0,
          upi_transaction_count: upiTransactions.length
        }
      });
    }

    return ApiResponse.success(res, upiResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Convenience GET endpoint for case UPI analysis
 * GET /api/cases/:id/upi
 */
const getCaseUPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject_vpa } = req.query || {};

    const existingCase = await caseService.getCaseById(id);
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100, rail: 'upi' });

    const upiTransactions = (txData.transactions || []).filter((tx) => {
      const rail = String(tx.blockchain || tx.rail || '').toLowerCase();
      return rail === 'upi' || rail.includes('upi');
    });

    const targetSubject = subject_vpa ||
      (existingCase.subject_identifier && existingCase.subject_identifier.includes('@')
        ? existingCase.subject_identifier
        : null);

    const upiResult = await intelligenceService.analyzeCaseUPI({
      caseId: id,
      subjectVpa: targetSubject,
      transactions: upiTransactions
    });

    return ApiResponse.success(res, upiResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Analyzes case blockchain transactions for candidate VASP attributions
 * POST /api/cases/:id/vasp/analyze
 */
const analyzeCaseVASP = async (req, res, next) => {
  try {
    const { id } = req.params;
    checkProhibitedCredentials(req.body);

    const { subject, max_hops = 5 } = req.body || {};

    const existingCase = await caseService.getCaseById(id);

    // Retrieve normalized transactions for this case (up to 100 limit)
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100 });

    // Filter out non-blockchain/UPI transactions (VASP attribution consumes blockchain data)
    const blockchainTransactions = (txData.transactions || []).filter((tx) => {
      const rail = String(tx.blockchain || tx.rail || '').toLowerCase();
      return !rail.includes('upi');
    });

    const targetSubject = subject || existingCase.subject_identifier || null;

    const vaspResult = await intelligenceService.analyzeCaseVASP({
      caseId: id,
      subject: targetSubject,
      maxHops: parseInt(max_hops, 10) || 5,
      transactions: blockchainTransactions
    });

    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'VASP_ATTRIBUTION_GENERATED',
        resourceType: 'VASP',
        resourceId: id,
        metadata: {
          candidate_count: vaspResult?.candidates?.length || 0,
          blockchain_transaction_count: blockchainTransactions.length
        }
      });
    }

    return ApiResponse.success(res, vaspResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Convenience GET endpoint for case VASP attribution
 * GET /api/cases/:id/vasp
 */
const getCaseVASP = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, max_hops = 5 } = req.query || {};

    const existingCase = await caseService.getCaseById(id);
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100 });

    const blockchainTransactions = (txData.transactions || []).filter((tx) => {
      const rail = String(tx.blockchain || tx.rail || '').toLowerCase();
      return !rail.includes('upi');
    });

    const targetSubject = subject || existingCase.subject_identifier || null;

    const vaspResult = await intelligenceService.analyzeCaseVASP({
      caseId: id,
      subject: targetSubject,
      maxHops: parseInt(max_hops, 10) || 5,
      transactions: blockchainTransactions
    });

    return ApiResponse.success(res, vaspResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Analyzes case location signals for geospatial inconsistencies and anomalies
 * POST /api/cases/:id/geospatial/analyze
 */
const analyzeCaseGeospatial = async (req, res, next) => {
  try {
    const { id } = req.params;
    checkProhibitedCredentials(req.body);

    const { subject, location_signals = [], baseline_locations = null } = req.body || {};

    const existingCase = await caseService.getCaseById(id);

    // Collect location signals: prioritize signals in request body, or extract location signals from case transactions
    let signals = Array.isArray(location_signals) ? location_signals : [];
    if (signals.length === 0) {
      const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100 });
      for (const tx of txData.transactions || []) {
        const meta = tx.metadata || {};
        if (meta.latitude !== undefined && meta.longitude !== undefined) {
          signals.push({
            latitude: parseFloat(meta.latitude),
            longitude: parseFloat(meta.longitude),
            timestamp: tx.timestamp,
            accuracy_meters: meta.accuracy_meters || 30.0,
            source: meta.source || 'case_transaction_metadata',
            source_reference: tx.transaction_hash,
            city: meta.city || null,
            region: meta.region || null,
            country_code: meta.country_code || 'IN',
            transaction_id: tx.transaction_hash
          });
        }
      }
    }

    const targetSubject = subject || existingCase.subject_identifier || null;

    const geoResult = await intelligenceService.analyzeCaseGeospatial({
      caseId: id,
      subject: targetSubject,
      locationSignals: signals,
      baselineLocations: baseline_locations
    });

    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'GEOSPATIAL_ANALYSIS_GENERATED',
        resourceType: 'GEOSPATIAL',
        resourceId: id,
        metadata: {
          finding_count: geoResult?.findings?.length || 0,
          location_signal_count: geoResult?.location_signals?.length || 0
        }
      });
    }

    return ApiResponse.success(res, geoResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Convenience GET endpoint for case geospatial analysis
 * GET /api/cases/:id/geospatial
 */
const getCaseGeospatial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject } = req.query || {};

    const existingCase = await caseService.getCaseById(id);
    const txData = await transactionRepository.getTransactionsByCaseId(id, { limit: 100 });

    const signals = [];
    for (const tx of txData.transactions || []) {
      const meta = tx.metadata || {};
      if (meta.latitude !== undefined && meta.longitude !== undefined) {
        signals.push({
          latitude: parseFloat(meta.latitude),
          longitude: parseFloat(meta.longitude),
          timestamp: tx.timestamp,
          accuracy_meters: meta.accuracy_meters || 30.0,
          source: meta.source || 'case_transaction_metadata',
          source_reference: tx.transaction_hash,
          city: meta.city || null,
          region: meta.region || null,
          country_code: meta.country_code || 'IN',
          transaction_id: tx.transaction_hash
        });
      }
    }

    const targetSubject = subject || existingCase.subject_identifier || null;

    const geoResult = await intelligenceService.analyzeCaseGeospatial({
      caseId: id,
      subject: targetSubject,
      locationSignals: signals
    });

    return ApiResponse.success(res, geoResult, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeCaseWallet,
  getCaseAnalysis,
  getCaseEvidence,
  getCaseResults,
  analyzeCaseGraph,
  getCaseGraph,
  analyzeCaseRisk,
  getCaseRisk,
  analyzeCaseUPI,
  getCaseUPI,
  analyzeCaseVASP,
  getCaseVASP,
  analyzeCaseGeospatial,
  getCaseGeospatial
};
