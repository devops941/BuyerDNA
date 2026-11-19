from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from app.config.db import get_db
from app.middleware.auth import get_current_user, require_roles
from app.services.audit_service import log_audit
from app.models.model_configuration import SaveConfigRequest

router = APIRouter()


def _doc(d):
    if not d:
        return d
    doc_id = str(d.pop("_id", d.get("id", "")))
    d["id"] = doc_id
    d["_id"] = doc_id
    if d.get("userId"):
        d["userId"] = str(d["userId"])
    return d


@router.get("/presets")
async def get_configurations():
    db = get_db()
    configs = await db.modelconfigurations.find().sort("createdAt", -1).to_list(None)
    return {"success": True, "count": len(configs), "data": [_doc(c) for c in configs]}


@router.post("/presets", status_code=201)
async def save_configuration(body: SaveConfigRequest, current_user: dict = Depends(get_current_user)):
    if not body.name:
        raise HTTPException(status_code=400, detail="Configuration name is required.")
    db = get_db()
    if body.isDefault:
        await db.modelconfigurations.update_many({}, {"$set": {"isDefault": False}})
    result = await db.modelconfigurations.insert_one({
        "name": body.name,
        "description": body.description or "",
        "algorithm": "comprehensive",
        "isDefault": body.isDefault,
        "rfmConfig": body.rfmConfig.model_dump() if body.rfmConfig else {},
        "clusteringConfig": body.clusteringConfig.model_dump() if body.clusteringConfig else {},
        "inactivityThresholdDays": body.inactivityThresholdDays,
        "userId": ObjectId(current_user["id"]),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })
    config = await db.modelconfigurations.find_one({"_id": result.inserted_id})
    await log_audit("CONFIGURATION_SAVED", f"ModelConfig:{result.inserted_id}", user_id=current_user["id"],
                    user_name=current_user.get("name"), details={"name": body.name})
    return {"success": True, "message": "Configuration preset saved.", "data": _doc(config)}


@router.delete("/presets/{id}")
async def delete_configuration(id: str, current_user: dict = Depends(require_roles("Super Admin", "Admin"))):
    db = get_db()
    await db.modelconfigurations.delete_one({"_id": ObjectId(id)})
    await log_audit("CONFIGURATION_DELETED", f"ModelConfig:{id}", user_id=current_user["id"],
                    user_name=current_user.get("name"))
    return {"success": True, "message": "Configuration deleted."}
