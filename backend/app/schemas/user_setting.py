from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

PromptCategory = Literal["on-deck", "needs-edit", "queued", "forked", "complete"]

class UserSettingBase(BaseModel):
    theme: Optional[str] = "dark"
    accent_color: Optional[str] = "teal"
    notifications: Optional[bool] = False
    sound_enabled: Optional[bool] = False
    auto_save: Optional[bool] = True
    font_scale: Optional[int] = 100
    show_prompt_titles: Optional[bool] = True
    model_tab_order: Optional[str] = '["claude","gemini","gpt","grok"]'
    enabled_model_tabs: Optional[str] = '["claude","gemini","gpt","grok"]'
    model_tab_titles: Optional[str] = '{"claude":"Claude","gemini":"Gemini","gpt":"GPT","grok":"Grok"}'
    custom_model_tab_title: Optional[str] = "Custom"
    prompt_category_order: Optional[str] = '["on-deck","needs-edit","queued","forked","complete"]'
    enabled_prompt_categories: Optional[str] = '["on-deck","needs-edit","queued","forked","complete"]'

class UserSettingCreate(UserSettingBase):
    pass

class UserSettingUpdate(UserSettingBase):
    pass


class ModelTabsLayoutUpdate(BaseModel):
    order: List[str] = Field(min_length=1)
    enabled: List[str] = Field(min_length=1)


class PromptCategoriesLayoutUpdate(BaseModel):
    order: List[PromptCategory] = Field(min_length=1)
    enabled: List[PromptCategory] = Field(min_length=1)


class ModelTabTitleUpdate(BaseModel):
    tab_id: str
    title: str


class UserSettingInDBBase(UserSettingBase):
    user_id: int
    
    model_config = ConfigDict(from_attributes=True)

class UserSetting(UserSettingInDBBase):
    pass
