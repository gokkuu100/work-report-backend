import sys
import os

# Ensure app module is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.department import Department

def seed_departments():
    db = SessionLocal()
    depts = [
        "HR", "Admin / Procurement", "Accounts", "Warehouse",
        "Logistics & Inventory Warehouse", "Sales - Retail",
        "Sales - Wholesale", "Marketing"
    ]
    for d in depts:
        existing = db.query(Department).filter(Department.name == d).first()
        if not existing:
            db.add(Department(name=d, description=f"{d} Department"))
            print(f"Added {d}")
        else:
            print(f"{d} already exists")
    db.commit()
    db.close()
    print("Departments seeded successfully.")

if __name__ == "__main__":
    seed_departments()
