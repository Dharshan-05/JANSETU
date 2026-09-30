import pytest
import io
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "JANSETU AI Civic Infrastructure Intelligence Grid"
    assert data["status"] in ["ok", "OPERATIONAL"]

@pytest.mark.asyncio
async def test_ui_static_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/ui/")
    assert response.status_code == 200
    assert "JANSETU" in response.text

@pytest.mark.asyncio
async def test_text_intake_tamil():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "எங்கள் கிராமத்திற்கு மாலை 7 மணிக்கு பிறகு பேருந்து வசதி இல்லை, பள்ளி மாணவர்கள் மிகவும் சிரமப்படுகின்றனர்.",
            "detected_language": "ta",
            "source_channel": "text_web",
            "declared_state": "Tamil Nadu",
            "declared_district": "Dharmapuri"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["detected_language"] == "ta"
    assert data["extraction"]["primary_category"] in ["transport", "roads"]
    assert data["extraction"]["severity"] >= 3
    assert data["assigned_cluster_id"] is not None

@pytest.mark.asyncio
async def test_voice_intake_synthetic():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dummy_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....fakeaudiobytes")
        files = {"audio_file": ("test.wav", dummy_audio, "audio/wav")}
        data = {
            "declared_language": "ta",
            "source_channel": "voice_web",
            "declared_state": "Tamil Nadu",
            "declared_district": "Dharmapuri"
        }
        response = await ac.post("/api/v1/intake/voice", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["status"] == "PROCESSED"
    assert res["data"]["extraction"]["affected_group"] == "students"
