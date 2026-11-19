from fastapi import APIRouter, HTTPException, Query
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
    for k in ("datasetId",):
        if d.get(k):
            d[k] = str(d[k])
    return d


@router.get("/")
async def get_customers(
    datasetId: str = Query(None),
    segment: str = Query(None),
    clusterId: str = Query(None),
    churnRisk: str = Query(None),
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=5000),
    sortBy: str = Query("monetary"),
    order: str = Query("desc"),
):
    db = get_db()
    ds_oid = None
    if datasetId and datasetId not in ("undefined", "null", "active"):
        try:
            ds_oid = ObjectId(datasetId)
        except Exception:
            pass

    if not ds_oid:
        latest = await db.datasets.find_one({"status": "ready"}, sort=[("createdAt", -1)])
        if not latest:
            latest = await db.datasets.find_one({}, sort=[("createdAt", -1)])
        if latest:
            ds_oid = latest["_id"]

    filt = {"datasetId": ds_oid} if ds_oid else {}
    if segment and isinstance(segment, str) and segment != "All":
        filt["segment"] = segment
    if clusterId and isinstance(clusterId, str) and clusterId != "All":
        try:
            filt["clusterId"] = int(clusterId)
        except ValueError:
            pass
    if churnRisk and isinstance(churnRisk, str) and churnRisk != "All":
        filt["churnRiskLevel"] = churnRisk
    if search and isinstance(search, str):
        filt["$or"] = [
            {"customerId": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]

    sort_by = sortBy if isinstance(sortBy, str) else "monetary"
    sort_dir = 1 if (isinstance(order, str) and order == "asc") else -1
    page_num = page if isinstance(page, int) else 1
    limit_num = limit if isinstance(limit, int) else 50
    skip = (page_num - 1) * limit_num
    customers = await db.customers.find(filt).sort(sort_by, sort_dir).skip(skip).limit(limit_num).to_list(limit_num)
    total = await db.customers.count_documents(filt)
    return {
        "success": True,
        "data": [_doc(c) for c in customers],
        "pagination": {"page": page, "limit": limit, "total": total, "totalPages": math.ceil(total / limit)},
    }


@router.get("/segments/overview")
async def get_segments_overview(datasetId: str = Query(...)):
    db = get_db()
    pipeline = [
        {"$match": {"datasetId": ObjectId(datasetId)}},
        {"$group": {
            "_id": "$segment",
            "customerCount": {"$sum": 1},
            "avgRecency": {"$avg": "$recencyDays"},
            "avgFrequency": {"$avg": "$frequency"},
            "avgMonetary": {"$avg": "$monetary"},
            "totalRevenue": {"$sum": "$monetary"},
        }},
        {"$sort": {"totalRevenue": -1}},
    ]
    segments = await db.customers.aggregate(pipeline).to_list(None)
    for s in segments:
        s["segment"] = s.pop("_id")
    return {"success": True, "data": segments}


@router.get("/{datasetId}/{customerId}")
async def get_customer_profile(datasetId: str, customerId: str):
    db = get_db()
    customer = await db.customers.find_one({"datasetId": ObjectId(datasetId), "customerId": customerId})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer record not found.")
    txs = await db.transactions.find({"datasetId": ObjectId(datasetId), "customerId": customerId}).sort("transactionDate", -1).limit(50).to_list(50)
    for t in txs:
        t["id"] = str(t.pop("_id"))
        t["datasetId"] = str(t["datasetId"])
    return {"success": True, "data": {"customer": _doc(customer), "transactions": txs}}
