from decimal import Decimal
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class FinancialRail:
    """Supported financial rails within TRACEVAULT."""
    CRYPTO = "CRYPTO"
    UPI = "UPI"
    BANK = "BANK"


class FinancialEvent(BaseModel):
    """
    Unified Common Financial Event abstraction for TRACEVAULT.
    Serves as the cross-rail umbrella model representing both decentralized
    blockchain transactions and centralized fiat/instant payment events (UPI, NEFT/RTGS).
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    event_id: str = Field(..., description="Canonical unique event identifier across rails")
    source: str = Field(..., description="Originating provider or ingest adapter (e.g. mock_upi, ethereum_indexer)")
    rail: str = Field(..., description="Financial rail classification: CRYPTO, UPI, BANK")
    timestamp: str = Field(..., description="UTC ISO 8601 timestamp of execution")
    amount: Decimal = Field(..., ge=Decimal("0.0"), description="Precise numeric transaction amount")
    currency: str = Field(..., description="Asset or fiat currency code (INR, ETH, BTC, USDT)")
    sender_entity: str = Field(..., description="Originating party identifier (VPA, wallet address, account)")
    receiver_entity: str = Field(..., description="Destination party identifier (VPA, wallet address, account)")
    transaction_type: str = Field(default="TRANSFER", description="Event typology (P2P, P2M, TRANSFER, REFUND, etc.)")
    status: str = Field(default="SUCCESS", description="Canonical execution status (SUCCESS, FAILED, PENDING, REVERSED)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Rail-specific and provider forensic context")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "source": self.source,
            "rail": self.rail,
            "timestamp": self.timestamp,
            "amount": str(self.amount),
            "currency": self.currency,
            "sender_entity": self.sender_entity,
            "receiver_entity": self.receiver_entity,
            "transaction_type": self.transaction_type,
            "status": self.status,
            "metadata": self.metadata,
        }
