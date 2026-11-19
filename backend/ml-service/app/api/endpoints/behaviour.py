from fastapi import APIRouter, HTTPException
from app.schemas.behaviour import BehaviourRequest, BehaviourResponse
from app.services.behaviour_engine import analyze_behaviour

router = APIRouter()

@router.post("/analyze", response_model=BehaviourResponse)
def analyze_behaviour_endpoint(payload: BehaviourRequest):
    try:
        response = analyze_behaviour(payload.transactions)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Behaviour analysis error: {str(e)}")
