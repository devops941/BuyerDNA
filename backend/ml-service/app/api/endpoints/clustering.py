from fastapi import APIRouter, HTTPException
from app.schemas.clustering import ClusteringRequest, ClusteringResponse
from app.services.clustering_engine import run_clustering

router = APIRouter()

@router.post("/run", response_model=ClusteringResponse)
def run_clustering_endpoint(payload: ClusteringRequest):
    try:
        response = run_clustering(payload.customers, payload.config)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Clustering error: {str(e)}")
