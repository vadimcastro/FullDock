# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import logging
import sys
import os
from app.api.v1.router import api_router
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.db.utils import test_db_connection
from app.middleware.security import setup_security
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

# Determine environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
logger.info(f"Environment: {ENVIRONMENT}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup
    logger.info("App startup - initializing cache...")
    FastAPICache.init(InMemoryBackend(), prefix=settings.CACHE_PREFIX)
    logger.info("Cache initialized successfully")
    
    yield
    
    # Cleanup
    logger.info("App shutdown")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="OnDeck backend API",
    version="2.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_RESOLVED,
    allow_credentials=True,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
    expose_headers=settings.CORS_HEADERS,
    max_age=settings.CORS_MAX_AGE,
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Add error handling middleware to ensure CORS headers on errors
@app.middleware("http")
async def add_cors_headers_on_error(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Unhandled error in {request.url}: {str(e)}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)},
            headers={
                "Access-Control-Allow-Origin": settings.CORS_ORIGINS_RESOLVED[0],
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": ", ".join(settings.CORS_METHODS),
                "Access-Control-Allow-Headers": ", ".join(settings.CORS_HEADERS),
            }
        )

logger.info(f"Total middleware count: {len(app.user_middleware)}")

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    settings.validate_production_settings()
    logger.info(f"Starting up application in {ENVIRONMENT} environment...")
    logger.info("Startup event completed - database initialization skipped for deployment")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")


@app.get("/test-cors")
async def test_cors(request: Request):
    logger.info("Test CORS endpoint called")
    logger.debug(f"Request origin: {request.headers.get('origin')}")
    return {
        "message": "CORS test successful",
        "origin": request.headers.get("origin"),
        "environment": ENVIRONMENT
    }

@app.get("/health")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "database": "skipped",
        "cache": "disabled", 
        "environment": ENVIRONMENT,
        "client_host": request.client.host if request.client else None
    }

@app.post("/admin/init-db")
async def initialize_database():
    """Initialize database with admin user - call this manually if automatic init fails"""
    try:
        db = SessionLocal()
        try:
            init_db(db)
            return {"status": "success", "message": "Database initialized successfully"}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Manual database initialization failed: {str(e)}")
        return {"status": "error", "message": f"Database initialization failed: {str(e)}"}

# FastAPI CORSMiddleware handles OPTIONS requests automatically
