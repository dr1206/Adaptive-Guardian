from __future__ import annotations

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        protected_namespaces=("settings_",),
        extra="ignore",
    )

    # App
    app_name: str = "AdaptiveGuard"
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = False
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:8081",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:5173",
            "https://adaptive-guardian-woad.vercel.app",
            "https://adaptive-guardian-diuz.onrender.com",
        ],
        alias="CORS_ORIGINS",
    )

    # Database
    mongodb_uri: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")
    mongodb_db_name: str = Field(default="adaptive_guardian", alias="MONGODB_DB_NAME")

    # Redis
    redis_uri: str = "redis://localhost:6379"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "guardian-models"
    minio_secure: bool = False

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 120
    refresh_token_ttl_days: int = 7

    # OTP
    otp_ttl_seconds: int = 300
    otp_max_attempts: int = 3
    otp_length: int = 6

    # Password Reset
    password_reset_ttl_seconds: int = 900
    password_min_length: int = 12

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # ML
    ml_enabled: bool = False
    model_bucket: str = "guardian-models"
    threshold_allow: float = 0.85
    threshold_warn: float = 0.60

    # Frontend/Vite feature flags (optional, ignored by backend if absent)
    vite_use_real_api: bool = False
    vite_behavioral_export: bool = False

    # Default admin (seeded on first startup if no admin exists)
    default_admin_email: str = "admin@adaptiveguard.ai"
    default_admin_password: str = "Admin@1234567890"

    # Email (dev: Mailpit)
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    email_from: str = "noreply@adaptiveguard.ai"

    @model_validator(mode="after")
    def validate_production_security(self) -> Self:
        if self.app_env.lower() in ("production", "prod"):
            insecure_jwt = (
                "dev-secret-change-in-production",
                "dev-secret-change-in-production-local-dev-only-do-not-use-in-prod",
            )
            if self.jwt_secret in insecure_jwt or len(self.jwt_secret) < 32:
                raise ValueError("FATAL: Insecure JWT_SECRET configured for production.")
            if "localhost" in self.mongodb_uri or "127.0.0.1" in self.mongodb_uri:
                raise ValueError("FATAL: Insecure localhost MONGODB_URI configured for production.")
            if self.default_admin_password == "Admin@1234567890":
                raise ValueError("FATAL: Default weak admin password configured for production.")
            if self.debug:
                raise ValueError("FATAL: DEBUG cannot be true in production.")
        return self


settings = Settings()
