from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.report import ReportStatus
from app.schemas.attachment import AttachmentRead, AttachmentCreate

class ReportBase(BaseModel):
    tasks: str
    blockers: Optional[str] = None
    status: ReportStatus = ReportStatus.draft

class ReportCreate(ReportBase):
    attachments: List[AttachmentCreate] = []

class ReportUpdate(BaseModel):
    tasks: Optional[str] = None
    blockers: Optional[str] = None
    status: Optional[ReportStatus] = None

class ReportRead(ReportBase):
    id: int
    user_id: int
    date: date
    is_late: bool
    created_at: datetime
    attachments: List[AttachmentRead] = []

    class Config:
        from_attributes = True
