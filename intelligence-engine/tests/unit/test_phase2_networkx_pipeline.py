import inspect
import pytest
import networkx as nx

from app.models.transaction import CommonTransaction
from app.models.analysis import (
    AnalysisResult,
    AnalyzeWalletRequest,
    TracePath,
    PathNode,
    PathEdge,
)
from app.normalization.transaction_normalizer import TransactionNormalizer
from app.graph.builder import TransactionGraphBuilder
from app.graph.traversal import BFSTraverser
from app.graph.path_finder import PathFinder
from app.blockchain.mock import MockBlockchainAdapter
from app.services.analysis_service import AnalysisService
from app.api.routes.analysis import analyze_wallet


def test_01_transaction_normalization():
    """Verify raw transaction dictionary normalizes into CommonTransaction."""
    raw = {
        "hash": "0xtest123",
        "chain": "ethereum",
        "time": "2026-09-28T01:00:00Z",
        "from": "0xAlice",
        "to": "0xBob",
        "coin": "ETH",
        "value": 5.25,
        "type": "transfer",
        "block": 19000000,
        "metadata": {"fee": 0.001},
    }
    tx = TransactionNormalizer.normalize_mock(raw)
    assert isinstance(tx, CommonTransaction)
    assert tx.transaction_hash == "0xtest123"
    assert tx.blockchain == "ethereum"
    assert tx.from_address == "0xAlice"
    assert tx.to_address == "0xBob"
    assert tx.amount == 5.25
    assert tx.asset == "ETH"
    assert tx.block_number == 19000000


def test_02_graph_builder_creates_networkx_graph():
    """Verify TransactionGraphBuilder populates a NetworkX DiGraph."""
    tx = CommonTransaction(
        transaction_hash="0xTx01",
        timestamp="2026-09-28T01:00:00Z",
        from_address="0xNodeA",
        to_address="0xNodeB",
        amount=1.0,
    )
    builder = TransactionGraphBuilder()
    builder.add_transaction(tx)
    g = builder.get_graph()

    assert isinstance(g, nx.DiGraph)
    assert builder.has_node("0xnodea")
    assert builder.has_node("0xnodeb")
    assert builder.has_edge("0xnodea", "0xnodeb")


def test_03_graph_nodes_and_tags():
    """Verify graph nodes support entity tags and metadata."""
    builder = TransactionGraphBuilder()
    builder.tag_node(
        address="0xExchangeNode",
        entity_type="EXCHANGE",
        entity_name="CoinDCX",
        risk_score=15.0,
        metadata={"country": "IN"},
    )
    g = builder.get_graph()
    assert g.has_node("0xexchangenode")
    node_data = g.nodes["0xexchangenode"]
    assert node_data["entity_type"] == "EXCHANGE"
    assert node_data["entity_name"] == "CoinDCX"
    assert node_data["risk_score"] == 15.0


def test_04_graph_edges_and_metadata():
    """Verify graph edges retain transaction hash, amount, asset, and timestamp."""
    tx = CommonTransaction(
        transaction_hash="0xHashAlpha",
        timestamp="2026-09-28T01:30:00Z",
        from_address="0xUser1",
        to_address="0xUser2",
        amount=7.5,
        asset="USDT",
    )
    builder = TransactionGraphBuilder()
    builder.add_transaction(tx)
    g = builder.get_graph()

    edge_data = g["0xuser1"]["0xuser2"]
    assert edge_data["total_amount"] == 7.5
    assert edge_data["asset"] == "USDT"
    assert edge_data["primary_tx_hash"] == "0xHashAlpha"
    assert len(edge_data["transactions"]) == 1


def test_05_bfs_respects_max_hops():
    """Verify BFS traversal bounds exploration to max_depth."""
    g = nx.DiGraph()
    # Chain: A -> B -> C -> D -> E
    g.add_edge("a", "b")
    g.add_edge("b", "c")
    g.add_edge("c", "d")
    g.add_edge("d", "e")

    traverser = BFSTraverser(g)
    order, visited, dist_map = traverser.bfs_traverse("a", max_depth=2)

    assert "a" in visited
    assert "b" in visited
    assert "c" in visited
    assert "d" not in visited  # At distance 3, must be excluded
    assert "e" not in visited  # At distance 4, must be excluded
    assert dist_map["c"] == 2


