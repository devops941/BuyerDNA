from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .rfm import TransactionItem, RFMConfig, RFMResponse
from .clustering import ClusteringConfig, ClusteringResponse
from .behaviour import BehaviourResponse
from .clv_churn import CLVChurnResponse

class ComprehensiveAnalysisRequest(BaseModel):
    transactions: List[TransactionItem]
    rfm_config: Optional[RFMConfig] = Field(default_factory=RFMConfig)
    clustering_config: Optional[ClusteringConfig] = Field(default_factory=ClusteringConfig)
    inactivity_threshold_days: Optional[int] = 60

class MarketingRecommendation(BaseModel):
    id: str
    target_segment: str
    priority: str  # "High", "Medium", "Urgent"
    title: str
    rationale: str
    supporting_metric: str
    action_plan: str
    expected_impact: str

class ComprehensiveAnalysisResponse(BaseModel):
    status: str = "success"
    analysis_timestamp: str
    total_records_processed: int
    total_customers: int
    total_revenue: float
    average_order_value: float
    repeat_purchase_rate: float
    rfm: RFMResponse
    clustering: ClusteringResponse
    behaviour: BehaviourResponse
    clv_churn: CLVChurnResponse
    recommendations: List[MarketingRecommendation]
