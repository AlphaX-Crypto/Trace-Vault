from decimal import Decimal
import pytest
from fastapi import HTTPException

from app.api.routes.upi import UPIAnalyzeRequest, analyze_upi_transactions
from app.models.analysis import AnalyzeWalletRequest, EvidenceItem, RiskResult
from app.services.analysis_service import AnalysisService
from app.upi import (
    MockUPIAdapter,
    UPITransaction,
    UPITransactionNormalizer,
    get_upi_adapter,
)
from app.upi.intelligence import (
    ALL_RULES,
    BeneficiaryBurstRule,
    HighValueVelocityRule,
    HighVelocityRule,
    MultipleFailedAttemptsRule,
    NewBeneficiaryRule,
    NewDeviceRule,
    RapidPassThroughRule,
    TransactionBurstRule,
    UPIFeatureExtractor,
    UPIFeatures,
    UPIFraudAnalysisResult,
    UPIFraudFinding,
    UPIFraudIntelligenceEngine,
    UPIFraudSignalType,
    UPIRuleConfig,
    UnusualAmountRule,
    UnusualTransactionTimeRule,
)


@pytest.fixture
def mock_adapter():
    return MockUPIAdapter()


@pytest.fixture
def engine():
    return UPIFraudIntelligenceEngine()




# =========================================================================
# 1. Feature Extraction Tests
# =========================================================================

def test_feature_extraction_empty():
    features = UPIFeatureExtractor.extract([], None, "alice@mockupi")
    assert features.transaction_count == 0
    assert features.total_volume == Decimal("0.0")
    assert features.has_baseline is False
    assert features.failed_attempt_count == 0


def test_feature_extraction_statistics():
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": "T1",
            "timestamp": "2026-09-28T10:00:00Z",
            "amount": "100.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "bob@mockupi",
            "status": "SUCCESS",
        }),
        UPITransactionNormalizer.normalize({
            "transaction_id": "T2",
            "timestamp": "2026-09-28T10:01:00Z",
            "amount": "300.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "charlie@mockupi",
            "status": "SUCCESS",
        }),
        UPITransactionNormalizer.normalize({
            "transaction_id": "T3",
            "timestamp": "2026-09-28T10:02:00Z",
            "amount": "200.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "bob@mockupi",
            "status": "FAILED",
        }),
    ]

    features = UPIFeatureExtractor.extract(txs, None, "alice@mockupi")
    assert features.transaction_count == 3
    assert features.total_volume == Decimal("600.00")
    assert features.avg_amount == Decimal("200.00")
    assert features.max_amount == Decimal("300.00")
    assert features.min_amount == Decimal("100.00")
    assert features.median_amount == Decimal("200.0")
    assert features.time_span_seconds == 120.0
    assert features.unique_beneficiaries == 2
    assert features.failed_attempt_count == 1
    assert features.has_baseline is False


def test_feature_extraction_baseline_comparison():
    baseline_txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": "B1",
            "timestamp": "2026-09-20T10:00:00Z",
            "amount": "500.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "known_store@mockupi",
            "status": "SUCCESS",
            "device_reference": "DEV-ALICE-1",
        }),
        UPITransactionNormalizer.normalize({
            "transaction_id": "B2",
            "timestamp": "2026-09-21T10:00:00Z",
            "amount": "500.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "known_store@mockupi",
            "status": "SUCCESS",
            "device_reference": "DEV-ALICE-1",
        }),
    ]

    current_txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": "C1",
            "timestamp": "2026-09-28T10:00:00Z",
            "amount": "2500.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "new_store@mockupi",
            "status": "SUCCESS",
            "device_reference": "DEV-ALICE-2",
        }),
    ]

    features = UPIFeatureExtractor.extract(current_txs, baseline_txs, "alice@mockupi")
    assert features.has_baseline is True
    assert features.baseline_tx_count == 2
    assert features.baseline_avg_amount == Decimal("500.00")
    assert features.amount_deviation_ratio == 5.0
    assert "known_store@mockupi" in features.known_beneficiaries
    assert "new_store@mockupi" in features.new_beneficiaries
    assert features.new_beneficiary_count == 1
    assert features.new_device_count == 1


