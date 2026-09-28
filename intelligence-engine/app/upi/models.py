from datetime import datetime, timezone
from decimal import Decimal
import re
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.financial_event import FinancialEvent, FinancialRail

# Prohibited credential keywords that must never be ingested or persisted
PROHIBITED_CREDENTIAL_KEYS: Set[str] = {
    "upi_pin",
    "pin",
    "mpin",
    "otp",
    "password",
    "cvv",
    "card_cvv",
    "card_number",
    "seed_phrase",
    "private_key",
    "bank_password",
}

# Standard UPI VPA format: username@bankhandle
VPA_PATTERN = re.compile(r"^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$")


def validate_vpa(vpa: str) -> bool:
    """
    Validates standard UPI Virtual Payment Address (VPA) syntax.
    Does NOT infer or assert personal identity, ownership, or bank verification.
    """
    if not vpa or not isinstance(vpa, str):
        return False
    return bool(VPA_PATTERN.match(vpa.strip()))


class UPITransactionType:
    P2P = "P2P"
    P2M = "P2M"
    COLLECT = "COLLECT"
    REFUND = "REFUND"
    REVERSAL = "REVERSAL"
    UNKNOWN = "UNKNOWN"

    @classmethod
    def normalize(cls, value: Optional[str]) -> str:
        if not value:
            return cls.UNKNOWN
        val = str(value).strip().upper()
        if val in (cls.P2P, cls.P2M, cls.COLLECT, cls.REFUND, cls.REVERSAL):
            return val
        if val in ("PERSON_TO_PERSON", "PEER_TO_PEER"):
            return cls.P2P
        if val in ("PERSON_TO_MERCHANT", "MERCHANT_PAYMENT", "PURCHASE"):
            return cls.P2M
        if val in ("COLLECT_REQUEST", "PULL"):
            return cls.COLLECT
        if val in ("RETURN", "CHARGEBACK"):
            return cls.REFUND
        return cls.UNKNOWN


class UPIStatus:
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"
    REVERSED = "REVERSED"
    REFUNDED = "REFUNDED"
    UNKNOWN = "UNKNOWN"

    @classmethod
    def normalize(cls, value: Optional[str]) -> str:
        if not value:
            return cls.UNKNOWN
        val = str(value).strip().upper()
        if val in (cls.SUCCESS, cls.FAILED, cls.PENDING, cls.REVERSED, cls.REFUNDED):
            return val
        if val in ("COMPLETED", "SETTLED", "OK", "PAID"):
            return cls.SUCCESS
        if val in ("FAILURE", "DECLINED", "REJECTED", "EXPIRED"):
            return cls.FAILED
        if val in ("IN_PROGRESS", "PROCESSING", "SUBMITTED", "INITIATED"):
            return cls.PENDING
        return cls.UNKNOWN


class UPIEntityType:
    UPI_VPA = "UPI_VPA"
    BANK = "BANK"
    MERCHANT = "MERCHANT"
    PAYMENT_APP = "PAYMENT_APP"
    DEVICE_REFERENCE = "DEVICE_REFERENCE"


