# TRACEVAULT Application Backend

**Team**: ALPHA  
**Owner**: Kushma  
**Module**: `backend/`  
**Hackathon**: Smart India Hackathon 2026

The TRACEVAULT Backend is the Node.js / Express application orchestration layer between the React Frontend UI, the Python/FastAPI Intelligence Engine, and the PostgreSQL persistent database.

---

## Architecture & Responsibilities

```text
React Frontend UI
       ↓ (HTTP REST)
Node.js Application Backend (Orchestration, Case Management, Auth Foundation, Validation)
       ↓ (HTTP REST: POST /api/v1/analyze-wallet)
Python Intelligence Engine (Graph Analysis, Normalization, NetworkX BFS, VASP Attribution, Risk)
```

- **Node.js Responsibilities**:
  - API routing and request validation
  - Case management lifecycle
  - Dispatching analysis requests to Python Intelligence Engine
  - Error normalization and client security enforcement
  - Future SAHYOG LEA disclosure/freezing request workflow adapter
- **Python Responsibilities**:
  - Blockchain intelligence, graph algorithms, NetworkX BFS, VASP attribution, and risk calculation.
  - Node.js does **not** duplicate graph analysis or risk scoring logic.

---

## Directory Structure

```text
backend/
├── src/
│   ├── app.js                     # Express application definition & middleware
│   ├── server.js                  # HTTP server bootstrap & graceful shutdown
│   ├── config/
│   │   └── env.js                 # Environment variable parsing & configuration
│   ├── routes/
│   │   └── cases.js               # Case management & analysis route definitions
│   ├── controllers/
│   │   ├── caseController.js      # Case CRUD and disclosure request handling
│   │   └── analysisController.js  # Intelligence dispatch & results retrieval
│   ├── services/
│   │   ├── caseService.js         # Case repository abstraction & state management
│   │   └── intelligenceService.js # HTTP adapter for Python Intelligence Engine
│   ├── middleware/
│   │   ├── errorHandler.js        # Centralized error handler & status mapper
│   │   ├── notFoundHandler.js     # 404 unmapped route handler
│   │   └── validation.js          # Security scanner & input validators
│   └── utils/
│       ├── apiResponse.js         # Standard JSON response formatter
│       ├── appError.js            # Operational error class
│       └── logger.js              # Environment-aware structured logger
├── tests/                         # Node.js backend test suite
├── .env.example                   # Environment configuration template
├── package.json
└── README.md
```

---

## API Endpoints

### 1. Health Checks
- `GET /health`: Basic service liveness check.
- `GET /health/intelligence`: Checks connectivity with the Python Intelligence Engine (`${PYTHON_INTELLIGENCE_URL}/health`).

### 2. Case Management
- `POST /api/cases`: Create a new investigation case.
  - Body: `{ "title": "Operation Alpha", "description": "...", "priority": "HIGH", "crime_type": "RANSOMWARE" }`
- `GET /api/cases`: Retrieve all registered cases.
- `GET /api/cases/:id`: Retrieve details of a specific case.

### 3. Wallet Analysis (Python Gateway)
- `POST /api/cases/:id/analyze`:
  - Dispatches wallet analysis request to Python Intelligence Engine (`POST /api/v1/analyze-wallet`).
  - Body: `{ "wallet_address": "0x...", "blockchain": "ethereum" }`
  - Returns nearest VASP attribution, distance, confidence, risk score, and transaction path.
- `GET /api/cases/:id/results`:
  - Retrieves all historical analysis results associated with the case.

### 4. SAHYOG Disclosure Workflow (Sandbox)
- `POST /api/cases/:id/disclosure-request`:
  - Drafts an LEA disclosure request record under Section 91 CrPC using the SAHYOG sandbox adapter.

---

## Security Enforcement

The backend strictly enforces the following security boundaries:
1. **No Private Keys**: Any incoming payload matching 64-character hex keys is rejected with a `400 SECURITY_VIOLATION_PRIVATE_KEY` error.
2. **No Seed Phrases**: Payloads containing 12-, 15-, 18-, 21-, or 24-word sequences are rejected with `400 SECURITY_VIOLATION_SEED_PHRASE`.
3. **No Prohibited Fields**: Any field containing `private_key`, `seed_phrase`, `mnemonic`, or `password` is blocked.
4. **Blockchain Whitelist**: Sprint 1 strictly validates `blockchain === "ethereum"`; other chains are rejected with a clear 400 error.
5. **Information Masking**: Internal stack traces and backend connection details are stripped from client error responses.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Run backend tests
npm test
```
