# TRACEVAULT V3 — Unified Crypto + UPI Investigation Graph Architecture

## 1. Executive Summary

TRACEVAULT V3 Phase 15 introduces the **Unified Financial Investigation Graph**, connecting TRACEVAULT's multi-rail financial intelligence pipelines:
- **Ethereum Blockchain Data & Behavioral Intelligence** (Phases 10–11)
- **VASP Attribution & Explainability Engine** (Phase 3)
- **UPI Data Foundation & Common Financial Event Model** (Phase 12)
- **UPI Explainable Rule-Based Fraud Intelligence** (Phase 13)
- **Geospatial Intelligence & Location Consistency Engine** (Phase 14)

The Unified Graph does **not** replace these underlying engines; instead, it provides a canonical, directed multi-rail graph layer (`NetworkX MultiDiGraph`) that synthesizes disparate financial events, attributions, location signals, and investigative bridges into a single explainable investigation view.

---

## 2. Core Architectural Principles

```
  CRYPTO TRANSACTIONS (ETH / Tokens)
                 │
                 ▼
       [CryptoGraphAdapter]
                 │
                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 CANONICAL UNIFIED GRAPH                     │
  │                                                             │
  │   wallet:0x123 ───(SENT)───> wallet:0x456                   │
  │        │                            │                       │
  │   (ATTRIBUTED_TO)            (CROSS_RAIL)                   │
  │        ▼                            ▼                       │
  │   vasp:exchange              upi:agent@bank                 │
  │                                     │                       │
  │                                   (SENT)                    │
  │                                     ▼                       │
  │   location:bengaluru <──(LOC)─── upi:cashout                │
  └─────────────────────────────────────────────────────────────┘
                 ▲
                 │
       [UPIGraphAdapter] & [GeospatialGraphAdapter]
                 │
  UPI TRANSACTIONS + GEOSPATIAL OBSERVATIONS
```

### 2.1 Deterministic Identity (Zero Random UUIDs)
Every node and edge in the unified graph utilizes a strictly formatted, canonical, and lowercase identifier:
- **Wallets**: `wallet:<hex_address>` (e.g. `wallet:0x71c8...350`)
- **UPI VPAs**: `upi:<vpa>` (e.g. `upi:mule@mockupi`)
- **Merchants**: `merchant:<merchant_id>` (e.g. `merchant:merch_crypto_001`)
- **VASPs / Exchanges**: `vasp:<normalized_name>` (e.g. `vasp:example exchange`)
- **Locations**: `location:<lat_lon_or_city>` (e.g. `location:12.9716_77.5946`)
- **Edges**: `edge:<source_id>-><target_id>:<tx_hash_or_id>`

### 2.2 Strict Hop Semantics
- **1 edge = 1 hop**: Traversal depth strictly measures edge transitions, regardless of financial rail.
- A path from `wallet:0x1` to `wallet:0x2` to `upi:agent@upi` is exactly **2 hops** (1 crypto transfer edge + 1 cross-rail association edge).

### 2.3 Non-Inferential Cross-Rail Association Principle
- Cross-rail links (`CROSS_RAIL_ASSOCIATION`) represent **graph-derived analytical correlations** (such as exchange deposit-to-payout order logs, OTC settlement ledgers, or investigator-supplied links).
- **CRITICAL**: TRACEVAULT **never** asserts legal personhood, common ownership, or identity equivalence between a crypto wallet and a UPI VPA. Relationships remain strictly evidentiary and analytical.

### 2.4 Data Minimization & Prohibited Credential Protection
All graph nodes, edges, adapters, and serializers enforce strict sanitization against `PROHIBITED_CREDENTIAL_KEYS`:
- `upi_pin`, `pin`, `mpin`, `password`, `otp`, `cvv`, `card_cvv`, `seed_phrase`, `private_key`, `bank_password`.
- Ingesting or storing any prohibited credential raises immediate validation exceptions.

---

