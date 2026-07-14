from __future__ import annotations

from fastapi import APIRouter

from app.domain.admin.router import router as admin_router
from app.domain.aegis.router import events_router, router as aegis_router
from app.domain.audit.router import router as audit_router
from app.domain.auth.router import router as auth_router
from app.domain.banking.router import router as banking_router
from app.domain.dashboard.router import router as dashboard_router
from app.domain.notifications.router import router as notifications_router
from app.domain.security.router import router as security_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(aegis_router)
api_router.include_router(events_router)
api_router.include_router(banking_router)
api_router.include_router(admin_router)
api_router.include_router(dashboard_router)
api_router.include_router(security_router)
api_router.include_router(notifications_router)
api_router.include_router(audit_router)
