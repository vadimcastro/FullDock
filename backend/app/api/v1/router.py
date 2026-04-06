from fastapi import APIRouter
from app.api.v1 import auth, oauth
from app.api.v1.endpoints import metrics

api_router = APIRouter()

# Include authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])

# Include metrics routes  
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
