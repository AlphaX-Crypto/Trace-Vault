# TRACEVAULT V3 — Unified Investigation Orchestration & Case Intelligence

## 1. Purpose

TRACEVAULT V3 Phase 16 establishes the **Unified Investigation Orchestration & Case Intelligence Layer**. 
This layer coordinates TRACEVAULT's specialized intelligence modules across:
- **Crypto Blockchain & Behavioral Intelligence** (Phases 10–11)
- **VASP Attribution & Explainability** (Phase 3)
- **UPI Fraud Intelligence** (Phases 12–13)
- **Geospatial Anomaly Intelligence** (Phase 14)
- **Unified Multi-Rail Investigation Graph** (Phase 15)

The orchestration layer does **not** create duplicate intelligence engines or recalculate raw heuristics. Instead, it provides a deterministic execution harness that plans, executes, aggregates, timelines, and evidentiary-links multi-rail case intelligence into **ONE explainable investigation result**.

> **LEGAL & FORENSIC SAFEGUARD STATEMENT**:  
> TRACEVAULT provides investigative intelligence and analytical decision support. It does **not** independently establish:
> - Legal identity
> - Wallet ownership
> - VPA ownership
> - Criminal responsibility
> - Physical presence

---

## 2. Architecture

```
CASE
 ↓
INVESTIGATION REQUEST
 ↓
DATA SOURCE DISCOVERY & PROVENANCE
 ↓
CRYPTO INTELLIGENCE (AnalysisService)
 ↓
UPI FRAUD INTELLIGENCE (UPIFraudIntelligenceEngine)
 ↓
GEOSPATIAL INTELLIGENCE (GeospatialIntelligenceEngine)
 ↓
UNIFIED MULTI-RAIL GRAPH (NetworkX MultiDiGraph)
 ↓
BEHAVIORAL FINDINGS & VASP ATTRIBUTION
 ↓
MULTI-DOMAIN RISK AGGREGATION
 ↓
CHRONOLOGICAL TIMELINE (InvestigationTimelineBuilder)
 ↓
EVIDENTIARY CHAIN LINKING (InvestigationEvidenceLinker)
 ↓
EXPLAINABLE INVESTIGATION RESULT (16-Step Trace)
```

---

## 3. Investigation Lifecycle

The investigation execution lifecycle follows 16 deterministic steps:
1. **Request Validation**: Verifies mandatory parameters and strictly rejects prohibited credentials.
2. **Subject Normalization**: Normalizes identifier casing and determines subject typology (`wallet`, `upi_vpa`, `merchant`, `case`, `entity`).
3. **Plan Formulation**: Formulates a deterministic `InvestigationPlan` containing sequential execution steps.
4. **Data Source Discovery**: Tags provenance (`LIVE_INDEXER`, `MOCK`, `SYNTHETIC`, `INVESTIGATOR_SUPPLIED`).
5. **Live/Mock Isolation Check**: Rejects requests for live indexer data if live pipeline is unconfigured (zero silent mock fallbacks).
6. **Crypto Intelligence**: Executes blockchain traversal, peeling chain detection, and VASP attribution.
7. **UPI Fraud Intelligence**: Executes rule-based fraud detection, mule fan-out detection, and velocity scans.
8. **Geospatial Intelligence**: Evaluates transaction-associated location observations for impossible travel speeds.
9. **Unified Multi-Rail Graph Assembly**: Builds canonical NetworkX directed graph with deduplicated nodes and edges.
10. **Graph Traversal & Cross-Rail Pathing**: Evaluates multi-hop paths and cross-rail bridging connections.
11. **Behavioral & Fraud Synthesis**: Aggregates behavioral patterns and rule findings across rails.
12. **Attribution Resolution**: Identifies institutional VASP off-ramps and payment endpoints.
13. **Risk Aggregation**: Synthesizes domain risk scores into an investigative priority score using a documented deterministic formula.
14. **Timeline Construction**: Compiles chronological event sequences without inventing missing timestamps.
15. **Evidence Linking**: Categorizes supporting evidence into structured evidentiary items suitable for review.
16. **Limitations & Finalization**: Audits limitations, verifies data minimization, and finalizes the `UnifiedInvestigationResult`.

