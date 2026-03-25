from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, StatusEnum, RoleEnum
from app.schemas.user import UserRead, UserCreate
from app.core.security import get_password_hash
from app.api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("/me", response_model=UserRead)
def read_user_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/", response_model=List[UserRead])
def read_users(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
    users = db.query(User).all()
    return users

@router.post("/", response_model=UserRead)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=RoleEnum.employee
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/suspend", response_model=UserRead)
def suspend_user(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = StatusEnum.suspended if user.status == StatusEnum.active else StatusEnum.active
    db.commit()
    db.refresh(user)
    return user
