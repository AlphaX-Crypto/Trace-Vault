from typing import Any, Callable, Dict, List, Optional
from app.models.analysis import RiskResult, RiskSignal
from app.risk.rules import evaluate_mixer_interaction, evaluate_hop_count, evaluate_rapid_movement


class RiskScorer:
    """
    Multi-Factor Rule-Based Risk Engine for TRACEVAULT.
    Evaluates:
    - Mixer interaction (+30)
    - Multiple intermediary hops (+10)
    - Rapid movement / high volume (+10)
    - Baseline investigative risk (+10)
    """

    def __init__(self, get_entity_info: Callable[[str], Optional[Dict[str, Any]]]):
        self.get_entity_info = get_entity_info

    def calculate_risk(self, path: List[Any], distance: int, transactions: List[Any]) -> RiskResult:
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

        return RiskResult(
            score=score,
            level=level,
            signals=signals,
            indicators=indicators,
            explanation=explanation,
        )
