import hashlib
from typing import Any, Dict, List, Optional, Tuple, Union
from decimal import Decimal

from app.graph.unified.models import (
    FinancialRail,
    UnifiedNodeType,
    UnifiedEdgeType,
    UnifiedNode,
    UnifiedEdge,
    CrossRailAssociation,
    make_deterministic_node_id,
)
from app.models.transaction import CommonTransaction
from app.upi.models import UPITransaction, PROHIBITED_CREDENTIAL_KEYS
from app.geospatial.models import LocationSignal


def _sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures sensitive credentials are not leaked in metadata dictionaries, raising on violation."""
    sanitized = {}
    for k, v in data.items():
        if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
            raise ValueError(f"Security Violation: Sensitive credential '{k}' must not be stored in graph.")
        if isinstance(v, dict):
            sanitized[k] = _sanitize_dict(v)
        else:
            sanitized[k] = v
    return sanitized


class CryptoGraphAdapter:
    """
    Adapts blockchain transactions and VASP attributions into canonical UnifiedNodes and UnifiedEdges.
    """

    @staticmethod
    def convert_transaction(
        tx: Union[CommonTransaction, Dict[str, Any]],
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, UnifiedNode, UnifiedEdge]:
        """
        Converts CommonTransaction into (from_wallet_node, to_wallet_node, edge).
        Deterministic identity: wallet:<address_lowercase>.
        """
        if isinstance(tx, CommonTransaction):
            data = tx.to_dict()
        else:
            data = dict(tx)

        from_addr = str(data.get("from_address", "")).strip().lower()
        to_addr = str(data.get("to_address", "")).strip().lower()
        tx_hash = str(data.get("transaction_hash", "")).strip().lower()
        blockchain = str(data.get("blockchain", "ethereum")).strip().lower()
        asset = str(data.get("asset", "ETH")).strip().upper()
        amount = float(data.get("amount", 0.0))
        timestamp = str(data.get("timestamp", ""))
        source = str(data.get("source", "blockchain"))
        metadata = _sanitize_dict(data.get("metadata", {}))

        from_node_id = make_deterministic_node_id("wallet", from_addr)
        to_node_id = make_deterministic_node_id("wallet", to_addr)

        from_node = UnifiedNode(
            node_id=from_node_id,
            node_type=UnifiedNodeType.WALLET.value,
            rail=FinancialRail.CRYPTO.value,
            label=f"{from_addr[:8]}...{from_addr[-6:]}" if len(from_addr) > 14 else from_addr,
            tags=["crypto_wallet", blockchain],
            metadata={
                "address": from_addr,
                "blockchain": blockchain,
            },
            source_references=[source],
            evidence_references=[evidence_id] if evidence_id else [],
        )

        to_node = UnifiedNode(
            node_id=to_node_id,
            node_type=UnifiedNodeType.WALLET.value,
            rail=FinancialRail.CRYPTO.value,
            label=f"{to_addr[:8]}...{to_addr[-6:]}" if len(to_addr) > 14 else to_addr,
            tags=["crypto_wallet", blockchain],
            metadata={
                "address": to_addr,
                "blockchain": blockchain,
            },
            source_references=[source],
            evidence_references=[evidence_id] if evidence_id else [],
        )

        edge_id = f"edge:{from_node_id}->{to_node_id}:{tx_hash}"
        edge = UnifiedEdge(
            edge_id=edge_id,
            source=from_node_id,
            target=to_node_id,
            edge_type=UnifiedEdgeType.TRANSACTED_WITH.value,
            rail=FinancialRail.CRYPTO.value,
            transaction_id=tx_hash,
            timestamp=timestamp,
            amount=amount,
            currency=asset,
            metadata={
                "blockchain": blockchain,
                "tx_hash": tx_hash,
                "source": source,
                **metadata,
            },
            evidence_references=[evidence_id] if evidence_id else [],
        )

        return from_node, to_node, edge

    @staticmethod
    def convert_attribution(
        wallet_address: str,
        vasp_name: str,
        deposit_address: Optional[str] = None,
        risk_score: float = 0.0,
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, UnifiedEdge]:
        """
        Converts VASP attribution into a VASP UnifiedNode and ATTRIBUTED_TO UnifiedEdge.
        """
        wallet_clean = str(wallet_address).strip().lower()
        vasp_clean = str(vasp_name).strip()
        vasp_node_id = make_deterministic_node_id("vasp", vasp_clean)
        wallet_node_id = make_deterministic_node_id("wallet", wallet_clean)

        vasp_node = UnifiedNode(
            node_id=vasp_node_id,
            node_type=UnifiedNodeType.VASP.value,
            rail=FinancialRail.CRYPTO.value,
            label=vasp_clean,
            entity_name=vasp_clean,
            risk_score=risk_score,
            tags=["vasp", "crypto_exchange"],
            metadata={
                "vasp_name": vasp_clean,
                "deposit_address": deposit_address.lower() if deposit_address else None,
            },
            source_references=["vasp_registry"],
            evidence_references=[evidence_id] if evidence_id else [],
        )

        edge_id = f"edge:{wallet_node_id}->{vasp_node_id}:attribution"
        edge = UnifiedEdge(
            edge_id=edge_id,
            source=wallet_node_id,
            target=vasp_node_id,
            edge_type=UnifiedEdgeType.ATTRIBUTED_TO.value,
            rail=FinancialRail.CRYPTO.value,
            metadata={
                "relationship": "vasp_attribution",
                "deposit_address": deposit_address.lower() if deposit_address else None,
                "attributed_vasp": vasp_clean,
            },
            evidence_references=[evidence_id] if evidence_id else [],
        )

        return vasp_node, edge


class UPIGraphAdapter:
    """
    Adapts normalized UPI transactions into canonical UnifiedNodes and UnifiedEdges.
    """

    @staticmethod
    def convert_transaction(
        tx: Union[UPITransaction, Dict[str, Any]],
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, UnifiedNode, UnifiedEdge, Optional[UnifiedNode], Optional[UnifiedEdge]]:
        """
        Converts UPITransaction into:
        (sender_node, receiver_node, transfer_edge, optional_merchant_node, optional_merchant_edge).
        Deterministic identity: upi:<vpa_lowercase>.
        """
        if isinstance(tx, UPITransaction):
            data = tx.model_dump()
        else:
            data = dict(tx)
            for k in data.keys():
                if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                    raise ValueError(f"Security Violation: Sensitive credential '{k}' must never be ingested or stored.")

        sender_vpa = str(data.get("sender_vpa", "")).strip().lower()
        receiver_vpa = str(data.get("receiver_vpa", "")).strip().lower()
        tx_id = str(data.get("transaction_id", "")).strip()
        timestamp = str(data.get("timestamp", ""))
        amt_raw = data.get("amount", 0.0)
        amount = float(amt_raw) if not isinstance(amt_raw, Decimal) else float(amt_raw)
        currency = str(data.get("currency", "INR")).strip().upper()
        sender_bank = data.get("sender_bank")
        receiver_bank = data.get("receiver_bank")
        payment_app = data.get("payment_app")
        merchant_id = data.get("merchant_id")
        merchant_category = data.get("merchant_category")
        tx_type = str(data.get("transaction_type", "P2P")).upper()
        status = str(data.get("status", "SUCCESS")).upper()
        source = str(data.get("source", "upi"))
        metadata = _sanitize_dict(data.get("metadata", {}))

        sender_node_id = make_deterministic_node_id("upi_vpa", sender_vpa)
        receiver_node_id = make_deterministic_node_id("upi_vpa", receiver_vpa)

        sender_node = UnifiedNode(
            node_id=sender_node_id,
            node_type=UnifiedNodeType.UPI_VPA.value,
            rail=FinancialRail.UPI.value,
            label=sender_vpa,
            tags=["upi_vpa"],
            metadata={
                "vpa": sender_vpa,
                "bank": sender_bank,
                "payment_app": payment_app,
            },
            source_references=[source],
            evidence_references=[evidence_id] if evidence_id else [],
        )

        receiver_node = UnifiedNode(
            node_id=receiver_node_id,
            node_type=UnifiedNodeType.UPI_VPA.value,
            rail=FinancialRail.UPI.value,
            label=receiver_vpa,
            tags=["upi_vpa"],
            metadata={
                "vpa": receiver_vpa,
                "bank": receiver_bank,
            },
            source_references=[source],
            evidence_references=[evidence_id] if evidence_id else [],
        )

        edge_id = f"edge:{sender_node_id}->{receiver_node_id}:{tx_id}"
        edge = UnifiedEdge(
            edge_id=edge_id,
            source=sender_node_id,
            target=receiver_node_id,
            edge_type=UnifiedEdgeType.TRANSACTED_WITH.value,
            rail=FinancialRail.UPI.value,
            transaction_id=tx_id,
            timestamp=timestamp,
            amount=amount,
            currency=currency,
            metadata={
                "transaction_type": tx_type,
                "status": status,
                "sender_bank": sender_bank,
                "receiver_bank": receiver_bank,
                "payment_app": payment_app,
                **metadata,
            },
            evidence_references=[evidence_id] if evidence_id else [],
        )

        merchant_node = None
        merchant_edge = None
        if merchant_id:
            m_clean = str(merchant_id).strip().lower()
            m_node_id = make_deterministic_node_id("merchant", m_clean)
            merchant_node = UnifiedNode(
                node_id=m_node_id,
                node_type=UnifiedNodeType.MERCHANT.value,
                rail=FinancialRail.UPI.value,
                label=f"Merchant {m_clean}",
                entity_name=m_clean,
                tags=["merchant", "upi_merchant"],
                metadata={
                    "merchant_id": m_clean,
                    "merchant_category": merchant_category,
                },
                source_references=[source],
                evidence_references=[evidence_id] if evidence_id else [],
            )
            m_edge_id = f"edge:{receiver_node_id}->{m_node_id}:merchant_association"
            merchant_edge = UnifiedEdge(
                edge_id=m_edge_id,
                source=receiver_node_id,
                target=m_node_id,
                edge_type=UnifiedEdgeType.ASSOCIATED_WITH.value,
                rail=FinancialRail.UPI.value,
                metadata={
                    "relationship": "merchant_vpa_association",
                    "merchant_id": m_clean,
                    "merchant_category": merchant_category,
                },
                evidence_references=[evidence_id] if evidence_id else [],
            )

        return sender_node, receiver_node, edge, merchant_node, merchant_edge


class GeospatialGraphAdapter:
    """
    Adapts location signals into canonical UnifiedNodes and UnifiedEdges linked to transactions or entities.
    """

    @staticmethod
    def convert_signal(
        signal: Union[LocationSignal, Dict[str, Any]],
        linked_node_id: Optional[str] = None,
        evidence_id: Optional[str] = None,
    ) -> Tuple[UnifiedNode, Optional[UnifiedEdge]]:
        """
        Converts LocationSignal into a LOCATION UnifiedNode and LOCATED_NEAR edge to linked_node_id.
        """
        if isinstance(signal, LocationSignal):
            data = signal.model_dump()
        else:
            data = dict(signal)

        lat = data.get("latitude")
        lon = data.get("longitude")
        acc = data.get("accuracy_meters")
        city = data.get("city")
        region = data.get("region")
        country = data.get("country_code", "IN")
        timestamp = data.get("timestamp")
        source = str(data.get("source", "synthetic"))
        metadata = _sanitize_dict(data.get("metadata", {}))

        # Deterministic location key based on coords or city
        if lat is not None and lon is not None:
            loc_key = f"{round(float(lat), 4)}_{round(float(lon), 4)}"
        elif city:
            loc_key = f"{str(city).strip().lower()}_{str(country).strip().lower()}"
        else:
            loc_key = hashlib.sha256(str(data).encode("utf-8")).hexdigest()[:12]

        loc_node_id = make_deterministic_node_id("location", loc_key)
        label_parts = []
        if city:
            label_parts.append(str(city))
        if region:
            label_parts.append(str(region))
        if not label_parts and lat is not None and lon is not None:
            label_parts.append(f"{lat:.2f},{lon:.2f}")
        loc_label = ", ".join(label_parts) if label_parts else "Location Signal"

        loc_node = UnifiedNode(
            node_id=loc_node_id,
            node_type=UnifiedNodeType.LOCATION.value,
            rail=FinancialRail.CROSS_RAIL.value,
            label=loc_label,
            tags=["location_signal", country.lower() if country else "geo"],
            metadata={
                "latitude": lat,
                "longitude": lon,
                "accuracy_meters": acc,
                "city": city,
                "region": region,
                "country_code": country,
                **metadata,
            },
            source_references=[source],
            evidence_references=[evidence_id] if evidence_id else [],
        )

        edge = None
        target_link = linked_node_id or data.get("entity_reference") or data.get("transaction_id")
        if target_link:
            clean_target = str(target_link).strip()
            # If target does not have prefix, determine prefix
            if ":" not in clean_target:
                if "@" in clean_target:
                    clean_target = make_deterministic_node_id("upi_vpa", clean_target)
                elif clean_target.startswith("0x"):
                    clean_target = make_deterministic_node_id("wallet", clean_target)
                else:
                    clean_target = make_deterministic_node_id("entity", clean_target)

            edge_id = f"edge:{clean_target}->{loc_node_id}:loc"
            edge = UnifiedEdge(
                edge_id=edge_id,
                source=clean_target,
                target=loc_node_id,
                edge_type=UnifiedEdgeType.LOCATED_NEAR.value,
                rail=FinancialRail.CROSS_RAIL.value,
                timestamp=timestamp,
                metadata={
                    "relationship": "geospatial_observation",
                    "accuracy_meters": acc,
                    "city": city,
                },
                evidence_references=[evidence_id] if evidence_id else [],
            )

        return loc_node, edge


class CrossRailAdapter:
    """
    Adapts CrossRailAssociation into a canonical UnifiedEdge.
    Explicitly tags the relationship as analytical association, NOT personhood proof.
    """

    @staticmethod
    def convert(association: CrossRailAssociation) -> UnifiedEdge:
        return association.to_edge()
