from app.risk.rules import evaluate_mixer_interaction, evaluate_hop_count, evaluate_rapid_movement
from app.models.analysis import RiskResult

class RiskScorer:
    def __init__(self, get_entity_info):
        self.get_entity_info = get_entity_info

    def calculate_risk(self, path: list, distance: int, transactions: list) -> RiskResult:
        score = 0
        indicators = []
        
        mixer_risk = evaluate_mixer_interaction(path, transactions, self.get_entity_info)
        if mixer_risk > 0:
            score += mixer_risk
            indicators.append("Mixer interaction detected (+30)")
            
        hop_risk = evaluate_hop_count(distance)
        if hop_risk > 0:
            score += hop_risk
            indicators.append("Multiple intermediary hops (+10)")
            
        rapid_risk = evaluate_rapid_movement(transactions)
        if rapid_risk > 0:
            score += rapid_risk
            indicators.append("Rapid movement/high transaction volume (+10)")
            
        if path:
            score += 10
            indicators.append("Baseline investigative risk (+10)")
            
        score = min(100, score)
        
        if score <= 30:
            level = "LOW"
        elif score <= 60:
            level = "MEDIUM"
        elif score <= 80:
            level = "HIGH"
        else:
            level = "CRITICAL"
            
        return RiskResult(score=score, level=level, indicators=indicators)
