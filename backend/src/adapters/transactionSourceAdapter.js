/**
 * Abstract Base Class for Transaction Source Adapters
 * Defines the contract for acquiring, validating raw source payloads,
 * and producing standardized observed inputs for the normalization engine.
 */

class TransactionSourceAdapter {
  /**
   * @param {string} sourceName Identifier for this source adapter (e.g. 'crypto_mock', 'upi_mock')
   * @param {string} defaultRail Default canonical rail handled by this adapter
   */
  constructor(sourceName, defaultRail) {
    if (new.target === TransactionSourceAdapter) {
      throw new TypeError('Cannot construct TransactionSourceAdapter instances directly');
    }
    this.sourceName = sourceName;
    this.defaultRail = defaultRail;
    this.isSynthetic = true; // All demo/mock adapters explicitly declare synthetic origin
  }

  /**
   * Identifies the rail and provider of this adapter
   * @returns {{ source: string, rail: string, isSynthetic: boolean }}
   */
  getIdentity() {
    return {
      source: this.sourceName,
      rail: this.defaultRail,
      isSynthetic: this.isSynthetic
    };
  }

  /**
   * Validates raw incoming record against source-specific constraints
   * @param {Object} rawRecord
   * @returns {{ valid: boolean, errors: Array<string> }}
   */
  validateSourcePayload(rawRecord) {
    throw new Error('validateSourcePayload must be implemented by subclass');
  }

  /**
   * Fetches or emits raw source transactions
   * @param {Object} [filter]
   * @returns {Promise<Array<Object>>}
   */
  async fetchTransactions(filter = {}) {
    throw new Error('fetchTransactions must be implemented by subclass');
  }
}

module.exports = TransactionSourceAdapter;
