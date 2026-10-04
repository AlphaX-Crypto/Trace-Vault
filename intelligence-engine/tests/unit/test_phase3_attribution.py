"""
Unit Test Suite for TRACEVAULT V2 — Phase 3: Explainable VASP Attribution & Intelligence Layer.

Tests:
 1. VASP registry lookup and case-insensitivity
 2. Known deposit wallet classification and separation from ownership
 3. VASP attribution generation with explainable metadata and rules
 4. Hop distance preservation along trace paths
 5. Heuristic confidence engine calculation and penalty mechanics
 6. Transparent confidence explanation and rationale
 7. Structured attribution evidence items (GRAPH_PATH, ENTITY_TAG, VASP_REGISTRY, HOP_DISTANCE)
 8. No VASP scenario (graceful null attribution, valid result)
 9. Multiple candidate handling (preserves multiple reachable VASPs)
10. Cyclic graph safety and deterministic attribution
11. Max hops boundary enforcement (3 vs 5 hops)
12. Disconnected component isolation
13. AnalysisResult canonical model validation and serialization
14. Risk engine orthogonality and validity
15. No fake / hallucinated attribution
"""

import pytest
import networkx as nx

from app.attribution.registry import VaspRegistry, VaspRegistryEntry
from app.attribution.confidence import calculate_confidence, evaluate_confidence, ConfidenceBreakdown
from app.attribution.vasp_identifier import VaspIdentifier, AttributionRules
from app.blockchain.mock import MockBlockchainAdapter
from app.graph.builder import TransactionGraphBuilder
from app.graph.traversal import BFSTraverser
from app.graph.path_finder import PathFinder
from app.models.analysis import AnalysisResult, AnalyzeWalletRequest, EvidenceItem, TracePath, VaspAttribution
from app.services.analysis_service import AnalysisService


# ---------------------------------------------------------------------------
# Test 1: VASP Registry Lookup
# ---------------------------------------------------------------------------
def test_01_vasp_registry_lookup():
    """Verify registry queries, case-insensitivity, and custom registration."""
    registry = VaspRegistry()

    # Case-insensitive queries for default test seed
    entry_upper = registry.lookup("EXCHANGE_DEPOSIT")
    entry_lower = registry.lookup("exchange_deposit")
    entry_hex = registry.lookup("0xEXCHANGE_DEPOSIT")

    assert entry_upper is not None
    assert entry_lower is not None
    assert entry_hex is not None
    assert entry_upper.vasp_name == "Example Exchange"
    assert entry_upper.entity_type == "DEPOSIT_WALLET"
    assert entry_upper.source == "controlled_test_registry"
    assert entry_upper.updated_at == "2026-09-08T00:00:00Z"
    assert entry_upper.reliability == "VERIFIED"

    # Unknown address
    assert registry.lookup("0xUnknownAddress") is None
    assert not registry.is_known("0xUnknownAddress")

    # Helper getters
    assert registry.is_known("exchange_deposit")
    assert registry.get_vasp_name("exchange_deposit") == "Example Exchange"
    assert registry.get_entity_type("exchange_deposit") == "DEPOSIT_WALLET"

    # Dynamic registration
    custom = registry.register_entity(
        address="0xKrakenHotWallet",
        entity_name="Kraken Central Hot Wallet",
        entity_type="EXCHANGE",
        vasp_name="Kraken",
        source="controlled_test_registry",
        tags=["hot_wallet", "exchange"],
    )
    assert registry.is_known("0xkrakenhotwallet")
    assert registry.get_vasp_name("0xKrakenHotWallet") == "Kraken"
    assert "hot_wallet" in custom.tags


# ---------------------------------------------------------------------------
# Test 2: Known Deposit Wallet Classification
# ---------------------------------------------------------------------------
def test_02_known_deposit_wallet():
    """Verify deposit wallet is classified as DEPOSIT_WALLET without claiming real-world ownership."""
    registry = VaspRegistry()
    entry = registry.lookup("EXCHANGE_DEPOSIT")

    assert entry is not None
    assert entry.entity_type == "DEPOSIT_WALLET"
    assert entry.vasp_name == "Example Exchange"
    # Registry documents potential association, not criminal/legal claim
    assert "criminal" not in str(entry.metadata).lower()
    assert "guilty" not in str(entry.metadata).lower()


