from typing import Any, Callable, Dict, List, Optional, Set


def evaluate_mixer_interaction(
    path: List[Any],
    transactions: List[Any],
    get_entity_info: Callable[[str], Optional[Dict[str, Any]]]
) -> int:
    """
    Evaluates whether the transaction path or connected transactions touch a known mixer.
    Returns 30 if mixer interaction detected, 0 otherwise.
    """
    addresses_to_check: Set[str] = set()

    for item in path:
        addr = getattr(item, "address", None) or getattr(item, "identifier", None) or str(item)
        if addr:
            addresses_to_check.add(str(addr).strip().lower())

    for tx in transactions:
        from_addr = getattr(tx, "from_address", None) or (tx.get("from") if isinstance(tx, dict) else None)
        to_addr = getattr(tx, "to_address", None) or (tx.get("to") if isinstance(tx, dict) else None)
        if from_addr:
            addresses_to_check.add(str(from_addr).strip().lower())
        if to_addr:
            addresses_to_check.add(str(to_addr).strip().lower())

    for addr in addresses_to_check:
        entity = get_entity_info(addr)
        if entity and str(entity.get("type", "")).upper() == "MIXER":
            return 30
    return 0


def evaluate_hop_count(distance: int) -> int:
    """
    Evaluates whether fund flow spans multiple intermediary hops before reaching target.
    Returns 10 if distance > 2, 0 otherwise.
    """
    if distance > 2:
        return 10
    return 0


def evaluate_rapid_movement(transactions: List[Any]) -> int:
    """
    Evaluates high velocity / rapid redistribution volume across hops.
    Returns 10 if transaction count > 3, 0 otherwise.
    """
    if len(transactions) > 3:
        return 10
    return 0
