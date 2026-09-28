from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Union

from app.geospatial.features import GeospatialFeatureExtractor
from app.geospatial.models import (
    GeospatialAnalysisResult,
    GeospatialFeatures,
    GeospatialFinding,
    LocationSignal,
)
from app.geospatial.normalizer import LocationNormalizer
from app.geospatial.rules import (
    ALL_GEO_RULES,
    BaseGeoRule,
    GeoRuleConfig,
)
from app.models.analysis import EvidenceItem, RiskResult, RiskSignal
from app.upi.intelligence.models import UPIFraudAnalysisResult

logger = logging.getLogger(__name__)


class GeospatialIntelligenceEngine:
    """
    Deterministic geospatial anomaly and location-consistency intelligence engine.
    Analyzes transaction-associated location observations to detect geographic inconsistencies,
    impossible travel velocities, and baseline deviations without tracking individuals.
    """

    def __init__(
        self,
        rules: Optional[List[BaseGeoRule]] = None,
        config: Optional[GeoRuleConfig] = None,
    ):
        self.rules: List[BaseGeoRule] = rules if rules is not None else list(ALL_GEO_RULES)
        self.config: GeoRuleConfig = config or GeoRuleConfig()

    def analyze(
        self,
        subject: str,
        locations: List[Union[Dict[str, Any], LocationSignal]],
        baseline_locations: Optional[List[Union[Dict[str, Any], LocationSignal]]] = None,
        config: Optional[GeoRuleConfig] = None,
        upi_result: Optional[UPIFraudAnalysisResult] = None,
    ) -> GeospatialAnalysisResult:
        """
        Executes end-to-end geospatial anomaly analysis.
        Strictly deterministic and explainable: identical inputs yield identical outputs.
        """
        active_config = config or self.config
        clean_subject = subject.strip().lower()

        # Step 1: Normalization
        norm_locations: List[LocationSignal] = [
            LocationNormalizer.normalize(loc) for loc in locations
        ]
        norm_baseline: List[LocationSignal] = (
            [LocationNormalizer.normalize(loc) for loc in baseline_locations]
            if baseline_locations
            else []
        )

        # Step 2: Feature Extraction
        features: GeospatialFeatures = GeospatialFeatureExtractor.extract(
            locations=norm_locations,
            baseline_locations=norm_baseline,
            subject=clean_subject,
        )

        # Step 3: Pure Rule Evaluation
        findings: List[GeospatialFinding] = []
        seen_types = set()

        # Only evaluate behavioral anomaly rules if sufficient location data is present
        if not features.insufficient_location_data:
            for rule in self.rules:
                try:
                    finding = rule.evaluate(
                        features=features,
                        subject=clean_subject,
                        config=active_config,
                    )
                    if finding and finding.signal_type not in seen_types:
                        findings.append(finding)
                        seen_types.add(finding.signal_type)
                except Exception as e:
                    logger.error(f"Geospatial rule {rule.signal_type} failed: {e}", exc_info=True)
        elif features.is_low_accuracy:
            # Low accuracy advisory signal can still be emitted for investigator awareness
            for rule in self.rules:
                if rule.signal_type == "LOW_LOCATION_CONFIDENCE":
                    finding = rule.evaluate(features=features, subject=clean_subject, config=active_config)
                    if finding:
                        findings.append(finding)

        # Step 4: Analytical Confidence Calculation (Separated from risk score)
        if features.insufficient_location_data:
            confidence = 25.0
            confidence_reason = "Limited spatial data: fewer than 2 valid coordinate observations available."
        else:
            base_conf = features.source_reliability_score * 100.0
            if features.avg_accuracy_meters and features.avg_accuracy_meters <= 100.0:
                base_conf += 5.0
            elif features.is_low_accuracy:
                base_conf -= 20.0
            if features.has_baseline:
                base_conf += 5.0
            confidence = round(max(20.0, min(95.0, base_conf)), 1)
            confidence_reason = (
                f"Calculated from {features.valid_coordinate_count} coordinate observation(s) with "
                f"source reliability of {features.source_reliability_score*100:.0f}%."
            )

        # Step 5: Canonical Risk Aggregation
        raw_score = sum(f.risk_contribution for f in findings)

        # If combined with UPI result, merge risk contributions without duplicating
        combined_signals: List[RiskSignal] = [f.to_risk_signal() for f in findings]
        if upi_result and upi_result.risk:
            raw_score += upi_result.risk.score
            for sig in upi_result.risk.signals:
                if sig.signal_type not in seen_types:
                    combined_signals.append(sig)
                    seen_types.add(sig.signal_type)

        total_score = min(100.0, max(0.0, float(raw_score)))

        if total_score <= 30.0:
            level = "LOW"
        elif total_score <= 60.0:
            level = "MEDIUM"
        elif total_score <= 80.0:
            level = "HIGH"
        else:
            level = "CRITICAL"

        if findings:
            explanation = (
                f"Potential geographic inconsistency detected. Evaluated risk level is {level} "
                f"(Score: {total_score:.1f}/100) across {len(findings)} geospatial indicator(s). "
                f"Requires contextual investigator review."
            )
        else:
            explanation = (
                f"No elevated geographic anomalies detected (Score: {total_score:.1f}/100). "
                f"Location signals conform to expected spatial and temporal movement parameters."
            )

        indicators: List[str] = [f"{f.title}: {f.reason}" for f in findings]
        risk_result = RiskResult(
            score=total_score,
            level=level,
            signals=combined_signals,
            indicators=indicators,
            explanation=explanation,
            metadata={
                "geospatial_finding_count": len(findings),
                "rail": "geospatial",
                "has_baseline": features.has_baseline,
                "insufficient_location_data": features.insufficient_location_data,
            },
        )

        # Step 6: Canonical Evidence Item Synthesis
        most_recent_ts = (
            norm_locations[-1].timestamp
            if norm_locations and norm_locations[-1].timestamp
            else datetime.now(timezone.utc).isoformat()
        )
        evidence_items: List[EvidenceItem] = [
            f.to_evidence_item(timestamp=most_recent_ts) for f in findings
        ]

        # Step 7: Deterministic 14-Step Reasoning Trace
        baseline_cnt = len(norm_baseline)
        step_5_msg = (
            f"Step 5: Evaluated baseline location profile ({baseline_cnt} historical observation(s) available)"
            if features.has_baseline
            else "Step 5: Evaluated baseline location profile (no historical location records available - baseline comparisons disabled)"
        )

        reasoning_trace: List[str] = [
            f"Step 1: Loaded {len(norm_locations)} transaction-associated location observation(s) for subject '{clean_subject}'",
            f"Step 2: Validated coordinate bounds ({features.valid_coordinate_count} valid coordinate pair(s) identified)",
            "Step 3: Normalized observation timestamps into UTC chronological sequence",
            f"Step 4: Evaluated location accuracy metadata (avg accuracy: {features.avg_accuracy_meters or 'N/A'}m) and source reliability ({features.source_reliability_score*100:.0f}%)",
            step_5_msg,
            f"Step 6: Calculated pairwise Haversine geographic distances (max displacement: {features.max_distance_km:.1f} km, total: {features.total_distance_km:.1f} km)",
            f"Step 7: Calculated temporal intervals between consecutive location observations (total span: {features.time_span_seconds/60:.1f} minutes)",
            f"Step 8: Computed implied travel velocities across observation intervals (peak speed: {features.max_speed_kmh:.1f} km/h)",
            "Step 9: Evaluated impossible travel sequence rules against commercial transit thresholds",
            "Step 10: Evaluated rapid location displacement thresholds",
            "Step 11: Evaluated location consistency across administrative city boundaries",
            f"Step 12: Evaluated deviation from historical location baseline (offset: {features.baseline_distance_km or 0.0:.1f} km)",
            f"Step 13: Calculated analytical confidence score ({confidence:.1f}/100: {confidence_reason})",
            f"Step 14: Synthesized {len(findings)} geospatial risk finding(s) into canonical risk score ({total_score:.1f}/100, level: {level}) and {len(evidence_items)} evidence item(s)",
        ]

        return GeospatialAnalysisResult(
            subject=clean_subject,
            analyzed_signals=norm_locations,
            features=features,
            findings=findings,
            risk=risk_result,
            confidence=confidence,
            confidence_reason=confidence_reason,
            evidence=evidence_items,
            reasoning_trace=reasoning_trace,
            data_source="synthetic_location_engine",
            metadata={
                "engine": "GeospatialIntelligenceEngine",
                "rules_evaluated": len(self.rules),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
