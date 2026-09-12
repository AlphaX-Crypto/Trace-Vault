const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

class IntelligenceService {
  constructor(baseUrl = config.pythonIntelligenceUrl) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TRACEVAULT-Backend/0.1.0'
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
        url: this.baseUrl
      };
    } catch (error) {
      logger.warn(`Python Intelligence Engine health check failed at ${this.baseUrl}: ${error.message}`);
      return {
        reachable: false,
        status: 'unreachable',
        error: error.message,
        url: this.baseUrl
      };
    }
  }

  /**
   * Dispatches wallet analysis request to Python FastAPI Intelligence Engine
   * @param {Object} params
   * @param {string} params.caseId
   * @param {string} params.blockchain
   * @param {string} params.walletAddress
   * @returns {Promise<Object>} Analysis result from Python Intelligence Engine
   */
  async analyzeWallet({ caseId, blockchain, walletAddress }) {
    const payload = {
      case_id: caseId,
      blockchain: blockchain.toLowerCase(),
      wallet_address: walletAddress
    };

    logger.info(`Dispatching analysis to Python Intelligence Engine: Case ${caseId}, Chain: ${blockchain}, Wallet: ${walletAddress}`);

    try {
      const response = await this.client.post('/api/v1/analyze-wallet', payload);
      logger.info(`Received analysis result for Case ${caseId} from Intelligence Engine`);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        logger.error(`Failed to connect to Python Intelligence Engine at ${this.baseUrl}: ${error.message}`);
        throw new AppError(
          'Python Intelligence Engine is currently unavailable. Please verify the service is running.',
          502,
          'INTELLIGENCE_ENGINE_UNAVAILABLE',
          { targetUrl: `${this.baseUrl}/api/v1/analyze-wallet` }
        );
      }

      if (error.response) {
        const errorDetail = error.response.data?.detail || error.response.statusText;
        const statusCode = error.response.status === 400 ? 400 : 502;
        logger.error(`Python Intelligence Engine returned error [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
        throw new AppError(
          `Intelligence Engine error: ${errorDetail}`,
          statusCode,
          'INTELLIGENCE_ENGINE_ERROR',
          error.response.data
        );
      }

      throw error;
    }
  }
}

// Export singleton instance
module.exports = new IntelligenceService();