def test_06_bfs_identifies_nearest_tagged_entity():
    """Verify BFS discovers nearest tagged VASP entity."""
    g = nx.DiGraph()
    g.add_node("a")
    g.add_node("b")
    g.add_node("c", entity_type="EXCHANGE", entity_name="Kraken")
    g.add_edge("a", "b")
    g.add_edge("b", "c")

    traverser = BFSTraverser(g)
    result = traverser.find_nearest_vasp("a", max_depth=3)
    assert result is not None
    target_addr, distance, node_data = result
    assert target_addr == "c"
    assert distance == 2
    assert node_data["entity_name"] == "Kraken"


def test_07_path_finder_returns_trace_path():
    """Verify PathFinder reconstructs canonical TracePath with PathNode and PathEdge."""
    g = nx.DiGraph()
    g.add_node("a", entity_name="Suspect")
    g.add_node("b", entity_name="Intermediary")
    g.add_node("c", entity_name="Binance", entity_type="VASP")
    g.add_edge("a", "b", transactions=[{"amount": 10.0, "asset": "ETH", "transaction_hash": "0xTx1", "timestamp": "2026-09-28T01:00:00Z"}])
    g.add_edge("b", "c", transactions=[{"amount": 9.5, "asset": "ETH", "transaction_hash": "0xTx2", "timestamp": "2026-09-28T01:10:00Z"}])

    pf = PathFinder(g)
    tp = pf.get_path("a", "c")

    assert isinstance(tp, TracePath)
    assert len(tp.nodes) == 3
    assert len(tp.edges) == 2
    assert tp.hop_count == 2
    assert tp.source == "a"
    assert tp.destination == "c"

    assert isinstance(tp.nodes[0], PathNode)
    assert tp.nodes[0].address == "a"
    assert tp.nodes[2].address == "c"

    assert isinstance(tp.edges[0], PathEdge)
    assert tp.edges[0].from_node == "a"
    assert tp.edges[0].to_node == "b"
    assert tp.edges[0].amount == 10.0


def test_08_analysis_service_uses_networkx():
    """Verify AnalysisService constructs a real NetworkX graph during analysis."""
    service = AnalysisService()
    req = AnalyzeWalletRequest(case_id="CASE-NX-01", wallet_address="A", blockchain="ethereum")
    res = service.analyze_wallet(req)

    assert isinstance(res, AnalysisResult)
    assert res.metadata["engine"] == "TRACEVAULT NetworkX Intelligence Engine v2.0"
    assert res.metadata["node_count"] > 0
    assert res.metadata["edge_count"] > 0


def test_09_mock_graph_provider_not_used():
    """Regression test: Proves AnalysisService does NOT import or instantiate MockGraphProvider."""
    import app.services.analysis_service as as_module

    # 1. Check module source does not import MockGraphProvider
    source = inspect.getsource(as_module)
    assert "MockGraphProvider" not in source, "AnalysisService must not reference MockGraphProvider!"

    # 2. Check service instance does not have mock graph attributes
    service = AnalysisService()
    assert not hasattr(service, "graph_provider"), "AnalysisService must not hold legacy graph_provider!"
    assert not hasattr(service, "mock_graph"), "AnalysisService must not hold mock_graph!"


def test_10_complete_mock_analysis_end_to_end():
    """Critical Integration Test: Wallet A -> B -> C -> Exchange Deposit."""
    service = AnalysisService()
    req = AnalyzeWalletRequest(case_id="CASE-SIH-001", wallet_address="A", blockchain="ethereum", max_hops=3)
    res = service.analyze_wallet(req)

    assert res.case_id == "CASE-SIH-001"
    assert res.wallet == "a"
    assert res.blockchain == "ethereum"
    assert res.status == "Analysis complete"

    # Nearest VASP should be Example Exchange at distance 3
    assert res.nearest_vasp is not None
    assert res.nearest_vasp.name == "Example Exchange"
    assert res.nearest_vasp.distance == 3
    assert res.nearest_vasp.confidence == 60.0  # Base 90 - (3 * 10) = 60.0

    # Path should trace A -> B -> C -> EXCHANGE_DEPOSIT
    assert res.path == ["a", "b", "c", "exchange_deposit"]
    assert len(res.trace_paths) == 1
    assert len(res.trace_paths[0].nodes) == 4
    assert len(res.trace_paths[0].edges) == 3

    # Risk should reflect mixer interaction and multiple hops
    assert res.risk.score >= 50.0
    assert any("Mixer" in ind for ind in res.risk.indicators)
    assert any(sig.signal_type == "MIXER_EXPOSURE" for sig in res.risk.signals)

    # Evidence items should be structured
    assert len(res.evidence) >= 4
    assert all(hasattr(e, "type") and hasattr(e, "source") for e in res.evidence)


