from pydantic import BaseModel
from typing import Optional

class SystemSettingBase(BaseModel):
    key: str
    value: str

class SystemSettingUpdate(BaseModel):
    value: str

class SystemSettingRead(SystemSettingBase):
    id: int

    class Config:
        from_attributes = True
