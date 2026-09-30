import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings
from app.db.bigquery_client import db
from app.services.pubsub_service import pubsub_service
from app.services.storage_service import storage_service
from app.core.security import get_current_user
from app.core.exceptions import UnauthorizedException

@pytest.mark.asyncio
async def test_root_endpoint():
    """1. Root endpoint: Identifies JANSETU, service, version, and status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "JANSETU"
    assert data["service"] == "AI Civic Infrastructure Intelligence Grid"
    assert data["version"] == "0.1.0"
    assert data["status"] == "ok"

@pytest.mark.asyncio
async def test_healthz_endpoint():
    """2. Health endpoint: Liveness check."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_readyz_endpoint():
    """3. Readiness endpoint: Infrastructure dependencies check."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/readyz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["services"]["bigquery"] == "ok"
    assert data["services"]["pubsub"] == "ok"
    assert data["services"]["storage"] == "ok"

@pytest.mark.asyncio
async def test_api_v1_version_endpoint():
    """4. API v1 version endpoint under /api/v1 namespace."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "v1"
    assert data["status"] == "active"
    assert "PHASE 1" in data["phase"]

def test_configuration_loading():
    """5. Configuration loading from typed settings."""
    assert settings.APP_NAME == "JANSETU"
    assert settings.GCP_PROJECT_ID is not None
    assert settings.BIGQUERY_DATASET is not None
    assert settings.PUBSUB_TOPIC is not None
    assert settings.GCS_BUCKET is not None
    assert settings.GCP_REGION == "asia-south1"

@pytest.mark.asyncio
async def test_cors_configuration():
    """6. CORS configuration verification."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.options("/healthz", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

@pytest.mark.asyncio
async def test_firebase_auth_dependency_success():
    """7. Firebase auth dependency: Valid mock token verification."""
    user = await get_current_user("Bearer test-token-citizen")
    assert user["uid"] == "usr_citizen_001"
    assert user["role"] == "citizen"

@pytest.mark.asyncio
async def test_firebase_auth_dependency_invalid():
    """7. Firebase auth dependency: Invalid token raises UnauthorizedException."""
    with pytest.raises(UnauthorizedException):
        await get_current_user("Bearer invalid-malformed-token")

@pytest.mark.asyncio
async def test_firebase_auth_dependency_missing():
    """7. Firebase auth dependency: Missing authorization header raises UnauthorizedException."""
    with pytest.raises(UnauthorizedException):
        await get_current_user(None)

def test_bigquery_client_abstraction():
    """8. BigQuery client initialization and query abstraction."""
    assert db.check_connectivity() is True
    # Test query execution
    rows = db.execute_query("SELECT 1 as test_col")
    assert isinstance(rows, list)
    # Test insertion and retrieval
    success = db.insert_records("geography", [{"geo_id": "TEST_GEO_01", "name": "Test Block"}])
    assert success is True
    records = db.get_records("geography")
    assert any(r.get("geo_id") == "TEST_GEO_01" for r in records)

def test_pubsub_service_abstraction():
    """9. Pub/Sub client initialization and event publishing."""
    assert pubsub_service.check_connectivity() is True
    msg_id = pubsub_service.publish_event(
        data={"event_type": "CITIZEN_VOICE_INGESTED", "payload": "sample"},
        attributes={"source": "test"}
    )
    assert msg_id is not None
    messages = pubsub_service.get_published_messages()
    assert len(messages) >= 1

def test_storage_service_abstraction():
    """10. Cloud Storage client initialization, upload, metadata, delete."""
    assert storage_service.check_connectivity() is True
    test_blob = "test_audio/sample.wav"
    test_data = b"RIFFfakeaudiodata"
    
    # Upload
    path = storage_service.upload_object(test_blob, test_data, content_type="audio/wav")
    assert path.startswith("gs://")
    assert test_blob in path
    
    # Metadata
    meta = storage_service.retrieve_metadata(test_blob)
    assert meta is not None
    assert meta["size"] == len(test_data)
    
    # Delete
    deleted = storage_service.delete_object(test_blob)
    assert deleted is True
    assert storage_service.retrieve_metadata(test_blob) is None

@pytest.mark.asyncio
async def test_centralized_error_handling():
    """11. Centralized error handling returns consistent JSON error format."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/non-existent-endpoint-404")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]
