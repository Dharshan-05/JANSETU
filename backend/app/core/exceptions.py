from fastapi import HTTPException, status
from typing import Optional, Dict, Any

class JanSetuException(HTTPException):
    """Base exception for all JANSETU application errors."""
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        code: str = "INTERNAL_ERROR",
        message: str = "An unexpected error occurred"
    ):
        self.code = code
        self.message = message
        super().__init__(
            status_code=status_code,
            detail={"error": {"code": self.code, "message": self.message}}
        )

class ServiceUnavailableException(JanSetuException):
    def __init__(self, message: str = "Required service is unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="SERVICE_UNAVAILABLE",
            message=message
        )

class UnauthorizedException(JanSetuException):
    def __init__(self, message: str = "Authentication credentials are invalid or missing"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message
        )

class ForbiddenException(JanSetuException):
    def __init__(self, message: str = "User does not have permission to perform this action"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message
        )

class ResourceNotFoundException(JanSetuException):
    def __init__(self, resource: str = "Resource", identifier: Optional[str] = None):
        msg = f"{resource} with identifier '{identifier}' was not found" if identifier else f"{resource} not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=msg
        )

class GeoNotFoundException(ResourceNotFoundException):
    def __init__(self, geo_id: str):
        super().__init__(resource="Administrative region", identifier=geo_id)

class SignalNotFoundException(ResourceNotFoundException):
    def __init__(self, signal_id: str):
        super().__init__(resource="Signal", identifier=signal_id)

class ValidationException(JanSetuException):
    def __init__(self, message: str = "Invalid input data"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message=message
        )

def format_error_response(code: str, message: str) -> Dict[str, Any]:
    """Helper for consistent standardized JSON error payloads."""
    return {
        "error": {
            "code": code,
            "message": message
        }
    }
