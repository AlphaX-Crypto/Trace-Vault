# TRACEVAULT — SPRINT 13 REPORT
## Graph Intelligence & NetworkX Integration

**Status:** APPROVED & VERIFIED  
**Date:** October 4, 2026  
**Module:** Graph Intelligence Engine (PostgreSQL $\rightarrow$ Node.js Gateway $\rightarrow$ Python FastAPI $\rightarrow$ NetworkX MultiDiGraph $\rightarrow$ Trace Graph React Workspace)  
**Security & Access Tier:** Authenticated (Investigator / Supervisor / Admin with Case Access Verification)

---

### 1. Executive Summary
Sprint 13 establishes the operational integration between TRACEVAULT's persistent normalized transaction repository and the Python NetworkX multigraph intelligence engine. Previously, the Trace Graph workspace relied on isolated frontend fixtures. Through Sprint 13, graph topologies are deterministically synthesized at query time directly from PostgreSQL-persisted normalized transactions without maintaining a persistent, high-overhead graph database. Both cryptocurrency transactions (Ethereum/Tron) and domestic UPI transfers are seamlessly integrated into unified multigraph structures with configurable hop-depth limits (1–10) and directional filters (`outgoing`, `incoming`, `both`).

---

### 2. Sprint Scope & Objectives
- **Connect Live Persistence to Intelligence Engine:** Connect PostgreSQL normalized transactions to the Python FastAPI NetworkX intelligence engine through the Node.js/Express gateway.
- **Dynamic Analysis-Time Graph Synthesis:** Compute in-memory NetworkX `MultiDiGraph` traversals dynamically upon request, ensuring no state drift and maintaining database as single source of truth.
- **Multi-Rail MultiDiGraph Traversal:** Support both crypto blockchain transfers and domestic UPI financial flows in a unified forensic graph.
- **Enforce Traversal Safeguards:** Provide strict hop depth limits (1–10) and directional traversal constraints (`outgoing`, `incoming`, `both`).
- **Surface Explicit Data Source States:** Inform investigators transparently whether displayed data stems from `● LIVE BACKEND`, `○ DEMO / SYNTHETIC`, or `✕ BACKEND OFFLINE (FIXTURE)` without deceptive silent fallbacks.
- **Maintain Locked UI Layouts:** Preserve the approved, visually validated design system of the Trace Graph workspace with zero cosmetic layout regressions.

---

### 3. Architecture Overview

```
                      +-----------------------------------+
                      |   React Trace Graph Workspace     |
                      |   (Features/graph/GraphWorkspace) |
                      +-----------------+-----------------+
                                        |
                 POST /api/cases/:id/graph/analyze (JWT Auth)
                                        |
                                        v
                      +-----------------------------------+
                      |     Node.js / Express Gateway     |
                      |   - Auth & Case Access Guard      |
                      |   - Case Transaction Fetch        |
                      +--------+-----------------+--------+
                               |                 |
     SELECT * FROM transactions|                 | POST /api/v1/cases/graph-analyze
                               v                 v
                 +-------------------+     +-----------------------------------+
                 | PostgreSQL        |     | Python FastAPI Intelligence       |
                 | (Normalized Txs)  |     | - UnifiedInvestigationEngine      |
                 +-------------------+     | - UPIGraphAdapter / CryptoAdapter |
                                           | - NetworkX MultiDiGraph (BFS)     |
                                           +-----------------------------------+
```

---

