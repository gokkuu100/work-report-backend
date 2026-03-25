from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.database import Base

class SurveyResponse(Base):
    __tablename__ = "survey_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    service_utilized = Column(String, nullable=True)
    rating = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
