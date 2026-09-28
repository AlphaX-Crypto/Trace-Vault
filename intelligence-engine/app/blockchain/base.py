from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseBlockchainAdapter(ABC):
    """
    Abstract Base Class for Blockchain Data Adapters in TRACEVAULT V2.
    Defines the contract for fetching on-chain transaction records and entity intelligence.
    """

    @abstractmethod
    def get_transactions(self, address: str) -> List[Dict[str, Any]]:
        """
        Fetch all incoming and outgoing transaction records for the given address.
        Returns a list of raw transaction dictionaries.
        """
        pass

    @abstractmethod
    def get_entity_info(self, address: str) -> Optional[Dict[str, Any]]:
        """
        Lookup known entity/VASP intelligence metadata for the given address.
        Returns entity dictionary or None if unknown/unhosted.
        """
        pass

    @property
    @abstractmethod
    def is_live(self) -> bool:
        """Returns True if the adapter queries live blockchain RPC/indexers."""
        pass
