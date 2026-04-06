from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.prompt import Prompt
from app.schemas.prompt import PromptCreate, PromptUpdate

class CRUDPrompt(CRUDBase[Prompt, PromptCreate, PromptUpdate]):
    def get_multi_by_user(
        self, db: Session, *, user_id: int, model_id: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[Prompt]:
        query = db.query(self.model).filter(self.model.user_id == user_id)
        if model_id:
            query = query.filter(self.model.model_id == model_id)
        return query.order_by(self.model.order.asc()).offset(skip).limit(limit).all()

    def create_with_user(
        self, db: Session, *, obj_in: PromptCreate, user_id: int
    ) -> Prompt:
        db_obj = self.model(
            **obj_in.model_dump(),
            user_id=user_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove_by_user(self, db: Session, *, id: str, user_id: int) -> Optional[Prompt]:
        obj = db.query(self.model).filter(self.model.id == id, self.model.user_id == user_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

crud_prompt = CRUDPrompt(Prompt)
