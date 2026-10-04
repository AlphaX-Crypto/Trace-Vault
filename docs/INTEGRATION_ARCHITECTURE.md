# TRACEVAULT Integration Architecture

## 1. Current System
TRACEVAULT is an enterprise-grade investigation platform engineered for multi-rail financial flow tracing, deterministic graph attribution, risk analysis, UPI flow analytics, and authorized information disclosure workflows.

The system is composed of four principal subsystems:
1. **React Frontend (`frontend/`)**: Single-page application built on React 18, TypeScript, and Vite. Presents 10 visual workspaces (Dashboard, Cases, Transactions, Trace Graph, Risk Analysis, UPI Fraud, VASP Attribution, Geospatial, Evidence, Reports, Disclosure).
2. **Node.js / Express Backend (`backend/`)**: Core application gateway and orchestration API service. Manages authentication (JWT), case state, audit logging, request correlation, rate limiting, and database interactions, delegating analytical workloads to the Python engine.
3. **Python / FastAPI Intelligence Engine (`intelligence-engine/`)**: Analytical computation layer leveraging NetworkX, deterministic behavioral rules, graph traversal, and geospatial anomaly detection.
4. **PostgreSQL Persistence Layer (`database/`)**: Relational database supporting transactional integrity, structured tables for cases, entities, transactions, analysis results, and evidentiary logs. Supports in-memory simulation (`pg-mem`) for CI/test isolation.

---

## 2. Frontend
- **Framework**: React 18 + TypeScript + Vite.
- **Current Operational Mode**: Self-contained client-side investigation workstation rendering pre-structured fixtures (`mockData.ts`, `upiData.ts`, `attributionData.ts`, `disclosureData.ts`, `evidenceData.ts`, `reportData.ts`).
- **Backend Communication**: No active HTTP calls are currently wired in the frontend UI components. All features operate against static in-memory records.
- **Component Status**: Complete and visually locked. No layout modifications are permitted.

---

## 3. Node / Express Backend
- **Entrypoint**: `backend/src/server.js` (HTTP listener on port 5000), configured via `backend/src/app.js`.
- **Database Driver**: `pg` (Node-Postgres) with connection pool in `backend/src/db/connection.js`, featuring fallback to `pg-mem` for isolated automated testing.
- **Security & Middleware**:
  - `helmet`: HTTP security headers.
  - `cors`: Configurable origin white-listing.
  - `express-rate-limit`: Rate limiters for auth, analysis, and general endpoints.
  - `requestCorrelation`: Propagates/generates `X-Request-ID`.
  - `securityScanMiddleware`: Inspects inbound payloads for exposed credentials.
  - `auth`: Bearer JWT token verification and RBAC permission checks (`requireAuth`, `requirePermission`, `requireRole`, `requireCaseAccess`).
- **Intelligence Orchestration**: `backend/src/services/intelligenceService.js` makes outbound Axios calls to the Python service at `http://localhost:8000`.

---

## 4. Python / FastAPI Intelligence
- **Entrypoint**: `intelligence-engine/app/main.py` (FastAPI app on port 8000).
- **Core Modules**:
  - `app.graph`: NetworkX graph modeling, BFS traversal, peeling chain detection, multi-hop path extraction.
  - `app.attribution`: Deterministic clustering and VASP registry matching.
  - `app.risk`: Rule engine evaluating transaction velocity, mixer pools, structuring patterns, and multi-factor scoring.
  - `app.upi`: In-memory UPI normalization, behavioral velocity analysis, beneficiary burst, pass-through heuristics.
  - `app.geospatial`: Geographic signal normalization, velocity threshold checks, coordinate clustering.
  - `app.investigation`: Unified orchestration (`InvestigationOrchestrator`, `InvestigationPlanner`) combining crypto, UPI, and geospatial rails.

---

## 5. PostgreSQL
- **Migrations**: 17 sequential SQL migrations located in `database/migrations/` (tables 001 through 017).
- **Schema**: Canonical SQL definition in `database/schema/schema.sql`.
- **Seed Scripts**: Development seed fixture in `database/seeds/001_dev_seeds.sql`.
- **Validation**: `database/scripts/validate_db.js` verifies migration execution, table row counts, and transaction rollback mechanics.

---

