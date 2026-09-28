from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.analysis import EvidenceItem, RiskResult, RiskSignal
from app.upi.models import PROHIBITED_CREDENTIAL_KEYS


class GeospatialSignalType:
    """Standardized signal types for location-based anomaly detection."""
    IMPOSSIBLE_TRAVEL_SEQUENCE = "IMPOSSIBLE_TRAVEL_SEQUENCE"
    RAPID_LOCATION_CHANGE = "RAPID_LOCATION_CHANGE"
    UNUSUAL_LOCATION = "UNUSUAL_LOCATION"
    LOCATION_INCONSISTENCY = "LOCATION_INCONSISTENCY"
    LOW_LOCATION_CONFIDENCE = "LOW_LOCATION_CONFIDENCE"
    LOCATION_ANOMALY = "LOCATION_ANOMALY"


class LocationSignal(BaseModel):
    """
    Represents an authorized, transaction-associated location observation.
    Location is an analytical signal, NOT proof of identity, physical presence,
    or criminal intent. Supports partial data.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    latitude: Optional[float] = Field(default=None, description="Latitude in decimal degrees (-90 to 90)")
    longitude: Optional[float] = Field(default=None, description="Longitude in decimal degrees (-180 to 180)")
    accuracy_meters: Optional[float] = Field(default=None, ge=0.0, description="Observed accuracy radius in meters")
    timestamp: Optional[str] = Field(default=None, description="UTC ISO 8601 observation timestamp")
    source: str = Field(
        default="synthetic",
        description="Origin source (e.g. synthetic, authorized_device_metadata, authorized_bank_metadata, investigator_supplied)",
    )
    source_reference: Optional[str] = Field(default=None, description="Opaque audit reference or sensor tag")
    country_code: Optional[str] = Field(default=None, description="ISO two-letter country code (e.g. IN)")
    region: Optional[str] = Field(default=None, description="Administrative region or state (e.g. Karnataka)")
    city: Optional[str] = Field(default=None, description="Locality or city name (e.g. Bengaluru)")
    transaction_id: Optional[str] = Field(default=None, description="Associated transaction identifier")
    entity_reference: Optional[str] = Field(default=None, description="Associated VPA or entity identifier")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Preserved analytical metadata")

    @model_validator(mode="before")
    @classmethod
    def sanitize_and_validate(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # 1. Prohibited credential check
            for k in data.keys():
                if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                    raise ValueError(
                        f"Security Violation: Sensitive credential '{k}' must never be ingested with location signals."
                    )
            meta = data.get("metadata")
            if isinstance(meta, dict):
                for k in meta.keys():
                    if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                        raise ValueError(
                            f"Security Violation: Sensitive credential '{k}' found in location metadata."
                        )

            # 2. Coordinate validation
            lat = data.get("latitude")
            lon = data.get("longitude")

            if lat is not None:
                try:
                    lat_f = float(lat)
                except (ValueError, TypeError):
                    raise ValueError(f"Invalid latitude value: '{lat}'. Must be a valid float.")
                if math.isnan(lat_f) or math.isinf(lat_f):
                    raise ValueError("Invalid latitude: NaN or Infinity is prohibited.")
                if not (-90.0 <= lat_f <= 90.0):
                    raise ValueError(f"Latitude out of bounds: {lat_f}. Must be between -90 and 90.")
                data["latitude"] = lat_f

            if lon is not None:
                try:
                    lon_f = float(lon)
                except (ValueError, TypeError):
                    raise ValueError(f"Invalid longitude value: '{lon}'. Must be a valid float.")
                if math.isnan(lon_f) or math.isinf(lon_f):
                    raise ValueError("Invalid longitude: NaN or Infinity is prohibited.")
                if not (-180.0 <= lon_f <= 180.0):
                    raise ValueError(f"Longitude out of bounds: {lon_f}. Must be between -180 and 180.")
                data["longitude"] = lon_f

        return data

    @property
    def has_coordinates(self) -> bool:
        return self.latitude is not None and self.longitude is not None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "accuracy_meters": self.accuracy_meters,
            "timestamp": self.timestamp,
            "source": self.source,
            "source_reference": self.source_reference,
            "country_code": self.country_code,
            "region": self.region,
            "city": self.city,
            "transaction_id": self.transaction_id,
            "entity_reference": self.entity_reference,
            "metadata": self.metadata,
        }


class GeospatialFinding(BaseModel):
    """
    Structured geographic anomaly finding generated by deterministic location rules.
    Clearly distinguishes observed facts from system-derived analysis.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    signal_id: str = Field(..., description="Unique finding ID (e.g. GEO-SIG-01)")
    signal_type: str = Field(..., description="Signal classification from GeospatialSignalType")
    severity: str = Field(default="MEDIUM", description="Severity tier: LOW, MEDIUM, HIGH, CRITICAL")
    confidence: float = Field(default=80.0, ge=0.0, le=100.0, description="Finding confidence rating (0-100)")
    risk_contribution: float = Field(default=15.0, ge=0.0, le=100.0, description="Risk point contribution")
    title: str = Field(..., description="Human-readable title")
    description: str = Field(..., description="Objective description of the observed inconsistency")
    reason: str = Field(..., description="Explainable rationale and criteria trigger")
    transaction_ids: List[str] = Field(default_factory=list, description="Associated transaction IDs")
    location_references: List[Dict[str, Any]] = Field(default_factory=list, description="Relevant location coordinates/cities")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Quantitative geographic metrics")
    evidence_refs: List[str] = Field(default_factory=list, description="Evidentiary schedule references")

    def to_risk_signal(self) -> RiskSignal:
        return RiskSignal(
            id=self.signal_id,
            signal_type=self.signal_type,
            score=self.risk_contribution,
            contribution=self.risk_contribution,
            description=self.title,
            severity=self.severity,
            entity=self.transaction_ids[0] if self.transaction_ids else None,
            evidence=f"{self.description} | {self.reason}",
            status="Detected",
            reason=self.reason,
            metadata=self.metrics,
        )

    def to_evidence_item(self, timestamp: Optional[str] = None) -> EvidenceItem:
        ts = timestamp or datetime.now(timezone.utc).isoformat()
        return EvidenceItem(
            id=f"EV-{self.signal_id}",
            type="GEOSPATIAL_SIGNAL",
            description=f"Potential geographic inconsistency detected: {self.title} - {self.description}",
            source="geospatial_anomaly_engine",
            timestamp=ts,
            status="Detected",
            relevance=self.severity,
            entity=self.transaction_ids[0] if self.transaction_ids else None,
            metadata={
                "signal_type": self.signal_type,
                "risk_contribution": self.risk_contribution,
                "confidence": self.confidence,
                "transaction_ids": self.transaction_ids,
                "location_references": self.location_references,
                "metrics": self.metrics,
                "reason": self.reason,
                "observation_nature": "analytical_signal_not_proof_of_presence",
            },
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "signal_id": self.signal_id,
            "signal_type": self.signal_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "risk_contribution": self.risk_contribution,
            "title": self.title,
            "description": self.description,
            "reason": self.reason,
            "transaction_ids": self.transaction_ids,
            "location_references": self.location_references,
            "metrics": self.metrics,
            "evidence_refs": self.evidence_refs,
        }


