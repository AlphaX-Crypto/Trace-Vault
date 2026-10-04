import pytest
from decimal import Decimal
from fastapi import HTTPException

from app.api.routes.investigations import (
    UnifiedGraphRequest,
    analyze_unified_graph,
    list_unified_scenarios,
)
from app.graph.unified.models import (
    FinancialRail,
    UnifiedNodeType,
    UnifiedEdgeType,
    UnifiedNode,
    UnifiedEdge,
    CrossRailAssociation,
    UnifiedGraphAnalysisResult,
    make_deterministic_node_id,
)
from app.graph.unified.adapters import (
    CryptoGraphAdapter,
    UPIGraphAdapter,
    GeospatialGraphAdapter,
    CrossRailAdapter,
)
from app.graph.unified.builder import UnifiedGraphBuilder
from app.graph.unified.traversal import UnifiedGraphTraversal
from app.graph.unified.serializer import UnifiedGraphSerializer, deep_sanitize
from app.graph.unified.scenarios import UNIFIED_SCENARIOS
from app.graph.unified.engine import UnifiedInvestigationEngine
from app.models.transaction import CommonTransaction
from app.upi.models import UPITransaction
from app.geospatial.models import LocationSignal



def test_unified_models_node_creation():
    node = UnifiedNode(
        node_id="wallet:0x123abc",
        node_type=UnifiedNodeType.WALLET.value,
        rail=FinancialRail.CRYPTO.value,
        label="0x123abc",
        risk_score=25.0,
        tags=["crypto", "ethereum"],
    )
    assert node.node_id == "wallet:0x123abc"
    assert node.rail == "CRYPTO"
    assert node.risk_score == 25.0
    d = node.to_dict()
    assert d["node_id"] == "wallet:0x123abc"


def test_deterministic_node_id_formatting():
    assert make_deterministic_node_id("wallet", "0xABC") == "wallet:0xabc"
    assert make_deterministic_node_id("upi_vpa", "User@OKAxis") == "upi:user@okaxis"
    assert make_deterministic_node_id("merchant", "MERCH01") == "merchant:merch01"
    assert make_deterministic_node_id("vasp", "Binance") == "vasp:binance"
    assert make_deterministic_node_id("location", "BLR") == "location:blr"


def test_unified_models_edge_creation():
    edge = UnifiedEdge(
        edge_id="edge:wallet:0xa->wallet:0xb:0x1",
        source="wallet:0xa",
        target="wallet:0xb",
        edge_type=UnifiedEdgeType.TRANSACTED_WITH.value,
        rail=FinancialRail.CRYPTO.value,
        amount=5.0,
        currency="ETH",
    )
    assert edge.source == "wallet:0xa"
    assert edge.target == "wallet:0xb"
    assert edge.amount == 5.0


def test_unified_models_credential_rejection_node():
    with pytest.raises(ValueError, match="Security Violation"):
        UnifiedNode(
            node_id="upi:alice@mock",
            node_type=UnifiedNodeType.UPI_VPA.value,
            rail=FinancialRail.UPI.value,
            label="alice",
            metadata={"upi_pin": "1234"},
        )


def test_unified_models_credential_rejection_edge():
    with pytest.raises(ValueError, match="Security Violation"):
        UnifiedEdge(
            edge_id="edge:a->b:1",
            source="a",
            target="b",
            metadata={"password": "secret"},
        )


def test_cross_rail_association_conversion():
    assoc = CrossRailAssociation(
        source_node_id="wallet:0xabc",
        target_node_id="upi:agent@mockupi",
        source_rail=FinancialRail.CRYPTO.value,
        target_rail=FinancialRail.UPI.value,
        confidence=88.0,
        description="Correlated OTC settlement",
        evidence_references=["EV-OTC-1"],
    )
    edge = assoc.to_edge()
    assert edge.source == "wallet:0xabc"
    assert edge.target == "upi:agent@mockupi"
    assert edge.edge_type == UnifiedEdgeType.CROSS_RAIL_ASSOCIATION.value
    assert edge.rail == FinancialRail.CROSS_RAIL.value
    assert edge.metadata["relationship_nature"] == "graph_derived_association_not_identity_proof"
    assert "EV-OTC-1" in edge.evidence_references


