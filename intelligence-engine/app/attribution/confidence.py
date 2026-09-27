from typing import Any, List


def calculate_confidence(distance: int, entity_type: str, path: List[Any]) -> float:
    """
    Prototype heuristic confidence score (0-100%).
    Deterministic calculation for investigative intelligence:
    - Base confidence: 90%
    - Penalty per hop: 10%
    - Entity adjustments: -20% for mixer traversal
    """
    base_confidence = 90.0
    penalty_per_hop = 10.0
    confidence = base_confidence - (distance * penalty_per_hop)

    if str(entity_type).upper() == "MIXER":
        confidence -= 20.0

    return max(0.0, min(100.0, float(confidence)))
