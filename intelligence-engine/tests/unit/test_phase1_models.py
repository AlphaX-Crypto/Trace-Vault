import pytest
from datetime import datetime, timezone
from app.models.transaction import CommonTransaction, Transaction
from app.models.entity import Entity, EntityType
from app.graph.graph_models import GraphNode, GraphEdge
from app.models.analysis import (
    PathNode,
    PathEdge,
    TracePath,
    VaspAttribution,
    RiskSignal,
    RiskResult,
    EvidenceItem,
    AnalyzeWalletRequest,
    AnalysisResult,
    GraphData,
)


def test_01_common_transaction_instantiation():
    """Verify CommonTransaction and backward-compat Transaction instantiation."""
    tx = CommonTransaction(
        transaction_hash="0x123abc456def",
        blockchain="ethereum",
        timestamp="2026-09-28T01:00:00Z",
        from_address="0xSender12345678901234567890123456789012",
        to_address="0xReceiver12345678901234567890123456789012",
        asset="ETH",
        amount=2.5,
        transaction_type="transfer",
        block_number=19283746,
        source="ethereum_adapter",
        metadata={"gas_used": 21000},
    )
    assert tx.transaction_hash == "0x123abc456def"
    assert tx.amount == 2.5
    assert tx.asset == "ETH"
    assert tx.from_address == "0xSender12345678901234567890123456789012"
    d = tx.to_dict()
    assert d["from_address"] == "0xsender12345678901234567890123456789012"
    assert d["amount"] == 2.5

    # Verify backward compat alias
    assert Transaction is CommonTransaction


def test_02_entity_instantiation():
    """Verify Entity model and EntityType enum."""
    assert EntityType.VASP.value == "VASP"
    assert EntityType.MIXER.value == "MIXER"

    ent = Entity(
        id="ent-binance-01",
        identifier="0x28C6c06298d514Db089934071355E5743bf21d60",
        entity_type=EntityType.VASP,
        name="Binance Hot Wallet 14",
        blockchain="ethereum",
        risk_score=15.0,
        tags=["exchange", "vasp", "custodial"],
        metadata={"jurisdiction": "Malta"},
    )
    assert ent.identifier.lower() == "0x28c6c06298d514db089934071355e5743bf21d60"
    assert ent.address == ent.identifier.lower()
    assert ent.entity_type == EntityType.VASP
    d = ent.to_dict()
    assert d["name"] == "Binance Hot Wallet 14"
    assert d["entity_type"] == "VASP"


def test_03_graph_node_instantiation():
    """Verify GraphNode instantiation with address/identifier interoperability."""
    # Test with address parameter (backward compatibility)
    node1 = GraphNode(address="0xABCDEF", blockchain="ethereum")
    assert node1.identifier == "0xabcdef"
    assert node1.address == "0xabcdef"
    assert node1.id == "0xabcdef"
    assert node1.to_dict()["address"] == "0xabcdef"

    # Test with identifier and entity attributes
    node2 = GraphNode(
        identifier="0x1111222233334444555566667777888899990000",
        entity_type=EntityType.EXCHANGE,
        entity_name="CoinDCX",
        risk_score=20.0,
        tags=["indian_exchange", "vasp"],
    )
    assert node2.entity_name == "CoinDCX"
    assert node2.to_dict()["entity_type"] == "EXCHANGE"


def test_04_graph_edge_instantiation():
    """Verify GraphEdge instantiation with from_node/to_node and transaction details."""
    edge = GraphEdge(
        from_node="0x111",
        to_node="0x222",
        transaction_hash="0xtx999",
        amount=1.85,
        asset="ETH",
        timestamp="2026-09-28T01:15:00Z",
    )
    assert edge.transaction_hash == "0xtx999"
    assert edge.amount == 1.85
    d = edge.to_dict()
    assert d["from_node"] == "0x111"
    assert d["to_node"] == "0x222"
    assert d["amount"] == 1.85


def test_05_path_node_instantiation():
    """Verify PathNode instantiation and field harmonization."""
    pn = PathNode(
        address="0xSuspectAddress",
        hop=0,
        entity_type="SUSPECT_WALLET",
        entity_name="Suspect Wallet Alpha",
    )
    assert pn.identifier == "0xsuspectaddress"
    assert pn.address == "0xsuspectaddress"
    assert pn.hop == 0
    assert pn.label == "Suspect Wallet Alpha"
    assert pn.role == "SUSPECT_WALLET"
    d = pn.to_dict()
    assert d["hop"] == 0
    assert d["label"] == "Suspect Wallet Alpha"


