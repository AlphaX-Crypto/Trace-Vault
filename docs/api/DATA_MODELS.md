# Data Models

## Normalized Transaction Model

This is the common transaction model used across the Intelligence Engine to normalize data from various blockchain adapters.

```json
{
  "transaction_hash": "string",
  "blockchain": "string",
  "timestamp": "string (ISO 8601)",
  "from_address": "string",
  "to_address": "string",
  "asset": "string (e.g., ETH, USDT)",
  "amount": "number",
  "transaction_type": "string (e.g., transfer, contract_call)",
  "block_number": "number | null",
  "source": "string"
}
```

This model acts as a contract between the blockchain data adapters and the core analysis/graph engines.
