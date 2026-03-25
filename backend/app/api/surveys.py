from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx
from app.db.database import get_db
from app.api.deps import get_current_admin_user
from app.models.survey import SurveyResponse
from app.schemas.survey import SurveyResponseRead, SyncRequest

router = APIRouter()

@router.get("/", response_model=List[SurveyResponseRead], dependencies=[Depends(get_current_admin_user)])
def get_surveys(db: Session = Depends(get_db)):
    return db.query(SurveyResponse).order_by(SurveyResponse.id.desc()).all()

@router.post("/sync", response_model=dict, dependencies=[Depends(get_current_admin_user)])
async def sync_surveys(req: SyncRequest, db: Session = Depends(get_db)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(req.url, follow_redirects=True)
            response.raise_for_status()
            data = response.json().get("data", [])
            
            # Simple truncate and recreate for syncing
            db.query(SurveyResponse).delete()
            
            for item in data:
                db_item = SurveyResponse(
                    timestamp=str(item.get("Timestamp", "")),
                    customer_name=str(item.get("Your Full Name (Customer Name)", item.get("CustomerName", ""))),
                    email=str(item.get("Email Address", item.get("Email", ""))),
                    phone=str(item.get("Phone Number", item.get("Phone", ""))),
                    service_utilized=str(item.get("Which service did you utilize or purchase?", "")),
                    rating=str(item.get("How would you rate the overall quality of the service you received?", item.get("Rating", ""))),
                    feedback=str(item.get("Please share any additional comments or suggestions regarding your experience (Feedback).", item.get("Feedback", "")))
                )
                db.add(db_item)
            
            db.commit()
            return {"message": f"Successfully synced {len(data)} survey responses"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to sync surveys: {str(e)}")
