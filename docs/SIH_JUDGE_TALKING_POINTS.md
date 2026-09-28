# TRACEVAULT V2 — SIH JUDGE TALKING POINTS & TECHNICAL Q&A

**Problem Statement:** SIH26182 — Automated Blockchain Intelligence & VASP Attribution Engine  
**Team:** AlphaX-Crypto  

---

## 1. Core Problem & Value Proposition

### Q: What exact problem does TRACEVAULT solve?
**A:** When cybercriminals execute ransomware extortion, investment scams, or cyber theft, they rapidly move stolen funds across dozens of unhosted cryptocurrency wallets using layering and peel chains before cashing out through Virtual Asset Service Providers (VASPs / Centralized Exchanges).  
Investigating officers face a critical bottleneck: blockchain ledgers are pseudonymous. Identifying which exchange holds the cash-out wallet takes days of manual transaction tracking. TRACEVAULT automates this entire graph traversal in milliseconds, attributes downstream deposit addresses to known VASPs, assesses illicit behavioral risk, and auto-generates Section 91 CrPC legal notices for rapid subpoena submission.

### Q: Why blockchain graph analysis?
**A:** Financial fund flows are inherently directed graphs: wallets are nodes, and transactions are directed, timestamped, weighted edges. Relational tables cannot natively compute multi-hop reachability or cycle detection at scale. A directed graph structure allows deterministic Breadth-First Search (BFS) to identify fund dispersion, peel chains, and terminal exit nodes across multi-hop trails.

---

## 2. Technical Architecture & Engineering Decisions

### Q: Why the dual stack: Node.js/Express + Python/FastAPI?
**A:** We deliberately leveraged the optimal ecosystem for each layer:
1. **Python / FastAPI**: Industry standard for scientific computing, graph theory, and mathematical risk modeling. Houses the NetworkX graph engine and attribution algorithms in a high-performance, stateless analytical service.
2. **Node.js / Express**: Industry standard for I/O-intensive web gateways, session handling, RBAC enforcement, real-time client streaming, and PostgreSQL transaction orchestration.
3. **Canonical Data Contract**: The two engines communicate over strict, versioned REST contracts (`AnalysisResult` and `CommonTransaction`), eliminating tight coupling.

### Q: Why NetworkX over a heavy Graph Database (like Neo4j)?
**A:** In a law enforcement triage scenario, investigations focus on specific bounded subgraphs (typically 3 to 5 hops originating from a suspect wallet). Spawning massive clustered graph databases introduces unnecessary infrastructure bloat, memory overhead, and operational fragility. NetworkX constructs targeted `DiGraph` structures in in-memory micro-pipelines in under 50 milliseconds, providing deterministic algorithmic traversal without dedicated external database clusters.

### Q: Why PostgreSQL for persistence?
**A:** PostgreSQL provides strict ACID guarantees, relational integrity via foreign keys, robust connection pooling, and append-only audit trail logging. Investigation casework, user roles, and legal disclosure requisitions require guaranteed relational persistence, which PostgreSQL delivers natively.

---

## 3. Intelligence & Attribution Engine

### Q: How is VASP attribution performed?
**A:** TRACEVAULT does NOT claim magical identification of individuals. Instead, it identifies **potential VASP association**:
1. When a transaction path terminates at an address known to belong to an exchange's deposit infrastructure (via clustering heuristics and tagged intelligence registries), the engine tags that terminal node as an exchange deposit wallet.
2. It establishes a graph-derived relationship explaining *how* and *through which intermediaries* funds reached that exchange.
3. Real-world identity confirmation requires lawful Section 91 CrPC requisition from the VASP.

### Q: How is attribution confidence calculated?
**A:** Confidence is calculated deterministically across four objective criteria:
- **Registry Reliability (30%)**: Verified regulatory records vs. open-source tags.
- **Hop Distance (25%)**: Proximity to suspect wallet (1 hop = high; 3+ hops = decayed).
- **Cluster Purity (25%)**: Ratio of transactions entering the specific cluster.
- **Behavioral Confirmation (20%)**: Typical exchange deposit sweep behavior.
Output confidence is categorized as `HIGH` (>=0.80), `MEDIUM` (>=0.50), or `LOW` (<0.50).

