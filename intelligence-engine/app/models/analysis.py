from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.transaction import CommonTransaction


class PathNode(BaseModel):
    """
    Represents a single hop node in an investigative trace path.
    Preserves graph context, identifier, hop distance, and attributed role.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    id: Optional[str] = Field(default=None, description="Unique node ID")
    identifier: Optional[str] = Field(default=None, description="On-chain wallet or entity address")
    address: Optional[str] = Field(default=None, description="Backward compatibility address field")
    label: Optional[str] = Field(default=None, description="Human-readable label (e.g. Suspect Wallet, Intermediary A)")
    role: Optional[str] = Field(default=None, description="Investigative role classification")
    entity_type: Optional[str] = Field(default="UNKNOWN", description="Underlying entity type")
    entity_name: Optional[str] = Field(default=None, description="Known entity name if resolved")
    hop: int = Field(default=0, ge=0, description="Hop distance relative to the subject wallet (0 = subject)")
    amount: Optional[str] = Field(default=None, description="Display flow amount associated with node")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom node context")

    @model_validator(mode="before")
    @classmethod
    def harmonize_node_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            ident = data.get("identifier") or data.get("address")
            if ident is not None:
                ident_clean = str(ident).lower()
                data["identifier"] = ident_clean
                data["address"] = ident_clean
                if not data.get("id"):
                    data["id"] = ident_clean
            if not data.get("label"):
                data["label"] = data.get("entity_name") or data.get("role") or data.get("identifier")
            if not data.get("role"):
                data["role"] = data.get("entity_type", "UNKNOWN")
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "identifier": self.identifier,
            "address": self.address,
            "label": self.label,
            "role": self.role,
            "entity_type": self.entity_type,
            "entity_name": self.entity_name,
            "hop": self.hop,
            "amount": self.amount,
            "metadata": self.metadata,
        }


class PathEdge(BaseModel):
    """
    Represents a directed transaction transfer along an investigative trace path.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    from_node: Optional[str] = Field(default=None, description="Originating node address")
    to_node: Optional[str] = Field(default=None, description="Receiving node address")
    from_address: Optional[str] = Field(default=None, description="Backward compatibility from address")
    to_address: Optional[str] = Field(default=None, description="Backward compatibility to address")
    transaction_hash: str = Field(default="", description="Unique on-chain transaction hash")
    amount: float = Field(default=0.0, ge=0.0, description="Transferred volume")
    asset: str = Field(default="ETH", description="Asset or token symbol")
    timestamp: Optional[str] = Field(default=None, description="UTC ISO 8601 transaction timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional transfer metadata")

    @model_validator(mode="before")
    @classmethod
    def harmonize_edge_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            src = data.get("from_node") or data.get("from_address")
            dst = data.get("to_node") or data.get("to_address")
            if src is not None:
                data["from_node"] = str(src).lower()
                data["from_address"] = str(src).lower()
            if dst is not None:
                data["to_node"] = str(dst).lower()
                data["to_address"] = str(dst).lower()
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "from_node": self.from_node,
            "to_node": self.to_node,
            "from_address": self.from_address,
            "to_address": self.to_address,
            "transaction_hash": self.transaction_hash,
            "amount": self.amount,
            "asset": self.asset,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }


class TracePath(BaseModel):
    """
    Represents an ordered path trail from suspect subject to an entity of interest.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    nodes: List[PathNode] = Field(default_factory=list, description="Ordered sequence of nodes along path")
    edges: List[PathEdge] = Field(default_factory=list, description="Ordered sequence of transaction edges")
    hop_count: int = Field(default=0, ge=0, description="Total hop count from source to destination")
    source: Optional[str] = Field(default=None, description="Originating suspect wallet address")
    destination: Optional[str] = Field(default=None, description="Terminating wallet or entity address")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Path analysis context")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "hop_count": self.hop_count or max(0, len(self.nodes) - 1),
            "source": self.source or (self.nodes[0].identifier if self.nodes else None),
            "destination": self.destination or (self.nodes[-1].identifier if self.nodes else None),
            "metadata": self.metadata,
        }


class VaspAttribution(BaseModel):
    """
    Represents an attribution intelligence finding associating an address or path with a VASP.
    Indicates investigative proximity, NOT legal confirmation of ownership.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    entity: Optional[str] = Field(default=None, description="Identified VASP or exchange name e.g. Binance")
    name: Optional[str] = Field(default=None, description="Backward compatibility entity name")
    entity_type: str = Field(default="VASP", description="Entity type classification")
    distance: int = Field(default=0, ge=0, description="Hop distance from subject wallet to attributed entity")
    hops: Optional[int] = Field(default=None, description="Alias for distance")
    path: List[Any] = Field(default_factory=list, description="Trail of addresses or PathNode objects")
    confidence: float = Field(default=0.0, ge=0.0, le=100.0, description="Heuristic confidence rating (0-100)")
    confidence_label: Optional[str] = Field(default=None, description="Confidence category (High, Moderate, Low)")
    supporting_evidence: List[str] = Field(default_factory=list, description="Evidence rationale strings")
    source: str = Field(default="Tagged entity dataset / Path proximity", description="Attribution intelligence source")
    explanation: Optional[str] = Field(default=None, description="Human-readable investigative rationale")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Attribution metadata")

    @model_validator(mode="before")
    @classmethod
    def harmonize_vasp_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            ent = data.get("entity") or data.get("name")
            if ent is not None:
                data["entity"] = str(ent)
                data["name"] = str(ent)
            dist = data.get("distance") if data.get("distance") is not None else data.get("hops", 0)
            data["distance"] = int(dist)
            data["hops"] = int(dist)
            if not data.get("confidence_label"):
                conf = float(data.get("confidence", 0.0))
                if conf >= 70:
                    data["confidence_label"] = "High confidence"
                elif conf >= 40:
                    data["confidence_label"] = "Moderate confidence"
                else:
                    data["confidence_label"] = "Low confidence"
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity": self.entity,
            "name": self.name,
            "entity_type": self.entity_type,
            "distance": self.distance,
            "hops": self.hops,
            "path": self.path,
            "confidence": self.confidence,
            "confidence_label": self.confidence_label,
            "supporting_evidence": self.supporting_evidence,
            "source": self.source,
            "explanation": self.explanation,
            "metadata": self.metadata,
        }


