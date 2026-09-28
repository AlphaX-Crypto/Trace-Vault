"""
Unit Test Suite for TRACEVAULT V2 — Phase 11: Behavioral Intelligence Layer.

Tests all 9 behavioral typologies:
 1. Fan-in (Multi-source aggregation into a single wallet)
 2. Fan-out (Single-source dispersion to multiple wallets)
 3. Peel-chain (Asymmetric fund peeling with change addresses)
 4. Rapid dispersion (Immediate pass-through / fast transit)
 5. Consolidation (Aggregation and bulk sweep)
 6. Circular flow (Directed cycle / wash trade loops)
 7. Mixer interaction (Tumbling pool / privacy protocol exposure)
 8. VASP entry/exit (Exchange on-ramp and off-ramp crossings)
 9. Temporal behavior (High-frequency burst activity)
10. Explainable Risk Integration (Behavioral RiskSignal generation)
11. Evidentiary Dossier Integration (BEHAVIORAL EvidenceItem generation)
12. Canonical AnalysisResult serialization and metadata preservation
"""

import networkx as nx
import pytest

from app.attribution.registry import VaspRegistry
from app.behavioral.engine import BehavioralIntelligenceEngine
from app.behavioral.models import (
    BehavioralAnalysisResult,
    BehavioralFinding,
    BehavioralPatternType,
)
from app.blockchain.mock import MockBlockchainAdapter
from app.models.analysis import AnalyzeWalletRequest, AnalysisResult
from app.models.transaction import CommonTransaction
from app.normalization.transaction_normalizer import TransactionNormalizer
from app.risk.scorer import RiskScorer
from app.services.analysis_service import AnalysisService


# ---------------------------------------------------------------------------
# Test 1: Fan-in Pattern Detection
# ---------------------------------------------------------------------------
def test_01_fan_in_aggregation():
    """Verify detection of multiple source addresses funneling funds into a single node."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()

    # 4 distinct wallets sending funds to Collector
    for i in range(1, 5):
        graph.add_edge(f"Sender_{i}", "Collector", total_amount=2.5)

    findings = engine._detect_fan_in(graph, subject="Collector")
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.FAN_IN
    assert f.subject == "Collector"
    assert f.metrics["in_degree"] == 4
    assert f.metrics["total_amount"] == 10.0
    assert "Collector" in f.involved_addresses


# ---------------------------------------------------------------------------
# Test 2: Fan-out Pattern Detection
# ---------------------------------------------------------------------------
def test_02_fan_out_dispersion():
    """Verify detection of a single source address dispersing funds across multiple recipients."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()

    # Distribute from Distributer to 4 destinations
    for i in range(1, 5):
        graph.add_edge("Distributor", f"Mule_{i}", total_amount=1.0)

    findings = engine._detect_fan_out(graph, subject="Distributor")
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.FAN_OUT
    assert f.subject == "Distributor"
    assert f.metrics["out_degree"] == 4
    assert f.metrics["total_amount"] == 4.0


