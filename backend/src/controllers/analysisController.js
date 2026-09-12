const caseService = require('../services/caseService');
const intelligenceService = require('../services/intelligenceService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Handles wallet analysis by dispatching to the Python Intelligence Engine
 */
const analyzeCaseWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wallet_address, blockchain } = req.body;

    // Verify case exists in the repository
    caseService.getCaseById(id);

    // Dispatch to Python Intelligence Engine
    const analysisResult = await intelligenceService.analyzeWallet({
      caseId: id,
      blockchain,
      walletAddress: wallet_address
    });

    // Store the analysis result against this case
    const savedResult = caseService.saveAnalysisResult(id, analysisResult);

    return ApiResponse.success(res, savedResult, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves all previous analysis results associated with a case
 */
const getCaseResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = caseService.getAnalysisResults(id);
    return ApiResponse.success(res, results, 200, { count: results.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeCaseWallet,
  getCaseResults
};
