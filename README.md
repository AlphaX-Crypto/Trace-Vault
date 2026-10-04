# TRACEVAULT

Automated Blockchain Intelligence & VASP Attribution Engine for cybercrime investigation support. Developed by team AlphaX-Crypto for Smart India Hackathon 2026.

## Purpose

TRACEVAULT is an investigative intelligence platform that supports cybercrime investigations by analyzing suspicious cryptocurrency wallet addresses. It traces fund movements, identifies associated VASPs/entities, and calculates explainable risk and confidence scores, providing actionable intelligence to law enforcement.

## High-Level Architecture

```text
LEA INVESTIGATOR
       |
       v
REACT FRONTEND
       |
       | REST/HTTP
       v
NODE.JS APPLICATION BACKEND
       |
       +--------------------+
       |                    |
       v                    v
POSTGRESQL DATABASE    PYTHON INTELLIGENCE ENGINE
                            |
                            v
                    TRANSACTION NORMALIZER
                            |
                            v
                    NETWORKX GRAPH ENGINE
                            |
                            v
                    VASP ATTRIBUTION ENGINE
                            |
                            v
                    RISK / CONFIDENCE ENGINE
                            |
                            v
                    BLOCKCHAIN DATA ADAPTERS
                            |
                            v
                 BLOCKCHAIN DATA PROVIDERS
```

## Repository Structure

```
Trace-Vault/
├── frontend/             # React/Vite application (Shiva)
├── backend/              # Node.js/Express API (Kushma)
├── intelligence-engine/  # Python/FastAPI intelligence service (Sam, Divija)
├── database/             # PostgreSQL schema and migrations (Ganesh)
├── docs/                 # Architecture and technical documentation (Rithwik)
├── tests/                # Integration and end-to-end tests (Rithwik)
└── scripts/              # Setup and development scripts
```

## Team Responsibilities

- **Shiva**: Frontend (React/Vite, UI/UX, Graph visualization)
- **Sam**: Core Intelligence (Python/FastAPI, Orchestration, Normalization, Risk/Confidence)
- **Divija + Sam**: Graph Intelligence (NetworkX, BFS traversal, Path finding)
- **Kushma**: Application Backend (Node.js, Auth, Case management, SAHYOG integration)
- **Ganesh**: Database (PostgreSQL, Schema, Migrations)
- **Rithwik**: QE + Documentation (Testing, Docs, Architecture docs)

## Technology Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Intelligence Engine**: Python, FastAPI, NetworkX
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Quickstart: Local Demonstration Setup

Run the full TRACEVAULT stack locally using the verified repository commands:

### 1. Prerequisites
- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 15+ (or use Docker / built-in `pg-mem` for testing)

### 2. Configure Environment
Copy `.env.example` to `.env` in the root repository:
```bash
cp .env.example .env
```

### 3. Start Infrastructure & Database
Using Docker Compose:
```bash
docker-compose up -d postgres
```
*Note: In development and test modes without Docker, the backend automatically initializes a high-fidelity in-memory PostgreSQL engine (`pg-mem`) with all 17 migrations and seed casework.*

To apply migrations manually to a live PostgreSQL instance:
```bash
# From database/ directory:
npm install
npm run migrate
npm run seed
```

### 4. Start Python Intelligence Engine
```bash
cd intelligence-engine
# Windows:
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Linux/macOS:
./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Health endpoint: `http://localhost:8000/health`

### 5. Start Node.js Application Backend
```bash
cd backend
npm install
npm run dev
```
Health endpoint: `http://localhost:5000/health` (Liveness) & `http://localhost:5000/health/ready` (Readiness)

### 6. Start React / Vite Frontend
```bash
cd frontend
npm install
npm run dev
```
Web Application: `http://localhost:5173`

---

## SIH Demonstration Accounts (DEV ONLY)

> [!WARNING] Development Accounts Only
> The following user accounts are pre-seeded strictly for local testing and Hackathon evaluation:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Investigator** | `investigator` | `Investigator@123` | Case intake, analysis execution, graph inspection, evidence review, report export |
| **Supervisor** | `supervisor` | `Supervisor@123` | All investigator capabilities + global case oversight, user assignment, disclosure review |
| **Administrator** | `admin` | `Admin@123` | Full system access, user administration, system-wide audit access |

---

## 17-Step Investigator Demonstration Workflow

1. **Sign In**: Navigate to `http://localhost:5173/login`. Click **Demo Investigator** (or enter `investigator` / `Investigator@123`).
2. **Dashboard**: View active cases, total tracked funds, and system status metrics.
3. **Case Registry**: Navigate to **Cases** (`/cases`) to view active investigations.
4. **Intake New Case**: Click **New Case** (`/cases/new`), enter a title (e.g. `Operation Cybershield`), select currency `ETH`, and enter subject wallet `0x71c...d897`.
5. **Open Case Dossier**: Click into the case detail view.
6. **Trigger Graph Analysis**: Click **Run Analysis** to dispatch the transaction graph traversal to the Python NetworkX engine.
7. **Inspect Analysis Progress**: Observe multi-hop BFS traversing connected transactions.
8. **Forensic DAG Graph Canvas**: Switch to the **Transaction Graph** tab. Interact with nodes, intermediate hops, and exchange deposit addresses.
9. **Examine Node Inspector**: Click on suspect nodes or exchange clusters to view balance, transaction count, and cluster metadata.
10. **Explainable VASP Attribution**: Switch to the **Attribution & Risk** tab to review identified VASP associations (e.g. Binance, WazirX) and explainable evidence indicators.
11. **Multi-Factor Risk Assessment**: Inspect the calculated risk score (0–100) and forensic risk signal breakdown (rapid dispersion, peel chains).
12. **Forensic Evidence Chain**: Switch to the **Evidence** tab to inspect structured transaction proofs, timestamps, and verification hashes.
13. **Generate Case Report**: Switch to the **Report** tab to preview the comprehensive investigative dossier.
14. **Draft Section 91 CrPC Notice**: Click **Prepare Disclosure Request** to generate a pre-populated Section 91 CrPC legal requisition notice for the identified VASP.
15. **Verify Audit Trail**: All actions (login, case creation, analysis, evidence access, disclosure drafting) are logged in the append-only audit trail (`audit_logs`).
16. **Sign Out**: Click the **Sign Out** button in the sidebar to securely invalidate the JWT session token.
17. **Access Protection Verification**: Attempting to navigate directly to `/dashboard` or `/cases` without an active session automatically redirects back to `/login`.

---

## Verification & Test Suites

```bash
# Python Intelligence Engine tests (45 tests):
cd intelligence-engine
.\.venv\Scripts\pytest -q

# Node.js Application Backend tests (70 tests across 17 suites):
cd backend
npm test

# Frontend Production Build:
cd frontend
npm run build
```

## Security & Operational Documentation

- [Security Architecture & Production Hardening Guide](docs/SECURITY.md)
- [System Architecture & Design](docs/architecture/SYSTEM_DESIGN.md)
- [Component Specifications](docs/architecture/COMPONENTS.md)
- [End-to-End Data Flow](docs/architecture/DATA_FLOW.md)
- [Canonical API Contract](docs/api/API_CONTRACT.md)
- [Data Models Contract](docs/api/DATA_MODELS.md)