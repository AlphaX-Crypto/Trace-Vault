# TRACEVAULT V2 — SYSTEM ARCHITECTURE & DESIGN

## 1. High-Level Architectural Flow

TRACEVAULT V2 is organized as a layered, decoupled system with strict boundary separation:

```
[ React / Vite Frontend ]
           │
           │ HTTP / REST (JWT Bearer, Correlation ID)
           ▼
[ Node.js / Express Backend (Application & Security Gateway) ]
    ├─ Ingress Security: Helmet, Rate Limiters, Input Scanning
    ├─ Identity: JWT Verification, RBAC Enforcement
    ├─ Case Authorization: case_members Membership Verification
    ├─ Audit: Append-only Application Audit Trail
    │
    ├──▶ [ PostgreSQL Persistence Layer ]
    │      - Cases, Entities, Wallets, Transactions
    │      - Analysis Results, Risk Scores, Risk Signals
    │      - Evidence Records, Dossiers, Disclosure Requests
    │      - Users, Roles, Audit Logs
    │
    └──▶ [ Python FastAPI Intelligence Engine ]
           │
           ▼
         [ Transaction Normalization Layer ]
           │
           ▼
         [ NetworkX Graph Engine (DiGraph Construction & BFS) ]
           │
           ▼
         [ PathFinder & Structured TracePath Identification ]
           │
           ▼
         [ Explainable VASP Attribution Engine ]
           │
           ▼
         [ Multi-Factor Risk Assessment & Confidence Scoring ]
           │
           ▼
         [ Canonical AnalysisResult Contract ]
```

---

## 2. Component Responsibilities & Constraints

### 1. React / Vite Frontend
- **Responsibilities**: Investigator workspace, interactive DAG transaction graph visualization, evidence tables, dossier generation, Section 91 CrPC requisition form preparation.
- **Security Constraints**:
  - Zero direct database access; all interactions mediated via Express REST API.
  - JWT tokens handled via centralized `AuthContext` with automatic Bearer injection and 401 handling.
  - No secrets, private keys, or internal hostnames rendered or stored.

### 2. Node.js / Express Backend
- **Responsibilities**: Application orchestration, session lifecycle, RBAC enforcement, case authorization, input sanitization, PostgreSQL persistence, SAHYOG sandbox disclosure requisition workflows.
- **Security Constraints**:
  - Parameterized queries across all database repositories.
  - Strict input scanning blocking cryptocurrency private keys and mnemonic seed phrases.
  - Request rate limiting per IP across authentication, analysis, disclosures, and general API endpoints.
  - Request correlation IDs (`X-Request-ID`) tracked across all operations.

### 3. PostgreSQL Database
- **Responsibilities**: Authoritative relational persistence for investigation casework, audit trails, and user management.
- **Constraints**:
  - Relational integrity enforced via foreign keys, unique constraints, and check constraints.
  - Append-only audit trail logging user actions, unauthorized attempts, and forensic events.

### 4. Python FastAPI Intelligence Engine
- **Responsibilities**: Blockchain transaction normalization, NetworkX directed graph modeling, multi-hop pathfinding, heuristic VASP attribution, explainable attribution evidence generation, and risk scoring.
- **Constraints**:
  - Stateless analytical service; returns canonical `AnalysisResult` contract.
  - Internal NetworkX algorithms isolated from HTTP client concerns.

