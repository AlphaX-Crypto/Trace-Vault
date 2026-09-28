"""
Unit Test Suite for TRACEVAULT V3 — Phase 12: UPI Data Foundation & Common Financial Event Model.

Covers the 20 required verification points:
 1. UPI model creation
 2. Valid VPA formats
 3. Invalid VPA formats
 4. Amount precision with Decimal
 5. Strict INR currency validation
 6. Timezone-aware timestamp normalization
 7. Status normalization
 8. Transaction type normalization
 9. Safe handling of missing optional fields
10. Safe fallback on unknown status
11. Safe fallback on unknown transaction type
12. Raw event -> Canonical model normalization
13. MockUPIAdapter properties and contracts
14. Deterministic synthetic test scenarios (P2P, P2M, Multi-hop, Refund, Failed)
15. Source metadata verification
16. Graph-compatible representation conversion
17. Sensitive credential rejection (PIN, OTP, CVV, Password)
18. UPI adapter selection factory
19. Explicit failure on 'live' configuration
20. Crypto pipeline remains completely unaffected
"""

from datetime import datetime, timezone
from decimal import Decimal
import pytest

from app.models.analysis import AnalyzeWalletRequest
from app.models.financial_event import FinancialEvent, FinancialRail
from app.models.transaction import CommonTransaction
from app.services.analysis_service import AnalysisService
from app.upi import (
    BaseUPIAdapter,
    MockUPIAdapter,
    UPIRawEvent,
    UPIStatus,
    UPITransaction,
    UPITransactionNormalizer,
    UPITransactionType,
    get_upi_adapter,
    validate_vpa,
)
from app.upi.models import UPIEntityType


# ---------------------------------------------------------------------------
# Test 1: UPI Model Creation
# ---------------------------------------------------------------------------
def test_01_upi_model_creation():
    tx = UPITransaction(
        transaction_id="TXN-1001",
        transaction_reference="UTR-1001",
        timestamp="2026-09-28T08:00:00Z",
        amount=Decimal("500.00"),
        currency="INR",
        sender_vpa="user.one@mockupi",
        receiver_vpa="user.two@mockupi",
        transaction_type=UPITransactionType.P2P,
        status=UPIStatus.SUCCESS,
        source="mock_upi",
        metadata={"note": "Test transfer"},
    )
    assert tx.transaction_id == "TXN-1001"
    assert tx.amount == Decimal("500.00")
    assert tx.currency == "INR"
    assert tx.sender_vpa == "user.one@mockupi"
    assert tx.receiver_vpa == "user.two@mockupi"
    assert tx.rail == "upi"


# ---------------------------------------------------------------------------
# Test 2: Valid VPA Formats
# ---------------------------------------------------------------------------
def test_02_valid_vpa():
    assert validate_vpa("alice@mockupi") is True
    assert validate_vpa("bob.smith@okhdfcbank") is True
    assert validate_vpa("merchant_123@icici") is True
    assert validate_vpa("support-team@paytm") is True


# ---------------------------------------------------------------------------
# Test 3: Invalid VPA Formats
# ---------------------------------------------------------------------------
def test_03_invalid_vpa():
    assert validate_vpa("no-at-symbol") is False
    assert validate_vpa("@missing-username") is False
    assert validate_vpa("missing-handle@") is False
    assert validate_vpa("invalid space@bank") is False
    assert validate_vpa("") is False
    assert validate_vpa(None) is False


# ---------------------------------------------------------------------------
# Test 4: Amount Precision (Decimal)
# ---------------------------------------------------------------------------
def test_04_amount_precision():
    amt_str = "1234567.8901"
    amt = UPITransactionNormalizer.normalize_amount(amt_str)
    assert isinstance(amt, Decimal)
    assert amt == Decimal("1234567.8901")

    # Negative amount rejection
    with pytest.raises(ValueError, match="cannot be negative"):
        UPITransactionNormalizer.normalize_amount("-50.00")


# ---------------------------------------------------------------------------
# Test 5: INR Currency Enforcement
# ---------------------------------------------------------------------------
def test_05_inr_currency():
    # Valid INR
    raw_valid = {
        "transaction_id": "TXN-INR",
        "sender_vpa": "a@mock",
        "receiver_vpa": "b@mock",
        "amount": "100.00",
        "currency": "INR",
    }
    tx = UPITransactionNormalizer.normalize(raw_valid)
    assert tx.currency == "INR"

    # Invalid USD
    raw_invalid = dict(raw_valid, currency="USD")
    with pytest.raises(ValueError, match="strictly supports INR"):
        UPITransactionNormalizer.normalize(raw_invalid)


