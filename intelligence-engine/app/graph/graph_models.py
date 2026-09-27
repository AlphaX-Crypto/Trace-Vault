from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.entity import EntityType


class GraphNode(BaseModel):
    """
    Represents a Node (Wallet or Entity) in the NetworkX transaction graph.
    Maintains backward compatibility with address/identifier interchangeably.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    id: Optional[str] = Field(default=None, description="Unique node ID")
    identifier: Optional[str] = Field(default=None, description="Wallet or entity blockchain address / account identifier")
    address: Optional[str] = Field(default=None, description="Blockchain address (backward compatibility alias)")
    blockchain: str = Field(default="ethereum", description="Blockchain network or rail")
    entity_type: EntityType = Field(default=EntityType.UNKNOWN, description="Entity type classification")
    entity_name: Optional[str] = Field(default=None, description="Known entity name e.g. Binance")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Associated risk score")
    tags: List[str] = Field(default_factory=list, description="Descriptive labels and category tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional custom node metadata")

    @model_validator(mode="before")
    @classmethod
    def harmonize_identifier_and_address(cls, data: Any) -> Any:
        if isinstance(data, dict):
            ident = data.get("identifier") or data.get("address")
            if ident is not None:
                ident_str = str(ident).lower()
                data["identifier"] = ident_str
                data["address"] = ident_str
                if not data.get("id"):
                    data["id"] = ident_str
        return data

    def to_dict(self) -> Dict[str, Any]:
        """Convert node instance to dictionary representation for NetworkX node data."""
        addr = (self.identifier or self.address or "").lower()
        return {
            "id": self.id or addr,
            "identifier": addr,
            "address": addr,
            "blockchain": self.blockchain,
            "entity_type": self.entity_type.value if hasattr(self.entity_type, "value") else str(self.entity_type),
            "entity_name": self.entity_name,
            "risk_score": self.risk_score,
            "tags": self.tags,
            "metadata": self.metadata,
        }


class GraphEdge(BaseModel):
    """
    Represents a directed Edge (Transaction) between two graph nodes in the NetworkX graph.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    id: Optional[str] = Field(default=None, description="Unique edge ID or transaction hash")
    from_node: Optional[str] = Field(default=None, description="Originating node identifier")
    to_node: Optional[str] = Field(default=None, description="Destination node identifier")
    transaction_hash: str = Field(..., description="Unique transaction hash")
    amount: float = Field(..., ge=0.0, description="Transferred amount")
    asset: str = Field(default="ETH", description="Transferred asset symbol")
    timestamp: str = Field(..., description="ISO 8601 timestamp string")
    blockchain: str = Field(default="ethereum", description="Blockchain network")
    transaction_type: str = Field(default="transfer", description="Type of transaction")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom edge metadata")

    @model_validator(mode="before")
    @classmethod
    def harmonize_edge_identifiers(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("id") and data.get("transaction_hash"):
                data["id"] = data["transaction_hash"]
        return data

    def to_dict(self) -> Dict[str, Any]:
        """Convert edge instance to dictionary representation for NetworkX edge data."""
        return {
            "id": self.id or self.transaction_hash,
            "from_node": self.from_node.lower() if self.from_node else None,
            "to_node": self.to_node.lower() if self.to_node else None,
            "transaction_hash": self.transaction_hash,
            "amount": self.amount,
            "asset": self.asset,
            "timestamp": self.timestamp,
            "blockchain": self.blockchain,
            "transaction_type": self.transaction_type,
            "metadata": self.metadata,
        }
