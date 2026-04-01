from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
from app.db.database import get_db
from app.api.deps import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.models.notification import Notification, TargetType
from app.schemas.notification import NotificationCreate, NotificationRead

router = APIRouter()

@router.post("/", response_model=NotificationRead)
def create_notification(notif: NotificationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    from app.models.user import RoleEnum
    if current_user.role != RoleEnum.admin and not current_user.is_department_head:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    if current_user.role != RoleEnum.admin:
        if notif.target_type != TargetType.department or notif.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Department heads can only send alerts to their own department")
    if notif.target_type == TargetType.user and not notif.user_id:
        raise HTTPException(status_code=400, detail="user_id is required when target_type is user")
    if notif.target_type == TargetType.department and not notif.department_id:
        raise HTTPException(status_code=400, detail="department_id is required when target_type is department")
        
    db_notif = Notification(
        message=notif.message,
        target_type=notif.target_type,
        user_id=notif.user_id,
        department_id=notif.department_id,
        sender_id=current_user.id
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

@router.get("/", response_model=List[NotificationRead], dependencies=[Depends(get_current_admin_user)])
def get_all_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.id.desc()).all()

from app.models.notification_read import NotificationReadTracker

@router.get("/me", response_model=List[NotificationRead])
def get_my_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    read_notif_ids = db.query(NotificationReadTracker.notification_id).filter(
        NotificationReadTracker.user_id == current_user.id
    ).subquery()
    
    return db.query(Notification).filter(
        or_(
            Notification.target_type == TargetType.all,
            and_(Notification.target_type == TargetType.user, Notification.user_id == current_user.id),
            and_(Notification.target_type == TargetType.department, Notification.department_id == current_user.department_id)
        ),
        ~Notification.id.in_(read_notif_ids),
        Notification.created_at >= current_user.created_at
    ).order_by(Notification.created_at.desc()).all()

@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    existing = db.query(NotificationReadTracker).filter_by(
        user_id=current_user.id, 
        notification_id=notification_id
    ).first()
    
    if not existing:
        tracker = NotificationReadTracker(
            user_id=current_user.id, 
            notification_id=notification_id
        )
        db.add(tracker)
        db.commit()
    return {"message": "Success"}
