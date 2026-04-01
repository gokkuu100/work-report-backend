import csv
import os
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.user import User

def load_data():
    db = SessionLocal()
    with open("yasian employees sheet 2 - Yasian employees.csv", "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader)
        # ['', 'Staff No', 'Name', 'Job Title', 'Department', 'Work Place', 'Tel. Number', 'Next of Kin', 'Tel.Number', 'Emp. Date', 'Emp. Duration', 'ID', 'Employee with computer']
        # Note: the second Tel.Number is header[8]
        for row in reader:
            if not row or not row[2].strip():
                continue
            
            name = row[2].strip()
            user = db.query(User).filter(User.name.ilike(f"%{name}%")).first()
            if not user:
                print(f"User {name} not found in DB, skipping or add logic to create")
                continue
            
            user.staff_no = row[1].strip().zfill(3) if row[1].strip() else None
            user.job_title = row[3].strip() if row[3].strip() else None
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
    db.close()

if __name__ == "__main__":
    load_data()