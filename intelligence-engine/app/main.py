from fastapi import FastAPI
from app.api.routes import analysis, upi, investigations

app = FastAPI(
    title="TRACEVAULT Intelligence Engine",
    version="0.3.0",
    description="Automated Blockchain Intelligence & VASP Attribution Engine with UPI Data Foundation",
)

app.include_router(analysis.router)
app.include_router(upi.router)
app.include_router(investigations.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "tracevault-intelligence",
        "engine": "NetworkX v2.0",
        "upi_foundation": "v1.0",
    }
