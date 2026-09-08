def calculate_confidence(distance: int, entity_type: str, path: list) -> int:
    """
    Prototype heuristic confidence score.
    This is a deterministic calculation and should not be interpreted as
    statistical accuracy or probability.
    """
    base_confidence = 90
    
    # Decrease confidence based on distance
    penalty_per_hop = 10
    confidence = base_confidence - (distance * penalty_per_hop)
    
    # Adjust for entity type
    if entity_type == "MIXER":
        confidence -= 20
        
    return max(0, min(100, confidence))
