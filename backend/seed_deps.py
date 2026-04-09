import sys
import os
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

# Ensure app module is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.department import Department
from app.models.user import User
from app.models.leave import Leave
from app.models.notification import Notification

DEPARTMENTS = [
        "Accounts",
        "Sales-Retail",
        "Sales-Wholesale",
        "Sales-Project",
        "Inventory-Warehouse",
        "Inventory-Logistics",
        "Admin",
        "HR",
        "Procurement",
        "Marketing/IT"
]


def seed_departments(db: Optional[Session] = None, reset: bool = False):
    created_local_session = db is None
    db = db or SessionLocal()

    if reset:
        # Reset references first so deleting departments does not violate FKs.
        users = db.query(User).all()
        for user in users:
            user.department_id = None
            user.is_department_head = False
            user.is_hr = False

        leaves = db.query(Leave).all()
        for leave in leaves:
            leave.department_id = None

        notifications = db.query(Notification).all()
        for notif in notifications:
            notif.department_id = None

        db.commit()
        db.query(Department).delete()
        db.commit()

    created_count = 0
    for dept_name in DEPARTMENTS:
        exists = (
            db.query(Department)
            .filter(func.lower(Department.name) == dept_name.lower())
            .first()
        )
        if exists:
            continue

        db.add(Department(name=dept_name, description=f"{dept_name} Department"))
        created_count += 1
        print(f"Added {dept_name}")

        
    db.commit()
    if created_local_session:
        db.close()
    print(f"Departments seeded successfully. Created: {created_count}")

if __name__ == "__main__":
    seed_departments()
