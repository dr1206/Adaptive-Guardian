# Stage 1 — Builder
FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

COPY pyproject.toml .
RUN pip install --no-cache-dir \
    fastapi "uvicorn[standard]" motor beanie redis pydantic pydantic-settings \
    "python-jose[cryptography]" "passlib[bcrypt]" python-multipart \
    prometheus-fastapi-instrumentator httpx \
    numpy scikit-learn lightgbm shap joblib imbalanced-learn pandas

# Stage 2 — Production
FROM python:3.11-slim

WORKDIR /app

RUN groupadd -r guardian && useradd -r -g guardian guardian

RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY src/ src/

RUN chown -R guardian:guardian /app
USER guardian

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -sf http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
