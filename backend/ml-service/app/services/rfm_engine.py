import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.schemas.rfm import (
    TransactionItem, RFMConfig, RFMResponse,
    CustomerRFMResult, SegmentSummary
)

def assign_rfm_segment(r: int, f: int, m: int) -> str:
    # Industry-standard RFM Segmentation Matrix
    if r >= 4 and f >= 4 and m >= 4:
        return "Champions"
    elif r >= 3 and f >= 3 and m >= 3:
        return "Loyal Customers"
    elif r >= 4 and f <= 3 and m >= 2:
        return "Potential Loyalists"
    elif r >= 4 and f == 1:
        return "Recent Customers"
    elif r >= 3 and f <= 2 and m >= 2:
        return "Promising Customers"
    elif r >= 2 and r <= 3 and f >= 2 and f <= 3:
        return "Customers Needing Attention"
    elif r <= 2 and (f >= 3 or m >= 3):
        return "At Risk Customers"
    elif r <= 2 and f <= 2 and m <= 2:
        if r == 1 and f == 1 and m == 1:
            return "Lost Customers"
        return "Hibernating Customers"
    else:
        return "Potential Loyalists"

def calculate_rfm(transactions: List[TransactionItem], config: RFMConfig) -> RFMResponse:
    if not transactions:
        raise ValueError("No transaction records provided for RFM calculation.")

    # Convert to DataFrame
    df = pd.DataFrame([t.model_dump() for t in transactions])
    df['transaction_date'] = pd.to_datetime(df['transaction_date'], errors='coerce')
    df = df.dropna(subset=['transaction_date', 'customer_id', 'total_amount'])
    df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce').fillna(0.0)

    # Reference date
    if config.reference_date:
        ref_date = pd.to_datetime(config.reference_date)
    else:
        ref_date = df['transaction_date'].max() + pd.Timedelta(days=1)

    # Customer level aggregation
    agg_df = df.groupby('customer_id').agg(
        recency_days=('transaction_date', lambda x: int(max(0, (ref_date - x.max()).days))),
        frequency=('transaction_id', 'nunique'),
        monetary=('total_amount', 'sum'),
        last_purchase_date=('transaction_date', lambda x: x.max().strftime('%Y-%m-%d')),
        first_purchase_date=('transaction_date', lambda x: x.min().strftime('%Y-%m-%d')),
        avg_order_value=('total_amount', 'mean')
    ).reset_index()

    total_customers = len(agg_df)
    total_revenue = float(agg_df['monetary'].sum())

    # Scoring R, F, M
    # Note: For Recency, lower days = higher score (5 is best)
    # For Frequency & Monetary, higher = higher score (5 is best)
    # Using pd.qcut or rank-based percentiles to handle duplicate values gracefully
    try:
        r_labels = [5, 4, 3, 2, 1]
        agg_df['r_score'] = pd.qcut(agg_df['recency_days'], q=5, labels=r_labels, duplicates='drop')
    except Exception:
        agg_df['r_score'] = pd.cut(agg_df['recency_days'].rank(pct=True), bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0], labels=[5, 4, 3, 2, 1], include_lowest=True)

    try:
        f_labels = [1, 2, 3, 4, 5]
        agg_df['f_score'] = pd.qcut(agg_df['frequency'], q=5, labels=f_labels, duplicates='drop')
    except Exception:
        agg_df['f_score'] = pd.cut(agg_df['frequency'].rank(pct=True), bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0], labels=[1, 2, 3, 4, 5], include_lowest=True)

    try:
        m_labels = [1, 2, 3, 4, 5]
        agg_df['m_score'] = pd.qcut(agg_df['monetary'], q=5, labels=m_labels, duplicates='drop')
    except Exception:
        agg_df['m_score'] = pd.cut(agg_df['monetary'].rank(pct=True), bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0], labels=[1, 2, 3, 4, 5], include_lowest=True)

    agg_df['r_score'] = agg_df['r_score'].astype(int)
    agg_df['f_score'] = agg_df['f_score'].astype(int)
    agg_df['m_score'] = agg_df['m_score'].astype(int)

    agg_df['rfm_score_str'] = agg_df.apply(lambda row: f"{row['r_score']}{row['f_score']}{row['m_score']}", axis=1)
    
    # Weighted composite score (0-5 scale)
    rw = config.recency_weight
    fw = config.frequency_weight
    mw = config.monetary_weight
    agg_df['rfm_composite_score'] = (agg_df['r_score'] * rw + agg_df['f_score'] * fw + agg_df['m_score'] * mw).round(2)

    # Segment Assignment
    agg_df['segment'] = agg_df.apply(lambda row: assign_rfm_segment(row['r_score'], row['f_score'], row['m_score']), axis=1)

    # Build segments summary
    seg_summary_df = agg_df.groupby('segment').agg(
        customer_count=('customer_id', 'count'),
        avg_recency=('recency_days', 'mean'),
        avg_frequency=('frequency', 'mean'),
        avg_monetary=('monetary', 'mean'),
        total_revenue=('monetary', 'sum')
    ).reset_index()

    seg_summary_df['percentage'] = ((seg_summary_df['customer_count'] / total_customers) * 100).round(2)
    seg_summary_df['revenue_percentage'] = ((seg_summary_df['total_revenue'] / (total_revenue or 1.0)) * 100).round(2)
    seg_summary_df['avg_recency'] = seg_summary_df['avg_recency'].round(1)
    seg_summary_df['avg_frequency'] = seg_summary_df['avg_frequency'].round(1)
    seg_summary_df['avg_monetary'] = seg_summary_df['avg_monetary'].round(2)
    seg_summary_df['total_revenue'] = seg_summary_df['total_revenue'].round(2)

    segments_summary: List[SegmentSummary] = [
        SegmentSummary(**row) for row in seg_summary_df.to_dict(orient='records')
    ]

    customers: List[CustomerRFMResult] = [
        CustomerRFMResult(
            customer_id=str(row['customer_id']),
            recency_days=int(row['recency_days']),
            frequency=int(row['frequency']),
            monetary=round(float(row['monetary']), 2),
            r_score=int(row['r_score']),
            f_score=int(row['f_score']),
            m_score=int(row['m_score']),
            rfm_score_str=str(row['rfm_score_str']),
            rfm_composite_score=float(row['rfm_composite_score']),
            segment=str(row['segment']),
            last_purchase_date=str(row['last_purchase_date']),
            first_purchase_date=str(row['first_purchase_date']),
            avg_order_value=round(float(row['avg_order_value']), 2)
        )
        for _, row in agg_df.iterrows()
    ]

    return RFMResponse(
        status="success",
        total_customers=total_customers,
        total_revenue=round(total_revenue, 2),
        avg_recency=round(float(agg_df['recency_days'].mean()), 1),
        avg_frequency=round(float(agg_df['frequency'].mean()), 1),
        avg_monetary=round(float(agg_df['monetary'].mean()), 2),
        reference_date=ref_date.strftime('%Y-%m-%d'),
        segments_summary=segments_summary,
        customers=customers
    )