### 4. Python Intelligence Engine Integration
A dedicated graph analysis endpoint was introduced in [`intelligence-engine/app/api/routes/analysis.py`](file:///c:/Users/Samarth/OneDrive/Desktop/SIH26182/Trace-Vault/intelligence-engine/app/api/routes/analysis.py):
- **Endpoint:** `POST /api/v1/cases/graph-analyze`
- **Request Model:** `CaseGraphAnalyzeRequest` (case_id, subject, max_hops [1–10], direction, rail_filter, transactions)
- **Engine Workload:**
  - Partitions transactions by rail (`UPI` vs. `CRYPTO`)
  - Dispatches to `UnifiedInvestigationEngine`
  - Utilizes `UPIGraphAdapter` and `CryptoGraphAdapter`
  - Instantiates in-memory NetworkX `MultiDiGraph`
  - Executes deterministic bounded breadth-first search (BFS)
  - Serializes nodes, edges, and paths via `UnifiedGraphSerializer`

---

### 5. Backend Route & Controller Layer
Implemented in [`backend/src/controllers/analysisController.js`](file:///c:/Users/Samarth/OneDrive/Desktop/SIH26182/Trace-Vault/backend/src/controllers/analysisController.js) and mounted in [`backend/src/routes/cases.js`](file:///c:/Users/Samarth/OneDrive/Desktop/SIH26182/Trace-Vault/backend/src/routes/cases.js):
- `POST /api/cases/:id/graph/analyze`
- `GET /api/cases/:id/graph` (convenience endpoint forwarding query params)
- **Middlewares Applied:**
  1. `requireAuth`: Verifies JWT bearer token.
  2. `validateCaseId`: Verifies case identifier format.
  3. `requireCaseAccess`: Ensures requesting investigator is assigned to the case or holds supervisory authority.
  4. `requirePermission(PERMISSIONS.ANALYSIS_VIEW)`: Enforces RBAC permissions.

---

### 6. Database & Persistence Flow
1. Case existence is verified against the `cases` table.
2. Transactions associated with the case are queried via `transactionRepository.getTransactionsByCaseId(id, { limit: 100, rail: rail_filter })`.
3. Candidate transactions match either explicit `metadata->>'case_id'`, evidence association, or endpoint matching with `subject_identifier`.
4. Transactions are transferred over high-speed loopback HTTP to Python FastAPI.
5. Traversal results are logged to `audit_logs` with action `GRAPH_ANALYSIS_GENERATED`.

---

### 7. Multi-Rail Graph Construction
The engine supports heterogeneous financial rails simultaneously:
- **Crypto Rail:** Nodes represent wallet addresses or contract addresses; edges represent blockchain transactions with attributes `amount`, `asset` (e.g., ETH, USDT), `block_number`, and `transaction_hash`.
- **UPI Rail:** Nodes represent Virtual Payment Addresses (VPAs) or merchant accounts; edges represent UPI transactions with attributes `amount`, `asset` (INR), `transaction_type` (P2P/P2M), and reference numbers/UTRs.
- Inter-rail hops identify cross-rail off-ramping, on-ramping, or peeling sequences cleanly.

---

### 8. Hop-Depth & Directional Traversal
- **Hop Depth Limit:** Bounded strictly between 1 and 10 hops (default 4). Requests outside this range are rejected with HTTP 400 (`INVALID_HOP_DEPTH`).
- **Directional Filtering:**
  - `outgoing`: Only traces subsequent dispersal of funds outward from the subject.
  - `incoming`: Only traces prior source of funds inward to the subject.
  - `both`: Bidirectional full-cluster context.

---

### 9. Graph Analysis DTO Schema
```json
{
  "case_id": "CASE-2026-001",
  "subject": "0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
  "max_hops": 4,
  "direction": "both",
  "node_count": 8,
  "edge_count": 9,
  "nodes": [
    {
      "node_id": "0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
      "entity_type": "WALLET",
      "rail": "CRYPTO",
      "risk_level": "HIGH",
      "risk_score": 85.0
    }
  ],
  "edges": [
    {
      "source": "0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
      "target": "0x84C2EF17BD0038Fe942dF4426511aF890987e109",
      "amount": 42.5,
      "rail": "CRYPTO"
    }
  ],
  "paths": [],
  "metadata": {
    "engine": "NetworkX MultiDiGraph",
    "traversal": "deterministic_bfs",
    "max_depth_enforced": 4
  }
}
```

---

### 10. Frontend Trace Graph Integration
Integrated in [`frontend/src/features/graph/GraphWorkspace.tsx`](file:///c:/Users/Samarth/OneDrive/Desktop/SIH26182/Trace-Vault/frontend/src/features/graph/GraphWorkspace.tsx):
- Invokes `api.post('/api/cases/CASE-2026-001/graph/analyze', ...)` on mount and upon control updates (hop depth / direction).
- Updates entity state dynamically while preserving approved canvas SVG geometry and node slots.
- Inspector drawer reflects live telemetry when selecting any entity node.
- Preserves 100% of the locked UI styling, tokens, and layouts.

---

### 11. Data Source Indicators
Beside the **Trace Graph** header title, a live status pill is rendered:
- `● LIVE BACKEND`: Rendered in emerald green (`#ECFDF5` background, `#047857` text, `#A7F3D0` border) when connected to active PostgreSQL and FastAPI intelligence services.
- `○ DEMO / SYNTHETIC`: Rendered in slate gray (`#F1F5F9` background, `#475569` text, `#CBD5E1` border) when in demonstration mode.
- `✕ BACKEND OFFLINE (FIXTURE)`: Rendered in rose red (`#FEF2F2` background, `#B91C1C` text, `#FECACA` border) when the backend gateway is offline.

---

### 12. Security, RBAC & Case Isolation
- **Authentication:** All graph requests mandate valid JWT tokens signed by TRACEVAULT authorization service. Unauthenticated requests are rejected with HTTP 401 (`UNAUTHENTICATED`).
- **Authorization:** Only assigned investigators, supervisors, or administrators can generate graph traversals for a given case. Unassigned investigators are rejected with HTTP 403 (`FORBIDDEN`).
- **Auditing:** Every graph analysis invocation generates an immutable record in `audit_logs` tracking user ID, case ID, node count, edge count, and traversal parameters.

---

### 13. Neutral & Forensically Defensible Terminology
In adherence with judicial and evidential standards, all system labels and logs use neutral, forensically defensible terminology:
- `Subject Wallet` (never "fraudster" or "criminal")
- `Intermediary Node` (never "mule")
- `Potential VASP Association` (never "confirmed guilty exchange")
- `Possible Mixer Indicator` (never "guaranteed laundry")
- `Associated Entity` (never "accomplice")

---

### 14. Test Verification: Python FastAPI Layer
- Executed via `.venv\Scripts\python.exe -m pytest` in `intelligence-engine/`.
- **Result:** **203 of 203 unit tests passed (100%)** in 17.31 seconds.
- Test suites verified: `test_phase15_unified_graph.py`, `test_phase16_investigation_orchestration.py`, `test_ethereum_pipeline.py`, `test_phase12_upi_foundation.py`, `test_phase13_upi_fraud_intelligence.py`, `test_phase2_networkx_pipeline.py`, etc.

---

### 15. Test Verification: Node.js / Express Backend Layer
- Executed via `npm test` in `backend/`.
- **Result:** **105 of 105 tests passed across 29 test suites (100%)** in 11.15 seconds.
- Includes comprehensive integration suite [`backend/tests/sprint13_graph_intelligence.test.js`](file:///c:/Users/Samarth/OneDrive/Desktop/SIH26182/Trace-Vault/backend/tests/sprint13_graph_intelligence.test.js):
  - 401 Unauthenticated rejection
  - 403 Unauthorized case access rejection
  - 404 Non-existent case rejection
  - 400 Invalid hop depth validation (< 1 or > 10)
  - 200 Successful multi-rail graph analysis
  - Directional filtering (`outgoing`, `incoming`, `both`)
  - Empty case graceful handling
  - GET convenience endpoint verification

---

### 16. Test Verification: Database Integrity
- Executed via `node database/scripts/validate_db.js`.
- **Result:** **100% Healthy & Verified**.
- 18 schema migrations applied and registered cleanly.
- Dev seeds applied cleanly.
- Atomic transaction and rollback mechanics verified.

---

### 17. Frontend Build & Static Analysis
- Executed via `npm run build` (`tsc && vite build`) in `frontend/`.
- **Result:** **Built in 3.36s with 0 errors**.
- 57 modules transformed cleanly.

---

### 18. Next Sprint Recommendations & Readiness
1. **Sprint 14 Target:** Integrate Risk Profile & Multi-Factor Scoring with PostgreSQL persisted cases and behavioral risk signals.
2. **Readiness:** The transaction ingestion engine (Sprint 12) and multigraph traversal engine (Sprint 13) now provide a robust foundation for automated risk signal detection and forensic scoring.
