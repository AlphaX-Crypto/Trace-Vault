from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.upi.intelligence.features import parse_iso_dt
from app.upi.intelligence.models import UPIFeatures, UPIFraudFinding, UPIFraudSignalType
from app.upi.models import UPITransaction, UPIStatus


class UPIRuleConfig(BaseModel):
    """Configurable thresholds for UPI fraud intelligence rules."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    velocity_window_seconds: float = Field(default=180.0, description="Window for high velocity check (seconds)")
    velocity_tx_threshold: int = Field(default=5, description="Transaction count threshold for high velocity")
    burst_window_seconds: float = Field(default=60.0, description="Window for transaction burst check (seconds)")
    burst_tx_threshold: int = Field(default=3, description="Transaction count threshold for burst")
    amount_deviation_multiplier: float = Field(default=3.0, description="Deviation multiplier relative to baseline average")
    failed_attempts_threshold: int = Field(default=2, description="Failed attempts threshold")
    beneficiary_burst_window_seconds: float = Field(default=300.0, description="Window for beneficiary burst check")
    beneficiary_burst_count: int = Field(default=3, description="Distinct beneficiary count threshold")
    high_value_velocity_min_volume: Decimal = Field(default=Decimal("50000.00"), description="Volume threshold for high-value velocity")
    pass_through_window_seconds: float = Field(default=600.0, description="Pass-through window (seconds)")
    pass_through_ratio: float = Field(default=0.80, description="Minimum ratio of inflow transferred out")


class BaseUPIRule:
    """Abstract base class for pure deterministic UPI behavioral rules."""
    signal_type: str = UPIFraudSignalType.NEW_BENEFICIARY
    default_risk_contribution: float = 15.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        raise NotImplementedError


class NewBeneficiaryRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.NEW_BENEFICIARY
    default_risk_contribution = 15.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        # Only evaluate if baseline is established
        if not features.has_baseline or features.new_beneficiary_count <= 0:
            return None

        related_tx_ids = [
            tx.transaction_id for tx in transactions
            if tx.receiver_vpa.lower() in features.new_beneficiaries
        ]

        return UPIFraudFinding(
            signal_id=f"UPI-SIG-NEWBEN-{len(features.new_beneficiaries)}",
            signal_type=self.signal_type,
            severity="MEDIUM",
            confidence=80.0,
            risk_contribution=self.default_risk_contribution,
            title="New Beneficiary Interaction",
            description="Potential fraud-risk signal detected: Subject transacted with counterparties not present in baseline profile.",
            reason=f"Transaction directed to {features.new_beneficiary_count} previously unseen VPA(s): {', '.join(features.new_beneficiaries)}.",
            transaction_ids=related_tx_ids,
            affected_entities=features.new_beneficiaries,
            metrics={
                "new_beneficiary_count": features.new_beneficiaries,
                "baseline_known_count": len(features.known_beneficiaries),
            },
        )


class HighVelocityRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.HIGH_TRANSACTION_VELOCITY
    default_risk_contribution = 20.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        if len(transactions) < config.velocity_tx_threshold:
            return None

        def get_dt(tx: UPITransaction) -> datetime:
            return parse_iso_dt(tx.timestamp)

        sorted_txs = sorted(transactions, key=get_dt)
        triggered_tx_ids: List[str] = []
        max_in_window = 0

        # Sliding window search
        for i in range(len(sorted_txs)):
            window_txs = [sorted_txs[i]]
            t_start = get_dt(sorted_txs[i])
            for j in range(i + 1, len(sorted_txs)):
                delta = (get_dt(sorted_txs[j]) - t_start).total_seconds()
                if 0 <= delta <= config.velocity_window_seconds:
                    window_txs.append(sorted_txs[j])
                else:
                    break
            if len(window_txs) > max_in_window:
                max_in_window = len(window_txs)
                triggered_tx_ids = [tx.transaction_id for tx in window_txs]

        if max_in_window >= config.velocity_tx_threshold:
            return UPIFraudFinding(
                signal_id="UPI-SIG-VELOCITY",
                signal_type=self.signal_type,
                severity="HIGH",
                confidence=85.0,
                risk_contribution=self.default_risk_contribution,
                title="Elevated Transaction Velocity",
                description="Potential fraud-risk signal detected: High transaction frequency observed over a compressed time interval.",
                reason=f"Recorded {max_in_window} transactions within a {config.velocity_window_seconds}s window (velocity: {features.velocity_tx_per_minute:.1f} tx/min).",
                transaction_ids=triggered_tx_ids,
                affected_entities=[subject] if subject else [],
                metrics={
                    "transactions_in_window": max_in_window,
                    "window_seconds": config.velocity_window_seconds,
                    "velocity_tx_per_minute": features.velocity_tx_per_minute,
                },
            )
        return None


class TransactionBurstRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.TRANSACTION_BURST
    default_risk_contribution = 15.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        if len(transactions) < config.burst_tx_threshold:
            return None

        def get_dt(tx: UPITransaction) -> datetime:
            return parse_iso_dt(tx.timestamp)

        sorted_txs = sorted(transactions, key=get_dt)
        burst_txs: List[UPITransaction] = []

        # Find any cluster of >= burst_tx_threshold within burst_window_seconds
        for i in range(len(sorted_txs)):
            current_cluster = [sorted_txs[i]]
            t_start = get_dt(sorted_txs[i])
            for j in range(i + 1, len(sorted_txs)):
                delta = (get_dt(sorted_txs[j]) - t_start).total_seconds()
                if 0 <= delta <= config.burst_window_seconds:
                    current_cluster.append(sorted_txs[j])
                else:
                    break
            if len(current_cluster) >= config.burst_tx_threshold:
                burst_txs = current_cluster
                break

        if burst_txs:
            span = (get_dt(burst_txs[-1]) - get_dt(burst_txs[0])).total_seconds()
            return UPIFraudFinding(
                signal_id="UPI-SIG-BURST",
                signal_type=self.signal_type,
                severity="MEDIUM",
                confidence=85.0,
                risk_contribution=self.default_risk_contribution,
                title="Rapid Transaction Burst",
                description="Potential fraud-risk signal detected: Multiple transactions executed in rapid succession within 60 seconds.",
                reason=f"{len(burst_txs)} consecutive transactions recorded within a {span:.1f}s interval.",
                transaction_ids=[tx.transaction_id for tx in burst_txs],
                affected_entities=[subject] if subject else [],
                metrics={
                    "burst_count": len(burst_txs),
                    "burst_span_seconds": span,
                    "threshold": config.burst_tx_threshold,
                },
            )
        return None


class UnusualAmountRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.UNUSUAL_AMOUNT
    default_risk_contribution = 20.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        if not features.has_baseline or features.amount_deviation_ratio is None:
            return None

        # Exceeds multiplier AND exceeds baseline max
        if (
            features.amount_deviation_ratio >= config.amount_deviation_multiplier
            and features.baseline_max_amount is not None
            and features.max_amount > features.baseline_max_amount
        ):
            anomalous_txs = [
                tx.transaction_id for tx in transactions
                if features.baseline_avg_amount and tx.amount >= features.baseline_avg_amount * Decimal(str(config.amount_deviation_multiplier))
            ]

            return UPIFraudFinding(
                signal_id="UPI-SIG-AMOUNT",
                signal_type=self.signal_type,
                severity="HIGH",
                confidence=80.0,
                risk_contribution=self.default_risk_contribution,
                title="Unusual Transaction Amount",
                description="Potential fraud-risk signal detected: Transaction amount deviates significantly from established baseline profile.",
                reason=f"Peak transaction amount of INR {features.max_amount} is {features.amount_deviation_ratio:.1f}x higher than baseline average (INR {features.baseline_avg_amount}).",
                transaction_ids=anomalous_txs,
                affected_entities=[subject] if subject else [],
                metrics={
                    "max_amount": str(features.max_amount),
                    "baseline_avg_amount": str(features.baseline_avg_amount),
                    "deviation_ratio": features.amount_deviation_ratio,
                    "multiplier_threshold": config.amount_deviation_multiplier,
                },
            )
        return None


class MultipleFailedAttemptsRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.MULTIPLE_FAILED_ATTEMPTS
    default_risk_contribution = 15.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        if features.failed_attempt_count < config.failed_attempts_threshold:
            return None

        failed_tx_ids = [
            tx.transaction_id for tx in transactions
            if tx.status == UPIStatus.FAILED or tx.status.upper() == "FAILED"
        ]

        return UPIFraudFinding(
            signal_id="UPI-SIG-FAILEDATTEMPTS",
            signal_type=self.signal_type,
            severity="MEDIUM",
            confidence=85.0,
            risk_contribution=self.default_risk_contribution,
            title="Multiple Failed Authorization Attempts",
            description="Potential fraud-risk signal detected: Multiple declined or failed payment attempts detected in analyzed sequence.",
            reason=f"Detected {features.failed_attempt_count} failed payment attempts in sequence, indicating potential trial-and-error authorization or retry behavior.",
            transaction_ids=failed_tx_ids,
            affected_entities=[subject] if subject else [],
            metrics={
                "failed_count": features.failed_attempt_count,
                "threshold": config.failed_attempts_threshold,
            },
        )


class NewDeviceRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.NEW_DEVICE
    default_risk_contribution = 15.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        if not features.has_baseline or features.new_device_count <= 0:
            return None

        return UPIFraudFinding(
            signal_id="UPI-SIG-NEWDEVICE",
            signal_type=self.signal_type,
            severity="MEDIUM",
            confidence=75.0,
            risk_contribution=self.default_risk_contribution,
            title="Unrecognized Client Device Reference",
            description="Potential fraud-risk signal detected: Transaction originated from an unrecognized client device reference.",
            reason=f"Transaction activity initiated from {features.new_device_count} client device reference(s) not observed in baseline history.",
            transaction_ids=[tx.transaction_id for tx in transactions if tx.device_reference],
            affected_entities=[subject] if subject else [],
            metrics={
                "new_device_count": features.new_device_count,
                "devices_used": features.devices_used,
            },
        )


class UnusualTransactionTimeRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.UNUSUAL_TRANSACTION_TIME
    default_risk_contribution = 10.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        if not features.has_baseline or not features.is_unusual_hour:
            return None

        def get_dt(tx: UPITransaction) -> datetime:
            return parse_iso_dt(tx.timestamp)

        night_txs = [
            tx.transaction_id for tx in transactions
            if 0 <= get_dt(tx).hour < 5
        ]

        return UPIFraudFinding(
            signal_id="UPI-SIG-UNUSUALTIME",
            signal_type=self.signal_type,
            severity="LOW",
            confidence=70.0,
            risk_contribution=self.default_risk_contribution,
            title="Atypical Execution Hours",
            description="Potential fraud-risk signal detected: Transactions executed during late-night off-peak hours (00:00-05:00 UTC).",
            reason="Transaction execution during off-peak night window contrasting with baseline activity profile.",
            transaction_ids=night_txs,
            affected_entities=[subject] if subject else [],
            metrics={
                "off_peak_tx_count": len(night_txs),
            },
        )


class BeneficiaryBurstRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.BENEFICIARY_BURST
    default_risk_contribution = 20.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        def get_dt(tx: UPITransaction) -> datetime:
            return parse_iso_dt(tx.timestamp)

        clean_sub = subject.strip().lower()
        outgoing_txs = [
            tx for tx in sorted(transactions, key=get_dt)
            if not clean_sub or tx.sender_vpa.lower() == clean_sub
        ]

        if len(outgoing_txs) < config.beneficiary_burst_count:
            return None

        # Check sliding window for distinct beneficiaries
        max_beneficiaries = 0
        window_b_txs: List[UPITransaction] = []
        found_beneficiaries: List[str] = []

        for i in range(len(outgoing_txs)):
            t_start = get_dt(outgoing_txs[i])
            current_window = [outgoing_txs[i]]
            b_set = {outgoing_txs[i].receiver_vpa.lower()}
            for j in range(i + 1, len(outgoing_txs)):
                delta = (get_dt(outgoing_txs[j]) - t_start).total_seconds()
                if 0 <= delta <= config.beneficiary_burst_window_seconds:
                    current_window.append(outgoing_txs[j])
                    b_set.add(outgoing_txs[j].receiver_vpa.lower())
                else:
                    break
            if len(b_set) > max_beneficiaries:
                max_beneficiaries = len(b_set)
                window_b_txs = current_window
                found_beneficiaries = sorted(list(b_set))

        if max_beneficiaries >= config.beneficiary_burst_count:
            span = (get_dt(window_b_txs[-1]) - get_dt(window_b_txs[0])).total_seconds()
            return UPIFraudFinding(
                signal_id="UPI-SIG-BENBURST",
                signal_type=self.signal_type,
                severity="HIGH",
                confidence=85.0,
                risk_contribution=self.default_risk_contribution,
                title="Rapid Beneficiary Dispersion",
                description="Potential fraud-risk signal detected: Multiple distinct counterparties targeted in rapid succession.",
                reason=f"{max_beneficiaries} distinct counterparties paid within a {span:.1f}s interval: {', '.join(found_beneficiaries)}.",
                transaction_ids=[tx.transaction_id for tx in window_b_txs],
                affected_entities=found_beneficiaries,
                metrics={
                    "unique_beneficiaries_in_window": max_beneficiaries,
                    "window_seconds": config.beneficiary_burst_window_seconds,
                    "span_seconds": span,
                },
            )
        return None


class HighValueVelocityRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.HIGH_VALUE_VELOCITY
    default_risk_contribution = 25.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        # High volume transferred rapidly: >= 3 transactions AND total volume >= threshold
        # OR baseline deviation ratio >= 2.5 with >= 3 transactions
        is_elevated_velocity = features.transaction_count >= 3 and features.velocity_tx_per_minute >= 0.5
        is_high_volume = (
            features.total_volume >= config.high_value_velocity_min_volume
            or (features.has_baseline and features.amount_deviation_ratio and features.amount_deviation_ratio >= 2.5)
        )

        if is_elevated_velocity and is_high_volume:
            return UPIFraudFinding(
                signal_id="UPI-SIG-HIGHVALVEL",
                signal_type=self.signal_type,
                severity="CRITICAL",
                confidence=90.0,
                risk_contribution=self.default_risk_contribution,
                title="High-Value Transaction Velocity",
                description="Potential fraud-risk signal detected: Substantial monetary volume transferred under rapid transaction velocity.",
                reason=f"Total volume of INR {features.total_volume} transferred across {features.transaction_count} transactions in {features.time_span_seconds:.1f}s.",
                transaction_ids=[tx.transaction_id for tx in transactions],
                affected_entities=[subject] if subject else [],
                metrics={
                    "total_volume": str(features.total_volume),
                    "transaction_count": features.transaction_count,
                    "velocity_tx_per_minute": features.velocity_tx_per_minute,
                    "time_span_seconds": features.time_span_seconds,
                },
            )
        return None


class RapidPassThroughRule(BaseUPIRule):
    signal_type = UPIFraudSignalType.RAPID_PASS_THROUGH
    default_risk_contribution = 20.0

    def evaluate(
        self,
        transactions: List[UPITransaction],
        features: UPIFeatures,
        subject: str,
        config: UPIRuleConfig,
    ) -> Optional[UPIFraudFinding]:
        if not features.pass_through_detected:
            return None

        return UPIFraudFinding(
            signal_id="UPI-SIG-PASSTHROUGH",
            signal_type=self.signal_type,
            severity="HIGH",
            confidence=85.0,
            risk_contribution=self.default_risk_contribution,
            title="Rapid Pass-Through Flow Pattern",
            description="Potential fraud-risk signal detected: Inbound funds rapidly dispatched to another counterparty within 10 minutes.",
            reason="Subject received inbound funds and transferred >= 80% out within a 10-minute window, exhibiting intermediary pass-through flow dynamics.",
            transaction_ids=[tx.transaction_id for tx in transactions],
            affected_entities=[subject] if subject else [],
            metrics={
                "pass_through_detected": True,
                "window_seconds": config.pass_through_window_seconds,
                "ratio_threshold": config.pass_through_ratio,
            },
        )


ALL_RULES: List[BaseUPIRule] = [
    NewBeneficiaryRule(),
    HighVelocityRule(),
    TransactionBurstRule(),
    UnusualAmountRule(),
    MultipleFailedAttemptsRule(),
    NewDeviceRule(),
    UnusualTransactionTimeRule(),
    BeneficiaryBurstRule(),
    HighValueVelocityRule(),
    RapidPassThroughRule(),
]
