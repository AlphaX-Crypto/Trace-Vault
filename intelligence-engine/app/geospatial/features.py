from datetime import datetime
import math
from typing import Any, Dict, List, Optional

from app.geospatial.models import GeospatialFeatures, LocationSignal

SOURCE_RELIABILITY_MAP: Dict[str, float] = {
    "authorized_bank_metadata": 0.95,
    "authorized_device_metadata": 0.90,
    "investigator_supplied": 0.85,
    "synthetic": 0.75,
    "unknown": 0.50,
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two coordinate pairs using Haversine formula.
    Accurate to within standard spherical Earth approximation (~6371 km radius).
    Pure mathematical implementation avoiding external GIS or mapping libraries.
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    r = 6371.0  # Earth radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    # Clamp a to [0.0, 1.0] to prevent floating point inaccuracies from domain error in sqrt
    a = max(0.0, min(1.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)


def travel_speed_kmh(distance_km: float, time_delta_seconds: float) -> Optional[float]:
    """
    Computes implied travel speed in km/h.
    Safely avoids division by zero when time difference is zero or negative.
    """
    if time_delta_seconds <= 0:
        return None
    hours = time_delta_seconds / 3600.0
    return round(distance_km / hours, 2)


def parse_dt(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        clean = ts.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(clean)
    except Exception:
        return None


class GeospatialFeatureExtractor:
    """
    Extracts deterministic geometric distances, travel speeds, temporal deltas,
    accuracy distributions, and baseline deviations across location observation sequences.
    """

    @classmethod
    def extract(
        cls,
        locations: List[LocationSignal],
        baseline_locations: Optional[List[LocationSignal]] = None,
        subject: str = "",
    ) -> GeospatialFeatures:
        if not locations:
            return GeospatialFeatures(
                observation_count=0,
                valid_coordinate_count=0,
                has_coordinates=False,
                insufficient_location_data=True,
                has_baseline=bool(baseline_locations),
            )

        # Sort chronologically by timestamp if timestamps exist
        def sort_key(loc: LocationSignal) -> float:
            dt = parse_dt(loc.timestamp)
            return dt.timestamp() if dt else 0.0

        sorted_locs = sorted(locations, key=sort_key)
        obs_count = len(sorted_locs)

        coord_locs = [loc for loc in sorted_locs if loc.has_coordinates]
        valid_coord_count = len(coord_locs)
        has_coordinates = valid_coord_count > 0

        has_baseline = bool(baseline_locations and len(baseline_locations) > 0)
        # Mark insufficient data if 0 coordinates, or fewer than 2 coordinates without baseline
        insufficient_location_data = (valid_coord_count == 0) or (valid_coord_count < 2 and not has_baseline)

        # Sequential jumps analysis
        jumps: List[Dict[str, Any]] = []
        distances: List[float] = []
        speeds: List[float] = []
        time_spans: List[float] = []

        for i in range(len(coord_locs) - 1):
            l1 = coord_locs[i]
            l2 = coord_locs[i + 1]

            dist = haversine_distance_km(l1.latitude, l1.longitude, l2.latitude, l2.longitude)  # type: ignore
            distances.append(dist)

            dt1 = parse_dt(l1.timestamp)
            dt2 = parse_dt(l2.timestamp)

            delta_sec: Optional[float] = None
            speed: Optional[float] = None

            if dt1 and dt2:
                delta_sec = (dt2 - dt1).total_seconds()
                time_spans.append(max(0.0, delta_sec))
                if delta_sec > 0:
                    speed = travel_speed_kmh(dist, delta_sec)
                    if speed is not None:
                        speeds.append(speed)

            jumps.append({
                "from_transaction": l1.transaction_id,
                "to_transaction": l2.transaction_id,
                "from_coord": (l1.latitude, l1.longitude),
                "to_coord": (l2.latitude, l2.longitude),
                "from_city": l1.city,
                "to_city": l2.city,
                "distance_km": dist,
                "time_delta_seconds": delta_sec,
                "speed_kmh": speed,
            })

        max_distance_km = max(distances) if distances else 0.0
        total_distance_km = round(sum(distances), 2) if distances else 0.0
        max_speed_kmh = max(speeds) if speeds else 0.0
        avg_speed_kmh = round(sum(speeds) / len(speeds), 2) if speeds else 0.0
        time_span_seconds = sum(time_spans) if time_spans else 0.0

        # Accuracy statistics
        accuracies = [loc.accuracy_meters for loc in sorted_locs if loc.accuracy_meters is not None]
        min_acc = min(accuracies) if accuracies else None
        max_acc = max(accuracies) if accuracies else None
        avg_acc = round(sum(accuracies) / len(accuracies), 2) if accuracies else None
        is_low_accuracy = any(acc > 5000.0 for acc in accuracies) if accuracies else False

        # Source reliability
        reliabilities = [
            SOURCE_RELIABILITY_MAP.get(loc.source.lower(), 0.50)
            for loc in sorted_locs
        ]
        source_rel_score = round(sum(reliabilities) / len(reliabilities), 2) if reliabilities else 0.75

        # Distinct cities
        cities = [loc.city.strip() for loc in sorted_locs if loc.city]
        distinct_cities = sorted(list(set(cities)))

        # Baseline comparison
        has_baseline = bool(baseline_locations and len(baseline_locations) > 0)
        baseline_distance_km: Optional[float] = None
        baseline_city: Optional[str] = None

        if has_baseline and baseline_locations:
            b_coord_locs = [b for b in baseline_locations if b.has_coordinates]
            b_cities = [b.city for b in baseline_locations if b.city]
            if b_cities:
                baseline_city = b_cities[0]

            if b_coord_locs and coord_locs:
                # Minimum distance from any current observation to established baseline observations
                min_b_dist = min(
                    haversine_distance_km(c.latitude, c.longitude, b.latitude, b.longitude)  # type: ignore
                    for c in coord_locs
                    for b in b_coord_locs
                )
                baseline_distance_km = min_b_dist

        return GeospatialFeatures(
            observation_count=obs_count,
            valid_coordinate_count=valid_coord_count,
            has_coordinates=has_coordinates,
            insufficient_location_data=insufficient_location_data,
            max_distance_km=max_distance_km,
            total_distance_km=total_distance_km,
            max_speed_kmh=max_speed_kmh,
            avg_speed_kmh=avg_speed_kmh,
            time_span_seconds=time_span_seconds,
            has_baseline=has_baseline,
            baseline_distance_km=baseline_distance_km,
            baseline_city=baseline_city,
            min_accuracy_meters=min_acc,
            max_accuracy_meters=max_acc,
            avg_accuracy_meters=avg_acc,
            is_low_accuracy=is_low_accuracy,
            source_reliability_score=source_rel_score,
            distinct_cities=distinct_cities,
            locations=sorted_locs,
            metadata={
                "jumps": jumps,
                "speed_count": len(speeds),
            },
        )
