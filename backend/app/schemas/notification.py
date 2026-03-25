from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.notification import TargetType

class NotificationBase(BaseModel):
    message: str
    target_type: TargetType
    user_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationRead(NotificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
