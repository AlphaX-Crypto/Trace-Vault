from datetime import datetime, timezone
import math
from typing import Any, Dict, Optional, Union

from app.geospatial.models import LocationSignal
from app.upi.models import PROHIBITED_CREDENTIAL_KEYS


def parse_iso_utc(ts: Optional[str]) -> Optional[str]:
    """Normalizes ISO 8601 timestamp string into UTC standard format."""
    if not ts or not isinstance(ts, str):
        return None
    try:
        clean = ts.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return ts.strip()


class LocationNormalizer:
    """
    Validates, sanitizes, and normalizes raw location payloads into canonical LocationSignal objects.
    Enforces strict coordinate boundaries, rejects sensitive credentials, and standardizes UTC timestamps.
    """

    @classmethod
    def normalize(
        cls,
        data: Union[Dict[str, Any], LocationSignal],
        default_source: str = "synthetic",
    ) -> LocationSignal:
        if isinstance(data, LocationSignal):
            return data

        if not isinstance(data, dict):
            raise ValueError(f"Location input must be a dictionary or LocationSignal. Received: {type(data)}")

        # 1. Prohibited credential check
        for k in data.keys():
            if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                raise ValueError(
                    f"Security Exception: Sensitive credential '{k}' must never be ingested with location signals."
                )

        meta = data.get("metadata")
        if isinstance(meta, dict):
            for k in meta.keys():
                if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                    raise ValueError(
                        f"Security Exception: Sensitive credential '{k}' found in location metadata."
                    )

        # 2. Extract and validate coordinates
        lat = data.get("latitude")
        lon = data.get("longitude")
        norm_lat: Optional[float] = None
        norm_lon: Optional[float] = None

        if lat is not None:
            try:
                lat_f = float(lat)
            except (ValueError, TypeError):
                raise ValueError(f"Malformed latitude value: '{lat}'. Must be a valid floating-point number.")
            if math.isnan(lat_f) or math.isinf(lat_f):
                raise ValueError("Malformed latitude: NaN or Infinity values are strictly prohibited.")
            if not (-90.0 <= lat_f <= 90.0):
                raise ValueError(f"Latitude out of bounds: {lat_f}. Must be between -90.0 and 90.0.")
            norm_lat = round(lat_f, 6)

        if lon is not None:
            try:
                lon_f = float(lon)
            except (ValueError, TypeError):
                raise ValueError(f"Malformed longitude value: '{lon}'. Must be a valid floating-point number.")
            if math.isnan(lon_f) or math.isinf(lon_f):
                raise ValueError("Malformed longitude: NaN or Infinity values are strictly prohibited.")
            if not (-180.0 <= lon_f <= 180.0):
                raise ValueError(f"Longitude out of bounds: {lon_f}. Must be between -180.0 and 180.0.")
            norm_lon = round(lon_f, 6)

        # 3. Accuracy meters
        acc = data.get("accuracy_meters")
        norm_acc: Optional[float] = None
        if acc is not None:
            try:
                acc_f = float(acc)
                if acc_f >= 0.0 and not math.isnan(acc_f) and not math.isinf(acc_f):
                    norm_acc = round(acc_f, 2)
            except (ValueError, TypeError):
                pass

        # 4. Timestamp normalization
        raw_ts = data.get("timestamp")
        norm_ts = parse_iso_utc(raw_ts)

        # 5. Text attributes
        source = str(data.get("source") or default_source).strip()
        source_ref = str(data["source_reference"]).strip() if data.get("source_reference") else None
        country = str(data["country_code"]).strip().upper() if data.get("country_code") else None
        region = str(data["region"]).strip() if data.get("region") else None
        city = str(data["city"]).strip() if data.get("city") else None
        txn_id = str(data["transaction_id"]).strip() if data.get("transaction_id") else None
        entity_ref = str(data["entity_reference"]).strip() if data.get("entity_reference") else None
        metadata = dict(meta) if isinstance(meta, dict) else {}

        return LocationSignal(
            latitude=norm_lat,
            longitude=norm_lon,
            accuracy_meters=norm_acc,
            timestamp=norm_ts,
            source=source,
            source_reference=source_ref,
            country_code=country,
            region=region,
            city=city,
            transaction_id=txn_id,
            entity_reference=entity_ref,
            metadata=metadata,
        )
