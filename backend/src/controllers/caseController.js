const caseService = require('../services/caseService');
const auditRepository = require('../repositories/auditRepository');
const ApiResponse = require('../utils/apiResponse');

const createCase = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      crime_type,
      subject_type,
      blockchain,
      subject_identifier
    } = req.body;

    const newCase = await caseService.createCase({
      title,
      description,
      priority,
      crime_type,
      subject_type,
      blockchain,
      subject_identifier
    }, req.user || null);

    return ApiResponse.success(res, newCase, 201);
  } catch (error) {
    next(error);
  }
};

const getCases = async (req, res, next) => {
  try {
    const cases = await caseService.getCasesForUser(req.user || null);
    return ApiResponse.success(res, cases, 200, { count: cases.length });
  } catch (error) {
    next(error);
  }
};

const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const caseRecord = await caseService.getCaseById(id);

    // Audit log case view if user context is available
    if (req.user) {
      await auditRepository.logAction({
        userId: req.user.id,
        caseId: id,
        action: 'CASE_VIEWED',
        resourceType: 'CASE',
        resourceId: id,
        metadata: { username: req.user.username }
      });
    }

    return ApiResponse.success(res, caseRecord, 200);
  } catch (error) {
    next(error);
  }
};

const createDisclosureRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const disclosure = await caseService.createDisclosureRequest(id, req.body, req.user || null);
    return ApiResponse.success(res, disclosure, 201, {
      message: 'Disclosure request drafted via SAHYOG Sandbox Adapter'
    });
  } catch (error) {
    next(error);
  }
};

const getDisclosureRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requests = await caseService.getDisclosureRequests(id);
    return ApiResponse.success(res, requests, 200, { count: requests.length });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, rail, search } = req.query;
    const result = await caseService.getTransactions(id, { page, limit, rail, search });
    return ApiResponse.success(res, result.transactions, 200, {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await caseService.createTransaction(id, req.body);
    return ApiResponse.success(res, transaction, 201);
  } catch (error) {
    next(error);
  }
};

const createEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const evidence = await caseService.createEvidence(id, req.body, req.user || null);
    return ApiResponse.success(res, evidence, 201);
  } catch (error) {
    next(error);
  }
};

const ingestTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rail = 'ethereum', transactions = [], source } = req.body;
    const transactionIngestionService = require('../services/transactionIngestionService');
    const result = await transactionIngestionService.ingestTransactions({
      caseId: id,
      rail,
      rawTransactions: transactions,
      sourceName: source
    });
    return ApiResponse.success(res, result, 200);
  } catch (error) {
    next(error);
  }
};

const getDisclosureRequestById = async (req, res, next) => {
  try {
    const { id, requestId } = req.params;
    const request = await caseService.getDisclosureRequestById(id, requestId);
    return ApiResponse.success(res, request, 200);
  } catch (error) {
    next(error);
  }
};

const executeSandboxDisclosure = async (req, res, next) => {
  try {
    const { id, requestId } = req.params;
    const { action = 'SUBMIT' } = req.body;
    const updated = await caseService.executeSandboxDisclosure(id, requestId, action, req.user || null);
    return ApiResponse.success(res, updated, 200, {
      message: action === 'SIMULATE_RESPONSE'
        ? 'Simulated response recorded from SAHYOG Sandbox'
        : 'Dispatched to SAHYOG Sandbox adapter'
    });
  } catch (error) {
    next(error);
  }
};

const getEvidenceById = async (req, res, next) => {
  try {
    const { id, evidenceId } = req.params;
    const evidence = await caseService.getEvidenceById(id, evidenceId);
    return ApiResponse.success(res, evidence, 200);
  } catch (error) {
    next(error);
  }
};

const updateEvidenceStatus = async (req, res, next) => {
  try {
    const { id, evidenceId } = req.params;
    const { status, notes } = req.body;
    const updated = await caseService.updateEvidenceStatus(id, evidenceId, { status, notes }, req.user || null);
    return ApiResponse.success(res, updated, 200);
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reports = await caseService.getReports(id);
    return ApiResponse.success(res, reports, 200, { count: reports.length });
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const { id, reportId } = req.params;
    const report = await caseService.getReportById(id, reportId);
    return ApiResponse.success(res, report, 200);
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await caseService.createReport(id, req.body, req.user || null);
    return ApiResponse.success(res, report, 201);
  } catch (error) {
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { id, reportId } = req.params;
    const updated = await caseService.updateReport(id, reportId, req.body, req.user || null);
    return ApiResponse.success(res, updated, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  createDisclosureRequest,
  getDisclosureRequests,
  getDisclosureRequestById,
  executeSandboxDisclosure,
  getTransactions,
  createTransaction,
  createEvidence,
  getEvidenceById,
  updateEvidenceStatus,
  ingestTransactions,
  getReports,
  getReportById,
  createReport,
  updateReport
};
