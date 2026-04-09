import csv
import re
from pathlib import Path
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.models.user import RoleEnum
from app.core.security import get_password_hash

DEFAULT_PASSWORD = "admin123"
DEFAULT_EMAIL_DOMAIN = "company.com"
DEFAULT_CSV_FILE = "yasian employees sheet 2 - Yasian employees.csv"


def _normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _build_base_email(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", ".", name.lower()).strip(".")
    return f"{slug or 'employee'}@{DEFAULT_EMAIL_DOMAIN}"


def _build_unique_email(db, name: str) -> str:
    base_email = _build_base_email(name)
    candidate = base_email
    local, domain = base_email.split("@", 1)
    counter = 1
    while db.query(User).filter(func.lower(User.email) == candidate.lower()).first():
        counter += 1
        candidate = f"{local}{counter}@{domain}"
    return candidate


def _resolve_department_id(db, department_name: str):
    if not department_name:
        return None

    normalized_csv = _normalize(department_name)
    if not normalized_csv:
        return None

    departments = db.query(Department).all()
    for dept in departments:
        normalized_dept = _normalize(dept.name or "")
        if not normalized_dept:
            continue
        if normalized_csv == normalized_dept:
            return dept.id
        if normalized_csv in normalized_dept or normalized_dept in normalized_csv:
            return dept.id
    return None

def load_data(db: Optional[Session] = None, csv_path: Optional[str] = None):
    created_local_session = db is None
    db = db or SessionLocal()

    resolved_path = Path(csv_path) if csv_path else Path(__file__).parent / DEFAULT_CSV_FILE
    with open(resolved_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader)
        # ['', 'Staff No', 'Name', 'Job Title', 'Department', 'Work Place', 'Tel. Number', 'Next of Kin', 'Tel.Number', 'Emp. Date', 'Emp. Duration', 'ID', 'Employee with computer']
        # Note: the second Tel.Number is header[8]
        for row in reader:
            if not row or not row[2].strip():
                continue
            
            name = row[2].strip()
            user = db.query(User).filter(func.lower(User.name) == name.lower()).first()
            if not user:
                user = User(
                    name=name,
                    email=_build_unique_email(db, name),
                    password_hash=get_password_hash(DEFAULT_PASSWORD),
                    role=RoleEnum.employee,
                )
                db.add(user)
                db.flush()
                print(f"Created {name}")
            
            user.staff_no = row[1].strip().zfill(3) if row[1].strip() else None
            user.job_title = row[3].strip() if row[3].strip() else None
            department_name = row[4].strip() if len(row) > 4 and row[4].strip() else ""
            user.department_id = _resolve_department_id(db, department_name)
            user.work_place = row[5].strip() if row[5].strip() else None
            user.phone_number = row[6].strip() if row[6].strip() else None
            user.next_of_kin = row[7].strip() if row[7].strip() else None
            user.next_of_kin_phone = row[8].strip() if len(row) > 8 and row[8].strip() else None
            user.employment_date = row[9].strip() if len(row) > 9 and row[9].strip() else None
            user.employment_duration = row[10].strip() if len(row) > 10 and row[10].strip() else None
            user.national_id = row[11].strip() if len(row) > 11 and row[11].strip() else None
            
            has_comp_str = row[12].strip().upper() if len(row) > 12 else "NO"
            user.has_computer = True if has_comp_str == "YES" else False
            
            db.add(user)
            print(f"Updated {name}")
    
    db.commit()
    if created_local_session:
        db.close()

if __name__ == "__main__":
    load_data()