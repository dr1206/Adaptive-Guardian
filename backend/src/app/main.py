from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.errors import register_exception_handlers
from app.api.v1.router import api_router
from app.config import settings
from app.db.mongodb import close_db, init_db
from app.db.redis import close_redis, get_redis
from app.shared.logging_middleware import RequestLoggingMiddleware
from app.shared.middleware import SecurityHeadersMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — initializing MongoDB...")
    try:
        await init_db()
        logger.info("MongoDB initialized")
    except Exception as exc:
        logger.warning("MongoDB unavailable during startup: %s", exc)
        logger.warning("Continuing without database connectivity")

    # Seed default admin user if none exists
    try:
        from app.domain.auth import repository as auth_repo
        from app.domain.auth.security import hash_password

        if not await auth_repo.any_admin_exists():
            await auth_repo.seed_admin_user(
                email=settings.default_admin_email,
                password_hash=hash_password(settings.default_admin_password),
                full_name="Platform Admin",
            )
            logger.info("Default admin user seeded: %s", settings.default_admin_email)
    except Exception as exc:
        logger.warning("Could not seed admin user: %s", exc)

    yield
    logger.info("Shutting down...")
    await close_db()
    await close_redis()
    logger.info("Shut down complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/api/docs" if settings.debug else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )

    # Middleware — outermost wraps innermost
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Correlation-Id"],
    )

    register_exception_handlers(app)

    Instrumentator().instrument(app).expose(app, endpoint="/metrics")

    app.include_router(api_router, prefix="/api/v1")

    # ── Health / Readiness ─────────────────────────────────────

    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok", "version": "0.1.0"}

    @app.get("/api/v1/health/ready")
    async def ready():
        checks: dict[str, str] = {}
        healthy = True

        # MongoDB
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)
            await client.admin.command("ping")
            client.close()
            checks["mongodb"] = "connected"
        except Exception as exc:
            checks["mongodb"] = f"unreachable: {exc}"
            healthy = False

        # Redis
        try:
            redis = await get_redis()
            await redis.ping()
            checks["redis"] = "connected"
        except Exception:
            checks["redis"] = "unreachable"
            healthy = False

        status_code = 200 if healthy else 503
        return JSONResponse(
            {"status": "ready" if healthy else "not ready", "checks": checks},
            status_code=status_code,
        )

    return app


app = create_app()
