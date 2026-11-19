import numpy as np
import pandas as pd
from typing import List, Dict, Any
from app.schemas.clv_churn import (
    CustomerMetrics, CLVChurnRequest, CLVChurnResponse, CustomerRiskResult
)

def sigmoid(x: float) -> float:
    return float(1.0 / (1.0 + np.exp(-np.clip(x, -10, 10))))

def calculate_clv_and_churn(
    customers: List[CustomerMetrics],
    inactivity_threshold_days: int = 60,
    profit_margin: float = 0.20,
    discount_rate: float = 0.10
) -> CLVChurnResponse:
    if not customers:
        raise ValueError("Customer list cannot be empty for CLV and Churn analysis.")

    results: List[CustomerRiskResult] = []
    high_count = 0
    medium_count = 0
    low_count = 0
    total_projected_clv = 0.0

    for c in customers:
        recency = max(0.0, c.recency)
        freq = max(1.0, c.frequency)
        monetary = max(0.0, c.monetary)
        aov = max(0.0, c.avg_order_value)
        lifespan = max(30.0, c.lifespan_days or 90.0)
        avg_interval = max(14.0, c.avg_interval_days or 30.0)

        # 1. Churn Probability Calculation
        # Ratio of elapsed recency to customer's expected purchase cycle
        inactivity_ratio = recency / avg_interval
        # Threshold effect
        threshold_factor = (recency - inactivity_threshold_days) / inactivity_threshold_days

        # Combine into standardized logit score
        z = (inactivity_ratio - 1.3) * 1.2 + threshold_factor * 0.8
        churn_prob = round(sigmoid(z), 3)

        if churn_prob >= 0.65:
            risk_level = "High"
            high_count += 1
        elif churn_prob >= 0.35:
            risk_level = "Medium"
            medium_count += 1
        else:
            risk_level = "Low"
            low_count += 1

        # 2. Customer Lifetime Value (CLV) Calculation
        # Retention probability = 1 - churn_prob
        retention_prob = max(0.05, 1.0 - churn_prob)
        # Annualized frequency
        annual_freq = freq * (365.0 / lifespan)
        expected_annual_transactions = min(50.0, annual_freq * retention_prob)
        
        # Expected future margin
        future_margin = expected_annual_transactions * aov * profit_margin
        # Multi-year projection with discount rate
        denominator = max(0.05, (1.0 + discount_rate - retention_prob))
        future_clv = future_margin / denominator
        projected_clv = round(monetary + future_clv, 2)
        total_projected_clv += projected_clv

        results.append(CustomerRiskResult(
            customer_id=c.customer_id,
            clv_projected=projected_clv,
            clv_historical=round(monetary, 2),
            churn_probability=churn_prob,
            churn_risk_level=risk_level,
            expected_future_transactions=round(expected_annual_transactions, 1),
            inactivity_ratio=round(inactivity_ratio, 2)
        ))

    avg_projected_clv = round(total_projected_clv / (len(customers) or 1), 2)

    return CLVChurnResponse(
        status="success",
        average_projected_clv=avg_projected_clv,
        high_churn_risk_count=high_count,
        medium_churn_risk_count=medium_count,
        low_churn_risk_count=low_count,
        risk_distribution={
            "High": high_count,
            "Medium": medium_count,
            "Low": low_count
        },
        customers=results
    )
