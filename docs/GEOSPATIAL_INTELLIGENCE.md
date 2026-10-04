# TRACEVAULT V3 — PHASE 14: GEOSPATIAL INTELLIGENCE & LOCATION ANOMALY ENGINE

## 1. Purpose & Non-Negotiable Boundaries

Phase 14 introduces **Geospatial Intelligence** to **TRACEVAULT**. The primary objective is to analyze authorized, transaction-associated location signals and identify geographic inconsistencies, impossible physical travel sequences, and baseline deviations to serve as explainable investigative indicators.

```
┌────────────────────────────────────────────────────────┐
│                   UPI Transaction                      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              Authorized Location Signal                │
│       Synthetic, Device Sensor, Bank Terminal          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Location Normalization                 │
│      Coordinate Bounds (-90..90, -180..180) & UTC      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Geospatial Feature Extraction              │
│      Haversine Distance, Travel Velocity, Intervals    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                Location Anomaly Rules                  │
│       5 Pure Deterministic Geometric Algorithms        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Geospatial Findings                   │
│          GeospatialFinding (Signal + Metrics)          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Canonical Risk Signals                 │
│        Harmonized RiskResult & RiskSignal (0–100)      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Evidentiary Synthesis                  │
│    Canonical EvidenceItem & 14-Step Reasoning Trace    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            Explainable Investigation Result            │
│               GeospatialAnalysisResult                 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               Combined UPI + Geo Result                │
│    Merged Behavioral Velocity & Impossible Travel      │
└────────────────────────────────────────────────────────┘
```

### Core Ethical & Security Principles
- **Location is an Analytical Indicator, Not Proof**: A location signal is an observation associated with a transaction record. It is **never** definitive proof of human identity, physical presence, device possession, or criminal intent.
- **Strict Objective Framing**:
  - **NEVER Output**: *"Person was at location X"*, *"Fraud confirmed"*, *"Criminal location"*, or *"Account owner identified"*.
  - **MANDATORY Standard**: *"Transaction-associated location signal was observed near X"*, *"Available location metadata is inconsistent with the observed transaction sequence"*, or *"Transaction-associated location signals imply a travel speed inconsistent with the configured threshold"*.
- **No Covert Tracking or Surveillance**: TRACEVAULT does not perform real-time user tracking, background location harvesting, device surveillance, cell tower triangulation, or person identification.
- **No Live IP Geolocation**: IP references in metadata are treated strictly as opaque audit references. No third-party IP lookup services are queried.
- **No Automatic Account Action**: The system produces structured evidence for investigator review; it never freezes accounts or initiates automated enforcement actions.

### Implementation Scope Summary
- **IMPLEMENTED**:
  - Deterministic geospatial anomaly intelligence using supplied or synthetic transaction-associated location metadata.
  - Haversine great-circle distance calculations.
  - Pairwise transit velocity calculations with zero-time protection.
  - Pure rule-based detection algorithms.
  - Independent analytical confidence scoring.
  - Canonical TRACEVAULT `RiskResult`, `RiskSignal`, and `EvidenceItem` integration.
  - Deterministic 14-step reasoning trace.
  - 8 synthetic demonstration scenarios and a normal control case.
- **NOT IMPLEMENTED**:
  - Live GPS tracking
  - Live IP geolocation
  - Real-world identity resolution
  - Machine learning / neural networks
  - Commercial map API integrations (Google Maps / Mapbox)
  - Live banking or NPCI switch connectivity
  - Automatic fraud blocking or account freezing

---

## 2. Location Data Model (`LocationSignal`)

Defined in `app/geospatial/models.py`. Designed for data minimization and flexibility with partial signals:

