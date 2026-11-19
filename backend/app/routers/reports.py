from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from app.config.db import get_db
from app.middleware.auth import get_current_user
from app.services.audit_service import log_audit
from app.services.report_service import generate_report_file
from app.models.report import CreateReportRequest

router = APIRouter()


def _doc(d):
    if not d:
        return d
    doc_id = str(d.pop("_id", d.get("id", "")))
    d["id"] = doc_id
    d["_id"] = doc_id
    for k in ("datasetId", "generatedBy"):
        if d.get(k):
            d[k] = str(d[k])
    return d


@router.get("/")
async def get_reports(datasetId: str = Query(None)):
    db = get_db()
    filt = {}
    if datasetId and datasetId not in ("undefined", "null", "active"):
        try:
            filt["datasetId"] = ObjectId(datasetId)
        except Exception:
            pass
    docs = await db.reports.find(filt).sort("createdAt", -1).to_list(None)
    return {"success": True, "count": len(docs), "data": [_doc(d) for d in docs]}


@router.post("/generate", status_code=201)
async def create_report(body: CreateReportRequest, current_user: dict = Depends(get_current_user)):
    report = await generate_report_file(body.datasetId, body.type, body.format, current_user["id"])
    await log_audit("REPORT_GENERATED", f"Report:{report['id']}", user_id=current_user["id"],
                    user_name=current_user.get("name"), details={"type": body.type, "format": body.format})
    return {"success": True, "message": "Report generated successfully.", "data": _doc(report)}
