# TRACEVAULT — SPRINT 15 REPORT
## VASP Attribution + Geospatial Intelligence Integration

**Date:** 2026-10-04  
**Sprint Status:** COMPLETE & VERIFIED  
**Architecture Layer:** Node.js/Express API Gateway $\leftrightarrow$ Python/FastAPI Intelligence Layer $\leftrightarrow$ React Frontend  

---

### 1. Executive Summary

Sprint 15 connects the persisted PostgreSQL normalized case transaction pipeline to the existing **VASP Attribution Engine** and **Geospatial Intelligence Engine**, then surfaces the live analytical findings into the approved and locked **VASP Attribution Workspace** and **Geospatial Workspace**.

All objectives and constraints have been achieved:
- **No Claims of Legal Ownership or Identity:** A graph relationship or target address cluster match is strictly characterized as a *"Candidate VASP Association"* or *"Potential VASP Association"*. The system never asserts ownership or control.
- **No Physical Presence Claims:** Location signals are treated as investigative data points with explicit source confidence ratings. Anomalies are labeled *"Location Inconsistency"* or *"Unusual Location Pattern"*, never implying real-time GPS tracking or personal physical travel.
- **Strict Observed vs Derived Semantics:** Observed facts (transactions, amounts, timestamps, coordinates) are labeled `OBSERVED`, while analytical conclusions (attributions, candidate confidence, findings) are labeled `DERIVED`.
- **Datasource Transparency:** Both workspaces display explicit multi-state datasource indicator badges (`● LIVE BACKEND`, `○ DEMO / SYNTHETIC`, `✕ BACKEND OFFLINE (FIXTURE)`).
- **Multi-Rail Partitioning:** UPI domestic transactions are strictly filtered out from VASP blockchain attribution.

---

### 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Frontend["React Frontend (Workspaces Locked)"]
        VASP_UI["VASP Attribution Workspace"]
        GEO_UI["Geospatial Workspace"]
    end

    subgraph NodeGateway["Node.js / Express API Gateway (Port 5000)"]
        AuthMiddleware["requireAuth + requireCaseAccess + requirePermission"]
        SecScanner["checkProhibitedCredentials (No PIN/OTP/Keys)"]
        CasesRouter["/api/cases/:id/vasp and /api/cases/:id/geospatial"]
        AnalysisCtrl["analysisController.js (Filters UPI from VASP, Extracts Geo Signals)"]
        TxRepo["transactionRepository.js (Limit 100 txs)"]
        AuditRepo["auditRepository.js (Audit Trail Log)"]
        IntelService["intelligenceService.js (HTTP / Axios Client)"]
    end

    subgraph Database["PostgreSQL Persistence"]
        PG[(Normalized Transactions Table)]
        AuditLog[(audit_logs Table)]
    end

    subgraph PythonLayer["Python / FastAPI Intelligence Layer (Port 8000)"]
        VASPEndpoint["POST /api/v1/cases/vasp-analyze"]
        GEOEndpoint["POST /api/v1/cases/geospatial-analyze"]
        VaspIdentifier["VaspIdentifier + VaspRegistry + BFSTraverser"]
        GeoEngine["GeospatialIntelligenceEngine + Rules"]
    end

    VASP_UI -->|POST /api/cases/:id/vasp/analyze| CasesRouter
    GEO_UI -->|POST /api/cases/:id/geospatial/analyze| CasesRouter
    CasesRouter --> AuthMiddleware --> SecScanner --> AnalysisCtrl
    AnalysisCtrl --> TxRepo --> PG
    AnalysisCtrl --> IntelService
    IntelService -->|HTTP POST Payload (blockchain txs only)| VASPEndpoint
    IntelService -->|HTTP POST Payload (location signals)| GEOEndpoint
    VASPEndpoint --> VaspIdentifier
    GEOEndpoint --> GeoEngine
    VaspIdentifier --> IntelService
    GeoEngine --> IntelService
    IntelService --> AnalysisCtrl
    AnalysisCtrl --> AuditRepo --> AuditLog
    AnalysisCtrl --> VASP_UI
    AnalysisCtrl --> GEO_UI
