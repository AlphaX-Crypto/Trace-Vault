from pydantic import BaseModel
from enum import Enum
from typing import Optional, List

class EntityType(str, Enum):
    UNKNOWN = "UNKNOWN"
    WALLET = "WALLET"
    VASP = "VASP"
    EXCHANGE = "EXCHANGE"
    MIXER = "MIXER"
    BRIDGE = "BRIDGE"
    CONTRACT = "CONTRACT"
    DEPOSIT_WALLET = "DEPOSIT_WALLET"

class Entity(BaseModel):
    identifier: str
    name: str
    entity_type: EntityType
    blockchain: str
    addresses: Optional[List[str]] = []
    source: str
