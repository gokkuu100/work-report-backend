from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, RoleEnum
from app.models.complaint import Complaint, TargetLevel
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
        priority=complaint_in.priority,
        target_level=complaint_in.target_level
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

@router.get("/department", response_model=List[ComplaintRead])
def read_department_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.is_department_head and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    if current_user.department_id is None:
        raise HTTPException(status_code=400, detail="User not assigned to a department")
        
    competitions = db.query(Complaint).join(User, Complaint.user_id == User.id).filter(
        User.department_id == current_user.department_id,
        Complaint.target_level == TargetLevel.department
    ).order_by(Complaint.created_at.desc()).all()
    return competitions

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