---

## 4. Request Model (`InvestigationRequest`)

```python
class InvestigationRequest(BaseModel):
    investigation_id: Optional[str]
    case_id: str
    subject_type: str = "auto"  # wallet, upi_vpa, merchant, case, auto
    subject_id: str
    rail_scope: str = "MULTI_RAIL"  # CRYPTO, UPI, GEOSPATIAL, MULTI_RAIL, ALL
    max_hops: int = 3
    include_crypto: bool = True
    include_upi: bool = True
    include_geospatial: bool = True
    include_vasp: bool = True
    include_behavioral: bool = True
    include_fraud: bool = True
    include_timeline: bool = True
    include_evidence: bool = True
    live_mode: bool = False
    scenario: Optional[str] = None
    crypto_transactions: Optional[List[Dict[str, Any]]] = None
    upi_transactions: Optional[List[Dict[str, Any]]] = None
    location_signals: Optional[List[Dict[str, Any]]] = None
    cross_rail_associations: Optional[List[Dict[str, Any]]] = None
    metadata: Dict[str, Any] = {}
```

---

## 5. Investigation Planner (`InvestigationPlanner`)

The planner inspects the request and subject typology, generating an immutable, ordered `InvestigationPlan` containing:
- `plan_id`: Deterministic identifier (`PLAN-INV-...`).
- `steps`: Array of `InvestigationPlanStep` items detailing engine, rail, data source, and description.
- `rails_involved`: Unique set of rails required.
- `engines_required`: Domain engines invoked during execution.

---

## 6. Risk Aggregation Policy (`RiskAggregator`)

The aggregation layer is thin and does not implement a secondary risk scoring engine. It synthesizes existing domain scores:
- **Base Score**: `max(crypto_score, upi_score, geo_score, vasp_risk_score)`
- **Multi-Rail Compounding**: If multiple domains report adverse findings, `10%` of secondary positive scores is added (capped at `+15.0`).
- **Cross-Rail Complexity Bonus**: If cross-rail bridges link disparate rails, `+5.0` is compounded.
- **Maximum Cap**: Strictly `100.0`.
- **Severity Mapping**:
  - `score >= 80.0`: `CRITICAL`
  - `score >= 50.0`: `HIGH`
  - `score >= 20.0`: `MEDIUM`
  - `< 20.0`: `LOW`

> **Investigative Priority Note**: The risk score is an analytical triaging indicator designed to prioritize investigator workflow. It does not constitute proof of illegality or guilt.

---

## 7. Timeline Construction (`InvestigationTimelineBuilder`)

The timeline represents an ordered sequence of events across all rails:
- **Supported Event Types**: `TRANSACTION`, `UPI_TRANSFER`, `CRYPTO_TRANSFER`, `VASP_INTERACTION`, `LOCATION_OBSERVATION`, `RISK_SIGNAL`, `BEHAVIORAL_FINDING`, `ATTRIBUTION_EVENT`, `CROSS_RAIL_ASSOCIATION`.
- **Strict Timestamp Handling**:
  - Valid ISO 8601 timestamps are ordered chronologically.
  - Missing or unparseable timestamps are explicitly flagged as `timestamp_status = "UNKNOWN"` and placed at the conclusion of the timeline.
  - Timestamps are **never** fabricated or interpolated.

---

## 8. Evidence Linking (`InvestigationEvidenceLinker`)

Reuses the canonical `EvidenceItem` model.
- **Classifications**:
  - `OBSERVED_FACT`: Direct on-chain transfers or UPI payments.
  - `SYSTEM_ANALYSIS`: Graph traversal paths and behavioral patterns.
  - `ATTRIBUTION`: VASP deposit match records.
  - `RISK_INDICATOR`: Anomaly flags, impossible travel alerts.
  - `INVESTIGATOR_INTERPRETATION`: Cross-rail correlations.
