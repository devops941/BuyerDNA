import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.schemas.rfm import TransactionItem, RFMConfig
from app.schemas.clustering import ClusteringCustomerInput, ClusteringConfig
from app.schemas.clv_churn import CustomerMetrics
from app.services.rfm_engine import calculate_rfm
from app.services.clustering_engine import run_clustering
from app.services.behaviour_engine import analyze_behaviour
from app.services.clv_churn_engine import calculate_clv_and_churn
from app.services.recommendation_engine import generate_recommendations

def test_pipeline():
    print("--- 1. Testing RFM Engine ---")
    mock_transactions = [
        TransactionItem(customer_id="C1", transaction_id="T1", transaction_date="2026-01-01", total_amount=120.0, product_category="Electronics", unit_price=120.0),
        TransactionItem(customer_id="C1", transaction_id="T2", transaction_date="2026-02-15", total_amount=350.0, product_category="Electronics", unit_price=350.0),
        TransactionItem(customer_id="C2", transaction_id="T3", transaction_date="2026-02-20", total_amount=45.0, product_category="Apparel", unit_price=45.0),
        TransactionItem(customer_id="C3", transaction_id="T4", transaction_date="2025-11-10", total_amount=80.0, product_category="Home", unit_price=40.0, quantity=2.0),
        TransactionItem(customer_id="C4", transaction_id="T5", transaction_date="2026-03-01", total_amount=800.0, product_category="Jewelry", unit_price=800.0),
        TransactionItem(customer_id="C4", transaction_id="T6", transaction_date="2026-03-10", total_amount=1200.0, product_category="Jewelry", unit_price=1200.0),
        TransactionItem(customer_id="C5", transaction_id="T7", transaction_date="2025-08-01", total_amount=30.0, product_category="Books", unit_price=30.0),
    ]

    rfm_res = calculate_rfm(mock_transactions, RFMConfig())
    print(f"RFM Success: {rfm_res.total_customers} customers, Total Rev: ${rfm_res.total_revenue}")
    assert len(rfm_res.customers) == 5
    for c in rfm_res.customers:
        print(f"  {c.customer_id}: R={c.recency_days}d (Score {c.r_score}), F={c.frequency} (Score {c.f_score}), M=${c.monetary} (Score {c.m_score}) -> {c.segment}")

    print("\n--- 2. Testing Clustering Engine ---")
    clustering_inputs = [
        ClusteringCustomerInput(customer_id=c.customer_id, recency=float(c.recency_days), frequency=float(c.frequency), monetary=float(c.monetary), avg_order_value=float(c.avg_order_value))
        for c in rfm_res.customers
    ]
    clustering_res = run_clustering(clustering_inputs, ClusteringConfig(n_clusters=3, k_min=2, k_max=4))
    print(f"Clustering Success: chosen_k={clustering_res.chosen_k}, silhouette={clustering_res.silhouette_score}")
    for cl in clustering_res.clusters:
        print(f"  Cluster {cl.cluster_id}: {cl.name} ({cl.customer_count} customers, avg spend ${cl.avg_monetary})")

    print("\n--- 3. Testing Behaviour Engine ---")
    behaviour_res = analyze_behaviour(mock_transactions)
    print(f"Behaviour Success: Repeat Rate: {behaviour_res.repeat_purchase_rate}%, AOV: ${behaviour_res.average_order_value}")
    assert len(behaviour_res.category_insights) > 0

    print("\n--- 4. Testing CLV & Churn Engine ---")
    clv_inputs = [
        CustomerMetrics(customer_id=c.customer_id, recency=float(c.recency_days), frequency=float(c.frequency), monetary=float(c.monetary), avg_order_value=float(c.avg_order_value))
        for c in rfm_res.customers
    ]
    clv_res = calculate_clv_and_churn(clv_inputs, inactivity_threshold_days=60)
    print(f"CLV Success: Avg CLV: ${clv_res.average_projected_clv}, High Risk: {clv_res.high_churn_risk_count}")

    print("\n--- 5. Testing Recommendations Engine ---")
    recs = generate_recommendations(rfm_res, clustering_res, behaviour_res, clv_res)
    print(f"Recommendations Generated: {len(recs)}")
    for r in recs:
        print(f"  [{r.priority}] {r.title} -> {r.target_segment}")

    print("\n>>> ALL PYTHON ML ENGINES VALIDATED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_pipeline()
