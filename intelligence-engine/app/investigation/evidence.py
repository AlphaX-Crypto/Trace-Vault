from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.models.analysis import EvidenceItem


class EvidenceCategory:
    OBSERVED_FACT = "OBSERVED_FACT"
    SYSTEM_ANALYSIS = "SYSTEM_ANALYSIS"
    ATTRIBUTION = "ATTRIBUTION"
    RISK_INDICATOR = "RISK_INDICATOR"
    INVESTIGATOR_INTERPRETATION = "INVESTIGATOR_INTERPRETATION"


class InvestigationEvidenceLinker:
    """
    Synthesizes and links evidence across multi-rail intelligence engines.
    Reuses the canonical EvidenceItem model.
    CRITICAL: Designates items as 'structured investigative evidence suitable for review',
    never claiming automated 'court-ready' finality.
    """

    @classmethod
    def link_evidence(
        cls,
        existing_items: Optional[List[EvidenceItem]] = None,
        crypto_transactions: Optional[List[Dict[str, Any]]] = None,
        upi_transactions: Optional[List[Dict[str, Any]]] = None,
        vasp_attributions: Optional[List[Dict[str, Any]]] = None,
        cross_rail_associations: Optional[List[Dict[str, Any]]] = None,
        location_signals: Optional[List[Dict[str, Any]]] = None,
    ) -> List[EvidenceItem]:
        evidence_dict: Dict[str, EvidenceItem] = {}
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Ingest pre-existing EvidenceItem objects from domain engines
        for item in (existing_items or []):
            if isinstance(item, EvidenceItem):
                evidence_dict[item.id] = item

        counter = len(evidence_dict) + 1

        # 2. Crypto Transactions as OBSERVED_FACT
        for tx in (crypto_transactions or []):
            tx_hash = tx.get("transaction_hash", "")
            ev_id = f"EV-CTX-{tx_hash[:10]}" if tx_hash else f"EV-CTX-{counter}"
            if ev_id not in evidence_dict:
                evidence_dict[ev_id] = EvidenceItem(
                    id=ev_id,
                    type=EvidenceCategory.OBSERVED_FACT,
                    description=f"Observed on-chain transfer of {tx.get('amount')} {tx.get('asset', 'ETH')} from {tx.get('from_address')} to {tx.get('to_address')}.",
                    source=str(tx.get("source", "blockchain")),
                    timestamp=str(tx.get("timestamp") or now_iso),
                    status="Verified",
                    relevance="HIGH",
                    transaction_hash=tx_hash,
                    from_address=tx.get("from_address"),
                    to_address=tx.get("to_address"),
                    amount=float(tx.get("amount", 0.0)),
                    asset=str(tx.get("asset", "ETH")),
                    metadata={"blockchain": tx.get("blockchain", "ethereum"), "evidence_standard": "structured_investigative_evidence_suitable_for_review"},
                )
                counter += 1

        # 3. UPI Transactions as OBSERVED_FACT
        for utx in (upi_transactions or []):
            tx_id = utx.get("transaction_id", "")
            ev_id = f"EV-UPI-{tx_id[:10]}" if tx_id else f"EV-UPI-{counter}"
            if ev_id not in evidence_dict:
                evidence_dict[ev_id] = EvidenceItem(
                    id=ev_id,
                    type=EvidenceCategory.OBSERVED_FACT,
                    description=f"Observed UPI payment of {utx.get('amount')} {utx.get('currency', 'INR')} from {utx.get('sender_vpa')} to {utx.get('receiver_vpa')}.",
                    source=str(utx.get("source", "upi")),
                    timestamp=str(utx.get("timestamp") or now_iso),
                    status="Verified",
                    relevance="HIGH",
                    transaction_hash=tx_id,
                    from_address=utx.get("sender_vpa"),
                    to_address=utx.get("receiver_vpa"),
                    amount=float(utx.get("amount", 0.0)),
                    asset=str(utx.get("currency", "INR")),
                    metadata={"evidence_standard": "structured_investigative_evidence_suitable_for_review"},
                )
                counter += 1

        # 4. VASP Attribution as ATTRIBUTION
        for vasp in (vasp_attributions or []):
            v_name = vasp.get("vasp_name", "")
            w_addr = vasp.get("wallet_address", "")
            ev_id = f"EV-VASP-{v_name.lower().replace(' ', '_')}"
            if ev_id not in evidence_dict:
                evidence_dict[ev_id] = EvidenceItem(
                    id=ev_id,
                    type=EvidenceCategory.ATTRIBUTION,
                    description=f"Attribution finding linking deposit address {vasp.get('deposit_address') or w_addr} to recognized VASP '{v_name}'.",
                    source="vasp_registry",
                    timestamp=now_iso,
                    status="Verified",
                    relevance="HIGH",
                    entity=v_name,
                    from_address=w_addr,
                    metadata={
                        "risk_score": vasp.get("risk_score"),
                        "evidence_standard": "structured_investigative_evidence_suitable_for_review",
                    },
                )
                counter += 1

        # 5. Cross-Rail Associations as INVESTIGATOR_INTERPRETATION
        for ca in (cross_rail_associations or []):
            s_node = ca.get("source_node_id") or ca.get("source_id")
            t_node = ca.get("target_node_id") or ca.get("target_id")
            ev_id = f"EV-CROSS-{counter}"
            if ev_id not in evidence_dict:
                evidence_dict[ev_id] = EvidenceItem(
                    id=ev_id,
                    type=EvidenceCategory.INVESTIGATOR_INTERPRETATION,
                    description=f"Analytical cross-rail correlation connecting {s_node} to {t_node}: {ca.get('description', '')}",
                    source=str(ca.get("source", "cross_rail_registry")),
                    timestamp=now_iso,
                    status="Supporting",
                    relevance="HIGH",
                    metadata={
                        "confidence": ca.get("confidence"),
                        "relationship_nature": "graph_derived_association_not_identity_proof",
                        "evidence_standard": "structured_investigative_evidence_suitable_for_review",
                    },
                )
                counter += 1

        return list(evidence_dict.values())
