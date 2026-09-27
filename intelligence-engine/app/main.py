from fastapi import FastAPI
from app.api.routes import analysis

app = FastAPI(
    title="TRACEVAULT Intelligence Engine",
    version="0.2.0",
    description="Automated Blockchain Intelligence & VASP Attribution Engine",
)

app.include_router(analysis.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "tracevault-intelligence",
        "engine": "NetworkX v2.0",
    }