# ---------------------------------------------------------------------------
# Test 3: VASP Attribution Generation
# ---------------------------------------------------------------------------
def test_03_vasp_attribution_generation():
    """Verify VaspIdentifier produces complete VaspAttribution with explainable metadata."""
    registry = VaspRegistry()
    identifier = VaspIdentifier(registry=registry)

    # Mock graph & path
    g = nx.DiGraph()
    g.add_node("a")
    g.add_node("b")
    g.add_node("c")
    g.add_node("exchange_deposit", entity_type="DEPOSIT_WALLET", entity_name="Example Exchange")
    g.add_edge("a", "b")
    g.add_edge("b", "c")
    g.add_edge("c", "exchange_deposit")

    pf = PathFinder(g)
    trace_path = pf.get_path("a", "exchange_deposit")

    attr = identifier.attribute_candidate(
        source_wallet="a",
        target_address="exchange_deposit",
        distance=3,
        trace_path=trace_path,
        node_data={"entity_name": "Example Exchange", "entity_type": "DEPOSIT_WALLET"},
    )

    assert attr.entity == "Example Exchange"
    assert attr.name == "Example Exchange"
    assert attr.entity_type == "DEPOSIT_WALLET"
    assert attr.distance == 3
    assert attr.hops == 3
    assert attr.confidence == 60.0
    assert attr.confidence_label == "MODERATE"
    assert attr.source == "controlled_test_registry"
    assert len(attr.supporting_evidence) >= 3
    assert "Example Exchange" in attr.explanation

    # Check reasoning trace in metadata
    trace = attr.metadata.get("reasoning_trace", [])
    assert len(trace) >= 8
    assert any("subject" in step.lower() for step in trace)
    assert any("reconstructed" in step.lower() for step in trace)
    assert any("deposit_wallet" in step.lower() for step in trace)

    # Check rules triggered
    rules = attr.metadata.get("rules_triggered", [])
    assert AttributionRules.RULE_2_KNOWN_DEPOSIT_WALLET in rules
    assert AttributionRules.RULE_4_GRAPH_PROXIMITY in rules
    assert AttributionRules.RULE_6_SOURCE_RELIABILITY in rules


# ---------------------------------------------------------------------------
# Test 4: Hop Distance Preservation
# ---------------------------------------------------------------------------
def test_04_hop_distance_preservation():
    """Verify hop distances are correctly computed and preserved across paths."""
    identifier = VaspIdentifier()
    g = nx.DiGraph()
    for n in ["w0", "w1", "w2", "w3", "w4", "target"]:
        g.add_node(n)
    g.add_edge("w0", "w1")
    g.add_edge("w1", "w2")
    g.add_edge("w2", "w3")
    g.add_edge("w3", "w4")
    g.add_edge("w4", "target")

    pf = PathFinder(g)

    # 1 hop test
    p1 = pf.get_path("w4", "target")
    a1 = identifier.attribute_candidate("w4", "target", distance=1, trace_path=p1)
    assert a1.distance == 1
    assert a1.hops == 1
    assert p1.hop_count == 1

    # 5 hops test
    p5 = pf.get_path("w0", "target")
    a5 = identifier.attribute_candidate("w0", "target", distance=5, trace_path=p5)
    assert a5.distance == 5
    assert a5.hops == 5
    assert p5.hop_count == 5


# ---------------------------------------------------------------------------
# Test 5: Heuristic Confidence Calculation
# ---------------------------------------------------------------------------
def test_05_confidence_calculation():
    """Verify confidence formula: Base 90 - (hops * 10) - entity_penalty."""
    # Distance 0 (direct subject)
    assert calculate_confidence(0, "VASP") == 90.0

    # Distance 1
    b1 = evaluate_confidence(1, "EXCHANGE")
    assert b1.score == 80.0
    assert b1.label == "HIGH"
    assert b1.hop_penalty == 10.0

    # Distance 2
    b2 = evaluate_confidence(2, "VASP")
    assert b2.score == 70.0
    assert b2.label == "HIGH"

    # Distance 3 (Standard deposit scenario)
    b3 = evaluate_confidence(3, "DEPOSIT_WALLET")
    assert b3.score == 60.0
    assert b3.label == "MODERATE"

    # Distance 4
    b4 = evaluate_confidence(4, "VASP")
    assert b4.score == 50.0
    assert b4.label == "MODERATE"

    # Distance 5
    b5 = evaluate_confidence(5, "VASP")
    assert b5.score == 40.0
    assert b5.label == "MODERATE"

    # Distance 6 (Low confidence)
    b6 = evaluate_confidence(6, "VASP")
    assert b6.score == 30.0
    assert b6.label == "LOW"

    # Mixer penalty
    bm = evaluate_confidence(1, "MIXER")
    assert bm.score == 60.0  # 90 - 10 - 20 = 60.0
    assert bm.entity_penalty == 20.0

    # Clamping
    assert calculate_confidence(15, "VASP") == 0.0


