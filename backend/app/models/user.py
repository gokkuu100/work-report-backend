from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    employee = "employee"

class StatusEnum(str, enum.Enum):
    active = "active"
    suspended = "suspended"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.employee, nullable=False)
    status = Column(Enum(StatusEnum), default=StatusEnum.active, nullable=False)
    employment_status = Column(String, default="Full Time", nullable=False)
    staff_no = Column(String, unique=True, nullable=True)
    job_title = Column(String, nullable=True)
    work_place = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    next_of_kin = Column(String, nullable=True)
    next_of_kin_phone = Column(String, nullable=True)
    employment_date = Column(String, nullable=True)
    employment_duration = Column(String, nullable=True)
    national_id = Column(String, nullable=True)
    has_computer = Column(Boolean, default=False, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_department_head = Column(Boolean, default=False, nullable=False, server_default='false')
    is_hr = Column(Boolean, default=False, nullable=False, server_default='false')
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="user", cascade="all, delete-orphan")
    department = relationship("Department", back_populates="users")
    leaves = relationship("Leave", foreign_keys="[Leave.user_id]", back_populates="user", cascade="all, delete-orphan")
    granted_leaves = relationship("Leave", foreign_keys="[Leave.granted_by_id]", back_populates="granted_by", cascade="all, delete-orphan")
