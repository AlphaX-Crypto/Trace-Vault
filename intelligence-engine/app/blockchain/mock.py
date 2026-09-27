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


class MockBlockchainAdapter:
    """
    Controlled Mock Blockchain Adapter providing test cryptocurrency transactions
    and tagged entity registries for the NetworkX Intelligence Engine.
    """
    def __init__(self, transactions: Optional[List[Dict[str, Any]]] = None, entities: Optional[Dict[str, Dict[str, Any]]] = None):
        self.transactions = transactions if transactions is not None else list(MOCK_TRANSACTIONS)
        self.entities = entities if entities is not None else dict(MOCK_ENTITIES)

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
        return None
