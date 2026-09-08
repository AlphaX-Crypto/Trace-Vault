def evaluate_mixer_interaction(path: list, transactions: list, get_entity_info) -> int:
    # Check both the path and related transactions
    addresses_to_check = set(path)
    for tx in transactions:
        addresses_to_check.add(tx["from"])
        addresses_to_check.add(tx["to"])
        
    for addr in addresses_to_check:
        entity = get_entity_info(addr)
        if entity and entity.get("type") == "MIXER":
            return 30
    return 0

def evaluate_hop_count(distance: int) -> int:
    if distance > 2:
        return 10
    return 0

def evaluate_rapid_movement(transactions: list) -> int:
    if len(transactions) > 3:
        return 10
    return 0
