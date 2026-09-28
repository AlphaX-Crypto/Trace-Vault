"""
Unit Test Suite for Live Ethereum Pipeline:
Ethereum Wallet -> Blockchain/Indexer Data -> CommonTransaction -> NetworkX -> TRACEVAULT Intelligence.
"""

from unittest.mock import MagicMock, patch
import httpx
import pytest

from app.attribution.registry import VaspRegistry
from app.blockchain.base import BaseBlockchainAdapter
from app.blockchain.ethereum import EthereumAdapter
from app.blockchain.mock import MockBlockchainAdapter
from app.models.analysis import AnalyzeWalletRequest
from app.normalization.transaction_normalizer import TransactionNormalizer
from app.services.analysis_service import AnalysisService


# ---------------------------------------------------------------------------
# Test 1: Adapter Live Properties and Inheritance
# ---------------------------------------------------------------------------
def test_adapter_properties():
    mock_adapter = MockBlockchainAdapter()
    eth_adapter = EthereumAdapter()

    assert isinstance(mock_adapter, BaseBlockchainAdapter)
    assert isinstance(eth_adapter, BaseBlockchainAdapter)
    assert mock_adapter.is_live is False
    assert eth_adapter.is_live is True


# ---------------------------------------------------------------------------
# Test 2: Ethereum Address Validation
# ---------------------------------------------------------------------------
def test_ethereum_adapter_address_validation():
    adapter = EthereumAdapter()
    # Should not query indexer for invalid formats, returns empty list safely
    assert adapter.get_transactions("not-an-address") == []
    assert adapter.get_transactions("0xShort") == []
    assert adapter.get_transactions("A") == []


# ---------------------------------------------------------------------------
# Test 3: Ethereum Adapter Mocked HTTP Response
# ---------------------------------------------------------------------------
def test_ethereum_adapter_get_transactions_success():
    adapter = EthereumAdapter(indexer_url="https://mock.indexer.test/api")
    test_addr = "0x" + "a" * 40

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "status": "1",
        "message": "OK",
        "result": [
            {
                "hash": "0xabc123",
                "timeStamp": "1693526400",
                "from": test_addr,
                "to": "0x" + "b" * 40,
                "value": "1500000000000000000",
                "blockNumber": "18000000",
                "gas": "21000",
                "input": "0x",
            }
        ],
    }

    with patch.object(adapter.client, "get", return_value=mock_response) as mock_get:
        txs = adapter.get_transactions(test_addr)
        assert len(txs) == 1
        assert txs[0]["hash"] == "0xabc123"
        assert txs[0]["value"] == "1500000000000000000"
        mock_get.assert_called_once()


# ---------------------------------------------------------------------------
# Test 4: Ethereum Adapter Network Error Resilience
# ---------------------------------------------------------------------------
def test_ethereum_adapter_error_resilience():
    adapter = EthereumAdapter(indexer_url="https://mock.indexer.test/api")
    test_addr = "0x" + "a" * 40

    # 1. HTTP 500 error
    mock_err_resp = MagicMock()
    mock_err_resp.status_code = 500
    mock_err_resp.text = "Internal Server Error"
    with patch.object(adapter.client, "get", return_value=mock_err_resp):
        txs = adapter.get_transactions(test_addr)
        assert txs == []

    # 2. Connection exception
    with patch.object(adapter.client, "get", side_effect=httpx.ConnectError("Network unreachable")):
        txs = adapter.get_transactions(test_addr)
        assert txs == []


# ---------------------------------------------------------------------------
# Test 5: TransactionNormalizer with Real Ethereum Format
# ---------------------------------------------------------------------------
def test_normalize_ethereum_indexer_format():
    raw_tx = {
        "hash": "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef",
        "timeStamp": "1693526400",
        "from": "0x1111111111111111111111111111111111111111",
        "to": "0x2222222222222222222222222222222222222222",
        "value": "2500000000000000000",  # 2.5 ETH in Wei
        "blockNumber": "18000000",
        "gas": "21000",
        "gasPrice": "20000000000",
        "isError": "0",
        "input": "0x",
    }

    tx = TransactionNormalizer.normalize_ethereum(raw_tx)
    assert tx.transaction_hash == raw_tx["hash"]
    assert tx.blockchain == "ethereum"
    assert tx.amount == 2.5
    assert tx.asset == "ETH"
    assert tx.block_number == 18000000
    assert tx.transaction_type == "transfer"
    assert tx.source == "ethereum_indexer"
    assert "2023-09-01" in tx.timestamp
    assert tx.metadata.get("gas") == "21000"


