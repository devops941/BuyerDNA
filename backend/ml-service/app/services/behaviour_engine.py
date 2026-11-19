import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any
from app.schemas.behaviour import (
    BehaviourResponse, MonthlyTrend, CategoryInsight,
    DayOfWeekPattern, PriceTierDistribution
)
from app.schemas.rfm import TransactionItem

def analyze_behaviour(transactions: List[TransactionItem]) -> BehaviourResponse:
    if not transactions:
        raise ValueError("No transaction data supplied for behaviour analysis.")

    df = pd.DataFrame([t.model_dump() for t in transactions])
    df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
    df = df.dropna(subset=['transaction_date', 'customer_id', 'total_amount'])
    df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce').fillna(0.0)
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(1.0)
    df['unit_price'] = pd.to_numeric(df['unit_price'], errors='coerce').fillna(0.0)
    df['product_category'] = df['product_category'].fillna('General')

    # Total and Repeat Customers
    customer_counts = df.groupby('customer_id')['transaction_id'].nunique()
    total_customers = int(len(customer_counts))
    repeat_customers = int((customer_counts > 1).sum())
    one_time_customers = total_customers - repeat_customers
    repeat_rate = round((repeat_customers / (total_customers or 1)) * 100, 2)
    aov = round(float(df['total_amount'].mean()), 2)

    # Inter-purchase intervals
    df_sorted = df.sort_values(by=['customer_id', 'transaction_date'])
    df_sorted['prev_date'] = df_sorted.groupby('customer_id')['transaction_date'].shift(1)
    df_sorted['interval_days'] = (df_sorted['transaction_date'] - df_sorted['prev_date']).dt.days
    valid_intervals = df_sorted['interval_days'].dropna()
    avg_interval = round(float(valid_intervals.mean()), 1) if not valid_intervals.empty else 0.0

    # Monthly Trends
    df['year_month'] = df['transaction_date'].dt.strftime('%Y-%m')
    monthly_agg = df.groupby('year_month').agg(
        revenue=('total_amount', 'sum'),
        transactions=('transaction_id', 'nunique'),
        active_customers=('customer_id', 'nunique'),
        aov=('total_amount', 'mean')
    ).reset_index().sort_values('year_month')

    monthly_trends = [
        MonthlyTrend(
            month=str(row['year_month']),
            revenue=round(float(row['revenue']), 2),
            transactions=int(row['transactions']),
            active_customers=int(row['active_customers']),
            aov=round(float(row['aov']), 2)
        )
        for _, row in monthly_agg.iterrows()
    ]

    # Category Insights
    total_rev = float(df['total_amount'].sum()) or 1.0
    cat_agg = df.groupby('product_category').agg(
        revenue=('total_amount', 'sum'),
        units_sold=('quantity', 'sum'),
        transactions_count=('transaction_id', 'nunique'),
        avg_price=('unit_price', 'mean')
    ).reset_index().sort_values('revenue', ascending=False)

    cat_agg['percentage_revenue'] = ((cat_agg['revenue'] / total_rev) * 100).round(2)

    category_insights = [
        CategoryInsight(
            category=str(row['product_category']),
            revenue=round(float(row['revenue']), 2),
            units_sold=round(float(row['units_sold']), 1),
            transactions_count=int(row['transactions_count']),
            avg_price=round(float(row['avg_price']), 2),
            percentage_revenue=float(row['percentage_revenue'])
        )
        for _, row in cat_agg.iterrows()
    ]

    # Day of Week Pattern
    days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    df['day_name'] = df['transaction_date'].dt.day_name()
    day_agg = df.groupby('day_name').agg(
        transactions=('transaction_id', 'nunique'),
        revenue=('total_amount', 'sum')
    ).reindex(days_order).fillna(0).reset_index()

    day_of_week_patterns = [
        DayOfWeekPattern(
            day=str(row['day_name']),
            transactions=int(row['transactions']),
            revenue=round(float(row['revenue']), 2)
        )
        for _, row in day_agg.iterrows()
    ]

    # Price Tier Distribution
    def classify_price_tier(amount: float) -> str:
        if amount < 25:
            return "Budget (< $25)"
        elif amount < 75:
            return "Moderate ($25 - $75)"
        elif amount < 150:
            return "Premium ($75 - $150)"
        else:
            return "Luxury (> $150)"

    df['price_tier'] = df['total_amount'].apply(classify_price_tier)
    tier_agg = df.groupby('price_tier').agg(
        transaction_count=('transaction_id', 'count'),
        revenue=('total_amount', 'sum')
    ).reset_index()

    tier_order = ["Budget (< $25)", "Moderate ($25 - $75)", "Premium ($75 - $150)", "Luxury (> $150)"]
    tier_bounds = {
        "Budget (< $25)": (0.0, 25.0),
        "Moderate ($25 - $75)": (25.0, 75.0),
        "Premium ($75 - $150)": (75.0, 150.0),
        "Luxury (> $150)": (150.0, 99999.0)
    }

    tier_agg['percentage'] = ((tier_agg['revenue'] / total_rev) * 100).round(2)
    tier_dict = {row['price_tier']: row for _, row in tier_agg.iterrows()}

    price_tier_distribution = []
    for t_name in tier_order:
        if t_name in tier_dict:
            r = tier_dict[t_name]
            price_tier_distribution.append(PriceTierDistribution(
                tier=t_name,
                min_price=tier_bounds[t_name][0],
                max_price=tier_bounds[t_name][1],
                transaction_count=int(r['transaction_count']),
                revenue=round(float(r['revenue']), 2),
                percentage=float(r['percentage'])
            ))

    # Top selling products
    prod_agg = df.groupby(['product_id', 'product_category']).agg(
        revenue=('total_amount', 'sum'),
        quantity_sold=('quantity', 'sum'),
        transactions=('transaction_id', 'nunique')
    ).reset_index().sort_values('revenue', ascending=False).head(10)

    top_selling_products = [
        {
            "product_id": str(row['product_id']),
            "category": str(row['product_category']),
            "revenue": round(float(row['revenue']), 2),
            "quantity_sold": round(float(row['quantity_sold']), 1),
            "transactions": int(row['transactions'])
        }
        for _, row in prod_agg.iterrows()
    ]

    return BehaviourResponse(
        status="success",
        repeat_purchase_rate=repeat_rate,
        total_customers=total_customers,
        repeat_customers=repeat_customers,
        one_time_customers=one_time_customers,
        average_order_value=aov,
        avg_purchase_interval_days=avg_interval,
        monthly_trends=monthly_trends,
        category_insights=category_insights,
        day_of_week_patterns=day_of_week_patterns,
        price_tier_distribution=price_tier_distribution,
        top_selling_products=top_selling_products
    )
