from typing import Optional, Dict, Any
from fastapi import Header, Depends
from app.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.logging import logger

try:
    import firebase_admin
    from firebase_admin import auth, credentials
    HAS_FIREBASE_ADMIN = True
except ImportError:
    HAS_FIREBASE_ADMIN = False

# Firebase Admin App Singleton
_firebase_initialized = False

def initialize_firebase():
    global _firebase_initialized
    if not HAS_FIREBASE_ADMIN:
        logger.warning("firebase-admin package not available. Falling back to mock verification.")
        return False

    if not _firebase_initialized:
        try:
            if settings.FIREBASE_CREDENTIALS_PATH:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})
            else:
                # Use Application Default Credentials or Project ID
                firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            _firebase_initialized = True
            logger.info(f"Firebase Admin SDK initialized for project '{settings.FIREBASE_PROJECT_ID}'")
        except Exception as e:
            logger.warning(f"Could not initialize live Firebase Admin SDK: {e}. Mock auth enabled: {settings.FIREBASE_MOCK_AUTH}")
            _firebase_initialized = False
    return _firebase_initialized

# Initialize at startup
initialize_firebase()

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Reusable FastAPI authentication dependency.
    Validates Firebase ID token from the 'Authorization: Bearer <token>' header.
    Never trusts arbitrary client identity; claims are extracted from verified token.
    Prepares for roles: 'citizen', 'analyst', 'administrator'.
    """
    if not authorization:
        raise UnauthorizedException("Authorization header is missing")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Expected 'Bearer <token>'")

    token = parts[1].strip()

    # 1. Production / Live Firebase Token Verification
    if _firebase_initialized and not (settings.FIREBASE_MOCK_AUTH and token.startswith("test-token-")):
        try:
            decoded_token = auth.verify_id_token(token)
            # Standardize user dictionary
            return {
                "uid": decoded_token.get("uid"),
                "email": decoded_token.get("email"),
                "role": decoded_token.get("role", "citizen"),
                "auth_time": decoded_token.get("auth_time"),
                "is_verified": True
            }
        except Exception as e:
            logger.warning(f"Firebase token verification failed: {e}")
            raise UnauthorizedException("Invalid or expired Firebase ID token")

    # 2. Test / Development Mock Auth Handling
    if settings.FIREBASE_MOCK_AUTH:
        mock_tokens = {
            "test-token-citizen": {
                "uid": "usr_citizen_001",
                "email": "citizen@jansetu.gov.in",
                "role": "citizen",
                "is_verified": True
            },
            "test-token-analyst": {
                "uid": "usr_analyst_001",
                "email": "analyst@jansetu.gov.in",
                "role": "analyst",
                "is_verified": True
            },
            "test-token-administrator": {
                "uid": "usr_admin_001",
                "email": "admin@jansetu.gov.in",
                "role": "administrator",
                "is_verified": True
            }
        }
        if token in mock_tokens:
            return mock_tokens[token]

    raise UnauthorizedException("Invalid or unrecognized authentication token")

async def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Optional user authentication for public endpoints with enriched context when logged in."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except UnauthorizedException:
        return None
