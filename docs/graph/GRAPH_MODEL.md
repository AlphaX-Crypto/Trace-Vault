# Graph Model

The NetworkX Graph Engine represents blockchain data as a directed graph.

## Entities

- **Node**: Represents a Wallet or Entity Address.
- **Directed Edge**: Represents a Transaction between nodes.

## Attributes

### Node Attributes (Wallet/Entity)

- `address`: The blockchain address.
- `blockchain`: The network the address belongs to (e.g., ethereum, bitcoin).
- `entity_type`: Type of entity (e.g., VASP, Individual, Smart Contract).
- `entity_name`: Known name (if identified).
- `risk_score`: Calculated risk score for the node.

### Edge Attributes (Transaction)

- `transaction_hash`: Unique identifier for the transaction.
- `amount`: The amount of asset transferred.
- `asset`: The symbol/name of the asset transferred.
- `timestamp`: Time of the transaction.
- `blockchain`: The network where the transaction occurred.
- `transaction_type`: Classification of the transaction.
