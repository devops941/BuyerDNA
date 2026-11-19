import httpx
from app.config.env import settings

_client = httpx.AsyncClient(base_url=settings.ML_SERVICE_URL, timeout=60.0)


async def ml_health() -> dict:
    r = await _client.get("/health")
    r.raise_for_status()
    return r.json()


async def run_rfm(transactions: list, config: dict = None) -> dict:
    r = await _client.post("/rfm/analyze", json={"transactions": transactions, "config": config or {}})
    r.raise_for_status()
    return r.json()


async def run_clustering(customers: list, config: dict = None) -> dict:
    r = await _client.post("/clustering/run", json={"customers": customers, "config": config or {}})
    r.raise_for_status()
    return r.json()


async def run_behaviour(transactions: list) -> dict:
    r = await _client.post("/behaviour/analyze", json={"transactions": transactions})
    r.raise_for_status()
    return r.json()


async def run_churn(customers: list, inactivity_threshold_days: int = 60) -> dict:
    r = await _client.post("/churn/predict", json={"customers": customers, "inactivity_threshold_days": inactivity_threshold_days})
    r.raise_for_status()
    return r.json()


async def run_comprehensive(transactions: list, rfm_config: dict = None, clustering_config: dict = None, inactivity_threshold_days: int = 60) -> dict:
    r = await _client.post("/comprehensive/analyze", json={
        "transactions": transactions,
        "rfm_config": rfm_config or {},
        "clustering_config": clustering_config or {},
        "inactivity_threshold_days": inactivity_threshold_days,
    })
    r.raise_for_status()
    return r.json()