### Q: How is forensic risk evaluated?
**A:** Risk is a multi-factor composite score (0–100) combining:
1. **Mixer / Privacy Pool Interaction (Score: 90)**: Direct or 1-hop interaction with smart contract mixers (e.g. Tornado Cash).
2. **Peel Chain / Layering Behavior (Score: 70)**: Rapid succession of transfers with diminishing values indicative of structuring.
3. **Rapid Dispersion (Score: 60)**: High out-degree fund scattering across short time windows.
*Risk is presented as an investigative indicator, never as sole proof of criminality.*

### Q: What happens if a wallet is not associated with a known VASP?
**A:** TRACEVAULT classifies the node as an `UNHOSTED_WALLET` or `INTERMEDIARY`. The BFS traversal continues up to the configured hop limit, mapping the transaction trail so investigators can identify intermediary hubs or future cash-out points.

---

## 4. Evidence Integrity & Legal Workflows

### Q: How is evidence forensically preserved?
**A:** Every transaction edge and attribution signal generates an immutable `EvidenceItem` in PostgreSQL with:
- Source ledger reference and block timestamp
- Transaction verification hash
- Exact hop distance and transfer volume
- Chain of custody reference linking to `CASE-XXXX-XXX`

### Q: What is the SAHYOG workflow and how does it fit?
**A:** SAHYOG is the national law enforcement coordination initiative for cybercrime intelligence. TRACEVAULT generates a standardized **DRAFT DISCLOSURE REQUEST (Section 91 CrPC)** pre-populated with target VASP details, deposit addresses, transaction hashes, and requesting officer credentials.  
*We explicitly clarify that TRACEVAULT produces compliant draft requisitions; it does not claim automated electronic submission to live external LEA portals without statutory authorization.*

---

## 5. Security & Access Control

### Q: How does TRACEVAULT prevent unauthorized access?
**A:** Security is enforced across multiple defense layers:
1. **Authentication**: Bcrypt password hashing (10 salt rounds) + cryptographically signed JWT sessions with unique `jti` claims and server-side token revocation.
2. **RBAC**: Strict role boundaries (`INVESTIGATOR`, `SUPERVISOR`, `ADMIN`).
3. **Case Authorization**: The `requireCaseAccess` middleware checks `case_members` in PostgreSQL. An investigator attempting to view another officer's case receives `HTTP 403 Forbidden` and triggers a `PERMISSION_DENIED` audit log.
4. **Append-Only Audit Trail**: All authentication events, case views, analysis runs, and disclosure drafts are recorded in `audit_logs` with automatic credential redaction.
5. **Ingress Protection**: Helmet HTTP security headers, IP rate limiting, and regex scanning that blocks cryptocurrency private keys (64-char hex) and seed phrases.

---

## 6. Future Roadmap: UPI & Multi-Rail Expansion

### Q: How will TRACEVAULT expand to UPI and banking fraud?
> [!NOTE] Future Scope Only
> UPI integration is an architectural roadmap extension, not implemented in the current cryptocurrency VASP engine.

**Future Pipeline:**
```
[ UPI Rail Adapter (NPCI / Banking API) ]
                 │
                 ▼
     [ Common Transaction Model ]
  (UTR, Remitter VPA, Beneficiary VPA, IFSC, Amount, Timestamp)
                 │
                 ▼
     [ NetworkX Graph Engine ]
                 │
                 ▼
     [ Unified Financial Fraud Intelligence ]
```

**Planned Behavioral Signals:**
- **Velocity Anomalies**: High-frequency micro-transactions followed by immediate lump-sum draining.
- **Fan-Out / Fan-In**: Mule account collection patterns across VPAs.
- **Circular Flows**: Circular laundering between related accounts.
- **Device & Geolocation Signals**: Multi-VPA activity originating from common IP/device identifiers.
