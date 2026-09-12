from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from app.models.entity import EntityType


class GraphNode(BaseModel):
    """Represents a Node (Wallet or Entity) in the transaction graph."""
    address: str = Field(..., description="Wallet or entity blockchain address")
    blockchain: str = Field(default="ethereum", description="Blockchain network")
    entity_type: EntityType = Field(default=EntityType.UNKNOWN, description="Entity type classification")
    entity_name: Optional[str] = Field(default=None, description="Known entity name e.g. Binance")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Associated risk score")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional custom node metadata")

    def to_dict(self) -> Dict[str, Any]:
        """Convert node instance to dictionary representation for NetworkX node data."""
        return {
            "address": self.address.lower(),
            "blockchain": self.blockchain,
            "entity_type": self.entity_type.value,
            "entity_name": self.entity_name,
            "risk_score": self.risk_score,
            "metadata": self.metadata,
        }


class GraphEdge(BaseModel):
    """Represents a directed Edge (Transaction) between two graph nodes."""
    transaction_hash: str = Field(..., description="Unique transaction hash")
    amount: float = Field(..., ge=0.0, description="Transferred amount")
    asset: str = Field(default="ETH", description="Transferred asset symbol")
    timestamp: str = Field(..., description="ISO 8601 timestamp string")
    blockchain: str = Field(default="ethereum", description="Blockchain network")
    transaction_type: str = Field(default="transfer", description="Type of transaction")

    def to_dict(self) -> Dict[str, Any]:
        """Convert edge instance to dictionary representation for NetworkX edge data."""
        return {
            "transaction_hash": self.transaction_hash,
            "amount": self.amount,
            "asset": self.asset,
            "timestamp": self.timestamp,
            "blockchain": self.blockchain,
            "transaction_type": self.transaction_type,
        }