# ---------------------------------------------------------------------------
# Test 6: Confidence Explanation & Granular Rationale
# ---------------------------------------------------------------------------
def test_06_confidence_explanation():
    """Verify confidence explanation communicates reasons for score attenuation."""
    breakdown = evaluate_confidence(3, "DEPOSIT_WALLET")

    assert "60.0%" in breakdown.explanation
    assert "MODERATE" in breakdown.explanation
    assert len(breakdown.reasons) >= 2
    assert any("3 graph hops" in r for r in breakdown.reasons)
    assert any("deposit wallet" in r for r in breakdown.reasons)


# ---------------------------------------------------------------------------
# Test 7: Structured Attribution Evidence
# ---------------------------------------------------------------------------
def test_07_attribution_evidence_structure():
    """Verify generated EvidenceItem list contains required forensic types."""
    identifier = VaspIdentifier()
    g = nx.DiGraph()
    g.add_node("a")
    g.add_node("b")
    g.add_edge("a", "b", total_amount=10.0, asset="ETH")

    pf = PathFinder(g)
    trace_path = pf.get_path("a", "b")

    attr = identifier.attribute_candidate(
        source_wallet="a",
        target_address="b",
        distance=1,
        trace_path=trace_path,
        node_data={"entity_name": "Binance", "entity_type": "EXCHANGE"},
    )

    evidence_items = identifier.create_attribution_evidence(
        attribution=attr,
        trace_path=trace_path,
        subject="a",
        start_index=1,
    )

    types = [e.type for e in evidence_items]
    assert "GRAPH_PATH" in types
    assert "ENTITY_TAG" in types
    assert "VASP_REGISTRY" in types
    assert "HOP_DISTANCE" in types

    for item in evidence_items:
        assert isinstance(item, EvidenceItem)
        assert item.id.startswith("EV-")
        assert len(item.description) > 0
        assert item.source in ("networkx_graph", "VaspRegistry", "controlled_test_registry", "networkx_traversal")
        assert item.status in ("Verified", "Supporting")


# ---------------------------------------------------------------------------
# Test 8: No VASP Case
# ---------------------------------------------------------------------------
def test_08_no_vasp_case():
    """Scenario 2: Graph with transactions but no tagged VASP must return null attribution."""
    no_vasp_txs = [
        {"hash": "tx1", "from": "UserA", "to": "UserB", "value": 5.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "tx2", "from": "UserB", "to": "UserC", "value": 4.5, "time": "2026-09-28T01:05:00Z"},
    ]
    # No entities registered
    adapter = MockBlockchainAdapter(transactions=no_vasp_txs, entities={})
    # Use empty registry
    empty_reg = VaspRegistry(entries=[])
    service = AnalysisService(adapter=adapter, registry=empty_reg)

    req = AnalyzeWalletRequest(case_id="CASE-NO-VASP", wallet_address="UserA", max_hops=3)
    res = service.analyze_wallet(req)

    assert res.status == "Analysis complete"
    assert res.nearest_vasp is None
    assert len(res.attribution) == 0
    assert res.confidence.get("final_confidence") == 0.0
    assert res.confidence.get("confidence_label") == "None"
    assert len(res.transactions) == 2


# ---------------------------------------------------------------------------
# Test 9: Multiple Candidates Handling
# ---------------------------------------------------------------------------
def test_09_multiple_candidates_handling():
    """Scenario 3: Multiple reachable VASPs must all be preserved in attribution list."""
    multi_txs = [
        {"hash": "txAtoB", "from": "Subject", "to": "BranchB", "value": 10.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "txBtoEx1", "from": "BranchB", "to": "ExchangeX", "value": 9.5, "time": "2026-09-28T01:10:00Z"},
        {"hash": "txAtoC", "from": "Subject", "to": "BranchC", "value": 8.0, "time": "2026-09-28T01:05:00Z"},
        {"hash": "txCtoEx2", "from": "BranchC", "to": "ExchangeY", "value": 7.5, "time": "2026-09-28T01:15:00Z"},
    ]

    registry = VaspRegistry()
    registry.register_entity("ExchangeX", "Exchange Alpha Deposit", "DEPOSIT_WALLET", "Exchange Alpha")
    registry.register_entity("ExchangeY", "Exchange Beta Hot Wallet", "EXCHANGE", "Exchange Beta")

    adapter = MockBlockchainAdapter(transactions=multi_txs, registry=registry)
    service = AnalysisService(adapter=adapter, registry=registry)

    req = AnalyzeWalletRequest(case_id="CASE-MULTI-VASP", wallet_address="Subject", max_hops=3)
    res = service.analyze_wallet(req)

    assert res.status == "Analysis complete"
    # Multiple candidates preserved
    assert len(res.attribution) == 2
    attributed_names = {a.name for a in res.attribution}
    assert "Exchange Alpha" in attributed_names
    assert "Exchange Beta" in attributed_names

    # nearest_vasp set to primary candidate without discarding the other
    assert res.nearest_vasp is not None
    assert res.nearest_vasp.name in ["Exchange Alpha", "Exchange Beta"]

    # Both trace paths present
    assert len(res.trace_paths) == 2


