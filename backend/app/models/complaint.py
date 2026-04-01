from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
import enum

class ComplaintPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TargetLevel(str, enum.Enum):
    company = "company"
    department = "department"

class ComplaintStatus(str, enum.Enum):
    open = "open"
    in_review = "in_review"
    resolved = "resolved"
    closed = "closed"
 
class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    priority = Column(Enum(ComplaintPriority), default=ComplaintPriority.medium, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.open, nullable=False)
    target_level = Column(Enum(TargetLevel), default=TargetLevel.company, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="complaints")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
