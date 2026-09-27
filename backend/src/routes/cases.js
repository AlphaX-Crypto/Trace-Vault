const express = require('express');
const router = express.Router();

const caseController = require('../controllers/caseController');
const analysisController = require('../controllers/analysisController');
const {
  validateCreateCase,
  validateAnalyzeRequest,
  validateCaseId
} = require('../middleware/validation');

// Case management endpoints
router.post('/', validateCreateCase, caseController.createCase);
router.get('/', caseController.getCases);
router.get('/:id', validateCaseId, caseController.getCaseById);

// Analysis orchestration endpoints
router.post('/:id/analyze', validateCaseId, validateAnalyzeRequest, analysisController.analyzeCaseWallet);
router.get('/:id/analysis', validateCaseId, analysisController.getCaseAnalysis);
router.get('/:id/evidence', validateCaseId, analysisController.getCaseEvidence);
router.get('/:id/results', validateCaseId, analysisController.getCaseResults);

// SAHYOG disclosure request draft endpoint
router.post('/:id/disclosure-request', validateCaseId, caseController.createDisclosureRequest);

module.exports = router;
