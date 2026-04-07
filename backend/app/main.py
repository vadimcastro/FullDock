# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.api_errors import error_payload
from app.core.ops_metrics import ops_metrics
import logging
import sys
import os
import time
from uuid import uuid4
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
    version="2.1.7",
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
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'; base-uri 'self'"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Add error handling middleware to ensure CORS headers on errors
@app.middleware("http")
async def add_cors_headers_on_error(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        if response.status_code >= 400:
            ops_metrics.incr(f"http.status.{response.status_code}")
        logger.info(
            "request_complete method=%s path=%s status=%s request_id=%s duration_ms=%s",
            request.method,
            request.url.path,
            response.status_code,
            request_id,
            elapsed_ms,
        )
        return response
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        ops_metrics.incr("http.unhandled_exception")
        logger.error(
            "request_failed method=%s path=%s request_id=%s duration_ms=%s error=%s",
            request.method,
            request.url.path,
            request_id,
            elapsed_ms,
            str(e),
            exc_info=True,
        )
        message = "Internal server error" if settings.is_production else str(e)
        allow_origin = (
            settings.CORS_ORIGINS_RESOLVED[0]
            if settings.CORS_ORIGINS_RESOLVED
            else "*"
        )
        return JSONResponse(
            status_code=500,
            content={"detail": error_payload("INTERNAL_SERVER_ERROR", message, request_id)},
            headers={
                "Access-Control-Allow-Origin": allow_origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": ", ".join(settings.CORS_METHODS),
                "Access-Control-Allow-Headers": ", ".join(settings.CORS_HEADERS),
                "X-Request-ID": request_id,
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
    payload = {
        "status": "healthy",
        "database": "skipped",
        "cache": "disabled", 
        "environment": ENVIRONMENT,
        "client_host": request.client.host if request.client else None
    }
    if not settings.is_production:
        payload["ops_metrics_top"] = ops_metrics.snapshot(limit=10)
    return payload

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
