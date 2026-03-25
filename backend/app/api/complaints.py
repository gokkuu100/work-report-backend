from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, RoleEnum
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate, ComplaintRead
from app.api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.post("/", response_model=ComplaintRead)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    complaint = Complaint(
        user_id=current_user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        priority=complaint_in.priority
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.get("/me", response_model=List[ComplaintRead])
def read_my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Complaint).filter(Complaint.user_id == current_user.id).order_by(Complaint.created_at.desc()).all()

@router.get("/", response_model=List[ComplaintRead])
def read_all_complaints(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    return db.query(Complaint).order_by(Complaint.created_at.desc()).all()

@router.patch("/{complaint_id}", response_model=ComplaintRead)
def update_complaint_status(
    complaint_id: int,
    complaint_in: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint_in.status:
        complaint.status = complaint_in.status
        db.commit()
        db.refresh(complaint)
    return complaint
