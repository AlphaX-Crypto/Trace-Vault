# TRACEVAULT V3 — FRONTEND ARCHITECTURE & STITCH INVESTIGATOR INTERFACE

## 1. Executive Summary

TRACEVAULT V3 introduces the **Stitch-Referenced Investigator Platform**, a security operations center (SOC) and financial crime investigation interface. By synthesizing multi-rail analytics across Ethereum/EVM blockchains, national UPI banking switches, and geospatial telemetry, this platform delivers an institutional, high-density, forensic-grade workspace for regulatory compliance teams, financial intelligence units (FIUs), and law enforcement agencies (LEAs).

The frontend adheres to the exact visual and operational standards modeled from the Stitch Financial Investigation reference (`referencedashboard.png` and `referencedashboard2.png`).

---

## 2. Visual Language & Design Tokens

The styling architecture is defined in `frontend/src/styles/tokens.css` and `frontend/src/styles/global.css`, engineered around midnight glassmorphism, luminous accenting, and clear chromatic rail encoding.

### 2.1 Core Palette & Semantic Surfaces
- **App Canvas (`--color-app`)**: `#03070d` (Deep midnight slate background)
- **Glass Surfaces (`--color-surface`)**: `rgba(10, 19, 32, 0.88)` with `backdrop-filter: blur(16px)` and subtle inset highlights
- **Raised Surfaces (`--color-surface-raised`)**: `rgba(18, 30, 49, 0.92)`
- **Glass Borders (`--color-border`)**: `rgba(0, 242, 254, 0.14)`
- **Luminous Cyan Accent (`--color-accent`)**: `#00f2fe`
- **Neon Glow Accent (`--color-accent-bright`)**: `#38ef7d` / `#00e5ff`
- **Text Primary (`--color-primary-text`)**: `#f1f5f9` (Crisp off-white)
- **Text Secondary (`--color-secondary-text`)**: `#94a3b8` (Muted steel slate)

### 2.2 Chromatic Rail Encoding
- **Crypto Rail**: Luminous Cyan / Teal (`#00f2fe`)
- **UPI Banking Rail**: Electric Violet / Purple (`#a855f7`)
- **Geospatial Telemetry**: Vivid Amber / Gold (`#f59e0b`)
- **Cross-Rail Bridges**: Magenta / Rose (`#ec4899`)

### 2.3 Strict Terminology & Legal Guardrails
1. **Investigative Risk Indicator**: Every score (0–100) and severity badge is strictly framed as an investigative risk indicator for prioritization, **never** as *"confirmed fraud"*, *"criminal score"*, or *"proof of guilt"*.
2. **Structured Evidentiary Standards**: Evidence items are cataloged as *"Structured investigative evidence suitable for review"* (**never** *"court-ready"*).
3. **Non-Inferential Identity Boundaries**: Identifiers are treated as analytical nodes. Cross-rail linkages are termed *"Analytical associations"*, **never** *"same owner"* or *"confirmed identity"*. Synthetic associations are explicitly labeled `SYNTHETIC DEMONSTRATION ASSOCIATION`.
4. **Temporal Integrity**: Timestamps are preserved strictly as emitted by ledgers and core banking switches. Missing timestamps are explicitly labeled `TIME UNKNOWN` (timestamps are **never** invented or backfilled).

---

## 3. Global Application Shell & Navigation

The layout system is implemented in `frontend/src/components/layout/`:
- `Sidebar.jsx`: Grouped navigation drawer with operational badge counts, brand beacon, and category dividers.
- `Topbar.jsx`: Operations center topbar featuring live status beacon, instant entity search (addresses, VPAs, hashes), quick-action buttons, notifications, and operator profile.
- `layout.css`: Flexbox and grid scaffolding ensuring smooth scrolling, backdrop blur containment, and responsiveness across viewports.

### 3.1 Primary Navigation Hierarchy
- **WORKSPACE**:
  - `Dashboard` (`/dashboard`): Live security operations center (SOC) and real-time threat monitor.
  - `Cases` (`/cases`): Active case intake ledger and lifecycle tracking.
  - `Investigations` (`/investigations`): Central multi-rail investigation catalog.
- **INTELLIGENCE**:
  - `Unified Console` (`/investigations/INV-004`): Direct link into flagship multi-rail cross-rail investigation.
  - `Transaction Graph` (`/graph`): Full interactive canvas of financial graphs.
  - `Risk & Fraud` (`/risk`): Cross-rail risk engine and rule evaluator.
  - `VASP Attribution` (`/vasp`): Centralized exchange identification and hot wallet clusters.
  - `Geospatial Radar` (`/geospatial`): Velocity anomaly and impossible traveler detection.
- **EVIDENCE & OUTPUT**:
  - `Evidence Locker` (`/evidence`): Chain-of-custody cryptographic evidence bundles.
  - `Reports Dossier` (`/reports`): Exportable analytical summaries and case dossiers.
  - `Disclosure / SAHYOG` (`/disclosure`): FIU and law enforcement regulatory request portal.
