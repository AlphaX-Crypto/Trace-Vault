import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.graph.unified.models import UnifiedGraphAnalysisResult
from app.graph.unified.engine import UnifiedInvestigationEngine
from app.graph.unified.scenarios import UNIFIED_SCENARIOS
from app.graph.unified.serializer import UnifiedGraphSerializer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/investigations", tags=["Unified Investigations"])
engine = UnifiedInvestigationEngine()


class UnifiedGraphRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    case_id: str = Field(default="CASE-INVESTIGATION-001", description="Investigative case identifier")
    scenario_id: Optional[str] = Field(default=None, description="Preset synthetic scenario ID (e.g. UNIFIED-DEMO-004)")
    crypto_transactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Custom blockchain transactions")
    vasp_attributions: Optional[List[Dict[str, Any]]] = Field(default=None, description="VASP attribution items")
    upi_transactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Normalized UPI transactions")
    location_signals: Optional[List[Dict[str, Any]]] = Field(default=None, description="Geospatial signals")
    cross_rail_associations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Cross-rail links")
    focus_entity: Optional[str] = Field(default=None, description="Focus node ID for targeted path discovery")
    max_traversal_depth: int = Field(default=5, ge=1, le=10, description="Maximum traversal hop depth")


@router.get("/unified-graph/scenarios")
def list_unified_scenarios():
    """
    Returns available synthetic multi-rail investigation scenarios.
    """
    scenarios_summary = []
    for sc_id, sc in UNIFIED_SCENARIOS.items():
        scenarios_summary.append({
            "scenario_id": sc_id,
            "title": sc.get("title", ""),
            "description": sc.get("description", ""),
            "crypto_tx_count": len(sc.get("crypto_transactions", [])),
            "upi_tx_count": len(sc.get("upi_transactions", [])),
            "vasp_attribution_count": len(sc.get("vasp_attributions", [])),
            "location_signal_count": len(sc.get("location_signals", [])),
            "cross_rail_association_count": len(sc.get("cross_rail_associations", [])),
        })
    return {"scenarios": scenarios_summary}


@router.post("/unified-graph")
def analyze_unified_graph(request: UnifiedGraphRequest):
    """
    Constructs and analyzes a unified multi-rail financial investigation graph.
    Returns nodes, edges, paths, risk signals, evidentiary references, and 14-step reasoning trace.
    """
    try:
        if request.scenario_id:
            if request.scenario_id not in UNIFIED_SCENARIOS:
                raise HTTPException(
                    status_code=404,
                    detail=f"Scenario '{request.scenario_id}' not found. Available: {list(UNIFIED_SCENARIOS.keys())}",
                )
            result = engine.analyze_scenario(request.scenario_id)
        else:
            result = engine.analyze_investigation(
                case_id=request.case_id,
                crypto_transactions=request.crypto_transactions,
                vasp_attributions=request.vasp_attributions,
                upi_transactions=request.upi_transactions,
                location_signals=request.location_signals,
                cross_rail_associations=request.cross_rail_associations,
                focus_entity=request.focus_entity,
                max_traversal_depth=request.max_traversal_depth,
            )

        return UnifiedGraphSerializer.serialize_result(result)
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Validation error in unified graph analysis: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in unified graph analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during unified graph analysis.")
