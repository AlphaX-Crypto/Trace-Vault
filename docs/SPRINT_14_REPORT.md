# TRACEVAULT — SPRINT 14 REPORT
## Risk & UPI Intelligence Integration

**Date:** 2026-10-04  
**Sprint Status:** COMPLETE & VERIFIED  
**Architecture Layer:** Node.js/Express API Gateway $\leftrightarrow$ Python/FastAPI Intelligence Layer $\leftrightarrow$ React Frontend  

---

### 1. Executive Summary

Sprint 14 connects the persisted PostgreSQL normalized transactions (established in Sprint 11 & 12) through the Node.js/Express API orchestration gateway into the Python/FastAPI intelligence engine to execute deterministic multi-factor risk evaluation and behavioral UPI flow pattern detection.

All operations enforce strict security boundaries, reject sensitive authentication credentials (`upi_pin`, `pin`, `mpin`, `otp`, `password`, `seed_phrase`, `private_key`) with HTTP 400, strictly maintain forensic neutrality in terminology, enforce explicit `observed_or_derived: 'DERIVED'` semantics on analytical conclusions, and display unambiguous datasource status badges (`● LIVE BACKEND`, `○ DEMO / SYNTHETIC`, `✕ BACKEND OFFLINE (FIXTURE)`).

---

### 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Frontend["React Frontend (Workspaces Locked)"]
        RA["Risk Analysis Workspace"]
        UF["UPI Fraud Workspace"]
    end

    subgraph NodeGateway["Node.js / Express API Gateway (Port 5000)"]
        AuthMiddleware["requireAuth + requireCaseAccess + requirePermission"]
        SecScanner["checkProhibitedCredentials (No PIN/OTP/Keys)"]
        CasesRouter["/api/cases/:id/risk and /api/cases/:id/upi"]
        AnalysisCtrl["analysisController.js"]
        TxRepo["transactionRepository.js (Limit 100 txs)"]
        AuditRepo["auditRepository.js (Audit Trail Log)"]
        IntelService["intelligenceService.js (HTTP / Axios Client)"]
    end

    subgraph Database["PostgreSQL Persistence"]
        PG[(Normalized Transactions Table)]
        AuditLog[(audit_logs Table)]
    end

    subgraph PythonLayer["Python / FastAPI Intelligence Layer (Port 8000)"]
        RiskEndpoint["POST /api/v1/cases/risk-analyze"]
        UPIEndpoint["POST /api/v1/cases/upi-analyze"]
        MultiFactorRule["Multi-Factor & Counterparty Risk Rules"]
        PassThroughRule["Rapid Pass-Through & Velocity Behavioral Rules"]
    end

    RA -->|POST /api/cases/:id/risk/analyze| CasesRouter
    UF -->|POST /api/cases/:id/upi/analyze| CasesRouter
    CasesRouter --> AuthMiddleware --> SecScanner --> AnalysisCtrl
    AnalysisCtrl --> TxRepo --> PG
    AnalysisCtrl --> IntelService
    IntelService -->|HTTP POST Payload (txs <= 100)| RiskEndpoint
    IntelService -->|HTTP POST Payload (UPI rail only)| UPIEndpoint
    RiskEndpoint --> MultiFactorRule
    UPIEndpoint --> PassThroughRule
    MultiFactorRule --> IntelService
    PassThroughRule --> IntelService
    IntelService --> AnalysisCtrl
    AnalysisCtrl --> AuditRepo --> AuditLog
    AnalysisCtrl --> RA
    AnalysisCtrl --> UF
```

---

### 3. API Endpoints & Request/Response Contracts

#### 3.1. Risk Analysis Endpoints
- **POST `/api/cases/:id/risk/analyze`**
  - **Auth & Permissions:** `requireAuth`, `requireCaseAccess`, `requirePermission(PERMISSIONS.ANALYSIS_RUN)`
  - **Body (Optional):** `{ "subject": "0x71F9A..." }`
  - **Validation:** Bounded payload, rejects prohibited credential fields.
  - **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "case_id": "CASE-2026-001",
        "subject": "0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        "overall_score": 72,
        "risk_level": "HIGH",
        "breakdown": {
          "counterparty_risk": 20,
          "structuring_pattern": 15,
          "velocity_anomaly": 20,
          "rail_risk": 17
        },
        "signals": [
          {
            "id": "SIG-RAPID-DISPERSION",
            "title": "Rapid Dispersion Pattern",
            "severity": "HIGH",
            "confidence": 0.92,
            "description": "42.50 ETH dispersed across 8 new addresses within 4 minutes of receipt.",
            "observed_or_derived": "DERIVED"
          }
        ],
        "summary": "Investigative risk assessment based on 4 explainable risk signals.",
        "transaction_count": 42
      }
    }
    ```
- **GET `/api/cases/:id/risk`**
  - Convenience read endpoint returning the latest derived risk analysis for the case.

