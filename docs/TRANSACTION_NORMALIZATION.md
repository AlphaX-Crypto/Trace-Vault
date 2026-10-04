# TRACEVAULT Transaction Normalization & Ingestion Specification

## 1. Overview
The TRACEVAULT Transaction Ingestion and Normalization Engine establishes a deterministic, multi-tier data pipeline that transforms heterogeneous, provider-specific, and mock raw transaction payloads across cryptocurrency ledgers and domestic payment switches into canonical `CommonTransaction` models backed by PostgreSQL.

The engine strictly enforces boundaries between:
1. **Tier 1: Observed Source Data** (Immutable raw input, preserved in `metadata`).
2. **Tier 2: Normalized Transaction Model** (Harmonized multi-rail fields: `rail`, `source`, `timestamp`, `sender`, `receiver`, `amount`, `asset`, `direction`, `status`).
3. **Tier 3: Derived Analysis** (Analytical scores, VASP attributions, risk signals, and graph traversal—never conflated into raw or normalized records).

---

## 2. Crypto Normalization Rules

### Field Mapping
| Source Field | Canonical Field | Transform / Rule |
|:---|:---|:---|
| `tx_hash` / `transaction_hash` / `hash` | `id` | Trimmed string (minimum 8 characters). |
| `blockchain` / `rail` | `rail` | Mapped to canonical `ethereum`, `tron`, `bitcoin`. |
| `from_address` / `from` / `sender` | `sender.address` | Trimmed hex / base58 address. Entity type set to `WALLET`. |
| `to_address` / `to` / `receiver` | `receiver.address`| Trimmed hex / base58 address. Entity type set to `WALLET`. |
| `amount` / `value` | `amount` | Decimal string preserving precision. Rejects negative values. |
| `asset` | `asset` | Mapped to uppercase canonical token (`ETH`, `USDT`, `BTC`). |
| `timestamp` | `timestamp` | Timezone-aware ISO 8601 UTC string. |
| `block_number` | `block_number` | Parsed integer block height. |
| `status` | `status` | Mapped to `SUCCESS`, `FAILED`, `PENDING`, `UNDER_REVIEW`. |

### Rail Mapping
- Any variation containing `"eth"` or `"ethereum"` $\rightarrow$ `ethereum` (default asset: `ETH`).
- Any variation containing `"tron"` or `"trc"` $\rightarrow$ `tron` (default asset: `USDT`).
- Any variation containing `"btc"` or `"bitcoin"` $\rightarrow$ `bitcoin` (default asset: `BTC`).

---

## 3. UPI Normalization Rules

### Neutral Identity & Absence of Owner Inference
A Virtual Payment Address (VPA) is a payment routing handle, NOT proof of real-world personal identity or legal account ownership.
- The sender is designated as `Remitter VPA` (`entity_type: 'VPA'`).
- The receiver is designated as `Beneficiary VPA` (`entity_type: 'VPA'`).
- No identity assertions, personal names, KYC tags, or "owner" fields are inferred from VPA handles.

### Field Mapping
| Source Field | Canonical Field | Transform / Rule |
|:---|:---|:---|
| `transaction_ref` / `utr` / `reference_id` | `id` | Trimmed string reference. |
| `remitter_vpa` / `from_vpa` | `sender.address` | Validated against `username@bankhandle` syntax. Bank handle extracted to `sender.bank_name`. |
| `beneficiary_vpa` / `to_vpa` | `receiver.address` | Validated against `username@bankhandle` syntax. Bank handle extracted to `receiver.bank_name`. |
| `amount` / `value` | `amount` | Decimal string. Negative numbers rejected. |
| Currency | `asset` | Strictly normalized to `INR`. |
| `timestamp` | `timestamp` | Timezone-aware ISO 8601 UTC string. |
| `upi_type` | `transaction_type`| Normalized typology: `P2P`, `P2M`, `COLLECT`, `REFUND`. |

---

## 4. Validation & Security Rules

### Validation Invariants
1. **Required Fields**: Rejects records missing essential identifiers, sender addresses, receiver addresses, or amounts.
2. **Numeric Integrity**: Amounts must be positive numeric values. Non-numeric or negative inputs trigger structured rejection.
3. **Temporal Invariants**: Unparseable timestamps trigger validation errors.
4. **VPA Syntax**: UPI addresses must conform strictly to `^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$`.

### Prohibited Credentials Policy
Under zero-trust forensic standards, sensitive user authentication credentials must NEVER be accepted, processed, or logged:
- `upi_pin`, `pin`, `mpin`
- `otp`
- `password`, `bank_password`
- `cvv`, `card_cvv`, `card_number`
- `seed_phrase`, `private_key`

If any prohibited credential key is present in an inbound payload, the entire record is rejected immediately with a structured security violation error.

---

## 5. Rejected Records
When a batch of transactions is ingested via `POST /api/cases/:id/transactions/ingest`, the ingestion pipeline isolates invalid records without aborting the entire batch. The API returns:
- `total_submitted`: Total count of submitted payloads.
- `accepted`: Count of valid persisted records.
- `rejected`: Count of invalid records.
- `duplicates`: Count of intra-batch duplicate records omitted.
- `errors`: Detailed list indicating payload index, reference ID, and specific validation failure reasons.

---

## 6. Synthetic Data Policy
- TRACEVAULT makes **NO claims of live blockchain network connectivity or live NPCI/core banking API access**.
- All built-in source adapters (`CryptoMockAdapter`, `UPIMockAdapter`) clearly identify data origin with the label:
  `DEMO / SYNTHETIC DATA`.
- Synthetic records use neutral identifiers and non-production mock addresses (e.g. `0x71F9...`, `otc_desk@okhdfcbank`).
- No real personal data, private keys, bank accounts, or real phone numbers are ever utilized.
