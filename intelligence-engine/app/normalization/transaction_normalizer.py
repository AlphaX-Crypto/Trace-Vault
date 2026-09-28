from datetime import datetime, timezone
from typing import Any, Dict
from app.models.transaction import CommonTransaction


class TransactionNormalizer:
    """
    Normalizes heterogeneous raw blockchain/financial transaction records
    into the canonical CommonTransaction model.
    """

    @staticmethod
    def normalize_ethereum(raw_tx: Dict[str, Any]) -> CommonTransaction:
        """
        Converts real Ethereum indexer (Etherscan/Blockscout) transactions
        into the canonical CommonTransaction model.
        Converts Wei (10^18) to ETH and Unix epoch timeStamp to ISO 8601 UTC.
        """
        tx_hash = raw_tx.get("hash") or raw_tx.get("transaction_hash", "")
        chain = "ethereum"

        # Timestamp normalization (epoch seconds -> ISO 8601 UTC)
        ts_raw = raw_tx.get("timeStamp") or raw_tx.get("timestamp")
        if ts_raw:
            try:
                ts_int = int(ts_raw)
                timestamp = datetime.fromtimestamp(ts_int, tz=timezone.utc).isoformat()
            except (ValueError, TypeError):
                timestamp = str(ts_raw)
        else:
            timestamp = "1970-01-01T00:00:00Z"

        from_addr = raw_tx.get("from") or raw_tx.get("from_address", "")
        to_addr = raw_tx.get("to") or raw_tx.get("to_address", "")
        asset = raw_tx.get("tokenSymbol") or raw_tx.get("asset") or "ETH"

        # Amount normalization (Wei to ETH if value is large integer or standard wei)
        val_raw = raw_tx.get("value")
        if val_raw is not None:
            try:
                # Etherscan/Blockscout represents native transfers in Wei
                val_int = int(val_raw)
                amount = float(val_int) / 1e18
            except (ValueError, TypeError):
                try:
                    amount = float(val_raw)
                except (ValueError, TypeError):
                    amount = 0.0
        else:
            amount = float(raw_tx.get("amount", 0.0))

        # Block number
        block_raw = raw_tx.get("blockNumber") or raw_tx.get("block")
        block_num = None
        if block_raw is not None:
            try:
                block_num = int(block_raw)
            except (ValueError, TypeError):
                block_num = None

        # Transaction type heuristic
        input_data = raw_tx.get("input", "0x")
        if input_data and input_data not in ("0x", "0x0"):
            tx_type = "contract_call"
        else:
            tx_type = "transfer"

        # Metadata preservation
        metadata = dict(raw_tx.get("metadata", {}))
        for k in ("gas", "gasPrice", "gasUsed", "isError", "txreceipt_status", "confirmations", "nonce"):
            if k in raw_tx:
                metadata[k] = raw_tx[k]

        source = raw_tx.get("source", "ethereum_indexer")

        return CommonTransaction(
            transaction_hash=str(tx_hash),
            blockchain=chain,
            timestamp=str(timestamp),
            from_address=str(from_addr).strip(),
            to_address=str(to_addr).strip(),
            asset=str(asset),
            amount=amount,
            transaction_type=tx_type,
            block_number=block_num,
            source=str(source),
            metadata=metadata,
        )

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

    @classmethod
    def normalize(cls, raw_tx: Dict[str, Any]) -> CommonTransaction:
        """
        Intelligently detects transaction payload structure and delegates
        to the appropriate specialized normalizer.
        """
        if (
            "timeStamp" in raw_tx
            or "blockNumber" in raw_tx
            or raw_tx.get("source") in ("ethereum_indexer", "etherscan", "blockscout")
        ):
            return cls.normalize_ethereum(raw_tx)
        return cls.normalize_mock(raw_tx)