def test_crypto_adapter_transaction():
    tx = CommonTransaction(
        transaction_hash="0xtx1",
        blockchain="ethereum",
        timestamp="2026-09-28T10:00:00Z",
        from_address="0xAAAA000000000000000000000000000000000001",
        to_address="0xBBBB000000000000000000000000000000000002",
        asset="ETH",
        amount=1.5,
    )
    from_node, to_node, edge = CryptoGraphAdapter.convert_transaction(tx, evidence_id="EV-1")
    assert from_node.node_id == "wallet:0xaaaa000000000000000000000000000000000001"
    assert to_node.node_id == "wallet:0xbbbb000000000000000000000000000000000002"
    assert edge.amount == 1.5
    assert edge.currency == "ETH"
    assert "EV-1" in edge.evidence_references


def test_crypto_adapter_attribution():
    vasp_node, edge = CryptoGraphAdapter.convert_attribution(
        wallet_address="0x9999999999999999999999999999999999999999",
        vasp_name="Example Exchange",
        deposit_address="0x9999999999999999999999999999999999999999",
        risk_score=60.0,
        evidence_id="EV-VASP",
    )
    assert vasp_node.node_id == "vasp:example exchange"
    assert vasp_node.risk_score == 60.0
    assert edge.edge_type == UnifiedEdgeType.ATTRIBUTED_TO.value


def test_upi_adapter_transaction_p2p():
    tx = UPITransaction(
        transaction_id="TXN-UPI-1",
        timestamp="2026-09-28T10:00:00Z",
        amount=Decimal("1500.00"),
        currency="INR",
        sender_vpa="sender@mockupi",
        receiver_vpa="receiver@mockupi",
        sender_bank="HDFC",
        receiver_bank="ICICI",
    )
    s_node, r_node, edge, m_node, m_edge = UPIGraphAdapter.convert_transaction(tx, evidence_id="EV-UPI-1")
    assert s_node.node_id == "upi:sender@mockupi"
    assert r_node.node_id == "upi:receiver@mockupi"
    assert edge.amount == 1500.0
    assert edge.currency == "INR"
    assert m_node is None
    assert m_edge is None


def test_upi_adapter_transaction_p2m():
    tx = UPITransaction(
        transaction_id="TXN-UPI-2",
        timestamp="2026-09-28T10:05:00Z",
        amount=Decimal("50000.00"),
        currency="INR",
        sender_vpa="shopper@mockupi",
        receiver_vpa="merchant_pos@mockupi",
        merchant_id="MERCH_XYZ",
        merchant_category="5411",
        transaction_type="P2M",
    )
    s_node, r_node, edge, m_node, m_edge = UPIGraphAdapter.convert_transaction(tx, evidence_id="EV-UPI-2")
    assert m_node is not None
    assert m_node.node_id == "merchant:merch_xyz"
    assert m_edge is not None
    assert m_edge.edge_type == UnifiedEdgeType.ASSOCIATED_WITH.value


def test_geospatial_adapter_signal():
    sig = LocationSignal(
        transaction_id="TXN-UPI-1",
        entity_reference="upi:shopper@mockupi",
        latitude=12.9716,
        longitude=77.5946,
        city="Bengaluru",
        country_code="IN",
    )
    loc_node, edge = GeospatialGraphAdapter.convert_signal(sig, evidence_id="EV-GEO-1")
    assert loc_node.node_type == UnifiedNodeType.LOCATION.value
    assert "Bengaluru" in loc_node.label
    assert edge is not None
    assert edge.source == "upi:shopper@mockupi"
    assert edge.edge_type == UnifiedEdgeType.LOCATED_NEAR.value


