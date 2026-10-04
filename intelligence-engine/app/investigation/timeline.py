from datetime import datetime
from typing import Any, Dict, List, Optional
from app.investigation.models import (
    InvestigationTimelineEvent,
    TimelineEventType,
)


def _parse_timestamp(ts: Optional[str]) -> Optional[datetime]:
    if not ts or not isinstance(ts, str):
        return None
    try:
        clean = ts.replace("Z", "+00:00")
        return datetime.fromisoformat(clean)
    except Exception:
        return None


class InvestigationTimelineBuilder:
    """
    Constructs a deterministic, chronological investigation timeline.
    Strictly forbids inventing timestamps: missing timestamps are explicitly marked as UNKNOWN.
    """

    @classmethod
    def build_timeline(
        cls,
        crypto_transactions: Optional[List[Dict[str, Any]]] = None,
        upi_transactions: Optional[List[Dict[str, Any]]] = None,
        location_signals: Optional[List[Dict[str, Any]]] = None,
        vasp_attributions: Optional[List[Dict[str, Any]]] = None,
        behavioral_findings: Optional[List[Dict[str, Any]]] = None,
        cross_rail_associations: Optional[List[Dict[str, Any]]] = None,
    ) -> List[InvestigationTimelineEvent]:
        events: List[InvestigationTimelineEvent] = []
        event_counter = 1

        # 1. Crypto Transactions
        for tx in (crypto_transactions or []):
            ts = tx.get("timestamp")
            dt = _parse_timestamp(ts)
            tx_hash = tx.get("transaction_hash", "")
            events.append(
                InvestigationTimelineEvent(
                    event_id=f"EVT-CRYPTO-{event_counter}",
                    timestamp=ts if dt else None,
                    timestamp_status="CONFIRMED" if dt else "UNKNOWN",
                    event_type=TimelineEventType.CRYPTO_TRANSFER.value,
                    rail="CRYPTO",
                    source=str(tx.get("source", "blockchain")),
                    actor_reference=tx.get("from_address"),
                    target_reference=tx.get("to_address"),
                    transaction_reference=tx_hash,
                    amount=float(tx.get("amount", 0.0)),
                    currency=str(tx.get("asset", "ETH")),
                    metadata={"blockchain": tx.get("blockchain", "ethereum")},
                )
            )
            event_counter += 1

        # 2. UPI Transactions
        for utx in (upi_transactions or []):
            ts = utx.get("timestamp")
            dt = _parse_timestamp(ts)
            tx_id = utx.get("transaction_id", "")
            amt = utx.get("amount", 0.0)
            events.append(
                InvestigationTimelineEvent(
                    event_id=f"EVT-UPI-{event_counter}",
                    timestamp=ts if dt else None,
                    timestamp_status="CONFIRMED" if dt else "UNKNOWN",
                    event_type=TimelineEventType.UPI_TRANSFER.value,
                    rail="UPI",
                    source=str(utx.get("source", "upi")),
                    actor_reference=utx.get("sender_vpa"),
                    target_reference=utx.get("receiver_vpa"),
                    transaction_reference=tx_id,
                    amount=float(amt),
                    currency=str(utx.get("currency", "INR")),
                    metadata={
                        "sender_bank": utx.get("sender_bank"),
                        "receiver_bank": utx.get("receiver_bank"),
                        "merchant_id": utx.get("merchant_id"),
                    },
                )
            )
            event_counter += 1

        # 3. Location Signals
        for loc in (location_signals or []):
            ts = loc.get("timestamp")
            dt = _parse_timestamp(ts)
            city = loc.get("city")
            lat = loc.get("latitude")
            lon = loc.get("longitude")
            loc_ref = f"{city} ({lat},{lon})" if city and lat is not None else (city or f"{lat},{lon}")
            events.append(
                InvestigationTimelineEvent(
                    event_id=f"EVT-GEO-{event_counter}",
                    timestamp=ts if dt else None,
                    timestamp_status="CONFIRMED" if dt else "UNKNOWN",
                    event_type=TimelineEventType.LOCATION_OBSERVATION.value,
                    rail="GEOSPATIAL",
                    source=str(loc.get("source", "synthetic")),
                    actor_reference=loc.get("entity_reference"),
                    transaction_reference=loc.get("transaction_id"),
                    location_reference=loc_ref,
                    metadata={
                        "latitude": lat,
                        "longitude": lon,
                        "accuracy_meters": loc.get("accuracy_meters"),
                    },
                )
            )
            event_counter += 1

        # 4. VASP Interactions
        for vasp in (vasp_attributions or []):
            events.append(
                InvestigationTimelineEvent(
                    event_id=f"EVT-VASP-{event_counter}",
                    timestamp=vasp.get("timestamp"),
                    timestamp_status="CONFIRMED" if _parse_timestamp(vasp.get("timestamp")) else "UNKNOWN",
                    event_type=TimelineEventType.VASP_INTERACTION.value,
                    rail="CRYPTO",
                    source="vasp_registry",
                    actor_reference=vasp.get("wallet_address"),
                    target_reference=vasp.get("vasp_name"),
                    metadata={
                        "deposit_address": vasp.get("deposit_address"),
                        "risk_score": vasp.get("risk_score"),
                    },
                )
            )
            event_counter += 1

        # 5. Behavioral Findings
        for b in (behavioral_findings or []):
            events.append(
                InvestigationTimelineEvent(
                    event_id=f"EVT-BEH-{event_counter}",
                    timestamp=b.get("timestamp"),
                    timestamp_status="CONFIRMED" if _parse_timestamp(b.get("timestamp")) else "UNKNOWN",
                    event_type=TimelineEventType.BEHAVIORAL_FINDING.value,
                    rail="CRYPTO",
                    source="behavioral_engine",
                    actor_reference=b.get("primary_wallet"),
                    metadata={"pattern": b.get("pattern_type"), "description": b.get("description")},
                )
            )
            event_counter += 1

        # 6. Cross-Rail Associations
        for ca in (cross_rail_associations or []):
            s_node = ca.get("source_node_id") or ca.get("source_id")
            t_node = ca.get("target_node_id") or ca.get("target_id")
            events.append(
                InvestigationTimelineEvent(
                    event_id=f"EVT-CROSS-{event_counter}",
                    timestamp=ca.get("timestamp"),
                    timestamp_status="CONFIRMED" if _parse_timestamp(ca.get("timestamp")) else "UNKNOWN",
                    event_type=TimelineEventType.CROSS_RAIL_ASSOCIATION.value,
                    rail="CROSS_RAIL",
                    source=str(ca.get("source", "cross_rail_registry")),
                    actor_reference=s_node,
                    target_reference=t_node,
                    metadata={
                        "confidence": ca.get("confidence"),
                        "description": ca.get("description"),
                        "source_rail": ca.get("source_rail"),
                        "target_rail": ca.get("target_rail"),
                    },
                )
            )
            event_counter += 1

        # Sort chronologically: valid parsed datetimes first, followed by UNKNOWN
        def sort_key(e: InvestigationTimelineEvent):
            parsed = _parse_timestamp(e.timestamp)
            if parsed:
                return (0, parsed)
            else:
                return (1, datetime.max)

        events.sort(key=sort_key)
        return events
