from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AttachmentBase(BaseModel):
    file_url: str
    file_name: str

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentRead(AttachmentBase):
    id: int
    report_id: Optional[int] = None
    complaint_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
