# TRACEVAULT V2 — Canonical API Contract

**Service:** Python Intelligence Engine (`tracevault-intelligence`)  
**Base URL:** `http://localhost:8000` (or `http://intelligence-engine:8000` in Docker)  
**Specification Version:** 2.0.0  
**Data Contract Version:** Canonical V2

---

## 1. Health Check

### `GET /health`
Returns the operational health and reachability of the intelligence service.

#### Response `200 OK`
```json
{
  "status": "ok",
  "service": "tracevault-intelligence",
  "version": "0.1.0"
}
```

---

## 2. Wallet & Entity Analysis

### `POST /api/v1/analyze-wallet`
Initiates automated graph construction, BFS traversal, nearest VASP identification, multi-factor risk scoring, and evidence compilation for a target suspect identifier.

### Request Body (`AnalyzeWalletRequest`)
Content-Type: `application/json`

| Field | Type | Required | Default | Description |
|---|---|:---:|:---:|---|
| `case_id` | string | Yes | - | Unique case reference (e.g. `CYBER-001`, `CASE-2026-001`) |
| `wallet_address` | string | Yes | - | Target suspect cryptocurrency wallet address or account identifier |
| `blockchain` | string | No | `"ethereum"` | Target ledger or network (`ethereum`, `bitcoin`, `polygon`, etc.) |
| `max_hops` | integer | No | `3` | Maximum BFS traversal exploration depth (1 to 10) |
| `metadata` | object | No | `{}` | Additional case context, investigator notes, or reference parameters |

#### Request Example
```json
{
  "case_id": "CASE-2026-041",
  "wallet_address": "0x71F9A82D93AE84C2111111111111111111111111",
  "blockchain": "ethereum",
  "max_hops": 3,
  "metadata": {
    "priority": "HIGH",
    "investigator": "Officer T. JD"
  }
}
```

---

### Response Body (`AnalysisResult`)
Status: `200 OK`  
Content-Type: `application/json`

| Field | Type | Description |
|---|---|---|
| `analysis_id` | string \| null | Unique execution identifier |
| `case_id` | string | Case identifier associated with the request |
| `subject` | string | Investigated suspect wallet address |
| `wallet` | string | Backward-compatible alias for `subject` |
| `blockchain` | string | Target ledger analyzed |
| `status` | string | Execution status (e.g., `"Analysis complete"`) |
| `transactions` | array[`CommonTransaction`] | Normalized transactions analyzed across the graph |
| `graph` | object \| null | Graph visualization payload (`nodes`, `edges`) |
| `nearest_vasp` | object \| null | Primary nearest VASP attribution finding (`VaspAttribution`) |
| `attribution` | array[`VaspAttribution`] | All identified VASP and tagged service associations |
| `trace_paths` | array[`TracePath`] | Ordered paths from subject to tagged entities (`nodes`, `edges`) |
| `path` | array | Backward-compatible sequence of primary path nodes/addresses |
| `risk` | object | Multi-factor risk calculation (`score`, `level`, `signals`, `indicators`) |
| `confidence` | object | Attribution confidence breakdown and heuristic metadata |
| `evidence` | array[`EvidenceItem`] | Evidentiary schedule for court dossiers and Section 91 CrPC notices |
| `metadata` | object | Execution runtime metadata, timestamps, and data provider sources |

