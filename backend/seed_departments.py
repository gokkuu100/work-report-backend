import asyncio
from app.db.database import SessionLocal
from app.models.department import Department

departments = [
    "HR",
    "Admin / Procurement",
    "Accounts",
    "Warehouse",
    "Logistics & Inventory Warehouse",
    "Sales – Retail",
    "Sales – Wholesale",
    "Marketing"
]

def seed():
    db = SessionLocal()
    try:
        # Get existing
        existing = db.query(Department).all()
        existing_names = {d.name: d for d in existing}
        
        for dept in departments:
            if dept not in existing_names:
                new_d = Department(name=dept, description=dept)
                db.add(new_d)
                print(f"Added {dept}")
        db.commit()
        print("Seed complete")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
