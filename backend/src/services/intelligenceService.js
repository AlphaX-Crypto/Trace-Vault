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

  /**
   * Dispatches case transactions to Python NetworkX graph engine
   * @param {Object} params
   * @param {string} params.caseId
   * @param {string} [params.subject]
   * @param {number} [params.maxHops=4]
   * @param {string} [params.direction='both']
   * @param {string} [params.railFilter]
   * @param {Array<Object>} params.transactions Normalized transactions from PostgreSQL
   * @returns {Promise<Object>} NetworkX graph analysis result
   */
  async analyzeCaseGraph({ caseId, subject = null, maxHops = 4, direction = 'both', railFilter = null, transactions = [] }) {
    const payload = {
      case_id: caseId,
      subject,
      max_hops: Math.min(10, Math.max(1, maxHops)),
      direction,
      rail_filter: railFilter,
      transactions
    };

    logger.info(`Dispatching graph analysis to Python NetworkX: Case ${caseId}, txCount=${transactions.length}, hops=${maxHops}`);

    try {
      const response = await this.client.post('/api/v1/cases/graph-analyze', payload);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `running graph analysis for Case ${caseId}`);
    }
  }

  /**
   * Dispatches case transactions to Python for multi-factor and behavioral risk intelligence
   * @param {Object} params
   * @param {string} params.caseId
   * @param {string} [params.subject]
   * @param {Array<Object>} params.transactions Normalized transactions from PostgreSQL
   * @returns {Promise<Object>} Risk analysis result
   */
  async analyzeCaseRisk({ caseId, subject = null, transactions = [] }) {
    const payload = {
      case_id: caseId,
      subject,
      transactions: transactions.slice(0, 100)
    };

    logger.info(`Dispatching risk analysis to Python: Case ${caseId}, txCount=${payload.transactions.length}`);

    try {
      const response = await this.client.post('/api/v1/cases/risk-analyze', payload);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `running risk analysis for Case ${caseId}`);
    }
  }

  /**
   * Dispatches case UPI transactions to Python for behavioral UPI fraud intelligence
   * @param {Object} params
   * @param {string} params.caseId
   * @param {string} [params.subjectVpa]
   * @param {Array<Object>} params.transactions Normalized UPI transactions from PostgreSQL
   * @returns {Promise<Object>} UPI fraud analysis result
   */
  async analyzeCaseUPI({ caseId, subjectVpa = null, transactions = [] }) {
    const payload = {
      case_id: caseId,
      subject_vpa: subjectVpa,
      transactions: transactions.slice(0, 100)
    };

    logger.info(`Dispatching UPI fraud analysis to Python: Case ${caseId}, txCount=${payload.transactions.length}`);

    try {
      const response = await this.client.post('/api/v1/cases/upi-analyze', payload);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `running UPI analysis for Case ${caseId}`);
    }
  }

  /**
   * Dispatches case blockchain transactions to Python for VASP candidate attribution analysis
   * @param {Object} params
   * @param {string} params.caseId
   * @param {string} [params.subject]
   * @param {number} [params.maxHops=5]
   * @param {Array<Object>} params.transactions Normalized blockchain transactions from PostgreSQL
   * @returns {Promise<Object>} VASP attribution analysis result
   */
  async analyzeCaseVASP({ caseId, subject = null, maxHops = 5, transactions = [] }) {
    const payload = {
      case_id: caseId,
      subject,
      max_hops: Math.min(10, Math.max(1, maxHops)),
      transactions: transactions.slice(0, 100)
    };

    logger.info(`Dispatching VASP attribution to Python: Case ${caseId}, txCount=${payload.transactions.length}`);

    try {
      const response = await this.client.post('/api/v1/cases/vasp-analyze', payload);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `running VASP attribution for Case ${caseId}`);
    }
  }

  /**
   * Dispatches case location signals to Python for geospatial consistency and anomaly analysis
   * @param {Object} params
   * @param {string} params.caseId
   * @param {string} [params.subject]
   * @param {Array<Object>} params.locationSignals Location signals associated with case
   * @param {Array<Object>} [params.baselineLocations] Optional baseline location signals
   * @returns {Promise<Object>} Geospatial analysis result
   */
  async analyzeCaseGeospatial({ caseId, subject = null, locationSignals = [], baselineLocations = null }) {
    const payload = {
      case_id: caseId,
      subject,
      location_signals: (locationSignals || []).slice(0, 100),
      baseline_locations: baselineLocations ? baselineLocations.slice(0, 100) : null
    };

    logger.info(`Dispatching geospatial analysis to Python: Case ${caseId}, signalCount=${payload.location_signals.length}`);

    try {
      const response = await this.client.post('/api/v1/cases/geospatial-analyze', payload);
      return response.data;
    } catch (error) {
      this._handleAxiosError(error, `running geospatial analysis for Case ${caseId}`);
    }
  }
}

// Export singleton instance
module.exports = new IntelligenceService();
