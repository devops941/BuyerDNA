import os, json
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from bson import ObjectId
from app.config.db import get_db
from app.config.env import settings
from app.middleware.auth import get_current_user, require_roles
from app.services.dataset_service import parse_file_to_rows, detect_columns, validate_and_ingest_dataset
from app.services.audit_service import log_audit

router = APIRouter()


def _doc(d: dict) -> dict:
    if not d:
        return d
    doc_id = str(d.pop("_id", d.get("id", "")))
    d["id"] = doc_id
    d["_id"] = doc_id
    if d.get("userId"):
        d["userId"] = str(d["userId"])
    return d


@router.get("/")
async def get_datasets():
    db = get_db()
    docs = await db.datasets.find().sort("createdAt", -1).to_list(None)
    return {"success": True, "count": len(docs), "data": [_doc(d) for d in docs]}


@router.get("/{id}")
async def get_dataset_by_id(id: str):
    db = get_db()
    doc = await db.datasets.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"success": True, "data": _doc(doc)}


@router.get("/{id}/preview")
async def get_dataset_preview(id: str):
    db = get_db()
    txs = await db.transactions.find({"datasetId": ObjectId(id)}).limit(25).to_list(25)
    for t in txs:
        t["id"] = str(t.pop("_id"))
        t["datasetId"] = str(t["datasetId"])
    return {"success": True, "count": len(txs), "data": txs}


@router.get("/{id}/rejected")
async def get_rejected_records(id: str):
    db = get_db()
    doc = await db.datasets.find_one({"_id": ObjectId(id)})
    if not doc or not doc.get("rejectedFilePath") or not os.path.exists(doc["rejectedFilePath"]):
        return {"success": True, "count": 0, "data": []}
    with open(doc["rejectedFilePath"]) as f:
        records = json.load(f)
    return {"success": True, "count": len(records), "data": records[:50]}


@router.post("/upload", status_code=201)
async def upload_dataset(
    request: Request,
    file: UploadFile = File(...),
    name: str = Form(None),
    current_user: dict = Depends(get_current_user),
):
    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)

    ext = Path(file.filename).suffix.lower()
    if ext not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(status_code=400, detail="Unsupported file format. Upload CSV or Excel.")

    import time, random
    unique = f"{int(time.time() * 1000)}-{random.randint(0, 999999999)}"
    saved_name = f"file-{unique}{ext}"
    file_path = os.path.join(upload_dir, saved_name)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    dataset_name = name or Path(file.filename).stem
    rows = parse_file_to_rows(file_path)
    if not rows:
        os.unlink(file_path)
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    detected = detect_columns(rows[0])
    file_columns = detected["fileColumns"]
    detected_mapping = detected["detectedMapping"]

    db = get_db()
    result = await db.datasets.insert_one({
        "name": dataset_name,
        "originalFilename": file.filename,
        "filePath": file_path,
        "fileSize": len(contents),
        "columnCount": len(file_columns),
        "columns": [{"name": col, "detectedType": str(type(rows[0][col]).__name__), "mappedTo": detected_mapping.get(col, "")} for col in file_columns],
        "status": "uploaded",
        "userId": ObjectId(current_user["id"]),
        "rowCount": 0,
        "qualityScore": 100,
        "validationSummary": {"missingValues": 0, "duplicates": 0, "negativeAmounts": 0, "invalidDates": 0, "correctedRows": 0, "rejectedRows": 0, "totalPassed": 0},
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })
    dataset = await db.datasets.find_one({"_id": result.inserted_id})

    await log_audit("DATASET_UPLOADED", f"Dataset:{result.inserted_id}", user_id=current_user["id"],
                    user_name=current_user.get("name"), details={"filename": file.filename, "size": len(contents)},
                    ip_address=request.client.host if request.client else "127.0.0.1")

    return {
        "success": True,
        "message": "Dataset uploaded successfully. Ready for validation & column mapping.",
        "data": {
            "dataset": _doc(dataset),
            "samplePreview": rows[:10],
            "detectedMapping": detected_mapping,
            "availableColumns": file_columns,
        },
    }


@router.post("/{datasetId}/validate")
async def apply_mapping_and_validate(
    datasetId: str,
    body: dict,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    updated = await validate_and_ingest_dataset(datasetId, body.get("mapping", {}))
    await log_audit("DATASET_VALIDATED", f"Dataset:{datasetId}", user_id=current_user["id"],
                    user_name=current_user.get("name"),
                    details={"qualityScore": updated.get("qualityScore"), "rowCount": updated.get("rowCount")},
                    ip_address=request.client.host if request.client else "127.0.0.1")
    return {"success": True, "message": "Dataset validated and ingested successfully.", "data": updated}


@router.delete("/{id}")
async def delete_dataset(id: str, request: Request, current_user: dict = Depends(require_roles("Super Admin", "Admin"))):
    db = get_db()
    doc = await db.datasets.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Dataset not found")
    for path_key in ("filePath", "rejectedFilePath"):
        p = doc.get(path_key)
        if p and os.path.exists(p):
            try:
                os.unlink(p)
            except Exception:
                pass
    obj_id = ObjectId(id)
    await db.transactions.delete_many({"datasetId": obj_id})
    await db.customers.delete_many({"datasetId": obj_id})
    await db.analysisresults.delete_many({"datasetId": obj_id})
    await db.analysisjobs.delete_many({"datasetId": obj_id})
    await db.datasets.delete_one({"_id": obj_id})
    await log_audit("DATASET_DELETED", f"Dataset:{id}", user_id=current_user["id"], user_name=current_user.get("name"),
                    ip_address=request.client.host if request.client else "127.0.0.1")
    return {"success": True, "message": "Dataset and associated records deleted."}
