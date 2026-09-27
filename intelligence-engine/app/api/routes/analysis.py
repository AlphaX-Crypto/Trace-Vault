import logging
from fastapi import APIRouter, HTTPException
from app.models.analysis import AnalyzeWalletRequest, AnalysisResult
from app.services.analysis_service import AnalysisService

logger = logging.getLogger(__name__)
router = APIRouter()
analysis_service = AnalysisService()


@router.post("/api/v1/analyze-wallet", response_model=AnalysisResult)
def analyze_wallet(request: AnalyzeWalletRequest):
    """
    Automated Blockchain Intelligence & VASP Attribution Endpoint.
    Analyzes given target wallet, constructs NetworkX graph,
    performs BFS traversal, attributes nearest VASP, and computes multi-factor risk.
    """
    if not request.wallet_address or not request.wallet_address.strip():
        raise HTTPException(status_code=400, detail="Wallet address is required.")

    if request.blockchain.lower() != "ethereum":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported blockchain '{request.blockchain}'. Supported chains in MVP: ethereum.",
        )

    try:
        result = analysis_service.analyze_wallet(request)
        return result
    except Exception as e:
        logger.error(f"Internal error analyzing wallet {request.wallet_address}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during analysis.")
