# app/main.py
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from app.api.v1.router import api_router
from app.core.api_errors import error_payload
from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import SessionLocal

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler("app.log")],
)
logger = logging.getLogger(__name__)

# Determine environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
logger.info(f"Environment: {ENVIRONMENT}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("App startup - initializing cache...")
    FastAPICache.init(InMemoryBackend(), prefix=settings.CACHE_PREFIX)
    logger.info("Cache initialized successfully")
    yield
    logger.info("App shutdown")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
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


def _request_id_from_request(request: Request) -> str:
    request_id = getattr(request.state, "request_id", "") or request.headers.get("x-request-id")
    return request_id or str(uuid4())


def _allow_origin() -> str:
    origins = settings.CORS_ORIGINS_RESOLVED
    if origins:
        return origins[0]
    return "*"


def _http_code(status_code: int) -> str:
    mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "TOO_MANY_REQUESTS",
    }
    return mapping.get(status_code, "HTTP_ERROR")


@app.middleware("http")
async def add_request_metadata(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        logger.error(
            "request_failed method=%s path=%s request_id=%s duration_ms=%s error=%s",
            request.method,
            request.url.path,
            request_id,
            elapsed_ms,
            str(exc),
            exc_info=True,
        )
        message = "Internal server error" if settings.is_production else str(exc)
        response = JSONResponse(
            status_code=500,
            content={
                "detail": error_payload(
                    code="INTERNAL_SERVER_ERROR",
                    message=message,
                    request_id=request_id,
                )
            },
            headers={
                "Access-Control-Allow-Origin": _allow_origin(),
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": ", ".join(settings.CORS_METHODS),
                "Access-Control-Allow-Headers": ", ".join(settings.CORS_HEADERS),
            },
        )
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_complete method=%s path=%s status=%s request_id=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        request_id,
        elapsed_ms,
    )
    return response


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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = _request_id_from_request(request)
    logger.warning(
        "request_validation_error path=%s request_id=%s errors=%s",
        request.url.path,
        request_id,
        exc.errors(),
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": error_payload(
                code="VALIDATION_ERROR",
                message="Request validation failed",
                request_id=request_id,
            )
        },
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = _request_id_from_request(request)
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        payload = dict(detail)
        payload.setdefault("request_id", request_id)
    else:
        payload = error_payload(
            code=_http_code(exc.status_code),
            message=str(detail),
            request_id=request_id,
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": payload},
        headers={"X-Request-ID": request_id},
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
        "environment": ENVIRONMENT,
    }


@app.get("/health")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "database": "skipped",
        "cache": "disabled",
        "environment": ENVIRONMENT,
        "client_host": request.client.host if request.client else None,
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