- **GOVERNANCE**:
  - `Audit / Activity` (`/audit`): Immutable append-only audit trail and telemetry log.

---

## 4. Operational Page Implementations

### 4.1 Sentinel Harbor Dashboard (`/dashboard`)
Directly modeled on the Stitch reference:
1. **Hero Threat Flow Monitor**:
   - Vector-rendered interactive transaction topology showing flow across `Suspect Wallet` → `Peel-Chain Transfer` → `VASP Transit (Binance)` → `P2P Desk Settlement` → `UPI Mule Dispersal` → `ATM Cashout Exit`.
   - Real-time event counter pill (`1,842 Total Events Detected`).
   - Floating control dock (`Refresh Flow`, `Expand Graph`, `Export Vector`).
2. **Incident Risk Monitor**:
   - Custom SVG semi-circular radial gauge (0–100 tick marks, needle indicator, numerical score).
   - Active heuristic indicators: `P` (Peeling), `E` (Exploitation), `D` (Dispersal - Active), `R` (Rapid Exit), `M` (Mixer).
   - Severity badge with dynamic color transitions (`CRITICAL ELEVATED`).
3. **Forensic Operations Row**:
   - *Threat Hunting*: Live soundwave audio frequency bars, multi-rail threat indicators, and direct case linking.
   - *Forensics Extraction*: Circular progress donut gauge (68% completion) with live worker breakdown.
   - *Operational Intel Feed*: Streaming alert terminal with micro-timestamps and severity badges.
4. **Active Cases Intake Ledger**:
   - Dense institutional table displaying Case ID, Target Subject, Multi-rail Type, Risk Indicator, Confidence, and Status.

### 4.2 Cases & Investigation Catalogs (`/cases`, `/investigations`)
- Filterable by active financial rails (`ALL`, `CRYPTO`, `UPI`, `MULTI_RAIL`).
- Filterable by risk severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- High-efficiency quick search across Case IDs, entity hashes, and wallet addresses.
- Multi-mode display: Toggle between Dense Institutional Ledger Table and Visual Card Grid.
- New Case / Investigation modal with deterministic scenario presets (`INV-001` through `INV-008`).

### 4.3 Investigator Workspace (`/investigations/:id/:tab`)
The flagship analytical cockpit featuring 11 specialized forensic tabs:
1. **Overview**: Executive assessment, subject provenance, graph coverage metrics, domain intelligence cards, and legal disclaimers.
2. **Risk & Scoring**: Sub-score decomposition (Crypto, UPI, Geospatial, VASP penalties), rule breakdown, and confidence scoring.
3. **Unified Graph**: Interactive multi-rail topology graph with node clustering, bridge detection, and edge attributes.
4. **Timeline**: Chronological unified multi-rail event stream with timestamp verification and `TIME UNKNOWN` flags.
5. **Intelligence**: Domain-specific heuristics (Crypto peel-chain/mixer detection, UPI velocity/mule funnels, Geospatial speed anomalies).
6. **Cross-Rail**: Bridge analysis linking crypto exit wallets to fiat/UPI on/off-ramps and P2P settlement desks.
7. **Evidence**: Cryptographic evidence locker with SHA-256 hashes, provenance tags, and chain-of-custody export.
8. **Reasoning Trace**: Step-by-step explainable orchestration log documenting inference decisions.
9. **Limitations**: Institutional boundary caveats (missing data, unverified telemetry, heuristic false positive limits).
10. **Report**: Formatted export-ready investigative report with printable styling and executive briefing layout.
11. **Audit**: Immutable append-only audit trail logging user access, queries, and case exports.

---

## 5. Offline Fallback Resilience

To guarantee 100% demo uptime and resilience during SIH evaluation without dependency on live external indexers or backend services:
- `frontend/src/data/investigationScenarios.js` embeds deterministic offline dossiers for scenarios `INV-001` through `INV-008`.
- If the backend is running in mock mode or temporarily unreachable, the frontend gracefully falls back to local scenario state with zero UI crashes or broken views.

---

## 6. Verification & Quality Assurance

The implementation has been thoroughly validated against the complete TRACEVAULT verification harness:

1. **Python Intelligence Engine Suite**:
   ```bash
   .\intelligence-engine\.venv\Scripts\python.exe -m pytest intelligence-engine/tests
   ```
   - **Result**: `203 passed, 32 warnings in 23.21s` (100% pass rate).

2. **Node.js Express Backend Suite**:
   ```bash
   npm test --prefix backend
   ```
   - **Result**: `70 passed, 0 failed` across 17 test suites (100% pass rate).

3. **Vite Frontend Production Build**:
   ```bash
   npm run build --prefix frontend
   ```
   - **Result**: `✓ built in 1.85s`, zero bundling errors, production assets minified in `dist/`.
