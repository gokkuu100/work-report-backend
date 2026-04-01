const fs = require('fs');
const file = '../backend/app/api/users.py';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /user\.department_id = update_in\.department_id\n    user\.is_department_head = update_in\.is_department_head\n    db\.commit\(\)/,
  \`user.department_id = update_in.department_id
    user.is_department_head = update_in.is_department_head
    
    # Auto-assign HR role if department is HR
    if update_in.department_id:
        from app.models.department import Department
        dept = db.query(Department).filter(Department.id == update_in.department_id).first()
        if dept and ("hr" in dept.name.lower() or "human" in dept.name.lower()):
            user.is_hr = True
        else:
            user.is_hr = False
    else:
        user.is_hr = False

    db.commit()\`
);

fs.writeFileSync(file, content);
console.log("Patched users.py department endpoint");
