from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AnalysisResultResponse(BaseModel):
    id: str
    jobId: str
    datasetId: str
    algorithm: str = "comprehensive"
    totalCustomers: int = 0
    totalRevenue: float = 0
    averageOrderValue: float = 0
    repeatPurchaseRate: float = 0
    rfmSegmentsSummary: List[Dict[str, Any]] = []
    clusteringSummary: Optional[Dict[str, Any]] = None
    clusters: List[Dict[str, Any]] = []
    elbowCurve: List[Dict[str, Any]] = []
    monthlyTrends: List[Dict[str, Any]] = []
    categoryInsights: List[Dict[str, Any]] = []
    dayOfWeekPatterns: List[Dict[str, Any]] = []
    priceTierDistribution: List[Dict[str, Any]] = []
    clvSummary: Optional[Dict[str, Any]] = None
    recommendations: List[Dict[str, Any]] = []
    createdAt: Optional[datetime] = None
