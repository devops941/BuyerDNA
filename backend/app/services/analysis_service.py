import asyncio
from datetime import datetime
from bson import ObjectId
from app.config.db import get_db
from app.services import ml_service
from app.services.audit_service import log_audit


async def trigger_analysis(dataset_id: str, algorithm: str = "comprehensive", parameters: dict = None, user_id: str = None) -> dict:
    db = get_db()
    
    # Validate and fallback dataset_id if needed
    try:
        ds_oid = ObjectId(dataset_id)
    except Exception:
        latest = await db.datasets.find_one({"status": "ready"}, sort=[("createdAt", -1)])
        if not latest:
            latest = await db.datasets.find_one({}, sort=[("createdAt", -1)])
        if not latest:
            raise ValueError("No dataset found in database to analyze.")
        ds_oid = latest["_id"]
        dataset_id = str(ds_oid)

    job_doc = {
        "datasetId": ds_oid,
        "algorithm": algorithm,
        "status": "processing",
        "progress": 10,
        "parameters": parameters or {},
        "startedAt": datetime.utcnow(),
        "logs": ["Analysis job created and queued for processing."],
        "userId": ObjectId(user_id) if (user_id and ObjectId.is_valid(user_id)) else None,
        "durationSeconds": 0,
        "error": None,
        "completedAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await db.analysisjobs.insert_one(job_doc)
    job_id = str(result.inserted_id)

    asyncio.create_task(execute_analysis_job(job_id))

    job_doc["id"] = job_id
    job_doc["_id"] = job_id
    job_doc["datasetId"] = dataset_id
    if job_doc.get("userId"):
        job_doc["userId"] = str(user_id)
    return job_doc


async def execute_analysis_job(job_id: str) -> None:
    db = get_db()
    start_time = datetime.utcnow()

    async def update_job(**kwargs):
        kwargs["updatedAt"] = datetime.utcnow()
        await db.analysisjobs.update_one({"_id": ObjectId(job_id)}, {"$set": kwargs})

    async def push_log(msg: str):
        await db.analysisjobs.update_one({"_id": ObjectId(job_id)}, {"$push": {"logs": msg}})

    job = await db.analysisjobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        return

    try:
        await push_log("Fetching transactions from MongoDB database...")
        await update_job(progress=25)

        transactions = await db.transactions.find({"datasetId": job["datasetId"]}).to_list(None)
        if not transactions:
            raise ValueError("No transactions found in this dataset to analyze.")

        await push_log(f"Loaded {len(transactions)} records. Formatting payload for FastAPI ML microservice...")
        await update_job(progress=45)

        formatted = [{
            "customer_id": t["customerId"],
            "transaction_id": t["transactionId"],
            "transaction_date": t["transactionDate"].strftime("%Y-%m-%d") if t.get("transactionDate") else "",
            "product_id": t.get("productId", "P1"),
            "product_category": t.get("productCategory", "General"),
            "quantity": t.get("quantity", 1),
            "unit_price": t.get("unitPrice", 0),
            "total_amount": t["totalAmount"],
            "payment_method": t.get("paymentMethod", "Credit Card"),
            "discount": t.get("discount", 0),
            "channel": t.get("channel", "Online"),
        } for t in transactions]

        await push_log("Executing RFM, K-Means Clustering, PCA, Behaviour, and Churn ML models in Python...")
        await update_job(progress=65)

        params = job.get("parameters", {})
        rfm_c = params.get("rfmConfig") or params.get("rfm_config") or {}
        clust_c = params.get("clusteringConfig") or params.get("clustering_config") or {}
        n_clusters = clust_c.get("n_clusters") or clust_c.get("nClusters") or 4
        auto_k = clust_c.get("auto_detect_k", clust_c.get("autoDetectK", False))
        features_list = clust_c.get("features", ["recency", "frequency", "monetary", "avg_order_value"])
        clean_clustering = {
            "n_clusters": int(n_clusters),
            "auto_detect_k": bool(auto_k),
            "k_min": int(clust_c.get("k_min", clust_c.get("kMin", 2))),
            "k_max": int(clust_c.get("k_max", clust_c.get("kMax", 7))),
            "features": features_list,
        }
        inactivity_days = int(params.get("inactivityThresholdDays") or params.get("inactivity_threshold_days") or 60)

        ml_resp = await ml_service.run_comprehensive(
            formatted,
            rfm_c,
            clean_clustering,
            inactivity_days,
        )

        await push_log("ML algorithms completed. Persisting customer segmentation profiles...")
        await update_job(progress=85)

        cluster_map = {}
        for ca in (ml_resp.get("clustering") or {}).get("customer_assignments", []):
            cluster_map[ca["customer_id"]] = {
                "clusterId": ca["cluster_id"],
                "clusterName": ca["cluster_name"],
                "pcaX": ca.get("pca_x", 0),
                "pcaY": ca.get("pca_y", 0),
            }

        churn_map = {}
        for cr in (ml_resp.get("clv_churn") or {}).get("customers", []):
            churn_map[cr["customer_id"]] = {
                "clv": cr["clv_projected"],
                "risk": cr["churn_risk_level"],
                "prob": cr["churn_probability"],
            }

        bulk_ops = []
        for c in ml_resp["rfm"]["customers"]:
            cl = cluster_map.get(c["customer_id"], {})
            ch = churn_map.get(c["customer_id"], {})
            bulk_ops.append({
                "filter": {"datasetId": job["datasetId"], "customerId": c["customer_id"]},
                "update": {"$set": {
                    "recencyDays": c["recency_days"],
                    "frequency": c["frequency"],
                    "monetary": c["monetary"],
                    "avgOrderValue": c["avg_order_value"],
                    "rScore": c["r_score"],
                    "fScore": c["f_score"],
                    "mScore": c["m_score"],
                    "rfmScoreStr": c["rfm_score_str"],
                    "rfmCompositeScore": c["rfm_composite_score"],
                    "segment": c["segment"],
                    "clusterId": cl.get("clusterId", 0),
                    "clusterName": cl.get("clusterName", "Standard"),
                    "pcaX": cl.get("pcaX", 0),
                    "pcaY": cl.get("pcaY", 0),
                    "clvProjected": ch.get("clv", c["monetary"] * 1.5),
                    "clvHistorical": c["monetary"],
                    "churnRiskLevel": ch.get("risk", "Low"),
                    "churnProbability": ch.get("prob", 0.1),
                    "firstPurchaseDate": datetime.fromisoformat(c["first_purchase_date"]) if c.get("first_purchase_date") else None,
                    "lastPurchaseDate": datetime.fromisoformat(c["last_purchase_date"]) if c.get("last_purchase_date") else None,
                    "datasetId": job["datasetId"],
                    "updatedAt": datetime.utcnow(),
                }},
                "upsert": True,
            })

        if bulk_ops:
            from pymongo import UpdateOne
            await db.customers.bulk_write([UpdateOne(op["filter"], op["update"], upsert=op["upsert"]) for op in bulk_ops])

        clust = ml_resp.get("clustering", {})
        beh = ml_resp.get("behaviour", {})
        clv = ml_resp.get("clv_churn", {})

        result_doc = {
            "jobId": job["_id"],
            "datasetId": job["datasetId"],
            "algorithm": job["algorithm"],
            "totalCustomers": ml_resp.get("total_customers", 0),
            "totalRevenue": ml_resp.get("total_revenue", 0),
            "averageOrderValue": ml_resp.get("average_order_value", 0),
            "repeatPurchaseRate": ml_resp.get("repeat_purchase_rate", 0),
            "rfmSegmentsSummary": [{
                "segment": s["segment"], "customerCount": s["customer_count"],
                "percentage": s["percentage"], "avgRecency": s["avg_recency"],
                "avgFrequency": s["avg_frequency"], "avgMonetary": s["avg_monetary"],
                "totalRevenue": s["total_revenue"], "revenuePercentage": s["revenue_percentage"],
            } for s in ml_resp["rfm"].get("segments_summary", [])],
            "clusteringSummary": {
                "optimalK": clust.get("optimal_k", 0), "chosenK": clust.get("chosen_k", 0),
                "silhouetteScore": clust.get("silhouette_score", 0), "featuresUsed": clust.get("features_used", []),
            },
            "clusters": [{
                "clusterId": cl["cluster_id"], "name": cl["name"], "description": cl["description"],
                "customerCount": cl["customer_count"], "percentage": cl["percentage"],
                "avgRecency": cl["avg_recency"], "avgFrequency": cl["avg_frequency"],
                "avgMonetary": cl["avg_monetary"], "avgAov": cl["avg_aov"],
                "totalSpending": cl["total_spending"], "dominantTraits": cl["dominant_traits"],
            } for cl in clust.get("clusters", [])],
            "elbowCurve": clust.get("elbow_curve", []),
            "monthlyTrends": beh.get("monthly_trends", []),
            "categoryInsights": [{
                "category": ci["category"], "revenue": ci["revenue"], "unitsSold": ci["units_sold"],
                "transactionsCount": ci["transactions_count"], "avgPrice": ci["avg_price"],
                "percentageRevenue": ci["percentage_revenue"],
            } for ci in beh.get("category_insights", [])],
            "dayOfWeekPatterns": beh.get("day_of_week_patterns", []),
            "priceTierDistribution": [{
                "tier": pt["tier"], "minPrice": pt["min_price"], "maxPrice": pt["max_price"],
                "transactionCount": pt["transaction_count"], "revenue": pt["revenue"], "percentage": pt["percentage"],
            } for pt in beh.get("price_tier_distribution", [])],
            "clvSummary": {
                "averageProjectedClv": clv.get("average_projected_clv", 0),
                "highChurnRiskCount": clv.get("high_churn_risk_count", 0),
                "mediumChurnRiskCount": clv.get("medium_churn_risk_count", 0),
                "lowChurnRiskCount": clv.get("low_churn_risk_count", 0),
                "riskDistribution": clv.get("risk_distribution", {}),
            },
            "recommendations": [{
                "id": r["id"], "targetSegment": r["target_segment"], "priority": r["priority"],
                "title": r["title"], "rationale": r["rationale"], "supportingMetric": r["supporting_metric"],
                "actionPlan": r["action_plan"], "expectedImpact": r["expected_impact"],
            } for r in ml_resp.get("recommendations", [])],
            "createdAt": datetime.utcnow(),
        }
        await db.analysisresults.insert_one(result_doc)

        duration = int((datetime.utcnow() - start_time).total_seconds())
        await update_job(status="completed", progress=100, completedAt=datetime.utcnow(), durationSeconds=duration)
        await push_log(f"Analysis pipeline successfully finished in {duration} seconds.")
        await log_audit("EXECUTE_ANALYSIS", f"AnalysisJob:{job_id}", user_id=job.get("userId"),
                        details={"datasetId": str(job["datasetId"]), "duration": duration, "totalCustomers": ml_resp.get("total_customers")})

    except Exception as e:
        duration = int((datetime.utcnow() - start_time).total_seconds())
        await update_job(status="failed", error=str(e), durationSeconds=duration)
        await push_log(f"Error executing analysis: {str(e)}")
        await log_audit("EXECUTE_ANALYSIS_FAILED", f"AnalysisJob:{job_id}", user_id=job.get("userId"),
                        details={"error": str(e)}, status="error")
