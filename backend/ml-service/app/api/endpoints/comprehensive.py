from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.schemas.comprehensive import (
    ComprehensiveAnalysisRequest, ComprehensiveAnalysisResponse
)
from app.schemas.clustering import ClusteringCustomerInput, ClusteringConfig
from app.schemas.clv_churn import CustomerMetrics
from app.services.rfm_engine import calculate_rfm
from app.services.clustering_engine import run_clustering
from app.services.behaviour_engine import analyze_behaviour
from app.services.clv_churn_engine import calculate_clv_and_churn
from app.services.recommendation_engine import generate_recommendations

router = APIRouter()

@router.post("/analyze", response_model=ComprehensiveAnalysisResponse)
def run_comprehensive_analysis(payload: ComprehensiveAnalysisRequest):
    try:
        # 1. Run RFM Analysis
        rfm_res = calculate_rfm(payload.transactions, payload.rfm_config)

        # 2. Prepare clustering customer inputs from RFM results
        clustering_inputs = [
            ClusteringCustomerInput(
                customer_id=c.customer_id,
                recency=float(c.recency_days),
                frequency=float(c.frequency),
                monetary=float(c.monetary),
                avg_order_value=float(c.avg_order_value),
                category_diversity=1.0
            )
            for c in rfm_res.customers
        ]
        
        c_config = payload.clustering_config or ClusteringConfig()
        clustering_res = run_clustering(clustering_inputs, c_config)

        # 3. Run Behaviour Analysis
        behaviour_res = analyze_behaviour(payload.transactions)

        # 4. Prepare CLV & Churn input
        clv_inputs = [
            CustomerMetrics(
                customer_id=c.customer_id,
                recency=float(c.recency_days),
                frequency=float(c.frequency),
                monetary=float(c.monetary),
                avg_order_value=float(c.avg_order_value),
                lifespan_days=max(30.0, float(c.recency_days) + 30.0),
                avg_interval_days=max(14.0, behaviour_res.avg_purchase_interval_days or 30.0)
            )
            for c in rfm_res.customers
        ]
        clv_churn_res = calculate_clv_and_churn(
            customers=clv_inputs,
            inactivity_threshold_days=payload.inactivity_threshold_days or 60
        )

        # 5. Generate Marketing Recommendations
        recommendations = generate_recommendations(
            rfm=rfm_res,
            clustering=clustering_res,
            behaviour=behaviour_res,
            clv_churn=clv_churn_res
        )

        return ComprehensiveAnalysisResponse(
            status="success",
            analysis_timestamp=datetime.utcnow().isoformat(),
            total_records_processed=len(payload.transactions),
            total_customers=rfm_res.total_customers,
            total_revenue=rfm_res.total_revenue,
            average_order_value=behaviour_res.average_order_value,
            repeat_purchase_rate=behaviour_res.repeat_purchase_rate,
            rfm=rfm_res,
            clustering=clustering_res,
            behaviour=behaviour_res,
            clv_churn=clv_churn_res,
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Comprehensive pipeline error: {str(e)}")
