# SPRINT 11 REPORT: POSTGRESQL PERSISTENCE & FIRST REAL API INTEGRATION

## 1. Executive Summary
In Sprint 11, TRACEVAULT successfully completed its first end-to-end database persistence and API gateway integration. The four core workflow domain objects—**Cases**, **Transactions**, **Evidence**, and **Disclosure Requests**—are now backed by PostgreSQL through parameterized SQL repositories and protected Node.js/Express REST endpoints. 

A centralized, typed frontend API client layer (`frontend/src/api/client.ts`) was implemented and cleanly wired into the locked user interface across 5 core views (**Dashboard**, **Cases**, **Transactions**, **Evidence**, and **Disclosure / SAHYOG**). The application preserves 100% of the approved visual styling and layouts without altering design tokens, typography, or grid hierarchies. Explicit runtime datasource indicators (`● LIVE BACKEND`, `○ DEMO / SYNTHETIC`, and `✕ BACKEND OFFLINE (FIXTURE)`) guarantee complete transparency regarding whether an analyst is reviewing database records or synthetic demonstration fixtures.

The full backend automated test suite achieves a **100% pass rate (82 passing tests across 22 suites)**, database validation checks pass flawlessly across 18 sequential migrations, and the frontend builds cleanly with zero TypeScript errors.

---

## 2. Completed Backend Endpoints
All endpoints are secured by authentication and RBAC/case-isolation middleware (`requireAuth`, `requireCaseAccess`).

| HTTP Method | Route | Description | Auth / Permission | Status |
|:---|:---|:---|:---|:---|
| `GET` | `/api/cases` | Retrieves all cases accessible to authenticated user | `requireAuth` | Implemented & Tested |
| `POST` | `/api/cases` | Creates new investigation case in PostgreSQL | `requireAuth`, `requirePermission('case:create')` | Implemented & Tested |
| `GET` | `/api/cases/:id` | Fetches case dossier with strict access isolation | `requireAuth`, `requireCaseAccess` | Implemented & Tested |
| `GET` | `/api/cases/:id/transactions` | Paginated case transaction list with search & rail filter | `requireAuth`, `requireCaseAccess` | Implemented & Tested |
| `POST` | `/api/cases/:id/transactions` | Associates and persists transaction to case in PostgreSQL | `requireAuth`, `requireCaseAccess` | Implemented & Tested |
| `GET` | `/api/cases/:id/evidence` | Fetches structured evidence items registered to case | `requireAuth`, `requireCaseAccess` | Implemented & Tested |
| `POST` | `/api/cases/:id/evidence` | Records new evidentiary finding with chain of custody | `requireAuth`, `requireCaseAccess` | Implemented & Tested |
| `GET` | `/api/cases/:id/disclosure-requests`| Lists formal requisitions/disclosure records for case | `requireAuth`, `requireCaseAccess` | Implemented & Tested |
| `POST` | `/api/cases/:id/disclosure-request` | Drafts formal Section 91 CrPC disclosure request in DB | `requireAuth`, `requireCaseAccess` | Implemented & Tested |
| `GET` | `/api/health` | Gateway liveness probe returning system status | Public | Implemented & Tested |

---

## 3. Database Schema Changes & Migrations
1. **Migration `018_make_evidence_analysis_id_nullable.sql`**:
   - Made `analysis_id` column in the `evidence` table nullable (`ALTER TABLE evidence ALTER COLUMN analysis_id DROP NOT NULL;`).
   - Rationale: Allowed investigators to register direct factual records (e.g. UPI transaction logs, subpoena receipts) directly to a case without requiring an artificial pre-run Python analysis ID.
2. **Canonical Schema Update**:
   - Synchronized `database/schema/schema.sql` to match migration 018.
3. **Repository Additions**:
   - `backend/src/repositories/transactionRepository.js`: Parameterized SQL for `getTransactionsByCaseId` (with pagination `page`/`limit`, keyword search, rail filter, and total count) and `createTransaction`.
   - `backend/src/repositories/evidenceRepository.js`: Parameterized `createEvidence` method with validation.
   - `backend/src/services/caseService.js` & `caseController.js`: Added query and ingestion handlers for Transactions, Evidence, and Disclosures.

---

## 4. Frontend Integration Status
A typed `ApiClient` was deployed in `frontend/src/api/client.ts`. The five target workspaces connect to the backend while preserving their locked UI layouts:

