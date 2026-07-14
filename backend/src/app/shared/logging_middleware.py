"""Request logging middleware — correlation IDs and structured request/response logging."""

from __future__ import annotations

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("adaptive_guardian.http")

_CORRELATION_HEADER = "X-Correlation-Id"


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        correlation_id = request.headers.get(_CORRELATION_HEADER) or str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        start = time.monotonic()
        response = await call_next(request)
        elapsed_ms = round((time.monotonic() - start) * 1000, 2)

        response.headers[_CORRELATION_HEADER] = correlation_id

        logger.info(
            "%s %s %s %s %sms",
            request.method,
            request.url.path,
            response.status_code,
            correlation_id,
            elapsed_ms,
        )

        return response
