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

router.get(
  '/:id/results',
  requireAuth,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.ANALYSIS_VIEW),
  analysisController.getCaseResults
);

// SAHYOG disclosure request draft endpoint
router.post(
  '/:id/disclosure-request',
  requireAuth,
  disclosureLimiter,
  validateCaseId,
  requireCaseAccess,
  requirePermission(PERMISSIONS.DISCLOSURE_CREATE),
  caseController.createDisclosureRequest
);

module.exports = router;
