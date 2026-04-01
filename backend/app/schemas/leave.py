from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.leave import LeaveType, LeaveApprovalStatus

class LeaveBase(BaseModel):
    leave_type: LeaveType
    reason: Optional[str] = None
    requested_days: int
    start_date: date
    end_date: date
    document_url: Optional[str] = None

class LeaveCreate(LeaveBase):
    pass

class LeaveUpdate(BaseModel):
    dept_head_status: Optional[LeaveApprovalStatus] = None
    hr_admin_status: Optional[LeaveApprovalStatus] = None

class LeaveRead(LeaveBase):
    id: int
    user_id: int
    department_id: Optional[int]
    dept_head_status: LeaveApprovalStatus
    hr_admin_status: LeaveApprovalStatus
    granted_by_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
