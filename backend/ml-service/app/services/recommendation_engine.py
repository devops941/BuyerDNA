from typing import List, Dict, Any
from app.schemas.comprehensive import MarketingRecommendation
from app.schemas.rfm import RFMResponse
from app.schemas.clustering import ClusteringResponse
from app.schemas.behaviour import BehaviourResponse
from app.schemas.clv_churn import CLVChurnResponse

def generate_recommendations(
    rfm: RFMResponse,
    clustering: ClusteringResponse,
    behaviour: BehaviourResponse,
    clv_churn: CLVChurnResponse
) -> List[MarketingRecommendation]:
    recs: List[MarketingRecommendation] = []

    # Map segment counts
    seg_map = {s.segment: s for s in rfm.segments_summary}

    # 1. Champions Strategy
    champs = seg_map.get("Champions")
    if champs and champs.customer_count > 0:
        recs.append(MarketingRecommendation(
            id="REC-001",
            target_segment="Champions",
            priority="High",
            title="VIP Loyalty & Early Access Program",
            rationale=f"Champions represent {champs.revenue_percentage}% of total revenue with avg spend of ${champs.avg_monetary:,.2f}.",
            supporting_metric=f"{champs.customer_count} customers (${champs.total_revenue:,.2f} total revenue)",
            action_plan="Create an invite-only VIP tier with free priority shipping, dedicated concierge support, and 48-hour early access to new collections.",
            expected_impact="Protects the highest spending tier from competitor poaching and maximizes brand advocacy."
        ))

    # 2. At-Risk Strategy
    at_risk = seg_map.get("At Risk Customers")
    if at_risk and at_risk.customer_count > 0:
        recs.append(MarketingRecommendation(
            id="REC-002",
            target_segment="At Risk Customers",
            priority="Urgent",
            title="Automated Win-Back Campaign with Personalized Incentives",
            rationale=f"{at_risk.customer_count} valuable customers haven't purchased in an average of {at_risk.avg_recency:.0f} days.",
            supporting_metric=f"Avg historical spend was ${at_risk.avg_monetary:,.2f} before going dormant.",
            action_plan="Deploy dynamic 3-stage email/SMS sequence offering tiered discounts (15% then 25%) highlighting items related to their past purchase categories.",
            expected_impact="Recovers 12-18% of lapsing customers, recovering up to ${(at_risk.total_revenue * 0.15):,.2f} in gross merchandise value."
        ))

    # 3. Potential Loyalists / Promising
    pot_loyal = seg_map.get("Potential Loyalists") or seg_map.get("Promising Customers")
    if pot_loyal and pot_loyal.customer_count > 0:
        recs.append(MarketingRecommendation(
            id="REC-003",
            target_segment="Potential Loyalists",
            priority="Medium",
            title="Post-Purchase Cross-Sell & Upsell Journeys",
            rationale="Recent buyers who have demonstrated affinity but haven't established high order frequency.",
            supporting_metric=f"Avg frequency is {pot_loyal.avg_frequency:.1f} orders with recent activity {pot_loyal.avg_recency:.0f} days ago.",
            action_plan="Implement post-purchase trigger emails offering personalized complementary product bundles within 14 days of order delivery.",
            expected_impact="Increases repeat purchase rate from single-digit to double-digit conversion and lifts AOV by 15-20%."
        ))

    # 4. Churn Mitigation
    if clv_churn.high_churn_risk_count > 0:
        recs.append(MarketingRecommendation(
            id="REC-004",
            target_segment="High Churn Risk Cohort",
            priority="Urgent",
            title="Churn Alert Signal Activation",
            rationale=f"{clv_churn.high_churn_risk_count} customers have surpassed critical inactivity intervals and show severe attrition signals.",
            supporting_metric=f"{clv_churn.high_churn_risk_count} high-risk accounts identified by behavioral decay.",
            action_plan="Trigger automated retention surveys inquiring about satisfaction, coupled with instant store credits with a 14-day expiry.",
            expected_impact="Reduces churn velocity and provides vital qualitative feedback regarding friction points in checkout or product satisfaction."
        ))

    # 5. Category Affinity Expansion
    if behaviour.category_insights:
        top_cat = behaviour.category_insights[0]
        recs.append(MarketingRecommendation(
            id="REC-005",
            target_segment="All Active Segments",
            priority="Medium",
            title=f"Leverage '{top_cat.category}' as Flagship Acquisition Hook",
            rationale=f"'{top_cat.category}' drives {top_cat.percentage_revenue:.1f}% of overall revenue with ${top_cat.revenue:,.2f} in sales.",
            supporting_metric=f"Top category: {top_cat.units_sold:,.0f} units sold across {top_cat.transactions_count} orders.",
            action_plan=f"Feature '{top_cat.category}' top sellers in paid acquisition ads and recommend high-margin accessories during checkout.",
            expected_impact="Optimizes ad spend ROAS and enhances customer initial basket size."
        ))

    return recs
