from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from sqlalchemy import func
from app.db.database import get_db
from app.models.leave import Leave, LeaveType, LeaveApprovalStatus
from app.models.user import User, RoleEnum
from app.models.notification import Notification, TargetType
from app.schemas.leave import LeaveRead, LeaveCreate, LeaveUpdate
from app.api.deps import get_current_active_user, get_current_admin_user, get_current_hr_or_admin_user
from app.utils.date_utils import calculate_leave_days

router = APIRouter()

def validate_leave_application(db: Session, user: User, leave_in: LeaveCreate):
    emp_status = str(user.employment_status).lower()
    if emp_status == "probation (3 months)" or "3m" in emp_status:
        raise HTTPException(status_code=400, detail="Employees on 3-month probation cannot apply for leave. Contact HR.")
        
    requested_days = calculate_leave_days(leave_in.start_date, leave_in.end_date)
    if requested_days <= 0:
        raise HTTPException(status_code=400, detail="Invalid date range.")

    if leave_in.leave_type == LeaveType.sick:
        if not leave_in.document_url:
            raise HTTPException(status_code=400, detail="Sick leave requires a supporting document.")
        if requested_days > 14:
            raise HTTPException(status_code=400, detail="Sick leave exceeds 14 days limit. Contact HR.")
    elif leave_in.leave_type == LeaveType.maternity:
        if requested_days > 90:
            raise HTTPException(status_code=400, detail="Maternity leave exceeds 3 months limit. Contact HR.")
    elif leave_in.leave_type == LeaveType.paternity:
        if requested_days > 14:
            raise HTTPException(status_code=400, detail="Paternity leave exceeds 14 days limit. Contact HR.")
    elif leave_in.leave_type == LeaveType.compassionate:
        if requested_days > 14:
            raise HTTPException(status_code=400, detail="Compassionate leave exceeds 14 days limit. Contact HR.")
            
    if emp_status == "probation (6 months)" or "6m" in emp_status:
        past_leaves_days = db.query(func.sum(Leave.requested_days)).filter(
            Leave.user_id == user.id,
            Leave.hr_admin_status != LeaveApprovalStatus.rejected,
            Leave.dept_head_status != LeaveApprovalStatus.rejected
        ).scalar() or 0
        
        if past_leaves_days + requested_days > 10:
            raise HTTPException(status_code=400, detail="Probation 6m limit of 10 days exceeded. Contact HR.")
            
    return requested_days

@router.get("/", response_model=List[LeaveRead])
def read_all_leaves(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):
    return db.query(Leave).order_by(Leave.start_date.desc()).all()

@router.get("/me", response_model=List[LeaveRead])
def read_my_leaves(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Leave).filter(Leave.user_id == current_user.id).order_by(Leave.start_date.desc()).all()

@router.get("/department", response_model=List[LeaveRead])
def read_department_leaves(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_department_head and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    if current_user.department_id is None and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=400, detail="User not assigned to a department")
        
    query = db.query(Leave)
    if current_user.role != RoleEnum.admin:
        query = query.filter(Leave.department_id == current_user.department_id)
    return query.order_by(Leave.start_date.desc()).all()

