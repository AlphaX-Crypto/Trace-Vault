from typing import Any, Dict, List

UNIFIED_SCENARIOS: Dict[str, Dict[str, Any]] = {
    # UNIFIED-DEMO-001: Pure Crypto Investigation (Regression Baseline)
    "UNIFIED-DEMO-001": {
        "case_id": "UNIFIED-DEMO-001",
        "title": "Pure Crypto Layering to Exchange Deposit",
        "description": "Standard 3-hop crypto peeling/layering chain leading to Example Exchange deposit.",
        "crypto_transactions": [
            {
                "transaction_hash": "0xaaa001",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T09:00:00Z",
                "from_address": "0x71c83408a6cf2372e9a5957b6d193d56f6c91350",
                "to_address": "0x28a8746e75304c0780e011bed21c72cd78cd535e",
                "asset": "ETH",
                "amount": 10.0,
                "transaction_type": "transfer",
                "source": "blockchain",
            },
            {
                "transaction_hash": "0xaaa002",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T09:30:00Z",
                "from_address": "0x28a8746e75304c0780e011bed21c72cd78cd535e",
                "to_address": "0x0000000000000000000000000000000000000001",
                "asset": "ETH",
                "amount": 9.8,
                "transaction_type": "transfer",
                "source": "blockchain",
            },
            {
                "transaction_hash": "0xaaa003",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T10:00:00Z",
                "from_address": "0x0000000000000000000000000000000000000001",
                "to_address": "0x9999999999999999999999999999999999999999",
                "asset": "ETH",
                "amount": 9.5,
                "transaction_type": "transfer",
                "source": "blockchain",
            },
        ],
        "vasp_attributions": [
            {
                "wallet_address": "0x9999999999999999999999999999999999999999",
                "vasp_name": "Example Exchange",
                "deposit_address": "0x9999999999999999999999999999999999999999",
                "risk_score": 60.0,
            }
        ],
        "upi_transactions": [],
        "location_signals": [],
        "cross_rail_associations": [],
    },

    # UNIFIED-DEMO-002: Pure UPI Mule Network Trace
    "UNIFIED-DEMO-002": {
        "case_id": "UNIFIED-DEMO-002",
        "title": "Pure UPI Layering & Mule Distribution",
        "description": "Multi-hop UPI fan-out and rapid funnel to merchant account.",
        "crypto_transactions": [],
        "vasp_attributions": [],
        "upi_transactions": [
            {
                "transaction_id": "UPI-TXN-002-1",
                "timestamp": "2026-09-28T11:00:00Z",
                "amount": 100000.0,
                "currency": "INR",
                "sender_vpa": "source_fraudster@mockupi",
                "receiver_vpa": "mule_primary@mockupi",
                "sender_bank": "HDFC",
                "receiver_bank": "ICICI",
                "payment_app": "PhonePe",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            },
            {
                "transaction_id": "UPI-TXN-002-2",
                "timestamp": "2026-09-28T11:05:00Z",
                "amount": 50000.0,
                "currency": "INR",
                "sender_vpa": "mule_primary@mockupi",
                "receiver_vpa": "mule_sub1@mockupi",
                "sender_bank": "ICICI",
                "receiver_bank": "SBI",
                "payment_app": "GPay",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            },
            {
                "transaction_id": "UPI-TXN-002-3",
                "timestamp": "2026-09-28T11:08:00Z",
                "amount": 49000.0,
                "currency": "INR",
                "sender_vpa": "mule_sub1@mockupi",
                "receiver_vpa": "crypto_merchant@mockupi",
                "sender_bank": "SBI",
                "receiver_bank": "AXIS",
                "merchant_id": "MERCH_CRYPTO_001",
                "merchant_category": "6051",
                "transaction_type": "P2M",
                "status": "SUCCESS",
            },
        ],
        "location_signals": [],
        "cross_rail_associations": [],
    },

    # UNIFIED-DEMO-003: Multi-Rail Independent Datasets (Disconnected Components)
    "UNIFIED-DEMO-003": {
        "case_id": "UNIFIED-DEMO-003",
        "title": "Multi-Rail Unlinked Concurrent Operations",
        "description": "Simultaneous crypto transactions and UPI transactions with zero cross-rail correlation.",
        "crypto_transactions": [
            {
                "transaction_hash": "0xbbb001",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T12:00:00Z",
                "from_address": "0x1111111111111111111111111111111111111111",
                "to_address": "0x2222222222222222222222222222222222222222",
                "asset": "USDT",
                "amount": 5000.0,
                "transaction_type": "transfer",
            }
        ],
        "vasp_attributions": [],
        "upi_transactions": [
            {
                "transaction_id": "UPI-TXN-003-1",
                "timestamp": "2026-09-28T12:05:00Z",
                "amount": 25000.0,
                "currency": "INR",
                "sender_vpa": "user_a@mockupi",
                "receiver_vpa": "user_b@mockupi",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            }
        ],
        "location_signals": [],
        "cross_rail_associations": [],
    },

    # UNIFIED-DEMO-004: Explicit Cross-Rail Bridge (Crypto Off-Ramp to UPI Cash-Out)
    "UNIFIED-DEMO-004": {
        "case_id": "UNIFIED-DEMO-004",
        "title": "Crypto Theft Off-Ramp to UPI P2P Cash-Out",
        "description": "Stolen ETH layered to Exchange deposit address with explicit analytical link to UPI payout VPA.",
        "crypto_transactions": [
            {
                "transaction_hash": "0xccc001",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T13:00:00Z",
                "from_address": "0xvictimwallet000000000000000000000000001",
                "to_address": "0xlaundererwallet000000000000000000000001",
                "asset": "ETH",
                "amount": 15.0,
                "transaction_type": "transfer",
            },
            {
                "transaction_hash": "0xccc002",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T13:20:00Z",
                "from_address": "0xlaundererwallet000000000000000000000001",
                "to_address": "0xofframpdeposit0000000000000000000000001",
                "asset": "ETH",
                "amount": 14.8,
                "transaction_type": "transfer",
            },
        ],
        "vasp_attributions": [
            {
                "wallet_address": "0xofframpdeposit0000000000000000000000001",
                "vasp_name": "CoinDelta Exchange",
                "deposit_address": "0xofframpdeposit0000000000000000000000001",
                "risk_score": 75.0,
            }
        ],
        "cross_rail_associations": [
            {
                "source_node_id": "wallet:0xofframpdeposit0000000000000000000000001",
                "target_node_id": "upi:p2p_desk@mockupi",
                "source_rail": "CRYPTO",
                "target_rail": "UPI",
                "association_type": "CROSS_RAIL_ASSOCIATION",
                "confidence": 90.0,
                "description": "Correlated off-ramp order payout matched by exchange order ID to UPI settlement VPA.",
                "source": "exchange_offramp_audit_log",
            }
        ],
        "upi_transactions": [
            {
                "transaction_id": "UPI-TXN-004-1",
                "timestamp": "2026-09-28T13:40:00Z",
                "amount": 1200000.0,
                "currency": "INR",
                "sender_vpa": "p2p_desk@mockupi",
                "receiver_vpa": "cashout_master@mockupi",
                "sender_bank": "HDFC",
                "receiver_bank": "KOTAK",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            },
            {
                "transaction_id": "UPI-TXN-004-2",
                "timestamp": "2026-09-28T13:45:00Z",
                "amount": 300000.0,
                "currency": "INR",
                "sender_vpa": "cashout_master@mockupi",
                "receiver_vpa": "mule_atm_runner@mockupi",
                "sender_bank": "KOTAK",
                "receiver_bank": "ICICI",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            },
        ],
        "location_signals": [],
    },

    # UNIFIED-DEMO-005: Multi-Rail With Geospatial Velocity Anomaly
    "UNIFIED-DEMO-005": {
        "case_id": "UNIFIED-DEMO-005",
        "title": "Multi-Rail Chain with Impossible Travel Anomaly",
        "description": "Crypto deposit to exchange linked to UPI account with impossible travel sequence across cities.",
        "crypto_transactions": [
            {
                "transaction_hash": "0xddd001",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T14:00:00Z",
                "from_address": "0x5555555555555555555555555555555555555555",
                "to_address": "0x6666666666666666666666666666666666666666",
                "asset": "ETH",
                "amount": 8.0,
                "transaction_type": "transfer",
            }
        ],
        "vasp_attributions": [
            {
                "wallet_address": "0x6666666666666666666666666666666666666666",
                "vasp_name": "BitQuick Exchange",
                "risk_score": 70.0,
            }
        ],
        "cross_rail_associations": [
            {
                "source_node_id": "wallet:0x6666666666666666666666666666666666666666",
                "target_node_id": "upi:traveler@mockupi",
                "source_rail": "CRYPTO",
                "target_rail": "UPI",
                "confidence": 85.0,
                "description": "KYC correlation between exchange account and UPI settlement handle.",
            }
        ],
        "upi_transactions": [
            {
                "transaction_id": "UPI-TXN-005-1",
                "timestamp": "2026-09-28T14:15:00Z",
                "amount": 75000.0,
                "currency": "INR",
                "sender_vpa": "traveler@mockupi",
                "receiver_vpa": "recipient1@mockupi",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            },
            {
                "transaction_id": "UPI-TXN-005-2",
                "timestamp": "2026-09-28T14:30:00Z",
                "amount": 75000.0,
                "currency": "INR",
                "sender_vpa": "traveler@mockupi",
                "receiver_vpa": "recipient2@mockupi",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            },
        ],
        "location_signals": [
            {
                "transaction_id": "UPI-TXN-005-1",
                "entity_reference": "upi:traveler@mockupi",
                "timestamp": "2026-09-28T14:15:00Z",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "city": "Bengaluru",
                "country_code": "IN",
                "source": "synthetic",
            },
            {
                "transaction_id": "UPI-TXN-005-2",
                "entity_reference": "upi:traveler@mockupi",
                "timestamp": "2026-09-28T14:30:00Z",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "city": "Delhi",
                "country_code": "IN",
                "source": "synthetic",
            },
        ],
    },

    # UNIFIED-DEMO-006: Shared VASP Multi-Rail Off-Ramp Hub
    "UNIFIED-DEMO-006": {
        "case_id": "UNIFIED-DEMO-006",
        "title": "Shared VASP Multi-Rail Settlement Hub",
        "description": "Multiple independent crypto inputs converging into a centralized exchange with UPI payouts.",
        "crypto_transactions": [
            {
                "transaction_hash": "0xeee001",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T15:00:00Z",
                "from_address": "0xfeeder111111111111111111111111111111111111",
                "to_address": "0xcentralhubexchange000000000000000000000000",
                "asset": "USDT",
                "amount": 20000.0,
                "transaction_type": "transfer",
            },
            {
                "transaction_hash": "0xeee002",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T15:05:00Z",
                "from_address": "0xfeeder222222222222222222222222222222222222",
                "to_address": "0xcentralhubexchange000000000000000000000000",
                "asset": "USDT",
                "amount": 35000.0,
                "transaction_type": "transfer",
            },
        ],
        "vasp_attributions": [
            {
                "wallet_address": "0xcentralhubexchange000000000000000000000000",
                "vasp_name": "Nexus Global VASP",
                "risk_score": 50.0,
            }
        ],
        "cross_rail_associations": [
            {
                "source_node_id": "vasp:nexus global vasp",
                "target_node_id": "upi:nexus_inr_desk@mockupi",
                "source_rail": "CRYPTO",
                "target_rail": "UPI",
                "confidence": 95.0,
                "description": "Institutional banking disbursement channel for INR fiat settlements.",
            }
        ],
        "upi_transactions": [
            {
                "transaction_id": "UPI-TXN-006-1",
                "timestamp": "2026-09-28T15:30:00Z",
                "amount": 1500000.0,
                "currency": "INR",
                "sender_vpa": "nexus_inr_desk@mockupi",
                "receiver_vpa": "distributor_prime@mockupi",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            }
        ],
        "location_signals": [],
    },

    # UNIFIED-DEMO-007: Disconnected Multi-Rail Component Verification
    "UNIFIED-DEMO-007": {
        "case_id": "UNIFIED-DEMO-007",
        "title": "Independent Multi-Rail Components Without Cross-Rail Bridge",
        "description": "Verifies that disconnected crypto and UPI graphs remain isolated without false links.",
        "crypto_transactions": [
            {
                "transaction_hash": "0xfff001",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T16:00:00Z",
                "from_address": "0xisolated_crypto_a000000000000000000000001",
                "to_address": "0xisolated_crypto_b000000000000000000000001",
                "asset": "ETH",
                "amount": 1.5,
                "transaction_type": "transfer",
            }
        ],
        "vasp_attributions": [],
        "upi_transactions": [
            {
                "transaction_id": "UPI-TXN-007-1",
                "timestamp": "2026-09-28T16:10:00Z",
                "amount": 5000.0,
                "currency": "INR",
                "sender_vpa": "isolated_upi_a@mockupi",
                "receiver_vpa": "isolated_upi_b@mockupi",
                "transaction_type": "P2P",
                "status": "SUCCESS",
            }
        ],
        "location_signals": [],
        "cross_rail_associations": [],
    },

    # UNIFIED-DEMO-CONTROL: Normal Baseline Activity (Low Risk, Multi-Rail)
    "UNIFIED-DEMO-CONTROL": {
        "case_id": "UNIFIED-DEMO-CONTROL",
        "title": "Normal Benign Multi-Rail Transaction Activity",
        "description": "Standard legitimate retail transactions across both crypto and UPI rails.",
        "crypto_transactions": [
            {
                "transaction_hash": "0xctl001",
                "blockchain": "ethereum",
                "timestamp": "2026-09-28T08:00:00Z",
                "from_address": "0xretail_alice0000000000000000000000000001",
                "to_address": "0xretail_bob00000000000000000000000000000001",
                "asset": "ETH",
                "amount": 0.05,
                "transaction_type": "transfer",
            }
        ],
        "vasp_attributions": [],
        "upi_transactions": [
            {
                "transaction_id": "UPI-TXN-CTL-1",
                "timestamp": "2026-09-28T08:15:00Z",
                "amount": 450.0,
                "currency": "INR",
                "sender_vpa": "grocery_customer@mockupi",
                "receiver_vpa": "daily_mart@mockupi",
                "merchant_id": "MERCH_GROCERY_99",
                "merchant_category": "5411",
                "transaction_type": "P2M",
                "status": "SUCCESS",
            }
        ],
        "location_signals": [],
        "cross_rail_associations": [],
    },
}
