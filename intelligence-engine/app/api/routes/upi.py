import logging
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query

from app.upi import MockUPIAdapter, UPITransaction, get_upi_adapter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/upi", tags=["UPI Data Foundation"])
adapter = get_upi_adapter("mock")


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