def test_06_path_edge_instantiation():
    """Verify PathEdge instantiation and address harmonization."""
    pe = PathEdge(
        from_address="0xSource",
        to_address="0xTarget",
        transaction_hash="0xEdgeTxHash",
        amount=4.2,
        asset="ETH",
        timestamp="2026-09-28T01:20:00Z",
    )
    assert pe.from_node == "0xsource"
    assert pe.to_node == "0xtarget"
    assert pe.amount == 4.2
    assert pe.to_dict()["transaction_hash"] == "0xEdgeTxHash"


def test_07_trace_path_instantiation():
    """Verify TracePath container with ordered nodes and edges."""
    pn0 = PathNode(address="0xNodeA", hop=0, role="Suspect Wallet")
    pn1 = PathNode(address="0xNodeB", hop=1, role="Intermediary")
    pe = PathEdge(from_node="0xNodeA", to_node="0xNodeB", transaction_hash="0xTx1", amount=3.0)

    tp = TracePath(nodes=[pn0, pn1], edges=[pe], hop_count=1, source="0xNodeA", destination="0xNodeB")
    assert len(tp.nodes) == 2
    assert len(tp.edges) == 1
    assert tp.hop_count == 1
    d = tp.to_dict()
    assert d["hop_count"] == 1
    assert len(d["nodes"]) == 2


def test_08_vasp_attribution_instantiation():
    """Verify VaspAttribution model and confidence categorization."""
    attr = VaspAttribution(
        name="Example Exchange",
        distance=3,
        confidence=82.5,
        entity_type="VASP",
        source="Mock tagged dataset",
        supporting_evidence=["Direct deposit into known hot wallet cluster"],
    )
    assert attr.entity == "Example Exchange"
    assert attr.name == "Example Exchange"
    assert attr.distance == 3
    assert attr.hops == 3
    assert attr.confidence == 82.5
    assert attr.confidence_label == "High confidence"
    d = attr.to_dict()
    assert d["confidence_label"] == "High confidence"


def test_09_risk_signal_instantiation():
    """Verify RiskSignal atomic indicator."""
    sig = RiskSignal(
        id="RS-01",
        signal_type="MIXER_EXPOSURE",
        score=30.0,
        severity="HIGH",
        entity="0xTornadoRouter",
        reason="Direct interaction with known mixing contract within 1 hop.",
    )
    assert sig.id == "RS-01"
    assert sig.score == 30.0
    assert sig.contribution == 30.0
    assert sig.severity == "HIGH"
    d = sig.to_dict()
    assert d["score"] == 30.0


def test_10_risk_result_instantiation():
    """Verify RiskResult aggregation and risk tier assignment."""
    sig1 = RiskSignal(id="RS-01", signal_type="MIXER_EXPOSURE", score=30.0, severity="HIGH")
    sig2 = RiskSignal(id="RS-02", signal_type="RAPID_REDISTRIBUTION", score=10.0, severity="MEDIUM")

    rr = RiskResult(
        score=75.0,
        signals=[sig1, sig2],
        indicators=["Mixer interaction (+30)", "Rapid redistribution (+10)"],
        explanation="High risk driven by mixer interaction and rapid fund peeling.",
    )
    assert rr.score == 75.0
    assert rr.level == "HIGH"
    assert len(rr.signals) == 2
    assert len(rr.indicators) == 2
    d = rr.to_dict()
    assert d["level"] == "HIGH"
    assert len(d["signals"]) == 2


def test_11_evidence_item_instantiation():
    """Verify structured EvidenceItem for court-ready dossiers."""
    ev = EvidenceItem(
        id="EV-001",
        type="TRANSACTION",
        description="Outbound transfer of 5.0 ETH to intermediary mixer",
        source="Ethereum Mainnet / Etherscan Adapter",
        timestamp="2026-09-28T01:30:00Z",
        status="Verified",
        relevance="CRITICAL",
        transaction_hash="0xabcd1234txhash",
        block_number=19283900,
        from_address="0xSuspectWallet",
        to_address="0xIntermediaryWallet",
        amount=5.0,
        asset="ETH",
        entity="Suspect -> Intermediary",
    )
    assert ev.id == "EV-001"
    assert ev.type == "TRANSACTION"
    assert ev.amount == 5.0
    d = ev.to_dict()
    assert d["status"] == "Verified"
    assert d["transaction_hash"] == "0xabcd1234txhash"


