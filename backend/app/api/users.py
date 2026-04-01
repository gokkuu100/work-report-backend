from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, StatusEnum, RoleEnum
from app.schemas.user import UserRead, UserCreate, UserUpdate, UserUpdateStatus, UserUpdateEmploymentStatus
from app.core.security import get_password_hash
from app.api.deps import get_current_active_user, get_current_admin_user, get_current_hr_or_admin_user

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_user_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/", response_model=List[UserRead])
def read_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):
    users = db.query(User).order_by(User.name.asc()).all()
    return users

@router.post("/", response_model=UserRead)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_hr_or_admin_user)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        staff_no=user_in.staff_no,
        job_title=user_in.job_title,
        work_place=user_in.work_place,
        phone_number=user_in.phone_number,
        next_of_kin=user_in.next_of_kin,
        next_of_kin_phone=user_in.next_of_kin_phone,
        employment_date=user_in.employment_date,
        employment_duration=user_in.employment_duration,
        national_id=user_in.national_id,
        has_computer=user_in.has_computer,
        employment_status=user_in.employment_status,
        department_id=user_in.department_id,
        role=RoleEnum.employee
    )
    
    if user.department_id:
        from app.models.department import Department
        dept = db.query(Department).filter(Department.id == user.department_id).first()
        if dept and ("hr" in dept.name.lower() or "human" in dept.name.lower()):
            user.is_hr = True

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/suspend", response_model=UserRead)
def suspend_user(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_hr_or_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = StatusEnum.suspended if user.status == StatusEnum.active else StatusEnum.active
    db.commit()
    db.refresh(user)
    return user

from pydantic import BaseModel
from typing import Optional
class UserDepartmentUpdate(BaseModel):
    department_id: Optional[int]
    is_department_head: bool

@router.patch("/{user_id}/department", response_model=UserRead)
def set_user_department(user_id: int, update_in: UserDepartmentUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_hr_or_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.department_id = update_in.department_id
    user.is_department_head = update_in.is_department_head
    
    if user.department_id:
        from app.models.department import Department
        dept = db.query(Department).filter(Department.id == user.department_id).first()
        user.is_hr = bool(dept and ("hr" in dept.name.lower() or "human" in dept.name.lower()))
    else:
        user.is_hr = False
        
    db.commit()
    db.refresh(user)
    return user

class UserHRUpdate(BaseModel):
    is_hr: bool

@router.patch("/{user_id}/hr", response_model=UserRead)
def set_user_hr(user_id: int, update_in: UserHRUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_hr_or_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_hr = update_in.is_hr
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/employment-status", response_model=UserRead)
def update_employment_status(user_id: int, status_update: UserUpdateEmploymentStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.employment_status = status_update.employment_status
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}
