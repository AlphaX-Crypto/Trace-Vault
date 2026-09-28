from decimal import Decimal
from typing import Any, Dict, List, Union
from app.investigation.models import (
    InvestigationPlan,
    InvestigationRiskSummary,
    InvestigationTimelineEvent,
    UnifiedInvestigationResult,
)
from app.upi.models import PROHIBITED_CREDENTIAL_KEYS


def deep_scrub_credentials(obj: Any) -> Any:
    """
    Recursively verifies no sensitive credentials exist in dictionaries, lists, or metadata.
    Converts Decimals to float.
    """
    if isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                continue
            cleaned[k] = deep_scrub_credentials(v)
        return cleaned
    elif isinstance(obj, (list, tuple, set)):
        return [deep_scrub_credentials(item) for item in obj]
    elif isinstance(obj, Decimal):
        return float(obj)
    return obj


class InvestigationSerializer:
    """
    Serializes investigation planning and orchestration results into safe,
    audited, and frontend-ready dictionaries.
    """

    @classmethod
    def serialize_result(cls, result: UnifiedInvestigationResult) -> Dict[str, Any]:
        data = result.to_dict()
        return deep_scrub_credentials(data)

    @classmethod
    def serialize_plan(cls, plan: InvestigationPlan) -> Dict[str, Any]:
        data = plan.to_dict()
        return deep_scrub_credentials(data)

    @classmethod
    def serialize_timeline(cls, timeline: List[InvestigationTimelineEvent]) -> List[Dict[str, Any]]:
        return [deep_scrub_credentials(t.to_dict()) for t in timeline]

    @classmethod
    def serialize_risk_summary(cls, risk: InvestigationRiskSummary) -> Dict[str, Any]:
        return deep_scrub_credentials(risk.to_dict())
