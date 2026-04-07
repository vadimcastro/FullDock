from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

PromptStatus = Literal["queued", "on-deck", "needs-edit", "forked", "complete"]

class PromptBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    model_id: str
    title: Optional[str] = ""
    content: str
    notes: Optional[str] = ""
    status: PromptStatus
    order: int
    linked_prompt_id: Optional[str] = None

class PromptCreate(PromptBase):
    id: str # Client generates UUID

class PromptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PromptStatus] = None
    order: Optional[int] = None
    linked_prompt_id: Optional[str] = None

class PromptTransition(BaseModel):
    status: PromptStatus

class PromptInDBBase(PromptBase):
    id: str
    user_id: int
    
    model_config = ConfigDict(from_attributes=True)

class Prompt(PromptInDBBase):
    pass
