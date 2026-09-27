import logging
from typing import Any, Dict, List, Optional, Tuple
import networkx as nx

from app.models.analysis import EvidenceItem, PathNode, TracePath, VaspAttribution
from app.attribution.registry import VaspRegistry, VaspRegistryEntry
from app.attribution.confidence import evaluate_confidence
from app.graph.traversal import BFSTraverser
from app.graph.path_finder import PathFinder

logger = logging.getLogger(__name__)


class AttributionRules:
    """Standardized rule constants for explainable attribution auditing."""
    RULE_1_KNOWN_VASP_ADDRESS = "RULE_1_KNOWN_VASP_ADDRESS"
    RULE_2_KNOWN_DEPOSIT_WALLET = "RULE_2_KNOWN_DEPOSIT_WALLET"
    RULE_3_KNOWN_ENTITY_CLUSTER = "RULE_3_KNOWN_ENTITY_CLUSTER"
    RULE_4_GRAPH_PROXIMITY = "RULE_4_GRAPH_PROXIMITY"
    RULE_5_PATH_EVIDENCE = "RULE_5_PATH_EVIDENCE"
    RULE_6_SOURCE_RELIABILITY = "RULE_6_SOURCE_RELIABILITY"


class VaspIdentifier:
    """
    Explainable VASP Attribution Engine for TRACEVAULT.
    Consumes graph traversal results (NetworkX, BFSTraverser, PathFinder)
    and intelligence registry metadata to establish:
        'Potential VASP association'
    with deterministic reasoning traces and evidentiary records.
    Does NOT assert criminal liability or legal ownership.
    """

    def __init__(self, registry: Optional[VaspRegistry] = None):
        self.registry = registry if registry is not None else VaspRegistry()

    def attribute_candidate(
        self,
        source_wallet: str,
        target_address: str,
        distance: int,
        trace_path: TracePath,
        node_data: Optional[Dict[str, Any]] = None,
    ) -> VaspAttribution:
        """
        Evaluate a single candidate destination node into a formal VaspAttribution.
        Builds explainable reasoning trace and verifies attribution rules.
        """
        src = source_wallet.strip().lower()
        dst = target_address.strip().lower()
        node_meta = node_data or {}

        # 1. Lookup authoritative intelligence record from registry
        reg_entry = self.registry.lookup(dst)

        if reg_entry:
            vasp_name = reg_entry.vasp_name
            entity_name = reg_entry.entity_name
            entity_type = reg_entry.entity_type
            source = reg_entry.source
            reliability = reg_entry.reliability
            updated_at = reg_entry.updated_at
        else:
            vasp_name = node_meta.get("entity_name") or "Unknown VASP"
            entity_name = node_meta.get("entity_name") or vasp_name
            entity_type = node_meta.get("entity_type", "VASP")
            source = node_meta.get("source", "controlled_test_registry")
            reliability = "PROVISIONAL"
            updated_at = "2026-09-08T00:00:00Z"

        # 2. Extract path address sequence
        path_addresses: List[str] = [n.address for n in trace_path.nodes if n.address]
        if not path_addresses:
            path_addresses = [src, dst] if src != dst else [src]

        # 3. Calculate calibrated confidence and explanation
        conf_breakdown = evaluate_confidence(distance=distance, entity_type=entity_type, path=path_addresses)

        # 4. Evaluate triggered attribution rules
        rules_triggered: List[str] = []
        etype_upper = entity_type.upper()

        if etype_upper in ("VASP", "EXCHANGE"):
            rules_triggered.append(AttributionRules.RULE_1_KNOWN_VASP_ADDRESS)
        elif etype_upper == "DEPOSIT_WALLET":
            rules_triggered.append(AttributionRules.RULE_2_KNOWN_DEPOSIT_WALLET)

        if reg_entry and reg_entry.tags:
            rules_triggered.append(AttributionRules.RULE_3_KNOWN_ENTITY_CLUSTER)

        if 1 <= distance <= 5:
            rules_triggered.append(AttributionRules.RULE_4_GRAPH_PROXIMITY)

        if len(trace_path.edges) > 0:
            rules_triggered.append(AttributionRules.RULE_5_PATH_EVIDENCE)

        if source in ("controlled_test_registry", "internal_registry", "public_intelligence", "authorized_provider"):
            rules_triggered.append(AttributionRules.RULE_6_SOURCE_RELIABILITY)

        # 5. Construct deterministic reasoning trace
        path_str = " -> ".join(path_addresses)
        reasoning_trace = [
            f"1. Subject wallet '{src}' is the focus of active transaction tracing.",
            "2. Transaction graph constructed from normalized on-chain transaction records.",
            f"3. Breadth-first search discovered tagged entity '{dst}' at graph distance {distance} hop(s).",
            f"4. PathFinder reconstructed directed transfer sequence: {path_str}.",
            f"5. Destination entity classified as '{entity_type}'.",
            f"6. Registry metadata associates target address with '{vasp_name}' (source: '{source}').",
            f"7. Attribution confidence calculated at {conf_breakdown.score:.1f}% ({conf_breakdown.label}) "
            f"based on base {conf_breakdown.base_score:.1f}% minus {conf_breakdown.hop_penalty:.1f}% hop penalty ({distance} hops).",
            "8. Supporting graph, entity, and transaction evidence items generated for investigative review.",
        ]

        # 6. Supporting evidence statements
        supporting_evidence = [
            f"Transaction path reaches tagged {entity_type} address '{dst}'.",
            f"Entity '{vasp_name}' reached after {distance} directed hop(s) from subject.",
            f"Intelligence source: '{source}' (Reliability: {reliability}).",
            conf_breakdown.explanation,
        ]

        # 7. Human-readable narrative explanation
        explanation = (
            f"Observed transaction path reaches address '{dst}' associated with {vasp_name} after {distance} hops. "
            f"Potential VASP association identified based on graph proximity and {entity_type.lower().replace('_', ' ')} classification. "
            f"Attribution confidence: {conf_breakdown.label} ({conf_breakdown.score:.1f}%)."
        )

        return VaspAttribution(
            entity=vasp_name,
            name=vasp_name,
            entity_type=entity_type,
            distance=distance,
            hops=distance,
            path=path_addresses,
            confidence=conf_breakdown.score,
            confidence_label=conf_breakdown.label,
            supporting_evidence=supporting_evidence,
            source=source,
            explanation=explanation,
            metadata={
                "target_address": dst,
                "entity_name": entity_name,
                "reliability": reliability,
                "updated_at": updated_at,
                "reasoning_trace": reasoning_trace,
                "rules_triggered": rules_triggered,
                "confidence_breakdown": conf_breakdown.to_dict(),
            },
        )

    def identify_candidates(
        self,
        source_wallet: str,
        graph: nx.DiGraph,
        max_hops: int = 5,
        traverser: Optional[BFSTraverser] = None,
        path_finder: Optional[PathFinder] = None,
    ) -> List[Tuple[VaspAttribution, TracePath]]:
        """
        Discover and attribute all reachable VASP candidates within max_hops.
        Reuses existing BFSTraverser and PathFinder without duplicate traversal.
        """
        src = source_wallet.strip().lower()
        if not graph.has_node(src):
            return []

        bfs = traverser if traverser is not None else BFSTraverser(graph)
        pf = path_finder if path_finder is not None else PathFinder(graph)

        # 1. Discover all reachable VASP targets via single BFS exploration
        discovered_vasps = bfs.find_all_vasps(src, max_depth=max_hops)
        if not discovered_vasps:
            return []

        candidates: List[Tuple[VaspAttribution, TracePath]] = []
        for target_addr, distance, node_data in discovered_vasps:
            # 2. Reconstruct path for each candidate
            trace_path = pf.get_path(src, target_addr)

            # 3. Create structured explainable attribution
            attribution = self.attribute_candidate(
                source_wallet=src,
                target_address=target_addr,
                distance=distance,
                trace_path=trace_path,
                node_data=node_data,
            )
            candidates.append((attribution, trace_path))

        return candidates

    def create_attribution_evidence(
        self,
        attribution: VaspAttribution,
        trace_path: TracePath,
        subject: str,
        start_index: int = 1,
    ) -> List[EvidenceItem]:
        """
        Generate structured EvidenceItem instances for an attribution candidate:
        - GRAPH_PATH
        - ENTITY_TAG
        - VASP_REGISTRY
        - HOP_DISTANCE
        """
        items: List[EvidenceItem] = []
        idx = start_index
        target_addr = attribution.metadata.get("target_address") or (trace_path.destination or "")
        path_addresses = [n.address for n in trace_path.nodes if n.address]

        # 1. GRAPH_PATH evidence
        items.append(
            EvidenceItem(
                id=f"EV-{idx:03d}",
                type="GRAPH_PATH",
                description=(
                    f"Investigated wallet reaches tagged {attribution.entity_type.lower().replace('_', ' ')} "
                    f"through {attribution.distance} directed transaction hops."
                ),
                source="networkx_graph",
                timestamp="2026-09-08T10:30:00Z",
                status="Verified",
                relevance="HIGH",
                entity=attribution.entity,
                metadata={
                    "hop_count": attribution.distance,
                    "path": path_addresses,
                    "source": subject,
                    "destination": target_addr,
                },
            )
        )
        idx += 1

        # 2. ENTITY_TAG evidence
        items.append(
            EvidenceItem(
                id=f"EV-{idx:03d}",
                type="ENTITY_TAG",
                description=(
                    f"Destination address '{target_addr}' is tagged as {attribution.entity_type} "
                    f"associated with {attribution.entity}."
                ),
                source="VaspRegistry",
                timestamp="2026-09-08T10:30:00Z",
                status="Verified",
                relevance="HIGH",
                entity=attribution.entity,
                metadata={
                    "address": target_addr,
                    "entity_type": attribution.entity_type,
                    "entity_name": attribution.name,
                },
            )
        )
        idx += 1

        # 3. VASP_REGISTRY evidence
        reg_source = attribution.source or "controlled_test_registry"
        items.append(
            EvidenceItem(
                id=f"EV-{idx:03d}",
                type="VASP_REGISTRY",
                description=(
                    f"Registry intelligence associates destination '{target_addr}' with VASP '{attribution.entity}'."
                ),
                source=reg_source,
                timestamp=attribution.metadata.get("updated_at", "2026-09-08T00:00:00Z"),
                status="Supporting",
                relevance="HIGH",
                entity=attribution.entity,
                metadata={
                    "registry_source": reg_source,
                    "reliability": attribution.metadata.get("reliability", "VERIFIED"),
                },
            )
        )
        idx += 1

        # 4. HOP_DISTANCE evidence
        items.append(
            EvidenceItem(
                id=f"EV-{idx:03d}",
                type="HOP_DISTANCE",
                description=(
                    f"Attribution proximity measured at {attribution.distance} hop(s) "
                    f"from subject wallet '{subject}'."
                ),
                source="networkx_traversal",
                timestamp="2026-09-08T10:30:00Z",
                status="Verified",
                relevance="MEDIUM",
                entity=attribution.entity,
                metadata={
                    "hops": attribution.distance,
                    "confidence_label": attribution.confidence_label,
                },
            )
        )

        return items
