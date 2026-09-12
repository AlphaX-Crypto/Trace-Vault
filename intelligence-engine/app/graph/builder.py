from typing import List, Optional
import networkx as nx
from app.models.transaction import Transaction
from app.graph.graph_models import GraphEdge, GraphNode


class TransactionGraphBuilder:
    """Builds a NetworkX directed graph from normalized blockchain transactions."""

    def __init__(self, graph: Optional[nx.DiGraph] = None):
        self.graph = graph if graph is not None else nx.DiGraph()

    def add_transaction(self, tx: Transaction) -> None:
        """Add a single transaction into the graph, updating node and edge data."""
        from_addr = tx.from_address.lower()
        to_addr = tx.to_address.lower()

        if not self.graph.has_node(from_addr):
            node_data = GraphNode(address=from_addr, blockchain=tx.blockchain)
            self.graph.add_node(from_addr, **node_data.to_dict())

        if not self.graph.has_node(to_addr):
            node_data = GraphNode(address=to_addr, blockchain=tx.blockchain)
            self.graph.add_node(to_addr, **node_data.to_dict())

        edge_data = GraphEdge(
            transaction_hash=tx.transaction_hash,
            amount=tx.amount,
            asset=tx.asset,
            timestamp=tx.timestamp.isoformat() if hasattr(tx.timestamp, "isoformat") else str(tx.timestamp),
            blockchain=tx.blockchain,
            transaction_type=tx.transaction_type,
        )

        if self.graph.has_edge(from_addr, to_addr):
            self.graph[from_addr][to_addr]["transactions"].append(edge_data.to_dict())
            self.graph[from_addr][to_addr]["total_amount"] += tx.amount
        else:
            self.graph.add_edge(
                from_addr,
                to_addr,
                transactions=[edge_data.to_dict()],
                total_amount=tx.amount,
                asset=tx.asset,
                primary_tx_hash=tx.transaction_hash,
            )

    def build_graph(self, transactions: List[Transaction]) -> nx.DiGraph:
        """Populate NetworkX graph from a list of transactions."""
        for tx in transactions:
            self.add_transaction(tx)
        return self.graph

    def get_graph(self) -> nx.DiGraph:
        """Return the constructed NetworkX DiGraph instance."""
        return self.graph

    def node_count(self) -> int:
        """Return total number of unique address nodes in graph."""
        return self.graph.number_of_nodes()

    def edge_count(self) -> int:
        """Return total number of directed edges in graph."""
        return self.graph.number_of_edges()

    def has_node(self, address: str) -> bool:
        """Check if an address exists as a node in graph."""
        return self.graph.has_node(address.lower())

    def has_edge(self, from_address: str, to_address: str) -> bool:
        """Check if a directed edge exists between two addresses."""
        return self.graph.has_edge(from_address.lower(), to_address.lower())

