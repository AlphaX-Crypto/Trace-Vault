# API Contract

## Initial Python Endpoint

**POST** `/api/v1/analyze-wallet`

Initiates the analysis of a given wallet address on a specified blockchain.

### Request Body

```json
{
  "case_id": "CYBER-001",
  "blockchain": "ethereum",
  "wallet_address": "0x..."
}
```

### Response Body

```json
{
  "case_id": "CYBER-001",
  "wallet": "0x...",
  "blockchain": "ethereum",
  "nearest_vasp": {
    "name": "Binance",
    "distance": 2,
    "confidence": 85.5
  },
  "risk": {
    "score": 75.0,
    "level": "HIGH"
  },
  "path": [
    {
      "from": "0x...",
      "to": "0x...",
      "transaction_hash": "0x..."
    },
    {
      "from": "0x...",
      "to": "Binance Hot Wallet",
      "transaction_hash": "0x..."
    }
  ]
}
```
