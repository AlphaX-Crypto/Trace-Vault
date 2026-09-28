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

module.exports = {
  createCase,
  getCases,
  getCaseById,
  createDisclosureRequest
};
