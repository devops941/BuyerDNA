from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RfmConfig(BaseModel):
    referenceDate: Optional[str] = None
    rBins: int = 5
    fBins: int = 5
    mBins: int = 5
    recencyWeight: float = 0.3
    frequencyWeight: float = 0.3
    monetaryWeight: float = 0.4


class ClusteringConfig(BaseModel):
    nClusters: int = 4
    autoDetectK: bool = False
    kMin: int = 2
    kMax: int = 7
    features: List[str] = ["recency", "frequency", "monetary", "avg_order_value"]
    randomState: int = 42


class SaveConfigRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    rfmConfig: Optional[RfmConfig] = None
    clusteringConfig: Optional[ClusteringConfig] = None
    inactivityThresholdDays: int = 60
    isDefault: bool = False


class ModelConfigResponse(BaseModel):
    id: str
    name: str
    description: str = ""
    algorithm: str = "comprehensive"
    isDefault: bool = False
    rfmConfig: Optional[RfmConfig] = None
    clusteringConfig: Optional[ClusteringConfig] = None
    inactivityThresholdDays: int = 60
    userId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