# ---------------------------------------------------------------------------
# Test 6: Timestamp Normalization
# ---------------------------------------------------------------------------
def test_06_timestamp_normalization():
    # Epoch milliseconds
    ts_ms = 1790582400000  # 2026-09-28T08:00:00 UTC
    norm_ms = UPITransactionNormalizer.normalize_timestamp(ts_ms)
    assert norm_ms.endswith("Z")
    assert "2026" in norm_ms

    # Python datetime without tz (assumes UTC)
    dt_naive = datetime(2026, 9, 28, 8, 30, 0)
    norm_dt = UPITransactionNormalizer.normalize_timestamp(dt_naive)
    assert norm_dt == "2026-09-28T08:30:00Z"


# ---------------------------------------------------------------------------
# Test 7: Status Normalization
# ---------------------------------------------------------------------------
def test_07_status_normalization():
    assert UPIStatus.normalize("SUCCESS") == UPIStatus.SUCCESS
    assert UPIStatus.normalize("COMPLETED") == UPIStatus.SUCCESS
    assert UPIStatus.normalize("PAID") == UPIStatus.SUCCESS
    assert UPIStatus.normalize("DECLINED") == UPIStatus.FAILED
    assert UPIStatus.normalize("FAILURE") == UPIStatus.FAILED
    assert UPIStatus.normalize("IN_PROGRESS") == UPIStatus.PENDING
    assert UPIStatus.normalize("REFUNDED") == UPIStatus.REFUNDED
    assert UPIStatus.normalize("REVERSED") == UPIStatus.REVERSED


# ---------------------------------------------------------------------------
# Test 8: Transaction Type Normalization
# ---------------------------------------------------------------------------
def test_08_transaction_type_normalization():
    assert UPITransactionType.normalize("P2P") == UPITransactionType.P2P
    assert UPITransactionType.normalize("PERSON_TO_PERSON") == UPITransactionType.P2P
    assert UPITransactionType.normalize("P2M") == UPITransactionType.P2M
    assert UPITransactionType.normalize("MERCHANT_PAYMENT") == UPITransactionType.P2M
    assert UPITransactionType.normalize("COLLECT_REQUEST") == UPITransactionType.COLLECT
    assert UPITransactionType.normalize("REFUND") == UPITransactionType.REFUND
    assert UPITransactionType.normalize("REVERSAL") == UPITransactionType.REVERSAL


# ---------------------------------------------------------------------------
# Test 9: Missing Optional Fields
# ---------------------------------------------------------------------------
def test_09_missing_optional_fields():
    raw_minimal = {
        "transaction_id": "TXN-MIN-001",
        "sender_vpa": "payer@bank",
        "receiver_vpa": "payee@bank",
        "amount": "150.00",
    }
    tx = UPITransactionNormalizer.normalize(raw_minimal)
    assert tx.transaction_id == "TXN-MIN-001"
    assert tx.merchant_id is None
    assert tx.device_reference is None
    assert tx.payment_app is None
    assert tx.transaction_reference is None
    assert tx.status == UPIStatus.SUCCESS  # default


# ---------------------------------------------------------------------------
# Test 10: Unknown Status Safe Handling
# ---------------------------------------------------------------------------
def test_10_unknown_status():
    assert UPIStatus.normalize("CUSTOM_WEIRD_STATUS") == UPIStatus.UNKNOWN
    raw = {
        "transaction_id": "TXN-UNK-001",
        "sender_vpa": "payer@bank",
        "receiver_vpa": "payee@bank",
        "amount": "100.00",
        "status": "CUSTOM_WEIRD_STATUS",
    }
    tx = UPITransactionNormalizer.normalize(raw)
    assert tx.status == UPIStatus.UNKNOWN
    assert tx.metadata["provider_status"] == "CUSTOM_WEIRD_STATUS"


