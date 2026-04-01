from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserRead

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DepartmentRead(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DepartmentWithUsers(DepartmentRead):
    users: List[UserRead] = []
