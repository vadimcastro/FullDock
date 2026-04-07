# app/api/v1/endpoints/prompts.py
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.utils import get_db
from app.core.security import get_user_from_token
from fastapi.security import OAuth2PasswordBearer
from app.crud.crud_prompt import crud_prompt
from app.schemas.prompt import Prompt, PromptCreate, PromptTransition, PromptUpdate

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@router.get("/", response_model=List[Prompt])
def read_prompts(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    model_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve prompts."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    prompts = crud_prompt.get_multi_by_user(
        db, user_id=user.id, model_id=model_id, skip=skip, limit=limit
    )
    return prompts

@router.post("/", response_model=Prompt)
def create_prompt(
    *,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    prompt_in: PromptCreate,
) -> Any:
    """Create new prompt."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    prompt = crud_prompt.create_with_user(db, obj_in=prompt_in, user_id=user.id)
    return prompt


@router.patch("/{id}", response_model=Prompt)
def update_prompt(
    *,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    id: str,
    prompt_in: PromptUpdate,
) -> Any:
    """Update a prompt."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    prompt = crud_prompt.get(db, id=id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if prompt.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if prompt_in.status == "on-deck":
        crud_prompt.demote_other_on_deck(
            db, user_id=user.id, model_id=prompt.model_id, exclude_id=prompt.id
        )
    prompt = crud_prompt.update(db, db_obj=prompt, obj_in=prompt_in)
    return prompt


@router.post("/{id}/transition", response_model=Prompt)
def transition_prompt_status(
    *,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    id: str,
    transition_in: PromptTransition,
) -> Any:
    """Atomically transition prompt status and dependent queue state."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    prompt = crud_prompt.get(db, id=id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if prompt.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    prompt = crud_prompt.transition_status(
        db, db_obj=prompt, new_status=transition_in.status
    )
    return prompt


@router.delete("/{id}", response_model=Prompt)
def delete_prompt(
    *,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    id: str,
) -> Any:
    """Delete a prompt."""
    user = get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    prompt = crud_prompt.get(db, id=id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    if prompt.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    prompt = crud_prompt.remove(db, id=id)
    return prompt