## 3. Component Architecture

### 3.1 Data Models (`app/graph/unified/models.py`)
- `FinancialRail`: `CRYPTO`, `UPI`, `FIAT`, `CROSS_RAIL`.
- `UnifiedNodeType`: `WALLET`, `UPI_VPA`, `ENTITY`, `VASP`, `MERCHANT`, `TRANSACTION`, `LOCATION`, `BANK`, `PAYMENT_APP`.
- `UnifiedEdgeType`: `SENT`, `RECEIVED`, `TRANSACTED_WITH`, `INTERACTED_WITH`, `ASSOCIATED_WITH`, `ATTRIBUTED_TO`, `LOCATED_NEAR`, `REGISTERED_WITH`, `CROSS_RAIL_ASSOCIATION`.
- `UnifiedNode`: Canonical multi-rail node with risk scores, forensic tags, and evidentiary references.
- `UnifiedEdge`: Canonical directed transfer or association edge.
- `CrossRailAssociation`: Explicit bridge structure linking nodes on different rails.
- `UnifiedGraphAnalysisResult`: Comprehensive result container with graph metrics, nodes, edges, paths, risk signals, and reasoning trace.

### 3.2 Graph Adapters (`app/graph/unified/adapters.py`)
- `CryptoGraphAdapter`: Converts `CommonTransaction` and VASP attributions to canonical nodes and edges.
- `UPIGraphAdapter`: Converts `UPITransaction` into VPA, merchant nodes, and transfer edges.
- `GeospatialGraphAdapter`: Converts `LocationSignal` into `LOCATION` nodes and `LOCATED_NEAR` edges.
- `CrossRailAdapter`: Normalizes cross-rail linkages into canonical `CROSS_RAIL_ASSOCIATION` edges.

### 3.3 Graph Builder & Merging Engine (`app/graph/unified/builder.py`)
- Built upon NetworkX `MultiDiGraph`.
- **Deduplication & Merge Policies**:
  - `risk_score`: Maximum risk score preserved (`max(existing, new)`).
  - `tags`: Mathematical set union.
  - `source_references` & `evidence_references`: Mathematical set union.
  - `metadata`: Key-value merge with prohibited credential scrubbing.

### 3.4 Traversal Engine (`app/graph/unified/traversal.py`)
- `get_subgraph_by_rail(rail)`: Rail-specific subgraph filtering.
- `find_all_paths_with_edges(source, target, max_depth)`: Path discovery with edge attributes and cross-rail indicators.
- `find_cross_rail_paths(start_node, max_depth)`: Multi-rail BFS discovery identifying paths bridging crypto and UPI.
- `find_vasp_associations(start_node, max_depth)`: Outbound traversal locating attributed VASP off-ramps.

### 3.5 Unified Investigation Engine (`app/graph/unified/engine.py`)
Executes an explainable **14-step deterministic reasoning process**:
1. *Ingest Case Metadata & Scope*
2. *Ingest Blockchain Transactions & Construct Crypto Nodes*
3. *Attribute Virtual Asset Service Providers (VASPs)*
4. *Ingest UPI Payments & Construct VPA/Merchant Nodes*
5. *Deduplicate Multi-Rail Entities & Normalize Identifiers*
6. *Ingest Geospatial Signals & Associate With Entities*
7. *Ingest Explicit Cross-Rail Associations*
8. *Build NetworkX Directed Investigation Graph*
9. *Compute Per-Rail & Cross-Rail Degree Metrics*
10. *Execute Rail-Aware Traversal & Discover Paths*
11. *Aggregate Multi-Rail Risk Signals*
12. *Synthesize Evidentiary References*
13. *Verify Graph Integrity & Security Sanitization*
14. *Produce Final Unified Investigation Result*

---

## 4. Synthetic Demonstration Scenarios (`app/graph/unified/scenarios.py`)

