# TRACEVAULT V3 — PHASE 13: UPI FRAUD INTELLIGENCE & EXPLAINABLE RISK ENGINE

## 1. Executive Summary

Phase 13 establishes the first **UPI Fraud Intelligence** layer for **TRACEVAULT**. Building upon the canonical UPI data foundation established in Phase 12, Phase 13 introduces a transparent, deterministic, rule-based risk evaluation engine that translates normalized UPI transactions into court-ready, explainable fraud-risk indicators.

```
┌────────────────────────────────────────────────────────┐
│                   UPITransaction                       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 UPI Feature Extraction                 │
│  Counts, volume, stats, velocity, counterparty delta   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Behavioral / Transaction Rules             │
│      10 Pure Deterministic Detection Algorithms        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Fraud Signals                        │
│            UPIFraudFinding (Signal + Metrics)          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Risk Aggregation                      │
│        Canonical RiskResult & RiskSignal (0–100)       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Evidentiary Synthesis                  │
│       Canonical EvidenceItem & 14-Step Audit Trace     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Explainable Investigation Result           │
│                 UPIFraudAnalysisResult                 │
└────────────────────────────────────────────────────────┘
```

### Core Tenets & Non-Negotiables
- **Strictly Explainable**: Every risk point is mapped directly to a transparent, verifiable behavioral rule. No black-box algorithms or opaque confidence scores.
- **No Machine Learning**: Deterministic logic exclusively. Zero neural networks, clustering heuristics, or probabilistic hallucination.
- **No Geolocation or Surveillance**: No IP tracing, GPS coordinates, cell tower tracking, or subscriber identity resolution (deferred to future phases).
- **No Banking Intervention**: TRACEVAULT is an analytical and evidentiary tool for investigators. It does not freeze accounts, reverse transactions, or communicate with live NPCI switches.
- **Strict Objective Framing**: System outputs never assert legal guilt or say "THIS TRANSACTION IS FRAUD". Reports state: *"Potential fraud-risk signal detected: [Rule Title] — Transaction pattern requires investigator review."*
- **Preserved System Integrity**: 100% regression isolation for the crypto behavioral intelligence pipeline (`CASE-2026-001` remains `60.0 MEDIUM` to `Example Exchange`).

---

## 2. Feature Extraction Pipeline (`UPIFeatureExtractor`)

The feature extraction layer (`UPIFeatureExtractor`) extracts statistical, temporal, and relational dimensions from current target transactions alongside baseline historical behavior:

| Feature Dimension | Description | Baseline Dependent? |
| :--- | :--- | :--- |
| `transaction_count` | Number of analyzed transactions | No |
| `total_volume` | Sum of monetary value across transactions (exact `Decimal` INR) | No |
| `avg_amount`, `median_amount` | Central tendency indicators for monetary value | No |
| `max_amount`, `min_amount` | Extreme value boundary metrics | No |
| `time_span_seconds` | Total temporal delta between earliest and latest transactions | No |
| `velocity_tx_per_minute` | Frequency rate of transactions per minute | No |
| `unique_beneficiaries` | Count of distinct destination VPAs in target batch | No |
| `failed_attempt_count` | Number of `FAILED` transactions in analyzed sequence | No |
| `new_beneficiary_count` | Distinct counterparties not observed in baseline history | Yes |
| `new_device_count` | Client device references not observed in baseline history | Yes |
| `amount_deviation_ratio` | Peak amount divided by baseline average amount | Yes |
| `is_unusual_hour` | Transactions occurring during late-night off-peak hours (00:00–05:00 UTC) | Yes |
| `pass_through_detected` | Inbound credit followed by outbound debit >= 80% within 10 minutes | No |

### Baseline Handling Safeguard
When baseline history is absent (`has_baseline = False`):
- Baseline-dependent features default to `None` or `0`.
- The engine gracefully adjusts and **does NOT fabricate anomalies** or generate false-positive alerts.

---

## 3. Catalog of 10 Deterministic Detection Rules

All rules inherit from `BaseUPIRule` and execute against extracted features with configurable thresholds defined in `UPIRuleConfig`:

