from pydantic import BaseModel
from typing import List, Optional

class VaspAttribution(BaseModel):
    name: str
    distance: int
    confidence: int

class RiskResult(BaseModel):
    score: int
    level: str
    indicators: List[str]

class AnalysisResult(BaseModel):
    case_id: str
    wallet: str
    blockchain: str
    nearest_vasp: Optional[VaspAttribution] = None
    risk: RiskResult
    path: List[str]
    evidence: List[str]

class AnalyzeWalletRequest(BaseModel):
    case_id: str
    blockchain: str
    wallet_address: str
