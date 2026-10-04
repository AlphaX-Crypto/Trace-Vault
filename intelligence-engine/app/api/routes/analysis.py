from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from app.models.analysis import AnalyzeWalletRequest, AnalysisResult
from app.models.transaction import CommonTransaction
from app.graph.builder import TransactionGraphBuilder
from app.graph.traversal import BFSTraverser
from app.behavioral.engine import BehavioralIntelligenceEngine
from app.risk.scorer import RiskScorer
from app.upi.models import PROHIBITED_CREDENTIAL_KEYS
from app.upi.intelligence.engine import UPIFraudIntelligenceEngine
from app.upi.normalizer import UPITransactionNormalizer
from app.services.analysis_service import AnalysisService
from app.graph.unified.engine import UnifiedInvestigationEngine
from app.graph.unified.serializer import UnifiedGraphSerializer
from app.attribution.vasp_identifier import VaspIdentifier
from app.attribution.registry import VaspRegistry
from app.geospatial.engine import GeospatialIntelligenceEngine
from app.geospatial.models import LocationSignal

logger = logging.getLogger(__name__)
router = APIRouter()
analysis_service = AnalysisService()
unified_engine = UnifiedInvestigationEngine()
upi_engine = UPIFraudIntelligenceEngine()
vasp_identifier = VaspIdentifier()
geo_engine = GeospatialIntelligenceEngine()


def check_prohibited_credentials(data: Any) -> None:
    """Recursively checks for prohibited authentication credentials."""
    if isinstance(data, dict):
        for k, v in data.items():
            if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sensitive authentication credential '{k}' must not be submitted."
                )
            check_prohibited_credentials(v)
    elif isinstance(data, list):
        for item in data:
            check_prohibited_credentials(item)


class CaseGraphAnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    case_id: str = Field(..., description="Unique case identifier")
    subject: Optional[str] = Field(default=None, description="Subject address or VPA identifier")
    max_hops: int = Field(default=4, ge=1, le=10, description="Maximum traversal hop depth")
    direction: str = Field(default="both", description="Traversal direction: outgoing, incoming, or both")
    rail_filter: Optional[str] = Field(default=None, description="Optional rail filter")
    transactions: List[Dict[str, Any]] = Field(default_factory=list, description="Normalized case transactions from PostgreSQL")


@router.post("/api/v1/analyze-wallet", response_model=AnalysisResult)
def analyze_wallet(request: AnalyzeWalletRequest):
    """
    Automated Blockchain Intelligence & VASP Attribution Endpoint.
    Analyzes given target wallet, constructs NetworkX graph,
    performs BFS traversal, attributes nearest VASP, and computes multi-factor risk.
    """
    if not request.wallet_address or not request.wallet_address.strip():
        raise HTTPException(status_code=400, detail="Wallet address is required.")

    if request.blockchain.lower() != "ethereum":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported blockchain '{request.blockchain}'. Supported chains in MVP: ethereum.",
        )

    try:
        result = analysis_service.analyze_wallet(request)
        return result
    except Exception as e:
        logger.error(f"Internal error analyzing wallet {request.wallet_address}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during analysis.")


