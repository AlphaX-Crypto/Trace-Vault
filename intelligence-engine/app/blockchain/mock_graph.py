from app.core.interfaces import IGraphProvider
from typing import List, Optional, Tuple
from collections import deque

class MockGraphProvider(IGraphProvider):
    def __init__(self):
        self.adj_list = {}

    def build_graph(self, transactions: List[any]):
        for tx in transactions:
            if tx.from_address not in self.adj_list:
                self.adj_list[tx.from_address] = []
            if tx.to_address not in self.adj_list:
                self.adj_list[tx.to_address] = []
            self.adj_list[tx.from_address].append(tx.to_address)

    def find_nearest_vasp(self, start_address: str, entity_lookup_func) -> Optional[Tuple[str, int, List[str]]]:
        if start_address not in self.adj_list:
            return None
            
        queue = deque([(start_address, 0, [start_address])])
        visited = set([start_address])
        
        while queue:
            current, dist, path = queue.popleft()
            
            # Check if current is a VASP
            entity = entity_lookup_func(current)
            if entity and entity.get("type") in ["VASP", "EXCHANGE", "DEPOSIT_WALLET"]:
                return (current, dist, path)
                
            for neighbor in self.adj_list.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, dist + 1, path + [neighbor]))
                    
        return None
