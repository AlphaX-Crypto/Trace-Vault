# TRACEVAULT V2 — SIH DEMONSTRATION & PRESENTATION RUNBOOK

**Problem Statement:** SIH26182 — Automated Blockchain Intelligence & VASP Attribution Engine  
**Team:** AlphaX-Crypto  
**Target Audience:** Smart India Hackathon Evaluation Jury & Law Enforcement Technical Observers  
**Target Duration:** 5 to 7 Minutes  

---

## 1. Executive Objective

Demonstrate an end-to-end, reproducible financial crime investigation workflow on TRACEVAULT V2:
1. **Case Ingestion**: Open active case `CASE-2026-001` (Ransomware extortion tracing).
2. **Graph Intelligence**: Execute multi-hop NetworkX traversal from an unhosted suspicious wallet (`A`).
3. **Attribution**: Identify downstream VASP association (`Example Exchange`) via on-chain deposit cluster heuristics.
4. **Risk & Evidence**: Evaluate multi-factor risk signals (layering, peel chains, mixer interaction) and inspect forensically preserved evidence.
5. **Dossier & Legal Requisition**: Export formal court dossier and draft a Section 91 CrPC legal disclosure requisition.
6. **Defense & Control**: Demonstrate operational security (RBAC, case-level authorization, append-only audit trail).

---

## 2. System Prerequisites & Environment

- **Node.js**: v20.x+
- **Python**: v3.11+
- **Database**: PostgreSQL 15+ (or automated in-memory `pg-mem` engine in development)
- **Ports Required**:
  - `5173`: React Frontend (Vite)
  - `5000`: Node.js / Express Backend
  - `8000`: Python FastAPI Intelligence Engine

---

## 3. Clean Environment Startup Sequence

Execute the commands in three separate terminal windows:

### Terminal 1: Python Intelligence Engine
```bash
cd intelligence-engine
# Windows (PowerShell):
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Linux / macOS:
./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health verification:* Navigate to `http://localhost:8000/health` → `{"status":"ok","service":"tracevault-intelligence","engine":"NetworkX v2.0"}`

### Terminal 2: Node.js Application Backend
```bash
cd backend
npm install
npm run dev
```
*Health verification:* Navigate to `http://localhost:5000/health/ready` → `{"status":"ready", ...}`

### Terminal 3: React / Vite Frontend
```bash
cd frontend
npm install
npm run dev
```
*Application ingress:* Navigate to `http://localhost:5173`

---

## 4. Demonstration Credentials (DEV ONLY)

> [!WARNING] Development Seed Accounts
> The following credentials are pre-seeded strictly for local Hackathon evaluation:

| Role | Username | Password | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Investigator** | `investigator` | `Investigator@123` | Case intake, analysis execution, graph inspection, evidence review, report export |
| **Supervisor** | `supervisor` | `Supervisor@123` | All investigator capabilities + global case oversight, user assignment, disclosure review |
| **Administrator** | `admin` | `Admin@123` | Full system access, user administration, system-wide audit access |

---

## 5. Primary Demonstration Case: `CASE-2026-001`

- **Case Identifier:** `CASE-2026-001`
- **Case Title:** `Operation CryptoSweep - Ransomware Cluster`
- **Crime Type:** `RANSOMWARE` (Extortion fund tracking)
- **Subject Wallet Address:** `A` (Controlled suspicious unhosted wallet)
- **Blockchain Rail:** `Ethereum`
- **Expected Traversal:**
  ```
  [ Suspect Wallet: A ]
           ├──▶ [ Intermediary: B ] ──▶ [ Intermediary: C ] ──▶ [ VASP Deposit: EXCHANGE_DEPOSIT ]
           └──▶ [ Mixer Contract: MIXER_1 (Tornado Cash Mock) ]
  ```

---

## 6. Step-by-Step Live Walkthrough (22-Step Script)

