from fastapi import APIRouter, HTTPException
from app.schemas.clv_churn import CLVChurnRequest, CLVChurnResponse
from app.services.clv_churn_engine import calculate_clv_and_churn

router = APIRouter()

@router.post("/predict", response_model=CLVChurnResponse)
def predict_churn_endpoint(payload: CLVChurnRequest):
    try:
        response = calculate_clv_and_churn(
            customers=payload.customers,
            inactivity_threshold_days=payload.inactivity_threshold_days or 60,
            profit_margin=payload.profit_margin or 0.20,
            discount_rate=payload.discount_rate or 0.10
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CLV & Churn analysis error: {str(e)}")
