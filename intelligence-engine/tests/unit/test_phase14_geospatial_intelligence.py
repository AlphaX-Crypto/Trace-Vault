from decimal import Decimal
import math
import pytest
from fastapi import HTTPException

from app.api.routes.upi import (
    GeospatialAnalyzeRequest,
    analyze_geospatial_signals,
)
from app.geospatial import (
    ALL_GEO_RULES,
    GeoRuleConfig,
    GeospatialAnalysisResult,
    GeospatialFeatureExtractor,
    GeospatialFeatures,
    GeospatialFinding,
    GeospatialIntelligenceEngine,
    GeospatialSignalType,
    ImpossibleTravelRule,
    LocationInconsistencyRule,
    LocationNormalizer,
    LocationSignal,
    LowLocationConfidenceRule,
    RapidLocationChangeRule,
    UnusualLocationRule,
    get_geo_scenario,
    haversine_distance_km,
    travel_speed_kmh,
)
from app.models.analysis import AnalyzeWalletRequest, EvidenceItem, RiskResult
from app.services.analysis_service import AnalysisService
from app.upi.intelligence import UPIFraudIntelligenceEngine
from app.upi import UPITransactionNormalizer


@pytest.fixture
def engine():
    return GeospatialIntelligenceEngine()


# =========================================================================
# 1. Coordinate Validation & Normalization Tests
# =========================================================================

def test_coordinate_validation_valid():
    sig = LocationNormalizer.normalize({
        "latitude": 12.9716,
        "longitude": 77.5946,
        "accuracy_meters": 25.0,
        "timestamp": "2026-09-28T10:00:00Z",
        "city": "Bengaluru",
    })
    assert sig.latitude == 12.9716
    assert sig.longitude == 77.5946
    assert sig.has_coordinates is True
    assert sig.city == "Bengaluru"


def test_invalid_latitude_rejected():
    with pytest.raises(ValueError) as exc:
        LocationNormalizer.normalize({"latitude": 999.0, "longitude": 77.5946})
    assert "Latitude out of bounds" in str(exc.value)

    with pytest.raises(ValueError) as exc2:
        LocationNormalizer.normalize({"latitude": -95.0, "longitude": 77.5946})
    assert "Latitude out of bounds" in str(exc2.value)


def test_invalid_longitude_rejected():
    with pytest.raises(ValueError) as exc:
        LocationNormalizer.normalize({"latitude": 12.9716, "longitude": 999.0})
    assert "Longitude out of bounds" in str(exc.value)

    with pytest.raises(ValueError) as exc2:
        LocationNormalizer.normalize({"latitude": 12.9716, "longitude": -185.0})
    assert "Longitude out of bounds" in str(exc2.value)


def test_nan_infinity_coordinates_rejected():
    with pytest.raises(ValueError):
        LocationNormalizer.normalize({"latitude": float("nan"), "longitude": 77.5946})

    with pytest.raises(ValueError):
        LocationNormalizer.normalize({"latitude": 12.9716, "longitude": float("inf")})


def test_missing_coordinates_handled_safely():
    sig = LocationNormalizer.normalize({"city": "Bengaluru", "source": "synthetic"})
    assert sig.latitude is None
    assert sig.longitude is None
    assert sig.has_coordinates is False
    # Never replaces with 0, 0
    assert sig.latitude != 0.0
    assert sig.longitude != 0.0


# =========================================================================
# 2. Haversine Distance & Travel Speed Tests
# =========================================================================

def test_haversine_distance_known_pairs():
    # Same point distance must be 0.0
    d_same = haversine_distance_km(12.9716, 77.5946, 12.9716, 77.5946)
    assert d_same == 0.0

    # Bengaluru (12.9716, 77.5946) to Mumbai (19.0760, 72.8777) ~ 840 km
    d_blr_bom = haversine_distance_km(12.9716, 77.5946, 19.0760, 72.8777)
    assert 830.0 <= d_blr_bom <= 860.0

    # Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777) ~ 1145-1160 km
    d_del_bom = haversine_distance_km(28.6139, 77.2090, 19.0760, 72.8777)
    assert 1130.0 <= d_del_bom <= 1180.0


def test_travel_speed_calculation():
    # 500 km in 3600 seconds (1 hour) = 500 km/h
    speed = travel_speed_kmh(500.0, 3600.0)
    assert speed == 500.0

    # 840 km in 1200 seconds (20 minutes) = 2520 km/h
    speed_fast = travel_speed_kmh(840.0, 1200.0)
    assert speed_fast == 2520.0


