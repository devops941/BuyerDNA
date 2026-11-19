from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from .rfm import TransactionItem

class BehaviourRequest(BaseModel):
    transactions: List[TransactionItem]

class MonthlyTrend(BaseModel):
    month: str
    revenue: float
    transactions: int
    active_customers: int
    aov: float

class CategoryInsight(BaseModel):
    category: str
    revenue: float
    units_sold: float
    transactions_count: int
    avg_price: float
    percentage_revenue: float

class DayOfWeekPattern(BaseModel):
    day: str
    transactions: int
    revenue: float

class PriceTierDistribution(BaseModel):
    tier: str
    min_price: float
    max_price: float
    transaction_count: int
    revenue: float
    percentage: float

class BehaviourResponse(BaseModel):
    status: str = "success"
    repeat_purchase_rate: float
    total_customers: int
    repeat_customers: int
    one_time_customers: int
    average_order_value: float
    avg_purchase_interval_days: float
    monthly_trends: List[MonthlyTrend]
    category_insights: List[CategoryInsight]
    day_of_week_patterns: List[DayOfWeekPattern]
    price_tier_distribution: List[PriceTierDistribution]
    top_selling_products: List[Dict[str, Any]]
