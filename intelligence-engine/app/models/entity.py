from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class EntityType(str, Enum):
    """Classification of observed entities in the transaction graph."""
    WALLET = "WALLET"
    VASP = "VASP"
    EXCHANGE = "EXCHANGE"
    DEPOSIT_WALLET = "DEPOSIT_WALLET"
    MIXER = "MIXER"
    INTERMEDIARY = "INTERMEDIARY"
    MERCHANT = "MERCHANT"
    MULE_ACCOUNT = "MULE_ACCOUNT"
    SMART_CONTRACT = "SMART_CONTRACT"
    UNKNOWN = "UNKNOWN"


class Entity(BaseModel):
    """
    Represents an identified or observed entity node (wallet, exchange, service).
    Distinguishes on-chain identifier from potential real-world association.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    id: Optional[str] = Field(default=None, description="Unique internal entity ID")
    identifier: str = Field(..., description="On-chain address or network account identifier")
    entity_type: EntityType = Field(default=EntityType.UNKNOWN, description="Entity classification")
    name: Optional[str] = Field(default=None, description="Known entity name e.g. Binance, Tornado Cash")
    blockchain: Optional[str] = Field(default="ethereum", description="Blockchain network or financial rail")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Calculated or known risk rating")
    tags: List[str] = Field(default_factory=list, description="Descriptive labels and category tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional entity intelligence attributes")

    @property
    def address(self) -> str:
        """Backward-compatibility property returning lowercased identifier."""
        return self.identifier.lower()

    def to_dict(self) -> Dict[str, Any]:
        """Convert entity instance to standard dictionary representation."""
        return {
            "id": self.id,
            "identifier": self.identifier.lower(),
            "address": self.identifier.lower(),
            "entity_type": self.entity_type.value,
            "name": self.name,
            "blockchain": self.blockchain,
            "risk_score": self.risk_score,
            "tags": self.tags,
            "metadata": self.metadata,
        }
