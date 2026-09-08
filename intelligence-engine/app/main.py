from fastapi import FastAPI
from app.api.routes import analysis

app = FastAPI(
    title="TRACEVAULT Intelligence Engine",
    version="0.1.0"
)

app.include_router(analysis.router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "tracevault-intelligence"
    }
