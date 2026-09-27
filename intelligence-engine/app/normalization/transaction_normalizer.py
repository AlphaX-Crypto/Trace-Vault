from typing import Any, Dict
from app.models.transaction import CommonTransaction


class TransactionNormalizer:
    """
    Normalizes heterogeneous raw blockchain/financial transaction records
    into the canonical CommonTransaction model.
    """

    @staticmethod
    def normalize_mock(raw_tx: Dict[str, Any]) -> CommonTransaction:
        """
        Converts raw mock/ledger transaction dictionary into CommonTransaction.
        Handles alternate field names (e.g. hash vs transaction_hash, value vs amount).
        """
        tx_hash = raw_tx.get("hash") or raw_tx.get("transaction_hash", "")
        chain = raw_tx.get("chain") or raw_tx.get("blockchain", "ethereum")
        timestamp = raw_tx.get("time") or raw_tx.get("timestamp", "1970-01-01T00:00:00Z")
        from_addr = raw_tx.get("from") or raw_tx.get("from_address", "")
        to_addr = raw_tx.get("to") or raw_tx.get("to_address", "")
        asset = raw_tx.get("coin") or raw_tx.get("asset", "ETH")
        amount = float(raw_tx.get("value") if raw_tx.get("value") is not None else raw_tx.get("amount", 0.0))
        tx_type = raw_tx.get("type") or raw_tx.get("transaction_type", "transfer")
        block = raw_tx.get("block") or raw_tx.get("block_number")
        source = raw_tx.get("source", "mock_adapter")
        metadata = raw_tx.get("metadata", {})

        return CommonTransaction(
            transaction_hash=str(tx_hash),
            blockchain=str(chain).lower(),
            timestamp=str(timestamp),
            from_address=str(from_addr).strip(),
            to_address=str(to_addr).strip(),
            asset=str(asset),
            amount=amount,
            transaction_type=str(tx_type),
            block_number=int(block) if block is not None else None,
            source=str(source),
            metadata=dict(metadata),
        )
