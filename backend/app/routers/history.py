from fastapi import APIRouter, Query, HTTPException
from bson import ObjectId
from app.config.db import get_db
import math

router = APIRouter()


def _doc(d):
    if not d:
        return d
    doc_id = str(d.pop("_id", d.get("id", "")))
    d["id"] = doc_id
    d["_id"] = doc_id
    for k in ("userId", "jobId", "datasetId"):
        if d.get(k):
            d[k] = str(d[k])
    return d


@router.get("/audit")
async def get_audit_logs(limit: int = Query(50, ge=1, le=100), page: int = Query(1, ge=1)):
    db = get_db()
    skip = (page - 1) * limit
    logs = await db.auditlogs.find().sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.auditlogs.count_documents({})
    return {
        "success": True,
        "data": [_doc(l) for l in logs],
        "pagination": {"page": page, "limit": limit, "total": total, "totalPages": math.ceil(total / limit)},
    }


@router.get("/compare")
async def compare_runs(runId1: str = Query(...), runId2: str = Query(...)):
    db = get_db()
    r1 = await db.analysisresults.find_one({"jobId": ObjectId(runId1)})
    r2 = await db.analysisresults.find_one({"jobId": ObjectId(runId2)})
    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="One or both analysis runs could not be found.")
    return {
        "success": True,
        "data": {
            "run1": _doc(r1),
            "run2": _doc(r2),
            "comparison": {
                "customerDiff": (r2.get("totalCustomers", 0) or 0) - (r1.get("totalCustomers", 0) or 0),
                "revenueDiff": (r2.get("totalRevenue", 0) or 0) - (r1.get("totalRevenue", 0) or 0),
                "aovDiff": (r2.get("averageOrderValue", 0) or 0) - (r1.get("averageOrderValue", 0) or 0),
                "repeatRateDiff": (r2.get("repeatPurchaseRate", 0) or 0) - (r1.get("repeatPurchaseRate", 0) or 0),
            },
        },
    }