| Rule Name | Signal Type | Score | Severity | Trigger Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **New Beneficiary** | `NEW_BENEFICIARY` | +15 | `MEDIUM` | Baseline exists AND subject sends funds to counterparty never previously seen. |
| **High Velocity** | `HIGH_TRANSACTION_VELOCITY` | +20 | `HIGH` | >= 5 transactions within a sliding 180-second window. |
| **Transaction Burst** | `TRANSACTION_BURST` | +15 | `MEDIUM` | >= 3 transactions executed within a rapid 60-second window. |
| **Unusual Amount** | `UNUSUAL_AMOUNT` | +20 | `HIGH` | Baseline exists AND current amount >= 3.0x baseline average AND exceeds baseline max. |
| **Failed Attempts** | `MULTIPLE_FAILED_ATTEMPTS` | +15 | `MEDIUM` | >= 2 failed authentication/authorization transactions in the sequence. |
| **New Device** | `NEW_DEVICE` | +15 | `MEDIUM` | Baseline exists AND transaction originates from an unseen client device reference. |
| **Unusual Time** | `UNUSUAL_TRANSACTION_TIME` | +10 | `LOW` | Baseline exists AND transaction executes during late-night off-peak window (00:00–05:00 UTC). |
| **Beneficiary Burst** | `BENEFICIARY_BURST` | +20 | `HIGH` | >= 3 distinct counterparties paid within a sliding 300-second window. |
| **High-Value Velocity** | `HIGH_VALUE_VELOCITY` | +25 | `CRITICAL` | Combined factor: elevated transaction velocity with aggregate volume >= INR 50,000 or >= 2.5x deviation. |
| **Rapid Pass-Through** | `RAPID_PASS_THROUGH` | +20 | `HIGH` | Inbound credit immediately followed by outbound transfer of >= 80% volume within 10 minutes (600s). |

---

## 4. Risk Aggregation & Harmonization

Each triggered rule generates a structured `UPIFraudFinding`, mapped directly into canonical TRACEVAULT risk objects:

1. **Risk Score**:
   $$\text{Score} = \min\left(100.0, \, \sum_{i=1}^{k} \text{contribution}_i\right)$$
2. **Canonical Risk Tiers**:
   - `0.0 – 30.0`: **LOW**
   - `30.1 – 60.0`: **MEDIUM**
   - `60.1 – 80.0`: **HIGH**
   - `80.1 – 100.0`: **CRITICAL**
3. **Canonical RiskSignal**:
   Each finding exports to `RiskSignal` with identifier (`id`), classification code (`signal_type`), score contribution (`score`), and explanatory context (`reason`, `evidence`).
4. **Canonical EvidenceItem**:
   Each finding generates a dossier-ready evidentiary item (`EV-UPI-*`) tagged with `type="UPI_SIGNAL"` and `source="upi_rules_engine"`.

---

## 5. Deterministic 14-Step Reasoning Trace

Every analysis execution produces an explicit, verifiable 14-step reasoning trace detailing the exact investigative progression:

```text
Step 1:  Ingested {N} target transaction(s) for subject '{subject}'
Step 2:  Evaluated baseline profile ({M} historical transaction(s) available)
Step 3:  Extracted transactional features (volume: INR {V}, count: {N}, unique counterparties: {C})
Step 4:  Evaluated beneficiary novelty against baseline profile ({B} new counterparty/counterparties)
Step 5:  Computed transaction velocity across sliding time windows ({rate} tx/min)
Step 6:  Analyzed rapid succession transaction burst patterns
Step 7:  Evaluated monetary deviation relative to baseline spending behavior (peak: INR {max_amt})
Step 8:  Inspected transaction status codes for failed authentication or authorization patterns ({F} failed attempt(s))
Step 9:  Checked client device identifiers against known device references ({D} new device reference(s))
Step 10: Evaluated temporal execution distribution against baseline active hours
Step 11: Checked multi-beneficiary dispersion patterns (beneficiary burst)
Step 12: Evaluated combined high-value velocity risk factors
Step 13: Analyzed pass-through flow dynamics (inflow to outflow velocity: {detected/not detected})
Step 14: Synthesized {K} fraud risk signal(s) into canonical risk score ({score}/100, level: {level}) and {K} evidence item(s)
```

---

## 6. Synthetic Mock Test Scenarios (`MockUPIAdapter`)

Seven deterministic synthetic test scenarios are seeded for development, continuous integration, and live demonstration:

| Scenario ID | Subject VPA | Profile Description | Expected Primary Signals | Expected Risk Tier |
| :--- | :--- | :--- | :--- | :--- |
| `UPI-RISK-001` | `vikram@mockupi` | Spike from ~INR 500 baseline to INR 25,000 to new counterparty | `NEW_BENEFICIARY`, `UNUSUAL_AMOUNT` | `MEDIUM` / `HIGH` (Score: 35.0) |
| `UPI-RISK-002` | `rahul@mockupi` | 5 rapid payments within 100 seconds | `HIGH_TRANSACTION_VELOCITY` | `LOW` / `MEDIUM` (Score: 20.0) |
| `UPI-RISK-003` | `priya@mockupi` | 3 consecutive `FAILED` attempts followed by `SUCCESS` | `MULTIPLE_FAILED_ATTEMPTS` | `LOW` / `MEDIUM` (Score: 15.0) |
| `UPI-RISK-004` | `amit@mockupi` | New client device reference + sudden INR 15,000 transfer | `NEW_DEVICE`, `UNUSUAL_AMOUNT` | `MEDIUM` / `HIGH` (Score: 35.0) |
| `UPI-RISK-005` | `sunil@mockupi` | 4 distinct beneficiaries paid within 120 seconds | `BENEFICIARY_BURST` | `LOW` / `MEDIUM` (Score: 20.0) |
| `UPI-RISK-006` | `neha@mockupi` | **Control Case**: Normal spending (INR 500-600) to known recipients | *None* | `LOW` (Score: 0.0) |
| `UPI-RISK-007` | `tarun@mockupi` | **Insufficient Baseline**: 1 transaction with no history | *None* (graceful fallback) | `LOW` (Score: 0.0) |