# ---------------------------------------------------------------------------
# Test 3: Peel-chain Detection
# ---------------------------------------------------------------------------
def test_03_peel_chain_asymmetric_split():
    """Verify detection of asymmetric peel splitting (e.g. 90% continuation, 10% peeled off)."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()

    # Peeler splits 10 ETH into 9.0 (continuation) and 1.0 (peel)
    graph.add_edge("Peeler", "Change_Wallet", total_amount=9.0)
    graph.add_edge("Peeler", "Merchant_Deposit", total_amount=1.0)

    findings = engine._detect_peel_chain(graph, transactions=[], subject="Peeler")
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.PEEL_CHAIN
    assert f.subject == "Peeler"
    assert f.metrics["dominant_ratio"] == 0.9
    assert f.metrics["total_split_amount"] == 10.0
    assert f.severity == "HIGH"


# ---------------------------------------------------------------------------
# Test 4: Rapid Dispersion (Fast Transit)
# ---------------------------------------------------------------------------
def test_04_rapid_dispersion():
    """Verify detection of fast fund pass-through within short temporal intervals."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()
    graph.add_edge("Source", "Transit", total_amount=5.0)
    graph.add_edge("Transit", "Destination", total_amount=4.9)

    # Inflow at 12:00:00, Outflow at 12:05:00 (300 seconds delta)
    txs = [
        CommonTransaction(
            transaction_hash="tx_in",
            blockchain="ethereum",
            timestamp="2026-09-28T12:00:00Z",
            from_address="Source",
            to_address="Transit",
            amount=5.0,
            asset="ETH",
        ),
        CommonTransaction(
            transaction_hash="tx_out",
            blockchain="ethereum",
            timestamp="2026-09-28T12:05:00Z",
            from_address="Transit",
            to_address="Destination",
            amount=4.9,
            asset="ETH",
        ),
    ]

    findings = engine._detect_rapid_dispersion(graph, txs, subject="Transit")
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.RAPID_DISPERSION
    assert f.subject == "transit"
    assert f.metrics["delta_seconds"] == 300


# ---------------------------------------------------------------------------
# Test 5: Consolidation Pattern Detection
# ---------------------------------------------------------------------------
def test_05_consolidation_sweep():
    """Verify detection of multiple inputs consolidated and swept into a master destination."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()

    # Inbound from 2 sources (5.0 each = 10.0), Outbound 9.5 to Master (95% sweep)
    graph.add_edge("Mule_A", "Aggregator", total_amount=5.0)
    graph.add_edge("Mule_B", "Aggregator", total_amount=5.0)
    graph.add_edge("Aggregator", "Master_Wallet", total_amount=9.5)

    findings = engine._detect_consolidation(graph, transactions=[], subject="Aggregator")
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.CONSOLIDATION
    assert f.subject == "Aggregator"
    assert f.metrics["source_count"] == 2
    assert f.metrics["sweep_ratio"] == 0.95


# ---------------------------------------------------------------------------
# Test 6: Circular Flow (Loop Detection)
# ---------------------------------------------------------------------------
def test_06_circular_flow_loop():
    """Verify NetworkX directed cycle detection for round-trip wash flows."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()

    # Loop: Node1 -> Node2 -> Node3 -> Node1
    graph.add_edge("Node1", "Node2", total_amount=10.0)
    graph.add_edge("Node2", "Node3", total_amount=9.8)
    graph.add_edge("Node3", "Node1", total_amount=9.5)

    findings = engine._detect_circular_flow(graph, subject="Node1")
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.CIRCULAR_FLOW
    assert f.severity == "CRITICAL"
    assert f.metrics["cycle_length"] == 3


