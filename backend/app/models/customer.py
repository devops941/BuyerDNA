from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryPreference(BaseModel):
    category: str
    spend: float
    count: int


class CustomerResponse(BaseModel):
    id: str
    datasetId: str
    customerId: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    recencyDays: int = 0
    frequency: int = 1
    monetary: float = 0
    avgOrderValue: float = 0
    rScore: int = 1
    fScore: int = 1
    mScore: int = 1
    rfmScoreStr: str = "111"
    rfmCompositeScore: float = 1.0
    segment: str = "New Customers"
    clusterId: int = 0
    clusterName: str = "Unassigned"
    pcaX: float = 0
    pcaY: float = 0
    clvProjected: float = 0
    clvHistorical: float = 0
    churnRiskLevel: str = "Low"
    churnProbability: float = 0.1
    firstPurchaseDate: Optional[datetime] = None
    lastPurchaseDate: Optional[datetime] = None
    topCategory: Optional[str] = None
    categoryPreferences: List[CategoryPreference] = []
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