def test_graph_builder_node_deduplication():
    builder = UnifiedGraphBuilder()
    node1 = UnifiedNode(
        node_id="wallet:0x111",
        node_type=UnifiedNodeType.WALLET.value,
        rail=FinancialRail.CRYPTO.value,
        label="Wallet 111",
        risk_score=30.0,
        tags=["tagA"],
        source_references=["sourceA"],
    )
    node2 = UnifiedNode(
        node_id="wallet:0x111",
        node_type=UnifiedNodeType.WALLET.value,
        rail=FinancialRail.CRYPTO.value,
        label="Wallet 111",
        risk_score=75.0,
        tags=["tagB"],
        source_references=["sourceB"],
    )
    builder.add_node(node1)
    builder.add_node(node2)

    saved = builder.get_node("wallet:0x111")
    assert saved is not None
    assert saved.risk_score == 75.0  # Max risk score preserved
    assert set(saved.tags) == {"tagA", "tagB"}  # Tags unioned
    assert set(saved.source_references) == {"sourceA", "sourceB"}


def test_graph_builder_stats():
    builder = UnifiedGraphBuilder()
    builder.add_crypto_transaction({
        "transaction_hash": "0x123",
        "timestamp": "2026-09-28T10:00:00Z",
        "from_address": "0x111",
        "to_address": "0x222",
        "amount": 1.0,
    })
    builder.add_upi_transaction({
        "transaction_id": "UPI-1",
        "timestamp": "2026-09-28T10:05:00Z",
        "amount": 1000.0,
        "sender_vpa": "a@upi",
        "receiver_vpa": "b@upi",
    })
    stats = builder.get_stats()
    assert stats["total_nodes"] == 4
    assert stats["total_edges"] == 2
    assert stats["node_counts_by_rail"]["CRYPTO"] == 2
    assert stats["node_counts_by_rail"]["UPI"] == 2
    assert stats["has_cross_rail_bridges"] is False


def test_graph_traversal_subgraph_by_rail():
    builder = UnifiedGraphBuilder()
    builder.add_crypto_transaction({
        "transaction_hash": "0x123",
        "timestamp": "2026-09-28T10:00:00Z",
        "from_address": "0x111",
        "to_address": "0x222",
        "amount": 1.0,
    })
    builder.add_upi_transaction({
        "transaction_id": "UPI-1",
        "timestamp": "2026-09-28T10:05:00Z",
        "amount": 1000.0,
        "sender_vpa": "a@upi",
        "receiver_vpa": "b@upi",
    })
    traversal = UnifiedGraphTraversal(builder)
    crypto_sub = traversal.get_subgraph_by_rail("CRYPTO")
    assert crypto_sub.number_of_nodes() == 2
    assert crypto_sub.number_of_edges() == 1

    upi_sub = traversal.get_subgraph_by_rail("UPI")
    assert upi_sub.number_of_nodes() == 2
    assert upi_sub.number_of_edges() == 1


def test_graph_traversal_path_finding_and_hops():
    builder = UnifiedGraphBuilder()
    builder.add_crypto_transaction({
        "transaction_hash": "0x1",
        "timestamp": "2026-09-28T10:00:00Z",
        "from_address": "0xa",
        "to_address": "0xb",
        "amount": 1.0,
    })
    builder.add_crypto_transaction({
        "transaction_hash": "0x2",
        "timestamp": "2026-09-28T10:01:00Z",
        "from_address": "0xb",
        "to_address": "0xc",
        "amount": 0.9,
    })
    traversal = UnifiedGraphTraversal(builder)
    paths = traversal.find_all_paths_with_edges("wallet:0xa", "wallet:0xc")
    assert len(paths) == 1
    p = paths[0]
    assert p["hop_count"] == 2
    assert p["nodes"] == ["wallet:0xa", "wallet:0xb", "wallet:0xc"]
    assert p["is_cross_rail"] is False


