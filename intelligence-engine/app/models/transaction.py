from datetime import datetime
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class CommonTransaction(BaseModel):
    """
    Canonical normalized financial transaction model for TRACEVAULT.
    Supports current cryptocurrency ledgers (Ethereum, Bitcoin, etc.) and
    is extensible for future financial rails (UPI, banking, etc.) via metadata.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    transaction_hash: str = Field(..., description="Unique transaction hash or identifier (tx_hash, UTR, RRN)")
    blockchain: str = Field(default="ethereum", description="Blockchain network or financial rail name")
    timestamp: Union[datetime, str] = Field(..., description="UTC transaction timestamp (ISO 8601 or datetime)")
    from_address: str = Field(..., description="Originating account or wallet address")
    to_address: str = Field(..., description="Destination account or wallet address")
    asset: str = Field(default="ETH", description="Asset or currency symbol (ETH, BTC, USDT, INR)")
    amount: float = Field(..., ge=0.0, description="Transferred volume in standard token units")
    transaction_type: str = Field(default="transfer", description="Classification (transfer, contract_call, p2p, merchant)")
    block_number: Optional[int] = Field(default=None, description="Blockchain block height if applicable")
    source: str = Field(default="blockchain", description="Data provider or ingest adapter source name")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Extensible rail-specific metadata")

    def to_dict(self) -> Dict[str, Any]:
        """Convert transaction instance to standard dictionary representation."""
        ts_str = self.timestamp.isoformat() if hasattr(self.timestamp, "isoformat") else str(self.timestamp)
        return {
            "transaction_hash": self.transaction_hash,
            "blockchain": self.blockchain,
            "timestamp": ts_str,
            "from_address": self.from_address.lower(),
            "to_address": self.to_address.lower(),
            "asset": self.asset,
            "amount": self.amount,
            "transaction_type": self.transaction_type,
            "block_number": self.block_number,
            "source": self.source,
            "metadata": self.metadata,
        }


# Backward compatibility alias for existing code
Transaction = CommonTransaction
