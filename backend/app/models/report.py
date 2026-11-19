from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any
from datetime import datetime

ReportType = Literal["executive", "rfm", "segmentation", "behaviour", "validation"]
ReportFormat = Literal["pdf", "csv", "xlsx"]
ReportStatus = Literal["generating", "ready", "failed"]


class CreateReportRequest(BaseModel):
    datasetId: str
    type: ReportType
    format: ReportFormat = "csv"


class ReportResponse(BaseModel):
    id: str
    title: str
    type: ReportType
    datasetId: str
    format: ReportFormat = "csv"
    downloadUrl: Optional[str] = None
    fileSize: int = 0
    generatedBy: Optional[str] = None
    status: ReportStatus = "ready"
    summary: Optional[Dict[str, Any]] = None
    createdAt: Optional[datetime] = None
