from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.upi.models import UPITransaction


class BaseUPIAdapter(ABC):
    """
    Abstract Base Class for UPI Data Ingestion Adapters.
    Defines common retrieval contracts for fetching transaction records by ID or VPA.
    """

    @property
    @abstractmethod
    def data_source(self) -> str:
        """Returns the canonical data source identifier (e.g. 'mock_upi')."""
        pass

    @property
    @abstractmethod
    def is_live(self) -> bool:
        """Indicates whether this adapter interacts with live banking/rail infrastructure."""
        pass

    @abstractmethod
    def get_transaction(self, transaction_id: str) -> Optional[UPITransaction]:
        """Retrieve a single normalized UPI transaction by unique identifier."""
        pass

    @abstractmethod
    def get_transactions(self, vpa: str, limit: int = 50) -> List[UPITransaction]:
        """Retrieve transactions associated with a given VPA (as sender or receiver)."""
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Perform operational liveness probe for the adapter."""
        pass
