const {
  CANONICAL_RAILS,
  TRANSACTION_STATUSES,
  TRANSACTION_DIRECTIONS,
  CommonTransaction
} = require('../models/commonTransaction');

class TransactionNormalizer {
  /**
   * Maps varied asset and rail representations to canonical tokens and rails
   * @param {string} rawRail
   * @param {string} [rawAsset]
   * @returns {{ rail: string, asset: string }}
   */
  static normalizeRailAndAsset(rawRail, rawAsset) {
    const railStr = String(rawRail || '').trim().toLowerCase();
    const assetStr = String(rawAsset || '').trim().toUpperCase();

    let canonicalRail = CANONICAL_RAILS.ETHEREUM;
    let canonicalAsset = 'ETH';

    if (railStr.includes('eth')) {
      canonicalRail = CANONICAL_RAILS.ETHEREUM;
      canonicalAsset = assetStr || 'ETH';
    } else if (railStr.includes('tron') || railStr.includes('trc')) {
      canonicalRail = CANONICAL_RAILS.TRON;
      canonicalAsset = assetStr || 'USDT';
    } else if (railStr.includes('btc') || railStr.includes('bitcoin')) {
      canonicalRail = CANONICAL_RAILS.BITCOIN;
      canonicalAsset = assetStr || 'BTC';
    } else if (railStr.includes('upi')) {
      canonicalRail = CANONICAL_RAILS.UPI_DOMESTIC;
      canonicalAsset = 'INR';
    } else if (railStr.includes('neft') || railStr.includes('rtgs') || railStr.includes('bank')) {
      canonicalRail = CANONICAL_RAILS.NEFT_RTGS;
      canonicalAsset = 'INR';
    } else {
      // Default fallback
      canonicalRail = CANONICAL_RAILS.ETHEREUM;
      canonicalAsset = assetStr || 'ETH';
    }

    return { rail: canonicalRail, asset: canonicalAsset };
  }

  /**
   * Normalizes execution status
   * @param {string} rawStatus
   * @returns {string} SUCCESS | FAILED | PENDING | UNDER_REVIEW
   */
  static normalizeStatus(rawStatus) {
    if (!rawStatus) return TRANSACTION_STATUSES.SUCCESS;
    const s = String(rawStatus).trim().toUpperCase();
    if (s.includes('FAIL') || s.includes('REJECT') || s.includes('DECLIN')) {
      return TRANSACTION_STATUSES.FAILED;
    }
    if (s.includes('PEND') || s.includes('INIT')) {
      return TRANSACTION_STATUSES.PENDING;
    }
    if (s.includes('REVIEW') || s.includes('FLAG')) {
      return TRANSACTION_STATUSES.UNDER_REVIEW;
    }
    return TRANSACTION_STATUSES.SUCCESS;
  }

  /**
   * Normalizes ISO UTC timestamp string
   * @param {string|number|Date} rawTimestamp
   * @returns {string} ISO 8601 UTC string
   */
  static normalizeTimestamp(rawTimestamp) {
    if (!rawTimestamp) return new Date().toISOString();
    const d = new Date(rawTimestamp);
    return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  }

  /**
   * Normalizes numeric amount into exact string representation
   * @param {string|number} rawAmount
   * @returns {string}
   */
  static normalizeAmount(rawAmount) {
    if (rawAmount === undefined || rawAmount === null) return '0.00';
    const cleanStr = String(rawAmount).replace(/,/g, '').trim();
    const num = parseFloat(cleanStr);
    return !isNaN(num) ? cleanStr : '0.00';
  }

  /**
   * Normalizes cryptocurrency payload into CommonTransaction
   * @param {Object} raw
   * @param {string} [caseId]
   * @param {string} [source='crypto_mock']
   * @returns {CommonTransaction}
   */
  static normalizeCrypto(raw, caseId = null, source = 'crypto_mock') {
    const txHash = (raw.tx_hash || raw.transaction_hash || raw.hash || '').trim();
    const { rail, asset } = this.normalizeRailAndAsset(raw.blockchain || raw.rail || 'ethereum', raw.asset);
    const timestamp = this.normalizeTimestamp(raw.timestamp);
    const amount = this.normalizeAmount(raw.amount || raw.value);
    const status = this.normalizeStatus(raw.status);

    const fromAddress = (raw.from_address || raw.from || raw.sender || '').trim();
    const toAddress = (raw.to_address || raw.to || raw.receiver || '').trim();

    return new CommonTransaction({
      id: txHash,
      case_id: caseId,
      rail,
      source,
      timestamp,
      sender: {
        address: fromAddress,
        display_label: raw.from_label || undefined,
        entity_type: raw.from_entity_type || 'WALLET'
      },
      receiver: {
        address: toAddress,
        display_label: raw.to_label || undefined,
        entity_type: raw.to_entity_type || 'WALLET'
      },
      amount,
      asset,
      direction: raw.direction || TRANSACTION_DIRECTIONS.OUTBOUND,
      status,
      transaction_type: raw.transaction_type || 'transfer',
      block_number: raw.block_number ? parseInt(raw.block_number, 10) : null,
      metadata: {
        raw_source: source,
        data_source_label: raw.data_source_label || 'DEMO / SYNTHETIC DATA',
        gas_fee: raw.gas_fee || undefined,
        input_data: raw.input_data || undefined
      }
    });
  }

  /**
   * Normalizes UPI payment payload into CommonTransaction
   * Uses neutral participant identities (Subject VPA, Counterparty VPA, Intermediary Account)
   * Does NOT assert personal identity or ownership.
   * @param {Object} raw
   * @param {string} [caseId]
   * @param {string} [source='upi_mock']
   * @returns {CommonTransaction}
   */
  static normalizeUPI(raw, caseId = null, source = 'upi_mock') {
    const ref = (raw.transaction_ref || raw.utr || raw.reference_id || raw.tx_id || '').trim();
    const timestamp = this.normalizeTimestamp(raw.timestamp);
    const amount = this.normalizeAmount(raw.amount || raw.value);
    const status = this.normalizeStatus(raw.status);

    const remitterVpa = (raw.remitter_vpa || raw.sender_vpa || raw.from_vpa || raw.from || '').trim();
    const beneficiaryVpa = (raw.beneficiary_vpa || raw.receiver_vpa || raw.to_vpa || raw.to || '').trim();

    // Extract bank handle cleanly if present
    const remitterBank = remitterVpa.includes('@') ? remitterVpa.split('@')[1] : undefined;
    const beneficiaryBank = beneficiaryVpa.includes('@') ? beneficiaryVpa.split('@')[1] : undefined;

    return new CommonTransaction({
      id: ref,
      case_id: caseId,
      rail: CANONICAL_RAILS.UPI_DOMESTIC,
      source,
      timestamp,
      sender: {
        address: remitterVpa,
        display_label: 'Remitter VPA',
        entity_type: 'VPA',
        bank_name: remitterBank
      },
      receiver: {
        address: beneficiaryVpa,
        display_label: 'Beneficiary VPA',
        entity_type: 'VPA',
        bank_name: beneficiaryBank
      },
      amount,
      asset: 'INR',
      direction: raw.direction || TRANSACTION_DIRECTIONS.OUTBOUND,
      status,
      transaction_type: raw.upi_type || 'P2P',
      block_number: null,
      metadata: {
        raw_source: source,
        data_source_label: raw.data_source_label || 'DEMO / SYNTHETIC DATA',
        utr: raw.utr || undefined,
        device_id: raw.device_id || undefined,
        upi_type: raw.upi_type || 'P2P'
      }
    });
  }
}

module.exports = TransactionNormalizer;
