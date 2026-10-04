const express = require('express');
const router = express.Router();

const caseController = require('../controllers/caseController');
const analysisController = require('../controllers/analysisController');
const { requireAuth, requireCaseAccess, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const { analyzeLimiter, disclosureLimiter } = require('../middleware/rateLimiter');
const {
  validateCreateCase,
  validateAnalyzeRequest,
  validateCaseId
} = require('../middleware/validation');

// Case management endpoints
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.CASES_CREATE),
  validateCreateCase,
  caseController.createCase
);

router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.CASES_VIEW_ASSIGNED),
  caseController.getCases
);

router.get(
  '/:id',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.getCaseById
);

// Analysis orchestration endpoints
router.post(
  '/:id/analyze',
  requireAuth,
  analyzeLimiter,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_RUN),
  validateAnalyzeRequest,
  analysisController.analyzeCaseWallet
);

router.get(
  '/:id/analysis',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseAnalysis
);

router.get(
  '/:id/evidence',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.EVIDENCE_VIEW),
  analysisController.getCaseEvidence
);

router.post(
  '/:id/evidence',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.createEvidence
);

router.get(
  '/:id/evidence/:evidenceId',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.EVIDENCE_VIEW),
  caseController.getEvidenceById
);

router.patch(
  '/:id/evidence/:evidenceId',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.updateEvidenceStatus
);

// Transactions endpoints
router.get(
  '/:id/transactions',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.getTransactions
);

router.post(
  '/:id/transactions',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.createTransaction
);

router.post(
  '/:id/transactions/ingest',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.ingestTransactions
);

router.get(
  '/:id/results',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseResults
);

// Graph intelligence analysis endpoints (NetworkX multigraph traversal)
router.post(
  '/:id/graph/analyze',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.analyzeCaseGraph
);

router.get(
  '/:id/graph',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseGraph
);

// Risk analysis endpoints (Multi-Factor & Behavioral Risk Engine)
router.post(
  '/:id/risk/analyze',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.analyzeCaseRisk
);

router.get(
  '/:id/risk',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseRisk
);

// UPI fraud intelligence endpoints (Behavioral Rule Engine)
router.post(
  '/:id/upi/analyze',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.analyzeCaseUPI
);

router.get(
  '/:id/upi',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseUPI
);

// VASP attribution analysis endpoints
router.post(
  '/:id/vasp/analyze',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.analyzeCaseVASP
);

router.get(
  '/:id/vasp',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseVASP
);

// Geospatial anomaly analysis endpoints
router.post(
  '/:id/geospatial/analyze',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.analyzeCaseGeospatial
);

router.get(
  '/:id/geospatial',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseGeospatial
);

// SAHYOG disclosure request endpoints
router.post(
  '/:id/disclosure-request',
  requireAuth,
  disclosureLimiter,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.DISCLOSURE_CREATE),
  caseController.createDisclosureRequest
);

router.get(
  '/:id/disclosure-requests',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.getDisclosureRequests
);

router.get(
  '/:id/disclosure-requests/:requestId',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.getDisclosureRequestById
);

router.post(
  '/:id/disclosure-requests/:requestId/dispatch',
  requireAuth,
  disclosureLimiter,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.DISCLOSURE_CREATE),
  caseController.executeSandboxDisclosure
);

// Investigation Report endpoints
router.get(
  '/:id/reports',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  caseController.getReports
);

router.post(
  '/:id/reports',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.createReport
);

router.get(
  '/:id/reports/:reportId',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  caseController.getReportById
);

router.patch(
  '/:id/reports/:reportId',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  caseController.updateReport
);

module.exports = router;
