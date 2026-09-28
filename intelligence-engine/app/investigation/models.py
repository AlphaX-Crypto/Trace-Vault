from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.analysis import EvidenceItem, RiskResult, RiskSignal
from app.upi.models import PROHIBITED_CREDENTIAL_KEYS


class RailScope(str, Enum):
    CRYPTO = "CRYPTO"
    UPI = "UPI"
    GEOSPATIAL = "GEOSPATIAL"
    MULTI_RAIL = "MULTI_RAIL"
    ALL = "ALL"


class InvestigationStatus(str, Enum):
    CREATED = "CREATED"
    PLANNED = "PLANNED"
    RUNNING = "RUNNING"
    PARTIAL = "PARTIAL"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"
    NO_DATA = "NO_DATA"


class SourceProvenanceType(str, Enum):
    LIVE_INDEXER = "LIVE_INDEXER"
    MOCK = "MOCK"
    SYNTHETIC = "SYNTHETIC"
    INVESTIGATOR_SUPPLIED = "INVESTIGATOR_SUPPLIED"
    AUTHORIZED_METADATA = "AUTHORIZED_METADATA"
    CONTROLLED_TEST_REGISTRY = "CONTROLLED_TEST_REGISTRY"


class TimelineEventType(str, Enum):
    TRANSACTION = "TRANSACTION"
    UPI_TRANSFER = "UPI_TRANSFER"
    CRYPTO_TRANSFER = "CRYPTO_TRANSFER"
    VASP_INTERACTION = "VASP_INTERACTION"
    LOCATION_OBSERVATION = "LOCATION_OBSERVATION"
    RISK_SIGNAL = "RISK_SIGNAL"
    BEHAVIORAL_FINDING = "BEHAVIORAL_FINDING"
    ATTRIBUTION_EVENT = "ATTRIBUTION_EVENT"
    CROSS_RAIL_ASSOCIATION = "CROSS_RAIL_ASSOCIATION"


class InvestigationRequest(BaseModel):
    """
    Canonical investigation initiation payload.
    Supports targeting wallets, UPI VPAs, merchants, or multi-rail cases.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    investigation_id: Optional[str] = Field(default=None, description="Unique investigation identifier")
    case_id: str = Field(..., description="Parent case or dossier identifier")
    subject_type: str = Field(default="auto", description="Subject classification: wallet, upi_vpa, merchant, case, auto")
    subject_id: str = Field(..., description="Target identifier (wallet address, VPA handle, or entity ID)")
    rail_scope: str = Field(default=RailScope.MULTI_RAIL.value, description="Scope from RailScope")
    max_hops: int = Field(default=3, ge=1, le=10, description="Max traversal search hops")
    include_crypto: bool = Field(default=True, description="Enable cryptocurrency intelligence")
    include_upi: bool = Field(default=True, description="Enable UPI fraud intelligence")
    include_geospatial: bool = Field(default=True, description="Enable geospatial anomaly intelligence")
    include_vasp: bool = Field(default=True, description="Enable VASP attribution")
    include_behavioral: bool = Field(default=True, description="Enable behavioral graph intelligence")
    include_fraud: bool = Field(default=True, description="Enable rule-based fraud detection")
    include_timeline: bool = Field(default=True, description="Build chronological investigation timeline")
    include_evidence: bool = Field(default=True, description="Link supporting evidence items")
    live_mode: bool = Field(default=False, description="Strict live data mode (rejects silent mock fallback)")
    scenario: Optional[str] = Field(default=None, description="Optional preset synthetic scenario ID (e.g. INV-001)")
    crypto_transactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Investigator-supplied crypto transactions")
    upi_transactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Investigator-supplied UPI transactions")
    location_signals: Optional[List[Dict[str, Any]]] = Field(default=None, description="Investigator-supplied location observations")
    cross_rail_associations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Explicit cross-rail association records")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional case metadata")

    @model_validator(mode="before")
    @classmethod
    def sanitize_credentials(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for k in data.keys():
                if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                    raise ValueError(f"Security Violation: Sensitive credential '{k}' must not be present in investigation request.")
            meta = data.get("metadata")
            if isinstance(meta, dict):
                for k in meta.keys():
                    if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                        raise ValueError(f"Security Violation: Sensitive credential '{k}' found in request metadata.")
        return data


class InvestigationPlanStep(BaseModel):
    """A discrete execution step in the deterministic investigation plan."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    step_number: int
    step_name: str
    engine: str
    rail: str
    data_source: str
    required: bool
    description: str