# ---------------------------------------------------------------------------
# Test 11: Unknown Transaction Type Safe Handling
# ---------------------------------------------------------------------------
def test_11_unknown_transaction_type():
    assert UPITransactionType.normalize("NON_STANDARD_FLOW") == UPITransactionType.UNKNOWN
    raw = {
        "transaction_id": "TXN-TYPE-UNK",
        "sender_vpa": "payer@bank",
        "receiver_vpa": "payee@bank",
        "amount": "100.00",
        "transaction_type": "NON_STANDARD_FLOW",
    }
    tx = UPITransactionNormalizer.normalize(raw)
    assert tx.transaction_type == UPITransactionType.UNKNOWN


# ---------------------------------------------------------------------------
# Test 12: Raw Event -> Canonical Model
# ---------------------------------------------------------------------------
def test_12_raw_event_to_canonical():
    raw_event = UPIRawEvent(
        payload={
            "txnId": "RAW-EVENT-999",
            "payerVpa": "customer@bank",
            "payeeVpa": "store@merchant",
            "txnAmount": "499.50",
            "txnStatus": "COMPLETED",
            "txnType": "P2M",
            "merchantId": "MERCHANT-STORE-99",
        },
        source="mock_upi",
    )
    tx = UPITransactionNormalizer.normalize(raw_event.payload, default_source=raw_event.source)
    assert tx.transaction_id == "RAW-EVENT-999"
    assert tx.amount == Decimal("499.50")
    assert tx.status == UPIStatus.SUCCESS
    assert tx.transaction_type == UPITransactionType.P2M
    assert tx.merchant_id == "MERCHANT-STORE-99"
    assert tx.source == "mock_upi"


# ---------------------------------------------------------------------------
# Test 13: MockUPIAdapter Properties and Contracts
# ---------------------------------------------------------------------------
def test_13_mock_upi_adapter():
    adapter = MockUPIAdapter()
    assert isinstance(adapter, BaseUPIAdapter)
    assert adapter.data_source == "mock_upi"
    assert adapter.is_live is False
    health = adapter.health_check()
    assert health["status"] == "healthy"
    assert health["is_live"] is False
    assert health["transaction_count"] >= 5


# ---------------------------------------------------------------------------
# Test 14: Deterministic Mock Data Scenarios
# ---------------------------------------------------------------------------
def test_14_deterministic_mock_data():
    adapter = MockUPIAdapter()

    # Scenario 1: NORMAL_P2P
    p2p = adapter.get_transaction("UPI-TXN-P2P-001")
    assert p2p is not None
    assert p2p.amount == Decimal("500.00")
    assert p2p.sender_vpa == "alice@mockupi"
    assert p2p.receiver_vpa == "bob@mockupi"
    assert p2p.status == UPIStatus.SUCCESS

    # Scenario 2: NORMAL_P2M
    p2m = adapter.get_transaction("UPI-TXN-P2M-001")
    assert p2m is not None
    assert p2m.amount == Decimal("850.00")
    assert p2m.merchant_id == "MERCHANT-DEMO-01"

    # Scenario 3: MULTI_TRANSACTION_CASE (UPI-DEMO-003)
    tx1 = adapter.get_transaction("UPI-TXN-MULTI-001")
    tx2 = adapter.get_transaction("UPI-TXN-MULTI-002")
    assert tx1 is not None and tx2 is not None
    assert tx1.sender_vpa == "alice@mockupi" and tx1.receiver_vpa == "bob@mockupi"
    assert tx2.sender_vpa == "bob@mockupi" and tx2.receiver_vpa == "merchant.demo@mockupi"

    # Scenario 4: REFUND_CASE
    refund = adapter.get_transaction("UPI-TXN-REFUND-001")
    assert refund is not None
    assert refund.transaction_type == UPITransactionType.REFUND
    assert refund.sender_vpa == "merchant.demo@mockupi"
    assert refund.receiver_vpa == "alice@mockupi"

    # Scenario 5: FAILED_TRANSACTION
    failed = adapter.get_transaction("UPI-TXN-FAIL-001")
    assert failed is not None
    assert failed.status == UPIStatus.FAILED
    assert failed.metadata.get("failure_code") == "DECLINED_BY_BANK"