| Step | Action | UI Location | Expected System State / Talking Point |
| :---: | :--- | :--- | :--- |
| **1** | Open Browser | `http://localhost:5173` | Redirects to `/login`. Law enforcement agency design system renders cleanly. |
| **2** | Authenticate | `/login` | Click **Demo Investigator** (or type `investigator` / `Investigator@123`) and submit. Session JWT issued with unique `jti`. |
| **3** | View Dashboard | `/dashboard` | Officer badge renders in sidebar (`INVESTIGATOR · LE ID #8321`). Active case metrics and system index show operational status. |
| **4** | Case Registry | `/cases` | Case registry displays seeded investigations (`CASE-2026-001` and `CASE-2026-002`). |
| **5** | Select Case | `/cases/CASE-2026-001/overview` | Opens case dossier for `Operation CryptoSweep`. Subject wallet `A` is displayed under investigation parameters. |
| **6** | Trigger Analysis | Click **Run Analysis** | Dispatches request to Node backend (`/api/cases/CASE-2026-001/analyze`) with `X-Request-ID` correlation header. |
| **7** | Real-Time Progress | `/cases/analysis` | Interactive animation shows pipeline: Normalization ➔ NetworkX DiGraph Construction ➔ BFS Traversal ➔ Heuristic Attribution ➔ Risk Scoring. |
| **8** | Overview Findings | `/cases/CASE-2026-001/overview` | Canonical analysis result loaded. Highlights identified VASP (`Example Exchange`), confidence tier, and risk level. |
| **9** | Open Graph View | `/cases/CASE-2026-001/graph` | Interactive Directed Acyclic Graph (DAG) renders in viewport. Nodes clearly colored by role: Subject (Blue), Intermediate (Grey), High-Risk Mixer (Red), Exchange Deposit (Green). |
| **10** | Inspect Wallet | Click Node `A` | **Node Inspector** opens on right pane showing wallet balance, transaction volume, and out-degree. |
| **11** | Follow Trace Path | Trace `A` ➔ `B` ➔ `C` | Visual edges display transaction amounts (`tx001: 10.5 ETH`, `tx002: 10.0 ETH`, `tx003: 9.5 ETH`). Clear layering/peel chain behavior. |
| **12** | Inspect VASP Node | Click `EXCHANGE_DEPOSIT` | Inspector identifies node as centralized exchange deposit wallet belonging to `Example Exchange`. |
| **13** | Attribution Detail | `/cases/CASE-2026-001/attribution` | Shows explainable reasoning: 3-hop graph distance, terminal deposit clustering, and heuristic confidence breakdown. |
| **14** | Risk Indicators | Attribution Tab (Risk Section) | Displays composite risk score (`HIGH`). Highlights detected signals: rapid fund dispersion, layering peel chain, and interaction with privacy mixer (`MIXER_1`). |
| **15** | Evidence Locker | `/cases/CASE-2026-001/evidence` | Forensic evidence table displays 8 verified evidence items with verification checksum hashes. |
| **16** | Inspect Evidence | Click Row `EV-001` | Details panel shows raw transaction hash, block number, timestamp, and source (`Blockchain Transaction Record`). |
| **17** | Case Report | `/cases/CASE-2026-001/report` | Renders formal law enforcement investigative dossier ready for court submission. |
| **18** | Legal Distinction | Report Sections | Emphasize strict evidentiary boundaries: **Fact** (on-chain txs) vs. **System Analysis** (BFS path) vs. **Attribution** (probable VASP) vs. **Risk Signal** (heuristic) vs. **Interpretation**. |
| **19** | Disclosure Workflow | Click **Prepare Disclosure** | Modal opens: "DRAFT DISCLOSURE REQUEST (Section 91 CrPC)". |
| **20** | Draft Section 91 | Complete Notice | Pre-populates target VASP (`Example Exchange`), subject deposit address, and required transaction records. |
| **21** | Return to Case | Case View | Disclosure request recorded in `disclosure_requests` table with status `DRAFTED_PENDING_DISPATCH`. |
| **22** | Audit Trail Verification | Inspect Terminal / DB | Query `audit_logs` table to confirm immutable trail: `LOGIN_SUCCESS`, `CASE_VIEWED`, `ANALYSIS_STARTED`, `ANALYSIS_COMPLETED`, `DISCLOSURE_REQUESTED`. |

---

## 7. Security & Failure Recovery Demonstration

### Security Demo: Horizontal Case Authorization (15 Seconds)
1. Log in as `investigator`.
2. Attempt to query an unassigned or non-existent case via curl or API:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/cases/CASE-UNAUTHORIZED-999
   ```
3. **Observed Result:** Returns `HTTP 403 Forbidden` (`FORBIDDEN_CASE_ACCESS`).
4. **Audit Evidence:** A `PERMISSION_DENIED` entry is permanently recorded in `audit_logs`.

### Failure Recovery: Graceful Intelligence Engine Degradation
1. If the Python process is temporarily halted during analysis:
   - Backend returns structured `502 Bad Gateway` (`INTELLIGENCE_ENGINE_UNAVAILABLE`).
   - The UI displays an informative alert: *"Python Intelligence Engine is currently unavailable. Please verify the service is running."*
   - Zero stack traces, database credentials, or internal file paths are leaked.

---

## 8. Safe Development Environment Reset (DEV ONLY)

To restore demonstration data to a clean initial state between presentations:

```bash
# From backend/ directory:
node -e "const db = require('./src/db/connection'); const migrator = require('./src/db/migrator'); const seed = require('./src/db/seed'); (async () => { await migrator.runMigrations(); await seed.runSeeds(); console.log('✓ TRACEVAULT Demo State Successfully Reset'); process.exit(0); })();"
```

---

## 9. Controlled Shutdown Procedure

1. In each terminal window, press `Ctrl + C`.
2. If Docker PostgreSQL was utilized:
   ```bash
   docker-compose down
   ```
