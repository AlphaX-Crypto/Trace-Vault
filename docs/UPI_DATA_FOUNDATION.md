# TRACEVAULT V3 — UPI Data Foundation & Common Financial Event Model
**Phase 12 Architectural Reference & Specification**

---

## 1. Why UPI is Being Added

TRACEVAULT's primary mandate for financial fraud intelligence (Smart India Hackathon 2026 — Track SIH 26182) encompasses complex, multi-rail financial cybercrimes. Cybercriminals routinely exploit jurisdictional and systemic seams between decentralized ledgers (cryptocurrencies) and instant sovereign payment rails like India's **Unified Payments Interface (UPI)**:

1. **Crypto Off-Ramping into Instant Fiat**: Stolen crypto assets are swapped, bridged, deposited into peer-to-peer (P2P) desks or exchange accounts, and liquidated into bank accounts connected via UPI VPAs.
2. **Instant Mule Layering**: Illicit proceeds are rapidly fragmented across dozens of synthetic or mule VPAs within seconds.
3. **Cross-Rail Unification**: Law enforcement officers and financial intelligence units require a unified platform capable of tracing funds across both crypto and instant payment rails under a cohesive evidentiary and graph standard.

---

## 2. UPI Adapter Architecture

The UPI data foundation is decoupled into a pluggable adapter layer:

```
[ UPI Source ]
       ↓
[ BaseUPIAdapter ] ── (MockUPIAdapter / Future Provider Adapter)
       ↓
[ UPIRawEvent ]
       ↓
[ UPITransactionNormalizer ]
       ↓
[ UPITransaction ] ─── to_financial_event() ───► [ FinancialEvent ]
       ↓
[ to_graph_representation() ] ───► [ Graph Engine (Future Phase 13/14) ]
```

- **`BaseUPIAdapter`**: Abstract interface specifying `get_transaction`, `get_transactions`, and `health_check`.
- **`MockUPIAdapter`**: Deterministic synthetic generator for development, integration tests, and presentation harnesses.
- **`UPITransactionNormalizer`**: Strict parser and sanitizer guaranteeing schema integrity and data minimization.

---

## 3. Raw Event Model (`UPIRawEvent`)

### [ IMPLEMENTED IN PHASE 12 ]
Raw bank payloads or webhook events are encapsulated in `UPIRawEvent`:
- Separates heterogeneous provider-specific field names (e.g. `txnId`, `payerVpa`, `txnAmount`, `rrn`) from canonical data structures.
- Prevents provider schema drift from contaminating core domain models.
- Preserves raw payloads safely in transit prior to sanitization.

---

## 4. Canonical UPI Model (`UPITransaction`)

### [ IMPLEMENTED IN PHASE 12 ]
The canonical `UPITransaction` enforces strict typing, data minimization, and immutability:

| Field | Type | Description |
|---|---|---|
| `transaction_id` | `str` | Unique UPI Transaction ID or Bank RRN |
| `transaction_reference` | `Optional[str]` | Bank UTR or payment reference |
| `timestamp` | `str` | Timezone-aware ISO 8601 UTC string (`YYYY-MM-DDTHH:MM:SSZ`) |
| `amount` | `Decimal` | Exact monetary volume (non-negative) |
| `currency` | `str` | Strictly `"INR"` in Phase 12 |
| `sender_vpa` | `str` | Cleaned lowercase Virtual Payment Address |
| `receiver_vpa` | `str` | Cleaned lowercase Virtual Payment Address |
| `sender_bank` | `Optional[str]` | Originating bank / PSP identifier |
| `receiver_bank` | `Optional[str]` | Beneficiary bank / PSP identifier |
| `merchant_id` | `Optional[str]` | Merchant ID for P2M transactions |
| `merchant_category` | `Optional[str]` | Merchant Category Code (MCC) |
| `transaction_type` | `str` | Normalized typology (`P2P`, `P2M`, `COLLECT`, `REFUND`, `REVERSAL`, `UNKNOWN`) |
| `status` | `str` | Normalized status (`SUCCESS`, `FAILED`, `PENDING`, `REVERSED`, `REFUNDED`, `UNKNOWN`) |
| `payment_app` | `Optional[str]` | Client app (e.g. PhonePe, GPay, BHIM) |
| `device_reference` | `Optional[str]` | Future analytical synthetic device reference |
| `ip_signal_reference` | `Optional[str]` | Future analytical IP signal reference |
| `location_signal_reference`| `Optional[str]` | Future analytical location signal reference |
| `source` | `str` | Originating data source (`"mock_upi"`) |
| `rail` | `str` | Fixed indicator (`"upi"`) |
| `metadata` | `Dict[str, Any]` | Sanitized forensic and provider context |

---

## 5. Common Financial Event Concept (`FinancialEvent`)

### [ IMPLEMENTED IN PHASE 12 ]
To avoid disrupting the production-verified `CommonTransaction` crypto model, TRACEVAULT V3 introduces `FinancialEvent` as a cross-rail umbrella abstraction:

```
                     FinancialEvent
                           │
             ┌─────────────┴─────────────┐
             ↓                           ↓
      FinancialRail.CRYPTO        FinancialRail.UPI
             ↓                           ↓
      CommonTransaction            UPITransaction
```

