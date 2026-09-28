const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

class IntelligenceService {
  constructor(baseUrl = config.pythonIntelligenceUrl, timeout = config.intelligenceTimeout) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TRACEVAULT-Backend/0.2.0'
      }
    });
  }

  /**
   * Check if Python Intelligence Engine service is healthy and reachable
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return {
        reachable: true,
        status: response.data?.status || 'ok',
        service: response.data?.service || 'tracevault-intelligence',
        engine: response.data?.engine
      };
    } catch (error) {
      logger.warn(`Python Intelligence Engine health check failed: ${error.message}`);
      return {
        reachable: false,
        status: 'unreachable',
        error: 'Service unreachable'
      };
    }
  }

  /**
   * Validates that Python returned the canonical AnalysisResult contract
   * @param {Object} data
   */
  validateAnalysisResponse(data) {
    if (!data || typeof data !== 'object') {
      throw new AppError(
        'Python Intelligence Engine returned a non-object payload.',
        502,
        'INTELLIGENCE_SCHEMA_INVALID'
      );
    }

    const requiredKeys = ['case_id', 'status', 'blockchain', 'risk', 'confidence', 'evidence'];
    for (const key of requiredKeys) {
      if (!(key in data)) {
        throw new AppError(
          `Python Intelligence Engine response missing required field: '${key}'`,
          502,
          'INTELLIGENCE_SCHEMA_INVALID',
          { missingField: key }
        );
      }
    }

    if (!data.wallet && !data.subject) {
      throw new AppError(
        "Python Intelligence Engine response missing wallet/subject identifier.",
        502,
        'INTELLIGENCE_SCHEMA_INVALID'
      );
    }

    return true;
  }

  /**
   * Dispatches wallet analysis request to Python FastAPI Intelligence Engine
   * @param {Object} params
   * @param {string} params.caseId
   * @param {string} params.blockchain
   * @param {string} params.walletAddress
   * @param {number} [params.maxHops=3]
   * @param {string} [params.requestId]
   * @returns {Promise<Object>} Canonical AnalysisResult from Python
   */
  async analyzeWallet({ caseId, blockchain, walletAddress, maxHops = 3, requestId = null }) {
    const payload = {
      case_id: caseId,
      blockchain: blockchain.toLowerCase(),
      wallet_address: walletAddress,
      max_hops: maxHops
    };

    const headers = {};
    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    logger.info(`Dispatching analysis to Python Intelligence Engine: Case ${caseId}, Chain: ${blockchain}, Wallet: ${walletAddress}, Hops: ${maxHops}`);

    try {
      const response = await this.client.post('/api/v1/analyze-wallet', payload, { headers });
      const result = response.data;

      // Validate canonical response schema
      this.validateAnalysisResponse(result);

      logger.info(`Received canonical AnalysisResult for Case ${caseId} from Intelligence Engine`);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        logger.error(`Failed to connect to Python Intelligence Engine at ${this.baseUrl}: ${error.message}`);
        throw new AppError(
          'Python Intelligence Engine is currently unavailable. Please verify the service is running.',
          502,
          'INTELLIGENCE_ENGINE_UNAVAILABLE',
          { targetUrl: `${this.baseUrl}/api/v1/analyze-wallet` }
        );
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
        logger.error(`Python Intelligence Engine request timed out after ${this.timeout}ms`);
        throw new AppError(
          `Python Intelligence Engine timed out while processing request (${this.timeout}ms).`,
          504,
          'INTELLIGENCE_ENGINE_TIMEOUT',
          { timeoutMs: this.timeout }
        );
      }

      if (error.response) {
        const errorDetail = error.response.data?.detail || error.response.statusText;
        const statusCode = error.response.status === 422 ? 422 : (error.response.status === 400 ? 400 : 502);
        const errorCode = error.response.status === 422 ? 'INTELLIGENCE_VALIDATION_ERROR' : 'INTELLIGENCE_ENGINE_ERROR';

        logger.error(`Python Intelligence Engine returned error [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
        throw new AppError(
          `Intelligence Engine error: ${typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail)}`,
          statusCode,
          errorCode,
          error.response.data
        );
      }

      throw error;
    }
  }

  _handleAxiosError(error, actionDescription) {
    if (error instanceof AppError) throw error;
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new AppError(
        `Python Intelligence Engine is unreachable while ${actionDescription}.`,
        502,
        'INTELLIGENCE_ENGINE_UNAVAILABLE'
      );
    }
    if (error.response) {
      const errorDetail = error.response.data?.detail || error.response.statusText;
      const statusCode = error.response.status === 404 ? 404 : (error.response.status === 400 ? 400 : 502);
      throw new AppError(
        `Intelligence Engine error while ${actionDescription}: ${typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail)}`,
        statusCode,
        'INTELLIGENCE_ENGINE_ERROR',
        error.response.data
      );
    }
    throw error;
  }

  async getInvestigationScenarios() {
    try {
      const response = await this.client.get('/api/v1/investigations/scenarios');
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, 'fetching investigation scenarios');
    }
  }

  async runInvestigation(payload) {
    try {
      const response = await this.client.post('/api/v1/investigations', payload);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, 'running investigation');
    }
  }

  async getInvestigation(id) {
    try {
      const response = await this.client.get(`/api/v1/investigations/${encodeURIComponent(id)}`);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `fetching investigation ${id}`);
    }
  }

  async getInvestigationTimeline(id) {
    try {
      const response = await this.client.get(`/api/v1/investigations/${encodeURIComponent(id)}/timeline`);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `fetching timeline for ${id}`);
    }
  }

  async getInvestigationEvidence(id) {
    try {
      const response = await this.client.get(`/api/v1/investigations/${encodeURIComponent(id)}/evidence`);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `fetching evidence for ${id}`);
    }
  }

  async getInvestigationGraph(id) {
    try {
      const response = await this.client.get(`/api/v1/investigations/${encodeURIComponent(id)}/graph`);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `fetching graph for ${id}`);
    }
  }
}

// Export singleton instance
module.exports = new IntelligenceService();
