from abc import ABC, abstractmethod
from typing import List, Dict, Tuple, Optional

class IGraphProvider(ABC):
    @abstractmethod
    def build_graph(self, transactions: List[any]):
        pass

    @abstractmethod
    def find_nearest_vasp(self, start_address: str, entity_lookup_func) -> Optional[Tuple[str, int, List[str]]]:
        pass
