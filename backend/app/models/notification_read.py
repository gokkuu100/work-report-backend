from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime
from app.db.database import Base

class NotificationReadTracker(Base):
    __tablename__ = "notification_reads"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
