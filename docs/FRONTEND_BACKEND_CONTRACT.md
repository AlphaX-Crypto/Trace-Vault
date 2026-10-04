# TRACEVAULT Frontend-Backend Contract & Integration Roadmap

## 1. Overview
The TRACEVAULT React frontend is fully developed with 10 approved and visually locked workspaces. Currently, the UI relies on client-side static fixtures. This document maps every workspace's data requirement to current backend availability, identifying existing APIs, missing endpoints, and the integration strategy for Sprint 11.

---

## 2. Workspace Contract Mapping

### 1. Dashboard (`ApplicationHome.tsx` / `SimpleWorkspace.tsx`)
- **Required Data**:
  - Active cases count & overview metrics.
  - Recent flagged activity stream (transactions across rails).
  - Quick launch scenarios.
- **Existing Backend API**:
  - `GET /api/cases` (Returns case array).
  - `GET /api/investigations/scenarios` (Returns available test scenarios).
- **Missing Backend API**:
  - `GET /api/dashboard/metrics` (Unified aggregate stats).
- **Current Mock Source**: `frontend/src/features/app/SimpleWorkspace.tsx`

---

### 2. Cases Workspace (`CaseDetail.tsx`)
- **Required Data**:
  - Case metadata (Matter ID, Title, Status, Priority, Subject Identifier, Rails).
  - Case timeline events.
  - Assigned investigators.
- **Existing Backend API**:
  - `GET /api/cases/:id` (Returns case with details & analysis references).
  - `POST /api/cases` (Creates case).
- **Missing Backend API**:
  - `PATCH /api/cases/:id/status` (Update workflow stage).
- **Current Mock Source**: Hardcoded state inside `CaseDetail.tsx`.

---

### 3. Transactions Workspace (`TransactionsWorkspace.tsx`)
- **Required Data**:
  - Paginated / filtered list of multi-rail transactions.
  - Transaction detail inspector (Rail, Hash/UTR, Gas/Fees, Status, Sender, Receiver).
- **Existing Backend API**:
  - None for raw list query (`transactions` table exists in PostgreSQL, but no dedicated route in `routes/cases.js` or `routes/transactions.js`).
- **Missing Backend API**:
  - `GET /api/cases/:id/transactions` (Fetch transactions for case).
  - `POST /api/cases/:id/transactions` (Ingest transaction record).
- **Current Mock Source**: `MOCK_TRANSACTIONS` in `TransactionsWorkspace.tsx`.

---

### 4. Trace Graph Workspace (`SuspiciousWalletGraphTracing.tsx`)
- **Required Data**:
  - Topology nodes (ID, Type, Label, Address, Risk Score, Volume).
  - Topology edges (Source, Target, Amount, Rail).
  - Selected node inspector data.
- **Existing Backend API**:
  - `GET /api/investigations/:id/graph` (Returns graph nodes and paths from Python).
  - `POST /api/cases/:id/analyze` (Triggers graph analysis and persists to DB).
- **Missing Backend API**:
  - Direct adapter to format Python NetworkX nodes into frontend SVG coordinates.
- **Current Mock Source**: `NODES` and `EDGES` fixtures in `SuspiciousWalletGraphTracing.tsx`.

---

