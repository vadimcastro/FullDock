from fastapi import APIRouter
from app.api.v1 import auth, oauth
from app.api.v1.endpoints import metrics, prompts, settings

api_router = APIRouter()

# Include authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])

# Include metrics routes  
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])

# Include prompt routes
api_router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])

# Include setting routes
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
