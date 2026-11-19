from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BuyerDNA ML Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
