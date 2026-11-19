from datetime import datetime
from bson import ObjectId
from app.config.db import get_db


async def log_audit(
    action: str,
    resource: str,
    user_id=None,
    user_name: str = "System",
    user_email: str = "system@buyerdna.internal",
    details: dict = None,
    ip_address: str = "127.0.0.1",
    status: str = "success",
) -> None:
    try:
        db = get_db()
        await db.auditlogs.insert_one({
            "userId": ObjectId(user_id) if user_id else None,
            "userName": user_name or "System",
            "userEmail": user_email or "system@buyerdna.internal",
            "action": action,
            "resource": resource,
            "details": details or {},
            "ipAddress": ip_address,
            "status": status,
            "createdAt": datetime.utcnow(),
        })
    except Exception as e:
        print(f"[AuditLog Error] {e}")