#### 3.2. UPI Fraud Intelligence Endpoints
- **POST `/api/cases/:id/upi/analyze`**
  - **Auth & Permissions:** `requireAuth`, `requireCaseAccess`, `requirePermission(PERMISSIONS.ANALYSIS_RUN)`
  - **Body (Optional):** `{ "subject_vpa": "suspect@okaxis" }`
  - **Validation:** Bounded payload, rejects prohibited credential fields. Strictly isolates UPI transactions (`rail === 'upi'`). Crypto transactions never leak into UPI analysis.
  - **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "case_id": "CASE-2026-001",
        "subject_vpa": "suspect@okaxis",
        "risk_score": 84,
        "risk_level": "HIGH",
        "findings": [
          {
            "id": "FND-UPI-PASS-THROUGH",
            "pattern_type": "RAPID_PASS_THROUGH",
            "severity": "HIGH",
            "vpa": "suspect@okaxis",
            "confidence": 0.95,
            "description": "Inflow of ₹45,000.00 followed by rapid outflow of ₹44,500.00 within 2 minutes.",
            "supporting_utrs": ["UTR2026100401", "UTR2026100402"],
            "observed_or_derived": "DERIVED"
          }
        ],
        "temporal_window": {
          "window_minutes": 5,
          "inflow_count": 1,
          "outflow_count": 1
        },
        "monitored_vpas": ["suspect@okaxis", "destination_cashout@paytm"],
        "disclaimer": "DEMO / SYNTHETIC DATA. UPI routing observations are derived for investigative guidance only."
      }
    }
    ```
- **GET `/api/cases/:id/upi`**
  - Convenience read endpoint returning the latest derived UPI fraud analysis.

---

### 4. Forensic Neutrality & Terminology Rules

To maintain evidentiary and forensic defensibility:
1. **Neutral Naming:** All actors and identifiers are designated neutrally:
   - "Subject Wallet", "Subject VPA"
   - "Intermediary Account", "Peeling Node"
   - "Potential Pass-Through Pattern", "Risk Indicator"
2. **Prohibited Language:** The system explicitly avoids and forbids uncorroborated designations:
   - NEVER claims: "mule", "fraudster", "criminal", "belongs to", or "AI fraud detector".
3. **Data Classification:**
   - Raw transaction properties (e.g. amount, timestamp, UTR, hash, from/to) are labeled `OBSERVED`.
   - Risk indicators, pattern classifications, confidence scores, and findings are explicitly marked `observed_or_derived: 'DERIVED'`.

---

### 5. Security & Boundary Controls

1. **Rejection of Authentication Credentials:**
   - Scanning occurs both in the Express body middleware (`securityScanMiddleware`) and in `analysisController.js`.
   - Any payload containing `upi_pin`, `pin`, `mpin`, `otp`, `password`, `seed_phrase`, or `private_key` is immediately rejected with HTTP 400 (`PROHIBITED_CREDENTIAL_REJECTED` / `SECURITY_VIOLATION_PROHIBITED_FIELD`).
2. **Multi-Rail Partitioning:**
   - UPI transactions are uniquely identified by provider ID and UTR without requiring blockchain hashes.
   - Crypto transactions are strictly excluded from the UPI analysis pipeline.
3. **Transaction Processing Bounds:**
   - Case transaction queries for risk and UPI intelligence are capped at 100 transactions to prevent memory exhaustion and denial-of-service conditions.
4. **Audit Logging:**
   - Application events `RISK_ANALYSIS_GENERATED` and `UPI_ANALYSIS_GENERATED` are recorded in the PostgreSQL `audit_logs` table.

---

### 6. Verification & Test Execution Results

| Test Suite | Components Tested | Tests Run | Result |
| :--- | :--- | :---: | :---: |
| **Python Pytest** | Starlette routes, credential filtering, empty cases, rapid pass-through, multi-rail | 210 | **210 Passed (100%)** |
| **Node.js Integration** | Auth guards, case access, 400 pin rejection, 502 handling, risk & UPI live flows | 14 | **14 Passed (100%)** |
| **Node.js Total Suite** | All 30 test suites across repositories, controllers, adapters, normalization | 119 | **119 Passed (100%)** |
| **Database Check** | 18 migrations, dev seeds, foreign keys, rollback mechanics (`validate_db.js`) | 5/5 Stages | **Healthy & Verified** |
| **Frontend Build** | TypeScript compiler (`tsc`) and Vite production bundle | 57 Modules | **Build Successful** |

---

### 7. Limitations & Disclaimers

1. **Risk Scores are Investigative Support, Not Proof of Criminality:**
   - Calculated risk scores and confidence metrics provide algorithmic guidance to prioritize investigative leads. They do not constitute legal proof or judicial findings.
2. **VPAs are Routing Identifiers, Not Real-World Identities:**
   - Virtual Payment Addresses (VPAs) represent financial routing endpoints. They are not direct proof of real-world identity without authorized disclosure records.
3. **Synthetic / Demo Data Only:**
   - All test data and fixtures are synthetic. TRACEVAULT connects to demo/mock source adapters and does not connect to live NPCI or production banking networks.