1. **Dashboard (`SimpleWorkspace.tsx`)**:
   - Dynamically evaluates backend health and case counts.
   - Header title displays real-time datasource pill (`● LIVE BACKEND` when API is available, `○ DEMO / SYNTHETIC` when running standalone).
2. **Cases Workspace (`SimpleWorkspace.tsx`)**:
   - Fetches live cases via `GET /api/cases`. Displays persisted records in the table; gracefully defaults to reference fixtures if standalone.
3. **Transactions Workspace (`TransactionExplorer.tsx`)**:
   - Queries `GET /api/cases/CASE-2026-001/transactions`. Displays persisted transactions and retains all existing filters (rail, direction, status, search).
   - Header badge indicates live database vs fixture origin.
4. **Evidence Workspace (`EvidenceWorkspace.tsx`)**:
   - Queries `GET /api/cases/CASE-2026-001/evidence`. Ingests database evidentiary records into the register with chain-of-custody metadata.
   - Header badge indicates live database vs fixture origin.
5. **Disclosure / SAHYOG Workspace (`DisclosureWorkspace.tsx`)**:
   - Queries `GET /api/cases/CASE-2026-001/disclosure-requests`. Displays database-backed Section 91 CrPC requisitions.
   - Header badge indicates live database vs synthetic sandbox adapter state.

---

## 5. Workspaces Intentionally Left on Fixtures
As specified by Sprint 11 architecture constraints, intelligence layer workloads remain decoupled from live HTTP calls until their dedicated service integration sprints:
1. **Trace Graph (`GraphWorkspace.tsx`)**: Fixture-backed (`mockData.ts`). NetworkX graph traversal and multi-hop peeling algorithms remain in Python.
2. **Risk Analysis (`RiskAnalysisWorkspace.tsx`)**: Fixture-backed (`mockData.ts`). Python behavioral risk engine remains decoupled.
3. **UPI Fraud (`UPIFraudWorkspace.tsx`)**: Fixture-backed (`upiData.ts`). Python heuristic velocity analysis remains decoupled.
4. **VASP Attribution (`VASPAttributionWorkspace.tsx`)**: Fixture-backed (`attributionData.ts`). Python cluster matching remains decoupled.
5. **Geospatial (`GeospatialWorkspace.tsx`)**: Fixture-backed. Python spatial anomaly detection remains decoupled.
6. **Reports (`ReportWorkspace.tsx`)**: Document composition workspace.

---

## 6. Real vs Simulated Data Distinctions
- **No Deceptive Fallbacks**: The system strictly informs the investigator whether data is sourced from PostgreSQL or demonstration fixtures.
- **Header Badges**:
  - `● LIVE BACKEND` (Emerald green badge `#ECFDF5`, text `#047857`): Live response from PostgreSQL database via Node API.
  - `○ DEMO / SYNTHETIC` (Slate neutral badge `#F1F5F9`, text `#475569`): Standard development/demonstration fixture data.
  - `✕ BACKEND OFFLINE (FIXTURE)` (Rose red badge `#FEF2F2`, text `#B91C1C`): API gateway could not be reached; user is alerted that displayed data is synthetic fallback.

---

## 7. Automated Test Results
- **Database Migrations & Constraints**:
  - `node database/scripts/validate_db.js`: All 18 migrations applied cleanly; foreign key checks and atomic rollback verified.
- **Backend Test Suite**:
  - `npm test` in `backend/`: **82 passed, 0 failed across 22 test suites** (100% pass rate).
  - Includes new suite `sprint11_persistence_integration.test.js` validating end-to-end case creation, unauthenticated rejection, case isolation (403), transaction pagination, search filtering, evidence ingestion, and disclosure requests.
- **Frontend Production Build**:
  - `npm run build` in `frontend/`: Compiled cleanly in 5.17s with 0 errors across 57 modules.

---

## 8. Preserved Frontend Guarantees
- The visual hierarchy, color palette (`#F8FAFC`, white cards, `#E2E8F0` borders, `#0F172A` text), typography, margins, and card layouts across all 10 workspaces remain 100% untouched.
- No new flashy badges, techno jargon, or cyberpunk UI elements were introduced.

---

## 9. Boundary Clarification & Next Steps
- **External Integration Clarification**: Live external mainnet node connections and live NPCI/bank core banking webhooks are NOT simulated as active connections. All persistence operates locally against PostgreSQL.
- **Next Sprint (Sprint 12)**: Connect the Node.js API gateway to the Python/FastAPI intelligence engine (`intelligenceService.js` to `intelligence-engine/app/main.py`) for live NetworkX peeling graph generation, risk scoring, and VASP clustering.
