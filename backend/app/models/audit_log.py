from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    userId: Optional[str] = None
    userName: str = "System"
    userEmail: str = "system@buyerdna.internal"
    action: str
    resource: str
    details: Dict[str, Any] = {}
    ipAddress: str = "127.0.0.1"
    status: Literal["success", "warning", "error"] = "success"
    createdAt: Optional[datetime] = None
