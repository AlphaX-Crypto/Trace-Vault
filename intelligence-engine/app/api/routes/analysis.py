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
    Sprint 1:
    Ethereum mock adapter only.

    Future:
    Bitcoin, Tron, BNB, Solana, Polygon.
    """
    if not request.wallet_address:
        raise HTTPException(status_code=400, detail="Wallet address is required.")
    
    if request.blockchain != "ethereum":
        raise HTTPException(status_code=400, detail="Unsupported blockchain")
        
    try:
        result = analysis_service.analyze_wallet(request)
        return result
    except Exception as e:
        logger.error(f"Internal error analyzing wallet {request.wallet_address}: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during analysis.")