def test_feature_extraction_pass_through():
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": "PT1",
            "timestamp": "2026-09-28T10:00:00Z",
            "amount": "10000.00",
            "sender_vpa": "source@mockupi",
            "receiver_vpa": "mule@mockupi",
            "status": "SUCCESS",
        }),
        UPITransactionNormalizer.normalize({
            "transaction_id": "PT2",
            "timestamp": "2026-09-28T10:04:00Z",
            "amount": "9500.00",
            "sender_vpa": "mule@mockupi",
            "receiver_vpa": "destination@mockupi",
            "status": "SUCCESS",
        }),
    ]

    features = UPIFeatureExtractor.extract(txs, None, "mule@mockupi")
    assert features.pass_through_detected is True


# =========================================================================
# 2. Individual Pure Behavioral Rules Tests
# =========================================================================

def test_rule_new_beneficiary_trigger():
    rule = NewBeneficiaryRule()
    features = UPIFeatures(
        has_baseline=True,
        new_beneficiary_count=1,
        new_beneficiaries=["unseen@mockupi"],
        known_beneficiaries=["known@mockupi"],
    )
    tx = UPITransactionNormalizer.normalize({
        "transaction_id": "TX-1",
        "timestamp": "2026-09-28T10:00:00Z",
        "amount": "500.00",
        "sender_vpa": "alice@mockupi",
        "receiver_vpa": "unseen@mockupi",
    })
    finding = rule.evaluate([tx], features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.NEW_BENEFICIARY
    assert finding.risk_contribution == 15.0
    assert "unseen@mockupi" in finding.affected_entities


def test_rule_new_beneficiary_no_baseline():
    rule = NewBeneficiaryRule()
    features = UPIFeatures(has_baseline=False, new_beneficiary_count=0)
    tx = UPITransactionNormalizer.normalize({
        "transaction_id": "TX-1",
        "timestamp": "2026-09-28T10:00:00Z",
        "amount": "500.00",
        "sender_vpa": "alice@mockupi",
        "receiver_vpa": "unseen@mockupi",
    })
    finding = rule.evaluate([tx], features, "alice@mockupi", UPIRuleConfig())
    assert finding is None


def test_rule_high_velocity_trigger():
    rule = HighVelocityRule()
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": f"V-{i}",
            "timestamp": f"2026-09-28T10:00:{i*10:02d}Z",
            "amount": "500.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "bob@mockupi",
        })
        for i in range(5)
    ]
    features = UPIFeatureExtractor.extract(txs, None, "alice@mockupi")
    finding = rule.evaluate(txs, features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.HIGH_TRANSACTION_VELOCITY
    assert finding.risk_contribution == 20.0


def test_rule_high_velocity_normal():
    rule = HighVelocityRule()
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": f"V-{i}",
            "timestamp": f"2026-09-28T{10+i:02d}:00:00Z",
            "amount": "500.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "bob@mockupi",
        })
        for i in range(5)
    ]
    features = UPIFeatureExtractor.extract(txs, None, "alice@mockupi")
    finding = rule.evaluate(txs, features, "alice@mockupi", UPIRuleConfig())
    assert finding is None