@router.post("/api/v1/cases/graph-analyze")
def analyze_case_graph(request: CaseGraphAnalyzeRequest):
    """
    Constructs and analyzes a NetworkX investigation graph directly from
    PostgreSQL-persisted normalized transactions.
    Supports multi-rail (crypto & UPI), hop depth limits, direction filtering,
    and returns canonical DTOs for the Trace Graph workspace.
    """
    try:
        # Partition normalized transactions by rail for UnifiedInvestigationEngine
        crypto_txs = []
        upi_txs = []

        for tx in request.transactions:
            rail = str(tx.get("blockchain") or tx.get("rail") or "ethereum").lower()
            if "upi" in rail:
                # Format for UPIGraphAdapter
                upi_txs.append({
                    "transaction_id": tx.get("transaction_hash") or tx.get("id"),
                    "sender_vpa": tx.get("from_address") or tx.get("sender"),
                    "receiver_vpa": tx.get("to_address") or tx.get("receiver"),
                    "amount": float(tx.get("amount") or 0.0),
                    "currency": tx.get("asset") or "INR",
                    "timestamp": tx.get("timestamp"),
                    "status": (tx.get("metadata", {}) or {}).get("status", "SUCCESS"),
                    "upi_type": tx.get("transaction_type") or "P2P",
                    **(tx.get("metadata", {}) or {})
                })
            else:
                # Format for CryptoGraphAdapter
                crypto_txs.append({
                    "transaction_hash": tx.get("transaction_hash") or tx.get("id"),
                    "from_address": tx.get("from_address") or tx.get("sender"),
                    "to_address": tx.get("to_address") or tx.get("receiver"),
                    "blockchain": rail,
                    "asset": tx.get("asset") or "ETH",
                    "amount": float(tx.get("amount") or 0.0),
                    "timestamp": tx.get("timestamp"),
                    "status": (tx.get("metadata", {}) or {}).get("status", "SUCCESS"),
                    **(tx.get("metadata", {}) or {})
                })

        # Run unified investigation engine with NetworkX builder
        analysis_result = unified_engine.analyze_investigation(
            case_id=request.case_id,
            crypto_transactions=crypto_txs,
            upi_transactions=upi_txs,
            focus_entity=request.subject,
            max_traversal_depth=request.max_hops
        )

        serialized = UnifiedGraphSerializer.serialize_result(analysis_result)

        # Build clean frontend response DTO
        nodes = serialized.get("nodes", [])
        edges = serialized.get("edges", [])

        # Directional and rail filtering if specified
        if request.direction.lower() == "outgoing" and request.subject:
            sub_clean = request.subject.lower()
            edges = [e for e in edges if sub_clean in str(e.get("source", "")).lower()]
        elif request.direction.lower() == "incoming" and request.subject:
            sub_clean = request.subject.lower()
            edges = [e for e in edges if sub_clean in str(e.get("target", "")).lower()]

        if request.rail_filter:
            rf = request.rail_filter.upper()
            edges = [e for e in edges if e.get("rail", "").upper() == rf]
            allowed_node_ids = {e.get("source") for e in edges} | {e.get("target") for e in edges}
            nodes = [n for n in nodes if n.get("node_id") in allowed_node_ids]

        return {
            "case_id": request.case_id,
            "subject": request.subject,
            "max_hops": request.max_hops,
            "direction": request.direction,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "nodes": nodes,
            "edges": edges,
            "paths": serialized.get("paths", []),
            "metadata": {
                "engine": "NetworkX MultiDiGraph",
                "traversal": "deterministic_bfs",
                "max_depth_enforced": request.max_hops
            }
        }
    except Exception as e:
        logger.error(f"Error in analyze_case_graph for case {request.case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class CaseRiskAnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    case_id: str = Field(..., description="Unique case identifier")
    subject: Optional[str] = Field(default=None, description="Subject address or identifier")
    transactions: List[Dict[str, Any]] = Field(default_factory=list, description="Normalized case transactions from PostgreSQL")


@router.post("/api/v1/cases/risk-analyze")
def analyze_case_risk(request: CaseRiskAnalyzeRequest):
    """
    Computes explainable, multi-factor risk assessment and behavioral signals
    for an investigation case directly from PostgreSQL-persisted normalized transactions.
    Rejects sensitive credentials, enforces deterministic scoring, and provides verifiable findings.
    """
    try:
        # 1. Prohibited sensitive credential check
        for tx in request.transactions:
            if isinstance(tx, dict):
                for k in tx.keys():
                    if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Sensitive authentication credential '{k}' must not be submitted for risk analysis."
                        )

        # 2. Empty transaction check -> deterministic baseline response
        if not request.transactions:
            return {
                "case_id": request.case_id,
                "subject": request.subject or "UNSPECIFIED",
                "overall_score": 0.0,
                "risk_level": "LOW",
                "signals": [],
                "summary": {
                    "signal_count": 0,
                    "transaction_count": 0
                },
                "metadata": {
                    "engine": "TRACEVAULT Multi-Factor Risk Intelligence",
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "data_source": "PostgreSQL Normalized Case Transactions"
                }
            }

        # 3. Resolve target subject
        subject = (request.subject or "").strip().lower()
        if not subject:
            first_tx = request.transactions[0]
            subject = str(first_tx.get("from_address") or first_tx.get("sender") or "UNSPECIFIED").lower()

        # 4. Normalize transactions to CommonTransaction instances
        norm_txs = []
        for tx in request.transactions:
            norm_txs.append(CommonTransaction(
                transaction_hash=str(tx.get("transaction_hash") or tx.get("id") or ""),
                from_address=str(tx.get("from_address") or tx.get("sender") or "").lower(),
                to_address=str(tx.get("to_address") or tx.get("receiver") or "").lower(),
                blockchain=str(tx.get("blockchain") or tx.get("rail") or "ethereum").lower(),
                amount=float(tx.get("amount") or 0.0),
                asset=str(tx.get("asset") or "ETH"),
                timestamp=tx.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                block_number=tx.get("block_number"),
                transaction_type=str(tx.get("transaction_type") or "transfer"),
                source=str(tx.get("source") or "case_transactions"),
                metadata=tx.get("metadata") or {}
            ))

        # 5. Build NetworkX DiGraph
        graph_builder = TransactionGraphBuilder()
        graph = graph_builder.build_graph(norm_txs)

        # 6. Behavioral Intelligence Analysis
        behavioral_engine = BehavioralIntelligenceEngine()
        behavioral_result = behavioral_engine.analyze(
            graph=graph,
            transactions=norm_txs,
            subject=subject,
            get_entity_info=analysis_service._get_entity_info
        )

        # 7. BFS traversal for hop-depth & path analysis
        traverser = BFSTraverser(graph)
        order, visited, distance_map = traverser.bfs_traverse(subject, max_depth=4)
        distance = max(distance_map.values()) if distance_map else 0
        path = order if order else [subject]

        # 8. Multi-Factor Risk Scoring
        risk_scorer = RiskScorer(analysis_service._get_entity_info)
        risk_res = risk_scorer.calculate_risk(
            path=path,
            distance=distance,
            transactions=norm_txs,
            behavioral_findings=behavioral_result.findings
        )

        # 9. Format explainable signals strictly adhering to Section 3 contract
        signals = []
        for i, sig in enumerate(risk_res.signals):
            signals.append({
                "id": sig.id or f"RS-{i+1:02d}",
                "name": sig.description or sig.signal_type.replace("_", " ").title(),
                "score_contribution": round(sig.score, 1),
                "severity": sig.severity,
                "description": sig.reason or sig.description,
                "supporting_transaction_ids": [tx.transaction_hash for tx in norm_txs[:5]],
                "supporting_entities": [sig.entity] if sig.entity else ([subject] if subject else []),
                "observed_or_derived": "DERIVED"
            })

        return {
            "case_id": request.case_id,
            "subject": subject,
            "overall_score": round(risk_res.score, 1),
            "risk_level": risk_res.level,
            "signals": signals,
            "summary": {
                "signal_count": len(signals),
                "transaction_count": len(norm_txs)
            },
            "metadata": {
                "engine": "TRACEVAULT Multi-Factor Risk Intelligence",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "data_source": "PostgreSQL Normalized Case Transactions"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_case_risk for case {request.case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class CaseUPIAnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    case_id: str = Field(..., description="Unique case identifier")
    subject_vpa: Optional[str] = Field(default=None, description="Investigated subject VPA")
    transactions: List[Dict[str, Any]] = Field(default_factory=list, description="Normalized case UPI transactions from PostgreSQL")


@router.post("/api/v1/cases/upi-analyze")
def analyze_case_upi(request: CaseUPIAnalyzeRequest):
    """
    Executes explainable behavioral UPI fraud intelligence for an investigation case
    directly from PostgreSQL-persisted normalized UPI transactions.
    Rejects sensitive credentials, enforces deterministic scoring, and returns explainable findings.
    """
    try:
        # 1. Prohibited sensitive credential check
        for tx in request.transactions:
            if isinstance(tx, dict):
                for k in tx.keys():
                    if str(k).lower() in PROHIBITED_CREDENTIAL_KEYS:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Sensitive authentication credential '{k}' must not be submitted for UPI analysis."
                        )

        # 2. Empty transaction check -> deterministic baseline response
        if not request.transactions:
            return {
                "case_id": request.case_id,
                "subject_vpa": request.subject_vpa or "UNSPECIFIED",
                "risk_score": 0.0,
                "risk_level": "LOW",
                "findings": [],
                "analyzed_transactions": [],
                "features": {
                    "transaction_count": 0,
                    "total_volume": "₹0.00",
                    "avg_amount": "₹0.00",
                    "max_amount": "₹0.00",
                    "min_amount": "₹0.00",
                    "median_amount": "₹0.00",
                    "time_span_seconds": 0.0,
                    "velocity_tx_per_minute": 0.0,
                    "unique_beneficiaries": 0,
                    "failed_attempt_count": 0,
                    "new_beneficiary_count": 0,
                    "new_device_count": 0,
                    "has_baseline": False,
                    "pass_through_detected": False,
                    "known_beneficiaries": [],
                    "new_beneficiaries": []
                },
                "summary": {
                    "upi_transaction_count": 0,
                    "finding_count": 0
                },
                "metadata": {
                    "engine": "TRACEVAULT UPI Fraud Intelligence Engine",
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "data_source": "PostgreSQL Normalized Case Transactions"
                }
            }

        # 3. Normalize input transactions to canonical UPITransaction
        target_txs = []
        for i, tx in enumerate(request.transactions):
            upi_payload = {
                "transaction_id": tx.get("transaction_hash") or tx.get("id") or f"TX-UPI-{i+1:03d}",
                "sender_vpa": tx.get("from_address") or tx.get("sender") or tx.get("sender_vpa"),
                "receiver_vpa": tx.get("to_address") or tx.get("receiver") or tx.get("receiver_vpa"),
                "amount": tx.get("amount") or 0.0,
                "currency": tx.get("asset") or "INR",
                "timestamp": tx.get("timestamp"),
                "status": (tx.get("metadata", {}) or {}).get("status") or tx.get("status") or "SUCCESS",
                "transaction_type": tx.get("transaction_type") or "P2P",
                **(tx.get("metadata", {}) or {})
            }
            target_txs.append(UPITransactionNormalizer.normalize(upi_payload, default_source="case_normalized"))

        # 4. Resolve subject VPA
        subject = (request.subject_vpa or "").strip().lower()
        if not subject and target_txs:
            subject = target_txs[0].sender_vpa.lower()

        # 5. Execute pure deterministic behavioral UPI engine
        result = upi_engine.analyze(
            subject=subject,
            transactions=target_txs,
            baseline_transactions=None
        )

        # 6. Format findings adhering strictly to Section 9 contract
        findings_out = []
        for f in result.findings:
            findings_out.append({
                "rule_id": f.signal_id,
                "name": f.title,
                "signal_type": f.signal_type,
                "severity": f.severity,
                "score_contribution": round(f.risk_contribution, 1),
                "description": f.description,
                "reason": f.reason,
                "supporting_transaction_ids": f.transaction_ids,
                "affected_entities": f.affected_entities,
                "metrics": f.metrics,
                "observed_or_derived": "DERIVED"
            })

        return {
            "case_id": request.case_id,
            "subject_vpa": subject,
            "risk_score": round(result.risk.score, 1),
            "risk_level": result.risk.level,
            "findings": findings_out,
            "analyzed_transactions": [tx.to_dict() for tx in target_txs],
            "features": result.features.to_dict(),
            "reasoning_trace": result.reasoning_trace,
            "summary": {
                "upi_transaction_count": len(target_txs),
                "finding_count": len(findings_out)
            },
            "metadata": {
                "engine": "TRACEVAULT UPI Fraud Intelligence Engine",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "data_source": "PostgreSQL Normalized Case Transactions"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_case_upi for case {request.case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class CaseVaspAnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    case_id: str = Field(..., description="Unique case identifier")
    subject: Optional[str] = Field(default=None, description="Subject wallet address")
    max_hops: int = Field(default=5, ge=1, le=10, description="Maximum traversal hop distance for VASP candidate search")
    transactions: List[Dict[str, Any]] = Field(default_factory=list, description="Case blockchain transactions from PostgreSQL")


@router.post("/api/v1/cases/vasp-analyze")
def analyze_case_vasp(request: CaseVaspAnalyzeRequest):
    """
    Executes VASP attribution analysis on normalized blockchain transactions.
    Reuses NetworkX graph, BFSTraverser, and VaspIdentifier.
    Strictly characterizes relationships as 'Candidate VASP Association' / 'Potential VASP Association'.
    """
    try:
        # 1. Prohibited credential check
        check_prohibited_credentials(request.model_dump())

        # 2. Filter out non-blockchain/UPI transactions (VASP attribution consumes blockchain data)
        blockchain_txs = []
        for tx in request.transactions:
            rail = str(tx.get("blockchain") or tx.get("rail") or "ethereum").lower()
            if "upi" in rail:
                continue
            blockchain_txs.append(tx)

        # 3. Empty transaction check -> deterministic baseline
        if not blockchain_txs:
            return {
                "case_id": request.case_id,
                "subject": request.subject or "UNSPECIFIED",
                "candidates": [],
                "summary": {
                    "candidate_count": 0,
                    "blockchain_transaction_count": 0
                },
                "metadata": {
                    "engine": "TRACEVAULT NetworkX VaspIdentifier",
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "data_source": "DEMO / SYNTHETIC DATA"
                }
            }

        # 4. Resolve subject address
        subject = (request.subject or "").strip().lower()
        if not subject:
            first_tx = blockchain_txs[0]
            subject = str(first_tx.get("from_address") or first_tx.get("sender") or "").lower()

        # 5. Normalize transactions to CommonTransaction
        norm_txs = []
        for tx in blockchain_txs:
            norm_txs.append(CommonTransaction(
                transaction_hash=str(tx.get("transaction_hash") or tx.get("id") or ""),
                from_address=str(tx.get("from_address") or tx.get("sender") or "").lower(),
                to_address=str(tx.get("to_address") or tx.get("receiver") or "").lower(),
                blockchain=str(tx.get("blockchain") or tx.get("rail") or "ethereum").lower(),
                amount=float(tx.get("amount") or 0.0),
                asset=str(tx.get("asset") or "ETH"),
                timestamp=tx.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                block_number=tx.get("block_number"),
                transaction_type=str(tx.get("transaction_type") or "transfer"),
                source=str(tx.get("source") or "case_transactions"),
                metadata=tx.get("metadata") or {}
            ))

        # 6. Build graph and tag nodes from VaspRegistry
        graph_builder = TransactionGraphBuilder()
        graph = graph_builder.build_graph(norm_txs)

        for node_addr in graph.nodes:
            reg_entry = vasp_identifier.registry.lookup(node_addr)
            if reg_entry:
                graph_builder.tag_node(
                    address=node_addr,
                    entity_type=reg_entry.entity_type,
                    entity_name=reg_entry.entity_name,
                    risk_score=reg_entry.risk_score,
                    metadata={"vasp_name": reg_entry.vasp_name, "source": reg_entry.source}
                )

        # 7. Identify candidate VASP attributions
        candidate_tuples = vasp_identifier.identify_candidates(
            source_wallet=subject,
            graph=graph,
            max_hops=request.max_hops
        )

        candidates_out = []
        for idx, (attr, trace_path) in enumerate(candidate_tuples):
            # Extract supporting transaction IDs along the path
            supporting_tx_ids = [
                edge.transaction_hash for edge in trace_path.edges if edge.transaction_hash
            ]
            if not supporting_tx_ids:
                supporting_tx_ids = [
                    tx.transaction_hash for tx in norm_txs
                    if tx.to_address == attr.metadata.get("target_address") or tx.from_address == subject
                ]

            indicators = [
                {
                    "type": "ADDRESS_MATCH",
                    "description": f"Target address '{attr.metadata.get('target_address')}' matches registry record for '{attr.name}' ({attr.entity_type}).",
                    "observed_or_derived": "DERIVED"
                },
                {
                    "type": "GRAPH_RELATIONSHIP",
                    "description": f"Directed path distance: {attr.distance} hop(s) from subject wallet. Topological proximity rating: {attr.confidence_label}.",
                    "observed_or_derived": "DERIVED"
                },
                {
                    "type": "TRANSACTION_PATH",
                    "description": f"Transfer flow path: {' -> '.join(attr.path)}.",
                    "observed_or_derived": "DERIVED"
                }
            ]

            candidates_out.append({
                "vasp_id": f"vasp-{chr(97 + idx)}",
                "name": attr.name,
                "legal_entity": attr.metadata.get("entity_name") or attr.name,
                "entity_type": attr.entity_type,
                "association_confidence": round(attr.confidence / 100.0, 2),
                "confidence_percent": round(attr.confidence, 1),
                "confidence_label": attr.confidence_label,
                "hop_distance": attr.distance,
                "target_address": attr.metadata.get("target_address"),
                "path_sequence": attr.path,
                "indicators": indicators,
                "supporting_transaction_ids": supporting_tx_ids,
                "reasoning_trace": attr.metadata.get("reasoning_trace", []),
                "explanation": attr.explanation,
                "disclaimer": "Potential VASP association derived from available transaction and attribution indicators. Real-world legal attribution requires authorized disclosure."
            })

        return {
            "case_id": request.case_id,
            "subject": subject,
            "candidates": candidates_out,
            "summary": {
                "candidate_count": len(candidates_out),
                "blockchain_transaction_count": len(norm_txs)
            },
            "metadata": {
                "engine": "TRACEVAULT NetworkX VaspIdentifier",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "data_source": "DEMO / SYNTHETIC DATA"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_case_vasp for case {request.case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class CaseGeospatialAnalyzeRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    case_id: str = Field(..., description="Unique case identifier")
    subject: Optional[str] = Field(default=None, description="Subject identifier or VPA")
    location_signals: List[Dict[str, Any]] = Field(default_factory=list, description="Available location signal observations")
    baseline_locations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional baseline location signals")


@router.post("/api/v1/cases/geospatial-analyze")
def analyze_case_geospatial(request: CaseGeospatialAnalyzeRequest):
    """
    Executes geospatial anomaly analysis on available location signals.
    Strictly characterizes anomalies as 'Location Inconsistency' or 'Unusual Location Pattern'.
    Does NOT assert physical presence, live tracking, or identity.
    """
    try:
        # 1. Prohibited credential check
        check_prohibited_credentials(request.model_dump())

        clean_subject = (request.subject or "").strip().lower() or "UNSPECIFIED"

        # 2. Empty location signal check -> deterministic baseline response
        if not request.location_signals:
            return {
                "case_id": request.case_id,
                "subject": clean_subject,
                "findings": [],
                "location_signals": [],
                "summary": {
                    "finding_count": 0,
                    "location_signal_count": 0
                },
                "metadata": {
                    "engine": "TRACEVAULT GeospatialIntelligenceEngine",
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "data_source": "DEMO / SYNTHETIC DATA"
                }
            }

        # 3. Parse input signals into LocationSignal instances (enforces coordinate and credential validation)
        signals: List[LocationSignal] = []
        for s in request.location_signals:
            signals.append(LocationSignal(**s))

        baseline_signals: Optional[List[LocationSignal]] = None
        if request.baseline_locations:
            baseline_signals = [LocationSignal(**b) for b in request.baseline_locations]

        # 4. Execute deterministic GeospatialIntelligenceEngine
        result = geo_engine.analyze(
            subject=clean_subject,
            locations=signals,
            baseline_locations=baseline_signals
        )

        # 5. Format findings with strict observed vs derived semantics
        findings_out = []
        for f in result.findings:
            # Investigator-facing primary label uses Location Inconsistency
            loc_signal_ids = [
                str(lr.get("source_reference") or lr.get("id") or "")
                for lr in f.location_references if isinstance(lr, dict)
            ]
            if not loc_signal_ids:
                loc_signal_ids = [
                    s.source_reference or f"GEO-SIG-{idx+1:03d}"
                    for idx, s in enumerate(signals)
                ]

            findings_out.append({
                "id": f.signal_id,
                "type": "LOCATION_INCONSISTENCY" if "TRAVEL" in f.signal_type or "INCONSISTENCY" in f.signal_type else f.signal_type,
                "signal_type": f.signal_type,
                "name": f.title,
                "severity": f.severity,
                "confidence": round(f.confidence, 2),
                "description": f.description,
                "supporting_transaction_ids": f.transaction_ids,
                "supporting_location_signal_ids": [sid for sid in loc_signal_ids if sid],
                "metrics": f.metrics,
                "observed_or_derived": "DERIVED"
            })

        # 6. Format location signals with OBSERVED semantics
        signals_out = []
        for idx, s in enumerate(signals):
            signals_out.append({
                "id": s.source_reference or f"GEO-SIG-{idx+1:03d}",
                "timestamp": s.timestamp,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "accuracy_meters": s.accuracy_meters,
                "city": s.city,
                "region": s.region,
                "country_code": s.country_code,
                "source": s.source or "DEMO / SYNTHETIC",
                "transaction_id": s.transaction_id,
                "entity_reference": s.entity_reference,
                "observed_or_derived": "OBSERVED"
            })

        return {
            "case_id": request.case_id,
            "subject": clean_subject,
            "findings": findings_out,
            "location_signals": signals_out,
            "risk_score": round(result.risk.score, 1),
            "risk_level": result.risk.level,
            "features": result.features.to_dict(),
            "reasoning_trace": result.reasoning_trace,
            "summary": {
                "finding_count": len(findings_out),
                "location_signal_count": len(signals_out)
            },
            "disclaimer": "Location signals represent analytical correlation data points, not proof of personal physical presence, identity, or device ownership.",
            "metadata": {
                "engine": "TRACEVAULT GeospatialIntelligenceEngine",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "data_source": "DEMO / SYNTHETIC DATA"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in analyze_case_geospatial for case {request.case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))




