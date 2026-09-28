import re
from typing import List, Set
from app.investigation.models import (
    InvestigationPlan,
    InvestigationPlanStep,
    InvestigationRequest,
    RailScope,
)

ETH_PATTERN = re.compile(r"^0x[a-fA-F0-9]{40}$")


class InvestigationPlanner:
    """
    Deterministic investigation planning service.
    Formulates a structured execution plan identifying required rails, data sources,
    and intelligence engines prior to orchestrator execution.
    """

    @classmethod
    def detect_subject_type(cls, subject_id: str, requested_type: str = "auto") -> str:
        clean = subject_id.strip()
        if requested_type and requested_type.lower() != "auto":
            return requested_type.lower()
        if ETH_PATTERN.match(clean):
            return "wallet"
        if "@" in clean:
            return "upi_vpa"
        if clean.lower().startswith("merch_") or clean.lower().startswith("merchant"):
            return "merchant"
        if clean.lower().startswith("case-") or clean.lower().startswith("inv-"):
            return "case"
        return "entity"

    @classmethod
    def build_plan(cls, request: InvestigationRequest) -> InvestigationPlan:
        subject_id = request.subject_id.strip()
        subject_type = cls.detect_subject_type(subject_id, request.subject_type)
        scope = request.rail_scope.upper()

        rails_involved: Set[str] = set()
        sources_required: Set[str] = set()
        engines_required: Set[str] = set()
        steps: List[InvestigationPlanStep] = []

        step_counter = 1

        # Step 1: Ingestion and Scope Definition
        steps.append(
            InvestigationPlanStep(
                step_number=step_counter,
                step_name="SUBJECT_DISCOVERY_AND_NORMALIZATION",
                engine="Normalizer",
                rail="MULTI_RAIL",
                data_source="INVESTIGATOR_REQUEST",
                required=True,
                description=f"Validate and normalize subject '{subject_id}' of type '{subject_type}'.",
            )
        )
        step_counter += 1

        # Check rail requirements
        needs_crypto = request.include_crypto and (
            scope in (RailScope.CRYPTO.value, RailScope.MULTI_RAIL.value, RailScope.ALL.value)
            or subject_type == "wallet"
        )
        needs_upi = request.include_upi and (
            scope in (RailScope.UPI.value, RailScope.MULTI_RAIL.value, RailScope.ALL.value)
            or subject_type in ("upi_vpa", "merchant")
        )
        needs_geo = request.include_geospatial and (
            scope in (RailScope.GEOSPATIAL.value, RailScope.MULTI_RAIL.value, RailScope.ALL.value)
            or (request.location_signals is not None and len(request.location_signals) > 0)
        )

        if needs_crypto:
            rails_involved.add("CRYPTO")
            sources_required.add("LIVE_INDEXER" if request.live_mode else "BLOCKCHAIN_ADAPTER")
            engines_required.add("AnalysisService")
            steps.append(
                InvestigationPlanStep(
                    step_number=step_counter,
                    step_name="CRYPTO_INTELLIGENCE_ANALYSIS",
                    engine="AnalysisService",
                    rail="CRYPTO",
                    data_source="LIVE_INDEXER" if request.live_mode else "BLOCKCHAIN_ADAPTER",
                    required=True,
                    description="Execute transaction graph traversal, peeling-chain detection, and VASP attribution.",
                )
            )
            step_counter += 1

        if needs_upi:
            rails_involved.add("UPI")
            sources_required.add("UPI_PAYMENT_ADAPTER")
            engines_required.add("UPIFraudIntelligenceEngine")
            steps.append(
                InvestigationPlanStep(
                    step_number=step_counter,
                    step_name="UPI_FRAUD_INTELLIGENCE_ANALYSIS",
                    engine="UPIFraudIntelligenceEngine",
                    rail="UPI",
                    data_source="UPI_PAYMENT_ADAPTER",
                    required=True,
                    description="Execute explainable rule-based UPI fraud detection, velocity, and mule pattern scans.",
                )
            )
            step_counter += 1

        if needs_geo:
            rails_involved.add("GEOSPATIAL")
            sources_required.add("LOCATION_SIGNAL_PROVIDER")
            engines_required.add("GeospatialIntelligenceEngine")
            steps.append(
                InvestigationPlanStep(
                    step_number=step_counter,
                    step_name="GEOSPATIAL_INTELLIGENCE_ANALYSIS",
                    engine="GeospatialIntelligenceEngine",
                    rail="GEOSPATIAL",
                    data_source="LOCATION_SIGNAL_PROVIDER",
                    required=False,
                    description="Analyze transaction-associated location signals for impossible travel and anomalies.",
                )
            )
            step_counter += 1

        # Step: Unified Multi-Rail Graph
        rails_involved.add("CROSS_RAIL")
        engines_required.add("UnifiedGraphEngine")
        steps.append(
            InvestigationPlanStep(
                step_number=step_counter,
                step_name="UNIFIED_MULTI_RAIL_GRAPH_ASSEMBLY",
                engine="UnifiedGraphEngine",
                rail="CROSS_RAIL",
                data_source="UNIFIED_GRAPH_REGISTRY",
                required=True,
                description="Construct canonical NetworkX multi-rail graph, integrate cross-rail bridges, and compute paths.",
            )
        )
        step_counter += 1

        # Step: Risk Aggregation
        engines_required.add("RiskAggregator")
        steps.append(
            InvestigationPlanStep(
                step_number=step_counter,
                step_name="MULTI_DOMAIN_RISK_AGGREGATION",
                engine="RiskAggregator",
                rail="MULTI_RAIL",
                data_source="INTELLIGENCE_RESULTS",
                required=True,
                description="Synthesize crypto, UPI, geospatial, and attribution scores into an investigative priority score.",
            )
        )
        step_counter += 1

        # Step: Timeline Construction
        if request.include_timeline:
            engines_required.add("TimelineBuilder")
            steps.append(
                InvestigationPlanStep(
                    step_number=step_counter,
                    step_name="TIMELINE_CHRONOLOGY_SYNTHESIS",
                    engine="TimelineBuilder",
                    rail="MULTI_RAIL",
                    data_source="INTELLIGENCE_RESULTS",
                    required=True,
                    description="Aggregate chronological multi-rail event sequence without inventing timestamps.",
                )
            )
            step_counter += 1

        # Step: Evidence Linking
        if request.include_evidence:
            engines_required.add("EvidenceLinker")
            steps.append(
                InvestigationPlanStep(
                    step_number=step_counter,
                    step_name="EVIDENTIARY_CHAIN_LINKING",
                    engine="EvidenceLinker",
                    rail="MULTI_RAIL",
                    data_source="INTELLIGENCE_RESULTS",
                    required=True,
                    description="Link and categorize all supporting evidentiary items for review.",
                )
            )
            step_counter += 1

        # Step: Packaging & Sanitization
        steps.append(
            InvestigationPlanStep(
                step_number=step_counter,
                step_name="INVESTIGATION_RESULT_FINALIZATION",
                engine="InvestigationOrchestrator",
                rail="MULTI_RAIL",
                data_source="INTELLIGENCE_RESULTS",
                required=True,
                description="Perform credential sanitization, compile reasoning trace, and package final result.",
            )
        )

        inv_id = request.investigation_id or f"INV-{request.case_id}-{subject_id[:8]}"
        plan_id = f"PLAN-{inv_id}"

        return InvestigationPlan(
            plan_id=plan_id,
            investigation_id=inv_id,
            case_id=request.case_id,
            subject_id=subject_id,
            subject_type=subject_type,
            rail_scope=scope,
            steps=steps,
            rails_involved=sorted(list(rails_involved)),
            sources_required=sorted(list(sources_required)),
            engines_required=sorted(list(engines_required)),
        )
