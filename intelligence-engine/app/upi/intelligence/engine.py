from datetime import datetime, timezone
from decimal import Decimal
import logging
from typing import Any, Dict, List, Optional

from app.models.analysis import EvidenceItem, RiskResult, RiskSignal
from app.upi.intelligence.features import UPIFeatureExtractor
from app.upi.intelligence.models import (
    UPIFeatures,
    UPIFraudAnalysisResult,
    UPIFraudFinding,
)
from app.upi.intelligence.rules import (
    ALL_RULES,
    BaseUPIRule,
    UPIRuleConfig,
)
from app.upi.models import UPITransaction

logger = logging.getLogger(__name__)


class UPIFraudIntelligenceEngine:
    """
    Deterministic, explainable rule-based risk engine for UPI transactions.
    Extracts behavioral features, executes pure detection rules, aggregates
    canonical risk scores, and generates verifiable evidentiary traces.
    """

    def __init__(
        self,
        rules: Optional[List[BaseUPIRule]] = None,
        config: Optional[UPIRuleConfig] = None,
    ):
        self.rules: List[BaseUPIRule] = rules if rules is not None else list(ALL_RULES)
        self.config: UPIRuleConfig = config or UPIRuleConfig()

    def analyze(
        self,
        subject: str,
        transactions: List[UPITransaction],
        baseline_transactions: Optional[List[UPITransaction]] = None,
        config: Optional[UPIRuleConfig] = None,
    ) -> UPIFraudAnalysisResult:
        """
        Executes end-to-end UPI fraud intelligence analysis.
        Strictly deterministic: identical inputs yield identical outputs.
        """
        active_config = config or self.config
        clean_subject = subject.strip().lower()

        # Step 1: Feature Extraction
        features: UPIFeatures = UPIFeatureExtractor.extract(
            current_transactions=transactions,
            baseline_transactions=baseline_transactions,
            subject=clean_subject,
        )

        # Step 2: Pure Rule Evaluation
        findings: List[UPIFraudFinding] = []
        seen_types = set()

        for rule in self.rules:
            try:
                finding = rule.evaluate(
                    transactions=transactions,
                    features=features,
                    subject=clean_subject,
                    config=active_config,
                )
                if finding and finding.signal_type not in seen_types:
                    findings.append(finding)
                    seen_types.add(finding.signal_type)
            except Exception as e:
                logger.error(f"Rule {rule.signal_type} failed: {e}", exc_info=True)

        # Step 3: Canonical Risk Aggregation
        raw_score = sum(f.risk_contribution for f in findings)
        total_score = min(100.0, max(0.0, float(raw_score)))

        if total_score <= 30.0:
            level = "LOW"
        elif total_score <= 60.0:
            level = "MEDIUM"
        elif total_score <= 80.0:
            level = "HIGH"
        else:
            level = "CRITICAL"

        if findings:
            explanation = (
                f"Potential fraud-risk signals detected. Evaluated risk level is {level} "
                f"(Score: {total_score:.1f}/100) across {len(findings)} behavioral indicator(s). "
                f"Requires investigator review."
            )
        else:
            explanation = (
                f"No elevated fraud-risk signals detected (Score: {total_score:.1f}/100). "
                f"Transaction behavior conforms to standard operational parameters."
            )

        risk_signals: List[RiskSignal] = [f.to_risk_signal() for f in findings]
        indicators: List[str] = [f"{f.title}: {f.reason}" for f in findings]

        risk_result = RiskResult(
            score=total_score,
            level=level,
            signals=risk_signals,
            indicators=indicators,
            explanation=explanation,
            metadata={
                "signal_count": len(findings),
                "rail": "upi",
                "has_baseline": features.has_baseline,
                "rule_version": "v1.0.0-deterministic",
            },
        )

        # Step 4: Canonical Evidentiary Items Synthesis
        most_recent_ts = transactions[-1].timestamp if transactions else datetime.now(timezone.utc).isoformat()
        evidence_items: List[EvidenceItem] = [
            f.to_evidence_item(timestamp=most_recent_ts) for f in findings
        ]

        # Step 5: Deterministic 14-Step Reasoning Trace
        baseline_count = len(baseline_transactions) if baseline_transactions else 0
        step_2_msg = (
            f"Step 2: Evaluated baseline profile ({baseline_count} historical transaction(s) available)"
            if features.has_baseline
            else "Step 2: Evaluated baseline profile (no historical records available - baseline comparisons disabled)"
        )

        reasoning_trace: List[str] = [
            f"Step 1: Ingested {len(transactions)} target transaction(s) for subject '{clean_subject}'",
            step_2_msg,
            f"Step 3: Extracted transactional features (volume: INR {features.total_volume}, count: {features.transaction_count}, unique counterparties: {features.unique_beneficiaries})",
            f"Step 4: Evaluated beneficiary novelty against baseline profile ({features.new_beneficiary_count} new counterparty/counterparties)",
            f"Step 5: Computed transaction velocity across sliding time windows ({features.velocity_tx_per_minute:.1f} tx/min)",
            "Step 6: Analyzed rapid succession transaction burst patterns",
            f"Step 7: Evaluated monetary deviation relative to baseline spending behavior (peak: INR {features.max_amount})",
            f"Step 8: Inspected transaction status codes for failed authentication or authorization patterns ({features.failed_attempt_count} failed attempt(s))",
            f"Step 9: Checked client device identifiers against known device references ({features.new_device_count} new device reference(s))",
            "Step 10: Evaluated temporal execution distribution against baseline active hours",
            "Step 11: Checked multi-beneficiary dispersion patterns (beneficiary burst)",
            "Step 12: Evaluated combined high-value velocity risk factors",
            f"Step 13: Analyzed pass-through flow dynamics (inflow to outflow velocity: {'detected' if features.pass_through_detected else 'not detected'})",
            f"Step 14: Synthesized {len(findings)} fraud risk signal(s) into canonical risk score ({total_score:.1f}/100, level: {level}) and {len(evidence_items)} evidence item(s)",
        ]

        return UPIFraudAnalysisResult(
            subject=clean_subject,
            analyzed_transactions=transactions,
            features=features,
            findings=findings,
            risk=risk_result,
            evidence=evidence_items,
            reasoning_trace=reasoning_trace,
            data_source="mock_upi",
            baseline_metadata={
                "has_baseline": features.has_baseline,
                "baseline_tx_count": features.baseline_tx_count,
                "baseline_avg_amount": str(features.baseline_avg_amount) if features.baseline_avg_amount else None,
            },
            metadata={
                "engine": "UPIFraudIntelligenceEngine",
                "rules_evaluated": len(self.rules),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