def test_travel_speed_zero_time_handling():
    # Zero or negative time delta must return None (no division by zero)
    assert travel_speed_kmh(100.0, 0.0) is None
    assert travel_speed_kmh(100.0, -10.0) is None


# =========================================================================
# 3. Individual Geospatial Anomaly Rules Tests
# =========================================================================

def test_rule_impossible_travel_trigger():
    rule = ImpossibleTravelRule()
    locs = [
        LocationNormalizer.normalize({
            "transaction_id": "T1",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "timestamp": "2026-09-28T10:00:00Z",
            "city": "Bengaluru",
        }),
        LocationNormalizer.normalize({
            "transaction_id": "T2",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "timestamp": "2026-09-28T10:20:00Z",
            "city": "Mumbai",
        }),
    ]
    features = GeospatialFeatureExtractor.extract(locs, None, "user@mockupi")
    finding = rule.evaluate(features, "user@mockupi", GeoRuleConfig())
    assert finding is not None
    assert finding.signal_type == GeospatialSignalType.IMPOSSIBLE_TRAVEL_SEQUENCE
    assert finding.risk_contribution == 25.0
    assert finding.severity == "CRITICAL"


def test_rule_rapid_location_change_trigger():
    rule = RapidLocationChangeRule()
    locs = [
        LocationNormalizer.normalize({
            "transaction_id": "T1",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "timestamp": "2026-09-28T10:00:00Z",
        }),
        LocationNormalizer.normalize({
            "transaction_id": "T2",
            "latitude": 15.0000,
            "longitude": 77.5946,  # ~225 km north
            "timestamp": "2026-09-28T10:25:00Z",  # 25 min (<= 30 min window)
        }),
    ]
    features = GeospatialFeatureExtractor.extract(locs, None, "user@mockupi")
    finding = rule.evaluate(features, "user@mockupi", GeoRuleConfig())
    assert finding is not None
    assert finding.signal_type == GeospatialSignalType.RAPID_LOCATION_CHANGE
    assert finding.risk_contribution == 15.0


def test_rule_unusual_location_with_baseline():
    rule = UnusualLocationRule()
    current = [
        LocationNormalizer.normalize({
            "transaction_id": "T1",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "city": "Chennai",
            "timestamp": "2026-09-28T10:00:00Z",
        })
    ]
    baseline = [
        LocationNormalizer.normalize({
            "transaction_id": "B1",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "city": "Delhi",
            "timestamp": "2026-09-20T10:00:00Z",
        })
    ]
    features = GeospatialFeatureExtractor.extract(current, baseline, "user@mockupi")
    finding = rule.evaluate(features, "user@mockupi", GeoRuleConfig())
    assert finding is not None
    assert finding.signal_type == GeospatialSignalType.UNUSUAL_LOCATION
    assert finding.risk_contribution == 15.0
    assert features.baseline_distance_km is not None
    assert features.baseline_distance_km > 1500.0


def test_rule_unusual_location_without_baseline():
    rule = UnusualLocationRule()
    current = [
        LocationNormalizer.normalize({
            "transaction_id": "T1",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "city": "Chennai",
            "timestamp": "2026-09-28T10:00:00Z",
        })
    ]
    features = GeospatialFeatureExtractor.extract(current, None, "user@mockupi")
    finding = rule.evaluate(features, "user@mockupi", GeoRuleConfig())
    assert finding is None


def test_rule_location_inconsistency_trigger():
    rule = LocationInconsistencyRule()
    locs = [
        LocationNormalizer.normalize({
            "transaction_id": "T1",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "city": "Bengaluru",
            "timestamp": "2026-09-28T10:00:00Z",
        }),
        LocationNormalizer.normalize({
            "transaction_id": "T2",
            "latitude": 13.6288,
            "longitude": 79.4192,
            "city": "Tirupati",  # ~210 km away in 5 minutes
            "timestamp": "2026-09-28T10:05:00Z",
        }),
    ]
    features = GeospatialFeatureExtractor.extract(locs, None, "user@mockupi")
    finding = rule.evaluate(features, "user@mockupi", GeoRuleConfig())
    assert finding is not None
    assert finding.signal_type == GeospatialSignalType.LOCATION_INCONSISTENCY
    assert finding.risk_contribution == 20.0


