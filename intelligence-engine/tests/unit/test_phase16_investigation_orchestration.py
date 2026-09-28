import pytest
from datetime import datetime
from fastapi import HTTPException

from app.investigation.models import (
    InvestigationPlan,
    InvestigationRequest,
    InvestigationRiskSummary,
    InvestigationStatus,
    InvestigationTimelineEvent,
    RailScope,
    SourceProvenanceType,
    TimelineEventType,
    UnifiedInvestigationResult,
)
from app.investigation.planner import InvestigationPlanner
from app.investigation.aggregator import RiskAggregator
from app.investigation.timeline import InvestigationTimelineBuilder
from app.investigation.evidence import InvestigationEvidenceLinker, EvidenceCategory
from app.investigation.orchestrator import InvestigationOrchestrator
from app.investigation.scenarios import INVESTIGATION_SCENARIOS
from app.investigation.serializer import InvestigationSerializer, deep_scrub_credentials
from app.models.analysis import RiskResult, RiskSignal
from app.services.analysis_service import AnalysisService
from app.api.routes.investigations import (
    create_and_run_investigation,
    get_investigation,
    get_investigation_evidence,
    get_investigation_graph,
    get_investigation_timeline,
    list_investigation_scenarios,
    run_planned_investigation,
)


# =========================================================================
# 1. Request Validation & Credential Rejection Tests
# =========================================================================

def test_investigation_request_valid():
    req = InvestigationRequest(
        case_id="CASE-101",
        subject_id="0x71c83408a6cf2372e9a5957b6d193d56f6c91350",
        rail_scope=RailScope.CRYPTO.value,
    )
    assert req.case_id == "CASE-101"
    assert req.subject_id == "0x71c83408a6cf2372e9a5957b6d193d56f6c91350"
    assert req.rail_scope == "CRYPTO"


def test_investigation_request_credential_rejection():
    with pytest.raises(ValueError, match="Security Violation"):
        InvestigationRequest(
            case_id="CASE-BAD",
            subject_id="0x123",
            metadata={"password": "supersecretpassword"},
        )

    with pytest.raises(ValueError, match="Security Violation"):
        InvestigationRequest(
            case_id="CASE-BAD",
            subject_id="0x123",
            metadata={"upi_pin": "1234"},
        )


# =========================================================================
# 2. Planner Determinism Tests
# =========================================================================

def test_planner_subject_type_detection():
    assert InvestigationPlanner.detect_subject_type("0x71c83408a6cf2372e9a5957b6d193d56f6c91350") == "wallet"
    assert InvestigationPlanner.detect_subject_type("user@mockupi") == "upi_vpa"
    assert InvestigationPlanner.detect_subject_type("MERCH_001") == "merchant"
    assert InvestigationPlanner.detect_subject_type("CASE-2026-001") == "case"


def test_planner_deterministic_steps():
    req = InvestigationRequest(
        case_id="CASE-MULTI-99",
        subject_id="0x71c83408a6cf2372e9a5957b6d193d56f6c91350",
        rail_scope=RailScope.MULTI_RAIL.value,
        include_geospatial=True,
    )
    plan = InvestigationPlanner.build_plan(req)
    assert plan.investigation_id.startswith("INV-CASE-MULTI-99-")
    assert plan.plan_id.startswith("PLAN-INV-CASE-MULTI-99-")
    assert len(plan.steps) >= 7
    step_names = [s.step_name for s in plan.steps]
    assert "SUBJECT_DISCOVERY_AND_NORMALIZATION" in step_names
    assert "CRYPTO_INTELLIGENCE_ANALYSIS" in step_names
    assert "UPI_FRAUD_INTELLIGENCE_ANALYSIS" in step_names
    assert "UNIFIED_MULTI_RAIL_GRAPH_ASSEMBLY" in step_names
    assert "MULTI_DOMAIN_RISK_AGGREGATION" in step_names
    assert "INVESTIGATION_RESULT_FINALIZATION" in step_names


