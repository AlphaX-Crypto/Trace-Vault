from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "tracevault-intelligence"}

def test_analyze_wallet_success():
    payload = {
        "case_id": "CASE-001",
        "blockchain": "ethereum",
        "wallet_address": "A"
    }
    response = client.post("/api/v1/analyze-wallet", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "CASE-001"
    assert data["wallet"] == "A"
    # From A -> B -> C -> EXCHANGE_DEPOSIT (distance 3)
    # Wait, A -> B is 1, B -> C is 2, C -> EXCHANGE_DEPOSIT is 3
    # Mixer is A -> MIXER_1 (distance 1). But BFS explores level by level. 
    # MIXER_1 is a VASP? No, MIXER_1 is MIXER type.
    # Our BFS checks: entity.get("type") in ["VASP", "EXCHANGE", "DEPOSIT_WALLET"]
    # So MIXER_1 is NOT returned as VASP. The VASP returned should be EXCHANGE_DEPOSIT at distance 3.
    assert data["nearest_vasp"]["name"] == "Example Exchange"
    assert data["nearest_vasp"]["distance"] == 3
    assert "Mixer interaction detected (+30)" in data["risk"]["indicators"]

def test_analyze_wallet_invalid_blockchain():
    payload = {
        "case_id": "CASE-001",
        "blockchain": "invalid_chain",
        "wallet_address": "A"
    }
    response = client.post("/api/v1/analyze-wallet", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported blockchain"
