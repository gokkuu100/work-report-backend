from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

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