def test_12_analysis_result_instantiation():
    """Verify Canonical AnalysisResult contract."""
    req = AnalyzeWalletRequest(
        case_id="CASE-2026-001",
        wallet_address="0xSuspectWallet123",
        blockchain="ethereum",
        max_hops=3,
    )
    assert req.case_id == "CASE-2026-001"
    assert req.wallet_address == "0xSuspectWallet123"

    vasp = VaspAttribution(name="Binance", distance=2, confidence=80.0)
    risk = RiskResult(score=65.0, level="HIGH")
    ev = EvidenceItem(
        id="EV-001",
        type="TRANSACTION",
        description="Transfer to VASP deposit",
        source="blockchain",
        timestamp="2026-09-28T01:00:00Z",
    )

    ar = AnalysisResult(
        case_id="CASE-2026-001",
        wallet="0xSuspectWallet123",
        blockchain="ethereum",
        nearest_vasp=vasp,
        risk=risk,
        evidence=[ev],
        trace_paths=[],
    )
    assert ar.case_id == "CASE-2026-001"
    assert ar.wallet == "0xsuspectwallet123"
    assert ar.subject == "0xsuspectwallet123"
    assert ar.nearest_vasp.name == "Binance"
    assert ar.risk.level == "HIGH"
    d = ar.to_dict()
    assert d["wallet"] == "0xsuspectwallet123"
    assert d["nearest_vasp"]["name"] == "Binance"


def test_13_path_finder_import():
    """Verify PathFinder in graph engine imports cleanly without ImportError."""
    from app.graph.path_finder import PathFinder
    import networkx as nx

    g = nx.DiGraph()
    pf = PathFinder(g)
    assert pf.graph is not None
    assert pf.get_shortest_path_nodes("0x1", "0x2") == []
    assert pf.get_hop_count("0x1", "0x2") == -1


def test_14_end_to_end_graph_model_compatibility():
    """Verify TransactionGraphBuilder, BFSTraverser, and PathFinder work with canonical models."""
    from app.graph.builder import TransactionGraphBuilder
    from app.graph.traversal import BFSTraverser
    from app.graph.path_finder import PathFinder

    tx1 = CommonTransaction(
        transaction_hash="0xTx100",
        timestamp="2026-09-28T01:00:00Z",
        from_address="0xSuspect",
        to_address="0xIntermediary",
        amount=10.0,
    )
    tx2 = CommonTransaction(
        transaction_hash="0xTx200",
        timestamp="2026-09-28T01:05:00Z",
        from_address="0xIntermediary",
        to_address="0xBinanceDeposit",
        amount=9.8,
    )

    builder = TransactionGraphBuilder()
    builder.add_transaction(tx1)
    builder.add_transaction(tx2)

    graph = builder.get_graph()
    assert builder.node_count() == 3
    assert builder.edge_count() == 2

    # Set entity tag on BinanceDeposit node
    graph.nodes["0xbinancedeposit"]["entity_type"] = "EXCHANGE"
    graph.nodes["0xbinancedeposit"]["entity_name"] = "Binance"

    traverser = BFSTraverser(graph)
    target_tuple = traverser.find_nearest_tagged_entity("0xsuspect", max_hops=5)
    assert target_tuple is not None
    target_addr, distance, node_data = target_tuple
    assert target_addr == "0xbinancedeposit"
    assert distance == 2
    assert node_data["entity_name"] == "Binance"

    path_finder = PathFinder(graph)
    trace_path = path_finder.get_path("0xsuspect", "0xbinancedeposit")
    assert len(trace_path.nodes) == 3
    assert len(trace_path.edges) == 2
    assert trace_path.nodes[0].address == "0xsuspect"
    assert trace_path.nodes[2].address == "0xbinancedeposit"
    assert trace_path.edges[0].amount == 10.0
    assert trace_path.edges[1].amount == 9.8