| Scenario ID | Title | Description | Rail Focus |
|---|---|---|---|
| `UNIFIED-DEMO-001` | Pure Crypto Peeling Chain | 3-hop ETH layering leading to Example Exchange (Regression parity) | Crypto Only |
| `UNIFIED-DEMO-002` | Pure UPI Mule Chain | Multi-hop UPI fan-out to crypto merchant POS | UPI Only |
| `UNIFIED-DEMO-003` | Multi-Rail Independent Datasets | Crypto + UPI unlinked concurrent activity (0 cross-rail links) | Multi-Rail Disconnected |
| `UNIFIED-DEMO-004` | Crypto Off-Ramp to UPI Cash-Out | Stolen ETH off-ramp linked via order record to UPI settlement VPA | Cross-Rail Bridge |
| `UNIFIED-DEMO-005` | Multi-Rail + Geospatial Anomaly | Crypto off-ramp with impossible travel anomaly across Indian cities | Cross-Rail + Geo |
| `UNIFIED-DEMO-006` | Shared VASP Settlement Hub | Multi-wallet ETH inputs to Nexus Global VASP with INR UPI payouts | Multi-Input Off-Ramp |
| `UNIFIED-DEMO-007` | Disconnected Component Integrity | Verifies zero false-positive edges between unlinked rails | Integrity Verification |
| `UNIFIED-DEMO-CONTROL` | Normal Benign Activity | Low-value, retail transactions across both crypto and UPI | Baseline Control |

---

## 5. API Reference

### 5.1 List Preset Scenarios
`GET /api/v1/investigations/unified-graph/scenarios`

**Response**:
```json
{
  "scenarios": [
    {
      "scenario_id": "UNIFIED-DEMO-001",
      "title": "Pure Crypto Layering to Exchange Deposit",
      "crypto_tx_count": 3,
      "upi_tx_count": 0,
      "cross_rail_association_count": 0
    },
    {
      "scenario_id": "UNIFIED-DEMO-004",
      "title": "Crypto Theft Off-Ramp to UPI P2P Cash-Out",
      "crypto_tx_count": 2,
      "upi_tx_count": 2,
      "cross_rail_association_count": 1
    }
  ]
}
```

### 5.2 Analyze Unified Graph
`POST /api/v1/investigations/unified-graph`

**Request Body (Preset Scenario)**:
```json
{
  "scenario_id": "UNIFIED-DEMO-004",
  "max_traversal_depth": 5
}
```

**Request Body (Custom Investigation)**:
```json
{
  "case_id": "CASE-CUSTOM-2026",
  "crypto_transactions": [...],
  "vasp_attributions": [...],
  "upi_transactions": [...],
  "cross_rail_associations": [...]
}
```

**Response**:
```json
{
  "case_id": "UNIFIED-DEMO-004",
  "graph_metadata": {
    "total_nodes": 6,
    "total_edges": 5,
    "node_counts_by_rail": { "CRYPTO": 3, "UPI": 3 },
    "has_cross_rail_bridges": true
  },
  "nodes": [...],
  "edges": [...],
  "paths": [...],
  "cross_rail_associations": [...],
  "risk_references": [...],
  "evidence_references": [...],
  "reasoning_trace": [
    "Step 1: Initialized multi-rail investigation analysis...",
    "Step 14: Successfully generated unified financial investigation analysis result."
  ]
}
```

---

## 6. Test Suite & Verification Results

- **Python Tests**: **179 passing** (`pytest intelligence-engine/tests`)
  - 32 new tests dedicated to Phase 15 unified graph models, adapters, builder deduplication, traversal, cytoscape export, 14-step reasoning trace, scenarios, and API routes.
  - Complete regression preservation across Ethereum adapter (10), behavioral intelligence (11), UPI foundation (12), UPI fraud rules (13), and geospatial intelligence (14).
- **Backend Tests**: **70 passing** across 17 test suites (`npm test` in `backend`).
- **Frontend Build**: **Clean build** (`npm run build` in `frontend`).
