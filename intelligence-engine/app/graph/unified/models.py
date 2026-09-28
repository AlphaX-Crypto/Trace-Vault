from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.analysis import EvidenceItem, RiskSignal
from app.upi.models import PROHIBITED_CREDENTIAL_KEYS


class FinancialRail(str, Enum):
    CRYPTO = "CRYPTO"
    UPI = "UPI"
    FIAT = "FIAT"
    CROSS_RAIL = "CROSS_RAIL"


class UnifiedNodeType(str, Enum):
    WALLET = "WALLET"
    UPI_VPA = "UPI_VPA"
    ENTITY = "ENTITY"
    VASP = "VASP"
    MERCHANT = "MERCHANT"
    TRANSACTION = "TRANSACTION"
    LOCATION = "LOCATION"
    BANK = "BANK"
    PAYMENT_APP = "PAYMENT_APP"


class UnifiedEdgeType(str, Enum):
    SENT = "SENT"
    RECEIVED = "RECEIVED"
    TRANSACTED_WITH = "TRANSACTED_WITH"
    INTERACTED_WITH = "INTERACTED_WITH"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    ATTRIBUTED_TO = "ATTRIBUTED_TO"
    LOCATED_NEAR = "LOCATED_NEAR"
    REGISTERED_WITH = "REGISTERED_WITH"
    CROSS_RAIL_ASSOCIATION = "CROSS_RAIL_ASSOCIATION"


def make_deterministic_node_id(node_type: str, identifier: str) -> str:
    """
    Constructs a canonical, deterministic node identifier.
    Guarantees consistent graph identity without random UUIDs.
    """
    clean_type = str(node_type).strip().lower()
    clean_id = str(identifier).strip().lower()
    if clean_type in ("wallet", "crypto"):
        return f"wallet:{clean_id}"
    elif clean_type in ("upi_vpa", "vpa", "upi"):
        return f"upi:{clean_id}"
    elif clean_type == "merchant":
        return f"merchant:{clean_id}"
    elif clean_type in ("vasp", "exchange"):
        return f"vasp:{clean_id}"
    elif clean_type == "location":
        return f"location:{clean_id}"
    elif clean_type == "bank":
        return f"bank:{clean_id}"
    elif clean_type in ("payment_app", "app"):
        return f"app:{clean_id}"
    elif clean_type == "transaction":
        return f"tx:{clean_id}"
    else:
        return f"entity:{clean_id}"


class UnifiedNode(BaseModel):
    """
    Canonical node in the unified multi-rail financial investigation graph.
    Represents an observed blockchain wallet, UPI VPA, entity, VASP, merchant, or location.
    Does NOT infer legal personhood or ownership.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    node_id: str = Field(..., description="Unique deterministic node identifier (e.g. wallet:0x123, upi:bob@upi)")
    node_type: str = Field(..., description="Classification from UnifiedNodeType")
    rail: str = Field(default=FinancialRail.CRYPTO.value, description="Financial rail: CRYPTO, UPI, FIAT, CROSS_RAIL")
    label: str = Field(..., description="Human-readable label for investigator visualization")
    entity_name: Optional[str] = Field(default=None, description="Resolved entity or exchange name if known")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0, description="Associated investigative risk score (0-100)")
    tags: List[str] = Field(default_factory=list, description="Forensic and descriptive tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Preserved rail-specific metadata")
    source_references: List[str] = Field(default_factory=list, description="Authoritative sources verifying this node")
    risk_references: List[str] = Field(default_factory=list, description="IDs of triggered risk signals")
    evidence_references: List[str] = Field(default_factory=list, description="IDs of supporting evidence items")

    @model_validator(mode="before")
    @classmethod
    def sanitize_credentials(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for k in data.keys():
                if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                    raise ValueError(f"Security Violation: Sensitive credential '{k}' must not be stored in graph nodes.")
            meta = data.get("metadata")
            if isinstance(meta, dict):
                for k in meta.keys():
                    if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                        raise ValueError(f"Security Violation: Sensitive credential '{k}' found in node metadata.")
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "node_type": self.node_type,
            "rail": self.rail,
            "label": self.label,
            "entity_name": self.entity_name,
            "risk_score": self.risk_score,
            "tags": self.tags,
            "metadata": self.metadata,
            "source_references": self.source_references,
            "risk_references": self.risk_references,
            "evidence_references": self.evidence_references,
        }


class UnifiedEdge(BaseModel):
    """
    Canonical directed edge in the unified multi-rail financial investigation graph.
    Represents an observed transaction transfer, structural association, or VASP attribution.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    edge_id: str = Field(..., description="Unique deterministic edge identifier")
    source: str = Field(..., description="Origin node identifier (source node_id)")
    target: str = Field(..., description="Destination node identifier (target node_id)")
    edge_type: str = Field(default=UnifiedEdgeType.TRANSACTED_WITH.value, description="Relationship typology")
    rail: str = Field(default=FinancialRail.CRYPTO.value, description="Associated financial rail")
    transaction_id: Optional[str] = Field(default=None, description="Authoritative transaction hash or RRN")
    timestamp: Optional[str] = Field(default=None, description="UTC ISO 8601 transaction execution timestamp")
    amount: Optional[float] = Field(default=None, ge=0.0, description="Transferred volume")
    currency: Optional[str] = Field(default=None, description="Denomination asset or fiat currency code")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom transfer and forensic metadata")
    evidence_references: List[str] = Field(default_factory=list, description="IDs of supporting evidence items")

    @model_validator(mode="before")
    @classmethod
    def sanitize_credentials(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for k in data.keys():
                if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                    raise ValueError(f"Security Violation: Sensitive credential '{k}' must not be stored in graph edges.")
            meta = data.get("metadata")
            if isinstance(meta, dict):
                for k in meta.keys():
                    if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                        raise ValueError(f"Security Violation: Sensitive credential '{k}' found in edge metadata.")
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "edge_id": self.edge_id,
            "source": self.source,
            "target": self.target,
            "edge_type": self.edge_type,
            "rail": self.rail,
            "transaction_id": self.transaction_id,
            "timestamp": self.timestamp,
            "amount": self.amount,
            "currency": self.currency,
            "metadata": self.metadata,
            "evidence_references": self.evidence_references,
        }


