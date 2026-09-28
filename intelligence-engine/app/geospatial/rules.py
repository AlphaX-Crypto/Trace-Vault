from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.geospatial.models import GeospatialFeatures, GeospatialFinding, GeospatialSignalType, LocationSignal


class GeoRuleConfig(BaseModel):
    """Configurable thresholds for geospatial anomaly detection rules."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    max_travel_speed_kmh: float = Field(default=900.0, description="Speed threshold for impossible travel (km/h)")
    min_jump_distance_km: float = Field(default=50.0, description="Minimum distance to trigger velocity rules (km)")
    rapid_change_distance_km: float = Field(default=200.0, description="Displacement threshold for rapid location change (km)")
    rapid_change_window_seconds: float = Field(default=1800.0, description="Window for rapid location change (seconds)")
    unusual_location_distance_km: float = Field(default=300.0, description="Distance from baseline considered unusual (km)")
    coarse_accuracy_threshold_meters: float = Field(default=5000.0, description="Threshold above which location is coarse (meters)")


class BaseGeoRule:
    """Abstract base for pure deterministic geospatial anomaly rules."""
    signal_type: str = GeospatialSignalType.LOCATION_ANOMALY
    default_risk_contribution: float = 15.0

    def evaluate(
        self,
        features: GeospatialFeatures,
        subject: str,
        config: GeoRuleConfig,
    ) -> Optional[GeospatialFinding]:
        raise NotImplementedError


class ImpossibleTravelRule(BaseGeoRule):
    signal_type = GeospatialSignalType.IMPOSSIBLE_TRAVEL_SEQUENCE
    default_risk_contribution = 25.0

    def evaluate(
        self,
        features: GeospatialFeatures,
        subject: str,
        config: GeoRuleConfig,
    ) -> Optional[GeospatialFinding]:
        if features.insufficient_location_data:
            return None

        jumps = features.metadata.get("jumps", [])
        for j in jumps:
            speed = j.get("speed_kmh")
            dist = j.get("distance_km", 0.0)
            delta = j.get("time_delta_seconds")
            if speed is not None and speed > config.max_travel_speed_kmh and dist >= config.min_jump_distance_km:
                span_min = delta / 60.0 if delta else 0.0
                tx_ids = [tid for tid in [j.get("from_transaction"), j.get("to_transaction")] if tid]

                # Adjust confidence if location precision was coarse
                conf = 85.0
                if features.is_low_accuracy:
                    conf = 60.0

                return GeospatialFinding(
                    signal_id="GEO-SIG-IMPOSSIBLE-TRAVEL",
                    signal_type=self.signal_type,
                    severity="CRITICAL",
                    confidence=conf,
                    risk_contribution=self.default_risk_contribution,
                    title="Impossible Travel Velocity Sequence",
                    description="Transaction-associated location signals imply a travel speed inconsistent with the configured threshold.",
                    reason=(
                        f"Implied transit speed of {speed:.1f} km/h over {dist:.1f} km in "
                        f"{span_min:.1f} minutes exceeds the plausible physical transit threshold of {config.max_travel_speed_kmh:.1f} km/h."
                    ),
                    transaction_ids=tx_ids,
                    location_references=[
                        {"coordinate": j.get("from_coord"), "city": j.get("from_city")},
                        {"coordinate": j.get("to_coord"), "city": j.get("to_city")},
                    ],
                    metrics={
                        "speed_kmh": speed,
                        "distance_km": dist,
                        "time_delta_seconds": delta,
                        "threshold_kmh": config.max_travel_speed_kmh,
                    },
                )
        return None


class RapidLocationChangeRule(BaseGeoRule):
    signal_type = GeospatialSignalType.RAPID_LOCATION_CHANGE
    default_risk_contribution = 15.0

    def evaluate(
        self,
        features: GeospatialFeatures,
        subject: str,
        config: GeoRuleConfig,
    ) -> Optional[GeospatialFinding]:
        if features.insufficient_location_data:
            return None

        jumps = features.metadata.get("jumps", [])
        for j in jumps:
            dist = j.get("distance_km", 0.0)
            delta = j.get("time_delta_seconds")
            if delta is not None and delta <= config.rapid_change_window_seconds and dist >= config.rapid_change_distance_km:
                span_min = delta / 60.0
                tx_ids = [tid for tid in [j.get("from_transaction"), j.get("to_transaction")] if tid]

                return GeospatialFinding(
                    signal_id="GEO-SIG-RAPID-CHANGE",
                    signal_type=self.signal_type,
                    severity="HIGH",
                    confidence=80.0,
                    risk_contribution=self.default_risk_contribution,
                    title="Rapid Geographic Displacement",
                    description="Substantial geographic displacement observed over a compressed time interval.",
                    reason=(
                        f"Location signal displaced by {dist:.1f} km within {span_min:.1f} minutes, "
                        f"exceeding the displacement window threshold of {config.rapid_change_distance_km:.1f} km in {config.rapid_change_window_seconds/60:.0f}m."
                    ),
                    transaction_ids=tx_ids,
                    location_references=[
                        {"coordinate": j.get("from_coord"), "city": j.get("from_city")},
                        {"coordinate": j.get("to_coord"), "city": j.get("to_city")},
                    ],
                    metrics={
                        "distance_km": dist,
                        "time_delta_seconds": delta,
                        "threshold_distance_km": config.rapid_change_distance_km,
                        "threshold_window_seconds": config.rapid_change_window_seconds,
                    },
                )
        return None


class UnusualLocationRule(BaseGeoRule):
    signal_type = GeospatialSignalType.UNUSUAL_LOCATION
    default_risk_contribution = 15.0

    def evaluate(
        self,
        features: GeospatialFeatures,
        subject: str,
        config: GeoRuleConfig,
    ) -> Optional[GeospatialFinding]:
        # Strictly require explicit baseline
        if not features.has_baseline or features.baseline_distance_km is None:
            return None

        if features.baseline_distance_km >= config.unusual_location_distance_km:
            b_desc = f" ({features.baseline_city})" if features.baseline_city else ""
            tx_ids = [loc.transaction_id for loc in features.locations if loc.transaction_id]

            return GeospatialFinding(
                signal_id="GEO-SIG-UNUSUAL-LOCATION",
                signal_type=self.signal_type,
                severity="MEDIUM",
                confidence=75.0,
                risk_contribution=self.default_risk_contribution,
                title="Unusual Geographic Location",
                description="Transaction-associated location differs materially from the available historical location baseline.",
                reason=(
                    f"Observed location is {features.baseline_distance_km:.1f} km away from established historical "
                    f"activity center{b_desc}, exceeding the normal perimeter threshold of {config.unusual_location_distance_km:.1f} km."
                ),
                transaction_ids=tx_ids,
                location_references=[
                    {"baseline_city": features.baseline_city, "baseline_distance_km": features.baseline_distance_km}
                ],
                metrics={
                    "baseline_distance_km": features.baseline_distance_km,
                    "threshold_km": config.unusual_location_distance_km,
                    "baseline_city": features.baseline_city,
                },
            )
        return None


class LocationInconsistencyRule(BaseGeoRule):
    signal_type = GeospatialSignalType.LOCATION_INCONSISTENCY
    default_risk_contribution = 20.0

    def evaluate(
        self,
        features: GeospatialFeatures,
        subject: str,
        config: GeoRuleConfig,
    ) -> Optional[GeospatialFinding]:
        jumps = features.metadata.get("jumps", [])
        for j in jumps:
            c1 = j.get("from_city")
            c2 = j.get("to_city")
            delta = j.get("time_delta_seconds")
            dist = j.get("distance_km", 0.0)

            # Different cities with rapid transition (<= 600s / 10 minutes) and notable distance (>= 50km)
            if c1 and c2 and c1.strip().lower() != c2.strip().lower() and delta is not None and delta <= 600.0 and dist >= 50.0:
                span_min = delta / 60.0
                tx_ids = [tid for tid in [j.get("from_transaction"), j.get("to_transaction")] if tid]

                return GeospatialFinding(
                    signal_id="GEO-SIG-INCONSISTENCY",
                    signal_type=self.signal_type,
                    severity="HIGH",
                    confidence=80.0,
                    risk_contribution=self.default_risk_contribution,
                    title="Sequential Location Inconsistency",
                    description="Available location metadata is inconsistent with the observed transaction sequence.",
                    reason=(
                        f"Location metadata shifts across distinct cities ({c1} -> {c2}) "
                        f"within {span_min:.1f} minutes ({dist:.1f} km apart) without plausible transit interval."
                    ),
                    transaction_ids=tx_ids,
                    location_references=[
                        {"city": c1, "coordinate": j.get("from_coord")},
                        {"city": c2, "coordinate": j.get("to_coord")},
                    ],
                    metrics={
                        "from_city": c1,
                        "to_city": c2,
                        "distance_km": dist,
                        "time_delta_seconds": delta,
                    },
                )
        return None


class LowLocationConfidenceRule(BaseGeoRule):
    signal_type = GeospatialSignalType.LOW_LOCATION_CONFIDENCE
    default_risk_contribution = 0.0  # Advisory only; never inflates risk score

    def evaluate(
        self,
        features: GeospatialFeatures,
        subject: str,
        config: GeoRuleConfig,
    ) -> Optional[GeospatialFinding]:
        if features.is_low_accuracy and features.max_accuracy_meters is not None:
            tx_ids = [loc.transaction_id for loc in features.locations if loc.transaction_id]
            return GeospatialFinding(
                signal_id="GEO-SIG-COARSE-ACCURACY",
                signal_type=self.signal_type,
                severity="LOW",
                confidence=60.0,
                risk_contribution=0.0,
                title="Coarse Location Precision",
                description="Available location metadata exhibits coarse precision, reducing spatial certainty.",
                reason=(
                    f"Observed location precision radius ({features.max_accuracy_meters:.0f}m) exceeds the "
                    f"precision threshold of {config.coarse_accuracy_threshold_meters:.0f}m. Analytical confidence is tempered accordingly."
                ),
                transaction_ids=tx_ids,
                location_references=[],
                metrics={
                    "max_accuracy_meters": features.max_accuracy_meters,
                    "threshold_meters": config.coarse_accuracy_threshold_meters,
                },
            )
        return None


ALL_GEO_RULES: List[BaseGeoRule] = [
    ImpossibleTravelRule(),
    RapidLocationChangeRule(),
    UnusualLocationRule(),
    LocationInconsistencyRule(),
    LowLocationConfidenceRule(),
]
