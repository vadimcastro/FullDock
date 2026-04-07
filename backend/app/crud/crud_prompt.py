from typing import List, Optional
from sqlalchemy import func
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
        # Check if prompt with same ID already exists for this user (Upsert)
        existing_prompt = db.query(self.model).filter(
            self.model.id == obj_in.id,
            self.model.user_id == user_id
        ).first()
        
        if existing_prompt:
            # Update existing
            for field, value in obj_in.model_dump().items():
                setattr(existing_prompt, field, value)
            if existing_prompt.status == "on-deck":
                self.demote_other_on_deck(
                    db,
                    user_id=user_id,
                    model_id=existing_prompt.model_id,
                    exclude_id=existing_prompt.id,
                )
            db.add(existing_prompt)
            db.commit()
            db.refresh(existing_prompt)
            return existing_prompt
            
        # Create new
        db_obj = self.model(
            **obj_in.model_dump(),
            user_id=user_id
        )
        if db_obj.status == "on-deck":
            self.demote_other_on_deck(
                db, user_id=user_id, model_id=db_obj.model_id, exclude_id=db_obj.id
            )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def demote_other_on_deck(
        self, db: Session, *, user_id: int, model_id: str, exclude_id: str
    ) -> None:
        db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.model_id == model_id,
            self.model.status == "on-deck",
            self.model.id != exclude_id,
        ).update(
            {
                self.model.status: "queued",
                self.model.updated_at: func.now(),
            },
            synchronize_session=False,
        )

    def remove_by_user(self, db: Session, *, id: str, user_id: int) -> Optional[Prompt]:
        obj = db.query(self.model).filter(self.model.id == id, self.model.user_id == user_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

crud_prompt = CRUDPrompt(Prompt)
