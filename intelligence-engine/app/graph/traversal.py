from collections import deque
from typing import Dict, List, Optional, Set, Tuple
import networkx as nx


class BFSTraverser:
    """Performs Breadth-First Search (BFS) for node exploration and nearest entity discovery."""

    def __init__(self, graph: nx.DiGraph):
        self.graph = graph

    def bfs_traverse(
        self, start_address: str, max_depth: int = 5
    ) -> Tuple[List[str], Set[str], Dict[str, int]]:
        """
        Executes standard BFS traversal from start_address up to max_depth.
        Returns:
            traversal_order: List of node addresses in order visited
            visited: Set of visited node addresses
            distance_map: Dict mapping node address -> hop distance from start
        """
        start = start_address.lower()
        traversal_order: List[str] = []
        visited: Set[str] = set()
        distance_map: Dict[str, int] = {}

        if not self.graph.has_node(start):
            return traversal_order, visited, distance_map

        visited.add(start)
        queue = deque([(start, 0)])

        while queue:
            current_node, distance = queue.popleft()
            traversal_order.append(current_node)
            distance_map[current_node] = distance

            if distance < max_depth:
                for neighbor in self.graph.successors(current_node):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, distance + 1))

        return traversal_order, visited, distance_map

    def find_nearest_tagged_entity(
        self, start_address: str, max_hops: int = 5, target_types: Optional[Set[str]] = None
    ) -> Optional[Tuple[str, int, Dict]]:
        """
        Executes BFS from start_address up to max_hops to find nearest tagged entity.
        Returns Tuple of (target_address, distance_hops, node_attributes) or None.
        """
        start = start_address.lower()
        if not self.graph.has_node(start):
            return None

        if target_types is None:
            target_types = {"VASP", "EXCHANGE", "DEPOSIT_WALLET", "MIXER"}

        visited: Set[str] = {start}
        queue = deque([(start, 0)])

        while queue:
            current_node, distance = queue.popleft()

            if distance > 0:
                node_data = self.graph.nodes[current_node]
                entity_type = node_data.get("entity_type", "UNKNOWN")
                entity_name = node_data.get("entity_name")
                if entity_type in target_types or entity_name:
                    return current_node, distance, node_data

            if distance < max_hops:
                for neighbor in self.graph.successors(current_node):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, distance + 1))

        return None

    def find_nearest_vasp(
        self, start_address: str, max_depth: int = 5, vasp_names: Optional[List[str]] = None
    ) -> Optional[Tuple[str, int, Dict]]:
        """
        Executes BFS to find nearest VASP entity by matching entity_name or entity_type.
        """
        all_vasps = self.find_all_vasps(start_address=start_address, max_depth=max_depth, vasp_names=vasp_names)
        return all_vasps[0] if all_vasps else None

    def find_all_vasps(
        self, start_address: str, max_depth: int = 5, vasp_names: Optional[List[str]] = None
    ) -> List[Tuple[str, int, Dict]]:
        """
        Executes BFS to find all reachable VASP entities within max_depth.
        Returns a list of (target_address, distance, node_data) sorted by distance.
        """
        start = start_address.lower()
        if not self.graph.has_node(start):
            return []

        visited: Set[str] = {start}
        queue = deque([(start, 0)])
        results: List[Tuple[str, int, Dict]] = []
        found_addresses: Set[str] = set()

        while queue:
            current_node, distance = queue.popleft()

            if distance > 0:
                node_data = self.graph.nodes[current_node]
                name = node_data.get("entity_name")
                etype = node_data.get("entity_type", "UNKNOWN")

                is_vasp = False
                # Mixers are privacy services, not Virtual Asset Service Providers (VASPs)
                if str(etype).upper() == "MIXER":
                    is_vasp = False
                elif vasp_names:
                    if name and any(v.lower() in name.lower() for v in vasp_names):
                        is_vasp = True
                else:
                    if etype in ("VASP", "EXCHANGE", "DEPOSIT_WALLET") or (name and "mixer" not in name.lower()):
                        is_vasp = True

                if is_vasp and current_node not in found_addresses:
                    results.append((current_node, distance, node_data))
                    found_addresses.add(current_node)

            if distance < max_depth:
                # Do not traverse past terminal VASP deposit sinks
                if distance == 0 or current_node not in found_addresses:
                    for neighbor in self.graph.successors(current_node):
                        if neighbor not in visited:
                            visited.add(neighbor)
                            queue.append((neighbor, distance + 1))

        results.sort(key=lambda item: (item[1], item[0]))
        return results