class InvestigationPlan(BaseModel):
    """
    Deterministic execution plan formulated prior to running intelligence engines.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    plan_id: str
    investigation_id: str
    case_id: str
    subject_id: str
    subject_type: str
    rail_scope: str
    steps: List[InvestigationPlanStep]
    rails_involved: List[str]
    sources_required: List[str]
    engines_required: List[str]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan_id": self.plan_id,
            "investigation_id": self.investigation_id,
            "case_id": self.case_id,
            "subject_id": self.subject_id,
            "subject_type": self.subject_type,
            "rail_scope": self.rail_scope,
            "steps": [s.model_dump() for s in self.steps],
            "rails_involved": self.rails_involved,
            "sources_required": self.sources_required,
            "engines_required": self.engines_required,
            "created_at": self.created_at,
        }


class InvestigationTimelineEvent(BaseModel):
    """
    Chronological observation or finding along the investigation lifecycle.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    event_id: str
    timestamp: Optional[str] = None
    timestamp_status: str = Field(default="CONFIRMED", description="CONFIRMED or UNKNOWN (never invented)")
    event_type: str
    rail: str
    source: str
    actor_reference: Optional[str] = None
    target_reference: Optional[str] = None
    transaction_reference: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    location_reference: Optional[str] = None
    evidence_references: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "timestamp_status": self.timestamp_status,
            "event_type": self.event_type,
            "rail": self.rail,
            "source": self.source,
            "actor_reference": self.actor_reference,
            "target_reference": self.target_reference,
            "transaction_reference": self.transaction_reference,
            "amount": self.amount,
            "currency": self.currency,
            "location_reference": self.location_reference,
            "evidence_references": self.evidence_references,
            "metadata": self.metadata,
        }


class InvestigationRiskSummary(BaseModel):
    """
    Aggregated multi-domain risk evaluation.
    Serves as an investigative prioritization indicator, NOT proof of guilt or identity.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    overall_score: float = Field(..., ge=0.0, le=100.0)
    severity: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    contributing_signals: List[Dict[str, Any]] = Field(default_factory=list)
    source_scores: Dict[str, float] = Field(default_factory=dict)
    confidence: float = Field(default=80.0, ge=0.0, le=100.0)
    explanation: str
    limitations: List[str] = Field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "overall_score": self.overall_score,
            "severity": self.severity,
            "contributing_signals": self.contributing_signals,
            "source_scores": self.source_scores,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "limitations": self.limitations,
        }


class UnifiedInvestigationResult(BaseModel):
    """
    Canonical investigation orchestration result.
    Synthesizes outputs from Crypto, UPI, Geospatial, VASP, and Graph engines.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    investigation_id: str
    case_id: str
    subject: Dict[str, Any]
    status: str
    rails_analyzed: List[str]
    graph_summary: Dict[str, Any] = Field(default_factory=dict)
    graph_paths: List[Dict[str, Any]] = Field(default_factory=list)
    crypto_findings: Optional[Dict[str, Any]] = None
    upi_findings: Optional[Dict[str, Any]] = None
    geospatial_findings: Optional[Dict[str, Any]] = None
    attribution_candidates: List[Dict[str, Any]] = Field(default_factory=list)
    risk_summary: InvestigationRiskSummary
    timeline: List[InvestigationTimelineEvent] = Field(default_factory=list)
    evidence_items: List[EvidenceItem] = Field(default_factory=list)
    cross_rail_associations: List[Dict[str, Any]] = Field(default_factory=list)
    reasoning_trace: List[str] = Field(default_factory=list)
    source_summary: List[Dict[str, Any]] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "investigation_id": self.investigation_id,
            "case_id": self.case_id,
            "subject": self.subject,
            "status": self.status,
            "rails_analyzed": self.rails_analyzed,
            "graph_summary": self.graph_summary,
            "graph_paths": self.graph_paths,
            "crypto_findings": self.crypto_findings,
            "upi_findings": self.upi_findings,
            "geospatial_findings": self.geospatial_findings,
            "attribution_candidates": self.attribution_candidates,
            "risk_summary": self.risk_summary.to_dict(),
            "timeline": [t.to_dict() for t in self.timeline],
            "evidence_items": [e.to_dict() for e in self.evidence_items],
            "cross_rail_associations": self.cross_rail_associations,
            "reasoning_trace": self.reasoning_trace,
            "source_summary": self.source_summary,
            "limitations": self.limitations,
            "metadata": self.metadata,
        }