def test_rule_transaction_burst_trigger():
    rule = TransactionBurstRule()
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": f"B-{i}",
            "timestamp": f"2026-09-28T10:00:{i*10:02d}Z",
            "amount": "200.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "bob@mockupi",
        })
        for i in range(3)
    ]
    features = UPIFeatureExtractor.extract(txs, None, "alice@mockupi")
    finding = rule.evaluate(txs, features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.TRANSACTION_BURST
    assert finding.risk_contribution == 15.0


def test_rule_unusual_amount_trigger():
    rule = UnusualAmountRule()
    features = UPIFeatures(
        has_baseline=True,
        max_amount=Decimal("15000.00"),
        baseline_avg_amount=Decimal("1000.00"),
        baseline_max_amount=Decimal("2000.00"),
        amount_deviation_ratio=15.0,
    )
    tx = UPITransactionNormalizer.normalize({
        "transaction_id": "AMT-1",
        "timestamp": "2026-09-28T10:00:00Z",
        "amount": "15000.00",
        "sender_vpa": "alice@mockupi",
        "receiver_vpa": "bob@mockupi",
    })
    finding = rule.evaluate([tx], features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.UNUSUAL_AMOUNT
    assert finding.risk_contribution == 20.0


def test_rule_unusual_amount_no_baseline():
    rule = UnusualAmountRule()
    features = UPIFeatures(
        has_baseline=False,
        max_amount=Decimal("15000.00"),
        amount_deviation_ratio=None,
    )
    tx = UPITransactionNormalizer.normalize({
        "transaction_id": "AMT-1",
        "timestamp": "2026-09-28T10:00:00Z",
        "amount": "15000.00",
        "sender_vpa": "alice@mockupi",
        "receiver_vpa": "bob@mockupi",
    })
    finding = rule.evaluate([tx], features, "alice@mockupi", UPIRuleConfig())
    assert finding is None


def test_rule_multiple_failed_attempts_trigger():
    rule = MultipleFailedAttemptsRule()
    features = UPIFeatures(failed_attempt_count=3)
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": f"F-{i}",
            "timestamp": f"2026-09-28T10:0{i}:00Z",
            "amount": "500.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "bob@mockupi",
            "status": "FAILED",
        })
        for i in range(3)
    ]
    finding = rule.evaluate(txs, features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.MULTIPLE_FAILED_ATTEMPTS
    assert finding.risk_contribution == 15.0


def test_rule_new_device_trigger():
    rule = NewDeviceRule()
    features = UPIFeatures(
        has_baseline=True,
        new_device_count=1,
        devices_used=["DEV-NEW-99"],
    )
    tx = UPITransactionNormalizer.normalize({
        "transaction_id": "D-1",
        "timestamp": "2026-09-28T10:00:00Z",
        "amount": "500.00",
        "sender_vpa": "alice@mockupi",
        "receiver_vpa": "bob@mockupi",
        "device_reference": "DEV-NEW-99",
    })
    finding = rule.evaluate([tx], features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.NEW_DEVICE
    assert finding.risk_contribution == 15.0


def test_rule_unusual_transaction_time_trigger():
    rule = UnusualTransactionTimeRule()
    features = UPIFeatures(has_baseline=True, is_unusual_hour=True)
    tx = UPITransactionNormalizer.normalize({
        "transaction_id": "T-NIGHT",
        "timestamp": "2026-09-28T02:30:00Z",
        "amount": "500.00",
        "sender_vpa": "alice@mockupi",
        "receiver_vpa": "bob@mockupi",
    })
    finding = rule.evaluate([tx], features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.UNUSUAL_TRANSACTION_TIME
    assert finding.risk_contribution == 10.0


def test_rule_beneficiary_burst_trigger():
    rule = BeneficiaryBurstRule()
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": f"BB-{i}",
            "timestamp": f"2026-09-28T10:0{i}:00Z",
            "amount": "1000.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": f"dest_{i}@mockupi",
        })
        for i in range(4)
    ]
    features = UPIFeatureExtractor.extract(txs, None, "alice@mockupi")
    finding = rule.evaluate(txs, features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.BENEFICIARY_BURST
    assert finding.risk_contribution == 20.0
    assert len(finding.affected_entities) == 4


def test_rule_high_value_velocity_trigger():
    rule = HighValueVelocityRule()
    features = UPIFeatures(
        transaction_count=4,
        total_volume=Decimal("60000.00"),
        velocity_tx_per_minute=2.0,
        time_span_seconds=120.0,
    )
    txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": f"HV-{i}",
            "timestamp": f"2026-09-28T10:0{i}:00Z",
            "amount": "15000.00",
            "sender_vpa": "alice@mockupi",
            "receiver_vpa": "bob@mockupi",
        })
        for i in range(4)
    ]
    finding = rule.evaluate(txs, features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.HIGH_VALUE_VELOCITY
    assert finding.risk_contribution == 25.0


def test_rule_rapid_pass_through_trigger():
    rule = RapidPassThroughRule()
    features = UPIFeatures(pass_through_detected=True)
    tx = UPITransactionNormalizer.normalize({
        "transaction_id": "PT-1",
        "timestamp": "2026-09-28T10:00:00Z",
        "amount": "1000.00",
        "sender_vpa": "alice@mockupi",
        "receiver_vpa": "bob@mockupi",
    })
    finding = rule.evaluate([tx], features, "alice@mockupi", UPIRuleConfig())
    assert finding is not None
    assert finding.signal_type == UPIFraudSignalType.RAPID_PASS_THROUGH
    assert finding.risk_contribution == 20.0


# =========================================================================
# 3. Synthetic Mock Scenarios Evaluation (UPI-RISK-001 to 007)
# =========================================================================

def test_mock_scenario_upi_risk_001(mock_adapter, engine):
    """UPI-RISK-001: New beneficiary + unusual amount"""
    scenario = mock_adapter.get_scenario("UPI-RISK-001")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    signal_types = {f.signal_type for f in result.findings}
    assert UPIFraudSignalType.NEW_BENEFICIARY in signal_types
    assert UPIFraudSignalType.UNUSUAL_AMOUNT in signal_types
    assert result.risk.score >= 35.0
    assert result.risk.level in ("MEDIUM", "HIGH")


def test_mock_scenario_upi_risk_002(mock_adapter, engine):
    """UPI-RISK-002: High velocity (5 rapid txs within 120s)"""
    scenario = mock_adapter.get_scenario("UPI-RISK-002")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    signal_types = {f.signal_type for f in result.findings}
    assert UPIFraudSignalType.HIGH_TRANSACTION_VELOCITY in signal_types
    assert result.risk.score >= 20.0


def test_mock_scenario_upi_risk_003(mock_adapter, engine):
    """UPI-RISK-003: Multiple failed attempts followed by success"""
    scenario = mock_adapter.get_scenario("UPI-RISK-003")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    signal_types = {f.signal_type for f in result.findings}
    assert UPIFraudSignalType.MULTIPLE_FAILED_ATTEMPTS in signal_types
    assert result.features.failed_attempt_count == 3


def test_mock_scenario_upi_risk_004(mock_adapter, engine):
    """UPI-RISK-004: New device + unusual amount"""
    scenario = mock_adapter.get_scenario("UPI-RISK-004")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    signal_types = {f.signal_type for f in result.findings}
    assert UPIFraudSignalType.NEW_DEVICE in signal_types
    assert UPIFraudSignalType.UNUSUAL_AMOUNT in signal_types


def test_mock_scenario_upi_risk_005(mock_adapter, engine):
    """UPI-RISK-005: Beneficiary burst (4 distinct counterparties)"""
    scenario = mock_adapter.get_scenario("UPI-RISK-005")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    signal_types = {f.signal_type for f in result.findings}
    assert UPIFraudSignalType.BENEFICIARY_BURST in signal_types


def test_mock_scenario_upi_risk_006_control_case(mock_adapter, engine):
    """UPI-RISK-006: Control case (normal behavior produces LOW risk <= 30.0)"""
    scenario = mock_adapter.get_scenario("UPI-RISK-006")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    assert result.risk.score <= 30.0
    assert result.risk.level == "LOW"
    assert len(result.findings) == 0


def test_mock_scenario_upi_risk_007_insufficient_baseline(mock_adapter, engine):
    """UPI-RISK-007: Insufficient baseline (graceful, no crash, no false alerts)"""
    scenario = mock_adapter.get_scenario("UPI-RISK-007")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    assert result.features.has_baseline is False
    assert result.risk.score <= 30.0
    assert result.risk.level == "LOW"
    assert len(result.findings) == 0


# =========================================================================
# 4. Engine Determinism & Reasoning Trace Verification
# =========================================================================

def test_engine_determinism_repeatability(mock_adapter, engine):
    scenario = mock_adapter.get_scenario("UPI-RISK-001")
    res1 = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    res2 = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )

    assert res1.risk.score == res2.risk.score
    assert res1.risk.level == res2.risk.level
    assert len(res1.findings) == len(res2.findings)
    assert res1.reasoning_trace == res2.reasoning_trace
    assert [f.signal_id for f in res1.findings] == [f.signal_id for f in res2.findings]