---

## 7. API Specification

### `POST /api/v1/upi/analyze`

Executes deterministic UPI fraud intelligence analysis.

#### Request Body
```json
{
  "subject_vpa": "vikram@mockupi",
  "scenario": "UPI-RISK-001",
  "transactions": null,
  "baseline_transactions": null,
  "config": {
    "velocity_window_seconds": 180.0,
    "amount_deviation_multiplier": 3.0
  }
}
```

#### Response (200 OK)
```json
{
  "subject": "vikram@mockupi",
  "analyzed_transactions": [...],
  "features": {
    "transaction_count": 1,
    "total_volume": "25000.00",
    "avg_amount": "25000.00",
    "max_amount": "25000.00",
    "min_amount": "25000.00",
    "has_baseline": true,
    "baseline_avg_amount": "516.67",
    "amount_deviation_ratio": 48.39,
    "new_beneficiary_count": 1,
    "new_beneficiaries": ["unseen_merchant@mockupi"]
  },
  "findings": [
    {
      "signal_id": "UPI-SIG-NEWBEN-1",
      "signal_type": "NEW_BENEFICIARY",
      "severity": "MEDIUM",
      "confidence": 80.0,
      "risk_contribution": 15.0,
      "title": "New Beneficiary Interaction",
      "description": "Potential fraud-risk signal detected: Subject transacted with counterparties not present in baseline profile.",
      "reason": "Transaction directed to 1 previously unseen VPA(s): unseen_merchant@mockupi.",
      "affected_entities": ["unseen_merchant@mockupi"]
    },
    {
      "signal_id": "UPI-SIG-AMOUNT",
      "signal_type": "UNUSUAL_AMOUNT",
      "severity": "HIGH",
      "confidence": 80.0,
      "risk_contribution": 20.0,
      "title": "Unusual Transaction Amount",
      "description": "Potential fraud-risk signal detected: Transaction amount deviates significantly from established baseline profile.",
      "reason": "Peak transaction amount of INR 25000.00 is 48.4x higher than baseline average (INR 516.67)."
    }
  ],
  "risk": {
    "score": 35.0,
    "level": "MEDIUM",
    "signals": [...],
    "explanation": "Potential fraud-risk signals detected. Evaluated risk level is MEDIUM (Score: 35.0/100) across 2 behavioral indicator(s). Requires investigator review."
  },
  "evidence": [
    {
      "id": "EV-UPI-SIG-NEWBEN-1",
      "type": "UPI_SIGNAL",
      "description": "Potential fraud-risk signal detected: New Beneficiary Interaction - Potential fraud-risk signal detected: Subject transacted with counterparties not present in baseline profile.",
      "source": "upi_rules_engine",
      "status": "Detected",
      "relevance": "MEDIUM"
    },
    {
      "id": "EV-UPI-SIG-AMOUNT",
      "type": "UPI_SIGNAL",
      "description": "Potential fraud-risk signal detected: Unusual Transaction Amount - Potential fraud-risk signal detected: Transaction amount deviates significantly from established baseline profile.",
      "source": "upi_rules_engine",
      "status": "Detected",
      "relevance": "HIGH"
    }
  ],
  "reasoning_trace": [
    "Step 1: Ingested 1 target transaction(s) for subject 'vikram@mockupi'",
    "Step 2: Evaluated baseline profile (3 historical transaction(s) available)",
    "...",
    "Step 14: Synthesized 2 fraud risk signal(s) into canonical risk score (35.0/100, level: MEDIUM) and 2 evidence item(s)"
  ]
}
```

---

## 8. Verification & Quality Gate Summary

- **Total Python Tests**: 114 passing (0 failing)
  - 83 existing Phase 1–12 tests 100% passing
  - 31 new Phase 13 tests 100% passing
- **Backend Tests**: 70/70 passing across 17 test suites
- **Frontend Build**: 100% clean production build (`vite build` in 4.66s)
- **Crypto Regression**: `CASE-2026-001` verified completely untouched (score: 60.0, level: `MEDIUM`, VASP: `Example Exchange`).
- **Credential Protection**: Strict automatic rejection for sensitive keys (`upi_pin`, `password`, `otp`, `cvv`).
