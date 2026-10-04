const TransactionSourceAdapter = require('./transactionSourceAdapter');
const { CANONICAL_RAILS, PROHIBITED_CREDENTIAL_KEYS } = require('../models/commonTransaction');

// Standard VPA regex: username@bankhandle (2-256 chars before @, 2-64 chars after @)
const VPA_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/;

// Deterministic synthetic UPI fixture dataset for testing & demonstrations
const SYNTHETIC_UPI_RECORDS = Object.freeze([
  {
    transaction_ref: 'TX-UPI-001',
    utr: '9182049281920',
    remitter_vpa: 'otc_desk@okhdfcbank',
    beneficiary_vpa: 'vpa98@okhdfcbank',
    amount: '49500.00',
    currency: 'INR',
    timestamp: '2026-09-29T09:12:30.000Z',
    status: 'SUCCESS',
    upi_type: 'P2P',
    device_id: 'DEV-SIM-MUMBAI-01',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  },
  {
    transaction_ref: 'TX-UPI-002',
    utr: '9182049281921',
    remitter_vpa: 'vpa98@okhdfcbank',
    beneficiary_vpa: 'merchant_gateway@icici',
    amount: '49000.00',
    currency: 'INR',
    timestamp: '2026-09-29T09:15:45.000Z',
    status: 'SUCCESS',
    upi_type: 'P2M',
    device_id: 'DEV-SIM-MUMBAI-01',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  },
  {
    transaction_ref: 'TX-UPI-003',
    utr: '9182049281922',
    remitter_vpa: 'vpa98@okhdfcbank',
    beneficiary_vpa: 'retail_cashout@paytm',
    amount: '500.00',
    currency: 'INR',
    timestamp: '2026-09-29T09:16:10.000Z',
    status: 'SUCCESS',
    upi_type: 'P2P',
    device_id: 'DEV-SIM-MUMBAI-01',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  },
  {
    transaction_ref: 'TX-UPI-004',
    utr: '881920384',
    remitter_vpa: 'vpa98@okhdfcbank',
    beneficiary_vpa: 'hdfc_clearing@hdfcbank',
    amount: '5300000.00',
    currency: 'INR',
    timestamp: '2026-09-29T09:42:30.000Z',
    status: 'SUCCESS',
    upi_type: 'P2P',
    data_source_label: 'DEMO / SYNTHETIC DATA'
  }
]);

class UPIMockAdapter extends TransactionSourceAdapter {
  constructor() {
    super('upi_mock_adapter', CANONICAL_RAILS.UPI_DOMESTIC);
  }

  /**
   * Validates raw UPI record against VPA format, prohibited pin/otp, and numeric constraints
   */
  validateSourcePayload(record) {
    const errors = [];
    if (!record || typeof record !== 'object') {
      return { valid: false, errors: ['Record must be a valid JSON object.'] };
    }

    // Security check: reject sensitive authentication credentials (PINs, OTPs, MPINs)
    for (const key of Object.keys(record)) {
      if (PROHIBITED_CREDENTIAL_KEYS.includes(String(key).toLowerCase())) {
        errors.push(`Prohibited credential field detected: '${key}'. Ingestion rejected.`);
      }
    }

    const ref = record.transaction_ref || record.utr || record.reference_id || record.tx_id;
    if (!ref || typeof ref !== 'string' || ref.trim().length === 0) {
      errors.push('Transaction reference ID or UTR is required.');
    }

    const remitter = record.remitter_vpa || record.sender_vpa || record.from_vpa || record.from;
    if (!remitter || typeof remitter !== 'string') {
      errors.push('Remitter VPA is required.');
    } else if (!VPA_REGEX.test(remitter.trim())) {
      errors.push(`Invalid remitter VPA format: '${remitter}'. Must follow username@bankhandle syntax.`);
    }

    const beneficiary = record.beneficiary_vpa || record.receiver_vpa || record.to_vpa || record.to;
    if (!beneficiary || typeof beneficiary !== 'string') {
      errors.push('Beneficiary VPA is required.');
    } else if (!VPA_REGEX.test(beneficiary.trim())) {
      errors.push(`Invalid beneficiary VPA format: '${beneficiary}'. Must follow username@bankhandle syntax.`);
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
   * Fetches the synthetic UPI transaction dataset
   */
  async fetchTransactions(filter = {}) {
    let result = [...SYNTHETIC_UPI_RECORDS];
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.transaction_ref.toLowerCase().includes(q) ||
          r.utr.toLowerCase().includes(q) ||
          r.remitter_vpa.toLowerCase().includes(q) ||
          r.beneficiary_vpa.toLowerCase().includes(q)
      );
    }
    return result;
  }
}

module.exports = {
  UPIMockAdapter,
  SYNTHETIC_UPI_RECORDS,
  VPA_REGEX
};