class GeospatialFeatures(BaseModel):
    """
    Extracted quantitative geographic and travel metrics.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    observation_count: int = Field(default=0, ge=0)
    valid_coordinate_count: int = Field(default=0, ge=0)
    has_coordinates: bool = Field(default=False)
    insufficient_location_data: bool = Field(default=False)
    max_distance_km: float = Field(default=0.0, ge=0.0)
    total_distance_km: float = Field(default=0.0, ge=0.0)
    max_speed_kmh: float = Field(default=0.0, ge=0.0)
    avg_speed_kmh: float = Field(default=0.0, ge=0.0)
    time_span_seconds: float = Field(default=0.0, ge=0.0)
    has_baseline: bool = Field(default=False)
    baseline_distance_km: Optional[float] = Field(default=None)
    baseline_city: Optional[str] = Field(default=None)
    min_accuracy_meters: Optional[float] = Field(default=None)
    max_accuracy_meters: Optional[float] = Field(default=None)
    avg_accuracy_meters: Optional[float] = Field(default=None)
    is_low_accuracy: bool = Field(default=False)
    source_reliability_score: float = Field(default=0.75, ge=0.0, le=1.0)
    distinct_cities: List[str] = Field(default_factory=list)
    locations: List[LocationSignal] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "observation_count": self.observation_count,
            "valid_coordinate_count": self.valid_coordinate_count,
            "has_coordinates": self.has_coordinates,
            "insufficient_location_data": self.insufficient_location_data,
            "max_distance_km": self.max_distance_km,
            "total_distance_km": self.total_distance_km,
            "max_speed_kmh": self.max_speed_kmh,
            "avg_speed_kmh": self.avg_speed_kmh,
            "time_span_seconds": self.time_span_seconds,
            "has_baseline": self.has_baseline,
            "baseline_distance_km": self.baseline_distance_km,
            "baseline_city": self.baseline_city,
            "min_accuracy_meters": self.min_accuracy_meters,
            "max_accuracy_meters": self.max_accuracy_meters,
            "avg_accuracy_meters": self.avg_accuracy_meters,
            "is_low_accuracy": self.is_low_accuracy,
            "source_reliability_score": self.source_reliability_score,
            "distinct_cities": self.distinct_cities,
            "metadata": self.metadata,
        }


class GeospatialAnalysisResult(BaseModel):
    """
    Canonical investigation result for geospatial intelligence.
    Harmonized with TRACEVAULT risk and evidence models.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    subject: str = Field(..., description="Subject identifier or VPA")
    analyzed_signals: List[LocationSignal] = Field(default_factory=list)
    features: GeospatialFeatures = Field(...)
    findings: List[GeospatialFinding] = Field(default_factory=list)
    risk: RiskResult = Field(...)
    confidence: float = Field(default=80.0, ge=0.0, le=100.0, description="Separated analytical confidence (0-100)")
    confidence_reason: str = Field(default="", description="Explanatory confidence rationale")
    evidence: List[EvidenceItem] = Field(default_factory=list)
    reasoning_trace: List[str] = Field(default_factory=list)
    data_source: str = Field(default="synthetic_location_engine")
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subject": self.subject,
            "analyzed_signals": [s.to_dict() for s in self.analyzed_signals],
            "features": self.features.to_dict(),
            "findings": [f.to_dict() for f in self.findings],
            "risk": self.risk.to_dict(),
            "confidence": self.confidence,
            "confidence_reason": self.confidence_reason,
            "evidence": [e.to_dict() for e in self.evidence],
            "reasoning_trace": self.reasoning_trace,
            "data_source": self.data_source,
            "metadata": self.metadata,
        }
