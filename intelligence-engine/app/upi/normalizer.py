from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import logging
from typing import Any, Dict, Optional, Union

from app.upi.models import (
    PROHIBITED_CREDENTIAL_KEYS,
    UPIStatus,
    UPITransaction,
    UPITransactionType,
    validate_vpa,
)

logger = logging.getLogger(__name__)


class UPITransactionNormalizer:
    """
    Authoritative UPI Transaction Normalizer for TRACEVAULT V3.
    Transforms heterogeneous, provider-specific, or mock raw UPI payloads
    into canonical UPITransaction domain objects.
    Enforces data minimization, exact Decimal precision, UTC timestamp formatting,
    and strict rejection of sensitive authentication credentials.
    """

    @classmethod
    def normalize_timestamp(cls, raw_ts: Any) -> str:
        """
        Normalize input timestamp to canonical timezone-aware ISO 8601 UTC string.
        Assumes UTC if no timezone is explicitly specified.
        """
        if not raw_ts:
            return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        if isinstance(raw_ts, datetime):
            if raw_ts.tzinfo is None:
                dt = raw_ts.replace(tzinfo=timezone.utc)
            else:
                dt = raw_ts.astimezone(timezone.utc)
            return dt.isoformat().replace("+00:00", "Z")

        # Handle numeric epoch (seconds or milliseconds)
        try:
            num = float(raw_ts)
            # If timestamp is in milliseconds (> 1e11)
            if num > 1e11:
                num = num / 1000.0
            dt = datetime.fromtimestamp(num, tz=timezone.utc)
            return dt.isoformat().replace("+00:00", "Z")
        except (ValueError, TypeError):
            pass

        # Handle ISO strings
        s = str(raw_ts).strip()
        try:
            clean_s = s.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt.isoformat().replace("+00:00", "Z")
        except Exception:
            logger.warning(f"Unparseable timestamp '{raw_ts}', falling back to UTC now.")
            return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    @classmethod
    def normalize_amount(cls, raw_val: Any) -> Decimal:
        """
        Normalize amount to Decimal for financial calculations.
        Rejects negative amounts.
        """
        if raw_val is None:
            raise ValueError("Transaction amount is required.")

        try:
            # Clean string representation
            clean_val = str(raw_val).strip().replace(",", "")
            amt = Decimal(clean_val)
            if amt < Decimal("0.0"):
                raise ValueError("Transaction amount cannot be negative.")
            return amt
        except (InvalidOperation, TypeError):
            raise ValueError(f"Invalid monetary amount format: '{raw_val}'")

    @classmethod
    def normalize(cls, raw_data: Dict[str, Any], default_source: str = "mock_upi") -> UPITransaction:
        """
        Normalize a raw dictionary payload into a canonical UPITransaction.
        """
        if not isinstance(raw_data, dict):
            raise ValueError("Raw UPI transaction payload must be a dictionary.")

        # 1. Strict security check: reject sensitive credentials immediately
        for key in raw_data.keys():
            if str(key).lower() in PROHIBITED_CREDENTIAL_KEYS:
                raise ValueError(
                    f"Security Exception: Sensitive authentication credential '{key}' must never be ingested."
                )

        raw_meta = dict(raw_data.get("metadata", {}))
        for key in raw_meta.keys():
            if str(key).lower() in PROHIBITED_CREDENTIAL_KEYS:
                raise ValueError(
                    f"Security Exception: Sensitive credential '{key}' detected in metadata."
                )

        # 2. Extract transaction identifiers
        txn_id = (
            raw_data.get("transaction_id")
            or raw_data.get("txn_id")
            or raw_data.get("txnId")
            or raw_data.get("rrn")
            or raw_data.get("upi_txn_id")
        )
        if not txn_id:
            raise ValueError("Missing required UPI transaction identifier (transaction_id/txnId/rrn).")

        txn_ref = (
            raw_data.get("transaction_reference")
            or raw_data.get("reference_id")
            or raw_data.get("refId")
            or raw_data.get("utr")
        )

        # 3. Extract and normalize VPAs
        sender_vpa = (
            raw_data.get("sender_vpa")
            or raw_data.get("payer_vpa")
            or raw_data.get("payerVpa")
            or raw_data.get("from_vpa")
        )
        receiver_vpa = (
            raw_data.get("receiver_vpa")
            or raw_data.get("payee_vpa")
            or raw_data.get("payeeVpa")
            or raw_data.get("to_vpa")
        )

        if not sender_vpa or not str(sender_vpa).strip():
            raise ValueError("Sender VPA (payer_vpa) is required.")
        if not receiver_vpa or not str(receiver_vpa).strip():
            raise ValueError("Receiver VPA (payee_vpa) is required.")

        clean_sender_vpa = str(sender_vpa).strip().lower()
        clean_receiver_vpa = str(receiver_vpa).strip().lower()

        # 4. Extract and normalize Amount & Currency
        raw_amount = (
            raw_data.get("amount")
            or raw_data.get("txn_amount")
            or raw_data.get("txnAmount")
            or raw_data.get("value")
        )
        amount = cls.normalize_amount(raw_amount)

        currency = str(raw_data.get("currency") or "INR").strip().upper()
        if currency != "INR":
            raise ValueError(f"Unsupported UPI currency '{currency}'. Phase 12 strictly supports INR.")

        # 5. Extract and normalize Timestamp
        raw_ts = (
            raw_data.get("timestamp")
            or raw_data.get("txn_time")
            or raw_data.get("txnTime")
            or raw_data.get("created_at")
        )
        timestamp = cls.normalize_timestamp(raw_ts)
        if raw_ts is not None:
            raw_meta["original_timestamp"] = str(raw_ts)

        # 6. Extract and normalize Typology & Status
        raw_type = (
            raw_data.get("transaction_type")
            or raw_data.get("txn_type")
            or raw_data.get("txnType")
            or raw_data.get("type")
        )
        txn_type = UPITransactionType.normalize(raw_type) if raw_type is not None else UPITransactionType.P2P

        raw_status = (
            raw_data.get("status")
            or raw_data.get("txn_status")
            or raw_data.get("txnStatus")
            or raw_data.get("response_code")
        )
        status = UPIStatus.normalize(raw_status) if raw_status is not None else UPIStatus.SUCCESS
        if raw_status is not None:
            raw_meta["provider_status"] = str(raw_status)

        # 7. Extract Optional Metadata & Analytical Signal Placeholders
        sender_bank = (
            raw_data.get("sender_bank")
            or (clean_sender_vpa.split("@")[1].upper() if "@" in clean_sender_vpa else None)
        )
        receiver_bank = (
            raw_data.get("receiver_bank")
            or (clean_receiver_vpa.split("@")[1].upper() if "@" in clean_receiver_vpa else None)
        )

        merchant_id = raw_data.get("merchant_id") or raw_data.get("merchantId")
        merchant_category = raw_data.get("merchant_category") or raw_data.get("mcc")
        payment_app = raw_data.get("payment_app") or raw_data.get("app")

        # Future analytical placeholders (never geo-tracking or personal data in P12)
        device_ref = raw_data.get("device_reference") or raw_data.get("deviceId")
        ip_signal = raw_data.get("ip_signal_reference")
        loc_signal = raw_data.get("location_signal_reference")

        source = raw_data.get("source") or default_source

        return UPITransaction(
            transaction_id=str(txn_id).strip(),
            transaction_reference=str(txn_ref).strip() if txn_ref else None,
            timestamp=timestamp,
            amount=amount,
            currency=currency,
            sender_vpa=clean_sender_vpa,
            receiver_vpa=clean_receiver_vpa,
            sender_bank=str(sender_bank) if sender_bank else None,
            receiver_bank=str(receiver_bank) if receiver_bank else None,
            merchant_id=str(merchant_id).strip() if merchant_id else None,
            merchant_category=str(merchant_category).strip() if merchant_category else None,
            transaction_type=txn_type,
            status=status,
            payment_app=str(payment_app).strip() if payment_app else None,
            device_reference=str(device_ref).strip() if device_ref else None,
            ip_signal_reference=str(ip_signal).strip() if ip_signal else None,
            location_signal_reference=str(loc_signal).strip() if loc_signal else None,
            source=str(source),
            rail="upi",
            metadata=raw_meta,
        )
