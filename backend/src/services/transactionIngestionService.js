const transactionRepository = require('../repositories/transactionRepository');
const { CryptoMockAdapter } = require('../adapters/cryptoMockAdapter');
const { UPIMockAdapter } = require('../adapters/upiMockAdapter');
const TransactionNormalizer = require('./transactionNormalizer');
const { CANONICAL_RAILS } = require('../models/commonTransaction');
const logger = require('../utils/logger');

class TransactionIngestionService {
  constructor() {
    this.cryptoAdapter = new CryptoMockAdapter();
    this.upiAdapter = new UPIMockAdapter();
  }

  /**
   * Resolves the appropriate source adapter by rail name
   * @param {string} rail
   * @returns {Object}
   */
  getAdapterForRail(rail) {
    const r = String(rail || '').toLowerCase();
    if (r.includes('upi')) {
      return this.upiAdapter;
    }
    return this.cryptoAdapter;
  }

  /**
   * Ingests, validates, normalizes, and idempotently persists a batch of source transactions for a case
   *
   * @param {Object} params
   * @param {string} params.caseId Target investigation case identifier
   * @param {string} [params.rail='ethereum'] Source rail identifier ('ethereum', 'tron', 'upi_domestic')
   * @param {Array<Object>} [params.rawTransactions] Raw transaction records to ingest
   * @param {string} [params.sourceName] Optional custom source identifier
   * @returns {Promise<{
   *   total_submitted: number,
   *   accepted: number,
   *   rejected: number,
   *   duplicates: number,
   *   persisted_ids: Array<string>,
   *   errors: Array<{ index: number, id?: string, errors: Array<string> }>
   * }>}
   */
  async ingestTransactions({ caseId, rail = 'ethereum', rawTransactions = [], sourceName = null }) {
    if (!caseId) {
      throw new Error('Case ID is required for transaction ingestion.');
    }

    if (!Array.isArray(rawTransactions)) {
      throw new Error('rawTransactions must be an array of transaction payloads.');
    }

    const adapter = this.getAdapterForRail(rail);
    const resolvedSourceName = sourceName || adapter.sourceName;

    const summary = {
      total_submitted: rawTransactions.length,
      accepted: 0,
      rejected: 0,
      duplicates: 0,
      persisted_ids: [],
      errors: []
    };

    // Track identities already processed in this batch to prevent intra-batch duplicate inflation
    const processedKeysInBatch = new Set();

    for (let i = 0; i < rawTransactions.length; i++) {
      const raw = rawTransactions[i];

      // 1. Validation via source adapter
      const validation = adapter.validateSourcePayload(raw);
      if (!validation.valid) {
        summary.rejected++;
        summary.errors.push({
          index: i,
          id: raw.tx_hash || raw.transaction_ref || raw.utr || null,
          errors: validation.errors
        });
        continue;
      }

      try {
        // 2. Normalization
        let normalized;
        if (adapter.defaultRail === CANONICAL_RAILS.UPI_DOMESTIC) {
          normalized = TransactionNormalizer.normalizeUPI(raw, caseId, resolvedSourceName);
        } else {
          normalized = TransactionNormalizer.normalizeCrypto(raw, caseId, resolvedSourceName);
        }

        // 3. Batch-level idempotency key: (rail + transaction_id)
        const dedupKey = `${normalized.rail}:${normalized.id.toLowerCase()}`;
        if (processedKeysInBatch.has(dedupKey)) {
          summary.duplicates++;
          continue;
        }
        processedKeysInBatch.add(dedupKey);

        // 4. Persistence via TransactionRepository (handles database-level ON CONFLICT DO UPDATE idempotency)
        const dbRow = normalized.toDbRow();
        const persisted = await transactionRepository.createTransaction(dbRow);

        summary.accepted++;
        summary.persisted_ids.push(persisted.transaction_hash);
      } catch (err) {
        logger.error(`Error ingesting transaction at index ${i} for Case ${caseId}: ${err.message}`);
        summary.rejected++;
        summary.errors.push({
          index: i,
          id: raw.tx_hash || raw.transaction_ref || null,
          errors: [err.message]
        });
      }
    }

    logger.info(
      `Transaction Ingestion for Case ${caseId}: submitted=${summary.total_submitted}, accepted=${summary.accepted}, rejected=${summary.rejected}, duplicates=${summary.duplicates}`
    );

    return summary;
  }

  /**
   * Ingests synthetic mock fixtures directly for rapid test and sandbox verification
   * @param {string} caseId
   * @param {'crypto' | 'upi' | 'all'} [type='all']
   * @returns {Promise<Object>}
   */
  async ingestSyntheticFixtures(caseId, type = 'all') {
    const results = {};

    if (type === 'crypto' || type === 'all') {
      const cryptoFixtures = await this.cryptoAdapter.fetchTransactions();
      results.crypto = await this.ingestTransactions({
        caseId,
        rail: 'ethereum',
        rawTransactions: cryptoFixtures,
        sourceName: 'crypto_mock_adapter'
      });
    }

    if (type === 'upi' || type === 'all') {
      const upiFixtures = await this.upiAdapter.fetchTransactions();
      results.upi = await this.ingestTransactions({
        caseId,
        rail: 'upi_domestic',
        rawTransactions: upiFixtures,
        sourceName: 'upi_mock_adapter'
      });
    }

    return results;
  }
}

module.exports = new TransactionIngestionService();
