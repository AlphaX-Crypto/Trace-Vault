# TRACEVAULT Common Transaction Contract

## 1. Overview
The TRACEVAULT Common Transaction Contract establishes a normalized, multi-rail data model for ingesting, persisting, and analyzing financial movements across disparate transaction rails (blockchain ledgers and domestic payment switches).

The contract enforces clear boundaries between:
1. **Observed Source Data**: Raw, immutable transaction attributes as received from an archive node or bank switch feed.
2. **Normalized Data**: Canonical structure harmonizing multi-rail identities (e.g. Ethereum hex address vs UPI VPA).
3. **Derived Analysis**: Analytical signals, risk scores, and cluster attributions computed by the intelligence engine.

---

## 2. Canonical Normalized Model

```typescript
export interface NormalizedTransaction {
  // Identity & Matter Association
  id: string;                     // Canonical unique ID (e.g. TX-ETH-001 or UTR-9182049281920)
  case_id?: string;               // Optional associated case ID (e.g. CASE-2026-001)
  rail: TransactionRail;          // Normalized rail discriminator
  
  // Temporal Markers
  timestamp: string;              // ISO 8601 UTC timestamp of execution
  block_number?: number;          // Blockchain block height (null for banking)
  
  // Parties
  sender: ParticipantIdentity;    // Origin identifier
  receiver: ParticipantIdentity;  // Destination identifier
  
  // Monetary Value
  amount: string;                 // Decimal string representation to avoid precision loss
  asset: string;                  // Currency / token code (e.g. ETH, USDT, INR)
  amount_inr_equivalent?: number; // Normalized fiat valuation at time of observation
  
  // Execution Context
  direction: TransactionDirection;// INBOUND | OUTBOUND | INTERNAL_HOP
  status: TransactionStatus;      // SUCCESS | FAILED | PENDING
  source: string;                 // Ingestion source reference (e.g. "Ethereum Archive Node")
  
  // Metadata & Custom Attributes
  metadata: Record<string, unknown>;
}

export type TransactionRail = 
  | 'ethereum' 
  | 'tron' 
  | 'bitcoin' 
  | 'upi_domestic' 
  | 'neft_rtgs' 
  | 'cross_rail';

export type TransactionDirection = 
  | 'INBOUND' 
  | 'OUTBOUND' 
  | 'INTERNAL_HOP';

export type TransactionStatus = 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'PENDING';

export interface ParticipantIdentity {
  address: string;                // Hex address or VPA
  display_label?: string;         // Human readable tag
  entity_type?: string;           // E.g. WALLET, VASP_DEPOSIT, MERCHANT, VPA
  bank_name?: string;             // For UPI / Banking rail
}
```

---

## 3. Data Tier Separation

### Tier 1: Observed Source Data (Raw)
- Crypto: `transaction_hash`, `nonce`, `gas_price`, `input_data`, `block_hash`.
- UPI: `utr_number`, `device_id`, `mcc_code`, `response_code`, `remitter_vpa`, `beneficiary_vpa`.
- Rules: Never mutated; treated as immutable evidentiary source facts.

### Tier 2: Normalized Ledger
- Universal schema mapping:
  - `from_address` / `remitter_vpa` $\rightarrow$ `sender.address`
  - `to_address` / `beneficiary_vpa` $\rightarrow$ `receiver.address`
  - `value_wei` / `inr_paisa` $\rightarrow$ `amount` / `asset`
- Allows unified graph modeling regardless of originating payment infrastructure.

### Tier 3: Derived Analysis
- Attributes attached by the Python Intelligence Layer:
  - `hop_count`: Distance from target seed.
  - `risk_score`: Deterministic rule score (0 - 100).
  - `triggered_signals`: List of matched rule indicators (e.g. `RAPID_PASS_THROUGH`).
  - `vasp_candidate`: Associated exchange infrastructure if clustered.
- Rules: Never directly written by external feeds; produced purely by the intelligence services.
