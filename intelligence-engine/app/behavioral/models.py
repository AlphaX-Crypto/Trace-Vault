from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BehavioralPatternType:
    FAN_IN = "FAN_IN"
    FAN_OUT = "FAN_OUT"
    PEEL_CHAIN = "PEEL_CHAIN"
    RAPID_DISPERSION = "RAPID_DISPERSION"
    CONSOLIDATION = "CONSOLIDATION"
    CIRCULAR_FLOW = "CIRCULAR_FLOW"
    MIXER_INTERACTION = "MIXER_INTERACTION"
    VASP_ENTRY_EXIT = "VASP_ENTRY_EXIT"
    TEMPORAL_BEHAVIOR = "TEMPORAL_BEHAVIOR"


class BehavioralFinding(BaseModel):
    """
    Represents an atomic behavioral pattern detected through graph topology,
    flow dynamics, and temporal analysis.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    id: str = Field(..., description="Unique finding identifier (e.g. BF-01)")
    pattern_type: str = Field(..., description="Classification from BehavioralPatternType")
    title: str = Field(..., description="Short human-readable finding title")
    severity: str = Field(default="MEDIUM", description="Severity tier (LOW, MEDIUM, HIGH, CRITICAL)")
    risk_contribution: float = Field(default=10.0, ge=0.0, le=50.0, description="Risk score addition")
    confidence: float = Field(default=85.0, ge=0.0, le=100.0, description="Pattern detection confidence")
    subject: Optional[str] = Field(default=None, description="Primary subject or node exhibiting pattern")
    involved_addresses: List[str] = Field(default_factory=list, description="All addresses participating in pattern")
    description: str = Field(..., description="Detailed description of the observed behavioral phenomenon")
    reason: str = Field(..., description="Investigative rationale and typological significance")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Quantitative indicators (degrees, deltas, ratios)")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "pattern_type": self.pattern_type,
            "title": self.title,
            "severity": self.severity,
            "risk_contribution": self.risk_contribution,
            "confidence": self.confidence,
            "subject": self.subject,
            "involved_addresses": self.involved_addresses,
            "description": self.description,
            "reason": self.reason,
            "metrics": self.metrics,
        }


class BehavioralAnalysisResult(BaseModel):
    """
    Container for all behavioral intelligence findings for an investigation.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    findings: List[BehavioralFinding] = Field(default_factory=list, description="Detected behavioral findings")
    patterns_detected: List[str] = Field(default_factory=list, description="Unique pattern types detected")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Summary graph topological and flow metrics")
    summary: str = Field(default="", description="Executive narrative of behavioral patterns")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "findings": [f.to_dict() for f in self.findings],
            "patterns_detected": self.patterns_detected,
            "metrics": self.metrics,
            "summary": self.summary,
        }
