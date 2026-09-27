from typing import Any, Dict, List, Optional

MOCK_TRANSACTIONS: List[Dict[str, Any]] = [
    {
        "hash": "tx001",
        "chain": "ethereum",
        "time": "2026-09-08T10:00:00Z",
        "from": "A",
        "to": "B",
        "coin": "ETH",
        "value": 10.5,
        "type": "transfer",
        "block": 1000001,
    },
    {
        "hash": "tx002",
        "chain": "ethereum",
        "time": "2026-09-08T10:15:00Z",
        "from": "B",
        "to": "C",
        "coin": "ETH",
        "value": 10.0,
        "type": "transfer",
        "block": 1000005,
    },
    {
        "hash": "tx003",
        "chain": "ethereum",
        "time": "2026-09-08T10:30:00Z",
        "from": "C",
        "to": "EXCHANGE_DEPOSIT",
        "coin": "ETH",
        "value": 9.5,
        "type": "transfer",
        "block": 1000010,
    },
    {
        "hash": "tx004",
        "chain": "ethereum",
        "time": "2026-09-08T10:45:00Z",
        "from": "A",
        "to": "MIXER_1",
        "coin": "ETH",
        "value": 50.0,
        "type": "transfer",
        "block": 1000020,
    },
]

MOCK_ENTITIES: Dict[str, Dict[str, Any]] = {
    "EXCHANGE_DEPOSIT": {
        "name": "Example Exchange",
        "type": "DEPOSIT_WALLET",
    },
    "MIXER_1": {
        "name": "Tornado Cash Mock",
        "type": "MIXER",
    },
}


from app.attribution.registry import VaspRegistry


class MockBlockchainAdapter:
    """
    Controlled Mock Blockchain Adapter providing test cryptocurrency transactions
    and tagged entity registries for the NetworkX Intelligence Engine.
    """
    def __init__(
        self,
        transactions: Optional[List[Dict[str, Any]]] = None,
        entities: Optional[Dict[str, Dict[str, Any]]] = None,
        registry: Optional[VaspRegistry] = None,
    ):
        self.transactions = transactions if transactions is not None else list(MOCK_TRANSACTIONS)
        self.registry = registry if registry is not None else VaspRegistry()
        self.entities = dict(entities) if entities is not None else dict(MOCK_ENTITIES)

    def get_transactions(self, address: str) -> List[Dict[str, Any]]:
        """Return all transactions where address is sender or receiver (case-insensitive)."""
        addr_clean = address.strip().lower()
        return [
            tx for tx in self.transactions
            if tx.get("from", "").strip().lower() == addr_clean or tx.get("to", "").strip().lower() == addr_clean
        ]

    def get_all_transactions(self) -> List[Dict[str, Any]]:
        """Return complete list of transactions in mock ledger."""
        return list(self.transactions)

    def get_entity_info(self, address: str) -> Optional[Dict[str, Any]]:
        """Lookup tagged entity metadata by address (case-insensitive)."""
        addr_clean = address.strip().lower()
        for key, val in self.entities.items():
            if key.strip().lower() == addr_clean:
                return val

        # Fallback to registry lookup
        if self.registry:
            reg_entry = self.registry.lookup(addr_clean)
            if reg_entry:
                return {
                    "name": reg_entry.vasp_name,
                    "entity_name": reg_entry.entity_name,
                    "type": reg_entry.entity_type,
                    "source": reg_entry.source,
                    "updated_at": reg_entry.updated_at,
                    "risk_score": reg_entry.risk_score,
                    "tags": reg_entry.tags,
                    "metadata": reg_entry.metadata,
                }
        return None