```python
class LocationSignal(BaseModel):
    latitude: Optional[float] = None          # -90.0 to 90.0
    longitude: Optional[float] = None         # -180.0 to 180.0
    accuracy_meters: Optional[float] = None   # Radius in meters (>= 0.0)
    timestamp: Optional[str] = None           # UTC ISO 8601 string
    source: str = "synthetic"                 # synthetic, authorized_device_metadata, authorized_bank_metadata, investigator_supplied
    source_reference: Optional[str] = None    # Opaque identifier
    country_code: Optional[str] = None        # ISO 2-letter (e.g. "IN")
    region: Optional[str] = None              # State/province (e.g. "Karnataka")
    city: Optional[str] = None                # Locality (e.g. "Bengaluru")
    transaction_id: Optional[str] = None      # UPI or financial transaction reference
    entity_reference: Optional[str] = None    # Associated VPA or wallet
    metadata: Dict[str, Any] = {}             # Extensible metadata
```

### Prohibited Credential Sanitization
`LocationSignal` strictly rejects sensitive authentication credentials (`upi_pin`, `pin`, `password`, `otp`, `cvv`) in top-level fields or nested metadata with immediate `ValueError`.

---

## 3. Location Normalization & Validation (`LocationNormalizer`)

Located in `app/geospatial/normalizer.py`:
- **Mathematical Boundary Enforcement**:
  - Latitude: $-90.0 \le \text{lat} \le 90.0$
  - Longitude: $-180.0 \le \text{lon} \le 180.0$
  - Malformed coordinates, `NaN`, and `Infinity` are rejected with `ValueError`.
  - **No Fallback to 0,0**: Missing coordinates remain `None`. The normalizer never fabricates default coordinates.
- **Timestamp Standardization**:
  - ISO 8601 strings are normalized to standardized UTC timestamps (`YYYY-MM-DDTHH:MM:SSZ`).
  - Missing timestamps are preserved as `None` to prevent fabricated velocity calculations.
- **Accuracy Bounds**:
  - Negative accuracy radiuses are safely discarded.

---

## 4. Geometric Computations (`features.py`)

### Haversine Great-Circle Distance
Pure mathematical implementation in Python without external GIS dependencies:
$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$\text{Distance} = R \cdot c \quad (R = 6371.0\text{ km})$$

### Travel Speed & Zero-Time Protection
$$\text{Speed (km/h)} = \frac{\text{Distance (km)}}{\Delta t \text{ (hours)}}$$
- **Zero-Time Delta Guard**: When $\Delta t \le 0$, the function returns `None` rather than dividing by zero or assuming instantaneous physical presence.

---

## 5. Catalog of Geospatial Anomaly Rules (`rules.py`)

All rules inherit from `BaseGeoRule` with configurable thresholds in `GeoRuleConfig`:

| Rule Name | Signal Type | Score | Severity | Trigger Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Impossible Travel Sequence** | `IMPOSSIBLE_TRAVEL_SEQUENCE` | +25 | `CRITICAL` | Implied transit velocity $> 900\text{ km/h}$ over distance $\ge 50\text{ km}$ across consecutive timestamped transactions. |
| **Rapid Location Change** | `RAPID_LOCATION_CHANGE` | +15 | `HIGH` | Geographic displacement $\ge 200\text{ km}$ within a compressed window $\le 1800\text{ seconds}$ (30 min). |
| **Unusual Location** | `UNUSUAL_LOCATION` | +15 | `MEDIUM` | Explicit baseline exists AND observed location is $\ge 300\text{ km}$ away from established historical activity center. |
| **Sequential Inconsistency** | `LOCATION_INCONSISTENCY` | +20 | `HIGH` | Consecutive observations shift across distinct administrative cities within $\le 600\text{ seconds}$ (10 min) over $\ge 50\text{ km}$. |
| **Coarse Accuracy Precision** | `LOW_LOCATION_CONFIDENCE` | +0 | `LOW` | Location accuracy radius $> 5000\text{ m}$. **Advisory only**; never inflates risk score. |

---

## 6. Analytical Confidence vs. Risk Score

Risk score (potential severity) and analytical confidence (data reliability) are strictly separated:

1. **Source Reliability Mapping**:
   - `authorized_bank_metadata`: 0.95
   - `authorized_device_metadata`: 0.90
   - `investigator_supplied`: 0.85
   - `synthetic`: 0.75
   - `unknown`: 0.50