class RiskSignal(BaseModel):
    """
    Represents an atomic investigative risk signal detected during analysis.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    id: str = Field(..., description="Unique signal identifier (e.g. RS-01)")
    signal_type: str = Field(..., description="Signal classification code (e.g. MIXER_EXPOSURE, RAPID_REDISTRIBUTION)")
    score: float = Field(default=0.0, ge=0.0, le=100.0, description="Risk point contribution")
    contribution: Optional[float] = Field(default=None, description="Alias for score contribution")
    description: str = Field(default="", description="Descriptive label for investigator display")
    severity: str = Field(default="MEDIUM", description="Severity tier (LOW, MEDIUM, HIGH, CRITICAL)")
    entity: Optional[str] = Field(default=None, description="Related entity or wallet address")
    evidence: Optional[str] = Field(default=None, description="Summary evidence reference")
    status: str = Field(default="Detected", description="Signal detection status")
    reason: Optional[str] = Field(default=None, description="Detailed explanatory rationale")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Signal metadata")

    @model_validator(mode="before")
    @classmethod
    def harmonize_signal_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            sc = data.get("score") if data.get("score") is not None else data.get("contribution", 0.0)
            data["score"] = float(sc)
            data["contribution"] = float(sc)
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "signal_type": self.signal_type,
            "score": self.score,
            "contribution": self.contribution,
            "description": self.description,
            "severity": self.severity,
            "entity": self.entity,
            "evidence": self.evidence,
            "status": self.status,
            "reason": self.reason,
            "metadata": self.metadata,
        }


class RiskResult(BaseModel):
    """
    Aggregated multi-factor risk assessment for the analyzed subject.
    Provides explainable indicators; does NOT claim definitive criminality.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    score: float = Field(default=0.0, ge=0.0, le=100.0, description="Calculated aggregate risk score (0-100)")
    level: str = Field(default="LOW", description="Risk tier: LOW, MEDIUM, HIGH, CRITICAL")
    signals: List[RiskSignal] = Field(default_factory=list, description="Structured modular risk signals")
    indicators: List[str] = Field(default_factory=list, description="Backward compatibility string list of indicators")
    explanation: Optional[str] = Field(default=None, description="Executive summary of primary risk drivers")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Risk calculation metadata")

    @model_validator(mode="before")
    @classmethod
    def harmonize_risk_result(cls, data: Any) -> Any:
        if isinstance(data, dict):
            score = float(data.get("score", 0.0))
            data["score"] = score
            if not data.get("level"):
                if score <= 30:
                    data["level"] = "LOW"
                elif score <= 60:
                    data["level"] = "MEDIUM"
                elif score <= 80:
                    data["level"] = "HIGH"
                else:
                    data["level"] = "CRITICAL"
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "level": self.level,
            "signals": [s.to_dict() for s in self.signals],
            "indicators": self.indicators,
            "explanation": self.explanation,
            "metadata": self.metadata,
        }


