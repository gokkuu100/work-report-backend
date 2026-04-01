from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
import enum

class LeaveType(str, enum.Enum):
    sick = "sick"
    maternity = "maternity"
    paternity = "paternity"
    compassionate = "compassionate"
    annual = "annual"
    unpaid = "unpaid"

class LeaveApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class Leave(Base):
    __tablename__ = "leaves"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    leave_type = Column(Enum(LeaveType), nullable=False)
    reason = Column(String, nullable=True)
    requested_days = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    document_url = Column(String, nullable=True) # Will store MinIO object key
    
    dept_head_status = Column(Enum(LeaveApprovalStatus), default=LeaveApprovalStatus.pending, nullable=False)
    hr_admin_status = Column(Enum(LeaveApprovalStatus), default=LeaveApprovalStatus.pending, nullable=False)
    
    granted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True) # If directly granted
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="leaves")
    granted_by = relationship("User", foreign_keys=[granted_by_id], back_populates="granted_leaves")
    department = relationship("Department")
