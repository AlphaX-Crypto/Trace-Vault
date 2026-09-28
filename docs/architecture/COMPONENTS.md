# TRACEVAULT V2 — COMPONENT SPECIFICATION

This document outlines the core modules, services, and repositories comprising TRACEVAULT V2.

---

## 1. Frontend Components (`frontend/src/`)

- **Routing & Authentication**:
  - `context/AuthContext.jsx`: Central session management, token caching, login, logout, and token refresh verification.
  - `components/auth/ProtectedRoute.jsx`: RBAC and session route guard.
  - `services/api.js`: Axios HTTP client with request interceptors for JWT Bearer injection and 401 redirection.
- **Investigation Workspace**:
  - `pages/Dashboard.jsx`: Portfolio overview, active case metrics, system health.
  - `pages/Cases.jsx`: Case registry table with status badges and search/filtering.
  - `pages/CaseDetail.jsx`: Tabbed investigation view (Overview, Graph, Attribution, Evidence, Report).
  - `pages/NewCase.jsx`: Intake form for wallet address, suspect, blockchain, and case metadata.
- **Forensic Graph Visualization**:
  - `components/graph/TransactionGraph.jsx`: Interactive Cytoscape/DAG canvas for transaction hops, exchange deposit nodes, and clustering.
  - `components/graph/NodeInspector.jsx`: Detail pane for wallet balances, transaction counts, and attribution reasoning.
- **Forensic Dossier & Disclosure**:
  - `pages/Reports.jsx`: Summary dossier generator with printable view and PDF export readiness.
  - `components/report/DisclosureAction.jsx`: Section 91 CrPC notice drafting modal.

---

## 2. Backend Modules (`backend/src/`)

- **Security & Middleware**:
  - `middleware/auth.js`: JWT token validation (`requireAuth`), RBAC permission checks (`requirePermission`), case access verification (`requireCaseAccess`).
  - `middleware/rateLimiter.js`: Tiered IP rate limiters for login, analysis, disclosures, and general API.
  - `middleware/validation.js`: Private key (64-char hex) and seed phrase scanner (`securityScanMiddleware`).
  - `middleware/requestCorrelation.js`: `X-Request-ID` generation and request duration logging.
  - `middleware/errorHandler.js`: Sanitized error responses without internal stack trace leakage.
- **Controllers & Routing**:
  - `routes/auth.js` / `controllers/authController.js`: `/login`, `/logout`, `/me`, `/users`.
  - `routes/cases.js` / `controllers/caseController.js`: CRUD casework, team assignment, Section 91 drafting.
  - `controllers/analysisController.js`: Graph analysis dispatch, attribution inspection, evidence retrieval.
  - `routes/health.js`: Liveness, readiness, database, and intelligence component health checks.
- **Service Layer**:
  - `services/authService.js`: Bcrypt hashing, JWT generation, revocation registry, profile retrieval.
  - `services/caseService.js`: Case business logic, user scoping, SAHYOG disclosure generation.
  - `services/intelligenceService.js`: HTTP client to Python FastAPI, canonical schema validation.
- **Data Repositories**:
  - `repositories/userRepository.js`: User profiles, role lookups, last login tracking.
  - `repositories/caseRepository.js`: Cases, case memberships (`case_members`).
  - `repositories/analysisRepository.js`: Analysis results, risk scores, risk signals, entities.
  - `repositories/evidenceRepository.js`: Forensic evidence records.
  - `repositories/disclosureRepository.js`: Section 91 CrPC disclosure records.
  - `repositories/auditRepository.js`: Append-only audit trail logging with metadata sanitization.

---

## 3. Python Intelligence Engine (`intelligence-engine/app/`)

- **API & Routing**:
  - `main.py`: FastAPI application configuration, `/health` endpoint.
  - `api/routes/analysis.py`: `POST /api/v1/analyze-wallet`.
- **Normalization & Modeling**:
  - `models/transaction.py`: Canonical `NormalizedTransaction`, `TransactionInput`, `TransactionOutput`.
  - `models/entity.py`: `Entity`, `VASPCluster`, `AttributionEvidence`.
  - `models/analysis.py`: Canonical `AnalysisResult`, `TracePath`, `RiskEvaluation`.
- **Graph & Attribution Engine**:
  - `graph/graph_builder.py`: NetworkX directed graph (`DiGraph`) builder.
  - `graph/traverser.py`: Breadth-First Search (BFS) and multi-hop pathfinding.
  - `attribution/vasp_matcher.py`: Heuristic VASP cluster matching with explainable evidence trails.
  - `risk/risk_engine.py`: Multi-factor risk scoring based on path depth, hop count, and entity association.
