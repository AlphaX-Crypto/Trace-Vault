# TRACEVAULT Deployment Guide

This guide describes the production deployment architecture, configuration parameters, migration procedures, and verification steps for TRACEVAULT.

---

## 1. Architecture Overview

```
                        HTTPS / User Traffic
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Vercel Frontend     │
                     │  (React 18 / Vite 5)  │
                     └───────────┬───────────┘
                                 │
                   VITE_API_BASE_URL (REST / JSON)
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Render Web Service  │
                     │  (Node.js / Express)  │
                     └─────┬───────────┬─────┘
                           │           │
       DATABASE_URL (pg)   │           │ INTELLIGENCE_ENGINE_URL
                           ▼           ▼
┌────────────────────────────┐       ┌────────────────────────────┐
│   Render PostgreSQL        │       │   Render Web Service       │
│  (18 atomic SQL migrations)│       │  (Python 3.11 / FastAPI)   │
└────────────────────────────┘       └────────────────────────────┘
```

TRACEVAULT operates with clear service boundaries:
1. **Frontend (Vercel):** Pure static SPA compiled from TypeScript. Never contacts the database directly. Communicates with Node.js API gateway.
2. **Backend API Gateway (Render):** Express service responsible for authentication (JWT), RBAC, audit logging, transaction ingestion/normalization, and persistence orchestration.
3. **Intelligence Engine (Render):** FastAPI service providing deterministic NetworkX graph topology, risk heuristics, VASP clustering, and geospatial analytical pipelines.
4. **Persistence (Render PostgreSQL):** Versioned relational database running 18 migrations and immutable audit trails.

---

## 2. Frontend Deployment (Vercel)

### Project Configuration
- **Root Directory:** `frontend`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build` (runs `tsc && vite build`)
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Environment Variables
| Variable | Description | Example / Target Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Fully qualified URL of deployed Node.js backend | `https://tracevault-backend.onrender.com` |

> [!NOTE]
> Do NOT set trailing slashes on `VITE_API_BASE_URL`. The client normalizes endpoints deterministically.

---

## 3. Node.js Backend Gateway (Render Web Service)

### Service Configuration
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start` (runs `node src/server.js`)
- **Health Check Path:** `/health` (also `/health/ready` for deep upstream checks)

### Environment Variables
| Variable | Required | Description | Example / Target Value |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Target execution environment | `production` |
| `PORT` | Auto | Assigned dynamically by Render | Set automatically by Render |
| `HOST` | No | Network interface binding | `0.0.0.0` (default) |
| `DATABASE_URL` | Yes | PostgreSQL connection string with SSL | `postgresql://user:pass@host/tracevault` |
| `DB_SSL` | Optional | Enforce SSL certificate verification bypass | `true` |
| `INTELLIGENCE_ENGINE_URL` | Yes | Fully qualified URL of Python intelligence service | `https://tracevault-intelligence.onrender.com` |
| `CORS_ORIGIN` | Yes | Deployed frontend origin (Vercel domain) | `https://tracevault-app.vercel.app` |
| `JWT_SECRET` | Yes | Cryptographically strong secret (min 32 chars) | `<secure-random-32+-char-string>` |
| `JWT_EXPIRES_IN` | No | JWT token lifespan | `2h` (default) |
| `TRUST_PROXY` | Yes | Trust upstream reverse proxy headers | `true` |

> [!CAUTION]
> In `production`, TRACEVAULT refuses to boot if:
> - `JWT_SECRET` is left as the fallback development key or is shorter than 32 characters.
> - `DATABASE_URL` is missing.
> - `CORS_ORIGIN` is configured as a wildcard (`*`).

---

## 4. Python Intelligence Engine (Render Web Service)

### Service Configuration
- **Root Directory:** `intelligence-engine`
- **Environment:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`

### Environment Variables
| Variable | Required | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Auto | Assigned dynamically by Render | Set automatically by Render |
| `HOST` | No | Host binding | `0.0.0.0` |
| `LOG_LEVEL` | No | Logging verbosity | `info` |

---

## 5. PostgreSQL Database (Render PostgreSQL)

### Database Configuration
- **Database Engine:** PostgreSQL 15+
- **Connection Type:** Internal (within Render private network) or External (standard connection string)
- **SSL Requirement:** SSL required in production (`sslmode=require` or handled via `DB_SSL=true`).

### Migration Procedure
Migrations are idempotent and sequentially versioned from `001_create_roles.sql` through `018_make_evidence_analysis_id_nullable.sql`.

#### Option A: Automatic via Render Post-Deploy / Release Command
Run from `backend` directory:
```bash
npm run db:migrate
```

#### Option B: Manual One-Off Run (or CI/CD step)
From repository root with `DATABASE_URL` exported:
```bash
node database/scripts/validate_db.js
```

---

## 6. Security & Credential Isolation

1. **Zero Hardcoded Secrets:** No JWT keys, passwords, database credentials, or external API keys exist in git history or committed configuration.
2. **Prohibited Credentials:** TRACEVAULT's `securityScanMiddleware` actively rejects payloads containing private keys, mnemonic seed phrases, or raw wallet credentials.
3. **Strict Case Isolation:** All investigations, evidence records, intelligence graphs, and reports are isolated by `case_id` with role-based access validation.

---

## 7. Demo Data & Simulated Services

- **Dev Seeds (`database/seeds/001_dev_seeds.sql`):** Provides baseline test investigators (`lead_analyst`, `senior_investigator`) and synthetic cases for demonstration purposes.
- **SAHYOG Sandbox:** The SAHYOG Law Enforcement Authority interface operates in a deterministic simulated sandbox mode (`SANDBOX-...` acknowledgment IDs). No live government endpoint credentials are required or permitted during evaluation.

---

## 8. Deployment Order Checklist

1. **Step 1: Deploy Render PostgreSQL**
   - Create Render PostgreSQL database instance.
   - Note the provided Internal/External `DATABASE_URL`.
2. **Step 2: Deploy Python Intelligence Engine**
   - Create Render Web Service connected to GitHub `main`.
   - Set Root Directory: `intelligence-engine`.
   - Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - Copy service URL: `https://<service-name>.onrender.com`.
3. **Step 3: Deploy Node.js Backend Gateway**
   - Create Render Web Service connected to GitHub `main`.
   - Set Root Directory: `backend`.
   - Configure Environment Variables (`DATABASE_URL`, `INTELLIGENCE_ENGINE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `TRUST_PROXY=true`).
   - Run initial migration: execute `npm run db:migrate` in Render shell or pre-deploy.
   - Verify health at `https://<backend-url>/health/ready`.
4. **Step 4: Deploy Frontend on Vercel**
   - Import repository on Vercel.
   - Set Root Directory to `frontend`.
   - Set Environment Variable `VITE_API_BASE_URL` to deployed Render backend URL.
   - Deploy and verify end-to-end connectivity.
5. **Step 5: Final CORS Handshake**
   - In Render Backend settings, update `CORS_ORIGIN` to the production Vercel domain (e.g. `https://<app>.vercel.app`).
