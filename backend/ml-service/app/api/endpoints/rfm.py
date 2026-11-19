from fastapi import APIRouter, HTTPException
from app.schemas.rfm import RFMRequest, RFMResponse
from app.services.rfm_engine import calculate_rfm

router = APIRouter()

@router.post("/analyze", response_model=RFMResponse)
def analyze_rfm_endpoint(payload: RFMRequest):
    try:
        response = calculate_rfm(payload.transactions, payload.config)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"RFM analysis error: {str(e)}")
