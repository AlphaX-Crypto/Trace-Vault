# TRACEVAULT V2 — END-TO-END DATA FLOW

This document details the lifecycle of an investigation from case intake to dossier export.

---

## Complete Investigation Data Flow Sequence

```
[ Investigator / UI ] 
         │ 
         │ 1. POST /api/auth/login { username, password }
         ▼
[ Express Auth Controller ] ──(Bcrypt verify)──▶ [ users Table ]
         │
         │ 2. Return JWT { jti, userId, role }
         ▼
[ Frontend AuthContext ] (Stores token, injects Bearer header)
         │
         │ 3. POST /api/cases { title, blockchain, target_wallet, priority }
         ▼
[ Express Case Controller ] 
         │ ── Insert into cases table
         │ ── Insert into case_members (creator = investigator)
         │ ── Append to audit_logs (CASE_CREATED)
         │
         │ 4. POST /api/cases/:id/analyze { maxHops: 3 }
         ▼
[ Express Analysis Controller ]
         │ ── Verify JWT & case membership
         │ ── Append to audit_logs (ANALYSIS_STARTED)
         │ ── Forward HTTP with X-Request-ID
         ▼
[ Python FastAPI Engine ]
         │ ── Normalize raw transactions
         │ ── Build NetworkX DiGraph
         │ ── Execute BFS traversal & PathFinder
         │ ── Compute VASP attribution & explainable reasoning
         │ ── Calculate multi-factor risk score
         │ ── Return canonical AnalysisResult
         ▼
[ Express Analysis Controller ]
         │ ── Validate AnalysisResult schema
         │ ── Persist analysis_results, risk_results, risk_signals, evidence
         │ ── Append to audit_logs (ANALYSIS_COMPLETED)
         │ ── Return enriched case intelligence
         ▼
[ Frontend Visualization ]
         │ ── Render interactive Cytoscape DAG graph
         │ ── Display VASP confidence & attribution evidence cards
         │ ── Render forensic transaction evidence table
         │
         │ 5. POST /api/cases/:id/disclosure-request
         ▼
[ Express Case Controller ]
         │ ── Draft Section 91 CrPC notice for identified VASP
         │ ── Store in disclosure_requests table
         │ ── Append to audit_logs (DISCLOSURE_REQUESTED)
         ▼
[ Frontend Dossier View ]
         │ ── View draft Section 91 notice
         │ ── Export comprehensive investigation dossier
```