@router.post("/apply", response_model=LeaveRead)
def apply_leave(leave_in: LeaveCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    requested_days = validate_leave_application(db, current_user, leave_in)
    
    leave = Leave(
        user_id=current_user.id,
        department_id=current_user.department_id,
        leave_type=leave_in.leave_type,
        reason=leave_in.reason,
        requested_days=requested_days,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        document_url=leave_in.document_url,
        dept_head_status=LeaveApprovalStatus.pending,
        hr_admin_status=LeaveApprovalStatus.pending
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    # Notify Dept Head
    dept_head = db.query(User).filter(User.department_id == current_user.department_id, User.is_department_head == True).first()
    if dept_head and dept_head.id != current_user.id:
        db.add(Notification(user_id=dept_head.id, target_type=TargetType.user, message=f"New leave application ({requested_days} days) from {current_user.name} awaiting your approval."))
        
    # Notify Admins
    admins = db.query(User).filter(User.role == RoleEnum.admin).all()
    for admin in admins:
        if admin.id != current_user.id:
            db.add(Notification(user_id=admin.id, target_type=TargetType.user, message=f"New leave application ({requested_days} days) from {current_user.name} was filed."))
            
    db.commit()
    return leave

@router.post("/grant/{target_user_id}", response_model=LeaveRead)
def direct_grant_leave(target_user_id: int, leave_in: LeaveCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_department_head and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough privileges to grant leave")
        
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.role != RoleEnum.admin and target_user.department_id != current_user.department_id:
        raise HTTPException(status_code=400, detail="Can only grant leave to users in your department")
        
    if not leave_in.reason or not leave_in.reason.strip():
        raise HTTPException(status_code=400, detail="Reason is mandatory when granting leave")
        
    requested_days = calculate_leave_days(leave_in.start_date, leave_in.end_date)
    
    leave = Leave(
        user_id=target_user.id,
        department_id=target_user.department_id,
        leave_type=leave_in.leave_type,
        reason=leave_in.reason,
        requested_days=requested_days,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        document_url=leave_in.document_url,
        dept_head_status=LeaveApprovalStatus.approved,
        hr_admin_status=LeaveApprovalStatus.approved if current_user.role == RoleEnum.admin else LeaveApprovalStatus.pending,
        granted_by_id=current_user.id
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave

@router.delete("/{leave_id}/withdraw")
def withdraw_leave(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
    if leave.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to withdraw this leave")
    if leave.hr_admin_status == LeaveApprovalStatus.approved or leave.dept_head_status == LeaveApprovalStatus.approved:
        raise HTTPException(status_code=400, detail="Cannot withdraw a leave that is already approved")
    db.delete(leave)
    db.commit()
    return {"message": "Leave withdrawn successfully"}

@router.put("/{leave_id}/approve-dept", response_model=LeaveRead)
def approve_leave_dept(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_department_head and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    if current_user.role != RoleEnum.admin and leave.department_id != current_user.department_id:
        raise HTTPException(status_code=400, detail="Cannot approve leaves outside your department")
        
    leave.dept_head_status = LeaveApprovalStatus.approved
    db.commit()
    db.refresh(leave)
    return leave

@router.put("/{leave_id}/reject-dept", response_model=LeaveRead)
def reject_leave_dept(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not current_user.is_department_head and current_user.role != RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Not enough privileges")
        
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    if current_user.role != RoleEnum.admin and leave.department_id != current_user.department_id:
        raise HTTPException(status_code=400, detail="Cannot reject leaves outside your department")
        
    leave.dept_head_status = LeaveApprovalStatus.rejected
    leave.hr_admin_status = LeaveApprovalStatus.rejected
    db.add(Notification(user_id=leave.user_id, target_type=TargetType.user, message=f"Your leave application for {leave.start_date} was Rejected by your Department Head."))
    db.commit()
    db.refresh(leave)
    return leave

@router.put("/{leave_id}/approve-hr", response_model=LeaveRead)
def approve_leave_hr(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    leave.hr_admin_status = LeaveApprovalStatus.approved
    db.add(Notification(user_id=leave.user_id, target_type=TargetType.user, message=f"Your leave application for {leave.start_date} received final HR Approval."))
    db.commit()
    db.refresh(leave)
    return leave

@router.put("/{leave_id}/reject-hr", response_model=LeaveRead)
def reject_leave_hr(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    if current_user.role == RoleEnum.admin:
        leave_data = {c.name: getattr(leave, c.name) for c in leave.__table__.columns}
        db.delete(leave)
        db.commit()
        return leave_data
        
    leave.hr_admin_status = LeaveApprovalStatus.rejected
    db.add(Notification(user_id=leave.user_id, target_type=TargetType.user, message=f"Your leave application for {leave.start_date} was Rejected by HR."))
    db.commit()
    db.refresh(leave)
    return leave
