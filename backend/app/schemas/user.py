from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import RoleEnum, StatusEnum

class UserBase(BaseModel):
    name: str
    email: EmailStr
    staff_no: Optional[str] = None
    job_title: Optional[str] = None
    work_place: Optional[str] = None
    phone_number: Optional[str] = None
    next_of_kin: Optional[str] = None
    next_of_kin_phone: Optional[str] = None
    employment_date: Optional[str] = None
    employment_duration: Optional[str] = None
    national_id: Optional[str] = None
    has_computer: Optional[bool] = False
    employment_status: Optional[str] = "Full Time"
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    staff_no: Optional[str] = None
    job_title: Optional[str] = None
    work_place: Optional[str] = None
    phone_number: Optional[str] = None
    next_of_kin: Optional[str] = None
    next_of_kin_phone: Optional[str] = None
    employment_date: Optional[str] = None
    employment_duration: Optional[str] = None
    national_id: Optional[str] = None
    has_computer: Optional[bool] = None
    employment_status: Optional[str] = None
    password: Optional[str] = None
    role: Optional[RoleEnum] = None
    department_id: Optional[int] = None
    is_department_head: Optional[bool] = None
    is_hr: Optional[bool] = None

class UserRead(UserBase):
    id: int
    staff_no: Optional[str]
    job_title: Optional[str]
    role: RoleEnum
    status: StatusEnum
    employment_status: str
    department_id: Optional[int] = None
    is_department_head: bool
    is_hr: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdateStatus(BaseModel):
    status: StatusEnum

class UserUpdateEmploymentStatus(BaseModel):
    employment_status: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
