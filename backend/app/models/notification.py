from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from datetime import datetime
from app.db.database import Base
import enum

class TargetType(str, enum.Enum):
    all = "all"
    user = "user"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    target_type = Column(Enum(TargetType), default=TargetType.all, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
