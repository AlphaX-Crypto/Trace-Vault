from typing import Any, Dict, List, Optional, Set, Union
import networkx as nx

from app.graph.unified.models import (
    FinancialRail,
    UnifiedNodeType,
    UnifiedEdgeType,
    UnifiedNode,
    UnifiedEdge,
    CrossRailAssociation,
    make_deterministic_node_id,
)
from app.graph.unified.adapters import (
    CryptoGraphAdapter,
    UPIGraphAdapter,
    GeospatialGraphAdapter,
    CrossRailAdapter,
)
from app.models.transaction import CommonTransaction
from app.upi.models import UPITransaction
from app.geospatial.models import LocationSignal


class UnifiedGraphBuilder:
    """
    Constructs and maintains a canonical multi-rail NetworkX graph.
    Integrates Crypto, UPI, VASP attribution, Geospatial signals, and Cross-Rail links.
    Maintains deduplicated node and edge collections with risk and evidentiary merges.
    """

    def __init__(self, graph: Optional[nx.MultiDiGraph] = None):
        self.graph = graph if graph is not None else nx.MultiDiGraph()
        self._nodes: Dict[str, UnifiedNode] = {}
        self._edges: Dict[str, UnifiedEdge] = {}
        self._cross_rail_associations: List[CrossRailAssociation] = []

    def add_node(self, node: UnifiedNode) -> UnifiedNode:
        """
        Adds a node to the graph or merges it if it already exists.
        Merging behavior:
        - risk_score = max(existing, new)
        - tags = union(existing, new)
        - source_references = union(existing, new)
        - risk_references = union(existing, new)
        - evidence_references = union(existing, new)
        - entity_name = updated if previously unset
        - metadata = merged
        """
        node_id = node.node_id
        if node_id in self._nodes:
            existing = self._nodes[node_id]
            merged_risk = max(existing.risk_score, node.risk_score)
            merged_tags = sorted(list(set(existing.tags + node.tags)))
            merged_sources = sorted(list(set(existing.source_references + node.source_references)))
            merged_risk_refs = sorted(list(set(existing.risk_references + node.risk_references)))
            merged_evidence_refs = sorted(list(set(existing.evidence_references + node.evidence_references)))
            merged_entity_name = existing.entity_name or node.entity_name
            merged_metadata = {**existing.metadata, **node.metadata}

            merged_node = UnifiedNode(
                node_id=node_id,
                node_type=existing.node_type or node.node_type,
                rail=existing.rail or node.rail,
                label=existing.label or node.label,
                entity_name=merged_entity_name,
                risk_score=merged_risk,
                tags=merged_tags,
                metadata=merged_metadata,
                source_references=merged_sources,
                risk_references=merged_risk_refs,
                evidence_references=merged_evidence_refs,
            )
            self._nodes[node_id] = merged_node
            self.graph.nodes[node_id].update(merged_node.to_dict())
            return merged_node
        else:
            self._nodes[node_id] = node
            self.graph.add_node(node_id, **node.to_dict())
            return node

    def _ensure_placeholder_node(self, node_id: str, rail: str = FinancialRail.CRYPTO.value) -> UnifiedNode:
        """Ensures a node exists in graph even if only observed as an edge endpoint."""
        if node_id in self._nodes:
            return self._nodes[node_id]

        # Determine node type from prefix
        if node_id.startswith("wallet:"):
            n_type = UnifiedNodeType.WALLET.value
            r = FinancialRail.CRYPTO.value
            raw_id = node_id.replace("wallet:", "")
            label = f"{raw_id[:8]}...{raw_id[-6:]}" if len(raw_id) > 14 else raw_id
        elif node_id.startswith("upi:"):
            n_type = UnifiedNodeType.UPI_VPA.value
            r = FinancialRail.UPI.value
            label = node_id.replace("upi:", "")
        elif node_id.startswith("merchant:"):
            n_type = UnifiedNodeType.MERCHANT.value
            r = FinancialRail.UPI.value
            label = f"Merchant {node_id.replace('merchant:', '')}"
        elif node_id.startswith("vasp:"):
            n_type = UnifiedNodeType.VASP.value
            r = FinancialRail.CRYPTO.value
            label = node_id.replace("vasp:", "")
        elif node_id.startswith("location:"):
            n_type = UnifiedNodeType.LOCATION.value
            r = FinancialRail.CROSS_RAIL.value
            label = "Location Node"
        else:
            n_type = UnifiedNodeType.ENTITY.value
            r = rail
            label = node_id

        node = UnifiedNode(
            node_id=node_id,
            node_type=n_type,
            rail=r,
            label=label,
            tags=["inferred_endpoint"],
        )
        return self.add_node(node)

    def add_edge(self, edge: UnifiedEdge) -> UnifiedEdge:
        """
        Adds an edge to the graph. Ensures endpoints exist.
        Merges metadata and evidence references if edge ID is already present.
        """
        self._ensure_placeholder_node(edge.source, rail=edge.rail)
        self._ensure_placeholder_node(edge.target, rail=edge.rail)

        edge_id = edge.edge_id
        if edge_id in self._edges:
            existing = self._edges[edge_id]
            merged_evidence = sorted(list(set(existing.evidence_references + edge.evidence_references)))
            merged_metadata = {**existing.metadata, **edge.metadata}
            merged_edge = UnifiedEdge(
                edge_id=edge_id,
                source=existing.source,
                target=existing.target,
                edge_type=existing.edge_type,
                rail=existing.rail,
                transaction_id=existing.transaction_id or edge.transaction_id,
                timestamp=existing.timestamp or edge.timestamp,
                amount=existing.amount if existing.amount is not None else edge.amount,
                currency=existing.currency or edge.currency,
                metadata=merged_metadata,
                evidence_references=merged_evidence,
            )
            self._edges[edge_id] = merged_edge
            if self.graph.has_edge(edge.source, edge.target, key=edge_id):
                self.graph[edge.source][edge.target][edge_id].update(merged_edge.to_dict())
            return merged_edge
        else:
            self._edges[edge_id] = edge
            self.graph.add_edge(edge.source, edge.target, key=edge_id, **edge.to_dict())
            return edge

    def add_crypto_transaction(
        self,
        tx: Union[CommonTransaction, Dict[str, Any]],
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, UnifiedNode, UnifiedEdge]:
        """Ingests a cryptocurrency transaction."""
        from_node, to_node, edge = CryptoGraphAdapter.convert_transaction(tx, evidence_id=evidence_id)
        saved_from = self.add_node(from_node)
        saved_to = self.add_node(to_node)
        saved_edge = self.add_edge(edge)
        return saved_from, saved_to, saved_edge

    def add_vasp_attribution(
        self,
        wallet_address: str,
        vasp_name: str,
        deposit_address: Optional[str] = None,
        risk_score: float = 0.0,
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, UnifiedEdge]:
        """Ingests a VASP attribution record."""
        vasp_node, edge = CryptoGraphAdapter.convert_attribution(
            wallet_address=wallet_address,
            vasp_name=vasp_name,
            deposit_address=deposit_address,
            risk_score=risk_score,
            evidence_id=evidence_id,
        )
        saved_vasp = self.add_node(vasp_node)
        saved_edge = self.add_edge(edge)
        return saved_vasp, saved_edge

    def add_upi_transaction(
        self,
        tx: Union[UPITransaction, Dict[str, Any]],
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, UnifiedNode, UnifiedEdge, Optional[UnifiedNode], Optional[UnifiedEdge]]:
        """Ingests a UPI transaction and optional merchant association."""
        sender_node, receiver_node, edge, merchant_node, merchant_edge = UPIGraphAdapter.convert_transaction(
            tx, evidence_id=evidence_id
        )
        saved_sender = self.add_node(sender_node)
        saved_receiver = self.add_node(receiver_node)
        saved_edge = self.add_edge(edge)

        saved_merchant = None
        saved_merchant_edge = None
        if merchant_node and merchant_edge:
            saved_merchant = self.add_node(merchant_node)
            saved_merchant_edge = self.add_edge(merchant_edge)

        return saved_sender, saved_receiver, saved_edge, saved_merchant, saved_merchant_edge

    def add_location_signal(
        self,
        signal: Union[LocationSignal, Dict[str, Any]],
        linked_node_id: Optional[str] = None,
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, Optional[UnifiedEdge]]:
        """Ingests a location observation linked to an entity or transaction."""
        loc_node, edge = GeospatialGraphAdapter.convert_signal(
            signal, linked_node_id=linked_node_id, evidence_id=evidence_id
        )
        saved_loc = self.add_node(loc_node)
        saved_edge = self.add_edge(edge) if edge else None
        return saved_loc, saved_edge

    def add_cross_rail_association(self, assoc: CrossRailAssociation) -> UnifiedEdge:
        """
        Ingests an explicit cross-rail association.
        CRITICAL: Tagged as analytical association, NOT personhood proof.
        """
        self._cross_rail_associations.append(assoc)
        edge = CrossRailAdapter.convert(assoc)
        saved_edge = self.add_edge(edge)
        return saved_edge

    def get_node(self, node_id: str) -> Optional[UnifiedNode]:
        return self._nodes.get(node_id)

    def get_edge(self, edge_id: str) -> Optional[UnifiedEdge]:
        return self._edges.get(edge_id)

    def all_nodes(self) -> List[UnifiedNode]:
        return list(self._nodes.values())

    def all_edges(self) -> List[UnifiedEdge]:
        return list(self._edges.values())

    def cross_rail_associations(self) -> List[CrossRailAssociation]:
        return list(self._cross_rail_associations)

    def get_graph(self) -> nx.MultiDiGraph:
        """Returns the underlying NetworkX MultiDiGraph instance."""
        return self.graph

    def to_digraph(self) -> nx.DiGraph:
        """Converts MultiDiGraph to a standard DiGraph for algorithms requiring simple directed graphs."""
        dg = nx.DiGraph()
        for n, data in self.graph.nodes(data=True):
            dg.add_node(n, **data)
        for u, v, data in self.graph.edges(data=True):
            if not dg.has_edge(u, v):
                dg.add_edge(u, v, **data)
        return dg

    def get_stats(self) -> Dict[str, Any]:
        """Provides statistical summary of graph nodes, edges, rails, and associations."""
        rail_node_counts: Dict[str, int] = {}
        type_node_counts: Dict[str, int] = {}
        for n in self._nodes.values():
            rail_node_counts[n.rail] = rail_node_counts.get(n.rail, 0) + 1
            type_node_counts[n.node_type] = type_node_counts.get(n.node_type, 0) + 1

        rail_edge_counts: Dict[str, int] = {}
        type_edge_counts: Dict[str, int] = {}
        for e in self._edges.values():
            rail_edge_counts[e.rail] = rail_edge_counts.get(e.rail, 0) + 1
            type_edge_counts[e.edge_type] = type_edge_counts.get(e.edge_type, 0) + 1

        return {
            "total_nodes": len(self._nodes),
            "total_edges": len(self._edges),
            "node_counts_by_rail": rail_node_counts,
            "node_counts_by_type": type_node_counts,
            "edge_counts_by_rail": rail_edge_counts,
            "edge_counts_by_type": type_edge_counts,
            "cross_rail_association_count": len(self._cross_rail_associations),
            "has_cross_rail_bridges": len(self._cross_rail_associations) > 0,
        }