# ---------------------------------------------------------------------------
# Test 10: Cycle Handling Deterministic
# ---------------------------------------------------------------------------
def test_10_cycle_handling_deterministic():
    """Scenario 4: Cyclic graphs (A -> B -> C -> A, C -> VASP) terminate safely and attribute correctly."""
    cyclic_txs = [
        {"hash": "tx1", "from": "A", "to": "B", "value": 10.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "tx2", "from": "B", "to": "C", "value": 9.0, "time": "2026-09-28T01:01:00Z"},
        {"hash": "tx3", "from": "C", "to": "A", "value": 1.0, "time": "2026-09-28T01:02:00Z"},  # Cycle back to A
        {"hash": "tx4", "from": "C", "to": "EXCHANGE_DEPOSIT", "value": 8.0, "time": "2026-09-28T01:03:00Z"},
    ]
    adapter = MockBlockchainAdapter(transactions=cyclic_txs)
    service = AnalysisService(adapter=adapter)

    req = AnalyzeWalletRequest(case_id="CASE-CYCLE", wallet_address="A", max_hops=4)
    res = service.analyze_wallet(req)

    assert res.nearest_vasp is not None
    assert res.nearest_vasp.name == "Example Exchange"
    assert res.nearest_vasp.distance == 3
    # Check no duplicate nodes in shortest path
    assert len(res.path) == len(set(res.path))


# ---------------------------------------------------------------------------
# Test 11: Max Hop Behavior
# ---------------------------------------------------------------------------
def test_11_max_hop_behavior():
    """Scenario 5: VASP at hop 4 is unreachable if max_hops=3, reachable if max_hops=5."""
    chain_txs = [
        {"hash": "tx1", "from": "H0", "to": "H1", "value": 10.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "tx2", "from": "H1", "to": "H2", "value": 9.0, "time": "2026-09-28T01:01:00Z"},
        {"hash": "tx3", "from": "H2", "to": "H3", "value": 8.0, "time": "2026-09-28T01:02:00Z"},
        {"hash": "tx4", "from": "H3", "to": "EXCHANGE_DEPOSIT", "value": 7.0, "time": "2026-09-28T01:03:00Z"},
    ]
    adapter = MockBlockchainAdapter(transactions=chain_txs)
    service = AnalysisService(adapter=adapter)

    # 1. max_hops=3: Distance is 4 hops, so EXCHANGE_DEPOSIT must NOT be attributed
    req_shallow = AnalyzeWalletRequest(case_id="CASE-SHALLOW", wallet_address="H0", max_hops=3)
    res_shallow = service.analyze_wallet(req_shallow)
    assert res_shallow.nearest_vasp is None
    assert len(res_shallow.attribution) == 0

    # 2. max_hops=5: Distance is 4 hops, so EXCHANGE_DEPOSIT IS discovered
    req_deep = AnalyzeWalletRequest(case_id="CASE-DEEP", wallet_address="H0", max_hops=5)
    res_deep = service.analyze_wallet(req_deep)
    assert res_deep.nearest_vasp is not None
    assert res_deep.nearest_vasp.name == "Example Exchange"
    assert res_deep.nearest_vasp.distance == 4
    assert res_deep.nearest_vasp.confidence == 50.0  # Base 90 - (4 * 10) = 50.0


# ---------------------------------------------------------------------------
# Test 12: Disconnected Graph Component
# ---------------------------------------------------------------------------
def test_12_disconnected_graph():
    """Scenario 6: VASP in a disconnected subgraph is not attributed to investigated subject."""
    disjoint_txs = [
        {"hash": "tx1", "from": "SubjectA", "to": "IntermediaryB", "value": 2.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "tx2", "from": "OtherX", "to": "EXCHANGE_DEPOSIT", "value": 5.0, "time": "2026-09-28T01:05:00Z"},
    ]
    adapter = MockBlockchainAdapter(transactions=disjoint_txs)
    service = AnalysisService(adapter=adapter)

    req = AnalyzeWalletRequest(case_id="CASE-DISJOINT", wallet_address="SubjectA", max_hops=3)
    res = service.analyze_wallet(req)

    assert res.nearest_vasp is None
    assert len(res.attribution) == 0


