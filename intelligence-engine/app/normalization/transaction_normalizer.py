from typing import Dict
from app.models.transaction import NormalizedTransaction

class TransactionNormalizer:
    @staticmethod
    def normalize_mock(raw_tx: Dict) -> NormalizedTransaction:
        return NormalizedTransaction(
            transaction_hash=raw_tx["hash"],
            blockchain=raw_tx["chain"],
            timestamp=raw_tx["time"],
            from_address=raw_tx["from"],
            to_address=raw_tx["to"],
            asset=raw_tx["coin"],
            amount=raw_tx["value"],
            transaction_type=raw_tx["type"],
            block_number=raw_tx["block"],
            source="mock"
        )