#### Response Example
```json
{
  "analysis_id": "ANL-2026-0928-8F31C",
  "case_id": "CASE-2026-041",
  "subject": "0x71f9a82d93ae84c2111111111111111111111111",
  "wallet": "0x71f9a82d93ae84c2111111111111111111111111",
  "blockchain": "ethereum",
  "status": "Analysis complete",
  "transactions": [
    {
      "transaction_hash": "0xtxprimary18f31c9a4",
      "blockchain": "ethereum",
      "timestamp": "2026-09-28T01:00:00Z",
      "from_address": "0x71f9a82d93ae84c2111111111111111111111111",
      "to_address": "0x84c2e91a0f17bd22222222222222222222222222",
      "asset": "ETH",
      "amount": 2.4,
      "transaction_type": "transfer",
      "block_number": 19283740,
      "source": "mock_ethereum_adapter",
      "metadata": {}
    }
  ],
  "graph": {
    "nodes": [
      {
        "id": "0x71f9a82d93ae84c2111111111111111111111111",
        "identifier": "0x71f9a82d93ae84c2111111111111111111111111",
        "address": "0x71f9a82d93ae84c2111111111111111111111111",
        "blockchain": "ethereum",
        "entity_type": "WALLET",
        "entity_name": "Suspect Wallet",
        "risk_score": 67.0,
        "tags": ["suspect", "subject_origin"],
        "metadata": {}
      }
    ],
    "edges": [
      {
        "id": "0xtxprimary18f31c9a4",
        "from_node": "0x71f9a82d93ae84c2111111111111111111111111",
        "to_node": "0x84c2e91a0f17bd22222222222222222222222222",
        "transaction_hash": "0xtxprimary18f31c9a4",
        "amount": 2.4,
        "asset": "ETH",
        "timestamp": "2026-09-28T01:00:00Z",
        "blockchain": "ethereum",
        "transaction_type": "transfer",
        "metadata": {}
      }
    ]
  },
  "nearest_vasp": {
    "entity": "Example Exchange",
    "name": "Example Exchange",
    "entity_type": "VASP",
    "distance": 3,
    "hops": 3,
    "path": [
      "0x71f9a82d93ae84c2111111111111111111111111",
      "0x84c2e91a0f17bd22222222222222222222222222",
      "0x3af172de9b28c433333333333333333333333333",
      "0x92de8841fc11a744444444444444444444444444"
    ],
    "confidence": 82.0,
    "confidence_label": "High confidence",
    "supporting_evidence": [
      "Direct deposit flow into known tagged cluster",
      "Hop proximity <= 3 hops"
    ],
    "source": "Mock tagged entity dataset",
    "explanation": "Observed transaction path terminates at an address associated with Example Exchange.",
    "metadata": {}
  },
  "attribution": [
    {
      "entity": "Example Exchange",
      "name": "Example Exchange",
      "entity_type": "VASP",
      "distance": 3,
      "hops": 3,
      "confidence": 82.0,
      "confidence_label": "High confidence",
      "supporting_evidence": ["Direct deposit flow into known tagged cluster"],
      "source": "Mock tagged entity dataset",
      "explanation": "Observed transaction path terminates at an address associated with Example Exchange.",
      "metadata": {}
    }
  ],
  "trace_paths": [
    {
      "nodes": [
        {
          "id": "0x71f9a82d93ae84c2111111111111111111111111",
          "identifier": "0x71f9a82d93ae84c2111111111111111111111111",
          "address": "0x71f9a82d93ae84c2111111111111111111111111",
          "label": "Suspect Wallet",
          "role": "Origin under review",
          "entity_type": "WALLET",
          "hop": 0,
          "amount": null,
          "metadata": {}
        },
        {
          "id": "0x84c2e91a0f17bd22222222222222222222222222",
          "identifier": "0x84c2e91a0f17bd22222222222222222222222222",
          "address": "0x84c2e91a0f17bd22222222222222222222222222",
          "label": "Intermediary A",
          "role": "Forwarding wallet",
          "entity_type": "INTERMEDIARY",
          "hop": 1,
          "amount": "2.4 ETH",
          "metadata": {}
        }
      ],
      "edges": [
        {
          "from_node": "0x71f9a82d93ae84c2111111111111111111111111",
          "to_node": "0x84c2e91a0f17bd22222222222222222222222222",
          "from_address": "0x71f9a82d93ae84c2111111111111111111111111",
          "to_address": "0x84c2e91a0f17bd22222222222222222222222222",
          "transaction_hash": "0xtxprimary18f31c9a4",
          "amount": 2.4,
          "asset": "ETH",
          "timestamp": "2026-09-28T01:00:00Z",
          "metadata": {}
        }
      ],
      "hop_count": 3,
      "source": "0x71f9a82d93ae84c2111111111111111111111111",
      "destination": "0x92de8841fc11a7444444444444444444444444444",
      "metadata": {}
    }
  ],
  "path": [
    "0x71f9a82d93ae84c2111111111111111111111111",
    "0x84c2e91a0f17bd22222222222222222222222222"
  ],
  "risk": {
    "score": 67.0,
    "level": "HIGH",
    "signals": [
      {
        "id": "RS-01",
        "signal_type": "MIXER_EXPOSURE",
        "score": 30.0,
        "contribution": 30.0,
        "description": "Mixer exposure",
        "severity": "HIGH",
        "entity": "0xb91c72a8f0d55e",
        "evidence": "Transaction path",
        "status": "Detected",
        "reason": "A connected path displays patterns consistent with mixer interaction.",
        "metadata": {}
      },
      {
        "id": "RS-02",
        "signal_type": "INTERMEDIARY_HOPS",
        "score": 10.0,
        "contribution": 10.0,
        "description": "Multiple intermediary hops",
        "severity": "LOW",
        "entity": "Transaction path",
        "evidence": "Path analysis",
        "status": "Supporting",
        "reason": "Route includes multiple forwarding hops before reaching destination.",
        "metadata": {}
      }
    ],
    "indicators": [
      "Mixer interaction detected (+30)",
      "Multiple intermediary hops (+10)",
      "Baseline investigative risk (+10)"
    ],
    "explanation": "High risk score driven by mixer proximity and rapid multi-hop peeling.",
    "metadata": {}
  },
  "confidence": {
    "base_score": 90.0,
    "hop_penalty": 30.0,
    "entity_penalty": 0.0,
    "final_confidence": 82.0
  },
  "evidence": [
    {
      "id": "EV-001",
      "type": "TRANSACTION",
      "description": "Outgoing transfer of 2.4 ETH",
      "source": "Mock blockchain dataset",
      "timestamp": "2026-09-28T01:00:00Z",
      "status": "Verified",
      "relevance": "CRITICAL",
      "transaction_hash": "0xtxprimary18f31c9a4",
      "block_number": 19283740,
      "from_address": "0x71f9a82d93ae84c2111111111111111111111111",
      "to_address": "0x84c2e91a0f17bd22222222222222222222222222",
      "amount": 2.4,
      "asset": "ETH",
      "entity": "Suspect Wallet -> Intermediary A",
      "metadata": {}
    }
  ],
  "metadata": {
    "engine": "TRACEVAULT NetworkX Intelligence Engine v2.0",
    "timestamp": "2026-09-28T01:10:00Z"
  }
}
```

---

## 3. Error Responses

All error payloads follow standardized RFC 7807 / FastAPI JSON responses:

### 400 Bad Request
Occurs when input validation fails (e.g. missing wallet address, invalid format, or unsupported blockchain).
```json
{
  "detail": "Wallet address is required and must follow standard format."
}
```

### 422 Unprocessable Entity
Occurs when request body schema validation fails according to Pydantic constraints.
```json
{
  "detail": [
    {
      "loc": ["body", "wallet_address"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
Occurs when an unhandled server error occurs during graph analysis or algorithmic execution.
```json
{
  "detail": "An internal error occurred during graph analysis."
}
```
