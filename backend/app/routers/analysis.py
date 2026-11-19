from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.config.db import get_db
from app.middleware.auth import get_current_user
from app.services.analysis_service import trigger_analysis
from app.models.analysis_job import StartAnalysisRequest

router = APIRouter()


def _doc(d):
    if not d:
        return d
    doc_id = str(d.pop("_id", d.get("id", "")))
    d["id"] = doc_id
    d["_id"] = doc_id
    for k in ("datasetId", "jobId", "userId"):
        if d.get(k):
            d[k] = str(d[k])
    return d


@router.post("/run", status_code=202)
async def start_analysis(body: StartAnalysisRequest, current_user: dict = Depends(get_current_user)):
    job = await trigger_analysis(body.datasetId, body.algorithm, body.parameters, current_user["id"])
    return {"success": True, "message": "Analysis job launched successfully.", "data": _doc(job)}


@router.get("/jobs")
async def get_all_jobs(datasetId: str = None):
    db = get_db()
    filt = {"datasetId": ObjectId(datasetId)} if datasetId else {}
    jobs = await db.analysisjobs.find(filt).sort("createdAt", -1).limit(50).to_list(50)
    return {"success": True, "count": len(jobs), "data": [_doc(j) for j in jobs]}


@router.get("/jobs/{jobId}")
async def get_job_status(jobId: str):
    db = get_db()
    job = await db.analysisjobs.find_one({"_id": ObjectId(jobId)})
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    result = None
    if job.get("status") == "completed":
        r = await db.analysisresults.find_one({"jobId": ObjectId(jobId)})
        if r:
            result = _doc(r)
    return {"success": True, "data": {"job": _doc(job), "result": result}}


@router.get("/results/{datasetId}")
async def get_latest_result(datasetId: str):
    db = get_db()
    try:
        oid = ObjectId(datasetId)
    except Exception:
        latest_ds = await db.datasets.find_one({"status": "ready"}, sort=[("createdAt", -1)])
        if not latest_ds:
            latest_ds = await db.datasets.find_one({}, sort=[("createdAt", -1)])
        if latest_ds:
            oid = latest_ds["_id"]
        else:
            raise HTTPException(status_code=404, detail="No datasets available.")

    result = await db.analysisresults.find_one({"datasetId": oid}, sort=[("createdAt", -1)])
    if not result:
        # Fallback to the latest analysis result overall if not yet specific to this ID
        result = await db.analysisresults.find_one({}, sort=[("createdAt", -1)])
        if not result:
            raise HTTPException(status_code=404, detail="No analysis results found for this dataset yet.")
    return {"success": True, "data": _doc(result)}
