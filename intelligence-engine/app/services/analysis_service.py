import logging
import re
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
from app.blockchain.base import BaseBlockchainAdapter
from app.blockchain.mock import MockBlockchainAdapter
from app.blockchain.ethereum import EthereumAdapter
from app.graph.builder import TransactionGraphBuilder
from app.graph.traversal import BFSTraverser
from app.graph.path_finder import PathFinder
from app.attribution.confidence import calculate_confidence, evaluate_confidence
from app.attribution.registry import VaspRegistry
from app.attribution.vasp_identifier import VaspIdentifier
from app.behavioral.engine import BehavioralIntelligenceEngine
from app.behavioral.models import BehavioralFinding, BehavioralAnalysisResult
from app.risk.scorer import RiskScorer

logger = logging.getLogger(__name__)

ETH_ADDRESS_PATTERN = re.compile(r"^0x[a-fA-F0-9]{40}$")


class AnalysisService:
    """
    Authoritative Intelligence Analysis Service for TRACEVAULT V2.
    Integrates the real NetworkX graph engine, deterministic BFS discovery,
    heuristic path finding, explainable VASP attribution, behavioral intelligence,
    and multi-factor risk scoring.
    Supports both offline/mock ledgers and live Ethereum indexers.
    """

    def __init__(
        self,
        adapter: Optional[BaseBlockchainAdapter] = None,
        registry: Optional[VaspRegistry] = None,
        ethereum_adapter: Optional[EthereumAdapter] = None,
    ):
        self.registry = registry if registry is not None else (
            adapter.registry if adapter is not None and hasattr(adapter, "registry") else VaspRegistry()
        )
        self.adapter = adapter if adapter is not None else MockBlockchainAdapter(registry=self.registry)
        self.ethereum_adapter = ethereum_adapter or (
            self.adapter if isinstance(self.adapter, EthereumAdapter) else EthereumAdapter(registry=self.registry)
        )
        self.normalizer = TransactionNormalizer()
        self.vasp_identifier = VaspIdentifier(registry=self.registry)
        self.behavioral_engine = BehavioralIntelligenceEngine()
        self.risk_scorer = RiskScorer(self._get_entity_info)

    def _get_entity_info(self, address: str) -> Optional[Dict[str, Any]]:
        """Look up entity intelligence across registered adapters and registry."""
        info = self.adapter.get_entity_info(address)
        if not info and self.ethereum_adapter:
            info = self.ethereum_adapter.get_entity_info(address)
        return info

    def _fetch_transactions(self, address: str) -> List[Dict[str, Any]]:
        """
        Fetch transactions for a given address.
        If the primary adapter is live, query it directly.
        Otherwise, query the primary adapter first (e.g. test mock ledger).
        If primary returns empty and the address is a valid Ethereum 42-char hex,
        query the live Ethereum adapter.
        """
        if getattr(self.adapter, "is_live", False):
            return self.adapter.get_transactions(address)

        # 1. Check primary adapter (mock ledger or custom injected adapter)
        txs = self.adapter.get_transactions(address)
        if txs:
            return txs

        # 2. Check live Ethereum adapter if address is standard Ethereum hex
        if ETH_ADDRESS_PATTERN.match(address) and self.ethereum_adapter and self.ethereum_adapter != self.adapter:
            try:
                live_txs = self.ethereum_adapter.get_transactions(address)
                if live_txs:
                    return live_txs
            except Exception as exc:
                logger.debug(f"Live Ethereum adapter lookup failed for {address}: {exc}")

        return []

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
            self.normalizer.normalize(tx) for tx in raw_txs
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
            entity_info = self._get_entity_info(addr)
            if entity_info:
                builder.tag_node(
                    addr,
                    entity_type=entity_info.get("type", "UNKNOWN"),
                    entity_name=entity_info.get("name"),
                    metadata=entity_info,
                )

        # 4. Traversal and VASP identification using single BFS exploration
        traverser = BFSTraverser(graph)
        path_finder = PathFinder(graph)

        candidates = self.vasp_identifier.identify_candidates(
            source_wallet=start_address,
            graph=graph,
            max_hops=max_hops,
            traverser=traverser,
            path_finder=path_finder,
        )

        nearest_vasp: Optional[VaspAttribution] = None
        attributions: List[VaspAttribution] = []
        trace_paths: List[TracePath] = []
        path_addresses: List[str] = [start_address]
        distance = 0

        if candidates:
            attributions = [cand[0] for cand in candidates]
            trace_paths = [cand[1] for cand in candidates]
            nearest_vasp = attributions[0]
            distance = nearest_vasp.distance
            primary_path_addresses = [n.address for n in trace_paths[0].nodes if n.address]
            if primary_path_addresses:
                path_addresses = primary_path_addresses
        else:
            fallback_path = TracePath(
                nodes=[
                    PathNode(
                        address=start_address,
                        hop=0,
                        role="Subject Wallet",
                        label="Subject Wallet",
                        entity_type="WALLET",
                    )
                ],
                hop_count=0,
                source=start_address,
                destination=start_address,
            )
            trace_paths = [fallback_path]

        # 5. Execute Behavioral Graph Intelligence
        behavioral_result = self.behavioral_engine.analyze(
            graph=graph,
            transactions=normalized_txs,
            subject=start_address,
            get_entity_info=self._get_entity_info,
        )

        # 6. Calculate multi-factor risk
        risk_result = self.risk_scorer.calculate_risk(
            path=path_addresses,
            distance=distance,
            transactions=raw_txs,
            behavioral_findings=behavioral_result.findings,
        )

        # 7. Generate structured evidence items
        evidence_items = self._compile_evidence(
            trace_paths=trace_paths,
            attributions=attributions,
            risk_result=risk_result,
            subject=start_address,
            behavioral_findings=behavioral_result.findings,
        )

        # 8. Format visual graph representation
        graph_data = self._format_graph_data(builder)

        # 9. Assemble confidence metadata
        confidence_meta: Dict[str, Any] = {
            "base_score": 90.0,
            "hop_penalty": float(distance * 10.0),
            "final_confidence": nearest_vasp.confidence if nearest_vasp else 0.0,
            "confidence_label": nearest_vasp.confidence_label if nearest_vasp else "None",
            "explanation": nearest_vasp.explanation if nearest_vasp else "No tagged VASP entity identified within traversal depth.",
        }
        if nearest_vasp and "confidence_breakdown" in nearest_vasp.metadata:
            confidence_meta["breakdown"] = nearest_vasp.metadata["confidence_breakdown"]

        return AnalysisResult(
            case_id=request.case_id,
            wallet=start_address,
            subject=start_address,
            blockchain=request.blockchain,
            status="Analysis complete",
            transactions=normalized_txs,
            graph=graph_data,
            nearest_vasp=nearest_vasp,
            attribution=attributions,
            trace_paths=trace_paths,
            path=path_addresses,
            risk=risk_result,
            behavioral=behavioral_result.to_dict(),
            confidence=confidence_meta,
            evidence=evidence_items,
            metadata={
                "engine": "TRACEVAULT NetworkX Intelligence Engine v2.0",
                "traversal_hops": distance,
                "candidate_count": len(attributions),
                "node_count": builder.node_count(),
                "edge_count": builder.edge_count(),
                "behavioral_patterns": behavioral_result.patterns_detected,
                "behavioral_findings_count": len(behavioral_result.findings),
                "behavioral_summary": behavioral_result.summary,
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
                txs = self._fetch_transactions(addr)
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
        trace_paths: List[TracePath],
        attributions: List[VaspAttribution],
        risk_result: Any,
        subject: str,
        behavioral_findings: Optional[List[BehavioralFinding]] = None,
    ) -> List[EvidenceItem]:
        """Synthesize verified, traceable EvidenceItem objects for court dossiers."""
        evidence_items: List[EvidenceItem] = []
        idx = 1
        seen_tx_hashes: Set[str] = set()

        # 1. Evidence for transactions along trace paths
        for tp in trace_paths:
            for edge in tp.edges:
                tx_hash = edge.transaction_hash or f"{edge.from_node}->{edge.to_node}"
                if tx_hash not in seen_tx_hashes:
                    seen_tx_hashes.add(tx_hash)
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

        # 2. Structured attribution evidence items
        for attr, tp in zip(attributions, trace_paths):
            # Backward-compatibility primary ATTRIBUTION item
            evidence_items.append(
                EvidenceItem(
                    id=f"EV-{idx:03d}",
                    type="ATTRIBUTION",
                    description=f"Transaction path terminates at address associated with {attr.entity} ({attr.confidence_label})",
                    source="Tagged VASP Intelligence Registry",
                    timestamp="2026-09-08T10:30:00Z",
                    status="Supporting",
                    relevance="CRITICAL",
                    entity=attr.entity,
                    metadata={
                        "confidence": attr.confidence,
                        "distance": attr.distance,
                    },
                )
            )
            idx += 1

            # Granular attribution evidence items (GRAPH_PATH, ENTITY_TAG, VASP_REGISTRY, HOP_DISTANCE)
            granular_items = self.vasp_identifier.create_attribution_evidence(
                attribution=attr,
                trace_path=tp,
                subject=subject,
                start_index=idx,
            )
            evidence_items.extend(granular_items)
            idx += len(granular_items)

        # 3. Evidence for detected risk signals
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

        # 4. Evidentiary records for behavioral graph patterns
        if behavioral_findings:
            for bf in behavioral_findings:
                evidence_items.append(
                    EvidenceItem(
                        id=f"EV-{idx:03d}",
                        type="BEHAVIORAL",
                        description=f"Behavioral pattern: {bf.title}. {bf.description}",
                        source="Graph Behavioral Intelligence Engine",
                        timestamp="2026-09-28T10:50:00Z",
                        status="Detected",
                        relevance=bf.severity,
                        entity=bf.subject or subject,
                        metadata={
                            "pattern_type": bf.pattern_type,
                            "confidence": bf.confidence,
                            "risk_contribution": bf.risk_contribution,
                            "metrics": bf.metrics,
                            "involved_addresses": bf.involved_addresses,
                        },
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
