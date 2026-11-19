from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TransactionItem(BaseModel):
    customer_id: str
    transaction_id: str
    transaction_date: str
    product_id: Optional[str] = "P1"
    product_category: Optional[str] = "General"
    quantity: float = 1.0
    unit_price: float = 0.0
    total_amount: float
    payment_method: Optional[str] = "Card"
    discount: Optional[float] = 0.0
    channel: Optional[str] = "Online"

class RFMConfig(BaseModel):
    reference_date: Optional[str] = None
    r_bins: int = 5
    f_bins: int = 5
    m_bins: int = 5
    recency_weight: float = 0.3
    frequency_weight: float = 0.3
    monetary_weight: float = 0.4

class RFMRequest(BaseModel):
    transactions: List[TransactionItem]
    config: Optional[RFMConfig] = Field(default_factory=RFMConfig)

class CustomerRFMResult(BaseModel):
    customer_id: str
    recency_days: int
    frequency: int
    monetary: float
    r_score: int
    f_score: int
    m_score: int
    rfm_score_str: str
    rfm_composite_score: float
    segment: str
    last_purchase_date: str
    first_purchase_date: str
    avg_order_value: float

class SegmentSummary(BaseModel):
    segment: str
    customer_count: int
    percentage: float
    avg_recency: float
    avg_frequency: float
    avg_monetary: float
    total_revenue: float
    revenue_percentage: float

class RFMResponse(BaseModel):
    status: str = "success"
    total_customers: int
    total_revenue: float
    avg_recency: float
    avg_frequency: float
    avg_monetary: float
    reference_date: str
    segments_summary: List[SegmentSummary]
    customers: List[CustomerRFMResult]
