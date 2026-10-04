from typing import Any, Dict, List

# Standard Indian city reference coordinates:
# Bengaluru: 12.9716, 77.5946
# Mumbai: 19.0760, 72.8777
# Delhi: 28.6139, 77.2090
# Chennai: 13.0827, 80.2707

SYNTHETIC_GEO_SCENARIOS: Dict[str, Dict[str, Any]] = {
    # GEO-DEMO-001: Normal same-city activity (Bengaluru)
    "GEO-DEMO-001": {
        "subject": "rohit@mockupi",
        "description": "Consistent movement across standard intra-city locations in Bengaluru over 75 minutes.",
        "locations": [
            {
                "transaction_id": "GEO-TXN-101",
                "timestamp": "2026-09-28T10:00:00Z",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "city": "Bengaluru",
                "accuracy_meters": 30.0,
                "source": "synthetic",
            },
            {
                "transaction_id": "GEO-TXN-102",
                "timestamp": "2026-09-28T10:30:00Z",
                "latitude": 12.9784,
                "longitude": 77.6408,
                "city": "Bengaluru",
                "accuracy_meters": 25.0,
                "source": "synthetic",
            },
            {
                "transaction_id": "GEO-TXN-103",
                "timestamp": "2026-09-28T11:15:00Z",
                "latitude": 12.9698,
                "longitude": 77.7500,
                "city": "Bengaluru",
                "accuracy_meters": 20.0,
                "source": "synthetic",
            },
        ],
        "baseline_locations": [],
    },

    # GEO-DEMO-002: Large distance over reasonable time (Bengaluru to Mumbai in 8 hours)
    "GEO-DEMO-002": {
        "subject": "kavita@mockupi",
        "description": "Inter-city travel from Bengaluru to Mumbai spanning 8 hours (realistic domestic flight or transit).",
        "locations": [
            {
                "transaction_id": "GEO-TXN-201",
                "timestamp": "2026-09-28T06:00:00Z",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "city": "Bengaluru",
                "accuracy_meters": 50.0,
                "source": "synthetic",
            },
            {
                "transaction_id": "GEO-TXN-202",
                "timestamp": "2026-09-28T14:00:00Z",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "city": "Mumbai",
                "accuracy_meters": 50.0,
                "source": "synthetic",
            },
        ],
        "baseline_locations": [],
    },

    # GEO-DEMO-003: Impossible travel sequence (Bengaluru to Mumbai in 20 minutes)
    "GEO-DEMO-003": {
        "subject": "suresh@mockupi",
        "description": "Bengaluru to Mumbai (~840 km) recorded within 20 minutes (implied speed ~2520 km/h).",
        "locations": [
            {
                "transaction_id": "GEO-TXN-301",
                "timestamp": "2026-09-28T10:00:00Z",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "city": "Bengaluru",
                "accuracy_meters": 35.0,
                "source": "authorized_device_metadata",
            },
            {
                "transaction_id": "GEO-TXN-302",
                "timestamp": "2026-09-28T10:20:00Z",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "city": "Mumbai",
                "accuracy_meters": 40.0,
                "source": "authorized_device_metadata",
            },
        ],
        "baseline_locations": [],
    },

    # GEO-DEMO-004: Unusual location relative to historical baseline (Delhi baseline vs Chennai current)
    "GEO-DEMO-004": {
        "subject": "pooja@mockupi",
        "description": "Transaction observed in Chennai (>1700 km) contrasting with established Delhi baseline history.",
        "locations": [
            {
                "transaction_id": "GEO-TXN-401",
                "timestamp": "2026-09-28T12:00:00Z",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "city": "Chennai",
                "accuracy_meters": 45.0,
                "source": "synthetic",
            },
        ],
        "baseline_locations": [
            {
                "transaction_id": "GEO-BASE-401",
                "timestamp": "2026-09-20T10:00:00Z",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "city": "Delhi",
                "accuracy_meters": 50.0,
                "source": "authorized_bank_metadata",
            },
            {
                "transaction_id": "GEO-BASE-402",
                "timestamp": "2026-09-21T11:00:00Z",
                "latitude": 28.6200,
                "longitude": 77.2100,
                "city": "Delhi",
                "accuracy_meters": 50.0,
                "source": "authorized_bank_metadata",
            },
        ],
    },

    # GEO-DEMO-005: Low-accuracy location (accuracy = 10,000m)
    "GEO-DEMO-005": {
        "subject": "manish@mockupi",
        "description": "Location observations with coarse precision (accuracy 10,000 meters).",
        "locations": [
            {
                "transaction_id": "GEO-TXN-501",
                "timestamp": "2026-09-28T10:00:00Z",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "city": "Bengaluru",
                "accuracy_meters": 10000.0,
                "source": "synthetic",
            },
            {
                "transaction_id": "GEO-TXN-502",
                "timestamp": "2026-09-28T10:30:00Z",
                "latitude": 12.9780,
                "longitude": 77.6000,
                "city": "Bengaluru",
                "accuracy_meters": 10000.0,
                "source": "synthetic",
            },
        ],
        "baseline_locations": [],
    },

    # GEO-DEMO-006: Missing location data (only transaction without coordinates)
    "GEO-DEMO-006": {
        "subject": "anita@mockupi",
        "description": "Transaction observation with no latitude or longitude available.",
        "locations": [
            {
                "transaction_id": "GEO-TXN-601",
                "timestamp": "2026-09-28T10:00:00Z",
                "latitude": None,
                "longitude": None,
                "city": "Unknown",
                "source": "synthetic",
            },
        ],
        "baseline_locations": [],
    },

    # GEO-DEMO-007: Invalid coordinates (lat=999, lon=999)
    "GEO-DEMO-007": {
        "subject": "invalid@mockupi",
        "description": "Malformed coordinates violating mathematical boundaries (-90 to 90).",
        "locations": [
            {
                "transaction_id": "GEO-TXN-701",
                "timestamp": "2026-09-28T10:00:00Z",
                "latitude": 999.0,
                "longitude": 999.0,
                "city": "Invalid",
                "source": "synthetic",
            },
        ],
        "baseline_locations": [],
    },

    # GEO-DEMO-008: UPI high velocity + geographic inconsistency
    "GEO-DEMO-008": {
        "subject": "vikas@mockupi",
        "description": "Combined UPI high velocity accompanied by impossible geographic relocation.",
        "locations": [
            {
                "transaction_id": "GEO-TXN-801",
                "timestamp": "2026-09-28T10:00:00Z",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "city": "Bengaluru",
                "accuracy_meters": 25.0,
                "source": "authorized_device_metadata",
            },
            {
                "transaction_id": "GEO-TXN-802",
                "timestamp": "2026-09-28T10:05:00Z",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "city": "Mumbai",
                "accuracy_meters": 25.0,
                "source": "authorized_device_metadata",
            },
        ],
        "baseline_locations": [],
    },

    # GEO-DEMO-CONTROL: Normal control case (3 consistent transactions in same city)
    "GEO-DEMO-CONTROL": {
        "subject": "control@mockupi",
        "description": "Control case: 3 consistent transactions in Bengaluru at 10:00, 10:30, and 11:00.",
        "locations": [
            {
                "transaction_id": "GEO-CTRL-01",
                "timestamp": "2026-09-28T10:00:00Z",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "city": "Bengaluru",
                "accuracy_meters": 30.0,
                "source": "authorized_bank_metadata",
            },
            {
                "transaction_id": "GEO-CTRL-02",
                "timestamp": "2026-09-28T10:30:00Z",
                "latitude": 12.9730,
                "longitude": 77.5960,
                "city": "Bengaluru",
                "accuracy_meters": 25.0,
                "source": "authorized_bank_metadata",
            },
            {
                "transaction_id": "GEO-CTRL-03",
                "timestamp": "2026-09-28T11:00:00Z",
                "latitude": 12.9750,
                "longitude": 77.5980,
                "city": "Bengaluru",
                "accuracy_meters": 20.0,
                "source": "authorized_bank_metadata",
            },
        ],
        "baseline_locations": [],
    },
}


def get_geo_scenario(scenario_id: str) -> Dict[str, Any]:
    """Retrieves synthetic scenario definition by identifier."""
    clean_id = scenario_id.strip().upper()
    if clean_id not in SYNTHETIC_GEO_SCENARIOS:
        raise ValueError(
            f"Unknown geospatial scenario '{scenario_id}'. Available scenarios: {list(SYNTHETIC_GEO_SCENARIOS.keys())}"
        )
    return SYNTHETIC_GEO_SCENARIOS[clean_id]
