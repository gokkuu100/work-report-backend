from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.complaint import ComplaintPriority, ComplaintStatus

class ComplaintBase(BaseModel):
    title: str
    description: str
    priority: ComplaintPriority = ComplaintPriority.medium

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None

class ComplaintRead(ComplaintBase):
    id: int
    user_id: int
    status: ComplaintStatus
    created_at: datetime

    class Config:
        from_attributes = True
