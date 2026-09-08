from typing import List, Dict

MOCK_TRANSACTIONS = [
    {
        "hash": "tx001",
        "chain": "ethereum",
        "time": "2026-09-08T10:00:00Z",
        "from": "A",
        "to": "B",
        "coin": "ETH",
        "value": 10.5,
        "type": "transfer",
        "block": 1000001
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
        "block": 1000005
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
        "block": 1000010
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
        "block": 1000020
    }
]

MOCK_ENTITIES = {
    "EXCHANGE_DEPOSIT": {
        "name": "Example Exchange",
        "type": "DEPOSIT_WALLET"
    },
    "MIXER_1": {
        "name": "Tornado Cash Mock",
        "type": "MIXER"
    }
}

class MockBlockchainAdapter:
    def get_transactions(self, address: str) -> List[Dict]:
        return [tx for tx in MOCK_TRANSACTIONS if tx["from"] == address or tx["to"] == address]

    def get_all_transactions(self) -> List[Dict]:
        return MOCK_TRANSACTIONS

    def get_entity_info(self, address: str):
        return MOCK_ENTITIES.get(address)
