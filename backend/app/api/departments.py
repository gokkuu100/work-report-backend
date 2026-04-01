from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.department import Department
from app.models.user import User
from app.schemas.department import DepartmentRead, DepartmentCreate, DepartmentUpdate, DepartmentWithUsers
from app.api.deps import get_current_admin_user, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[DepartmentRead])
def read_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Department).all()

@router.post("/", response_model=DepartmentRead)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
    existing = db.query(Department).filter(Department.name == dept_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    department = Department(
        name=dept_in.name,
        description=dept_in.description
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    return department

@router.get("/{dept_id}", response_model=DepartmentWithUsers)
def read_department(dept_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.delete("/{dept_id}", status_code=204)
def delete_department(dept_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return None
