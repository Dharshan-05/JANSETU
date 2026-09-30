# ==============================================================================
# JANSETU: Production Cloud Run & Docker Container
# Multi-stage Python 3.11-slim image with non-root security and dynamic $PORT
# ==============================================================================

# Stage 1: Build & Dependencies
FROM python:3.11-slim as builder

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install -r requirements.txt

# Stage 2: Minimal Runtime Container
FROM python:3.11-slim as runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Security: Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app -s /sbin/nologin appuser

# Copy installed dependencies from builder
COPY --from=builder /install /usr/local

# Copy application source code
COPY backend/app ./app
COPY pipelines ./pipelines
COPY frontend/dist ./frontend/dist

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Cloud Run binds to 0.0.0.0:$PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
