import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.graph.unified.models import UnifiedGraphAnalysisResult
from app.graph.unified.engine import UnifiedInvestigationEngine
from app.graph.unified.scenarios import UNIFIED_SCENARIOS
from app.graph.unified.serializer import UnifiedGraphSerializer

from app.investigation.models import (
    InvestigationPlan,
    InvestigationRequest,
    UnifiedInvestigationResult,
)
from app.investigation.orchestrator import InvestigationOrchestrator
from app.investigation.planner import InvestigationPlanner
from app.investigation.scenarios import INVESTIGATION_SCENARIOS
from app.investigation.serializer import InvestigationSerializer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/investigations", tags=["Unified Investigations"])

# Authoritative engines
unified_graph_engine = UnifiedInvestigationEngine()
orchestrator = InvestigationOrchestrator()

# In-memory execution registry for investigation lifecycle
INVESTIGATION_REGISTRY: Dict[str, UnifiedInvestigationResult] = {}
INVESTIGATION_PLANS: Dict[str, InvestigationPlan] = {}


# =========================================================================
# Phase 15 Compatibility Endpoints
# =========================================================================

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
    """Returns available synthetic multi-rail investigation scenarios (Phase 15)."""
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
    """Constructs and analyzes a unified multi-rail financial investigation graph (Phase 15)."""
    try:
        if request.scenario_id:
            if request.scenario_id not in UNIFIED_SCENARIOS:
                raise HTTPException(
                    status_code=404,
                    detail=f"Scenario '{request.scenario_id}' not found. Available: {list(UNIFIED_SCENARIOS.keys())}",
                )
            result = unified_graph_engine.analyze_scenario(request.scenario_id)
        else:
            result = unified_graph_engine.analyze_investigation(
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


# =========================================================================
# Phase 16 Investigation Orchestration Endpoints
# =========================================================================

@router.get("/scenarios")
def list_investigation_scenarios():
    """Returns available deterministic investigation scenarios (INV-001 to INV-008)."""
    summary = []
    for sc_id, sc in INVESTIGATION_SCENARIOS.items():
        summary.append({
            "scenario_id": sc_id,
            "case_id": sc.get("case_id", ""),
            "title": sc.get("title", ""),
            "description": sc.get("description", ""),
            "subject_type": sc.get("subject_type", ""),
            "subject_id": sc.get("subject_id", ""),
            "rail_scope": sc.get("rail_scope", ""),
            "synthetic": sc.get("synthetic", True),
            "provenance": sc.get("provenance", "MOCK"),
            "expected_risk_level": sc.get("expected_risk_level", "LOW"),
            "expected_status": sc.get("expected_status", "COMPLETE"),
        })
    return {"scenarios": summary}


@router.post("")
def create_and_run_investigation(request: InvestigationRequest):
    """
    Formulates plan, orchestrates multi-rail intelligence engines, and executes investigation.
    Returns complete explainable UnifiedInvestigationResult.
    """
    try:
        # Build and store plan
        plan = InvestigationPlanner.build_plan(request)
        INVESTIGATION_PLANS[plan.investigation_id] = plan

        # Execute orchestrator
        result = orchestrator.run_investigation(request)
        INVESTIGATION_REGISTRY[result.investigation_id] = result

        return InvestigationSerializer.serialize_result(result)
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Validation error in investigation request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"Runtime error in investigation: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error orchestrating investigation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error orchestrating investigation.")


@router.get("/{investigation_id}")
def get_investigation(investigation_id: str):
    """Retrieves full investigation result by investigation_id."""
    res = INVESTIGATION_REGISTRY.get(investigation_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return InvestigationSerializer.serialize_result(res)


@router.post("/{investigation_id}/run")
def run_planned_investigation(investigation_id: str):
    """Executes a previously planned investigation."""
    plan = INVESTIGATION_PLANS.get(investigation_id)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Investigation plan '{investigation_id}' not found.")

    req = InvestigationRequest(
        investigation_id=plan.investigation_id,
        case_id=plan.case_id,
        subject_id=plan.subject_id,
        subject_type=plan.subject_type,
        rail_scope=plan.rail_scope,
    )
    result = orchestrator.run_investigation(req)
    INVESTIGATION_REGISTRY[result.investigation_id] = result
    return InvestigationSerializer.serialize_result(result)


@router.get("/{investigation_id}/timeline")
def get_investigation_timeline(investigation_id: str):
    """Retrieves chronological investigation timeline without inventing timestamps."""
    res = INVESTIGATION_REGISTRY.get(investigation_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return {
        "investigation_id": investigation_id,
        "event_count": len(res.timeline),
        "timeline": InvestigationSerializer.serialize_timeline(res.timeline),
    }


@router.get("/{investigation_id}/evidence")
def get_investigation_evidence(investigation_id: str):
    """Retrieves structured evidentiary items suitable for review."""
    res = INVESTIGATION_REGISTRY.get(investigation_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return {
        "investigation_id": investigation_id,
        "evidence_count": len(res.evidence_items),
        "evidence_items": [e.to_dict() for e in res.evidence_items],
    }


@router.get("/{investigation_id}/graph")
def get_investigation_graph(investigation_id: str):
    """Retrieves multi-rail graph metrics, paths, and cross-rail associations."""
    res = INVESTIGATION_REGISTRY.get(investigation_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return {
        "investigation_id": investigation_id,
        "graph_summary": res.graph_summary,
        "graph_paths": res.graph_paths,
        "cross_rail_associations": res.cross_rail_associations,
    }