### 5. Risk Analysis Workspace (`RiskAnalysisWorkspace.tsx`)
- **Required Data**:
  - Primary risk score (0 - 100) and severity band (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - Categorized deterministic risk signals with reasons and affected entities.
  - Risk factor breakdown bars.
- **Existing Backend API**:
  - `GET /api/cases/:id/analysis` (Returns analysis payload with risk results and signals).
- **Missing Backend API**:
  - None; schema in `risk_results` and `risk_signals` matches required structure.
- **Current Mock Source**: `DEFAULT_RISK_SUMMARY` in `RiskAnalysisWorkspace.tsx`.

---

### 6. UPI Fraud Workspace (`UPIFraudWorkspace.tsx`)
- **Required Data**:
  - Investigated subject VPA summary.
  - Normalized UPI transactions batch.
  - Triggered UPI behavioral signals (`RAPID_PASS_THROUGH`, `BENEFICIARY_BURST`, `HIGH_VALUE_VELOCITY`).
  - Reasoning trace steps.
- **Existing Backend API**:
  - Python endpoint `POST /api/v1/upi/analyze` exists and returns full data.
  - Node gateway route forwarding to UPI analyze is missing.
- **Missing Backend API**:
  - `POST /api/cases/:id/upi/analyze` (Node proxy to Python UPI engine).
- **Current Mock Source**: `MULE_UPI_ANALYSIS_DATA` and `MULE_UPI_ENTITIES` in `upiData.ts`.

---

### 7. VASP Attribution Workspace (`VASPAttributionWorkspace.tsx`)
- **Required Data**:
  - Candidate VASP name, confidence percentage, cluster tags.
  - Transaction path hops connecting target address to deposit infrastructure.
  - Verification checklist items.
- **Existing Backend API**:
  - `POST /api/cases/:id/analyze` computes nearest VASP and confidence.
- **Missing Backend API**:
  - `GET /api/vasps` (VASP registry directory view).
- **Current Mock Source**: `DEFAULT_VASP_SUMMARY` in `attributionData.ts`.

---

### 8. Geospatial Workspace (`GeospatialWorkspace.tsx`)
- **Required Data**:
  - Location signals (Coordinates, timestamp, device reference, city, rail).
  - Speed anomaly flags (Distance, elapsed time, calculated velocity).
  - Geographic consistency score.
- **Existing Backend API**:
  - Python endpoint `POST /api/v1/upi/geospatial/analyze` exists.
- **Missing Backend API**:
  - Node proxy route `POST /api/cases/:id/geospatial/analyze`.
- **Current Mock Source**: In-memory signals in `GeospatialWorkspace.tsx`.

---

### 9. Evidence Workspace (`EvidenceWorkspace.tsx`)
- **Required Data**:
  - Structured evidence records (`EV-0001` through `EV-0008`).
  - Category filters (`OBSERVED_FACT`, `SYSTEM_ANALYSIS`, `ATTRIBUTION_INDICATOR`, etc.).
  - Integrity statuses (`SOURCE_VERIFIED`, `SOURCE_AVAILABLE`).
- **Existing Backend API**:
  - `GET /api/cases/:id/evidence` (Returns evidence items linked to case).
- **Missing Backend API**:
  - `POST /api/cases/:id/evidence` (Manual investigator note / evidence creation).
- **Current Mock Source**: `INITIAL_EVIDENCE_RECORDS` in `evidenceData.ts`.

---

### 10. Reports Workspace (`InvestigationReportWorkspace.tsx`)
- **Required Data**:
  - Comprehensive report document payload (Executive summary, transaction tables, evidence register, attribution).
  - Export capabilities.
- **Existing Backend API**:
  - PostgreSQL `reports` table exists.
- **Missing Backend API**:
  - `GET /api/cases/:id/reports` and `POST /api/cases/:id/reports/generate`.
- **Current Mock Source**: `initialReportData` in `reportData.ts`.

---

### 11. Disclosure / SAHYOG Workspace (`DisclosureWorkspace.tsx`)
- **Required Data**:
  - Requisition records (`DR-2026-001`, etc.).
  - Status progression (`Draft` $\rightarrow$ `Under Review` $\rightarrow$ `Ready to Submit` $\rightarrow$ `Submitted (Sandbox)`).
  - Legal authority bases (`Section 91 CrPC`).
- **Existing Backend API**:
  - `POST /api/cases/:id/disclosure-request` (Creates requisition draft in DB).
- **Missing Backend API**:
  - `GET /api/cases/:id/disclosure-requests` (List existing requisitions).
  - `POST /api/disclosure-requests/:id/simulate-response` (Test sandbox response).
- **Current Mock Source**: `INITIAL_REQUISITIONS` in `disclosureData.ts`.

---

## 3. Recommended Sprint 11 Strategy
1. **Preserve Frontend UI**: Do not change component structures or layouts.
2. **Introduce API Client Layer**: Add `frontend/src/api/client.ts` with standard `fetch` methods pointing to `VITE_API_BASE_URL` with JWT bearer tokens.
3. **Graceful Fallback**: If backend connection is unavailable or offline, UI hooks gracefully fall back to existing in-memory fixtures.
