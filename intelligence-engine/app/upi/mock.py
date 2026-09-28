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

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "source": self.data_source,
            "is_live": self.is_live,
            "environment": "development",
            "transaction_count": len(self._transactions),
        }
