from typing import Any, Callable, Dict, List, Optional
from app.models.analysis import RiskResult, RiskSignal
from app.risk.rules import evaluate_mixer_interaction, evaluate_hop_count, evaluate_rapid_movement
from app.behavioral.models import BehavioralFinding, BehavioralPatternType


class RiskScorer:
    """
    Multi-Factor Rule-Based & Behavioral Graph Risk Engine for TRACEVAULT.
    Evaluates:
    - Mixer interaction (+30)
    - Multiple intermediary hops (+10)
    - Rapid movement / high volume (+10)
    - Baseline investigative risk (+10)
    - Behavioral Graph Intelligence (Circular flows, Peel chains, Fan-in/out, Consolidation, etc.)
    """

    def __init__(self, get_entity_info: Callable[[str], Optional[Dict[str, Any]]]):
        self.get_entity_info = get_entity_info

    def calculate_risk(
        self,
        path: List[Any],
        distance: int,
        transactions: List[Any],
        behavioral_findings: Optional[List[BehavioralFinding]] = None,
    ) -> RiskResult:
        score = 0.0
        indicators: List[str] = []
        signals: List[RiskSignal] = []

        mixer_risk = evaluate_mixer_interaction(path, transactions, self.get_entity_info)
        if mixer_risk > 0:
            score += mixer_risk
            indicators.append("Mixer interaction detected (+30)")
            signals.append(
                RiskSignal(
                    id="RS-01",
                    signal_type="MIXER_EXPOSURE",
                    score=30.0,
                    severity="HIGH",
                    description="Mixer interaction detected",
                    reason="Transaction path or connected activity directly touches a known mixing service.",
                )
            )

        hop_risk = evaluate_hop_count(distance)
        if hop_risk > 0:
            score += hop_risk
            indicators.append("Multiple intermediary hops (+10)")
            signals.append(
                RiskSignal(
                    id="RS-02",
                    signal_type="INTERMEDIARY_HOPS",
                    score=10.0,
                    severity="LOW",
                    description="Multiple intermediary hops",
                    reason=f"Funds traversed {distance} hops before terminating at destination.",
                )
            )

        rapid_risk = evaluate_rapid_movement(transactions)
        if rapid_risk > 0:
            score += rapid_risk
            indicators.append("Rapid movement/high transaction volume (+10)")
            signals.append(
                RiskSignal(
                    id="RS-03",
                    signal_type="HIGH_VELOCITY",
                    score=10.0,
                    severity="MEDIUM",
                    description="High transaction volume / rapid movement",
                    reason=f"High transfer velocity observed ({len(transactions)} transactions in scope).",
                )
            )

        if path:
            score += 10.0
            indicators.append("Baseline investigative risk (+10)")
            signals.append(
                RiskSignal(
                    id="RS-04",
                    signal_type="INVESTIGATIVE_BASELINE",
                    score=10.0,
                    severity="LOW",
                    description="Baseline investigative risk",
                    reason="Subject address is flagged in an active cybercrime inquiry.",
                )
            )

        # Behavioral Graph Intelligence Signals
        if behavioral_findings:
            sig_idx = 5
            for finding in behavioral_findings:
                # Avoid duplicate mixer exposure if already flagged by RS-01
                if finding.pattern_type == BehavioralPatternType.MIXER_INTERACTION and mixer_risk > 0:
                    continue

                pts = finding.risk_contribution
                # High-impact topological anomalies contribute to overall aggregate risk
                if finding.pattern_type == BehavioralPatternType.CIRCULAR_FLOW:
                    score += 25.0
                elif finding.pattern_type in (BehavioralPatternType.FAN_IN, BehavioralPatternType.FAN_OUT) and finding.severity == "HIGH":
                    score += 10.0

                indicators.append(f"{finding.title} (+{int(pts)})")
                signals.append(
                    RiskSignal(
                        id=f"RS-{sig_idx:02d}",
                        signal_type=finding.pattern_type,
                        score=pts,
                        severity=finding.severity,
                        description=finding.title,
                        reason=finding.reason,
                        metadata=finding.metrics,
                    )
                )
                sig_idx += 1

        score = min(100.0, score)

        if score <= 30.0:
            level = "LOW"
        elif score <= 60.0:
            level = "MEDIUM"
        elif score <= 80.0:
            level = "HIGH"
        else:
            level = "CRITICAL"

        explanation = (
            f"The calculated risk level is {level} (score: {int(score)}/100). "
            f"Key risk drivers: {', '.join(indicators) if indicators else 'No critical risk flags'}."
        )

        risk_meta = {}
        if behavioral_findings:
            risk_meta["behavioral_patterns"] = [f.pattern_type for f in behavioral_findings]
            risk_meta["behavioral_findings_count"] = len(behavioral_findings)

        return RiskResult(
            score=score,
            level=level,
            signals=signals,
            indicators=indicators,
            explanation=explanation,
            metadata=risk_meta,
        )