```

---

### 3. VASP Backend & Intelligence Contract

#### Endpoints
- **POST `/api/cases/:id/vasp/analyze`**
  - **Auth & Permissions:** `requireAuth`, `validateCaseId`, `requireCaseAccess`, `requirePermission(PERMISSIONS.ANALYSIS_VIEW)`
  - **Payload:** `{ "subject": "0x71F9A...", "max_hops": 5 }`
  - **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "case_id": "CASE-2026-001",
        "subject": "0x71f9a6809403de4b07b4f114b5c1089b0a124982",
        "candidates": [
          {
            "vasp_id": "vasp-a",
            "name": "Example Exchange",
            "legal_entity": "Example Exchange Deposit Wallet",
            "entity_type": "DEPOSIT_WALLET",
            "association_confidence": 0.8,
            "confidence_percent": 80.0,
            "confidence_label": "HIGH",
            "hop_distance": 1,
            "target_address": "0xexchange_deposit",
            "path_sequence": ["0x71f9a680...", "0xexchange_deposit"],
            "indicators": [
              {
                "type": "ADDRESS_MATCH",
                "description": "Target address '0xexchange_deposit' matches registry record for 'Example Exchange' (DEPOSIT_WALLET).",
                "observed_or_derived": "DERIVED"
              },
              {
                "type": "GRAPH_RELATIONSHIP",
                "description": "Directed path distance: 1 hop(s) from subject wallet. Topological proximity rating: HIGH.",
                "observed_or_derived": "DERIVED"
              },
              {
                "type": "TRANSACTION_PATH",
                "description": "Transfer flow path: 0x71f9a680... -> 0xexchange_deposit.",
                "observed_or_derived": "DERIVED"
              }
            ],
            "supporting_transaction_ids": ["0xhash_crypto_s15_001"],
            "disclaimer": "Potential VASP association derived from available transaction and attribution indicators. Real-world legal attribution requires authorized disclosure."
          }
        ],
        "metadata": {
          "engine": "TRACEVAULT NetworkX VaspIdentifier",
          "generated_at": "2026-10-04T17:35:49.757Z",
          "data_source": "DEMO / SYNTHETIC DATA"
        }
      }
    }
    ```
- **GET `/api/cases/:id/vasp`**
  - Convenience read endpoint returning candidate VASP attributions for the case.

---

### 4. Geospatial Backend & Intelligence Contract