# =========================================================================
# 3. Risk Aggregator Determinism Tests
# =========================================================================

def test_risk_aggregator_formula():
    # Test single domain
    single_res = RiskAggregator.aggregate(
        crypto_risk=RiskResult(score=60.0, level="MEDIUM", explanation="Test"),
    )
    assert single_res.overall_score == 60.0
    assert single_res.severity == "HIGH"
    assert single_res.source_scores["crypto"] == 60.0

    # Test multi-domain compounding:
    # base = max(60, 40) = 60. compound = min(15.0, 40 * 0.10) = 4.0. Total = 64.0
    multi_res = RiskAggregator.aggregate(
        crypto_risk=RiskResult(score=60.0, level="MEDIUM", explanation="Crypto Risk"),
        upi_risk=RiskResult(score=40.0, level="MEDIUM", explanation="UPI Risk"),
    )
    assert multi_res.overall_score == 64.0
    assert multi_res.severity == "HIGH"

    # Test with cross-rail bridge: +5.0 bonus
    bridge_res = RiskAggregator.aggregate(
        crypto_risk=RiskResult(score=60.0, level="MEDIUM", explanation="Crypto"),
        upi_risk=RiskResult(score=40.0, level="MEDIUM", explanation="UPI"),
        has_cross_rail_bridges=True,
        cross_rail_count=1,
    )
    assert bridge_res.overall_score == 69.0  # 64 + 5


def test_risk_aggregator_limitations_stated():
    res = RiskAggregator.aggregate()
    assert res.overall_score == 0.0
    assert res.severity == "LOW"
    assert any("analytical triaging indicator" in lim for lim in res.limitations)
    assert any("do not prove common personhood" in lim for lim in res.limitations)


# =========================================================================
# 4. Timeline Chronology & Missing Timestamps Tests
# =========================================================================

def test_timeline_chronological_ordering():
    crypto_txs = [
        {"transaction_hash": "0x2", "timestamp": "2026-09-28T12:00:00Z", "amount": 1.0, "asset": "ETH"},
        {"transaction_hash": "0x1", "timestamp": "2026-09-28T11:00:00Z", "amount": 2.0, "asset": "ETH"},
    ]
    upi_txs = [
        {"transaction_id": "U3", "timestamp": "2026-09-28T13:00:00Z", "amount": 500.0, "currency": "INR"},
    ]
    timeline = InvestigationTimelineBuilder.build_timeline(
        crypto_transactions=crypto_txs,
        upi_transactions=upi_txs,
    )
    assert len(timeline) == 3
    # Check chronological ordering: 11:00, 12:00, 13:00
    assert timeline[0].transaction_reference == "0x1"
    assert timeline[1].transaction_reference == "0x2"
    assert timeline[2].transaction_reference == "U3"
    assert all(t.timestamp_status == "CONFIRMED" for t in timeline)


def test_timeline_unknown_timestamp_handling():
    crypto_txs = [
        {"transaction_hash": "0xunknown", "timestamp": None, "amount": 1.0},
        {"transaction_hash": "0xknown", "timestamp": "2026-09-28T10:00:00Z", "amount": 2.0},
    ]
    timeline = InvestigationTimelineBuilder.build_timeline(crypto_transactions=crypto_txs)
    assert len(timeline) == 2
    # Known timestamp must precede unknown
    assert timeline[0].transaction_reference == "0xknown"
    assert timeline[0].timestamp_status == "CONFIRMED"
    assert timeline[1].transaction_reference == "0xunknown"
    assert timeline[1].timestamp_status == "UNKNOWN"
    assert timeline[1].timestamp is None  # Never invented!


# =========================================================================
# 5. Evidence Linking & Legal Phraseology Safeguards
# =========================================================================