def test_engine_14_step_reasoning_trace(mock_adapter, engine):
    scenario = mock_adapter.get_scenario("UPI-RISK-001")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    assert len(result.reasoning_trace) == 14
    for i in range(1, 15):
        assert any(f"Step {i}:" in step for step in result.reasoning_trace), f"Missing Step {i}"


def test_engine_evidence_synthesis(mock_adapter, engine):
    scenario = mock_adapter.get_scenario("UPI-RISK-001")
    result = engine.analyze(
        subject=scenario["subject"],
        transactions=scenario["transactions"],
        baseline_transactions=scenario["baseline_transactions"],
    )
    assert len(result.evidence) == len(result.findings)
    for ev in result.evidence:
        assert isinstance(ev, EvidenceItem)
        assert ev.type == "UPI_SIGNAL"
        assert ev.source == "upi_rules_engine"
        assert "Potential fraud-risk signal detected" in ev.description


# =========================================================================
# 5. API Route Testing
# =========================================================================

def test_api_analyze_endpoint_with_scenario():
    req = UPIAnalyzeRequest(scenario="UPI-RISK-001")
    data = analyze_upi_transactions(req)
    assert data["subject"] == "vikram@mockupi"
    assert data["risk"]["score"] >= 35.0
    assert len(data["reasoning_trace"]) == 14
    assert len(data["evidence"]) >= 2