def test_graph_traversal_cross_rail_paths():
    builder = UnifiedGraphBuilder()
    builder.add_crypto_transaction({
        "transaction_hash": "0x1",
        "timestamp": "2026-09-28T10:00:00Z",
        "from_address": "0xa",
        "to_address": "0xofframp",
        "amount": 1.0,
    })
    builder.add_cross_rail_association(
        CrossRailAssociation(
            source_node_id="wallet:0xofframp",
            target_node_id="upi:desk@upi",
            source_rail="CRYPTO",
            target_rail="UPI",
        )
    )
    builder.add_upi_transaction({
        "transaction_id": "UPI-1",
        "timestamp": "2026-09-28T10:05:00Z",
        "amount": 250000.0,
        "sender_vpa": "desk@upi",
        "receiver_vpa": "cashout@upi",
    })

    traversal = UnifiedGraphTraversal(builder)
    cross_paths = traversal.find_cross_rail_paths("wallet:0xa", max_depth=4)
    assert len(cross_paths) >= 1
    assert any(p["is_cross_rail"] is True for p in cross_paths)


def test_serializer_deep_sanitize():
    dirty_data = {
        "user": "alice",
        "amount": Decimal("100.50"),
        "nested": {
            "password": "secret_password",
            "upi_pin": "9999",
            "safe_key": "safe_value",
        },
    }
    cleaned = deep_sanitize(dirty_data)
    assert "password" not in cleaned["nested"]
    assert "upi_pin" not in cleaned["nested"]
    assert cleaned["nested"]["safe_key"] == "safe_value"
    assert cleaned["amount"] == 100.5


def test_serializer_cytoscape_export():
    builder = UnifiedGraphBuilder()
    builder.add_crypto_transaction({
        "transaction_hash": "0x1",
        "timestamp": "2026-09-28T10:00:00Z",
        "from_address": "0xa",
        "to_address": "0xb",
        "amount": 1.0,
    })
    cyto = UnifiedGraphSerializer.to_cytoscape_format(builder)
    assert len(cyto["nodes"]) == 2
    assert len(cyto["edges"]) == 1
    assert cyto["nodes"][0]["data"]["id"] in ("wallet:0xa", "wallet:0xb")


# =========================================================================
# Synthetic Scenario Regressions
# =========================================================================

def test_scenario_unified_demo_001_crypto_regression():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-001")
    assert result.case_id == "UNIFIED-DEMO-001"
    # Exact regression properties:
    # 4 wallet nodes + 1 VASP node
    node_ids = {n.node_id for n in result.nodes}
    assert "wallet:0x71c83408a6cf2372e9a5957b6d193d56f6c91350" in node_ids
    assert "wallet:0x9999999999999999999999999999999999999999" in node_ids
    assert "vasp:example exchange" in node_ids
    vasp_node = next(n for n in result.nodes if n.node_id == "vasp:example exchange")
    assert vasp_node.risk_score == 60.0
    assert len(result.cross_rail_associations) == 0


def test_scenario_unified_demo_002_upi_mule():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-002")
    assert result.case_id == "UNIFIED-DEMO-002"
    node_types = {n.node_type for n in result.nodes}
    assert UnifiedNodeType.UPI_VPA.value in node_types
    assert UnifiedNodeType.MERCHANT.value in node_types
    merchant_node = next(n for n in result.nodes if n.node_type == UnifiedNodeType.MERCHANT.value)
    assert merchant_node.entity_name == "merch_crypto_001"


def test_scenario_unified_demo_003_independent():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-003")
    stats = result.graph_metadata
    assert stats["node_counts_by_rail"]["CRYPTO"] == 2
    assert stats["node_counts_by_rail"]["UPI"] == 2
    assert stats["has_cross_rail_bridges"] is False
    assert len(result.cross_rail_associations) == 0


def test_scenario_unified_demo_004_cross_rail_bridge():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-004")
    assert len(result.cross_rail_associations) == 1
    assoc = result.cross_rail_associations[0]
    assert assoc.source_rail == "CRYPTO"
    assert assoc.target_rail == "UPI"
    assert any(r["signal_type"] == "CROSS_RAIL_BRIDGE_DETECTED" for r in result.risk_references)


def test_scenario_unified_demo_005_geospatial_anomaly():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-005")
    assert len(result.cross_rail_associations) == 1
    # Check that location signals exist
    loc_nodes = [n for n in result.nodes if n.node_type == UnifiedNodeType.LOCATION.value]
    assert len(loc_nodes) >= 2


