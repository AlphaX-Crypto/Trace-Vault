from typing import Any, Dict, List, Optional, Set
import networkx as nx

from app.graph.unified.models import (
    FinancialRail,
    UnifiedNodeType,
    UnifiedEdgeType,
    UnifiedNode,
    UnifiedEdge,
)
from app.graph.unified.builder import UnifiedGraphBuilder


class UnifiedGraphTraversal:
    """
    High-performance graph traversal and path-finding engine for multi-rail financial graphs.
    Enforces deterministic hop metrics (1 edge = 1 hop) and strict rail filtering.
    """

    def __init__(self, builder: UnifiedGraphBuilder):
        self.builder = builder
        self.graph = builder.get_graph()

    def get_subgraph_by_rail(self, rail: str) -> nx.MultiDiGraph:
        """
        Extracts a filtered subgraph consisting strictly of nodes and edges matching the rail.
        """
        target_rail = rail.upper()
        sub = nx.MultiDiGraph()

        # Add matching nodes
        for node_id, data in self.graph.nodes(data=True):
            if data.get("rail", "").upper() == target_rail:
                sub.add_node(node_id, **data)

        # Add matching edges where both endpoints are present
        for u, v, key, data in self.graph.edges(keys=True, data=True):
            if data.get("rail", "").upper() == target_rail and sub.has_node(u) and sub.has_node(v):
                sub.add_edge(u, v, key=key, **data)

        return sub

    def find_simple_paths(
        self,
        source_id: str,
        target_id: str,
        max_depth: int = 5,
        rail_filter: Optional[str] = None,
    ) -> List[List[str]]:
        """
        Finds all simple node paths between source and target within max_depth hops.
        """
        if not self.graph.has_node(source_id) or not self.graph.has_node(target_id):
            return []

        search_graph = self.graph
        if rail_filter:
            search_graph = self.get_subgraph_by_rail(rail_filter)
            if not search_graph.has_node(source_id) or not search_graph.has_node(target_id):
                return []

        # Convert to simple DiGraph for NetworkX all_simple_paths
        simple_dg = nx.DiGraph(search_graph)
        try:
            return list(nx.all_simple_paths(simple_dg, source=source_id, target=target_id, cutoff=max_depth))
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def find_all_paths_with_edges(
        self,
        source_id: str,
        target_id: str,
        max_depth: int = 5,
        rail_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Finds all paths between source and target, including rich edge metadata,
        hop counts, rails traversed, and whether path traverses cross-rail bridges.
        """
        node_paths = self.find_simple_paths(
            source_id=source_id,
            target_id=target_id,
            max_depth=max_depth,
            rail_filter=rail_filter,
        )

        detailed_paths = []
        for path in node_paths:
            hops = len(path) - 1
            path_edges = []
            rails_seen = set()

            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                edge_dict = self.graph.get_edge_data(u, v) or {}
                # Take the primary or first edge between u and v
                if edge_dict:
                    first_key = next(iter(edge_dict))
                    edge_data = edge_dict[first_key]
                    rail = edge_data.get("rail", FinancialRail.CRYPTO.value)
                    rails_seen.add(rail)
                    path_edges.append({
                        "edge_id": edge_data.get("edge_id", first_key),
                        "source": u,
                        "target": v,
                        "edge_type": edge_data.get("edge_type", UnifiedEdgeType.TRANSACTED_WITH.value),
                        "rail": rail,
                        "amount": edge_data.get("amount"),
                        "currency": edge_data.get("currency"),
                        "transaction_id": edge_data.get("transaction_id"),
                    })

            # Check nodes' rails
            for node_id in path:
                n_data = self.graph.nodes[node_id]
                rails_seen.add(n_data.get("rail", FinancialRail.CRYPTO.value))

            is_cross_rail = len(rails_seen - {FinancialRail.CROSS_RAIL.value}) > 1 or FinancialRail.CROSS_RAIL.value in rails_seen

            detailed_paths.append({
                "nodes": path,
                "edges": path_edges,
                "hop_count": hops,
                "rails_traversed": sorted(list(rails_seen)),
                "is_cross_rail": is_cross_rail,
            })

        # Sort by shortest hop count first
        detailed_paths.sort(key=lambda p: p["hop_count"])
        return detailed_paths

    def find_cross_rail_paths(
        self,
        start_node_id: str,
        max_depth: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Discovers all paths originating from start_node_id that bridge multiple financial rails.
        """
        if not self.graph.has_node(start_node_id):
            return []

        start_rail = self.graph.nodes[start_node_id].get("rail")
        cross_rail_paths = []

        # Use BFS to explore nodes up to max_depth
        visited = set()
        queue = [[start_node_id]]

        while queue:
            current_path = queue.pop(0)
            curr = current_path[-1]

            if len(current_path) - 1 >= max_depth:
                continue

            for neighbor in self.graph.successors(curr):
                if neighbor in current_path:
                    continue  # avoid cycles

                new_path = current_path + [neighbor]
                queue.append(new_path)

                # Check if this neighbor is on a different rail or edge is cross-rail
                neighbor_rail = self.graph.nodes[neighbor].get("rail")
                edge_dict = self.graph.get_edge_data(curr, neighbor) or {}
                edge_rails = {data.get("rail") for data in edge_dict.values()}

                if (neighbor_rail and neighbor_rail != start_rail) or (FinancialRail.CROSS_RAIL.value in edge_rails):
                    # Convert to detailed path format
                    detailed = self.find_all_paths_with_edges(
                        source_id=start_node_id,
                        target_id=neighbor,
                        max_depth=len(new_path) - 1,
                    )
                    for dp in detailed:
                        if dp["nodes"] == new_path and dp["is_cross_rail"]:
                            cross_rail_paths.append(dp)

        return cross_rail_paths

    def find_neighbors(
        self,
        node_id: str,
        direction: str = "both",
        rail_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Returns adjacent nodes and connecting edges.
        direction: 'out' (successors), 'in' (predecessors), or 'both'.
        """
        if not self.graph.has_node(node_id):
            return []

        results = []
        out_edges = list(self.graph.out_edges(node_id, keys=True, data=True)) if direction in ("out", "both") else []
        in_edges = list(self.graph.in_edges(node_id, keys=True, data=True)) if direction in ("in", "both") else []

        for u, v, key, data in out_edges:
            if rail_filter and data.get("rail", "").upper() != rail_filter.upper():
                continue
            results.append({
                "direction": "outbound",
                "connected_node_id": v,
                "node_data": self.graph.nodes[v],
                "edge_data": data,
            })

        for u, v, key, data in in_edges:
            if rail_filter and data.get("rail", "").upper() != rail_filter.upper():
                continue
            results.append({
                "direction": "inbound",
                "connected_node_id": u,
                "node_data": self.graph.nodes[u],
                "edge_data": data,
            })

        return results

    def find_vasp_associations(self, start_node_id: str, max_depth: int = 4) -> List[Dict[str, Any]]:
        """
        Traverses outbound paths to locate any attributed VASP nodes.
        """
        if not self.graph.has_node(start_node_id):
            return []

        vasp_nodes = [
            n for n, d in self.graph.nodes(data=True)
            if d.get("node_type") == UnifiedNodeType.VASP.value
        ]

        associations = []
        for vasp_id in vasp_nodes:
            paths = self.find_all_paths_with_edges(start_node_id, vasp_id, max_depth=max_depth)
            if paths:
                shortest = paths[0]
                vasp_data = self.graph.nodes[vasp_id]
                associations.append({
                    "vasp_node_id": vasp_id,
                    "vasp_name": vasp_data.get("entity_name") or vasp_data.get("label"),
                    "hop_count": shortest["hop_count"],
                    "path": shortest["nodes"],
                    "risk_score": vasp_data.get("risk_score", 0.0),
                })

        associations.sort(key=lambda a: a["hop_count"])
        return associations