def test_11_graph_safety_cycles():
    """Graph Safety: Cyclic topologies (A -> B -> C -> A) must terminate without infinite traversal."""
    cyclic_txs = [
        {"hash": "tx1", "from": "A", "to": "B", "value": 1.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "tx2", "from": "B", "to": "C", "value": 1.0, "time": "2026-09-28T01:01:00Z"},
        {"hash": "tx3", "from": "C", "to": "A", "value": 1.0, "time": "2026-09-28T01:02:00Z"},
        {"hash": "tx4", "from": "C", "to": "EXCHANGE_TARGET", "value": 1.0, "time": "2026-09-28T01:03:00Z"},
    ]
    cyclic_entities = {
        "EXCHANGE_TARGET": {"name": "Target Exchange", "type": "VASP"}
    }
    adapter = MockBlockchainAdapter(transactions=cyclic_txs, entities=cyclic_entities)
    service = AnalysisService(adapter=adapter)

    req = AnalyzeWalletRequest(case_id="CASE-CYCLE", wallet_address="A", blockchain="ethereum", max_hops=4)
    res = service.analyze_wallet(req)

    # Must complete safely
    assert res.status == "Analysis complete"
    assert res.nearest_vasp is not None
    assert res.nearest_vasp.name == "Target Exchange"
    assert res.nearest_vasp.distance == 3


def test_12_error_wallet_not_found():
    """Error Case: Unknown wallet with no transactions returns safe empty analysis."""
    service = AnalysisService()
    req = AnalyzeWalletRequest(case_id="CASE-EMPTY", wallet_address="0xUnknownWalletAddress", blockchain="ethereum")
    res = service.analyze_wallet(req)

    assert res.status == "Analysis complete"
    assert res.wallet == "0xunknownwalletaddress"
    assert res.nearest_vasp is None
    assert len(res.transactions) == 0
    assert len(res.trace_paths[0].nodes) == 1
    assert res.trace_paths[0].hop_count == 0


def test_13_error_empty_transactions():
    """Error Case: Empty transaction ledger handled safely."""
    empty_adapter = MockBlockchainAdapter(transactions=[], entities={})
    service = AnalysisService(adapter=empty_adapter)

    req = AnalyzeWalletRequest(case_id="CASE-NO-TX", wallet_address="0xNoTx", blockchain="ethereum")
    res = service.analyze_wallet(req)

    assert res.nearest_vasp is None
    assert res.risk.score == 10.0  # Baseline investigative risk
    assert len(res.transactions) == 0


def test_14_error_disconnected_graph():
    """Error Case: Target wallet disconnected from any VASP entity."""
    island_txs = [
        {"hash": "txIsolated", "from": "IslandA", "to": "IslandB", "value": 2.0, "time": "2026-09-28T01:00:00Z"}
    ]
    adapter = MockBlockchainAdapter(transactions=island_txs, entities={"OtherVASP": {"name": "Other", "type": "VASP"}})
    service = AnalysisService(adapter=adapter)

    req = AnalyzeWalletRequest(case_id="CASE-ISLAND", wallet_address="IslandA", blockchain="ethereum")
    res = service.analyze_wallet(req)

    assert res.nearest_vasp is None
    assert len(res.attribution) == 0


def test_15_error_no_tagged_vasp():
    """Error Case: Graph with transactions but zero tagged VASPs."""
    no_vasp_txs = [
        {"hash": "tx1", "from": "User1", "to": "User2", "value": 5.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "tx2", "from": "User2", "to": "User3", "value": 4.5, "time": "2026-09-28T01:05:00Z"},
    ]
    adapter = MockBlockchainAdapter(transactions=no_vasp_txs, entities={})
    service = AnalysisService(adapter=adapter)

    req = AnalyzeWalletRequest(case_id="CASE-NO-VASP", wallet_address="User1", blockchain="ethereum")
    res = service.analyze_wallet(req)

    assert res.nearest_vasp is None
    assert len(res.attribution) == 0
    assert res.trace_paths[0].nodes[0].address == "user1"


def test_16_fastapi_endpoint_integration():
    """FastAPI Integration: analyze_wallet route handler returns valid canonical result."""
    req = AnalyzeWalletRequest(
        case_id="CASE-API-001",
        blockchain="ethereum",
        wallet_address="A",
        max_hops=3,
    )
    res = analyze_wallet(req)
    assert isinstance(res, AnalysisResult)
    assert res.case_id == "CASE-API-001"
    assert res.wallet == "a"
    assert res.nearest_vasp is not None
    assert res.nearest_vasp.name == "Example Exchange"
    assert res.nearest_vasp.distance == 3
    assert res.risk.level == "MEDIUM"
    assert len(res.evidence) > 0

