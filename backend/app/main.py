import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles

# Ensure root is in sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from app.config import settings
from app.core.logging import logger, StructuredLoggingMiddleware
from app.core.exceptions import JanSetuException, format_error_response
from app.api.v1.router import api_v1_router
from app.db.bigquery_client import db
from app.services.pubsub_service import pubsub_service
from app.services.storage_service import storage_service
from pipelines.seed_india_data import seed_india_pilot_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} ({settings.APP_VERSION}) in [{settings.ENVIRONMENT}] mode...")
    # Initialize seed datasets if datastore empty
    if not db.get_records("geography"):
        seed_india_pilot_data()
    yield
    logger.info("Graceful shutdown of JANSETU backend service.")

app = FastAPI(
    title=settings.APP_NAME,
    description="JANSETU: AI Civic Infrastructure Intelligence Grid — Digital Public Good Foundation",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Structured Logging Middleware
app.add_middleware(StructuredLoggingMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# CENTRALIZED ERROR HANDLERS (Standardized JSON error envelope)
# =============================================================================

from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(JanSetuException)
async def jansetu_exception_handler(request: Request, exc: JanSetuException):
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(code=exc.code, message=exc.message)
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=format_error_response(code="VALIDATION_ERROR", message=str(exc))
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(code=code, message=str(exc.detail))
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error processing {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            code="INTERNAL_ERROR",
            message="An unexpected server error occurred. Please contact system administration."
        )
    )

# =============================================================================
# ROUTING & CORE ENDPOINTS
# =============================================================================

# Include API v1 Routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

# Mount Frontend Production UI if built
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/ui", StaticFiles(directory=str(frontend_dist), html=True), name="frontend_ui")

@app.get("/", tags=["Core"])
async def root():
    """Identifies JANSETU, API descriptor, and version."""
    return {
        "name": settings.APP_NAME,
        "service": settings.APP_SERVICE,
        "system": "JANSETU AI Civic Infrastructure Intelligence Grid",
        "version": settings.APP_VERSION,
        "status": "ok"
    }

@app.get("/healthz", tags=["Core"])
async def liveness_check():
    """Liveness probe for Cloud Run / Kubernetes."""
    return {
        "status": "ok"
    }

@app.get("/readyz", tags=["Core"])
async def readiness_check():
    """
    Readiness probe verifying connectivity to required cloud infrastructure:
    - BigQuery
    - Pub/Sub
    - Cloud Storage
    Returns HTTP 200 when ready, HTTP 503 when any dependency is unavailable.
    """
    bq_ok = db.check_connectivity()
    pubsub_ok = pubsub_service.check_connectivity()
    storage_ok = storage_service.check_connectivity()

    services_status = {
        "bigquery": "ok" if bq_ok else "error",
        "pubsub": "ok" if pubsub_ok else "error",
        "storage": "ok" if storage_ok else "error"
    }

    all_ready = bq_ok and pubsub_ok and storage_ok
    response_payload = {
        "status": "ready" if all_ready else "not_ready",
        "services": services_status
    }

    if not all_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response_payload
        )

    return response_payload