class EvidenceItem(BaseModel):
    """
    First-class evidentiary object preserving chain-of-custody data for court dossiers.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    id: str = Field(..., description="Unique evidence identifier (e.g. EV-001)")
    type: str = Field(..., description="Evidence category: TRANSACTION, WALLET, PATH, ATTRIBUTION, RISK")
    description: str = Field(..., description="Clear explanation of the observed evidence")
    source: str = Field(default="blockchain", description="Authoritative origin of the evidence")
    timestamp: str = Field(..., description="UTC ISO 8601 timestamp of record")
    status: str = Field(default="Verified", description="Verification state: Verified, Supporting, Needs Review, Detected")
    relevance: str = Field(default="HIGH", description="Investigative relevance level")
    transaction_hash: Optional[str] = Field(default=None, description="Associated transaction hash if applicable")
    block_number: Optional[int] = Field(default=None, description="Blockchain block number")
    from_address: Optional[str] = Field(default=None, description="Source address")
    to_address: Optional[str] = Field(default=None, description="Destination address")
    amount: Optional[float] = Field(default=None, description="Transfer amount")
    asset: Optional[str] = Field(default=None, description="Asset unit")
    entity: Optional[str] = Field(default=None, description="Associated entity or tag")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Raw supporting attributes and forensic notes")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "description": self.description,
            "source": self.source,
            "timestamp": self.timestamp,
            "status": self.status,
            "relevance": self.relevance,
            "transaction_hash": self.transaction_hash,
            "block_number": self.block_number,
            "from_address": self.from_address,
            "to_address": self.to_address,
            "amount": self.amount,
            "asset": self.asset,
            "entity": self.entity,
            "metadata": self.metadata,
        }


class AnalyzeWalletRequest(BaseModel):
    """
    Payload for initiating wallet analysis on the Python Intelligence service.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    case_id: str = Field(..., description="Unique case identifier (e.g. CYBER-001, CASE-2026-001)")
    wallet_address: str = Field(..., description="Subject cryptocurrency address or financial identifier")
    blockchain: str = Field(default="ethereum", description="Target ledger network (ethereum, bitcoin, etc.)")
    max_hops: int = Field(default=3, ge=1, le=10, description="Maximum traversal search depth")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional case context")


class GraphData(BaseModel):
    """
    Represents the full visualized graph data for frontend rendering.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    nodes: List[Dict[str, Any]] = Field(default_factory=list, description="Array of GraphNode objects")
    edges: List[Dict[str, Any]] = Field(default_factory=list, description="Array of GraphEdge objects")


class AnalysisResult(BaseModel):
    """
    Canonical investigation response contract across TRACEVAULT.
    Returned by Python Intelligence Engine, orchestrated by Node backend,
    and rendered by React investigation dashboard.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    analysis_id: Optional[str] = Field(default=None, description="Unique analysis execution ID")
    case_id: str = Field(..., description="Associated case identifier")
    subject: Optional[str] = Field(default=None, description="Investigated subject wallet address")
    wallet: str = Field(..., description="Investigated subject wallet address (backward compatibility)")
    blockchain: str = Field(default="ethereum", description="Blockchain network analyzed")
    status: str = Field(default="Analysis complete", description="Analysis execution state")
    transactions: List[CommonTransaction] = Field(default_factory=list, description="Normalized transactions analyzed")
    graph: Optional[GraphData] = Field(default=None, description="Visual graph representation")
    nearest_vasp: Optional[VaspAttribution] = Field(default=None, description="Primary nearest VASP attribution")
    attribution: List[VaspAttribution] = Field(default_factory=list, description="All identified entity attributions")
    trace_paths: List[TracePath] = Field(default_factory=list, description="Extracted paths of interest")
    path: List[Any] = Field(default_factory=list, description="Backward compatibility primary path sequence")
    risk: RiskResult = Field(..., description="Risk scoring results and indicators")
    behavioral: Optional[Dict[str, Any]] = Field(default=None, description="Behavioral graph intelligence analysis")
    confidence: Dict[str, Any] = Field(default_factory=dict, description="Attribution confidence metrics")
    evidence: List[Union[EvidenceItem, str]] = Field(default_factory=list, description="Evidentiary schedule")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Audit and execution metadata")

    @model_validator(mode="before")
    @classmethod
    def harmonize_analysis_result(cls, data: Any) -> Any:
        if isinstance(data, dict):
            w = data.get("subject") or data.get("wallet")
            if w is not None:
                clean_w = str(w).lower()
                data["wallet"] = clean_w
                data["subject"] = clean_w
            if not data.get("nearest_vasp") and data.get("attribution"):
                data["nearest_vasp"] = data["attribution"][0]
            elif data.get("nearest_vasp") and not data.get("attribution"):
                data["attribution"] = [data["nearest_vasp"]]
        return data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis_id": self.analysis_id,
            "case_id": self.case_id,
            "subject": self.subject,
            "wallet": self.wallet,
            "blockchain": self.blockchain,
            "status": self.status,
            "transactions": [tx.to_dict() for tx in self.transactions],
            "graph": self.graph.model_dump() if self.graph else None,
            "nearest_vasp": self.nearest_vasp.to_dict() if self.nearest_vasp else None,
            "attribution": [a.to_dict() for a in self.attribution],
            "trace_paths": [tp.to_dict() for tp in self.trace_paths],
            "path": self.path,
            "risk": self.risk.to_dict(),
            "behavioral": self.behavioral,
            "confidence": self.confidence,
            "evidence": [e.to_dict() if hasattr(e, "to_dict") else str(e) for e in self.evidence],
            "metadata": self.metadata,
        }
