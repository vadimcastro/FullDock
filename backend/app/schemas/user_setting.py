from typing import Optional
from pydantic import BaseModel, ConfigDict

class UserSettingBase(BaseModel):
    theme: Optional[str] = "dark"
    accent_color: Optional[str] = "teal"
    notifications: Optional[bool] = False
    sound_enabled: Optional[bool] = False
    auto_save: Optional[bool] = True

class UserSettingCreate(UserSettingBase):
    pass

class UserSettingUpdate(UserSettingBase):
    pass

class UserSettingInDBBase(UserSettingBase):
    user_id: int
    
    model_config = ConfigDict(from_attributes=True)

class UserSetting(UserSettingInDBBase):
    pass
