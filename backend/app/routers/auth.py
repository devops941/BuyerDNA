from fastapi import APIRouter, Depends, Request, HTTPException
from app.models.user import UserCreate, UserLogin, UpdateProfile, ChangePassword
from app.services.auth_service import register_user, login_user, hash_password, verify_password
from app.services.audit_service import log_audit
from app.middleware.auth import get_current_user
from app.config.db import get_db
from bson import ObjectId
from datetime import datetime

router = APIRouter()


@router.post("/register", status_code=201)
async def register(body: UserCreate, request: Request):
    try:
        result = await register_user(body.name, body.email, body.password, body.role)
        await log_audit("USER_REGISTERED", "User", user_id=result["user"]["id"],
                        user_name=result["user"]["name"], user_email=result["user"]["email"],
                        ip_address=request.client.host if request.client else "127.0.0.1")
        return {"success": True, "message": "Account registered successfully", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(body: UserLogin, request: Request):
    try:
        result = await login_user(body.email, body.password)
        await log_audit("USER_LOGIN", "User", user_id=result["user"]["id"],
                        user_name=result["user"]["name"], user_email=result["user"]["email"],
                        ip_address=request.client.host if request.client else "127.0.0.1")
        return {"success": True, "message": "Logged in successfully", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"success": True, "data": current_user}


@router.put("/profile")
async def update_profile(body: UpdateProfile, current_user: dict = Depends(get_current_user)):
    db = get_db()
    updates = {}
    if body.name:
        updates["name"] = body.name
    if body.avatar is not None:
        updates["avatar"] = body.avatar
    if updates:
        updates["updatedAt"] = datetime.utcnow()
        await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": updates})
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    user["id"] = str(user.pop("_id"))
    user.pop("password", None)
    return {"success": True, "message": "Profile updated successfully", "data": user}


@router.post("/change-password")
async def change_password(body: ChangePassword, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user or not verify_password(body.currentPassword, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hashed = hash_password(body.newPassword)
    await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": {"password": new_hashed, "updatedAt": datetime.utcnow()}})
    return {"success": True, "message": "Password changed successfully"}
