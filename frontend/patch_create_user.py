import re

file = '../backend/app/api/users.py'
with open(file, 'r') as f:
    content = f.read()

target = """        department_id=user_in.department_id,
        role=RoleEnum.employee
    )
    db.add(user)"""

replace = """        department_id=user_in.department_id,
        role=RoleEnum.employee
    )
    
    if user.department_id:
        from app.models.department import Department
        dept = db.query(Department).filter(Department.id == user.department_id).first()
        if dept and ("hr" in dept.name.lower() or "human" in dept.name.lower()):
            user.is_hr = True

    db.add(user)"""

content = content.replace(target, replace)

with open(file, 'w') as f:
    f.write(content)

print("Python patch executed")
