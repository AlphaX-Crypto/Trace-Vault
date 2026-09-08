from fastapi import APIRouter, HTTPException
from app.models.analysis import AnalyzeWalletRequest, AnalysisResult
from app.services.analysis_service import AnalysisService

router = APIRouter()
analysis_service = AnalysisService()

@router.post("/api/v1/analyze-wallet", response_model=AnalysisResult)
def analyze_wallet(request: AnalyzeWalletRequest):
    if not request.wallet_address:
        raise HTTPException(status_code=400, detail="Wallet address is required")
    if request.blockchain not in ["ethereum", "bitcoin", "tron", "bnb", "solana", "polygon"]:
        raise HTTPException(status_code=400, detail="Unsupported blockchain")
        
    try:
        result = analysis_service.analyze_wallet(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