## 6. Graph Engine
- **Engine**: NetworkX 3.x directed multigraphs (`nx.MultiDiGraph` and `nx.DiGraph`).
- **Capabilities**:
  - BFS traversal from seed target addresses with hop depth limits.
  - Direct calculation of clustering coefficients, centralities, and peeling structures.
  - Synthetic test fixtures modeling real-world cross-rail peeling patterns.

---

## 7. External Adapters
- **Current Status**: All external rail connections are **synthetic mock adapters**:
  - Blockchain: Mock archive node transaction generator.
  - UPI: `MockUPIAdapter` simulating NPCI clearing feeds.
  - VASP: Curated internal test registry of exchange clusters.
  - SAHYOG: Simulated sandbox envelope dispatch.
- **Safety**: No live external banking or blockchain network integrations exist.

---

## 8. Current Data Flow
```
[User Browser]
       │ (Currently interacts directly with in-memory fixtures)
       ▼
[React Frontend] (Port 3000 / 5173)

────────────────────── Planned HTTP Integration Boundary ──────────────────────

[React Frontend]
       │ (HTTP JSON API + JWT Authorization)
       ▼
[Node.js / Express API Gateway] (Port 5000)
       ├── [PostgreSQL] (Port 5432) — Cases, Users, Transactions, Evidence
       │
       └── (HTTP REST Calls)
             ▼
       [FastAPI Intelligence Engine] (Port 8000)
             ├── NetworkX Graph Engine
             ├── UPI Behavioral Analysis
             └── Geospatial Anomaly Detection
```

---

## 9. Current API Flow
1. **Authentication**: `POST /api/auth/login` verifies user against database `users` table via `bcryptjs`, returning a signed JWT.
2. **Case Retrieval**: `GET /api/cases` fetches assigned cases from PostgreSQL `cases` table.
3. **Investigation Run**:
   - `POST /api/cases/:id/analyze` calls `intelligenceService.analyzeWallet()`.
   - Node dispatches `POST /api/v1/analyze-wallet` to Python engine.
   - Python constructs graph, computes risk score, returns canonical `AnalysisResult`.
   - Node stores results in `analysis_results`, `risk_results`, `risk_signals`, and `evidence` tables.
4. **Unified Investigation**:
   - `POST /api/investigations` dispatches multi-rail scenario payloads to Python `POST /api/v1/investigations`.
   - Result is logged to PostgreSQL `audit_logs`.

---

## 10. Missing Integration Points
1. **Frontend-to-Backend HTTP Client**: Frontend currently lacks an API client layer (e.g. `apiClient.ts`) to query `/api/cases`, `/api/transactions`, `/api/auth`, etc.
2. **Transaction Persistence API**: Backend lacks dedicated CRUD endpoints (`/api/transactions`) to stream or query raw multi-rail ledger entries directly.
3. **Live Sync Between UI State and Case State**: Case status changes in UI do not persist back to `cases` table.
4. **VASP and Disclosure Specific Endpoints**: Detailed disclosure request status updates are limited to `POST /api/cases/:id/disclosure-request`; GET/PUT registry endpoints are missing.

---

## 11. Risks / Technical Debt
- **Frontend Isolation**: Frontend is decoupled from backend state; testing end-to-end user workflows requires carefully introducing an API layer without altering frontend layouts or design.
- **Database Table Scope**: `transactions` table in PostgreSQL currently only stores cryptocurrency-specific columns (`from_address`, `to_address`, `asset`, `blockchain`); UPI fields (`sender_vpa`, `receiver_vpa`, `utr`, `rail`) are stored inside `metadata JSONB` rather than first-class columns.
- **In-Memory Registry in Python**: `INVESTIGATION_REGISTRY` in `app/api/routes/investigations.py` stores results in a Python process memory dictionary rather than persisting them directly to PostgreSQL.

---

## 12. Recommended Integration Boundary
- **Node / Express**: Single point of ingress for client traffic, authentication, relational persistence, and transactional audit trails.
- **Python / FastAPI**: Pure compute service strictly consumed by Node.js backend; never exposed directly to public frontend clients.
- **PostgreSQL**: Authoritative state store for all cases, investigations, evidentiary records, and user sessions.
- **React**: Presentation and visualization only.