def test_rule_low_location_confidence_advisory():
    rule = LowLocationConfidenceRule()
    locs = [
        LocationNormalizer.normalize({
            "transaction_id": "T1",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "accuracy_meters": 10000.0,
            "timestamp": "2026-09-28T10:00:00Z",
        }),
    ]
    features = GeospatialFeatureExtractor.extract(locs, None, "user@mockupi")
    finding = rule.evaluate(features, "user@mockupi", GeoRuleConfig())
    assert finding is not None
    assert finding.signal_type == GeospatialSignalType.LOW_LOCATION_CONFIDENCE
    # Advisory signal: 0 risk contribution
    assert finding.risk_contribution == 0.0


# =========================================================================
# 4. Edge Cases: Low Data, Missing Data, Normal Control Case
# =========================================================================

def test_missing_location_data_no_false_alert(engine):
    scenario = get_geo_scenario("GEO-DEMO-006")
    result = engine.analyze(
        subject=scenario["subject"],
        locations=scenario["locations"],
    )
    assert result.features.insufficient_location_data is True
    assert result.risk.score == 0.0
    assert result.risk.level == "LOW"
    assert len(result.findings) == 0


def test_single_location_observation(engine):
    locs = [
        {"transaction_id": "T1", "latitude": 12.9716, "longitude": 77.5946, "timestamp": "2026-09-28T10:00:00Z"}
    ]
    result = engine.analyze(subject="solo@mockupi", locations=locs)
    assert result.features.insufficient_location_data is True
    assert result.risk.score == 0.0
    assert result.risk.level == "LOW"


def test_missing_timestamp_handling(engine):
    locs = [
        {"transaction_id": "T1", "latitude": 12.9716, "longitude": 77.5946},
        {"transaction_id": "T2", "latitude": 19.0760, "longitude": 72.8777},
    ]
    result = engine.analyze(subject="notime@mockupi", locations=locs)
    # Distance is calculated but speed cannot be calculated without timestamps
    assert result.features.max_distance_km > 800.0
    assert result.features.max_speed_kmh == 0.0
    # Impossible travel requires speed calculation, so it should not fabricate an impossible travel finding
    finding_types = [f.signal_type for f in result.findings]
    assert GeospatialSignalType.IMPOSSIBLE_TRAVEL_SEQUENCE not in finding_types


def test_normal_control_case(engine):
    scenario = get_geo_scenario("GEO-DEMO-CONTROL")
    result = engine.analyze(
        subject=scenario["subject"],
        locations=scenario["locations"],
    )
    assert result.risk.score == 0.0
    assert result.risk.level == "LOW"
    assert len(result.findings) == 0
    assert result.features.insufficient_location_data is False
    assert result.confidence >= 80.0


# =========================================================================
# 5. Synthetic Scenarios Verification (GEO-DEMO-001 to 008)
# =========================================================================

def test_geo_demo_001_same_city(engine):
    scenario = get_geo_scenario("GEO-DEMO-001")
    result = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])
    assert result.risk.score == 0.0
    assert result.risk.level == "LOW"


def test_geo_demo_002_plausible_travel(engine):
    scenario = get_geo_scenario("GEO-DEMO-002")
    result = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])
    assert result.risk.score == 0.0
    assert result.risk.level == "LOW"


def test_geo_demo_003_impossible_travel(engine):
    scenario = get_geo_scenario("GEO-DEMO-003")
    result = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])
    finding_types = [f.signal_type for f in result.findings]
    assert GeospatialSignalType.IMPOSSIBLE_TRAVEL_SEQUENCE in finding_types
    assert result.risk.score >= 25.0


def test_geo_demo_004_unusual_location(engine):
    scenario = get_geo_scenario("GEO-DEMO-004")
    result = engine.analyze(
        subject=scenario["subject"],
        locations=scenario["locations"],
        baseline_locations=scenario["baseline_locations"],
    )
    finding_types = [f.signal_type for f in result.findings]
    assert GeospatialSignalType.UNUSUAL_LOCATION in finding_types
    assert result.risk.score >= 15.0


def test_geo_demo_005_low_accuracy(engine):
    scenario = get_geo_scenario("GEO-DEMO-005")
    result = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])
    finding_types = [f.signal_type for f in result.findings]
    assert GeospatialSignalType.LOW_LOCATION_CONFIDENCE in finding_types
    assert result.risk.score == 0.0  # Advisory only


def test_geo_demo_007_invalid_coordinates():
    scenario = get_geo_scenario("GEO-DEMO-007")
    with pytest.raises(ValueError):
        LocationNormalizer.normalize(scenario["locations"][0])


