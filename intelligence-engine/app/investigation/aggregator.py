from typing import Any, Dict, List, Optional
from app.investigation.models import InvestigationRiskSummary
from app.models.analysis import RiskResult, RiskSignal


class RiskAggregator:
    """
    Thin aggregation layer for synthesizing multi-rail risk outputs.
    CRITICAL: Does NOT create an independent risk model.
    Collects existing outputs from Crypto, UPI, and Geospatial engines and
    computes an investigative prioritization indicator via a deterministic formula.
    """

    @classmethod
    def aggregate(
        cls,
        crypto_risk: Optional[RiskResult] = None,
        upi_risk: Optional[RiskResult] = None,
        geo_risk: Optional[RiskResult] = None,
        vasp_risk_score: Optional[float] = None,
        has_cross_rail_bridges: bool = False,
        cross_rail_count: int = 0,
        attribution_confidence: Optional[float] = None,
    ) -> InvestigationRiskSummary:
        source_scores: Dict[str, float] = {}
        contributing_signals: List[Dict[str, Any]] = []
        confidences: List[float] = []

        if crypto_risk is not None:
            source_scores["crypto"] = round(float(crypto_risk.score), 2)
            for s in crypto_risk.signals:
                contributing_signals.append(s.to_dict() if hasattr(s, "to_dict") else dict(s))
            confidences.append(85.0)

        if upi_risk is not None:
            source_scores["upi_fraud"] = round(float(upi_risk.score), 2)
            for s in upi_risk.signals:
                contributing_signals.append(s.to_dict() if hasattr(s, "to_dict") else dict(s))
            confidences.append(85.0)

        if geo_risk is not None:
            source_scores["geospatial"] = round(float(geo_risk.score), 2)
            for s in geo_risk.signals:
                contributing_signals.append(s.to_dict() if hasattr(s, "to_dict") else dict(s))
            confidences.append(80.0)

        if vasp_risk_score is not None and vasp_risk_score > 0:
            source_scores["vasp_attribution"] = round(float(vasp_risk_score), 2)
            if attribution_confidence is not None:
                confidences.append(float(attribution_confidence))

        if has_cross_rail_bridges and cross_rail_count > 0:
            contributing_signals.append({
                "signal_type": "CROSS_RAIL_ASSOCIATION_DETECTED",
                "severity": "HIGH",
                "score": 75.0,
                "description": f"Observed {cross_rail_count} explicit cross-rail bridge(s) connecting multi-rail entities.",
            })

        # Deterministic formula:
        # 1. Base score = highest domain score
        # 2. Multi-rail compounding = 10% of secondary positive scores (capped at +15.0)
        # 3. Cross-rail bridge bonus = +5.0 (if present)
        # 4. Total capped at 100.0
        scores_list = sorted(list(source_scores.values()), reverse=True)
        if not scores_list:
            overall_score = 0.0
        else:
            base = scores_list[0]
            secondary_sum = sum(scores_list[1:])
            compound = min(15.0, secondary_sum * 0.10)
            cross_bonus = 5.0 if has_cross_rail_bridges else 0.0
            overall_score = min(100.0, round(base + compound + cross_bonus, 2))

        # Severity classification
        if overall_score >= 80.0:
            severity = "CRITICAL"
        elif overall_score >= 50.0:
            severity = "HIGH"
        elif overall_score >= 20.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Confidence
        avg_confidence = round(sum(confidences) / len(confidences), 2) if confidences else 80.0

        # Explanation formulation
        contributing_rails = list(source_scores.keys())
        if not contributing_rails:
            explanation = "No adverse risk signals identified across evaluated rails."
        else:
            parts = [f"{k.upper()}: {v}/100" for k, v in source_scores.items()]
            explanation = f"Investigative priority score derived from multi-domain inputs ({', '.join(parts)})."
            if has_cross_rail_bridges:
                explanation += f" Compounded by {cross_rail_count} cross-rail analytical bridge(s)."

        limitations = [
            "Investigative priority score is an analytical triaging indicator, not legal proof of fraud, guilt, or ownership.",
            "Cross-rail links represent graph-derived analytical associations and do not prove common personhood.",
        ]

        return InvestigationRiskSummary(
            overall_score=overall_score,
            severity=severity,
            contributing_signals=contributing_signals,
            source_scores=source_scores,
            confidence=avg_confidence,
            explanation=explanation,
            limitations=limitations,
        )
