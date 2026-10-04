import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.upi import (
    MockUPIAdapter,
    UPITransaction,
    UPITransactionNormalizer,
    get_upi_adapter,
)
from app.upi.intelligence import (
    UPIFraudIntelligenceEngine,
    UPIRuleConfig,
)
from app.geospatial import (
    GeoRuleConfig,
    GeospatialIntelligenceEngine,
    LocationNormalizer,
    get_geo_scenario,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/upi", tags=["UPI Data Foundation & Fraud Intelligence"])
adapter = get_upi_adapter("mock")
engine = UPIFraudIntelligenceEngine()
geo_engine = GeospatialIntelligenceEngine()


class UPIAnalyzeRequest(BaseModel):
    subject_vpa: Optional[str] = Field(default=None, description="Investigated subject VPA")
    scenario: Optional[str] = Field(default=None, description="Optional synthetic scenario ID (e.g. UPI-RISK-001)")
    transactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Target transaction records to analyze")
    baseline_transactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Baseline historical transactions")
    config: Optional[Dict[str, Any]] = Field(default=None, description="Optional rule threshold overrides")


@router.post("/analyze", response_model=Dict[str, Any])
def analyze_upi_transactions(request: UPIAnalyzeRequest):
    """
    Executes explainable behavioral fraud intelligence on a target batch of UPI transactions.
    Supports on-demand payload or synthetic test scenario resolution.
    Strictly deterministic and safe: no ML, no live banking, rejects credentials.
    """
    try:
        subject = request.subject_vpa or ""
        target_txs: List[UPITransaction] = []
        baseline_txs: List[UPITransaction] = []

        # If a scenario ID was provided, resolve scenario data if payload is empty
        if request.scenario:
            scenario_data = adapter.get_scenario(request.scenario)
            if not subject:
                subject = scenario_data.get("subject", "")
            if not request.transactions:
                target_txs = scenario_data.get("transactions", [])
            if not request.baseline_transactions:
                baseline_txs = scenario_data.get("baseline_transactions", [])

        # Normalize any provided raw transactions
        if request.transactions:
            target_txs = [
                UPITransactionNormalizer.normalize(tx, default_source="mock_upi")
                for tx in request.transactions
            ]

        if request.baseline_transactions:
            baseline_txs = [
                UPITransactionNormalizer.normalize(tx, default_source="mock_upi")
                for tx in request.baseline_transactions
            ]

        if not target_txs:
            raise HTTPException(
                status_code=400,
                detail="No transactions provided or resolved for analysis.",
            )

        if not subject:
            subject = target_txs[0].sender_vpa

        # Custom config if supplied
        rule_config = UPIRuleConfig(**request.config) if request.config else None

        result = engine.analyze(
            subject=subject,
            transactions=target_txs,
            baseline_transactions=baseline_txs,
            config=rule_config,
        )

        return result.to_dict()

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"UPI analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal UPI analysis error: {str(e)}")


class GeospatialAnalyzeRequest(BaseModel):
    subject: Optional[str] = Field(default=None, description="Investigated subject identifier or VPA")
    scenario: Optional[str] = Field(default=None, description="Optional synthetic scenario ID (e.g. GEO-DEMO-001)")
    locations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Transaction-associated location signals")
    baseline_locations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Baseline historical location signals")
    config: Optional[Dict[str, Any]] = Field(default=None, description="Optional geo rule configuration overrides")


@router.post("/geospatial/analyze", response_model=Dict[str, Any])
def analyze_geospatial_signals(request: GeospatialAnalyzeRequest):
    """
    Executes explainable geospatial anomaly and location consistency analysis.
    Supports on-demand location signals or preconfigured synthetic demonstration scenarios.
    Strictly deterministic and safe: no live GPS, no IP geolocation, no tracking of individuals.
    """
    try:
        subject = request.subject or ""
        raw_locs: List[Dict[str, Any]] = []
        raw_baseline: List[Dict[str, Any]] = []

        if request.scenario:
            scenario_data = get_geo_scenario(request.scenario)
            if not subject:
                subject = scenario_data.get("subject", "")
            if not request.locations:
                raw_locs = scenario_data.get("locations", [])
            if not request.baseline_locations:
                raw_baseline = scenario_data.get("baseline_locations", [])

        if request.locations:
            raw_locs = request.locations
        if request.baseline_locations:
            raw_baseline = request.baseline_locations

        if not raw_locs:
            raise HTTPException(
                status_code=400,
                detail="No location signals provided or resolved for analysis.",
            )

        if not subject:
            subject = "anonymous_subject"

        rule_config = GeoRuleConfig(**request.config) if request.config else None

        result = geo_engine.analyze(
            subject=subject,
            locations=raw_locs,
            baseline_locations=raw_baseline,
            config=rule_config,
        )

        return result.to_dict()

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Geospatial analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal geospatial analysis error: {str(e)}")



@router.get("/transactions/{transaction_id}", response_model=Dict[str, Any])
def get_upi_transaction(transaction_id: str):
    """
    Retrieve normalized UPI transaction record by unique identifier.
    Used for internal testing, validation, and demo verification.
    """
    tx = adapter.get_transaction(transaction_id)
    if not tx:
        raise HTTPException(
            status_code=404,
            detail=f"UPI transaction '{transaction_id}' not found.",
        )
    return tx.to_dict()


@router.get("/history/{vpa}", response_model=List[Dict[str, Any]])
def get_vpa_history(vpa: str, limit: int = Query(default=50, ge=1, le=100)):
    """
    Retrieve all normalized UPI transactions associated with a given VPA.
    """
    txs = adapter.get_transactions(vpa, limit=limit)
    return [tx.to_dict() for tx in txs]


@router.get("/health", response_model=Dict[str, Any])
def get_upi_health():
    """Operational health probe for the UPI adapter."""
    return adapter.health_check()
