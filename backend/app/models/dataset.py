from pydantic import BaseModel
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime


class ColumnInfo(BaseModel):
    name: str
    detectedType: str = "string"
    mappedTo: str = ""


class ValidationSummary(BaseModel):
    missingValues: int = 0
    duplicates: int = 0
    negativeAmounts: int = 0
    invalidDates: int = 0
    correctedRows: int = 0
    rejectedRows: int = 0
    totalPassed: int = 0


DatasetStatus = Literal["uploaded", "validating", "cleaned", "ready", "failed"]


class DatasetResponse(BaseModel):
    id: str
    name: str
    originalFilename: str
    filePath: str
    cleanedFilePath: Optional[str] = None
    rejectedFilePath: Optional[str] = None
    rowCount: int = 0
    columnCount: int = 0
    fileSize: int = 0
    qualityScore: int = 100
    columns: List[ColumnInfo] = []
    validationSummary: ValidationSummary = ValidationSummary()
    status: DatasetStatus = "uploaded"
    userId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class MappingRequest(BaseModel):
    mapping: Dict[str, str] = {}
