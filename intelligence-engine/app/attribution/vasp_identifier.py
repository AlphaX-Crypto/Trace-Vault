from app.core.interfaces import IGraphProvider
from app.blockchain.mock import MockBlockchainAdapter
from app.attribution.confidence import calculate_confidence
from app.models.analysis import VaspAttribution
from typing import Optional, List, Tuple

class VaspIdentifier:
    def __init__(self, graph_provider: IGraphProvider, mock_adapter: MockBlockchainAdapter):
        self.graph = graph_provider
        self.adapter = mock_adapter

    def identify_vasp(self, start_address: str) -> Tuple[Optional[VaspAttribution], List[str], List[str]]:
        result = self.graph.find_nearest_vasp(start_address, self.adapter.get_entity_info)
        
        evidence = []
        if not result:
            evidence.append("No known VASP reached within the analyzed transaction graph.")
            return None, [], evidence
            
        vasp_address, distance, path = result
        entity_info = self.adapter.get_entity_info(vasp_address)
        
        conf_score = calculate_confidence(distance, entity_info.get("type", "UNKNOWN"), path)
        
        evidence.append(f"Transaction path reached a tagged {entity_info.get('type')} address.")
        evidence.append(f"Known entity '{entity_info.get('name')}' was reached after {distance} hops.")
        
        attribution = VaspAttribution(
            name=entity_info.get("name", "Unknown VASP"),
            distance=distance,
            confidence=conf_score
        )
        return attribution, path, evidence