2. **Confidence Calculation**:
   - Insufficient location data ($< 2$ coordinate observations without baseline): **25.0%**.
   - Base confidence derived from source reliability ($75\% - 95\%$).
   - High precision ($\le 100\text{m}$ accuracy): $+5\%$.
   - Coarse precision ($> 5000\text{m}$ accuracy): $-20\%$.
   - Baseline availability: $+5\%$.
   - Clamped between $20.0\%$ and $95.0\%$.

---

## 7. Evidentiary Synthesis & Distinction of Facts

Evidentiary items (`EV-GEO-*`) clearly distinguish **Observed Facts** from **System-Derived Analysis**:

- **Observed Fact**: *"Transaction-associated location signals observed at (12.9716, 77.5946) [Bengaluru] and (19.0760, 72.8777) [Mumbai] across a 20-minute interval (840.0 km apart)."*
- **System-Derived Analysis**: *"Calculated transit speed of 2520.0 km/h exceeds the configured commercial airliner threshold (900.0 km/h), indicating potential geographic inconsistency or proxy/credential sharing. Requires contextual review."*

---

## 8. Deterministic 14-Step Reasoning Trace

Every analysis execution produces an explicit 14-step audit trace:

```text
Step 1:  Loaded {N} transaction-associated location observation(s) for subject '{subject}'
Step 2:  Validated coordinate bounds ({K} valid coordinate pair(s) identified)
Step 3:  Normalized observation timestamps into UTC chronological sequence
Step 4:  Evaluated location accuracy metadata (avg accuracy: {acc}m) and source reliability ({rel}%)
Step 5:  Evaluated baseline location profile ({M} historical observation(s) available)
Step 6:  Calculated pairwise Haversine geographic distances (max displacement: {max_d} km, total: {tot_d} km)
Step 7:  Calculated temporal intervals between consecutive location observations (total span: {span} minutes)
Step 8:  Computed implied travel velocities across observation intervals (peak speed: {speed} km/h)
Step 9:  Evaluated impossible travel sequence rules against commercial transit thresholds
Step 10: Evaluated rapid location displacement thresholds
Step 11: Evaluated location consistency across administrative city boundaries
Step 12: Evaluated deviation from historical location baseline (offset: {offset} km)
Step 13: Calculated analytical confidence score ({conf}/100: {reason})
Step 14: Synthesized {K} geospatial risk finding(s) into canonical risk score ({score}/100, level: {level}) and {K} evidence item(s)
```

---

## 9. Synthetic Scenarios Catalog

| Scenario ID | Subject | Characteristics | Expected Signals | Expected Risk |
| :--- | :--- | :--- | :--- | :--- |
| `GEO-DEMO-001` | `rohit@mockupi` | Same-city Bengaluru travel across 3 points over 75 min | *None* | `LOW` (Score: 0.0) |
| `GEO-DEMO-002` | `kavita@mockupi` | Bengaluru to Mumbai over 8 hours (realistic domestic transit) | *None* | `LOW` (Score: 0.0) |
| `GEO-DEMO-003` | `suresh@mockupi` | Bengaluru to Mumbai in 20 minutes (2520 km/h implied speed) | `IMPOSSIBLE_TRAVEL_SEQUENCE` | `LOW`/`MEDIUM` (Score: 25.0) |
| `GEO-DEMO-004` | `pooja@mockupi` | Chennai transaction contrasting with Delhi baseline (>1700 km) | `UNUSUAL_LOCATION` | `LOW`/`MEDIUM` (Score: 15.0) |
| `GEO-DEMO-005` | `manish@mockupi` | Coarse accuracy radius of 10,000m | `LOW_LOCATION_CONFIDENCE` | `LOW` (Score: 0.0, advisory) |
| `GEO-DEMO-006` | `anita@mockupi` | Missing coordinates (city-only / null coordinates) | *None* (`insufficient_location_data = True`) | `LOW` (Score: 0.0) |
| `GEO-DEMO-007` | `invalid@mockupi` | Malformed coordinates (999.0, 999.0) | *Validation Error* | *HTTP 400 Bad Request* |
| `GEO-DEMO-008` | `vikas@mockupi` | UPI high velocity + impossible travel relocation | `IMPOSSIBLE_TRAVEL_SEQUENCE`, `HIGH_TRANSACTION_VELOCITY` | `MEDIUM`/`HIGH` (Score: $\ge 40.0$) |
| `GEO-DEMO-CONTROL`| `control@mockupi`| **Control Case**: 3 consistent observations in Bengaluru | *None* | `LOW` (Score: 0.0) |

