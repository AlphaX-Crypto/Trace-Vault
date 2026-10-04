/**
 * TRACEVAULT Common Transaction Model & Constants
 * Defines canonical data tiers:
 *   1. Observed Source Data (Raw parameters preserved in metadata)
 *   2. Normalized Common Transaction Model (Harmonized multi-rail fields)
 *   3. Derived Analysis (Calculated by intelligence engine - never mixed into raw/normalized records)
 */

const CANONICAL_RAILS = Object.freeze({
  ETHEREUM: 'ethereum',
  TRON: 'tron',
  BITCOIN: 'bitcoin',
  UPI_DOMESTIC: 'upi_domestic',
  NEFT_RTGS: 'neft_rtgs',
  CROSS_RAIL: 'cross_rail'
});

const TRANSACTION_STATUSES = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW'
});

const TRANSACTION_DIRECTIONS = Object.freeze({
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
  INTERNAL_HOP: 'INTERNAL_HOP'
});

const PROHIBITED_CREDENTIAL_KEYS = Object.freeze([
  'upi_pin',
  'pin',
  'mpin',
  'otp',
  'password',
  'cvv',
  'card_cvv',
  'card_number',
  'seed_phrase',
  'private_key',
  'bank_password'
]);

class CommonTransaction {
  /**
   * @param {Object} params
   * @param {string} params.id Canonical unique event identifier
   * @param {string} [params.case_id] Case identifier
   * @param {string} params.rail Canonical rail identifier (e.g. 'ethereum', 'upi_domestic')
   * @param {string} params.source Source provider / adapter identifier
   * @param {string} params.timestamp UTC ISO 8601 execution timestamp
   * @param {Object} params.sender Canonical sender identity { address, display_label, entity_type }
   * @param {Object} params.receiver Canonical receiver identity { address, display_label, entity_type }
   * @param {string} params.amount Exact decimal string representation of monetary value
   * @param {string} params.asset Currency / token asset code (e.g. 'ETH', 'USDT', 'INR')
   * @param {string} [params.direction='OUTBOUND'] Direction: INBOUND, OUTBOUND, INTERNAL_HOP
   * @param {string} [params.status='SUCCESS'] Execution status: SUCCESS, FAILED, PENDING
   * @param {string} [params.transaction_type='transfer'] Typology
   * @param {number|null} [params.block_number=null] Block height if applicable
   * @param {Object} [params.metadata={}] Observed source details and provenance
   */
  constructor({
    id,
    case_id = null,
    rail,
    source,
    timestamp,
    sender,
    receiver,
    amount,
    asset,
    direction = TRANSACTION_DIRECTIONS.OUTBOUND,
    status = TRANSACTION_STATUSES.SUCCESS,
    transaction_type = 'transfer',
    block_number = null,
    metadata = {}
  }) {
    this.id = id;
    this.case_id = case_id;
    this.rail = rail;
    this.source = source;
    this.timestamp = timestamp;
    this.sender = sender;
    this.receiver = receiver;
    this.amount = amount;
    this.asset = asset;
    this.direction = direction;
    this.status = status;
    this.transaction_type = transaction_type;
    this.block_number = block_number;
    this.metadata = metadata;
  }

  /**
   * Transforms normalized transaction to database persistence representation for `transactions` table.
   * Preserves raw provenance and participant details in `metadata`.
   */
  toDbRow() {
    return {
      transaction_hash: this.id,
      blockchain: this.rail,
      timestamp: this.timestamp,
      from_address: this.sender.address,
      to_address: this.receiver.address,
      asset: this.asset,
      amount: parseFloat(this.amount) || 0.0,
      transaction_type: this.transaction_type,
      block_number: this.block_number,
      source: this.source,
      metadata: {
        ...this.metadata,
        case_id: this.case_id,
        direction: this.direction,
        status: this.status,
        sender_details: this.sender,
        receiver_details: this.receiver,
        amount_exact_string: this.amount
      }
    };
  }

  /**
   * Transforms normalized transaction to graph edge contract for downstream NetworkX ingestion
   */
  toGraphEdge() {
    return {
      source: this.sender.address,
      target: this.receiver.address,
      edge_id: `${this.rail}:${this.id}`,
      rail: this.rail,
      amount: parseFloat(this.amount) || 0.0,
      asset: this.asset,
      timestamp: this.timestamp,
      transaction_hash: this.id,
      status: this.status
    };
  }
}

module.exports = {
  CANONICAL_RAILS,
  TRANSACTION_STATUSES,
  TRANSACTION_DIRECTIONS,
  PROHIBITED_CREDENTIAL_KEYS,
  CommonTransaction
};