# ---------------------------------------------------------------------------
# Test 7: Mixer Interaction Detection
# ---------------------------------------------------------------------------
def test_07_mixer_interaction():
    """Verify identification of direct and near-hop privacy mixer exposures."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()
    graph.add_edge("Suspect", "MIXER_1", total_amount=1.0)

    def get_entity_info(addr):
        if addr == "MIXER_1":
            return {"name": "Tornado Cash Mock", "type": "MIXER"}
        return None

    findings = engine._detect_mixer_interaction(graph, subject="Suspect", get_entity_info=get_entity_info)
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.MIXER_INTERACTION
    assert f.severity == "CRITICAL"
    assert f.metrics["direct_exposure"] is True


# ---------------------------------------------------------------------------
# Test 8: VASP Entry / Exit Detection
# ---------------------------------------------------------------------------
def test_08_vasp_entry_exit():
    """Verify identification of custodial off-ramp deposit and on-ramp disbursement."""
    engine = BehavioralIntelligenceEngine()
    graph = nx.DiGraph()
    graph.add_edge("Suspect", "EXCHANGE_DEPOSIT", total_amount=10.0)

    def get_entity_info(addr):
        if addr == "EXCHANGE_DEPOSIT":
            return {"name": "Binance Hot Wallet", "type": "DEPOSIT_WALLET"}
        return None

    findings = engine._detect_vasp_entry_exit(graph, subject="Suspect", get_entity_info=get_entity_info)
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.VASP_ENTRY_EXIT
    assert f.metrics["gateway_type"] == "OFF_RAMP_DEPOSIT"


# ---------------------------------------------------------------------------
# Test 9: Temporal Burst Behavior
# ---------------------------------------------------------------------------
def test_09_temporal_burst():
    """Verify detection of high-frequency transaction bursts in short intervals."""
    engine = BehavioralIntelligenceEngine()
    txs = [
        CommonTransaction(
            transaction_hash=f"tx_burst_{i}",
            blockchain="ethereum",
            timestamp=f"2026-09-28T10:0{i}:00Z",  # 0, 1, 2 minutes apart (120s total)
            from_address="BurstWallet",
            to_address=f"Recv_{i}",
            amount=1.0,
            asset="ETH",
        )
        for i in range(3)
    ]

    findings = engine._detect_temporal_behavior(txs, subject="BurstWallet")
    assert len(findings) == 1
    f = findings[0]
    assert f.pattern_type == BehavioralPatternType.TEMPORAL_BEHAVIOR
    assert f.metrics["tx_count"] == 3
    assert f.metrics["time_span_seconds"] == 120


# ---------------------------------------------------------------------------
# Test 10: End-to-End Behavioral Intelligence Pipeline Integration
# ---------------------------------------------------------------------------
def test_10_end_to_end_behavioral_pipeline():
    """
    Verify complete pipeline execution:
    Graph -> Behavioral Intelligence -> Explainable Risk -> Evidence.
    """
    # Create an investigation with Fan-Out and Circular Wash Flow
    custom_txs = [
        # Circle: Suspect -> Mule1 -> Mule2 -> Suspect
        {"hash": "tx1", "from": "Suspect", "to": "Mule1", "value": 10.0, "time": "2026-09-28T01:00:00Z"},
        {"hash": "tx2", "from": "Mule1", "to": "Mule2", "value": 9.8, "time": "2026-09-28T01:01:00Z"},
        {"hash": "tx3", "from": "Mule2", "to": "Suspect", "value": 9.5, "time": "2026-09-28T01:02:00Z"},
        # Dispersion to other nodes
        {"hash": "tx4", "from": "Suspect", "to": "Mule3", "value": 1.0, "time": "2026-09-28T01:03:00Z"},
        {"hash": "tx5", "from": "Suspect", "to": "EXCHANGE_DEPOSIT", "value": 0.5, "time": "2026-09-28T01:04:00Z"},
    ]

    registry = VaspRegistry()
    adapter = MockBlockchainAdapter(transactions=custom_txs, registry=registry)
    service = AnalysisService(adapter=adapter, registry=registry)

    req = AnalyzeWalletRequest(
        case_id="CASE-BEHAVIORAL-001",
        wallet_address="Suspect",
        blockchain="ethereum",
        max_hops=3,
    )

    result = service.analyze_wallet(req)

    # 1. Behavioral findings presence
    assert result.behavioral is not None
    patterns = result.behavioral["patterns_detected"]
    assert "CIRCULAR_FLOW" in patterns
    assert "FAN_OUT" in patterns

    # 2. Risk result integrates behavioral indicators and signals
    assert result.risk is not None
    signal_types = {s.signal_type for s in result.risk.signals}
    assert "CIRCULAR_FLOW" in signal_types
    assert result.risk.score >= 45.0  # Elevated due to circular wash loop (+25) and velocity (+10)

    # 3. Evidentiary records compiled for behavioral patterns
    behavioral_evidence = [e for e in result.evidence if hasattr(e, "type") and e.type == "BEHAVIORAL"]
    assert len(behavioral_evidence) >= 2
    assert any("Circular" in e.description for e in behavioral_evidence)

    # 4. Canonical result metadata
    assert "behavioral_patterns" in result.metadata
    assert result.metadata["behavioral_findings_count"] >= 2