def test_geo_demo_008_combined_upi_and_geospatial(engine):
    # Phase 13 UPI analysis result simulation
    scenario = get_geo_scenario("GEO-DEMO-008")
    upi_engine = UPIFraudIntelligenceEngine()
    rapid_upi_txs = [
        UPITransactionNormalizer.normalize({
            "transaction_id": f"UPI-GEO-{i}",
            "timestamp": f"2026-09-28T10:00:{i*10:02d}Z",
            "amount": "1000.00",
            "sender_vpa": "vikas@mockupi",
            "receiver_vpa": "peer@mockupi",
        })
        for i in range(5)
    ]
    upi_res = upi_engine.analyze(subject="vikas@mockupi", transactions=rapid_upi_txs)

    geo_res = engine.analyze(
        subject=scenario["subject"],
        locations=scenario["locations"],
        upi_result=upi_res,
    )
    assert geo_res.risk.score >= 40.0
    signal_types = {s.signal_type for s in geo_res.risk.signals}
    assert GeospatialSignalType.IMPOSSIBLE_TRAVEL_SEQUENCE in signal_types
    assert "HIGH_TRANSACTION_VELOCITY" in signal_types


# =========================================================================
# 6. Engine Determinism, Evidence & Reasoning Trace
# =========================================================================

def test_engine_determinism_repeatability(engine):
    scenario = get_geo_scenario("GEO-DEMO-003")
    res1 = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])
    res2 = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])

    assert res1.risk.score == res2.risk.score
    assert res1.confidence == res2.confidence
    assert [f.signal_id for f in res1.findings] == [f.signal_id for f in res2.findings]
    assert res1.reasoning_trace == res2.reasoning_trace


def test_engine_14_step_reasoning_trace(engine):
    scenario = get_geo_scenario("GEO-DEMO-003")
    res = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])
    assert len(res.reasoning_trace) == 14
    for i in range(1, 15):
        assert any(f"Step {i}:" in step for step in res.reasoning_trace), f"Missing Step {i}"


def test_engine_evidence_synthesis(engine):
    scenario = get_geo_scenario("GEO-DEMO-003")
    res = engine.analyze(subject=scenario["subject"], locations=scenario["locations"])
    assert len(res.evidence) == len(res.findings)
    for ev in res.evidence:
        assert isinstance(ev, EvidenceItem)
        assert ev.type == "GEOSPATIAL_SIGNAL"
        assert ev.source == "geospatial_anomaly_engine"
        assert "Potential geographic inconsistency detected" in ev.description


# =========================================================================
# 7. API Route Tests
# =========================================================================

def test_api_geospatial_analyze_with_scenario():
    req = GeospatialAnalyzeRequest(scenario="GEO-DEMO-003")
    data = analyze_geospatial_signals(req)
    assert data["subject"] == "suresh@mockupi"
    assert data["risk"]["score"] >= 25.0
    assert len(data["reasoning_trace"]) == 14
    assert len(data["evidence"]) >= 1


def test_api_geospatial_analyze_with_payload():
    req = GeospatialAnalyzeRequest(
        subject="api_user@mockupi",
        locations=[
            {"transaction_id": "T1", "latitude": 12.9716, "longitude": 77.5946, "city": "Bengaluru", "timestamp": "2026-09-28T10:00:00Z"},
            {"transaction_id": "T2", "latitude": 12.9750, "longitude": 77.5980, "city": "Bengaluru", "timestamp": "2026-09-28T10:30:00Z"},
        ]
    )
    data = analyze_geospatial_signals(req)
    assert data["subject"] == "api_user@mockupi"
    assert data["risk"]["score"] == 0.0
    assert data["risk"]["level"] == "LOW"


def test_api_geospatial_analyze_rejects_credentials():
    req = GeospatialAnalyzeRequest(
        subject="leak@mockupi",
        locations=[
            {
                "transaction_id": "T1",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "upi_pin": "123456",  # Sensitive credential!
            }
        ]
    )
    with pytest.raises(HTTPException) as exc_info:
        analyze_geospatial_signals(req)
    assert exc_info.value.status_code == 400
    assert "Sensitive credential" in exc_info.value.detail


def test_api_geospatial_analyze_rejects_invalid_coordinates():
    req = GeospatialAnalyzeRequest(
        subject="badcoord@mockupi",
        locations=[
            {"transaction_id": "T1", "latitude": 120.0, "longitude": 77.5946}
        ]
    )
    with pytest.raises(HTTPException) as exc_info:
        analyze_geospatial_signals(req)
    assert exc_info.value.status_code == 400
    assert "Latitude out of bounds" in exc_info.value.detail


# =========================================================================
# 8. Regression Testing: Crypto Pipeline Must Remain 100% Untouched
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
