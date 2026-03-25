from pydantic import BaseModel
from typing import Optional

class SurveyResponseBase(BaseModel):
    timestamp: Optional[str] = None
    customer_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    service_utilized: Optional[str] = None
    rating: Optional[str] = None
    feedback: Optional[str] = None

class SurveyResponseRead(SurveyResponseBase):
    id: int

    class Config:
        from_attributes = True

class SyncRequest(BaseModel):
    url: str
