const express = require('express');
const router = express.Router();
const intelligenceService = require('../services/intelligenceService');
const { requireAuth } = require('../middleware/auth');
const ApiResponse = require('../utils/apiResponse');
const auditRepository = require('../repositories/auditRepository');
const logger = require('../utils/logger');

// Retrieve available deterministic investigation scenarios (INV-001 to INV-008)
router.get('/scenarios', requireAuth, async (req, res, next) => {
  try {
    const data = await intelligenceService.getInvestigationScenarios();
    return ApiResponse.success(res, data, 200);
  } catch (error) {
    next(error);
  }
});

// Create and execute a multi-rail investigation
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const result = await intelligenceService.runInvestigation(req.body);

    // Audit log investigation creation
    await auditRepository.logAction({
      userId: req.user?.id || null,
      caseId: req.body.case_id || 'GENERAL',
      action: 'INVESTIGATION_STARTED',
      resourceType: 'INVESTIGATION',
      resourceId: result.investigation_id,
      metadata: {
        subject_id: req.body.subject_id,
        rail_scope: req.body.rail_scope,
        scenario: req.body.scenario,
      },
    });

    return ApiResponse.success(res, result, 200);
  } catch (error) {
    next(error);
  }
});

// Retrieve completed investigation by ID
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await intelligenceService.getInvestigation(req.params.id);
    return ApiResponse.success(res, result, 200);
  } catch (error) {
    next(error);
  }
});

// Run a planned investigation
router.post('/:id/run', requireAuth, async (req, res, next) => {
  try {
    const result = await intelligenceService.runInvestigation({ investigation_id: req.params.id, ...req.body });
    return ApiResponse.success(res, result, 200);
  } catch (error) {
    next(error);
  }
});

// Retrieve chronological timeline
router.get('/:id/timeline', requireAuth, async (req, res, next) => {
  try {
    const data = await intelligenceService.getInvestigationTimeline(req.params.id);
    return ApiResponse.success(res, data, 200);
  } catch (error) {
    next(error);
  }
});

// Retrieve linked evidence
router.get('/:id/evidence', requireAuth, async (req, res, next) => {
  try {
    const data = await intelligenceService.getInvestigationEvidence(req.params.id);
    return ApiResponse.success(res, data, 200);
  } catch (error) {
    next(error);
  }
});

// Retrieve investigation graph
router.get('/:id/graph', requireAuth, async (req, res, next) => {
  try {
    const data = await intelligenceService.getInvestigationGraph(req.params.id);
    return ApiResponse.success(res, data, 200);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
