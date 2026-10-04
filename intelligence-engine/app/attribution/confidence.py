from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ConfidenceBreakdown(BaseModel):
    """
    Transparent breakdown of heuristic attribution confidence calculation.
    Explains the mathematical adjustments and investigative rationale.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    score: float = Field(..., ge=0.0, le=100.0, description="Final calibrated confidence score (0-100)")
    label: str = Field(..., description="Categorical rating: HIGH, MODERATE, LOW")
    base_score: float = Field(default=90.0, description="Starting baseline confidence")
    hop_penalty: float = Field(default=0.0, ge=0.0, description="Deduction for graph hop attenuation")
    entity_penalty: float = Field(default=0.0, ge=0.0, description="Deduction for entity classification uncertainty")
    reasons: List[str] = Field(default_factory=list, description="Granular explanations for each penalty applied")
    explanation: str = Field(default="", description="Executive narrative explaining final confidence score")

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "label": self.label,
            "base_score": self.base_score,
            "hop_penalty": self.hop_penalty,
            "entity_penalty": self.entity_penalty,
            "reasons": self.reasons,
            "explanation": self.explanation,
        }


def evaluate_confidence(
    distance: int,
    entity_type: str,
    path: Optional[List[Any]] = None,
) -> ConfidenceBreakdown:
    """
    Formalized heuristic confidence calculation for TRACEVAULT attribution.
    Determines attribution strength based on graph proximity and entity classification:
    - Base confidence: 90.0% (for verified intelligence records)
    - Hop attenuation: -10.0% per intermediary hop
    - Entity adjustments: -20.0% for mixer/tumbler traversal
    """
    base_confidence = 90.0
    penalty_per_hop = 10.0
    dist = max(0, int(distance))
    hop_penalty = float(dist * penalty_per_hop)
    entity_penalty = 0.0

    reasons: List[str] = []

    # 1. Hop distance attenuation explanation
    if dist == 0:
        reasons.append("Subject wallet is itself directly registered as a known entity.")
    elif dist == 1:
        reasons.append("Direct 1-hop transfer to destination entity with minimal distance attenuation.")
    else:
        reasons.append(
            f"Attribution confidence is reduced by {int(hop_penalty)}% because the identified "
            f"{entity_type.lower().replace('_', ' ')} is {dist} graph hops from the investigated wallet."
        )

    # 2. Entity-type classification adjustment
    etype_upper = str(entity_type).strip().upper()
    if etype_upper == "DEPOSIT_WALLET":
        reasons.append(
            "Destination entity is classified as a deposit wallet rather than a directly identified core VASP cluster."
        )
    elif etype_upper == "MIXER":
        entity_penalty = 20.0
        reasons.append(
            "Confidence penalized by 20% due to intermediate mixing service/obfuscation protocol interaction."
        )
    elif etype_upper in ("VASP", "EXCHANGE"):
        reasons.append(
            "Destination entity is a known central VASP or exchange organizational cluster."
        )
    else:
        reasons.append(f"Destination entity has category classification '{entity_type}'.")

    # 3. Final score calculation
    raw_confidence = base_confidence - hop_penalty - entity_penalty
    score = max(0.0, min(100.0, float(raw_confidence)))

    # 4. Confidence label categorization
    if score >= 70.0:
        label = "HIGH"
    elif score >= 40.0:
        label = "MODERATE"
    else:
        label = "LOW"

    # 5. Narrative summary
    explanation = (
        f"Attribution confidence is calculated at {score:.1f}% ({label}). "
        + " ".join(reasons)
    )

    return ConfidenceBreakdown(
        score=score,
        label=label,
        base_score=base_confidence,
        hop_penalty=hop_penalty,
        entity_penalty=entity_penalty,
        reasons=reasons,
        explanation=explanation,
    )


def calculate_confidence(
    distance: int,
    entity_type: str,
    path: Optional[List[Any]] = None,
) -> float:
    """
    Backward-compatible entrypoint returning numeric float score (0-100%).
    Preserves exact formula and expectations from Phase 2.
    """
    breakdown = evaluate_confidence(distance=distance, entity_type=entity_type, path=path)
    return breakdown.score
