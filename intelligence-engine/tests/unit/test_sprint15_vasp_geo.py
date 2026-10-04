import pytest
from fastapi import HTTPException
from app.api.routes.analysis import (
    analyze_case_vasp,
    analyze_case_geospatial,
    CaseVaspAnalyzeRequest,
    CaseGeospatialAnalyzeRequest,
)


def test_vasp_analyze_empty_transactions():
    req = CaseVaspAnalyzeRequest(
        case_id="CASE-2026-TEST-VASP",
        subject="0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        transactions=[]
    )
    res = analyze_case_vasp(req)
    assert res["case_id"] == "CASE-2026-TEST-VASP"
    assert res["candidates"] == []
    assert res["summary"]["candidate_count"] == 0
    assert res["metadata"]["data_source"] == "DEMO / SYNTHETIC DATA"


def test_vasp_analyze_with_blockchain_candidate():
    req = CaseVaspAnalyzeRequest(
        case_id="CASE-2026-TEST-VASP",
        subject="0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        max_hops=3,
        transactions=[
            {
                "transaction_hash": "0xhash01",
                "from_address": "0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
                "to_address": "0xEXCHANGE_DEPOSIT",
                "blockchain": "ethereum",
                "amount": 25.5,
                "asset": "ETH",
                "timestamp": "2026-10-04T12:00:00Z"
            }
        ]
    )
    res = analyze_case_vasp(req)
    assert res["case_id"] == "CASE-2026-TEST-VASP"
    assert len(res["candidates"]) >= 1
    cand = res["candidates"][0]
    assert cand["name"] == "Example Exchange"
    assert cand["hop_distance"] == 1
    assert cand["association_confidence"] >= 0.7
    assert cand["indicators"][0]["observed_or_derived"] == "DERIVED"
    assert "disclaimer" in cand


def test_vasp_analyze_ignores_upi_transactions():
    req = CaseVaspAnalyzeRequest(
        case_id="CASE-2026-TEST-VASP",
        subject="0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        transactions=[
            {
                "transaction_hash": "UTR999999",
                "from_address": "user@okaxis",
                "to_address": "merchant@icici",
                "blockchain": "upi",
                "amount": 5000.0,
                "asset": "INR"
            }
        ]
    )
    res = analyze_case_vasp(req)
    # Since only UPI was passed, blockchain txs is empty
    assert len(res["candidates"]) == 0
    assert res["summary"]["blockchain_transaction_count"] == 0


def test_vasp_analyze_rejects_credentials():
    req = CaseVaspAnalyzeRequest(
        case_id="CASE-2026-TEST-VASP",
        subject="0x71F9A6809403dE4B07B4f114B5C1089b0A124982",
        transactions=[
            {
                "transaction_hash": "0xhash01",
                "private_key": "secret",
                "from_address": "0x111",
                "to_address": "0x222"
            }
        ]
    )
    with pytest.raises(HTTPException) as exc_info:
        analyze_case_vasp(req)
    assert exc_info.value.status_code == 400


def test_geospatial_analyze_empty_signals():
    req = CaseGeospatialAnalyzeRequest(
        case_id="CASE-2026-TEST-GEO",
        subject="vpa@bank",
        location_signals=[]
    )
    res = analyze_case_geospatial(req)
    assert res["case_id"] == "CASE-2026-TEST-GEO"
    assert res["findings"] == []
    assert res["location_signals"] == []
    assert res["metadata"]["data_source"] == "DEMO / SYNTHETIC DATA"


def test_geospatial_analyze_location_inconsistency():
    req = CaseGeospatialAnalyzeRequest(
        case_id="CASE-2026-TEST-GEO",
        subject="vpa@bank",
        location_signals=[
            {
                "source_reference": "GEO-SIG-001",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "timestamp": "2026-10-04T12:00:00Z",
                "city": "Bengaluru",
                "source": "DEMO / SYNTHETIC"
            },
            {
                "source_reference": "GEO-SIG-002",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "timestamp": "2026-10-04T12:03:00Z",  # 3 minutes later, ~840 km distance -> impossible speed
                "city": "Mumbai",
                "source": "DEMO / SYNTHETIC"
            }
        ]
    )
    res = analyze_case_geospatial(req)
    assert res["case_id"] == "CASE-2026-TEST-GEO"
    assert len(res["location_signals"]) == 2
    assert res["location_signals"][0]["observed_or_derived"] == "OBSERVED"
    assert len(res["findings"]) >= 1
    f = res["findings"][0]
    assert f["observed_or_derived"] == "DERIVED"
    assert "INCONSISTENCY" in f["type"] or "INCONSISTENCY" in f["signal_type"]


def test_geospatial_analyze_rejects_credentials():
    req = CaseGeospatialAnalyzeRequest(
        case_id="CASE-2026-TEST-GEO",
        subject="vpa@bank",
        location_signals=[
            {
                "latitude": 12.9716,
                "longitude": 77.5946,
                "upi_pin": "1234"
            }
        ]
    )
    with pytest.raises(HTTPException) as exc_info:
        analyze_case_geospatial(req)
    assert exc_info.value.status_code == 400
