from datetime import datetime
from decimal import Decimal
import statistics
from typing import Any, Dict, List, Optional, Set

from app.upi.intelligence.models import UPIFeatures
from app.upi.models import UPITransaction, UPIStatus


def parse_iso_dt(ts: str) -> datetime:
    """Parse ISO 8601 string into datetime safely without external dependencies."""
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


class UPIFeatureExtractor:
    """
    Extracts deterministic statistical, temporal, and counterparty features
    from current and baseline historical UPI transactions.
    """

    @classmethod
    def extract(
        cls,
        current_transactions: List[UPITransaction],
        baseline_transactions: Optional[List[UPITransaction]] = None,
        subject: str = "",
    ) -> UPIFeatures:
        clean_subject = subject.strip().lower()
        if not current_transactions:
            return UPIFeatures(
                transaction_count=0,
                has_baseline=bool(baseline_transactions),
                baseline_tx_count=len(baseline_transactions) if baseline_transactions else 0,
            )

        # Parse timestamps and sort chronologically
        def get_dt(tx: UPITransaction) -> datetime:
            return parse_iso_dt(tx.timestamp)

        sorted_txs = sorted(current_transactions, key=get_dt)
        tx_count = len(sorted_txs)

        amounts = [tx.amount for tx in sorted_txs]
        total_volume = sum(amounts)
        avg_amount = total_volume / Decimal(tx_count)
        max_amount = max(amounts)
        min_amount = min(amounts)
        median_amount = Decimal(str(statistics.median([float(a) for a in amounts])))

        # Temporal spans and velocity
        earliest_dt = get_dt(sorted_txs[0])
        latest_dt = get_dt(sorted_txs[-1])
        time_span_seconds = max(0.0, (latest_dt - earliest_dt).total_seconds())

        if time_span_seconds > 0:
            velocity_tx_per_minute = round((tx_count / time_span_seconds) * 60.0, 2)
        else:
            velocity_tx_per_minute = float(tx_count) if tx_count > 1 else 0.0

        # Counterparties and beneficiaries
        outgoing_beneficiaries: Set[str] = set()
        incoming_senders: Set[str] = set()
        devices_used: Set[str] = set()
        failed_count = 0
        unusual_hour_count = 0

        for tx in sorted_txs:
            s_vpa = tx.sender_vpa.lower()
            r_vpa = tx.receiver_vpa.lower()
            if clean_subject and s_vpa == clean_subject:
                outgoing_beneficiaries.add(r_vpa)
            elif not clean_subject:
                outgoing_beneficiaries.add(r_vpa)

            if clean_subject and r_vpa == clean_subject:
                incoming_senders.add(s_vpa)

            if tx.device_reference:
                devices_used.add(tx.device_reference)

            if tx.status == UPIStatus.FAILED or tx.status.upper() == "FAILED":
                failed_count += 1

            dt = get_dt(tx)
            # Unconventional late-night transaction hours (00:00 to 05:00 UTC)
            if 0 <= dt.hour < 5:
                unusual_hour_count += 1

        is_unusual_hour = unusual_hour_count > 0

        # Rapid pass-through analysis (inflow immediately followed by outflow)
        pass_through_detected = False
        if clean_subject:
            inflows = [
                tx for tx in sorted_txs
                if tx.receiver_vpa.lower() == clean_subject and tx.status == UPIStatus.SUCCESS
            ]
            outflows = [
                tx for tx in sorted_txs
                if tx.sender_vpa.lower() == clean_subject and tx.status == UPIStatus.SUCCESS
            ]
            for in_tx in inflows:
                in_dt = get_dt(in_tx)
                in_amt = in_tx.amount
                if in_amt <= Decimal("0.0"):
                    continue
                for out_tx in outflows:
                    out_dt = get_dt(out_tx)
                    delta_sec = (out_dt - in_dt).total_seconds()
                    # Outflow occurs within 600s (10 min) after inflow
                    if 0 <= delta_sec <= 600:
                        out_amt = out_tx.amount
                        if out_amt >= in_amt * Decimal("0.80"):
                            pass_through_detected = True
                            break
                if pass_through_detected:
                    break

        # Baseline comparison
        has_baseline = bool(baseline_transactions and len(baseline_transactions) > 0)
        baseline_tx_count = len(baseline_transactions) if baseline_transactions else 0
        baseline_avg_amount: Optional[Decimal] = None
        baseline_max_amount: Optional[Decimal] = None
        baseline_median_amount: Optional[Decimal] = None
        amount_deviation_ratio: Optional[float] = None
        known_beneficiaries: List[str] = []
        new_beneficiaries: List[str] = []
        new_device_count = 0

        if has_baseline and baseline_transactions:
            b_amounts = [tx.amount for tx in baseline_transactions]
            b_total = sum(b_amounts)
            baseline_avg_amount = b_total / Decimal(len(b_amounts))
            baseline_max_amount = max(b_amounts)
            baseline_median_amount = Decimal(str(statistics.median([float(a) for a in b_amounts])))

            if baseline_avg_amount > Decimal("0.0"):
                amount_deviation_ratio = round(float(max_amount / baseline_avg_amount), 2)
            else:
                amount_deviation_ratio = 1.0

            known_b_set: Set[str] = set()
            known_dev_set: Set[str] = set()
            for b_tx in baseline_transactions:
                if clean_subject:
                    if b_tx.sender_vpa.lower() == clean_subject:
                        known_b_set.add(b_tx.receiver_vpa.lower())
                else:
                    known_b_set.add(b_tx.receiver_vpa.lower())
                if b_tx.device_reference:
                    known_dev_set.add(b_tx.device_reference)

            known_beneficiaries = sorted(list(known_b_set))
            new_beneficiaries = sorted(list(outgoing_beneficiaries - known_b_set))

            current_sender_devices = {
                tx.device_reference for tx in sorted_txs
                if tx.device_reference and (not clean_subject or tx.sender_vpa.lower() == clean_subject)
            }
            new_devices = current_sender_devices - known_dev_set
            new_device_count = len(new_devices)
        else:
            # When baseline is absent, do not manufacture novel beneficiary/device alerts
            new_beneficiaries = []
            known_beneficiaries = []

        return UPIFeatures(
            transaction_count=tx_count,
            total_volume=total_volume,
            avg_amount=avg_amount,
            max_amount=max_amount,
            min_amount=min_amount,
            median_amount=median_amount,
            time_span_seconds=time_span_seconds,
            velocity_tx_per_minute=velocity_tx_per_minute,
            unique_beneficiaries=len(outgoing_beneficiaries),
            failed_attempt_count=failed_count,
            new_beneficiary_count=len(new_beneficiaries),
            new_device_count=new_device_count,
            has_baseline=has_baseline,
            baseline_tx_count=baseline_tx_count,
            baseline_avg_amount=baseline_avg_amount,
            baseline_max_amount=baseline_max_amount,
            baseline_median_amount=baseline_median_amount,
            amount_deviation_ratio=amount_deviation_ratio,
            is_unusual_hour=is_unusual_hour,
            pass_through_detected=pass_through_detected,
            known_beneficiaries=known_beneficiaries,
            new_beneficiaries=new_beneficiaries,
            devices_used=sorted(list(devices_used)),
            metadata={
                "inflow_count": len(incoming_senders),
                "time_span_seconds": time_span_seconds,
            },
        )
