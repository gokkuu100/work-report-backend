const fs = require('fs');
const file = '../backend/app/api/users.py';
let content = fs.readFileSync(file, 'utf8');

const targetObj = `    db_user = User(
        **user_in.dict(exclude={"password"}),
        password_hash=get_password_hash(user_in.password),
        role=RoleEnum.employee`;

const replaceObj = `    db_user = User(
        **user_in.dict(exclude={"password"}),
        password_hash=get_password_hash(user_in.password),
        role=RoleEnum.employee
    )
    if db_user.department_id:
        from app.models.department import Department
        dept = db.query(Department).filter(Department.id == db_user.department_id).first()
        if dept and ("hr" in dept.name.lower() or "human" in dept.name.lower()):
            db_user.is_hr = True`;

content = content.replace(targetObj, replaceObj);
content = content.replace("    )\n    db.add(db_user)", "    db.add(db_user)"); // Fix the trailing bracket if we replaced it

fs.writeFileSync(file, content);
console.log("Patched users.py user creation");
