from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.system_setting import SystemSetting
from app.schemas.setting import SystemSettingRead, SystemSettingUpdate
from app.api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("/{key}", response_model=SystemSettingRead)
def read_setting(
    key: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.put("/{key}", response_model=SystemSettingRead)
def update_setting(
    key: str, 
    setting_in: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=setting_in.value)
        db.add(setting)
    else:
        setting.value = setting_in.value
    db.commit()
    db.refresh(setting)
    return setting
