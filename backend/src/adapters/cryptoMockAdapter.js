const TransactionSourceAdapter = require('./transactionSourceAdapter');
const { CANONICAL_RAILS, PROHIBITED_CREDENTIAL_KEYS } = require('../models/commonTransaction');

// Deterministic synthetic cryptocurrency fixture dataset for testing & demonstrations
const SYNTHETIC_CRYPTO_RECORDS = Object.freeze([
  {
    tx_hash: '0x8ef2a9103c8b7b659fe10938bfe41209b0a124982',
    blockchain: 'ethereum',
    from_address: '0x71F9A6809403dE4B07B4f114B5C1089b0A124982',
    to_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    amount: '42.50000000',
    asset: 'ETH',
    block_number: 20914820,
    timestamp: '2026-09-29T08:14:22.000Z',
    status: 'SUCCESS',
    gas_fee: '0.0021 ETH',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  },
  {
    tx_hash: '0x94pd3819fa821c90038Fe942dF4426511aF890987',
    blockchain: 'Ethereum',
    from_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    to_address: '0x3AF17828C403dE4B07B4f114B5C1089b0A124982',
    amount: '30.00000000',
    asset: 'ETH',
    block_number: 20914845,
    timestamp: '2026-09-29T08:22:45.000Z',
    status: 'SUCCESS',
    gas_fee: '0.0018 ETH',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  },
  {
    tx_hash: '0x039d91838cf419208472532410a0a5417bBc9800',
    blockchain: 'ethereum',
    from_address: '0x84C2EF17BD0038Fe942dF4426511aF890987e109',
    to_address: '0xD42A1E09489403dE4B07B4f114B5C1089b0A124982',
    amount: '12.50000000',
    asset: 'ETH',
    block_number: 20914852,
    timestamp: '2026-09-29T08:25:10.000Z',
    status: 'SUCCESS',
    gas_fee: '0.0015 ETH',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  },
  {
    tx_hash: '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b',
    blockchain: 'ethereum',
    from_address: '0x3AF17828C403dE4B07B4f114B5C1089b0A124982',
    to_address: '0x92DE8C11A79403dE4B07B4f114B5C1089b0A124982',
    amount: '30.00000000',
    asset: 'ETH',
    block_number: 20914880,
    timestamp: '2026-09-29T08:35:00.000Z',
    status: 'SUCCESS',
    gas_fee: '0.0024 ETH',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  },
  {
    tx_hash: 'TRC20_721629e5039E6103Ac3e16441b45502b4917C590',
    blockchain: 'tron',
    from_address: '0x18D502bfa4917C59039E6103Ac3e16441b45502b',
    to_address: '0x94A91B012F49028F3092019482b4902194820194',
    amount: '85000.00000000',
    asset: 'USDT',
    block_number: 54198204,
    timestamp: '2026-09-29T09:10:14.000Z',
    status: 'SUCCESS',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  }
]);

class CryptoMockAdapter extends TransactionSourceAdapter {
  constructor() {
    super('crypto_mock_adapter', CANONICAL_RAILS.ETHEREUM);
  }

  /**
   * Validates raw crypto record against formatting, credential leak, and required property constraints
   */
  validateSourcePayload(record) {
    const errors = [];
    if (!record || typeof record !== 'object') {
      return { valid: false, errors: ['Record must be a valid JSON object.'] };
    }

    // Security check: reject private keys and seed phrases
    for (const key of Object.keys(record)) {
      if (PROHIBITED_CREDENTIAL_KEYS.includes(String(key).toLowerCase())) {
        errors.push(`Prohibited credential field detected: '${key}'. Ingestion rejected.`);
      }
    }

    const txHash = record.tx_hash || record.transaction_hash || record.hash;
    if (!txHash || typeof txHash !== 'string' || txHash.trim().length < 8) {
      errors.push('Transaction hash is required and must be at least 8 characters.');
    }

    const fromAddr = record.from_address || record.from || record.sender;
    if (!fromAddr || typeof fromAddr !== 'string' || fromAddr.trim().length < 4) {
      errors.push('Sender from_address is required.');
    }

    const toAddr = record.to_address || record.to || record.receiver;
    if (!toAddr || typeof toAddr !== 'string' || toAddr.trim().length < 4) {
      errors.push('Receiver to_address is required.');
    }

    const amt = record.amount !== undefined ? record.amount : record.value;
    if (amt === undefined || amt === null || isNaN(parseFloat(amt)) || parseFloat(amt) < 0) {
      errors.push('Amount must be a non-negative numeric value.');
    }

    if (record.timestamp) {
      const d = new Date(record.timestamp);
      if (isNaN(d.getTime())) {
        errors.push('Invalid timestamp format.');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Fetches the synthetic crypto transaction dataset
   */
  async fetchTransactions(filter = {}) {
    let result = [...SYNTHETIC_CRYPTO_RECORDS];
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.tx_hash.toLowerCase().includes(q) ||
          r.from_address.toLowerCase().includes(q) ||
          r.to_address.toLowerCase().includes(q)
      );
    }
    return result;
  }
}

module.exports = {
  CryptoMockAdapter,
  SYNTHETIC_CRYPTO_RECORDS
};