def test_scenario_unified_demo_006_shared_vasp():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-006")
    vasp_nodes = [n for n in result.nodes if n.node_type == UnifiedNodeType.VASP.value]
    assert len(vasp_nodes) == 1
    assert vasp_nodes[0].label == "Nexus Global VASP"


def test_scenario_unified_demo_007_disconnected_verification():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-007")
    assert len(result.cross_rail_associations) == 0
    # Paths between crypto and upi should not exist
    traversal = UnifiedGraphTraversal(UnifiedGraphBuilder())
    assert result.graph_metadata["has_cross_rail_bridges"] is False


def test_scenario_unified_demo_control():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-CONTROL")
    assert result.case_id == "UNIFIED-DEMO-CONTROL"
    assert len(result.cross_rail_associations) == 0


def test_engine_14_step_reasoning_trace():
    engine = UnifiedInvestigationEngine()
    result = engine.analyze_scenario("UNIFIED-DEMO-004")
    assert len(result.reasoning_trace) == 14
    assert result.reasoning_trace[0].startswith("Step 1:")
    assert result.reasoning_trace[13].startswith("Step 14:")


def test_no_personhood_assertion_principle():
    assoc = CrossRailAssociation(
        source_node_id="wallet:0x1",
        target_node_id="upi:bob@mockupi",
        source_rail="CRYPTO",
        target_rail="UPI",
    )
    edge = assoc.to_edge()
    # Ensure relationship does NOT claim identity or legal ownership
    assert "not_identity_proof" in edge.metadata.get("relationship_nature", "")


# =========================================================================
# API Route Tests
# =========================================================================

def test_api_unified_graph_scenarios_list():
    data = list_unified_scenarios()
    assert "scenarios" in data
    sc_ids = {s["scenario_id"] for s in data["scenarios"]}
    assert "UNIFIED-DEMO-001" in sc_ids
    assert "UNIFIED-DEMO-004" in sc_ids
    assert "UNIFIED-DEMO-CONTROL" in sc_ids


def test_api_unified_graph_analyze_preset():
    req = UnifiedGraphRequest(scenario_id="UNIFIED-DEMO-004")
    data = analyze_unified_graph(req)
    assert data["case_id"] == "UNIFIED-DEMO-004"
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0
    assert len(data["reasoning_trace"]) == 14


def test_api_unified_graph_analyze_custom():
    req = UnifiedGraphRequest(
        case_id="CUSTOM-CASE-99",
        crypto_transactions=[
            {
                "transaction_hash": "0x99",
                "timestamp": "2026-09-28T12:00:00Z",
                "from_address": "0x111",
                "to_address": "0x222",
                "amount": 2.0,
            }
        ],
        upi_transactions=[
            {
                "transaction_id": "UPI-99",
                "timestamp": "2026-09-28T12:05:00Z",
                "amount": 500.0,
                "sender_vpa": "p@upi",
                "receiver_vpa": "q@upi",
            }
        ],
    )
    data = analyze_unified_graph(req)
    assert data["case_id"] == "CUSTOM-CASE-99"
    assert data["graph_metadata"]["total_nodes"] == 4
    assert data["graph_metadata"]["total_edges"] == 2


def test_api_unified_graph_credential_rejection():
    # Attempting to analyze with credentials in UPI transaction should raise HTTPException (400)
    with pytest.raises(HTTPException) as exc_info:
        req = UnifiedGraphRequest(
            case_id="BAD-CASE",
            upi_transactions=[
                {
                    "transaction_id": "UPI-BAD",
                    "timestamp": "2026-09-28T12:05:00Z",
                    "amount": 500.0,
                    "sender_vpa": "p@upi",
                    "receiver_vpa": "q@upi",
                    "metadata": {"upi_pin": "1234"},
                }
            ],
        )
        analyze_unified_graph(req)
    assert exc_info.value.status_code == 400
    assert "Security Violation" in str(exc_info.value.detail)