# ---------------------------------------------------------------------------
# Test 6: TransactionNormalizer Intelligent Dispatch
# ---------------------------------------------------------------------------
def test_normalize_dispatcher():
    # 1. Ethereum indexer format
    eth_raw = {
        "hash": "0xeth1",
        "timeStamp": "1600000000",
        "from": "0xfrom",
        "to": "0xto",
        "value": "1000000000000000000",
        "blockNumber": "100",
    }
    tx_eth = TransactionNormalizer.normalize(eth_raw)
    assert tx_eth.amount == 1.0
    assert tx_eth.source == "ethereum_indexer"

    # 2. Mock ledger format
    mock_raw = {
        "transaction_hash": "tx_mock_1",
        "from_address": "A",
        "to_address": "B",
        "amount": 5.0,
        "asset": "ETH",
        "source": "mock_adapter",
    }
    tx_mock = TransactionNormalizer.normalize(mock_raw)
    assert tx_mock.amount == 5.0
    assert tx_mock.source == "mock_adapter"


# ---------------------------------------------------------------------------
# Test 7: VaspRegistry Live Ethereum Entities
# ---------------------------------------------------------------------------
def test_vasp_registry_ethereum_entities():
    registry = VaspRegistry()

    # Binance Hot Wallet
    binance = registry.lookup("0x28c6c06298d514db089934071355e5743bf21d60")
    assert binance is not None
    assert binance.vasp_name == "Binance"
    assert binance.entity_type == "EXCHANGE_HOT_WALLET"

    # Coinbase Hot Wallet
    coinbase = registry.lookup("0x503828976d22510aad0201ac7ec88293211d23dc")
    assert coinbase is not None
    assert coinbase.vasp_name == "Coinbase"

    # Tornado Cash Router
    tornado = registry.lookup("0xd90e2f925da726b50c4ed8d0fb90ad053324f31b")
    assert tornado is not None
    assert tornado.entity_type == "MIXER"
    assert tornado.risk_score == 100.0


# ---------------------------------------------------------------------------
# Test 8: End-to-End Live Ethereum Intelligence Pipeline
# ---------------------------------------------------------------------------
def test_end_to_end_ethereum_analysis_pipeline():
    """
    Simulates a real Ethereum wallet investigation where:
    Suspect wallet -> Intermediate wallet -> Binance Hot Wallet
    Fetched from Ethereum indexer, normalized, graph built, BFS traversed,
    attributed to Binance, confidence scored, risk scored, and evidence collected.
    """
    suspect_addr = "0x1111111111111111111111111111111111111111"
    intermediate_addr = "0x2222222222222222222222222222222222222222"
    binance_wallet = "0x28c6c06298d514db089934071355e5743bf21d60"

    # Mock transactions returned by indexer
    mock_eth_adapter = MagicMock(spec=EthereumAdapter)
    mock_eth_adapter.is_live = True

    def get_tx_side_effect(address: str, limit: int = 50):
        if address.lower() == suspect_addr.lower():
            return [
                {
                    "hash": "0xtx1_suspect_to_inter",
                    "timeStamp": "1693526400",
                    "from": suspect_addr,
                    "to": intermediate_addr,
                    "value": "5000000000000000000",  # 5 ETH
                    "blockNumber": "18000001",
                    "source": "ethereum_indexer",
                }
            ]
        elif address.lower() == intermediate_addr.lower():
            return [
                {
                    "hash": "0xtx2_inter_to_binance",
                    "timeStamp": "1693526500",
                    "from": intermediate_addr,
                    "to": binance_wallet,
                    "value": "4950000000000000000",  # 4.95 ETH
                    "blockNumber": "18000010",
                    "source": "ethereum_indexer",
                }
            ]
        return []

    mock_eth_adapter.get_transactions.side_effect = get_tx_side_effect
    mock_eth_adapter.get_entity_info.side_effect = lambda addr: VaspRegistry().lookup(addr).to_dict() if VaspRegistry().lookup(addr) else None

    analysis_service = AnalysisService(
        adapter=MockBlockchainAdapter(),
        ethereum_adapter=mock_eth_adapter,
    )

    request = AnalyzeWalletRequest(
        case_id="CASE-ETH-LIVE-001",
        wallet_address=suspect_addr,
        blockchain="ethereum",
        max_hops=3,
    )

    result = analysis_service.analyze_wallet(request)

    # 1. Result verification
    assert result.status == "Analysis complete"
    assert result.wallet == suspect_addr
    assert len(result.transactions) == 2
    assert result.transactions[0].amount in (5.0, 4.95)

    # 2. Graph structure verification
    assert result.metadata["node_count"] >= 3
    assert result.metadata["edge_count"] >= 2

    # 3. Attribution verification
    assert result.nearest_vasp is not None
    assert result.nearest_vasp.entity == "Binance"
    assert str(result.nearest_vasp.path[-1]).lower() == binance_wallet.lower()
    assert result.nearest_vasp.distance == 2  # Suspect -> Inter -> Binance
    # Confidence: 90 base - 2*10 hop penalty = 70.0
    assert result.nearest_vasp.confidence == 70.0
    assert result.nearest_vasp.confidence_label in ("HIGH", "High confidence")

    # 4. Evidence items verification
    assert len(result.evidence) > 0
    tx_evidences = [e for e in result.evidence if e.type == "TRANSACTION"]
    attr_evidences = [e for e in result.evidence if e.type == "ATTRIBUTION"]
    assert len(tx_evidences) >= 2
    assert len(attr_evidences) >= 1
