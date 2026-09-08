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
        raw_txs = self.adapter.get_all_transactions()
        normalized_txs = [self.normalizer.normalize_mock(tx) for tx in raw_txs]
        
        self.graph_provider.build_graph(normalized_txs)
        
        attribution, path, evidence = self.vasp_identifier.identify_vasp(request.wallet_address)
        
        distance = attribution.distance if attribution else 0
        
        # In a real scenario, we pass transactions specifically related to the wallet/path.
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
