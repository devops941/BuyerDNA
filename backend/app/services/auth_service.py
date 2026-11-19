from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from bson import ObjectId
from app.config.env import settings
from app.config.db import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _parse_expires_in(exp: str) -> int:
    if exp.endswith("d"):
        return int(exp[:-1]) * 86400
    if exp.endswith("h"):
        return int(exp[:-1]) * 3600
    return 86400 * 7


def generate_token(user_id: str) -> str:
    seconds = _parse_expires_in(settings.JWT_EXPIRES_IN)
    expire = datetime.utcnow() + timedelta(seconds=seconds)
    return jwt.encode({"id": user_id, "exp": expire}, settings.JWT_SECRET, algorithm="HS256")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _safe_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
        "role": doc["role"],
        "status": doc.get("status", "active"),
        "lastLogin": doc.get("lastLogin"),
    }


async def register_user(name: str, email: str, password: str, role: str = "Analyst") -> dict:
    db = get_db()
    existing = await db.users.find_one({"email": email.lower()})
    if existing:
        raise ValueError("An account with this email address already exists.")
    hashed = hash_password(password)
    result = await db.users.insert_one({
        "name": name,
        "email": email.lower(),
        "password": hashed,
        "role": role,
        "avatar": "",
        "status": "active",
        "lastLogin": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    })
    doc = await db.users.find_one({"_id": result.inserted_id})
    token = generate_token(str(result.inserted_id))
    return {"user": _safe_user(doc), "token": token}


async def login_user(email: str, password: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": email.lower()})
    if not user:
        raise ValueError("Invalid email or password.")
    if user.get("status") == "suspended":
        raise ValueError("Account suspended. Contact support.")
    if not verify_password(password, user["password"]):
        raise ValueError("Invalid email or password.")
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"lastLogin": datetime.utcnow()}})
    user["lastLogin"] = datetime.utcnow()
    token = generate_token(str(user["_id"]))
    return {"user": _safe_user(user), "token": token}
