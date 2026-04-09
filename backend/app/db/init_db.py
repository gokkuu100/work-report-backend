from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User, RoleEnum
from app.models.department import Department
from app.core.security import get_password_hash
from seed_deps import seed_departments
from seed_employee_data import load_data

def init_db(db: Session) -> None:
    user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not user:
        user = User(
            name="Super Admin",
            email=settings.ADMIN_EMAIL,
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            role=RoleEnum.admin,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    has_departments = db.query(Department).count() > 0
    has_employees = db.query(User).filter(User.role == RoleEnum.employee).first() is not None

    # Startup seed order: admin -> departments -> employees linked to departments.
    if not has_departments:
        seed_departments(db=db, reset=False)
    if not has_employees:
        load_data(db=db)
