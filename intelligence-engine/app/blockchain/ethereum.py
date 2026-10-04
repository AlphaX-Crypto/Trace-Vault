import logging
import os
from typing import Any, Dict, List, Optional
import httpx

from app.attribution.registry import VaspRegistry
from app.blockchain.base import BaseBlockchainAdapter

logger = logging.getLogger(__name__)


class EthereumAdapter(BaseBlockchainAdapter):
    """
    Live Ethereum Blockchain & Indexer Adapter.
    Fetches real on-chain transaction history for Ethereum wallet addresses using
    Etherscan API or open Blockscout Explorer APIs.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        indexer_url: Optional[str] = None,
        registry: Optional[VaspRegistry] = None,
        timeout: float = 10.0,
    ):
        self.api_key = api_key or os.getenv("ETHERSCAN_API_KEY") or os.getenv("BLOCKCHAIN_INTELLIGENCE_API_KEY")
        self.indexer_url = indexer_url or os.getenv("ETHEREUM_INDEXER_URL") or "https://eth.blockscout.com/api"
        self.registry = registry if registry is not None else VaspRegistry()
        self.timeout = timeout
        self.client = httpx.Client(timeout=self.timeout)

    @property
    def is_live(self) -> bool:
        return True

    def get_transactions(self, address: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch confirmed on-chain transactions for an Ethereum address.
        Attempts Blockscout open indexer or Etherscan API.
        """
        clean_address = address.strip().lower()
        if not clean_address.startswith("0x") or len(clean_address) != 42:
            logger.debug(f"Address {address} is not a 42-char hex Ethereum address, skipping live query.")
            return []

        # 1. Etherscan API if API key is provided
        if self.api_key and "etherscan.io" in self.indexer_url.lower():
            params = {
                "module": "account",
                "action": "txlist",
                "address": clean_address,
                "startblock": 0,
                "endblock": 99999999,
                "page": 1,
                "offset": limit,
                "sort": "desc",
                "apikey": self.api_key,
            }
        else:
            # Blockscout / Public Etherscan-compatible open indexer API
            params = {
                "module": "account",
                "action": "txlist",
                "address": clean_address,
                "offset": limit,
                "sort": "desc",
            }
            if self.api_key:
                params["apikey"] = self.api_key

        try:
            logger.info(f"Querying live Ethereum indexer ({self.indexer_url}) for {clean_address}...")
            response = self.client.get(self.indexer_url, params=params)

            if response.status_code != 200:
                logger.warning(f"Indexer HTTP {response.status_code} from {self.indexer_url}: {response.text[:200]}")
                return []

            data = response.json()
            status = data.get("status")
            result = data.get("result")

            if status == "1" and isinstance(result, list):
                logger.info(f"Retrieved {len(result)} live transactions for {clean_address}")
                return result
            elif isinstance(result, list):
                return result
            else:
                logger.info(f"Indexer returned status {status} or message: {data.get('message')}")
                return []

        except httpx.RequestError as exc:
            logger.warning(f"Live Ethereum indexer request failed for {clean_address}: {exc}")
            return []
        except Exception as exc:
            logger.error(f"Unexpected error querying live Ethereum indexer: {exc}", exc_info=True)
            return []

    def get_entity_info(self, address: str) -> Optional[Dict[str, Any]]:
        """
        Check if the address belongs to a known VASP, exchange deposit wallet, or high-risk entity.
        """
        clean_address = address.strip().lower()
        if self.registry:
            entry = self.registry.lookup(clean_address)
            if entry:
                return {
                    "name": entry.vasp_name,
                    "entity_name": entry.entity_name,
                    "type": entry.entity_type,
                    "source": entry.source,
                    "updated_at": entry.updated_at,
                    "risk_score": entry.risk_score,
                    "tags": entry.tags,
                    "metadata": entry.metadata,
                }
        return None