def test_evidence_linking_categories_and_safe_terminology():
    crypto_txs = [{"transaction_hash": "0xtest1", "amount": 5.0, "asset": "ETH"}]
    vasps = [{"vasp_name": "Test Exchange", "risk_score": 50.0}]
    cross_assocs = [{"source_node_id": "wallet:0x1", "target_node_id": "upi:a@b", "description": "Correlated"}]

    evidence = InvestigationEvidenceLinker.link_evidence(
        crypto_transactions=crypto_txs,
        vasp_attributions=vasps,
        cross_rail_associations=cross_assocs,
    )
    assert len(evidence) >= 3
    types = {e.type for e in evidence}
    assert EvidenceCategory.OBSERVED_FACT in types
    assert EvidenceCategory.ATTRIBUTION in types
    assert EvidenceCategory.INVESTIGATOR_INTERPRETATION in types

    # Safe terminology check: must NOT claim "court-ready", must specify suitable for review
    for e in evidence:
        assert "court-ready" not in e.description.lower()
        assert e.metadata.get("evidence_standard") == "structured_investigative_evidence_suitable_for_review"


# =========================================================================
# 6. Non-Inferential Cross-Rail & Synthetic Labeling Tests
# =========================================================================

def test_non_inferential_cross_rail_association():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-004",
        case_id="CASE-CROSS-RAIL-004",
        subject_id="0xvictimwallet000000000000000000000000001",
    )
    result = orchestrator.run_investigation(req)
    assert len(result.cross_rail_associations) >= 1
    for ca in result.cross_rail_associations:
        # Must have synthetic label
        assert "SYNTHETIC DEMONSTRATION ASSOCIATION" in ca["description"]
        # Must NOT infer ownership or legal personhood
        assert "identity" not in ca["description"].lower()


# =========================================================================
# 7. Synthetic Scenario Verification (INV-001 through INV-008)
# =========================================================================

def test_scenario_inv_001_crypto_regression():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-001",
        case_id="CASE-2026-001",
        subject_id="0x71c83408a6cf2372e9a5957b6d193d56f6c91350",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.COMPLETE.value
    assert "CRYPTO" in result.rails_analyzed
    assert len(result.attribution_candidates) == 1
    assert result.attribution_candidates[0]["vasp_name"] == "Example Exchange"
    assert result.attribution_candidates[0]["risk_score"] == 60.0
    assert len(result.reasoning_trace) == 16


def test_scenario_inv_002_upi_fraud():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-002",
        case_id="CASE-UPI-MULE-002",
        subject_id="source_fraudster@mockupi",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.COMPLETE.value
    assert "UPI" in result.rails_analyzed
    assert result.upi_findings is not None
    assert len(result.timeline) == 3


def test_scenario_inv_003_independent():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-003",
        case_id="CASE-INDEPENDENT-003",
        subject_id="CASE-INDEPENDENT-003",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.COMPLETE.value
    assert len(result.cross_rail_associations) == 0
    assert result.graph_summary["has_cross_rail_bridges"] is False


def test_scenario_inv_004_cross_rail():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-004",
        case_id="CASE-CROSS-RAIL-004",
        subject_id="0xvictimwallet000000000000000000000000001",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.COMPLETE.value
    assert len(result.cross_rail_associations) == 1
    assert result.graph_summary["has_cross_rail_bridges"] is True
    assert result.risk_summary.severity == "CRITICAL"


def test_scenario_inv_005_geospatial_anomaly():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-005",
        case_id="CASE-GEO-ANOMALY-005",
        subject_id="traveler@mockupi",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.COMPLETE.value
    assert "GEOSPATIAL" in result.rails_analyzed
    assert result.geospatial_findings is not None
    # Impossible travel between Bengaluru and Delhi
    assert any(
        s.get("signal_type") == "IMPOSSIBLE_TRAVEL_SEQUENCE"
        for s in result.risk_summary.contributing_signals
    )


def test_scenario_inv_006_vasp_attribution():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-006",
        case_id="CASE-VASP-HUB-006",
        subject_id="Nexus Global VASP",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.COMPLETE.value
    assert len(result.attribution_candidates) == 1
    assert result.attribution_candidates[0]["vasp_name"] == "Nexus Global VASP"


