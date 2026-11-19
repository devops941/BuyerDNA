from fastapi import APIRouter, Query
from bson import ObjectId
from app.config.db import get_db
import math

router = APIRouter()


@router.get("/overview")
async def get_dashboard_overview(datasetId: str = Query(None)):
    db = get_db()
    target_id = datasetId
    if not target_id:
        latest = await db.datasets.find_one({"status": "ready"}, sort=[("createdAt", -1)])
        if not latest:
            return {"success": True, "message": "No active dataset available.", "data": None}
        target_id = str(latest["_id"])

    try:
        obj_id = ObjectId(target_id)
    except Exception:
        latest = await db.datasets.find_one({"status": "ready"}, sort=[("createdAt", -1)])
        if not latest:
            latest = await db.datasets.find_one({}, sort=[("createdAt", -1)])
        if not latest:
            return {"success": True, "message": "No active dataset available.", "data": None}
        obj_id = latest["_id"]
    analysis_result = await db.analysisresults.find_one({"datasetId": obj_id}, sort=[("createdAt", -1)])
    dataset_info = await db.datasets.find_one({"_id": obj_id})
    if dataset_info:
        dataset_info["id"] = str(dataset_info.pop("_id"))
        if dataset_info.get("userId"):
            dataset_info["userId"] = str(dataset_info["userId"])

    customer_pipeline = [
        {"$match": {"datasetId": obj_id}},
        {"$group": {
            "_id": None,
            "totalCustomers": {"$sum": 1},
            "totalRevenue": {"$sum": "$monetary"},
            "avgOrderValue": {"$avg": "$avgOrderValue"},
            "avgRfmScore": {"$avg": "$rfmCompositeScore"},
            "vipCount": {"$sum": {"$cond": [{"$in": ["$segment", ["Champions", "Loyal Customers"]]}, 1, 0]}},
            "atRiskCount": {"$sum": {"$cond": [{"$in": ["$segment", ["At Risk Customers", "Hibernating Customers"]]}, 1, 0]}},
            "repeatCustomers": {"$sum": {"$cond": [{"$gt": ["$frequency", 1]}, 1, 0]}},
        }},
    ]
    stats_list = await db.customers.aggregate(customer_pipeline).to_list(1)
    stats = stats_list[0] if stats_list else {"totalCustomers": 0, "totalRevenue": 0, "avgOrderValue": 0, "avgRfmScore": 0, "vipCount": 0, "atRiskCount": 0, "repeatCustomers": 0}

    tx_count = await db.transactions.count_documents({"datasetId": obj_id})
    total_customers = stats.get("totalCustomers", 0)
    repeat_rate = round((stats.get("repeatCustomers", 0) / total_customers) * 100, 1) if total_customers > 0 else 0

    seg_pipeline = [
        {"$match": {"datasetId": obj_id}},
        {"$group": {"_id": "$segment", "count": {"$sum": 1}, "revenue": {"$sum": "$monetary"}}},
        {"$sort": {"revenue": -1}},
    ]
    seg_dist = await db.customers.aggregate(seg_pipeline).to_list(None)

    top_customers = await db.customers.find({"datasetId": obj_id}).sort("monetary", -1).limit(5).to_list(5)
    for c in top_customers:
        c["id"] = str(c.pop("_id"))
        c["datasetId"] = str(c["datasetId"])

    if analysis_result:
        analysis_result["id"] = str(analysis_result.pop("_id"))
        for k in ("jobId", "datasetId"):
            if analysis_result.get(k):
                analysis_result[k] = str(analysis_result[k])

    return {
        "success": True,
        "data": {
            "dataset": dataset_info,
            "kpis": {
                "totalCustomers": total_customers,
                "totalTransactions": tx_count,
                "totalRevenue": round(stats.get("totalRevenue", 0)),
                "averageOrderValue": round(stats.get("avgOrderValue", 0)),
                "averageRfmScore": round(stats.get("avgRfmScore") or 3.0, 2),
                "vipCustomers": stats.get("vipCount", 0),
                "atRiskCustomers": stats.get("atRiskCount", 0),
                "repeatPurchaseRate": repeat_rate,
            },
            "segmentDistribution": [{"name": s["_id"], "count": s["count"], "revenue": round(s["revenue"])} for s in seg_dist],
            "topCustomers": top_customers,
            "analysisResult": analysis_result,
        },
    }
