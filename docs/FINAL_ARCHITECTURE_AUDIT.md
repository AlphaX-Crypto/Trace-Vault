# TRACEVAULT — FINAL ARCHITECTURE AUDIT
## Comprehensive Multi-Tier Investigation System Verification

**Audit Date:** 2026-10-04  
**Audit Scope:** End-to-End Pipeline (Case $\rightarrow$ Normalized Transactions $\rightarrow$ Graph $\rightarrow$ Risk $\rightarrow$ UPI $\rightarrow$ VASP $\rightarrow$ Geospatial $\rightarrow$ Evidence $\rightarrow$ Report $\rightarrow$ Disclosure $\rightarrow$ SAHYOG Sandbox)  
**Verification Level:** Verified with Automated Test Suites & Code Inspection  

---

### 1. Architectural Pipeline & Module Verification Matrix

| Module | Backend (Node.js/Express) | Intelligence Layer (FastAPI/Python) | Database (PostgreSQL) | Frontend (React/TypeScript) | Case Isolation | Overall Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Case Management** | `/api/cases` (GET, POST, GET :id) | N/A | `cases`, `case_members` | `SimpleWorkspace` (Registry & Header) | Enforced by RBAC & assignment checks | **PASS** |
| **Transactions & Normalization** | `/api/cases/:id/transactions`, `/ingest` | Pydantic schema validation | `transactions` table (Indexed by case & hash) | `TransactionExplorer` (`activeCaseId`) | Multi-tenant filtered by `case_id` | **PASS** |
| **Graph Traversal & Peeling** | `/api/cases/:id/graph/analyze` | NetworkX MultiDiGraph BFS (`app/graph`) | Queries normalized case transactions | `GraphWorkspace` (`activeCaseId`) | Restricted to case transactions only | **PASS** |
| **Risk Multi-Factor Analysis** | `/api/cases/:id/risk/analyze` | Behavioral engine (`app/risk`) | Writes to `risk_results`, `risk_signals` | `RiskAnalysisWorkspace` (`activeCaseId`) | Isolated by case transaction scope | **PASS** |
| **UPI Behavioral Fraud** | `/api/cases/:id/upi/analyze` | Burst, pass-through, mule heuristics (`app/upi`) | Normalized UPI transactions | `UPIFraudWorkspace` (`activeCaseId`) | Domestic rail partitioned from crypto | **PASS** |
| **VASP Attribution Engine** | `/api/cases/:id/vasp/analyze` | Deterministic cluster matching (`app/attribution`) | VASP registry & deposit addresses | `VASPAttributionWorkspace` (`activeCaseId`) | Excludes UPI transactions, case-scoped | **PASS** |
| **Geospatial Anomaly** | `/api/cases/:id/geospatial/analyze` | Velocity & coordinate distance (`app/geospatial`) | Signal records & transaction metadata | `GeospatialWorkspace` (`activeCaseId`) | Case-scoped location signals | **PASS** |
| **Evidence Register** | `/api/cases/:id/evidence` (GET, POST, PATCH) | Provenance tracking (`OBSERVED` vs `DERIVED`) | `evidence` table | `EvidenceWorkspace` (`activeCaseId`) | Foreign key cascading and case filtering | **PASS** |
| **Investigation Report** | `/api/cases/:id/reports` (GET, POST, PATCH) | Automated findings synthesis | `reports` table (JSONB payload) | `ReportWorkspace` (`activeCaseId`) | Case-isolated dossier & digest | **PASS** |
| **Authorized Disclosure** | `/api/cases/:id/disclosure-request` (GET, POST, :dispatch) | SAHYOG Sandbox adapter (`sahyogSandboxAdapter.js`) | `disclosure_requests` table | `DisclosureWorkspace` (`activeCaseId`) | Request pinned to case subject | **PASS** |
| **Application Audit Log** | `auditRepository.js` | N/A | `audit_logs` table (Append-only) | UI Audit trail / Activity history | Filterable by `case_id` | **PASS** |

---

### 2. Detailed Pipeline Stage Audit

#### Stage 1: Case Initialization & Context Flow
- **Input:** Title, priority, crime type, subject identifier (wallet or VPA).
- **Authentication:** Bearer JWT token validated via `requireAuth` and `requireCaseAccess`.
- **Case Isolation:** `case_members` junction table restricts access to assigned investigators, supervisor, and admin.
- **Frontend Integration:** Active case context (`activeCaseId`) is managed at the top-level shell and passed as a prop to all 9 feature workspaces.

#### Stage 2: Transaction Ingestion & Multi-Rail Normalization
- **Rails:** Crypto (`ethereum`, `tron`, `bitcoin`) and Domestic (`upi_domestic`, `neft_rtgs`).
- **Identifier Separation:** Cryptographic hashes for blockchain; UTR/provider references for UPI.
- **Deduplication:** Enforced through unique constraints on `(blockchain, transaction_hash)`.

#### Stage 3: Graph Intelligence (NetworkX)
- **Engine:** In-memory NetworkX directed multigraph traversal in Python FastAPI service.
- **Traversal:** BFS bounded by `max_hops` (1–5) and direction (`outgoing`, `incoming`, `both`).
- **Forensic Guarantee:** No persistent graph database; graph constructed on demand from persisted transactions.

#### Stage 4: Risk & UPI Behavioral Engines
- **Scoring:** Deterministic scoring formulas producing multi-factor composite risk (0–100).
- **Classification:** Strictly labeled `DERIVED` and `SYSTEM_ANALYSIS`.
- **UPI Rules:** Rapid pass-through, high-velocity bursts, dormancy awakening, and split dispersion.

#### Stage 5: VASP Attribution & Geospatial Detection
- **Attribution Labels:** Labeled as `Candidate VASP Association` or `Potential VASP Association`. No claims of wallet ownership.
- **Geospatial Labels:** Labeled as `Location Inconsistency` or `Location Signal`. No real-time GPS or physical presence claims.

#### Stage 6: Evidence Register & Investigation Reports
- **Classification Taxonomy:** `OBSERVED_FACT`, `SYSTEM_ANALYSIS`, `ATTRIBUTION_INDICATOR`, `RISK_INDICATOR`, `INVESTIGATOR_INTERPRETATION`.
- **Statuses:** `AVAILABLE`, `REVIEW REQUIRED`, `REVIEWED`, `INSUFFICIENT SUPPORT`, `DISPUTED`.
- **Integrity Digest:** Canonical SHA-256 computation labeled `Payload Integrity Digest`.

#### Stage 7: Authorized Disclosure & SAHYOG Sandbox
- **Authority Basis:** Statutory citation (`Section 91 CrPC`) recorded without legal validation claim.
- **Simulation:** Enforces `SANDBOX-DR-...` reference numbering and explicit sandbox disclaimers.