def test_api_analyze_endpoint_with_payload():
    req = UPIAnalyzeRequest(
        subject_vpa="user@mockupi",
        transactions=[
            {
                "transaction_id": "API-T1",
                "timestamp": "2026-09-28T10:00:00Z",
                "amount": "1000.00",
                "sender_vpa": "user@mockupi",
                "receiver_vpa": "vendor@mockupi",
                "status": "SUCCESS",
            }
        ]
    )
    data = analyze_upi_transactions(req)
    assert data["subject"] == "user@mockupi"
    assert data["risk"]["score"] == 0.0
    assert data["risk"]["level"] == "LOW"


def test_api_analyze_rejects_credentials():
    req = UPIAnalyzeRequest(
        subject_vpa="user@mockupi",
        transactions=[
            {
                "transaction_id": "API-LEAK",
                "timestamp": "2026-09-28T10:00:00Z",
                "amount": "1000.00",
                "sender_vpa": "user@mockupi",
                "receiver_vpa": "vendor@mockupi",
                "upi_pin": "123456",  # Sensitive credential!
            }
        ]
    )
    with pytest.raises(HTTPException) as exc_info:
        analyze_upi_transactions(req)
    assert exc_info.value.status_code == 400
    assert "Sensitive authentication credential" in exc_info.value.detail


# =========================================================================
# 6. Regression Testing: Crypto Pipeline Must Remain 100% Untouched
# =========================================================================

def test_crypto_pipeline_regression_untouched():
    """
    CRITICAL REGRESSION REQUIREMENT:
    Verify that CASE-2026-001 executes exactly as expected:
    - Target wallet: A (a)
    - Score: 60.0
    - Level: MEDIUM
    - Attribution: Example Exchange (VASP)
    """
    service = AnalysisService()
    req = AnalyzeWalletRequest(case_id="CASE-2026-001", wallet_address="A", max_hops=3)
    result = service.analyze_wallet(req)
    assert result.wallet == "a"
    assert result.risk.score == 60.0
    assert result.risk.level == "MEDIUM"
    assert result.nearest_vasp is not None
    assert result.nearest_vasp.name == "Example Exchange"
    assert len(result.evidence) > 0