def test_scenario_inv_007_partial_data_handling():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-007",
        case_id="CASE-PARTIAL-DATA-007",
        subject_id="isolated_vpa@mockupi",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.PARTIAL.value
    assert any("Cryptocurrency transaction data was unavailable" in lim for lim in result.limitations)


def test_scenario_inv_008_benign_control():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-008",
        case_id="CASE-CONTROL-008",
        subject_id="CASE-CONTROL-008",
    )
    result = orchestrator.run_investigation(req)
    assert result.status == InvestigationStatus.COMPLETE.value
    assert result.risk_summary.severity == "LOW"


# =========================================================================
# 8. Live/Mock Isolation Safety Tests
# =========================================================================

def test_live_mode_isolation_and_no_silent_mock_fallback():
    # If live_mode is set but adapter unavailable, orchestrator must raise rather than silently use mock
    mock_service = AnalysisService()
    mock_service.ethereum_adapter = None  # Force unconfigured live adapter
    orch = InvestigationOrchestrator(analysis_service=mock_service)
    req = InvestigationRequest(
        case_id="CASE-LIVE-TEST",
        subject_id="0x71c83408a6cf2372e9a5957b6d193d56f6c91350",
        live_mode=True,
    )
    with pytest.raises(RuntimeError, match="Live mode requested but live Ethereum adapter is not configured"):
        orch.run_investigation(req)


# =========================================================================
# 9. 16-Step Reasoning Trace & Serialization Tests
# =========================================================================

def test_reasoning_trace_16_steps():
    orchestrator = InvestigationOrchestrator()
    req = InvestigationRequest(
        scenario="INV-004",
        case_id="CASE-CROSS-RAIL-004",
        subject_id="0xvictimwallet000000000000000000000000001",
    )
    result = orchestrator.run_investigation(req)
    assert len(result.reasoning_trace) == 16
    for i in range(1, 17):
        assert result.reasoning_trace[i - 1].startswith(f"Step {i}:")


def test_serializer_deep_scrub():
    dirty = {
        "case_id": "SAFE",
        "nested": {
            "password": "secret",
            "seed_phrase": "word1 word2",
            "val": 123,
        },
    }
    clean = deep_scrub_credentials(dirty)
    assert "password" not in clean["nested"]
    assert "seed_phrase" not in clean["nested"]
    assert clean["nested"]["val"] == 123


# =========================================================================
# 10. API Route Contract Tests
# =========================================================================

def test_api_list_investigation_scenarios():
    data = list_investigation_scenarios()
    assert "scenarios" in data
    ids = {s["scenario_id"] for s in data["scenarios"]}
    assert "INV-001" in ids
    assert "INV-004" in ids
    assert "INV-008" in ids


def test_api_create_and_run_investigation():
    req = InvestigationRequest(
        scenario="INV-001",
        case_id="CASE-API-001",
        subject_id="0x71c83408a6cf2372e9a5957b6d193d56f6c91350",
    )
    data = create_and_run_investigation(req)
    inv_id = data["investigation_id"]
    assert data["status"] == "COMPLETE"
    assert len(data["reasoning_trace"]) == 16

    # Test retrieval endpoints
    fetched = get_investigation(inv_id)
    assert fetched["investigation_id"] == inv_id

    timeline = get_investigation_timeline(inv_id)
    assert timeline["investigation_id"] == inv_id
    assert len(timeline["timeline"]) > 0

    evidence = get_investigation_evidence(inv_id)
    assert evidence["investigation_id"] == inv_id
    assert len(evidence["evidence_items"]) > 0

    graph = get_investigation_graph(inv_id)
    assert graph["investigation_id"] == inv_id
    assert "total_nodes" in graph["graph_summary"]


def test_api_investigation_not_found():
    with pytest.raises(HTTPException) as exc:
        get_investigation("NON-EXISTENT-ID")
    assert exc.value.status_code == 404