# ---------------------------------------------------------------------------
# Test 13: AnalysisResult Validation and Serialization
# ---------------------------------------------------------------------------
def test_13_analysis_result_validation():
    """Verify canonical AnalysisResult model validation, serialization, and structure."""
    service = AnalysisService()
    req = AnalyzeWalletRequest(case_id="CASE-CANONICAL-P3", wallet_address="A", blockchain="ethereum", max_hops=3)
    res = service.analyze_wallet(req)

    # Core fields
    assert res.case_id == "CASE-CANONICAL-P3"
    assert res.subject == "a"
    assert res.wallet == "a"
    assert res.status == "Analysis complete"

    # Nearest VASP & confidence
    assert res.nearest_vasp is not None
    assert res.nearest_vasp.confidence == 60.0
    assert res.nearest_vasp.confidence_label == "MODERATE"
    assert len(res.nearest_vasp.metadata["reasoning_trace"]) == 8

    # Serialization test
    d = res.to_dict()
    assert isinstance(d, dict)
    assert d["case_id"] == "CASE-CANONICAL-P3"
    assert d["subject"] == "a"
    assert d["nearest_vasp"]["name"] == "Example Exchange"
    assert d["nearest_vasp"]["confidence_label"] == "MODERATE"
    assert len(d["evidence"]) >= 7

    # Evidence items in result
    evidence_types = {e.type for e in res.evidence if hasattr(e, "type")}
    assert "TRANSACTION" in evidence_types
    assert "GRAPH_PATH" in evidence_types
    assert "ENTITY_TAG" in evidence_types
    assert "VASP_REGISTRY" in evidence_types
    assert "HOP_DISTANCE" in evidence_types
    assert "RISK" in evidence_types


# ---------------------------------------------------------------------------
# Test 14: Risk Scoring Remains Valid and Separate
# ---------------------------------------------------------------------------
def test_14_risk_remains_valid():
    """Verify multi-factor risk engine remains independent and computes valid signals."""
    service = AnalysisService()
    req = AnalyzeWalletRequest(case_id="CASE-RISK-CHECK", wallet_address="A", max_hops=3)
    res = service.analyze_wallet(req)

    # Risk result exists and contains signals
    assert res.risk is not None
    assert res.risk.score >= 50.0
    assert res.risk.level in ("MEDIUM", "HIGH")
    assert len(res.risk.signals) >= 3

    # Risk signals are modular RiskSignal instances
    signal_types = {sig.signal_type for sig in res.risk.signals}
    assert "MIXER_EXPOSURE" in signal_types
    assert "INTERMEDIARY_HOPS" in signal_types
    assert "INVESTIGATIVE_BASELINE" in signal_types


# ---------------------------------------------------------------------------
# Test 15: No Fake Attribution
# ---------------------------------------------------------------------------
def test_15_no_fake_attribution():
    """Verify that empty, unknown, or purely untagged graphs never fabricate VASP attributions."""
    adapter = MockBlockchainAdapter(transactions=[], entities={})
    service = AnalysisService(adapter=adapter)

    # 1. Non-existent wallet with no transactions
    req_empty = AnalyzeWalletRequest(case_id="CASE-EMPTY", wallet_address="0xNonExistent", max_hops=3)
    res_empty = service.analyze_wallet(req_empty)

    assert res_empty.nearest_vasp is None
    assert res_empty.attribution == []
    assert res_empty.confidence.get("final_confidence") == 0.0

    # 2. Graph between untagged normal user wallets
    user_txs = [
        {"hash": "txU1", "from": "User1", "to": "User2", "value": 1.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "txU2", "from": "User2", "to": "User3", "value": 0.9, "time": "2026-09-28T01:01:00Z"},
    ]
    adapter_users = MockBlockchainAdapter(transactions=user_txs, entities={})
    service_users = AnalysisService(adapter=adapter_users)

    req_users = AnalyzeWalletRequest(case_id="CASE-USERS", wallet_address="User1", max_hops=3)
    res_users = service_users.analyze_wallet(req_users)

    assert res_users.nearest_vasp is None
    assert res_users.attribution == []
    assert res_users.confidence.get("final_confidence") == 0.0
