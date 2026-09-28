const caseService = require('../services/caseService');
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
    });

    return ApiResponse.success(res, newCase, 201);
  } catch (error) {
    next(error);
  }
};

const getCases = async (req, res, next) => {
  try {
    const cases = await caseService.getAllCases();
    return ApiResponse.success(res, cases, 200, { count: cases.length });
  } catch (error) {
    next(error);
  }
};

const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const caseRecord = await caseService.getCaseById(id);
    return ApiResponse.success(res, caseRecord, 200);
  } catch (error) {
    next(error);
  }
};

const createDisclosureRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const disclosure = await caseService.createDisclosureRequest(id, req.body);
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
