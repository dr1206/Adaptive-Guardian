from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        protected_namespaces=("settings_",),
        extra="ignore",
    )

    # App
    app_name: str = "AdaptiveGuard"
    debug: bool = False
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://localhost:8081", "http://127.0.0.1:8080", "http://127.0.0.1:5173"],
        alias="CORS_ORIGINS",
    )

    # MongoDB Atlas
    mongodb_uri: str = "mongodb+srv://cluster0.example.mongodb.net"
    mongodb_db_name: str = "adaptive_guardian"

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


settings = Settings()
