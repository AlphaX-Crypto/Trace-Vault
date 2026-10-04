from decimal import Decimal
from typing import Any, Dict, List, Optional, Union

from app.graph.unified.models import (
    FinancialRail,
    UnifiedNodeType,
    UnifiedEdgeType,
    UnifiedNode,
    UnifiedEdge,
    CrossRailAssociation,
    UnifiedGraphAnalysisResult,
)
from app.graph.unified.builder import UnifiedGraphBuilder
from app.upi.models import PROHIBITED_CREDENTIAL_KEYS


def deep_sanitize(obj: Any) -> Any:
    """
    Recursively scrubs any prohibited credential fields and converts Decimals to float.
    """
    if isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                continue
            cleaned[k] = deep_sanitize(v)
        return cleaned
    elif isinstance(obj, (list, tuple, set)):
        return [deep_sanitize(item) for item in obj]
    elif isinstance(obj, Decimal):
        return float(obj)
    return obj


class UnifiedGraphSerializer:
    """
    Serializes multi-rail financial graph data structures into safe, standardized dictionaries.
    Guarantees no sensitive credentials leak into responses or logs.
    """

    @classmethod
    def serialize_node(cls, node: Union[UnifiedNode, Dict[str, Any]]) -> Dict[str, Any]:
        data = node.to_dict() if isinstance(node, UnifiedNode) else dict(node)
        return deep_sanitize(data)

    @classmethod
    def serialize_edge(cls, edge: Union[UnifiedEdge, Dict[str, Any]]) -> Dict[str, Any]:
        data = edge.to_dict() if isinstance(edge, UnifiedEdge) else dict(edge)
        return deep_sanitize(data)

    @classmethod
    def serialize_result(cls, result: UnifiedGraphAnalysisResult) -> Dict[str, Any]:
        data = result.to_dict()
        return deep_sanitize(data)

    @classmethod
    def to_cytoscape_format(cls, builder: UnifiedGraphBuilder) -> Dict[str, List[Dict[str, Any]]]:
        """
        Converts the unified graph into Cytoscape / VisJS friendly format for frontend investigation diagrams.
        """
        cytoscape_nodes = []
        for node in builder.all_nodes():
            n_dict = cls.serialize_node(node)
            cytoscape_nodes.append({
                "data": {
                    "id": n_dict["node_id"],
                    "label": n_dict["label"],
                    "node_type": n_dict["node_type"],
                    "rail": n_dict["rail"],
                    "risk_score": n_dict["risk_score"],
                    "tags": n_dict["tags"],
                    "entity_name": n_dict.get("entity_name"),
                    **n_dict.get("metadata", {}),
                }
            })

        cytoscape_edges = []
        for edge in builder.all_edges():
            e_dict = cls.serialize_edge(edge)
            cytoscape_edges.append({
                "data": {
                    "id": e_dict["edge_id"],
                    "source": e_dict["source"],
                    "target": e_dict["target"],
                    "edge_type": e_dict["edge_type"],
                    "rail": e_dict["rail"],
                    "amount": e_dict.get("amount"),
                    "currency": e_dict.get("currency"),
                    "transaction_id": e_dict.get("transaction_id"),
                    **e_dict.get("metadata", {}),
                }
            })

        return {
            "nodes": cytoscape_nodes,
            "edges": cytoscape_edges,
        }
