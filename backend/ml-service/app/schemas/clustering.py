from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ClusteringCustomerInput(BaseModel):
    customer_id: str
    recency: float
    frequency: float
    monetary: float
    avg_order_value: float
    category_diversity: Optional[float] = 1.0

class ClusteringConfig(BaseModel):
    n_clusters: int = 4
    auto_detect_k: bool = False
    k_min: int = 2
    k_max: int = 7
    features: List[str] = ["recency", "frequency", "monetary", "avg_order_value"]
    random_state: int = 42

class ClusteringRequest(BaseModel):
    customers: List[ClusteringCustomerInput]
    config: Optional[ClusteringConfig] = Field(default_factory=ClusteringConfig)

class ElbowPoint(BaseModel):
    k: int
    wcss: float
    silhouette: Optional[float] = None

class ClusterCentroid(BaseModel):
    cluster_id: int
    name: str
    description: str
    customer_count: int
    percentage: float
    avg_recency: float
    avg_frequency: float
    avg_monetary: float
    avg_aov: float
    total_spending: float
    dominant_traits: List[str]

class CustomerClusterResult(BaseModel):
    customer_id: str
    cluster_id: int
    cluster_name: str
    pca_x: float
    pca_y: float

class ClusteringResponse(BaseModel):
    status: str = "success"
    optimal_k: int
    chosen_k: int
    silhouette_score: float
    elbow_curve: List[ElbowPoint]
    clusters: List[ClusterCentroid]
    customer_assignments: List[CustomerClusterResult]
    features_used: List[str]
