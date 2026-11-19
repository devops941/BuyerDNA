import os
from datetime import datetime
from pathlib import Path
import pandas as pd
from bson import ObjectId
from app.config.db import get_db
from app.config.env import settings


async def generate_report_file(dataset_id: str, report_type: str, fmt: str = "csv", user_id: str = None) -> dict:
    db = get_db()
    
    # Safe dataset ID parsing with fallback
    try:
        ds_oid = ObjectId(dataset_id)
    except Exception:
        latest = await db.datasets.find_one({"status": "ready"}, sort=[("createdAt", -1)])
        if not latest:
            latest = await db.datasets.find_one({}, sort=[("createdAt", -1)])
        if not latest:
            raise ValueError("Dataset not found")
        ds_oid = latest["_id"]
        dataset_id = str(ds_oid)

    dataset = await db.datasets.find_one({"_id": ds_oid})
    if not dataset:
        raise ValueError("Dataset not found")

    customers = await db.customers.find({"datasetId": ds_oid}).to_list(None)
    result_doc = await db.analysisresults.find_one({"datasetId": ds_oid}, sort=[("createdAt", -1)])

    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    ext = "xlsx" if fmt == "xlsx" else "csv"
    filename = f"report-{report_type}-{dataset_id}-{timestamp}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    export_data = []

    if report_type in ("rfm", "segmentation"):
        export_data = [{
            "Customer ID": c.get("customerId"),
            "Segment": c.get("segment"),
            "Cluster": c.get("clusterName"),
            "Recency (Days)": c.get("recencyDays"),
            "Frequency": c.get("frequency"),
            "Monetary ($)": c.get("monetary"),
            "Avg Order Value ($)": c.get("avgOrderValue"),
            "R Score": c.get("rScore"),
            "F Score": c.get("fScore"),
            "M Score": c.get("mScore"),
            "RFM Score": c.get("rfmScoreStr"),
            "CLV Projected ($)": c.get("clvProjected"),
            "Churn Risk": c.get("churnRiskLevel"),
        } for c in customers]
    elif report_type == "behaviour" and result_doc:
        export_data = [{
            "Category": ci.get("category"),
            "Revenue ($)": ci.get("revenue"),
            "Revenue %": ci.get("percentageRevenue"),
            "Units Sold": ci.get("unitsSold"),
            "Transactions": ci.get("transactionsCount"),
            "Avg Price ($)": ci.get("avgPrice"),
        } for ci in result_doc.get("categoryInsights", [])]
    elif report_type == "validation":
        vs = dataset.get("validationSummary", {})
        export_data = [
            {"Metric": "Total Rows Ingested", "Value": dataset.get("rowCount", 0)},
            {"Metric": "Data Quality Score", "Value": f"{dataset.get('qualityScore', 0)}%"},
            {"Metric": "Missing Values", "Value": vs.get("missingValues", 0)},
            {"Metric": "Duplicate Records", "Value": vs.get("duplicates", 0)},
            {"Metric": "Negative Amounts Corrected", "Value": vs.get("negativeAmounts", 0)},
            {"Metric": "Rejected Records", "Value": vs.get("rejectedRows", 0)},
        ]
    else:
        export_data = [
            {"Metric": "Dataset Name", "Value": dataset.get("name")},
            {"Metric": "Total Customers", "Value": result_doc.get("totalCustomers", len(customers)) if result_doc else len(customers)},
            {"Metric": "Total Revenue ($)", "Value": result_doc.get("totalRevenue", 0) if result_doc else 0},
            {"Metric": "Average Order Value ($)", "Value": result_doc.get("averageOrderValue", 0) if result_doc else 0},
            {"Metric": "Repeat Purchase Rate (%)", "Value": result_doc.get("repeatPurchaseRate", 0) if result_doc else 0},
            {"Metric": "Optimal Clusters (K-Means)", "Value": (result_doc.get("clusteringSummary") or {}).get("chosenK", 0) if result_doc else 0},
            {"Metric": "Silhouette Score", "Value": (result_doc.get("clusteringSummary") or {}).get("silhouetteScore", 0) if result_doc else 0},
        ]

    df = pd.DataFrame(export_data)
    if fmt == "xlsx":
        df.to_excel(file_path, index=False)
    else:
        df.to_csv(file_path, index=False)

    file_size = os.path.getsize(file_path)
    report_doc = {
        "title": f"{dataset.get('name')} - {report_type.upper()} Report",
        "type": report_type,
        "datasetId": ds_oid,
        "format": fmt,
        "downloadUrl": f"/uploads/{filename}",
        "fileSize": file_size,
        "status": "ready",
        "generatedBy": ObjectId(user_id) if (user_id and ObjectId.is_valid(user_id)) else None,
        "summary": {"totalRecords": len(export_data), "datasetName": dataset.get("name"), "generatedAt": datetime.utcnow().isoformat()},
        "createdAt": datetime.utcnow(),
    }
    result = await db.reports.insert_one(report_doc)
    rep_id = str(result.inserted_id)
    report_doc["id"] = rep_id
    report_doc["_id"] = rep_id
    report_doc["datasetId"] = str(dataset_id)
    if report_doc.get("generatedBy"):
        report_doc["generatedBy"] = str(user_id)
    return report_doc