class CrossRailAssociation(BaseModel):
    """
    Explicit, structured cross-rail link between disparate financial rails.
    Represents an analytical association (e.g. crypto off-ramp deposit tied to a UPI payout).
    CRITICAL: Never automatically asserts shared legal ownership or human identity.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    source_node_id: str = Field(..., description="Origin node identifier on source rail")
    target_node_id: str = Field(..., description="Target node identifier on target rail")
    source_rail: str = Field(..., description="Origin rail (e.g. CRYPTO)")
    target_rail: str = Field(..., description="Destination rail (e.g. UPI)")
    association_type: str = Field(
        default=UnifiedEdgeType.CROSS_RAIL_ASSOCIATION.value,
        description="Relationship type classification",
    )
    confidence: float = Field(default=80.0, ge=0.0, le=100.0, description="Heuristic link confidence (0-100)")
    description: str = Field(
        default="Graph-derived analytical association connecting multi-rail entities.",
        description="Objective relationship summary",
    )
    evidence_references: List[str] = Field(default_factory=list, description="Evidentiary schedule item IDs")
    source: str = Field(default="synthetic_cross_rail_registry", description="Originating registry or case dossier")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Supporting correlation context")

    def to_edge(self) -> UnifiedEdge:
        """Converts cross-rail link into a canonical UnifiedEdge."""
        edge_id = f"cross-rail:{self.source_node_id}->{self.target_node_id}"
        return UnifiedEdge(
            edge_id=edge_id,
            source=self.source_node_id,
            target=self.target_node_id,
            edge_type=UnifiedEdgeType.CROSS_RAIL_ASSOCIATION.value,
            rail=FinancialRail.CROSS_RAIL.value,
            metadata={
                "confidence": self.confidence,
                "description": self.description,
                "source": self.source,
                "source_rail": self.source_rail,
                "target_rail": self.target_rail,
                "relationship_nature": "graph_derived_association_not_identity_proof",
                **self.metadata,
            },
            evidence_references=self.evidence_references,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_node_id": self.source_node_id,
            "target_node_id": self.target_node_id,
            "source_rail": self.source_rail,
            "target_rail": self.target_rail,
            "association_type": self.association_type,
            "confidence": self.confidence,
            "description": self.description,
            "evidence_references": self.evidence_references,
            "source": self.source,
            "metadata": self.metadata,
        }


class UnifiedGraphAnalysisResult(BaseModel):
    """
    Canonical multi-rail investigation graph analysis result.
    Synthesizes blockchain transactions, UPI payments, VASP attributions,
    geospatial signals, cross-rail links, and evidentiary traces.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    case_id: str = Field(..., description="Unique case identifier")
    graph_metadata: Dict[str, Any] = Field(default_factory=dict, description="Graph summary metrics")
    nodes: List[UnifiedNode] = Field(default_factory=list, description="Canonical multi-rail nodes")
    edges: List[UnifiedEdge] = Field(default_factory=list, description="Canonical multi-rail edges")
    paths: List[Dict[str, Any]] = Field(default_factory=list, description="Extracted traversal paths")
    cross_rail_associations: List[CrossRailAssociation] = Field(default_factory=list)
    risk_references: List[Dict[str, Any]] = Field(default_factory=list, description="Aggregated risk signals")
    evidence_references: List[str] = Field(default_factory=list, description="Supporting evidence references")
    reasoning_trace: List[str] = Field(default_factory=list, description="Deterministic 14-step reasoning trace")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Execution and audit metadata")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "graph_metadata": self.graph_metadata,
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "paths": self.paths,
            "cross_rail_associations": [a.to_dict() for a in self.cross_rail_associations],
            "risk_references": self.risk_references,
            "evidence_references": self.evidence_references,
            "reasoning_trace": self.reasoning_trace,
            "metadata": self.metadata,
        }
