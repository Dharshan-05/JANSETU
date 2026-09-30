import logging
import json
import sys
import time
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.config import settings

class CloudLoggingFormatter(logging.Formatter):
    """
    Formats log records as structured JSON compliant with Google Cloud Logging.
    Maps Python logging levels to Google Cloud log severities:
    DEBUG, INFO, WARNING, ERROR, CRITICAL.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "severity": record.levelname,
            "service": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "line": record.lineno
        }
        # Add custom structured attributes if provided
        for key in ["request_path", "http_method", "status_code", "latency_ms", "trace_id"]:
            if hasattr(record, key):
                log_entry[key] = getattr(record, key)
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

def setup_logging():
    logger = logging.getLogger("jansetu")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(CloudLoggingFormatter())
        logger.addHandler(handler)
    logger.propagate = False
    return logger

logger = setup_logging()

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that records HTTP method, request path, status code,
    and latency for every request while guaranteeing no sensitive tokens/headers are logged.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        path = request.url.path
        method = request.method

        # Filter out health checks from verbose spamming if needed, or log at debug level
        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            # Log structured audit entry
            extra = {
                "request_path": path,
                "http_method": method,
                "status_code": response.status_code,
                "latency_ms": duration_ms
            }
            logger.info(
                f"{method} {path} - {response.status_code} ({duration_ms}ms)",
                extra=extra
            )
            return response
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled error in {method} {path}: {str(exc)}",
                extra={
                    "request_path": path,
                    "http_method": method,
                    "status_code": 500,
                    "latency_ms": duration_ms
                },
                exc_info=True
            )
            raise exc