class UPIRawEvent(BaseModel):
    """
    Encapsulates raw, un-normalized ingest records directly from a mock adapter or provider.
    Maintains clean boundary between raw payload and canonical models.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    payload: Dict[str, Any] = Field(..., description="Raw provider payload")
    source: str = Field(default="mock_upi", description="Originating provider label")
    received_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="Ingest timestamp",
    )


class UPITransaction(BaseModel):
    """
    Canonical normalized UPI transaction model for TRACEVAULT V3.
    Strictly data-minimized: Never stores UPI PINs, passwords, OTPs, or CVVs.
    Amount is stored as Decimal for exact fiat precision.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    transaction_id: str = Field(..., description="Unique transaction identifier (UPI Txn ID or RRN)")
    transaction_reference: Optional[str] = Field(default=None, description="Bank reference number or UTR")
    timestamp: str = Field(..., description="UTC ISO 8601 transaction execution timestamp")
    amount: Decimal = Field(..., ge=Decimal("0.0"), description="Monetary transfer volume")
    currency: str = Field(default="INR", description="Fiat currency (strictly INR for Phase 12)")
    sender_vpa: str = Field(..., description="Originating Virtual Payment Address")
    receiver_vpa: str = Field(..., description="Destination Virtual Payment Address")
    sender_bank: Optional[str] = Field(default=None, description="Sender PSP or issuing bank handle")
    receiver_bank: Optional[str] = Field(default=None, description="Receiver PSP or acquiring bank handle")
    merchant_id: Optional[str] = Field(default=None, description="Optional Merchant ID for P2M transactions")
    merchant_category: Optional[str] = Field(default=None, description="Merchant Category Code (MCC) if applicable")
    transaction_type: str = Field(default=UPITransactionType.P2P, description="Normalized transaction typology")
    status: str = Field(default=UPIStatus.SUCCESS, description="Normalized execution status")
    payment_app: Optional[str] = Field(default=None, description="Initiating client application (e.g. PhonePe, GPay, BHIM)")
    device_reference: Optional[str] = Field(default=None, description="Anonymized synthetic device identifier placeholder")
    ip_signal_reference: Optional[str] = Field(default=None, description="Future analytical network signal reference placeholder")
    location_signal_reference: Optional[str] = Field(default=None, description="Future analytical location signal placeholder")
    source: str = Field(default="mock_upi", description="Data ingest source identifier")
    rail: str = Field(default="upi", description="Financial rail indicator")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Preserved provider and forensic metadata")

    @model_validator(mode="before")
    @classmethod
    def sanitize_and_check_credentials(cls, data: Any) -> Any:
        """Strictly reject any sensitive authentication credentials in input or metadata."""
        if isinstance(data, dict):
            # Check top-level keys
            for key in data.keys():
                if key.lower() in PROHIBITED_CREDENTIAL_KEYS:
                    raise ValueError(
                        f"Security Violation: Sensitive credential '{key}' must never be ingested or stored."
                    )
            # Check metadata keys
            meta = data.get("metadata")
            if isinstance(meta, dict):
                for k in meta.keys():
                    if k.lower() in PROHIBITED_CREDENTIAL_KEYS:
                        raise ValueError(
                            f"Security Violation: Sensitive credential '{k}' found in metadata."
                        )
        return data

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        if v.upper() != "INR":
            raise ValueError(f"Phase 12 strictly supports INR for UPI. Received '{v}'.")
        return v.upper()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "transaction_id": self.transaction_id,
            "transaction_reference": self.transaction_reference,
            "timestamp": self.timestamp,
            "amount": str(self.amount),
            "currency": self.currency,
            "sender_vpa": self.sender_vpa.lower(),
            "receiver_vpa": self.receiver_vpa.lower(),
            "sender_bank": self.sender_bank,
            "receiver_bank": self.receiver_bank,
            "merchant_id": self.merchant_id,
            "merchant_category": self.merchant_category,
            "transaction_type": self.transaction_type,
            "status": self.status,
            "payment_app": self.payment_app,
            "device_reference": self.device_reference,
            "ip_signal_reference": self.ip_signal_reference,
            "location_signal_reference": self.location_signal_reference,
            "source": self.source,
            "rail": self.rail,
            "metadata": self.metadata,
        }

    def to_financial_event(self) -> FinancialEvent:
        """Bridge to canonical cross-rail FinancialEvent abstraction."""
        return FinancialEvent(
            event_id=self.transaction_id,
            source=self.source,
            rail=FinancialRail.UPI,
            timestamp=self.timestamp,
            amount=self.amount,
            currency=self.currency,
            sender_entity=self.sender_vpa.lower(),
            receiver_entity=self.receiver_vpa.lower(),
            transaction_type=self.transaction_type,
            status=self.status,
            metadata=dict(self.metadata),
        )

    def to_graph_representation(self) -> Dict[str, Any]:
        """
        Export graph-compatible directed edge representation for future graph engines.
        Maintains separation from crypto while preserving topological compatibility.
        """
        sender = self.sender_vpa.lower()
        receiver = self.receiver_vpa.lower()
        return {
            "source_node": sender,
            "target_node": receiver,
            "source_entity_type": UPIEntityType.UPI_VPA,
            "target_entity_type": (
                UPIEntityType.MERCHANT if self.merchant_id or self.transaction_type == UPITransactionType.P2M
                else UPIEntityType.UPI_VPA
            ),
            "edge_data": {
                "transaction_id": self.transaction_id,
                "amount": float(self.amount),
                "currency": self.currency,
                "timestamp": self.timestamp,
                "transaction_type": self.transaction_type,
                "status": self.status,
                "rail": self.rail,
                "payment_app": self.payment_app,
            },
        }