# ---------------------------------------------------------------------------
# Test 15: Source Metadata Preservation
# ---------------------------------------------------------------------------
def test_15_source_metadata():
    adapter = MockUPIAdapter()
    tx = adapter.get_transaction("UPI-TXN-P2P-001")
    assert tx.source == "mock_upi"
    assert tx.rail == "upi"
    assert tx.metadata.get("provider") == "mock"
    assert tx.metadata.get("environment") == "development"


# ---------------------------------------------------------------------------
# Test 16: Graph-Compatible Conversion
# ---------------------------------------------------------------------------
def test_16_graph_compatible_conversion():
    adapter = MockUPIAdapter()
    tx = adapter.get_transaction("UPI-TXN-P2M-001")
    graph_rep = tx.to_graph_representation()

    assert graph_rep["source_node"] == "alice@mockupi"
    assert graph_rep["target_node"] == "merchant.demo@mockupi"
    assert graph_rep["source_entity_type"] == UPIEntityType.UPI_VPA
    assert graph_rep["target_entity_type"] == UPIEntityType.MERCHANT
    assert graph_rep["edge_data"]["amount"] == 850.0
    assert graph_rep["edge_data"]["currency"] == "INR"
    assert graph_rep["edge_data"]["rail"] == "upi"


# ---------------------------------------------------------------------------
# Test 17: Sensitive Credential Rejection
# ---------------------------------------------------------------------------
def test_17_sensitive_credential_rejection():
    # Attempting to ingest UPI PIN
    with pytest.raises(ValueError, match="Sensitive authentication credential"):
        UPITransactionNormalizer.normalize({
            "transaction_id": "TXN-SEC-01",
            "sender_vpa": "a@mock",
            "receiver_vpa": "b@mock",
            "amount": "100.00",
            "upi_pin": "123456",
        })

    # Attempting to ingest OTP in metadata
    with pytest.raises(ValueError, match="Sensitive credential"):
        UPITransactionNormalizer.normalize({
            "transaction_id": "TXN-SEC-02",
            "sender_vpa": "a@mock",
            "receiver_vpa": "b@mock",
            "amount": "100.00",
            "metadata": {"otp": "654321"},
        })


# ---------------------------------------------------------------------------
# Test 18: Adapter Selection Factory
# ---------------------------------------------------------------------------
def test_18_adapter_selection():
    adapter = get_upi_adapter("mock")
    assert isinstance(adapter, MockUPIAdapter)
    assert adapter.data_source == "mock_upi"


# ---------------------------------------------------------------------------
# Test 19: Live Provider Configuration Fails Clearly
# ---------------------------------------------------------------------------
def test_19_live_provider_configuration_fails_clearly():
    with pytest.raises(ValueError, match="Live UPI connectivity is not authorized"):
        get_upi_adapter("live")

    with pytest.raises(ValueError, match="Unsupported UPI data source"):
        get_upi_adapter("unsupported_rail")


# ---------------------------------------------------------------------------
# Test 20: Crypto Pipeline Remains Completely Unaffected
# ---------------------------------------------------------------------------
def test_20_crypto_pipeline_remains_unaffected():
    """Verify CommonTransaction bridge and that CASE-2026-001 crypto analysis executes identically."""
    # 1. Test CommonTransaction bridge to FinancialEvent
    crypto_tx = CommonTransaction(
        transaction_hash="0xabcdef123456",
        blockchain="ethereum",
        timestamp="2026-09-28T00:00:00Z",
        from_address="0x1111111111111111111111111111111111111111",
        to_address="0x2222222222222222222222222222222222222222",
        amount=2.5,
        asset="ETH",
    )
    fin_event = crypto_tx.to_financial_event()
    assert isinstance(fin_event, FinancialEvent)
    assert fin_event.rail == FinancialRail.CRYPTO
    assert fin_event.amount == Decimal("2.5")
    assert fin_event.currency == "ETH"

    # 2. Execute deterministic crypto investigation
    service = AnalysisService()
    req = AnalyzeWalletRequest(case_id="CASE-2026-001", wallet_address="A", max_hops=3)
    res = service.analyze_wallet(req)

    # Validate exact preserved SIH demo expectations
    assert res.wallet == "a"
    assert res.nearest_vasp is not None
    assert res.nearest_vasp.name == "Example Exchange"
    assert res.nearest_vasp.distance == 3
    assert res.risk.level == "MEDIUM"
    assert res.risk.score == 60.0
    assert len(res.evidence) > 0
