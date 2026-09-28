import os
from typing import Optional

from app.upi.base import BaseUPIAdapter
from app.upi.mock import MockUPIAdapter
from app.upi.models import (
    PROHIBITED_CREDENTIAL_KEYS,
    UPIEntityType,
    UPIRawEvent,
    UPIStatus,
    UPITransaction,
    UPITransactionType,
    validate_vpa,
)
from app.upi.normalizer import UPITransactionNormalizer


def get_upi_adapter(source: Optional[str] = None) -> BaseUPIAdapter:
    """
    Factory for selecting and instantiating the authorized UPI adapter.
    Enforces Phase 12 safety:
    - 'mock' returns the deterministic MockUPIAdapter.
    - 'live' raises a clear descriptive ValueError (does NOT silently fall back to mock).
    - Unknown sources raise a clear ValueError.
    """
    target = (source or os.getenv("UPI_DATA_SOURCE", "mock")).strip().lower()
    if target == "mock":
        return MockUPIAdapter()
    elif target == "live":
        raise ValueError(
            "Live UPI connectivity is not authorized, licensed, or implemented in Phase 12. "
            "Configure 'UPI_DATA_SOURCE=mock' for development and testing."
        )
    else:
        raise ValueError(
            f"Unsupported UPI data source '{target}'. Allowed configurations in Phase 12: 'mock'."
        )


__all__ = [
    "BaseUPIAdapter",
    "MockUPIAdapter",
    "UPIRawEvent",
    "UPITransaction",
    "UPITransactionNormalizer",
    "UPITransactionType",
    "UPIStatus",
    "UPIEntityType",
    "PROHIBITED_CREDENTIAL_KEYS",
    "validate_vpa",
    "get_upi_adapter",
]
