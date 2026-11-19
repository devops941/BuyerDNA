from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CustomerMetrics(BaseModel):
    customer_id: str
    recency: float
    frequency: float
    monetary: float
    avg_order_value: float
    lifespan_days: Optional[float] = 90.0
    avg_interval_days: Optional[float] = 30.0

class CLVChurnRequest(BaseModel):
    customers: List[CustomerMetrics]
    inactivity_threshold_days: Optional[int] = 60
    profit_margin: Optional[float] = 0.20
    discount_rate: Optional[float] = 0.10

class CustomerRiskResult(BaseModel):
    customer_id: str
    clv_projected: float
    clv_historical: float
    churn_probability: float
    churn_risk_level: str  # "Low", "Medium", "High"
    expected_future_transactions: float
    inactivity_ratio: float

class CLVChurnResponse(BaseModel):
    status: str = "success"
    average_projected_clv: float
    high_churn_risk_count: int
    medium_churn_risk_count: int
    low_churn_risk_count: int
    risk_distribution: Dict[str, int]
    customers: List[CustomerRiskResult]
