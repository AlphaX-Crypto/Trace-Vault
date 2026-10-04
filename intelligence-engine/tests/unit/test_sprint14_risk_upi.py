from decimal import Decimal
import pytest
from fastapi import HTTPException

from app.api.routes.analysis import (
    analyze_case_risk,
    analyze_case_upi,
    CaseRiskAnalyzeRequest,
    CaseUPIAnalyzeRequest,
)
from app.upi.models import UPITransaction, UPITransactionType, UPIStatus
from app.upi.normalizer import UPITransactionNormalizer


def test_risk_analysis_empty_transactions():
    req = CaseRiskAnalyzeRequest(
        case_id="CASE-TEST-001",
        subject="0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        transactions=[]
    )
    data = analyze_case_risk(req)
    assert data["case_id"] == "CASE-TEST-001"
    assert data["overall_score"] == 0.0
    assert data["risk_level"] == "LOW"
    assert data["signals"] == []
    assert data["summary"]["signal_count"] == 0
    assert data["summary"]["transaction_count"] == 0


def test_risk_analysis_with_transactions():
    req = CaseRiskAnalyzeRequest(
        case_id="CASE-TEST-002",
        subject="0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        transactions=[
            {
                "transaction_hash": "0xhash1",
                "from_address": "0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
                "to_address": "0x84C2EF17BD0038Fe942dF4426511aF890987e109",
                "amount": 42.5,
                "asset": "ETH",
                "blockchain": "ethereum",
                "timestamp": "2026-09-29T08:14:00Z"
            },
            {
                "transaction_hash": "0xhash2",
                "from_address": "0x84C2EF17BD0038Fe942dF4426511aF890987e109",
                "to_address": "0x6D11A04913k8912E813C",
                "amount": 42.4,
                "asset": "ETH",
                "blockchain": "ethereum",
                "timestamp": "2026-09-29T08:16:00Z"
            }
        ]
    )
    data = analyze_case_risk(req)
    assert data["case_id"] == "CASE-TEST-002"
    assert data["overall_score"] >= 10.0
    assert data["summary"]["transaction_count"] == 2
    assert len(data["signals"]) > 0

    # Verify explainable contract fields
    for sig in data["signals"]:
        assert "id" in sig
        assert "name" in sig
        assert "score_contribution" in sig
        assert "severity" in sig
        assert "description" in sig
        assert "supporting_transaction_ids" in sig
        assert sig["observed_or_derived"] == "DERIVED"


def test_risk_analysis_rejects_prohibited_credentials():
    req = CaseRiskAnalyzeRequest(
        case_id="CASE-TEST-003",
        subject="0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        transactions=[
            {
                "transaction_hash": "0xhash1",
                "from_address": "0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
                "to_address": "0x84C2EF17BD0038Fe942dF4426511aF890987e109",
                "amount": 10.0,
                "private_key": "0xdeadbeef123456"
            }
        ]
    )
    with pytest.raises(HTTPException) as exc_info:
        analyze_case_risk(req)
    assert exc_info.value.status_code == 400
    assert "Sensitive authentication credential" in exc_info.value.detail


def test_upi_analysis_empty_transactions():
    req = CaseUPIAnalyzeRequest(
        case_id="CASE-UPI-001",
        subject_vpa="vpa98@okhdfcbank",
        transactions=[]
    )
    data = analyze_case_upi(req)
    assert data["case_id"] == "CASE-UPI-001"
    assert data["risk_score"] == 0.0
    assert data["risk_level"] == "LOW"
    assert data["findings"] == []
    assert data["summary"]["upi_transaction_count"] == 0
    assert data["summary"]["finding_count"] == 0


def test_upi_analysis_rapid_pass_through_pattern():
    req = CaseUPIAnalyzeRequest(
        case_id="CASE-UPI-002",
        subject_vpa="vpa98@okhdfcbank",
        transactions=[
            {
                "id": "UTR20260929001",
                "from_address": "sender1@icici",
                "to_address": "vpa98@okhdfcbank",
                "amount": 50000.0,
                "asset": "INR",
                "timestamp": "2026-09-29T08:30:00Z",
                "transaction_type": "P2P"
            },
            {
                "id": "UTR20260929002",
                "from_address": "vpa98@okhdfcbank",
                "to_address": "receiver1@paytm",
                "amount": 48000.0,
                "asset": "INR",
                "timestamp": "2026-09-29T08:32:00Z",
                "transaction_type": "P2P"
            }
        ]
    )
    data = analyze_case_upi(req)
    assert data["case_id"] == "CASE-UPI-002"
    assert data["subject_vpa"] == "vpa98@okhdfcbank"
    assert data["summary"]["upi_transaction_count"] == 2
    assert len(data["findings"]) > 0

    # Ensure findings conform to contract
    pass_through_found = False
    for f in data["findings"]:
        assert "rule_id" in f
        assert "name" in f
        assert "severity" in f
        assert "score_contribution" in f
        assert "description" in f
        assert "supporting_transaction_ids" in f
        assert f["observed_or_derived"] == "DERIVED"
        if f["signal_type"] == "RAPID_PASS_THROUGH":
            pass_through_found = True

    assert pass_through_found is True


def test_upi_analysis_rejects_prohibited_credentials():
    req = CaseUPIAnalyzeRequest(
        case_id="CASE-UPI-003",
        subject_vpa="vpa98@okhdfcbank",
        transactions=[
            {
                "id": "UTR20260929003",
                "from_address": "vpa98@okhdfcbank",
                "to_address": "merchant@hdfc",
                "amount": 1000.0,
                "upi_pin": "1234"
            }
        ]
    )
    with pytest.raises(HTTPException) as exc_info:
        analyze_case_upi(req)
    assert exc_info.value.status_code == 400
    assert "Sensitive authentication credential" in exc_info.value.detail


def test_upi_identity_works_without_blockchain_hash():
    # Verify UPI transactions identify by UTR/ID, not 0x hex hash
    raw_payload = {
        "transaction_id": "UTR-AXIS-918204910291",
        "sender_vpa": "ramesh@axisbank",
        "receiver_vpa": "suresh@oksbi",
        "amount": "1500.00",
        "currency": "INR",
        "status": "SUCCESS"
    }
    tx = UPITransactionNormalizer.normalize(raw_payload)
    assert tx.transaction_id == "UTR-AXIS-918204910291"
    assert not tx.transaction_id.startswith("0x")
    assert tx.sender_vpa == "ramesh@axisbank"
    assert tx.receiver_vpa == "suresh@oksbi"
