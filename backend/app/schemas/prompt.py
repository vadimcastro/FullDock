from typing import Optional
from pydantic import BaseModel, ConfigDict

class PromptBase(BaseModel):
    model_id: str
    content: str
    notes: Optional[str] = ""
    status: str
    order: int
    linked_prompt_id: Optional[str] = None

class PromptCreate(PromptBase):
    id: str # Client generates UUID

class PromptUpdate(BaseModel):
    content: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    order: Optional[int] = None
    linked_prompt_id: Optional[str] = None

class PromptInDBBase(PromptBase):
    id: str
    user_id: int
    
    model_config = ConfigDict(from_attributes=True)

class Prompt(PromptInDBBase):
    pass
