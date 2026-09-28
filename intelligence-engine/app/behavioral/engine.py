from datetime import datetime, timezone
import logging
from typing import Any, Callable, Dict, List, Optional, Set
import networkx as nx

from app.behavioral.models import (
    BehavioralAnalysisResult,
    BehavioralFinding,
    BehavioralPatternType,
)
from app.models.transaction import CommonTransaction

logger = logging.getLogger(__name__)


def _parse_iso_timestamp(ts_str: str) -> Optional[float]:
    """Parse ISO timestamp string or epoch integer to unix timestamp seconds float."""
    if not ts_str:
        return None
    try:
        # Check if already a numeric string
        return float(ts_str)
    except ValueError:
        pass
    try:
        # Clean ISO 8601 string
        clean_ts = ts_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_ts)
        return dt.timestamp()
    except Exception:
        return None


class BehavioralIntelligenceEngine:
    """
    Graph-Based Behavioral Intelligence Engine for TRACEVAULT V2.
    Analyzes NetworkX transaction directed graphs and normalized transactions for:
    - Fan-in (aggregation from multiple sources)
    - Fan-out (dispersion to multiple destinations)
    - Peel-chain (asymmetric fund peeling with change addresses)
    - Rapid dispersion (high velocity / automated forward pass-through)
    - Consolidation (mule collection into master wallet)
    - Circular flow (directed cycles / round-trip wash flows)
    - Mixer interaction (privacy protocol / tumbling pool exposure)
    - VASP entry/exit (custodial off-ramp / on-ramp gateway crossing)
    - Temporal behavior (burst timing, frequency, and dormancy)
    """

    def __init__(self):
        pass

    def analyze(
        self,
        graph: nx.DiGraph,
        transactions: List[CommonTransaction],
        subject: str,
        get_entity_info: Callable[[str], Optional[Dict[str, Any]]],
    ) -> BehavioralAnalysisResult:
        """
        Executes complete behavioral intelligence suite over transaction graph.
        """
        findings: List[BehavioralFinding] = []
        subject_clean = subject.strip().lower()

        # 1. Circular Flow (Cycle detection)
        circular_findings = self._detect_circular_flow(graph, subject_clean)
        findings.extend(circular_findings)

        # 2. Fan-in (Aggregation)
        fan_in_findings = self._detect_fan_in(graph, subject_clean)
        findings.extend(fan_in_findings)

        # 3. Fan-out (Dispersion)
        fan_out_findings = self._detect_fan_out(graph, subject_clean)
        findings.extend(fan_out_findings)

        # 4. Peel-chain Detection
        peel_findings = self._detect_peel_chain(graph, transactions, subject_clean)
        findings.extend(peel_findings)

        # 5. Consolidation Detection
        consolidation_findings = self._detect_consolidation(graph, transactions, subject_clean)
        findings.extend(consolidation_findings)

        # 6. Rapid Dispersion / Velocity
        rapid_findings = self._detect_rapid_dispersion(graph, transactions, subject_clean)
        findings.extend(rapid_findings)

        # 7. Mixer Interaction Detection
        mixer_findings = self._detect_mixer_interaction(graph, subject_clean, get_entity_info)
        findings.extend(mixer_findings)

        # 8. VASP Entry / Exit
        vasp_findings = self._detect_vasp_entry_exit(graph, subject_clean, get_entity_info)
        findings.extend(vasp_findings)

        # 9. Temporal Behavior (Bursts / Frequency)
        temporal_findings = self._detect_temporal_behavior(transactions, subject_clean)
        findings.extend(temporal_findings)

        # Assign unique sequential finding IDs
        for idx, f in enumerate(findings, start=1):
            f.id = f"BF-{idx:02d}"

        patterns_detected = sorted(list({f.pattern_type for f in findings}))

        # Generate summary metrics
        max_in_deg = max([graph.in_degree(n) for n in graph.nodes] or [0])
        max_out_deg = max([graph.out_degree(n) for n in graph.nodes] or [0])
        metrics = {
            "node_count": graph.number_of_nodes(),
            "edge_count": graph.number_of_edges(),
            "max_in_degree": max_in_deg,
            "max_out_degree": max_out_deg,
            "patterns_detected_count": len(patterns_detected),
            "findings_count": len(findings),
        }

        # Formulate executive narrative
        if findings:
            pattern_titles = [f.title for f in findings]
            summary = (
                f"Behavioral intelligence identified {len(findings)} typological pattern(s): "
                f"{'; '.join(pattern_titles[:3])}{'...' if len(pattern_titles) > 3 else ''}."
            )
        else:
            summary = "No anomalous graph topologies or suspicious behavioral patterns identified."

        return BehavioralAnalysisResult(
            findings=findings,
            patterns_detected=patterns_detected,
            metrics=metrics,
            summary=summary,
        )

    # -----------------------------------------------------------------------
    # Pattern 1: Circular Flow (Cycles in directed graph)
    # -----------------------------------------------------------------------
    def _detect_circular_flow(self, graph: nx.DiGraph, subject: str) -> List[BehavioralFinding]:
        findings = []
        try:
            cycles = list(nx.simple_cycles(graph))
            for cycle in cycles:
                if len(cycle) >= 2:
                    cycle_str = " -> ".join([str(n) for n in cycle] + [str(cycle[0])])
                    findings.append(
                        BehavioralFinding(
                            id="",
                            pattern_type=BehavioralPatternType.CIRCULAR_FLOW,
                            title="Circular Transaction Flow / Wash Loop",
                            severity="CRITICAL",
                            risk_contribution=35.0,
                            confidence=95.0,
                            subject=subject,
                            involved_addresses=[str(n) for n in cycle],
                            description=f"Closed circular transaction cycle detected across {len(cycle)} nodes: {cycle_str}",
                            reason="Circular routing is a recognized typology for wash trading, artificial volume inflation, or round-trip laundering.",
                            metrics={"cycle_length": len(cycle), "cycle": [str(n) for n in cycle]},
                        )
                    )
        except Exception as exc:
            logger.debug(f"Cycle detection encountered error: {exc}")
        return findings

    # -----------------------------------------------------------------------
    # Pattern 2: Fan-in (Aggregation / Collection)
    # -----------------------------------------------------------------------
    def _detect_fan_in(self, graph: nx.DiGraph, subject: str) -> List[BehavioralFinding]:
        findings = []
        for node in graph.nodes:
            in_edges = list(graph.in_edges(node, data=True))
            sources = list({u for u, _, _ in in_edges})
            if len(sources) >= 3:
                total_in_amount = sum(d.get("total_amount", 0.0) for _, _, d in in_edges)
                severity = "HIGH" if len(sources) >= 5 else "MEDIUM"
                risk_pts = 20.0 if len(sources) >= 5 else 15.0
                findings.append(
                    BehavioralFinding(
                        id="",
                        pattern_type=BehavioralPatternType.FAN_IN,
                        title=f"Fan-In Aggregation ({len(sources)} Sources)",
                        severity=severity,
                        risk_contribution=risk_pts,
                        confidence=90.0,
                        subject=str(node),
                        involved_addresses=[str(s) for s in sources] + [str(node)],
                        description=f"Node {node} aggregates incoming funds from {len(sources)} distinct sender addresses (Total: {total_in_amount:.4f}).",
                        reason="Multi-source aggregation into a single central node is characteristic of mule collection or payment gathering.",
                        metrics={"in_degree": len(sources), "total_amount": total_in_amount},
                    )
                )
        return findings

    # -----------------------------------------------------------------------
    # Pattern 3: Fan-out (Dispersion / Layering)
    # -----------------------------------------------------------------------
    def _detect_fan_out(self, graph: nx.DiGraph, subject: str) -> List[BehavioralFinding]:
        findings = []
        for node in graph.nodes:
            out_edges = list(graph.out_edges(node, data=True))
            destinations = list({v for _, v, _ in out_edges})
            if len(destinations) >= 3:
                total_out_amount = sum(d.get("total_amount", 0.0) for _, _, d in out_edges)
                severity = "HIGH" if len(destinations) >= 5 else "MEDIUM"
                risk_pts = 20.0 if len(destinations) >= 5 else 15.0
                findings.append(
                    BehavioralFinding(
                        id="",
                        pattern_type=BehavioralPatternType.FAN_OUT,
                        title=f"Fan-Out Dispersion ({len(destinations)} Destinations)",
                        severity=severity,
                        risk_contribution=risk_pts,
                        confidence=90.0,
                        subject=str(node),
                        involved_addresses=[str(node)] + [str(d) for d in destinations],
                        description=f"Node {node} distributes funds out to {len(destinations)} distinct destination addresses (Total: {total_out_amount:.4f}).",
                        reason="Rapid fund dispersion across multiple downstream wallets is a standard structuring and layering mechanism.",
                        metrics={"out_degree": len(destinations), "total_amount": total_out_amount},
                    )
                )
        return findings

    # -----------------------------------------------------------------------
    # Pattern 4: Peel-chain Detection
    # -----------------------------------------------------------------------
    def _detect_peel_chain(
        self,
        graph: nx.DiGraph,
        transactions: List[CommonTransaction],
        subject: str,
    ) -> List[BehavioralFinding]:
        findings = []
        # Group outbound transactions by sender
        for node in graph.nodes:
            out_edges = list(graph.out_edges(node, data=True))
            if len(out_edges) == 2:
                amounts = [d.get("total_amount", 0.0) for _, _, d in out_edges]
                total = sum(amounts)
                if total > 0:
                    max_amt = max(amounts)
                    ratio = max_amt / total
                    # If one recipient receives 65-95% and the other receives 5-35%
                    if 0.65 <= ratio <= 0.98:
                        destinations = [str(v) for _, v, _ in out_edges]
                        findings.append(
                            BehavioralFinding(
                                id="",
                                pattern_type=BehavioralPatternType.PEEL_CHAIN,
                                title="Peel-Chain Layering Split",
                                severity="HIGH",
                                risk_contribution=20.0,
                                confidence=85.0,
                                subject=str(node),
                                involved_addresses=[str(node)] + destinations,
                                description=(
                                    f"Node {node} exhibits peel-chain splitting: {ratio * 100:.1f}% forwarded to primary continuation, "
                                    f"while remainder is peeled off to a secondary address."
                                ),
                                reason="Peel chains repeatedly peel off small amounts to merchants/exchanges while forwarding bulk change to fresh addresses.",
                                metrics={"dominant_ratio": round(ratio, 4), "total_split_amount": total},
                            )
                        )
        return findings

    # -----------------------------------------------------------------------
    # Pattern 5: Consolidation (Mule collection to exit point)
    # -----------------------------------------------------------------------
    def _detect_consolidation(
        self,
        graph: nx.DiGraph,
        transactions: List[CommonTransaction],
        subject: str,
    ) -> List[BehavioralFinding]:
        findings = []
        for node in graph.nodes:
            in_edges = list(graph.in_edges(node, data=True))
            out_edges = list(graph.out_edges(node, data=True))
            if len(in_edges) >= 2 and len(out_edges) == 1:
                total_in = sum(d.get("total_amount", 0.0) for _, _, d in in_edges)
                total_out = sum(d.get("total_amount", 0.0) for _, _, d in out_edges)
                dest = out_edges[0][1]
                sources = [u for u, _, _ in in_edges]
                if total_in > 0 and (total_out / total_in) >= 0.70:
                    findings.append(
                        BehavioralFinding(
                            id="",
                            pattern_type=BehavioralPatternType.CONSOLIDATION,
                            title="Fund Consolidation & Sweep",
                            severity="MEDIUM",
                            risk_contribution=15.0,
                            confidence=85.0,
                            subject=str(node),
                            involved_addresses=[str(s) for s in sources] + [str(node), str(dest)],
                            description=(
                                f"Node {node} consolidated {total_in:.4f} from {len(sources)} sources "
                                f"and swept {total_out:.4f} ({total_out / total_in * 100:.1f}%) forward to {dest}."
                            ),
                            reason="Consolidation nodes gather fragmented illicit gains before executing bulk transfers or exchange deposits.",
                            metrics={"source_count": len(sources), "sweep_ratio": round(total_out / total_in, 4)},
                        )
                    )
        return findings

    # -----------------------------------------------------------------------
    # Pattern 6: Rapid Dispersion / Fast Transit
    # -----------------------------------------------------------------------
    def _detect_rapid_dispersion(
        self,
        graph: nx.DiGraph,
        transactions: List[CommonTransaction],
        subject: str,
    ) -> List[BehavioralFinding]:
        findings = []
        # Build map of incoming and outgoing tx timestamps per address
        in_times: Dict[str, List[float]] = {}
        out_times: Dict[str, List[float]] = {}

        for tx in transactions:
            ts = _parse_iso_timestamp(tx.timestamp)
            if ts is not None:
                src = tx.from_address.lower()
                dst = tx.to_address.lower()
                out_times.setdefault(src, []).append(ts)
                in_times.setdefault(dst, []).append(ts)

        for addr, incoming in in_times.items():
            outgoing = out_times.get(addr, [])
            if incoming and outgoing:
                min_in = min(incoming)
                # Check for outgoing transfer shortly after incoming
                for out_t in outgoing:
                    delta = out_t - min_in
                    if 0 <= delta <= 3600:  # Within 1 hour
                        findings.append(
                            BehavioralFinding(
                                id="",
                                pattern_type=BehavioralPatternType.RAPID_DISPERSION,
                                title="Rapid Dispersion / Fast Passthrough",
                                severity="HIGH",
                                risk_contribution=20.0,
                                confidence=85.0,
                                subject=addr,
                                involved_addresses=[addr],
                                description=f"Address {addr} forwarded received funds within {int(delta)} seconds ({delta / 60:.1f} mins).",
                                reason="Immediate forwarding of incoming funds indicates automated pass-through or money mule accounts.",
                                metrics={"delta_seconds": int(delta)},
                            )
                        )
                        break  # Report once per node
        return findings

    # -----------------------------------------------------------------------
    # Pattern 7: Mixer Interaction
    # -----------------------------------------------------------------------
    def _detect_mixer_interaction(
        self,
        graph: nx.DiGraph,
        subject: str,
        get_entity_info: Callable[[str], Optional[Dict[str, Any]]],
    ) -> List[BehavioralFinding]:
        findings = []
        for node in graph.nodes:
            info = get_entity_info(str(node))
            if info and str(info.get("type", "")).upper() == "MIXER":
                is_direct = graph.has_edge(subject, node) or graph.has_edge(node, subject)
                severity = "CRITICAL" if is_direct else "HIGH"
                pts = 30.0 if is_direct else 20.0
                name = info.get("name") or "Privacy Mixer Protocol"
                findings.append(
                    BehavioralFinding(
                        id="",
                        pattern_type=BehavioralPatternType.MIXER_INTERACTION,
                        title=f"Privacy Mixer Exposure ({name})",
                        severity=severity,
                        risk_contribution=pts,
                        confidence=98.0,
                        subject=str(node),
                        involved_addresses=[subject, str(node)],
                        description=f"Direct or near-hop interaction with privacy mixer {name} ({node}).",
                        reason="Mixer and tumbler interactions deliberately break blockchain transaction graphs to obfuscate asset provenance.",
                        metrics={"mixer_name": name, "direct_exposure": is_direct},
                    )
                )
        return findings

    # -----------------------------------------------------------------------
    # Pattern 8: VASP Entry / Exit
    # -----------------------------------------------------------------------
    def _detect_vasp_entry_exit(
        self,
        graph: nx.DiGraph,
        subject: str,
        get_entity_info: Callable[[str], Optional[Dict[str, Any]]],
    ) -> List[BehavioralFinding]:
        findings = []
        for node in graph.nodes:
            info = get_entity_info(str(node))
            if info:
                etype = str(info.get("type", "")).upper()
                if etype in ("DEPOSIT_WALLET", "VASP", "EXCHANGE", "EXCHANGE_HOT_WALLET"):
                    name = info.get("name") or "Virtual Asset Service Provider"
                    # Inbound to VASP = Off-ramp exit
                    in_edges = list(graph.in_edges(node))
                    out_edges = list(graph.out_edges(node))
                    if in_edges:
                        senders = [str(u) for u, _ in in_edges]
                        findings.append(
                            BehavioralFinding(
                                id="",
                                pattern_type=BehavioralPatternType.VASP_ENTRY_EXIT,
                                title=f"VASP Deposit / Off-Ramp Gateway ({name})",
                                severity="LOW",
                                risk_contribution=5.0,
                                confidence=95.0,
                                subject=str(node),
                                involved_addresses=senders + [str(node)],
                                description=f"Fund flow terminates at known exchange deposit/custody address for {name}.",
                                reason="VASP deposit wallets represent the liquidation/cashing-out boundary where legal disclosure can unmask the account holder.",
                                metrics={"vasp_name": name, "gateway_type": "OFF_RAMP_DEPOSIT"},
                            )
                        )
                    if out_edges:
                        receivers = [str(v) for _, v in out_edges]
                        findings.append(
                            BehavioralFinding(
                                id="",
                                pattern_type=BehavioralPatternType.VASP_ENTRY_EXIT,
                                title=f"VASP Disbursement / On-Ramp ({name})",
                                severity="LOW",
                                risk_contribution=5.0,
                                confidence=95.0,
                                subject=str(node),
                                involved_addresses=[str(node)] + receivers,
                                description=f"Fund flow originates from exchange hot wallet or custody for {name}.",
                                reason="On-ramp withdrawals identify the initial exchange or custody source where funds originated.",
                                metrics={"vasp_name": name, "gateway_type": "ON_RAMP_WITHDRAWAL"},
                            )
                        )
        return findings

    # -----------------------------------------------------------------------
    # Pattern 9: Temporal Behavior (Burst Timing & Velocity)
    # -----------------------------------------------------------------------
    def _detect_temporal_behavior(
        self,
        transactions: List[CommonTransaction],
        subject: str,
    ) -> List[BehavioralFinding]:
        findings = []
        if len(transactions) >= 3:
            timestamps = []
            for tx in transactions:
                ts = _parse_iso_timestamp(tx.timestamp)
                if ts is not None:
                    timestamps.append(ts)
            timestamps.sort()

            if len(timestamps) >= 3:
                time_span = timestamps[-1] - timestamps[0]
                # If 3+ transactions occur within 300 seconds (5 minutes)
                if time_span <= 300:
                    findings.append(
                        BehavioralFinding(
                            id="",
                            pattern_type=BehavioralPatternType.TEMPORAL_BEHAVIOR,
                            title="High-Frequency Temporal Burst",
                            severity="MEDIUM",
                            risk_contribution=10.0,
                            confidence=85.0,
                            subject=subject,
                            involved_addresses=[subject],
                            description=f"Observed burst activity: {len(timestamps)} transactions executed within {int(time_span)}s ({time_span / 60:.1f} mins).",
                            reason="High-frequency burst transfers strongly correlate with algorithmic execution or hurried asset dispersal.",
                            metrics={"time_span_seconds": int(time_span), "tx_count": len(timestamps)},
                        )
                    )
        return findings
