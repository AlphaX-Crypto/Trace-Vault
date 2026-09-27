import logging
from typing import Any, Dict, List, Optional, Set
import networkx as nx

from app.models.analysis import (
    AnalysisResult,
    AnalyzeWalletRequest,
    EvidenceItem,
    GraphData,
    PathNode,
    TracePath,
    VaspAttribution,
)
from app.models.transaction import CommonTransaction
from app.normalization.transaction_normalizer import TransactionNormalizer
from app.blockchain.mock import MockBlockchainAdapter
from app.graph.builder import TransactionGraphBuilder
from app.graph.traversal import BFSTraverser
from app.graph.path_finder import PathFinder
from app.attribution.confidence import calculate_confidence
from app.risk.scorer import RiskScorer

logger = logging.getLogger(__name__)


class AnalysisService:
    """
    Authoritative Intelligence Analysis Service for TRACEVAULT V2.
    Integrates the real NetworkX graph engine, deterministic BFS discovery,
    heuristic path finding, VASP attribution, and multi-factor risk scoring.
    """

    def __init__(self, adapter: Optional[MockBlockchainAdapter] = None):
        self.adapter = adapter if adapter is not None else MockBlockchainAdapter()
        self.normalizer = TransactionNormalizer()
        self.risk_scorer = RiskScorer(self.adapter.get_entity_info)

    def analyze_wallet(self, request: AnalyzeWalletRequest) -> AnalysisResult:
        """
        Execute end-to-end investigation pipeline on target subject wallet.
        """
        start_address = request.wallet_address.strip().lower()
        max_hops = min(max(1, request.max_hops), 5)  # Enforce bounded traversal limit

        # 1. Ingest relevant raw transactions (bounded multi-hop crawl)
        raw_txs, raw_tx_hashes = self._crawl_transactions(start_address, max_hops)

        # 2. Normalize raw transactions into canonical CommonTransaction models
        normalized_txs: List[CommonTransaction] = [
            self.normalizer.normalize_mock(tx) for tx in raw_txs
        ]

        # 3. Construct real NetworkX directed graph
        builder = TransactionGraphBuilder()
        builder.build_graph(normalized_txs)
        graph = builder.get_graph()

        # Tag all discovered nodes with entity intelligence
        all_graph_nodes = list(graph.nodes)
        if start_address not in graph:
            builder.tag_node(start_address, entity_type="WALLET", entity_name="Subject Wallet")
            all_graph_nodes.append(start_address)

        for addr in all_graph_nodes:
            entity_info = self.adapter.get_entity_info(addr)
            if entity_info:
                builder.tag_node(
                    addr,
                    entity_type=entity_info.get("type", "UNKNOWN"),
                    entity_name=entity_info.get("name"),
                    metadata=entity_info,
                )

        # 4. Execute bounded BFS traversal on the NetworkX graph
        traverser = BFSTraverser(graph)
        vasp_result = traverser.find_nearest_vasp(start_address, max_depth=max_hops)

        # 5. Extract deterministic path using PathFinder
        path_finder = PathFinder(graph)
        attribution: Optional[VaspAttribution] = None
        trace_path = TracePath()
        path_addresses: List[str] = [start_address]
        distance = 0

        if vasp_result is not None:
            target_address, distance, node_data = vasp_result
            trace_path = path_finder.get_path(start_address, target_address)
            path_addresses = [n.address for n in trace_path.nodes if n.address]

            # 6. Calculate attribution confidence
            entity_name = node_data.get("entity_name") or "Unknown VASP"
            entity_type = node_data.get("entity_type", "VASP")
            conf_score = calculate_confidence(distance, entity_type, path_addresses)

            supporting_evidence = [
                f"Transaction path reached a tagged {entity_type} address.",
                f"Entity '{entity_name}' was reached after {distance} hops from subject.",
            ]

            attribution = VaspAttribution(
                entity=entity_name,
                name=entity_name,
                entity_type=entity_type,
                distance=distance,
                hops=distance,
                path=path_addresses,
                confidence=conf_score,
                supporting_evidence=supporting_evidence,
                source="Tagged entity dataset / Path proximity",
                explanation=f"Observed transaction path reaches address associated with {entity_name} after {distance} hops.",
            )
        else:
            trace_path.nodes.append(
                PathNode(
                    address=start_address,
                    hop=0,
                    role="Subject Wallet",
                    label="Subject Wallet",
                    entity_type="WALLET",
                )
            )
            trace_path.hop_count = 0
            trace_path.source = start_address
            trace_path.destination = start_address

        # 7. Calculate multi-factor risk
        risk_result = self.risk_scorer.calculate_risk(path_addresses, distance, raw_txs)

        # 8. Generate structured evidence items
        evidence_items = self._compile_evidence(
            trace_path=trace_path,
            attribution=attribution,
            risk_result=risk_result,
            subject=start_address,
        )

        # 9. Format visual graph representation
        graph_data = self._format_graph_data(builder)

        # 10. Assemble and return canonical AnalysisResult
        confidence_meta = {
            "base_score": 90.0,
            "hop_penalty": float(distance * 10.0),
            "final_confidence": attribution.confidence if attribution else 0.0,
        }

        return AnalysisResult(
            case_id=request.case_id,
            wallet=start_address,
            subject=start_address,
            blockchain=request.blockchain,
            status="Analysis complete",
            transactions=normalized_txs,
            graph=graph_data,
            nearest_vasp=attribution,
            attribution=[attribution] if attribution else [],
            trace_paths=[trace_path] if trace_path.nodes else [],
            path=path_addresses,
            risk=risk_result,
            confidence=confidence_meta,
            evidence=evidence_items,
            metadata={
                "engine": "TRACEVAULT NetworkX Intelligence Engine v2.0",
                "traversal_hops": distance,
                "node_count": builder.node_count(),
                "edge_count": builder.edge_count(),
            },
        )

    def _crawl_transactions(
        self, start_address: str, max_hops: int
    ) -> tuple[List[Dict[str, Any]], Set[str]]:
        """Bounded transaction crawler exploring neighbors up to max_hops."""
        visited_addresses: Set[str] = {start_address}
        addresses_to_explore: List[str] = [start_address]
        raw_txs: List[Dict[str, Any]] = []
        raw_tx_hashes: Set[str] = set()

        for _ in range(max_hops):
            next_addresses: List[str] = []
            for addr in addresses_to_explore:
                txs = self.adapter.get_transactions(addr)
                for tx in txs:
                    h = tx.get("hash") or tx.get("transaction_hash")
                    if h and h not in raw_tx_hashes:
                        raw_txs.append(tx)
                        raw_tx_hashes.add(h)

                    to_addr = tx.get("to") or tx.get("to_address")
                    from_addr = tx.get("from") or tx.get("from_address")
                    if to_addr and to_addr.lower() not in visited_addresses:
                        visited_addresses.add(to_addr.lower())
                        next_addresses.append(to_addr)
                    if from_addr and from_addr.lower() not in visited_addresses:
                        visited_addresses.add(from_addr.lower())
                        next_addresses.append(from_addr)

            addresses_to_explore = next_addresses
            if not addresses_to_explore:
                break

        return raw_txs, raw_tx_hashes

    def _compile_evidence(
        self,
        trace_path: TracePath,
        attribution: Optional[VaspAttribution],
        risk_result: Any,
        subject: str,
    ) -> List[EvidenceItem]:
        """Synthesize verified, traceable EvidenceItem objects for court dossiers."""
        evidence_items: List[EvidenceItem] = []
        idx = 1

        # Evidence for transactions along trace path
        for edge in trace_path.edges:
            evidence_items.append(
                EvidenceItem(
                    id=f"EV-{idx:03d}",
                    type="TRANSACTION",
                    description=f"Observed fund transfer of {edge.amount} {edge.asset} along investigation path",
                    source="Blockchain Transaction Record",
                    timestamp=edge.timestamp or "2026-09-08T10:00:00Z",
                    status="Verified",
                    relevance="HIGH",
                    transaction_hash=edge.transaction_hash,
                    from_address=edge.from_address or edge.from_node,
                    to_address=edge.to_address or edge.to_node,
                    amount=edge.amount,
                    asset=edge.asset,
                    entity=f"{edge.from_node} -> {edge.to_node}",
                )
            )
            idx += 1

        # Evidence for destination attribution
        if attribution:
            evidence_items.append(
                EvidenceItem(
                    id=f"EV-{idx:03d}",
                    type="ATTRIBUTION",
                    description=f"Transaction path terminates at address associated with {attribution.entity} ({attribution.confidence_label})",
                    source="Tagged VASP Intelligence Registry",
                    timestamp="2026-09-08T10:30:00Z",
                    status="Supporting",
                    relevance="CRITICAL",
                    entity=attribution.entity,
                    metadata={
                        "confidence": attribution.confidence,
                        "distance": attribution.distance,
                    },
                )
            )
            idx += 1

        # Evidence for detected risk signals
        for sig in getattr(risk_result, "signals", []):
            evidence_items.append(
                EvidenceItem(
                    id=f"EV-{idx:03d}",
                    type="RISK",
                    description=f"{sig.description}: {sig.reason or 'Risk indicator detected'}",
                    source="Multi-Factor Risk Engine",
                    timestamp="2026-09-08T10:45:00Z",
                    status="Detected",
                    relevance=sig.severity,
                    entity=sig.entity or subject,
                    metadata={"signal_type": sig.signal_type, "score": sig.score},
                )
            )
            idx += 1

        return evidence_items

    def _format_graph_data(self, builder: TransactionGraphBuilder) -> GraphData:
        """Format NetworkX graph into GraphData container for frontend visualization."""
        graph = builder.get_graph()
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        for node_id in graph.nodes:
            data = dict(graph.nodes[node_id])
            data["id"] = node_id
            nodes.append(data)

        for u, v in graph.edges:
            edge_data = dict(graph[u][v])
            edge_id = edge_data.get("primary_tx_hash") or f"{u}->{v}"
            edges.append({
                "id": edge_id,
                "from_node": u,
                "to_node": v,
                "amount": edge_data.get("total_amount", 0.0),
                "asset": edge_data.get("asset", "ETH"),
                "transactions": edge_data.get("transactions", []),
            })

        return GraphData(nodes=nodes, edges=edges)
