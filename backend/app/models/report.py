from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Date, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.db.database import Base
import enum

class ReportStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    tasks = Column(String, nullable=False)
    blockers = Column(String, nullable=True)
    status = Column(Enum(ReportStatus), default=ReportStatus.draft, nullable=False)
    is_late = Column(Boolean, default=False, nullable=False, server_default='false')
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_user_date'),
    )

    user = relationship("User", back_populates="reports")
    attachments = relationship("Attachment", back_populates="report", cascade="all, delete-orphan")
