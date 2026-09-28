const caseService = require('../services/caseService');
const intelligenceService = require('../services/intelligenceService');
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

    // 2. Transition case lifecycle status to ANALYZING
    await caseService.updateCaseStatus(id, 'ANALYZING');

    // 3. Dispatch to Python Intelligence Engine
    const analysisResult = await intelligenceService.analyzeWallet({
      caseId: id,
      blockchain,
      walletAddress: wallet_address,
      maxHops: max_hops || 3
    });

    // 4. Store canonical analysis result (transitions status to ANALYSIS_COMPLETE)
    const savedResult = await caseService.saveAnalysisResult(id, analysisResult);

    return ApiResponse.success(res, savedResult, 200);
  } catch (error) {
    // Revert case status to OPEN if analysis failed
    try {
      await caseService.updateCaseStatus(id, 'OPEN');
    } catch (_) {
      // Ignore if case didn't exist in the first place
    }

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

module.exports = {
  analyzeCaseWallet,
  getCaseAnalysis,
  getCaseEvidence,
  getCaseResults
};
