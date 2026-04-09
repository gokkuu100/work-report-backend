import sys
import os

# Ensure app module is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.department import Department
from app.models.user import User
from app.models.leave import Leave
from app.models.notification import Notification

def seed_departments():
    db = SessionLocal()
    
    # 1. Nullify department_id in all referencing models
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
    
    # 2. Delete all existing departments
    db.query(Department).delete()
    db.commit()
    
    # 3. Create new departments as structured by user
    depts = [
        "accounrs",
        "sales-retail",
        "sales-wholesale",
        "sales-project",
        "inventory-warehouse",
        "inventory-logistics",
        "admin",
        "hr",
        "procurement",
        "marketing/IT"
    ]
    
    for d in depts:
        db.add(Department(name=d, description=f"{d} Department"))
        print(f"Added {d}")
        
    db.commit()
    db.close()
    print("Departments seeded successfully.")

if __name__ == "__main__":
    seed_departments()