- **Terminology Safeguard**: Evidence items are explicitly designated as *"structured investigative evidence suitable for review"*. The system strictly avoids claiming automated *"court-ready"* finality.

---

## 9. Cross-Rail Handling & Non-Inferential Principles

Cross-rail associations (`CROSS_RAIL_ASSOCIATION`) link disparate financial rails without asserting shared legal personhood or ownership.
- Every synthetic association is visibly labeled: `SYNTHETIC DEMONSTRATION ASSOCIATION`.
- Metadata explicitly records: `relationship_nature: "graph_derived_association_not_identity_proof"`.

---

## 10. Provenance & Live/Mock Isolation Safety

Data provenance is strictly preserved across all domain outputs:
- `LIVE_INDEXER`: Verified on-chain data via live node/indexer connection.
- `MOCK`: Controlled offline development fixture.
- `SYNTHETIC`: Benchmark simulation scenario.
- `INVESTIGATOR_SUPPLIED`: Ad-hoc evidence provided directly by case officers.

**CRITICAL SECURITY CONTROL**: If an investigation is submitted with `live_mode=True`, the orchestrator verifies live adapter readiness. If unavailable, it raises an explicit error and halts execution. **Silent fallback to mock data is strictly prohibited.**

---

## 11. Partial Failure Handling

If one intelligence domain experiences an error or missing data (e.g. UPI ledger available but blockchain nodes unreachable):
- Investigation status is set to `PARTIAL`.
- Unaffected domains execute normally.
- The failure reason is recorded in the result's `limitations` array.
- The overall investigation result remains available for review.

---

## 12. Synthetic Investigation Scenarios (`INV-001` to `INV-008`)

| Scenario ID | Case Title | Rails | Expected Risk | Expected Status |
|---|---|---|---|---|
| `INV-001` | Crypto Peeling Chain to Exchange Deposit (`CASE-2026-001`) | Crypto | HIGH (60.0) | COMPLETE |
| `INV-002` | UPI Mule Account Funnel & Merchant Exit | UPI | HIGH | COMPLETE |
| `INV-003` | Concurrent Independent Crypto and UPI Activity | Multi-Rail | MEDIUM | COMPLETE |
| `INV-004` | Crypto Theft Off-Ramp to UPI P2P Cash-Out | Multi-Rail Bridge | CRITICAL | COMPLETE |
| `INV-005` | Cross-Rail Off-Ramp with Impossible Travel Velocity | Multi-Rail + Geo | CRITICAL | COMPLETE |
| `INV-006` | Centralized Exchange Multi-Wallet Consolidation | Crypto + UPI | HIGH | COMPLETE |
| `INV-007` | Partial Failure Handling (UPI Available, Crypto Missing) | Multi-Rail | LOW | PARTIAL |
| `INV-008` | Benign Multi-Rail Retail Transactions (Baseline Control) | Multi-Rail | LOW | COMPLETE |

---

## 13. API Reference

### 13.1 List Preset Investigation Scenarios
`GET /api/v1/investigations/scenarios`

### 13.2 Create & Execute Investigation
`POST /api/v1/investigations`

**Request Body**:
```json
{
  "scenario": "INV-004",
  "case_id": "CASE-CROSS-RAIL-004",
  "subject_id": "0xvictimwallet000000000000000000000000001",
  "rail_scope": "MULTI_RAIL"
}
```

### 13.3 Retrieve Completed Investigation
`GET /api/v1/investigations/{investigation_id}`

### 13.4 Sub-Resource Endpoints
- `GET /api/v1/investigations/{investigation_id}/timeline`
- `GET /api/v1/investigations/{investigation_id}/evidence`
- `GET /api/v1/investigations/{investigation_id}/graph`

---

## 14. Test Verification Summary

- **Python Tests**: **203 passing** (`pytest intelligence-engine/tests`)
  - 24 new comprehensive tests in `test_phase16_investigation_orchestration.py`.
  - Zero regression across all Phase 1–15 tests.
- **Backend Tests**: **70 passing** across 17 test suites (`npm test` in `backend`).
- **Frontend Build**: **Clean pass** (`npm run build` in `frontend`).