---

## 10. API Specification

### `POST /api/v1/upi/geospatial/analyze`

#### Request Body
```json
{
  "subject": "suresh@mockupi",
  "scenario": "GEO-DEMO-003",
  "locations": null,
  "baseline_locations": null,
  "config": {
    "max_travel_speed_kmh": 900.0,
    "rapid_change_distance_km": 200.0
  }
}
```

#### Response (200 OK)
```json
{
  "subject": "suresh@mockupi",
  "analyzed_signals": [...],
  "features": {
    "observation_count": 2,
    "valid_coordinate_count": 2,
    "has_coordinates": true,
    "insufficient_location_data": false,
    "max_distance_km": 841.22,
    "total_distance_km": 841.22,
    "max_speed_kmh": 2523.66,
    "avg_speed_kmh": 2523.66,
    "time_span_seconds": 1200.0,
    "source_reliability_score": 0.90,
    "distinct_cities": ["Bengaluru", "Mumbai"]
  },
  "findings": [
    {
      "signal_id": "GEO-SIG-IMPOSSIBLE-TRAVEL",
      "signal_type": "IMPOSSIBLE_TRAVEL_SEQUENCE",
      "severity": "CRITICAL",
      "confidence": 85.0,
      "risk_contribution": 25.0,
      "title": "Impossible Travel Velocity Sequence",
      "description": "Transaction-associated location signals imply a travel speed inconsistent with the configured threshold.",
      "reason": "Implied transit speed of 2523.7 km/h over 841.2 km in 20.0 minutes exceeds the plausible physical transit threshold of 900.0 km/h."
    }
  ],
  "risk": {
    "score": 25.0,
    "level": "LOW",
    "signals": [...],
    "explanation": "Potential geographic inconsistency detected. Evaluated risk level is LOW (Score: 25.0/100) across 1 geospatial indicator(s). Requires contextual investigator review."
  },
  "confidence": 95.0,
  "confidence_reason": "Calculated from 2 coordinate observation(s) with source reliability of 90%.",
  "evidence": [
    {
      "id": "EV-GEO-SIG-IMPOSSIBLE-TRAVEL",
      "type": "GEOSPATIAL_SIGNAL",
      "description": "Potential geographic inconsistency detected: Impossible Travel Velocity Sequence - Transaction-associated location signals imply a travel speed inconsistent with the configured threshold.",
      "source": "geospatial_anomaly_engine",
      "status": "Detected",
      "relevance": "CRITICAL"
    }
  ],
  "reasoning_trace": [
    "Step 1: Loaded 2 transaction-associated location observation(s) for subject 'suresh@mockupi'",
    "...",
    "Step 14: Synthesized 1 geospatial risk finding(s) into canonical risk score (25.0/100, level: LOW) and 1 evidence item(s)"
  ]
}
```

---

## 11. Verification & Test Metrics

- **Python Tests**: **147/147 passing** (83 legacy + 31 Phase 13 + 33 new Phase 14 tests, 0 failures)
- **Node Backend Tests**: **70/70 passing** across 17 test suites
- **Frontend Build**: **100% clean production build** (`dist/` built in 2.24s)
- **Crypto Regression**: `CASE-2026-001` remains 100% intact (Score: 60.0, Level: `MEDIUM`, VASP: `Example Exchange`).
- **Phase 13 UPI Regression**: 100% intact (All 31 UPI behavioral fraud intelligence tests passing).
