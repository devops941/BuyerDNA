from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

JobStatus = Literal["queued", "processing", "completed", "failed"]


class AnalysisJobResponse(BaseModel):
    id: str
    datasetId: str
    algorithm: str = "comprehensive"
    status: JobStatus = "queued"
    progress: int = 0
    parameters: Dict[str, Any] = {}
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    durationSeconds: int = 0
    error: Optional[str] = None
    logs: List[str] = []
    userId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class StartAnalysisRequest(BaseModel):
    datasetId: str
    algorithm: str = "comprehensive"
    parameters: Dict[str, Any] = {}
