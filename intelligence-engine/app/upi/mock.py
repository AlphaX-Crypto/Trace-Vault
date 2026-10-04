from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.upi.base import BaseUPIAdapter
from app.upi.models import UPITransaction, UPITransactionType, UPIStatus
from app.upi.normalizer import UPITransactionNormalizer


class MockUPIAdapter(BaseUPIAdapter):
    """
    Deterministic Synthetic Mock UPI Adapter for TRACEVAULT V3 development & testing.
    Provides controlled, repeatable scenarios for development, integration tests, and demos.
    Never interacts with live banking rails. Clearly tags all data as 'mock_upi'.
    """

    def __init__(self, custom_transactions: Optional[List[UPITransaction]] = None):
        self._transactions: Dict[str, UPITransaction] = {}
        self._seed_deterministic_scenarios()

        if custom_transactions:
            for tx in custom_transactions:
                self.add_transaction(tx)

    @property
    def data_source(self) -> str:
        return "mock_upi"

    @property
    def is_live(self) -> bool:
        return False

    def add_transaction(self, tx: UPITransaction) -> None:
        self._transactions[tx.transaction_id.strip()] = tx

    def _seed_deterministic_scenarios(self) -> None:
        """Seeds the standard test scenarios required by Phase 12 specification."""
        scenarios = [
            # 1. NORMAL_P2P (Scenario 1 & UPI-DEMO-001)
            {
                "transaction_id": "UPI-TXN-P2P-001",
                "transaction_reference": "UTR-2026-P2P-001",
                "timestamp": "2026-09-28T08:00:00Z",
                "amount": "500.00",
                "currency": "INR",
                "sender_vpa": "alice@mockupi",
                "receiver_vpa": "bob@mockupi",
                "sender_bank": "MOCKUPI",
                "receiver_bank": "MOCKUPI",
                "transaction_type": "P2P",
                "status": "SUCCESS",
                "payment_app": "TraceVaultDemoApp",
                "source": "mock_upi",
                "metadata": {
                    "scenario": "NORMAL_P2P",
                    "provider": "mock",
                    "environment": "development",
                },
            },
            # 2. NORMAL_P2M (Scenario 2 & UPI-DEMO-002)
            {
                "transaction_id": "UPI-TXN-P2M-001",
                "transaction_reference": "UTR-2026-P2M-001",
                "timestamp": "2026-09-28T08:15:00Z",
                "amount": "850.00",
                "currency": "INR",
                "sender_vpa": "alice@mockupi",
                "receiver_vpa": "merchant.demo@mockupi",
                "sender_bank": "MOCKUPI",
                "receiver_bank": "MOCKMERCHANT",
                "merchant_id": "MERCHANT-DEMO-01",
                "merchant_category": "5411",  # Grocery stores
                "transaction_type": "P2M",
                "status": "SUCCESS",
                "payment_app": "TraceVaultDemoApp",
                "source": "mock_upi",
                "metadata": {
                    "scenario": "NORMAL_P2M",
                    "provider": "mock",
                    "environment": "development",
                },
            },
            # 3. MULTI_TRANSACTION_CASE (Scenario 3 & UPI-DEMO-003: Alice -> Bob -> Merchant)
            {
                "transaction_id": "UPI-TXN-MULTI-001",
                "transaction_reference": "UTR-2026-MULTI-001",
                "timestamp": "2026-09-28T08:30:00Z",
                "amount": "1200.00",
                "currency": "INR",
                "sender_vpa": "alice@mockupi",
                "receiver_vpa": "bob@mockupi",
                "sender_bank": "MOCKUPI",
                "receiver_bank": "MOCKUPI",
                "transaction_type": "P2P",
                "status": "SUCCESS",
                "source": "mock_upi",
                "metadata": {
                    "scenario": "MULTI_TRANSACTION_CASE",
                    "case_id": "UPI-DEMO-003",
                    "provider": "mock",
                    "environment": "development",
                },
            },
            {
                "transaction_id": "UPI-TXN-MULTI-002",
                "transaction_reference": "UTR-2026-MULTI-002",
                "timestamp": "2026-09-28T08:35:00Z",
                "amount": "1150.00",
                "currency": "INR",
                "sender_vpa": "bob@mockupi",
                "receiver_vpa": "merchant.demo@mockupi",
                "sender_bank": "MOCKUPI",
                "receiver_bank": "MOCKMERCHANT",
                "merchant_id": "MERCHANT-DEMO-01",
                "transaction_type": "P2M",
                "status": "SUCCESS",
                "source": "mock_upi",
                "metadata": {
                    "scenario": "MULTI_TRANSACTION_CASE",
                    "case_id": "UPI-DEMO-003",
                    "provider": "mock",
                    "environment": "development",
                },
            },
            # 4. REFUND_CASE (Scenario 4: Merchant -> Alice)
            {
                "transaction_id": "UPI-TXN-REFUND-001",
                "transaction_reference": "UTR-2026-REFUND-001",
                "timestamp": "2026-09-28T09:00:00Z",
                "amount": "850.00",
                "currency": "INR",
                "sender_vpa": "merchant.demo@mockupi",
                "receiver_vpa": "alice@mockupi",
                "sender_bank": "MOCKMERCHANT",
                "receiver_bank": "MOCKUPI",
                "merchant_id": "MERCHANT-DEMO-01",
                "transaction_type": "REFUND",
                "status": "SUCCESS",
                "source": "mock_upi",
                "metadata": {
                    "scenario": "REFUND_CASE",
                    "original_txn_id": "UPI-TXN-P2M-001",
                    "provider": "mock",
                    "environment": "development",
                },
            },
            # 5. FAILED_TRANSACTION (Scenario 5: Charlie -> Dave)
            {
                "transaction_id": "UPI-TXN-FAIL-001",
                "transaction_reference": "UTR-2026-FAIL-001",
                "timestamp": "2026-09-28T09:30:00Z",
                "amount": "2000.00",
                "currency": "INR",
                "sender_vpa": "charlie@mockupi",
                "receiver_vpa": "dave@mockupi",
                "sender_bank": "MOCKUPI",
                "receiver_bank": "MOCKUPI",
                "transaction_type": "P2P",
                "status": "FAILED",
                "source": "mock_upi",
                "metadata": {
                    "scenario": "FAILED_TRANSACTION",
                    "failure_code": "DECLINED_BY_BANK",
                    "provider": "mock",
                    "environment": "development",
                },
            },
            # === PHASE 13 SYNTHETIC FRAUD RISK SCENARIOS ===
            # UPI-RISK-001: New beneficiary + unusual amount (Subject: vikram@mockupi)
            # Baseline:
            {"transaction_id": "UPI-R1-BASE-01", "timestamp": "2026-09-20T10:00:00Z", "amount": "500.00", "sender_vpa": "vikram@mockupi", "receiver_vpa": "friend1@mockupi", "status": "SUCCESS", "device_reference": "DEV-VIKRAM-1", "metadata": {"scenario": "UPI-RISK-001", "role": "baseline"}},
            {"transaction_id": "UPI-R1-BASE-02", "timestamp": "2026-09-21T11:00:00Z", "amount": "450.00", "sender_vpa": "vikram@mockupi", "receiver_vpa": "groceries@mockupi", "status": "SUCCESS", "device_reference": "DEV-VIKRAM-1", "metadata": {"scenario": "UPI-RISK-001", "role": "baseline"}},
            {"transaction_id": "UPI-R1-BASE-03", "timestamp": "2026-09-22T14:30:00Z", "amount": "600.00", "sender_vpa": "vikram@mockupi", "receiver_vpa": "friend1@mockupi", "status": "SUCCESS", "device_reference": "DEV-VIKRAM-1", "metadata": {"scenario": "UPI-RISK-001", "role": "baseline"}},
            # Current Target:
            {"transaction_id": "UPI-R1-TARGET-01", "timestamp": "2026-09-28T12:00:00Z", "amount": "25000.00", "sender_vpa": "vikram@mockupi", "receiver_vpa": "unseen_merchant@mockupi", "status": "SUCCESS", "device_reference": "DEV-VIKRAM-1", "metadata": {"scenario": "UPI-RISK-001", "role": "target"}},

            # UPI-RISK-002: High velocity (Subject: rahul@mockupi, 5 rapid txs within 120s)
            {"transaction_id": "UPI-R2-TARGET-01", "timestamp": "2026-09-28T13:00:00Z", "amount": "1000.00", "sender_vpa": "rahul@mockupi", "receiver_vpa": "peer1@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-002", "role": "target"}},
            {"transaction_id": "UPI-R2-TARGET-02", "timestamp": "2026-09-28T13:00:25Z", "amount": "1000.00", "sender_vpa": "rahul@mockupi", "receiver_vpa": "peer2@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-002", "role": "target"}},
            {"transaction_id": "UPI-R2-TARGET-03", "timestamp": "2026-09-28T13:00:50Z", "amount": "1000.00", "sender_vpa": "rahul@mockupi", "receiver_vpa": "peer1@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-002", "role": "target"}},
            {"transaction_id": "UPI-R2-TARGET-04", "timestamp": "2026-09-28T13:01:15Z", "amount": "1000.00", "sender_vpa": "rahul@mockupi", "receiver_vpa": "peer2@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-002", "role": "target"}},
            {"transaction_id": "UPI-R2-TARGET-05", "timestamp": "2026-09-28T13:01:40Z", "amount": "1000.00", "sender_vpa": "rahul@mockupi", "receiver_vpa": "peer1@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-002", "role": "target"}},

            # UPI-RISK-003: Multiple failed attempts followed by success (Subject: priya@mockupi)
            {"transaction_id": "UPI-R3-TARGET-01", "timestamp": "2026-09-28T14:00:00Z", "amount": "5000.00", "sender_vpa": "priya@mockupi", "receiver_vpa": "store@mockupi", "status": "FAILED", "metadata": {"scenario": "UPI-RISK-003", "role": "target"}},
            {"transaction_id": "UPI-R3-TARGET-02", "timestamp": "2026-09-28T14:01:00Z", "amount": "5000.00", "sender_vpa": "priya@mockupi", "receiver_vpa": "store@mockupi", "status": "FAILED", "metadata": {"scenario": "UPI-RISK-003", "role": "target"}},
            {"transaction_id": "UPI-R3-TARGET-03", "timestamp": "2026-09-28T14:02:00Z", "amount": "5000.00", "sender_vpa": "priya@mockupi", "receiver_vpa": "store@mockupi", "status": "FAILED", "metadata": {"scenario": "UPI-RISK-003", "role": "target"}},
            {"transaction_id": "UPI-R3-TARGET-04", "timestamp": "2026-09-28T14:03:00Z", "amount": "5000.00", "sender_vpa": "priya@mockupi", "receiver_vpa": "store@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-003", "role": "target"}},

            # UPI-RISK-004: New device + unusual amount (Subject: amit@mockupi)
            # Baseline:
            {"transaction_id": "UPI-R4-BASE-01", "timestamp": "2026-09-21T09:00:00Z", "amount": "300.00", "sender_vpa": "amit@mockupi", "receiver_vpa": "milk@mockupi", "status": "SUCCESS", "device_reference": "DEV-AMIT-TRUSTED", "metadata": {"scenario": "UPI-RISK-004", "role": "baseline"}},
            {"transaction_id": "UPI-R4-BASE-02", "timestamp": "2026-09-22T09:00:00Z", "amount": "400.00", "sender_vpa": "amit@mockupi", "receiver_vpa": "tea@mockupi", "status": "SUCCESS", "device_reference": "DEV-AMIT-TRUSTED", "metadata": {"scenario": "UPI-RISK-004", "role": "baseline"}},
            # Target:
            {"transaction_id": "UPI-R4-TARGET-01", "timestamp": "2026-09-28T15:00:00Z", "amount": "15000.00", "sender_vpa": "amit@mockupi", "receiver_vpa": "milk@mockupi", "status": "SUCCESS", "device_reference": "DEV-AMIT-UNKNOWN-99", "metadata": {"scenario": "UPI-RISK-004", "role": "target"}},

            # UPI-RISK-005: Beneficiary burst (Subject: sunil@mockupi, 4 distinct counterparties in 120s)
            {"transaction_id": "UPI-R5-TARGET-01", "timestamp": "2026-09-28T16:00:00Z", "amount": "2000.00", "sender_vpa": "sunil@mockupi", "receiver_vpa": "ben1@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-005", "role": "target"}},
            {"transaction_id": "UPI-R5-TARGET-02", "timestamp": "2026-09-28T16:00:30Z", "amount": "2000.00", "sender_vpa": "sunil@mockupi", "receiver_vpa": "ben2@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-005", "role": "target"}},
            {"transaction_id": "UPI-R5-TARGET-03", "timestamp": "2026-09-28T16:01:00Z", "amount": "2000.00", "sender_vpa": "sunil@mockupi", "receiver_vpa": "ben3@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-005", "role": "target"}},
            {"transaction_id": "UPI-R5-TARGET-04", "timestamp": "2026-09-28T16:01:30Z", "amount": "2000.00", "sender_vpa": "sunil@mockupi", "receiver_vpa": "ben4@mockupi", "status": "SUCCESS", "metadata": {"scenario": "UPI-RISK-005", "role": "target"}},

            # UPI-RISK-006: Normal behavior / control case (Subject: neha@mockupi)
            # Baseline:
            {"transaction_id": "UPI-R6-BASE-01", "timestamp": "2026-09-20T10:00:00Z", "amount": "500.00", "sender_vpa": "neha@mockupi", "receiver_vpa": "known1@mockupi", "status": "SUCCESS", "device_reference": "DEV-NEHA", "metadata": {"scenario": "UPI-RISK-006", "role": "baseline"}},
            {"transaction_id": "UPI-R6-BASE-02", "timestamp": "2026-09-21T11:00:00Z", "amount": "600.00", "sender_vpa": "neha@mockupi", "receiver_vpa": "known2@mockupi", "status": "SUCCESS", "device_reference": "DEV-NEHA", "metadata": {"scenario": "UPI-RISK-006", "role": "baseline"}},
            {"transaction_id": "UPI-R6-BASE-03", "timestamp": "2026-09-22T12:00:00Z", "amount": "550.00", "sender_vpa": "neha@mockupi", "receiver_vpa": "known1@mockupi", "status": "SUCCESS", "device_reference": "DEV-NEHA", "metadata": {"scenario": "UPI-RISK-006", "role": "baseline"}},
            # Target:
            {"transaction_id": "UPI-R6-TARGET-01", "timestamp": "2026-09-28T10:00:00Z", "amount": "520.00", "sender_vpa": "neha@mockupi", "receiver_vpa": "known1@mockupi", "status": "SUCCESS", "device_reference": "DEV-NEHA", "metadata": {"scenario": "UPI-RISK-006", "role": "target"}},
            {"transaction_id": "UPI-R6-TARGET-02", "timestamp": "2026-09-28T16:00:00Z", "amount": "580.00", "sender_vpa": "neha@mockupi", "receiver_vpa": "known2@mockupi", "status": "SUCCESS", "device_reference": "DEV-NEHA", "metadata": {"scenario": "UPI-RISK-006", "role": "target"}},

            # UPI-RISK-007: Insufficient baseline (Subject: tarun@mockupi, 1 tx, no history)
            {"transaction_id": "UPI-R7-TARGET-01", "timestamp": "2026-09-28T11:00:00Z", "amount": "1200.00", "sender_vpa": "tarun@mockupi", "receiver_vpa": "vendor@mockupi", "status": "SUCCESS", "device_reference": "DEV-TARUN", "metadata": {"scenario": "UPI-RISK-007", "role": "target"}},
        ]

        for raw in scenarios:
            tx = UPITransactionNormalizer.normalize(raw, default_source="mock_upi")
            self.add_transaction(tx)

    def get_transaction(self, transaction_id: str) -> Optional[UPITransaction]:
        if not transaction_id:
            return None
        return self._transactions.get(transaction_id.strip())

    def get_transactions(self, vpa: str, limit: int = 50) -> List[UPITransaction]:
        if not vpa:
            return []
        clean_vpa = vpa.strip().lower()
        results = [
            tx for tx in self._transactions.values()
            if tx.sender_vpa == clean_vpa or tx.receiver_vpa == clean_vpa
        ]
        results.sort(key=lambda x: x.timestamp, reverse=True)
        return results[:limit]

    def get_all_transactions(self) -> List[UPITransaction]:
        return list(self._transactions.values())

    def get_scenario(self, scenario_id: str) -> Dict[str, Any]:
        """
        Retrieves subject, target transactions, and baseline transactions
        for a named synthetic risk scenario (e.g. UPI-RISK-001 through UPI-RISK-007).
        """
        clean_id = scenario_id.strip().upper()
        subject_map = {
            "UPI-RISK-001": "vikram@mockupi",
            "UPI-RISK-002": "rahul@mockupi",
            "UPI-RISK-003": "priya@mockupi",
            "UPI-RISK-004": "amit@mockupi",
            "UPI-RISK-005": "sunil@mockupi",
            "UPI-RISK-006": "neha@mockupi",
            "UPI-RISK-007": "tarun@mockupi",
        }
        subject = subject_map.get(clean_id, "")

        target_txs = [
            tx for tx in self._transactions.values()
            if tx.metadata.get("scenario") == clean_id and tx.metadata.get("role") == "target"
        ]
        target_txs.sort(key=lambda x: x.timestamp)

        baseline_txs = [
            tx for tx in self._transactions.values()
            if tx.metadata.get("scenario") == clean_id and tx.metadata.get("role") == "baseline"
        ]
        baseline_txs.sort(key=lambda x: x.timestamp)

        return {
            "scenario": clean_id,
            "subject": subject,
            "transactions": target_txs,
            "baseline_transactions": baseline_txs,
        }

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "source": self.data_source,
            "is_live": self.is_live,
            "environment": "development",
            "transaction_count": len(self._transactions),
        }