Both `CommonTransaction.to_financial_event()` and `UPITransaction.to_financial_event()` bridge into this model, preserving 100% backward compatibility for crypto while standardizing cross-rail data for future intelligence modules.

---

## 6. VPA Representation & Syntax Validation

### [ IMPLEMENTED IN PHASE 12 ]
Virtual Payment Addresses (VPAs) are validated via standard syntax regex:
```regex
^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$
```
- **Syntax Only**: Validates structural format (`username@handle`).
- **No Identity Assertions**: A VPA is never treated as definitive proof of a person's legal identity or bank account ownership.
- **Graph Entity Classification**: Entities are tagged as `UPI_VPA`, `BANK`, or `MERCHANT` (never `PERSON_IDENTITY`).

---

## 7. Amount Precision

### [ IMPLEMENTED IN PHASE 12 ]
Financial calculations in TRACEVAULT V3 strictly prohibit binary floating-point representation (`float`) for fiat transactions to prevent rounding discrepancies in evidentiary filings:
- Represented as Python `Decimal` (`Decimal("500.00")`).
- Negative values are rejected at validation.
- Serialized to string in dictionary and JSON exports (`"500.00"`).

---

## 8. Timestamp Normalization

### [ IMPLEMENTED IN PHASE 12 ]
All UPI timestamps are normalized to **UTC ISO 8601** strings with a trailing `"Z"`:
- Supports numeric epoch seconds and epoch milliseconds.
- Supports naive and timezone-aware Python `datetime` instances (naive explicitly assumes UTC).
- Original provider timestamp is preserved in `metadata["original_timestamp"]`.

---

## 9. Privacy & Data Minimization

### [ IMPLEMENTED IN PHASE 12 ]
UPI data processing adheres to strict privacy and data minimization standards:
- **Prohibited Credentials**: The following keys are strictly rejected at the ingestion and normalization boundary:
  `upi_pin`, `pin`, `mpin`, `otp`, `password`, `bank_password`, `cvv`, `card_cvv`, `card_number`, `seed_phrase`, `private_key`.
- Ingesting payloads containing any of these keys raises an immediate security exception.
- Device references are non-reversible synthetic placeholders.

---

## 10. Mock UPI Source & Deterministic Scenarios

### [ IMPLEMENTED IN PHASE 12 ]
`MockUPIAdapter` provides controlled, deterministic test fixtures:

1. **`NORMAL_P2P` (`UPI-TXN-P2P-001`)**:
   - `alice@mockupi` → `bob@mockupi`, ₹500.00, `SUCCESS`
2. **`NORMAL_P2M` (`UPI-TXN-P2M-001`)**:
   - `alice@mockupi` → `merchant.demo@mockupi`, ₹850.00, `SUCCESS`, Merchant ID `MERCHANT-DEMO-01`
3. **`MULTI_TRANSACTION_CASE` (`UPI-DEMO-003`)**:
   - `alice@mockupi` → `bob@mockupi` (₹1200.00) → `merchant.demo@mockupi` (₹1150.00)
4. **`REFUND_CASE` (`UPI-TXN-REFUND-001`)**:
   - `merchant.demo@mockupi` → `alice@mockupi`, ₹850.00, `REFUND`
5. **`FAILED_TRANSACTION` (`UPI-TXN-FAIL-001`)**:
   - `charlie@mockupi` → `dave@mockupi`, ₹2000.00, `FAILED`, reason: `DECLINED_BY_BANK`

Synthetic identifiers only are used. Synthetic records are tagged with `data_source="mock_upi"`, `provider="mock"`, and `environment="development"`.

---

## 11. Why Live UPI Connectivity is NOT Implemented

### [ IMPLEMENTED IN PHASE 12 ]
- **Regulatory Compliance**: Live UPI processing in India requires NPCI certification, banking sponsorship, Bank PSP licenses, and strict tokenization protocols.
- **Fail-Safe Configuration**: Setting `UPI_DATA_SOURCE=live` raises a descriptive error (`ValueError`). It will **never** silently fall back to mock data, preventing simulated records from being mistaken for real banking evidence.

---

## 12. Security Controls

### [ IMPLEMENTED IN PHASE 12 ]
All existing security measures remain active:
- Credential sanitization at normalization.
- Parameterized queries across database operations.
- Audit logging of UPI transaction views without leaking sensitive context.
- Rate limiting, security headers, and JWT RBAC across application boundaries.

---

## 13. Future Roadmap: UPI Fraud Intelligence

### [ FUTURE — PHASE 13 ]
- Rapid circular mule accounts detection on UPI graphs.
- P2P to P2M structuring patterns.
- High-velocity split-forwarding (fan-in / fan-out on VPAs).
- Mule cluster identification and risk scoring.

---

## 14. Future Roadmap: Geospatial Intelligence

### [ FUTURE — PHASE 14 ]
- IP subnet and city-level geocoding (no real-time GPS tracking).
- Impossible travel velocity anomaly detection.
- Cross-referencing IP risk telemetry.

---

## 15. Future Roadmap: Unified Crypto + UPI Graph

### [ FUTURE — PHASE 15 ]
- Bipartite and multi-modal graph representations connecting cryptocurrency deposit wallets to fiat bank off-ramp accounts and recipient VPAs.
- Full end-to-end tracing from victim crypto wallet to suspect bank account.