#### Endpoints
- **POST `/api/cases/:id/geospatial/analyze`**
  - **Auth & Permissions:** `requireAuth`, `validateCaseId`, `requireCaseAccess`, `requirePermission(PERMISSIONS.ANALYSIS_VIEW)`
  - **Payload:** `{ "subject": "vpa@bank", "location_signals": [...] }` (or automatically extracted from case transactions)
  - **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "case_id": "CASE-2026-001",
        "subject": "0x71f9a6809403de4b07b4f114b5c1089b0a124982",
        "findings": [
          {
            "id": "GEO-FND-001",
            "type": "LOCATION_INCONSISTENCY",
            "signal_type": "IMPOSSIBLE_TRAVEL_SEQUENCE",
            "name": "Implied Relocation Velocity Anomaly",
            "severity": "HIGH",
            "confidence": 0.88,
            "description": "Relocation speed between Bengaluru and Mumbai observations exceeds physical limits.",
            "supporting_transaction_ids": ["TX-UPI-001", "TX-UPI-005"],
            "supporting_location_signal_ids": ["GEO-TEST-01", "GEO-TEST-02"],
            "metrics": { "implied_speed_kmh": 13420 },
            "observed_or_derived": "DERIVED"
          }
        ],
        "location_signals": [
          {
            "id": "GEO-TEST-01",
            "timestamp": "2026-10-04T12:00:00Z",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "accuracy_meters": 30.0,
            "city": "Bengaluru",
            "source": "DEMO / SYNTHETIC",
            "observed_or_derived": "OBSERVED"
          }
        ],
        "disclaimer": "Location signals represent analytical correlation data points, not proof of personal physical presence, identity, or device ownership.",
        "metadata": {
          "engine": "TRACEVAULT GeospatialIntelligenceEngine",
          "generated_at": "2026-10-04T17:35:49.906Z",
          "data_source": "DEMO / SYNTHETIC DATA"
        }
      }
    }
    ```
- **GET `/api/cases/:id/geospatial`**
  - Convenience read endpoint returning location consistency findings for the case.

---

### 5. Frontend Workspaces Integration

1. **VASP Attribution Workspace ([`VASPAttributionWorkspace.tsx`](file:///c:/Users/Samarth/OneDrive/Desktop/SIH26182/Trace-Vault/frontend/src/features/attribution/VASPAttributionWorkspace.tsx)):**
   - Automatically queries `POST /api/cases/CASE-2026-001/vasp/analyze` on mount and re-run.
   - Preserves approved layout, sidebar candidate list, association basis cards, and inspector panels.
   - Header title pill dynamically reflects data source state (`● LIVE BACKEND`, `○ DEMO / SYNTHETIC`, `✕ BACKEND OFFLINE (FIXTURE)`).
2. **Geospatial Workspace ([`GeospatialWorkspace.tsx`](file:///c:/Users/Samarth/OneDrive/Desktop/SIH26182/Trace-Vault/frontend/src/features/geospatial/GeospatialWorkspace.tsx)):**
   - Automatically queries `POST /api/cases/CASE-2026-001/geospatial/analyze` on mount and re-run.
   - Preserves interactive map container, signal schedule list, and geographic consistency panels.
   - Header title pill dynamically reflects data source state (`● LIVE BACKEND`, `○ DEMO / SYNTHETIC`, `✕ BACKEND OFFLINE (FIXTURE)`).

---

### 6. Security, Boundaries & Neutrality

1. **Case Isolation & Auth Guards:**
   - All requests require a valid JWT bearer token and assignment to the case (`requireAuth`, `requireCaseAccess`).
   - Non-existent cases return 404; unauthorized investigators return 403.
2. **Rejection of Authentication Credentials:**
   - Any payload containing sensitive keys (`upi_pin`, `pin`, `mpin`, `otp`, `password`, `seed_phrase`, `private_key`) is rejected with HTTP 400.
3. **Forensic Terminology Standards:**
   - Strictly enforces neutral wording: *"Candidate VASP Association"*, *"Potential VASP Association"*, *"Attribution Indicator"*, *"Location Signal"*, *"Location Inconsistency"*.
   - Prohibits: *"wallet owner"*, *"belongs to"*, *"confirmed VASP ownership"*, *"real-time GPS"*, *"physical presence"*, *"mule"*, *"fraudster"*.
4. **Audit Logging:**
   - Application audit log events `VASP_ATTRIBUTION_GENERATED` and `GEOSPATIAL_ANALYSIS_GENERATED` are recorded in PostgreSQL.

---

### 7. Test Results & Verification Summary

| Test Suite | Scope | Total Tests | Result |
| :--- | :--- | :---: | :---: |
| **Python Pytest Suite** | Starlette routes, VASP identifier, credential rejection, geo rules, empty inputs | 217 | **217 Passed (100%)** |
| **Node.js Sprint 15 Tests** | Auth, 403, 404, 502, VASP isolation, UPI exclusion, Geo isolation, contracts | 15 | **15 Passed (100%)** |
| **Node.js Full Test Suite** | 31 test suites across repositories, controllers, adapters, normalization | 134 | **134 Passed (100%)** |
| **Database Health Check** | 18 migrations, seeds, foreign keys, transaction rollback (`validate_db.js`) | 5/5 Stages | **Healthy & Verified** |
| **Frontend Production Build** | TypeScript compiler (`tsc`) & Vite production bundler | 57 Modules | **Build Clean** |

---

### 8. Known Limitations

1. **Attribution is Graph Proximity, Not Legal Ownership:**
   - Candidate associations provide investigative prioritization based on transaction paths and known address registries. Legal ownership requires formal disclosure through authorized channels.
2. **Location Signals are Analytical Corroborations, Not Physical Truth:**
   - Location signals represent sensor and provider observations. They do not prove personal physical presence, device ownership, or identity.
3. **Synthetic / Demo Data Only:**
   - All registries and coordinates are synthetic. TRACEVAULT connects to demo adapters and does not connect to live exchanges, NPCI, or telecom networks.

---

### 9. Files Changed

- `intelligence-engine/app/api/routes/analysis.py`
- `intelligence-engine/tests/unit/test_sprint15_vasp_geo.py`
- `backend/src/services/intelligenceService.js`
- `backend/src/controllers/analysisController.js`
- `backend/src/routes/cases.js`
- `backend/tests/sprint15_vasp_geo_integration.test.js`
- `frontend/src/features/attribution/VASPAttributionWorkspace.tsx`
- `frontend/src/features/geospatial/GeospatialWorkspace.tsx`
- `docs/SPRINT_15_REPORT.md`
