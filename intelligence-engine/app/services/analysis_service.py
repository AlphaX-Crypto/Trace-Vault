from app.models.analysis import AnalyzeWalletRequest, AnalysisResult
from app.blockchain.mock import MockBlockchainAdapter
from app.normalization.transaction_normalizer import TransactionNormalizer
from app.blockchain.mock_graph import MockGraphProvider
from app.attribution.vasp_identifier import VaspIdentifier
from app.risk.scorer import RiskScorer

class AnalysisService:
    def __init__(self):
        self.adapter = MockBlockchainAdapter()
        self.normalizer = TransactionNormalizer()
        self.graph_provider = MockGraphProvider()
        self.vasp_identifier = VaspIdentifier(self.graph_provider, self.adapter)
        self.risk_scorer = RiskScorer(self.adapter.get_entity_info)

    def analyze_wallet(self, request: AnalyzeWalletRequest) -> AnalysisResult:
        # Crawl relevant transactions up to 3 hops from the requested wallet
        visited_addresses = set([request.wallet_address])
        addresses_to_explore = [request.wallet_address]
        raw_txs = []
        raw_tx_hashes = set()
        
        for hop in range(3):
            next_addresses = []
            for addr in addresses_to_explore:
                txs = self.adapter.get_transactions(addr)
                for tx in txs:
                    if tx["hash"] not in raw_tx_hashes:
                        raw_txs.append(tx)
                        raw_tx_hashes.add(tx["hash"])
                    
                    if tx["to"] not in visited_addresses:
                        visited_addresses.add(tx["to"])
                        next_addresses.append(tx["to"])
                    if tx["from"] not in visited_addresses:
                        visited_addresses.add(tx["from"])
                        next_addresses.append(tx["from"])
            addresses_to_explore = next_addresses
            if not addresses_to_explore:
                break

        normalized_txs = [self.normalizer.normalize_mock(tx) for tx in raw_txs]
        
        self.graph_provider.build_graph(normalized_txs)
        
        attribution, path, evidence = self.vasp_identifier.identify_vasp(request.wallet_address)
        
        distance = attribution.distance if attribution else 0
        
        risk_result = self.risk_scorer.calculate_risk(path, distance, raw_txs)
        
        return AnalysisResult(
            case_id=request.case_id,
            wallet=request.wallet_address,
            blockchain=request.blockchain,
            nearest_vasp=attribution,
            risk=risk_result,
            path=path,
            evidence=evidence
        )
