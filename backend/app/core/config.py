# app/core/config.py
import os
from typing import ClassVar, List, Set

from pydantic_settings import BaseSettings

from .parameters import parameter_store


class Settings(BaseSettings):
    PROJECT_NAME: str = "{{PROJECT_DISPLAY_NAME}} API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").strip().lower()
    DEBUG: bool = os.getenv("DEBUG", "true").strip().lower() == "true"

    # Database settings
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "{{PROJECT_NAME}}")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "db")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))

    # Admin user settings
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "{{ADMIN_EMAIL}}")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "{{DEV_PASSWORD}}")
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "{{ADMIN_USERNAME}}")
    ADMIN_NAME: str = os.getenv("ADMIN_NAME", "{{ADMIN_NAME}}")

    # JWT settings
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))
    AUTH_MAX_FAILED_ATTEMPTS: int = int(os.getenv("AUTH_MAX_FAILED_ATTEMPTS", "5"))
    AUTH_FAILED_WINDOW_SECONDS: int = int(os.getenv("AUTH_FAILED_WINDOW_SECONDS", "300"))
    AUTH_LOCKOUT_SECONDS: int = int(os.getenv("AUTH_LOCKOUT_SECONDS", "900"))

    # CORS settings
    DEFAULT_CORS_ORIGINS: ClassVar[List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",
        "http://0.0.0.0:3000",
    ]
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "")
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_HEADERS: List[str] = [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ]
    CORS_MAX_AGE: int = 3600
    CACHE_PREFIX: str = os.getenv("CACHE_PREFIX", "{{PROJECT_NAME}}-cache")

    # OAuth provider settings
    OAUTH_REDIRECT_BASE: str = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:8000/api/v1/auth/oauth")
    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str | None = os.getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID: str | None = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: str | None = os.getenv("GITHUB_CLIENT_SECRET")
    OAUTH_POST_LOGIN_URL: str = os.getenv("OAUTH_POST_LOGIN_URL", "http://localhost:3000/dashboard")

    WEAK_VALUES: ClassVar[Set[str]] = {
        "",
        "password",
        "changeme",
        "admin",
        "secret",
        "fallback-secret-key",
        "dev-secret-key-change-in-production",
        "dev-jwt-secret-key-change-in-production",
    }

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @staticmethod
    def _is_placeholder(value: str) -> bool:
        return "{{" in value and "}}" in value

    def _is_weak(self, value: str) -> bool:
        return value.strip().lower() in self.WEAK_VALUES

    @property
    def DATABASE_URL(self) -> str:
        if self.is_production:
            try:
                param_url = parameter_store.get_database_url()
                if param_url and param_url.strip():
                    return param_url
            except Exception:
                pass

            env_database_url = os.getenv("DATABASE_URL", "").strip()
            if env_database_url:
                return env_database_url

        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def REDIS_URL(self) -> str:
        if self.is_production:
            try:
                param_url = parameter_store.get_redis_url()
                if param_url and param_url.strip():
                    return param_url
            except Exception:
                pass
            return os.getenv("REDIS_URL", "").strip()
        return os.getenv("REDIS_URL", "redis://redis:6379/0").strip()

    @property
    def SECRET_KEY(self) -> str:
        if self.is_production:
            try:
                param_secret = parameter_store.get_secret_key()
                if param_secret and param_secret.strip():
                    return param_secret.strip()
            except Exception:
                pass
            return os.getenv("SECRET_KEY", "").strip()

        return os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-me").strip()

    @property
    def CORS_ORIGINS_RESOLVED(self) -> List[str]:
        raw = self.CORS_ORIGINS_RAW.strip()
        if raw:
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        if self.is_production:
            return []
        return self.DEFAULT_CORS_ORIGINS

    def validate_production_settings(self) -> None:
        if not self.is_production:
            return

        errors: List[str] = []
        secret_key = self.SECRET_KEY
        admin_password = self.ADMIN_PASSWORD.strip()
        postgres_password = self.POSTGRES_PASSWORD.strip()
        cors_origins = self.CORS_ORIGINS_RESOLVED

        if self.DEBUG:
            errors.append("DEBUG must be false in production.")

        if not secret_key or self._is_placeholder(secret_key) or self._is_weak(secret_key):
            errors.append("SECRET_KEY is missing or weak.")
        elif len(secret_key) < 32:
            errors.append("SECRET_KEY must be at least 32 characters.")

        if self._is_placeholder(self.ADMIN_EMAIL) or "@" not in self.ADMIN_EMAIL:
            errors.append("ADMIN_EMAIL must be set to a real value in production.")

        if not admin_password or self._is_placeholder(admin_password) or self._is_weak(admin_password):
            errors.append("ADMIN_PASSWORD is missing or weak.")
        elif len(admin_password) < 12:
            errors.append("ADMIN_PASSWORD must be at least 12 characters.")

        if (
            not postgres_password
            or self._is_placeholder(postgres_password)
            or self._is_weak(postgres_password)
            or len(postgres_password) < 12
        ):
            errors.append("POSTGRES_PASSWORD must be set and at least 12 characters.")

        if not self.REDIS_URL:
            errors.append("REDIS_URL must be set in production.")

        if not cors_origins:
            errors.append("CORS_ORIGINS must be explicitly set in production.")
        else:
            invalid_fragments = ("localhost", "127.0.0.1", "0.0.0.0", "*")
            for origin in cors_origins:
                if any(fragment in origin for fragment in invalid_fragments):
                    errors.append(f"CORS origin is not production-safe: {origin}")

        if errors:
            joined = "\n- ".join(errors)
            raise RuntimeError(f"Invalid production configuration:\n- {joined}")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
