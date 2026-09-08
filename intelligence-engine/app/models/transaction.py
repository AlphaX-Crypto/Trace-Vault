from pydantic import BaseModel
from typing import Optional

class NormalizedTransaction(BaseModel):
    transaction_hash: str
    blockchain: str
    timestamp: str
    from_address: str
    to_address: str
    asset: str
    amount: float
    transaction_type: str
    block_number: Optional[int] = None
    source: str
