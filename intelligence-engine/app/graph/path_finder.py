from typing import List, Optional, Tuple
import networkx as nx
from app.models.analysis import PathEdge, PathNode, TracePath


class PathFinder:
    """Extracts transaction path nodes and edge details between suspect wallet and target entity."""

    def __init__(self, graph: nx.DiGraph):
        self.graph = graph

    def get_shortest_path_nodes(self, start_address: str, target_address: str) -> List[str]:
        """
        Finds the shortest directed path sequence of node addresses.
        Returns e.g. ['0xa', '0xb', '0xc', '0xbinance']. Returns empty list if no path.
        """
        start = start_address.lower()
        target = target_address.lower()

        if not self.graph.has_node(start) or not self.graph.has_node(target):
            return []

        try:
            return nx.shortest_path(self.graph, source=start, target=target)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def get_hop_count(self, start_address: str, target_address: str) -> int:
        """
        Calculates total number of hops (edges) along the shortest path.
        Returns hop count (0 if same node, >0 if path exists), or -1 if no path.
        """
        nodes = self.get_shortest_path_nodes(start_address, target_address)
        if not nodes:
            return -1
        return len(nodes) - 1

    def get_path(self, start_address: str, target_address: str) -> TracePath:
        """Find shortest path in directed graph and format nodes & edges."""
        start = start_address.lower()
        target = target_address.lower()

        trace_path = TracePath()

        if not self.graph.has_node(start) or not self.graph.has_node(target):
            return trace_path

        try:
            node_list = nx.shortest_path(self.graph, source=start, target=target)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            node_data = self.graph.nodes.get(start, {})
            trace_path.nodes.append(
                PathNode(
                    address=start,
                    hop=0,
                    entity_type=node_data.get("entity_type", "UNKNOWN"),
                    entity_name=node_data.get("entity_name"),
                )
            )
            return trace_path

        for index, node_addr in enumerate(node_list):
            node_data = self.graph.nodes.get(node_addr, {})
            trace_path.nodes.append(
                PathNode(
                    address=node_addr,
                    hop=index,
                    entity_type=node_data.get("entity_type", "UNKNOWN"),
                    entity_name=node_data.get("entity_name"),
                )
            )

        for i in range(len(node_list) - 1):
            u, v = node_list[i], node_list[i + 1]
            edge_data = self.graph.get_edge_data(u, v)
            if edge_data:
                txs = edge_data.get("transactions", [])
                if txs:
                    first_tx = txs[0]
                    trace_path.edges.append(
                        PathEdge(
                            from_address=u,
                            to_address=v,
                            amount=first_tx.get("amount", edge_data.get("total_amount", 0.0)),
                            asset=first_tx.get("asset", "ETH"),
                            transaction_hash=first_tx.get("transaction_hash", ""),
                            timestamp=first_tx.get("timestamp"),
                        )
                    )

        return trace_path

