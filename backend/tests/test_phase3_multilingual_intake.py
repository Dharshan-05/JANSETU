import io
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime
from unittest.mock import patch, AsyncMock

from app.main import app
from app.config import settings
from app.core.exceptions import JanSetuException
from app.core.languages import (
    LANGUAGE_REGISTRY,
    normalize_language_code,
    is_supported_language,
    list_supported_languages,
    get_language
)
from app.services.stt_service import stt_service, STTResult
from app.services.translation_service import translation_service, TranslationResult
from app.services.citizen_intake_service import citizen_intake_service
from app.services.pubsub_service import pubsub_service
from app.services.storage_service import storage_service
from app.db.bigquery_client import citizen_request_repo, geography_repo

@pytest.mark.asyncio
async def test_01_languages_endpoint():
    """Verify GET /api/v1/intake/languages returns supported Indian languages."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/intake/languages")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    codes = [item["code"] for item in data]
    assert "ta-IN" in codes
    assert "hi-IN" in codes
    assert "te-IN" in codes
    assert "en-IN" in codes

    ta = next(item for item in data if item["code"] == "ta-IN")
    assert ta["name"] == "Tamil"
    assert ta["native_name"] == "தமிழ்"
    assert ta["chirp_supported"] is True
    assert ta["translation_supported"] is True

@pytest.mark.asyncio
async def test_02_text_intake_tamil():
    """Verify text intake in Tamil (ta-IN)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "எங்கள் கிராமத்திற்கு மாலை 7 மணிக்கு பிறகு பேருந்து வசதி இல்லை, பள்ளி மாணவர்கள் மிகவும் சிரமப்படுகின்றனர்.",
            "language": "ta-IN",
            "channel": "text_web",
            "geo_id": "IND_TN_DHM_HRR"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["request_id"].startswith("REQ-TEXT-")
    assert data["status"] == "PROCESSED"
    assert "பேருந்து" in data["original_text"]
    assert "bus" in data["english_translation"].lower()
    assert data["detected_language"] == "ta"

@pytest.mark.asyncio
async def test_03_text_intake_hindi():
    """Verify text intake in Hindi (hi-IN)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "हमारे ब्लॉक में पिछले तीन हफ्तों से पीने के पानी की आपूर्ति पूरी तरह ठप है, अस्पताल और बच्चे परेशान हैं।",
            "language": "hi-IN",
            "channel": "text_web",
            "geo_id": "IND_UP_VAR_PND"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["detected_language"] == "hi"
    assert "पानी" in data["original_text"]
    assert "water" in data["english_translation"].lower()

@pytest.mark.asyncio
async def test_04_text_intake_telugu():
    """Verify text intake in Telugu (te-IN)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "మా గ్రామంలో ప్రాథమిక ఆరోగ్య కేంద్రంలో వైద్యులు అందుబాటులో లేరు, అత్యవసర సమయాల్లో తీవ్ర ఇబ్బందులు పడుతున్నాము.",
            "language": "te-IN",
            "channel": "text_web",
            "geo_id": "IND_TG_MBN_JDC"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["detected_language"] == "te"
    assert "ఆరోగ్య" in data["original_text"]
    assert "doctor" in data["english_translation"].lower() or "health" in data["english_translation"].lower()

@pytest.mark.asyncio
async def test_05_text_intake_english():
    """Verify text intake in English (en-IN)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "The primary arterial connecting road between our panchayat and the state highway has severe crater-sized potholes.",
            "language": "en-IN",
            "channel": "text_web",
            "geo_id": "IND_TN_DHM_HRR"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["detected_language"] == "en"
    assert data["english_translation"] == payload["text"]

@pytest.mark.asyncio
async def test_06_text_intake_unsupported_language():
    """Verify unsupported language code rejection."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "Bonjour, ceci est un test non supporte.",
            "language": "fr-FR",
            "channel": "text_web"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 400
    res = response.json()
    assert "error" in res
    assert res["error"]["code"] == "UNSUPPORTED_LANGUAGE"

@pytest.mark.asyncio
async def test_07_text_intake_empty_text():
    """Verify empty text submission rejection."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test 1: Completely empty string (pydantic min_length catches 422)
        payload = {"text": "", "language": "en-IN"}
        res1 = await ac.post("/api/v1/intake/text", json=payload)
        assert res1.status_code == 422

        # Test 2: Whitespace only (service validation catches 400)
        payload2 = {"text": "   ", "language": "en-IN"}
        res2 = await ac.post("/api/v1/intake/text", json=payload2)
        assert res2.status_code == 400
        assert res2.json()["error"]["code"] == "EMPTY_INPUT_TEXT"

@pytest.mark.asyncio
async def test_08_text_intake_excessively_long_text():
    """Verify excessively long text rejection."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "A" * 6000,
            "language": "en-IN"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_09_voice_intake_valid_wav():
    """Verify voice intake with valid WAV audio."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dummy_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        files = {"audio_file": ("recording.wav", dummy_audio, "audio/wav")}
        data = {
            "declared_language": "ta-IN",
            "source_channel": "voice_web",
            "geo_id": "IND_TN_DHM_HRR"
        }
        response = await ac.post("/api/v1/intake/voice", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["request_id"].startswith("REQ-VOICE-")
    assert data["status"] == "PROCESSED"
    assert data["detected_language"] == "ta"

@pytest.mark.asyncio
async def test_10_voice_intake_valid_webm():
    """Verify voice intake with valid WebM audio."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dummy_audio = io.BytesIO(b"\x1a\x45\xdf\xa3dummywebmheaderanddata")
        files = {"audio_file": ("recording.webm", dummy_audio, "audio/webm")}
        data = {
            "declared_language": "hi-IN",
            "source_channel": "voice_web",
            "geo_id": "IND_UP_VAR_PND"
        }
        response = await ac.post("/api/v1/intake/voice", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["detected_language"] == "hi"

@pytest.mark.asyncio
async def test_11_voice_intake_unsupported_format():
    """Verify unsupported audio format rejection."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dummy_file = io.BytesIO(b"\x89PNG\r\n\x1a\nfakeimagebytes")
        files = {"audio_file": ("screenshot.png", dummy_file, "image/png")}
        data = {"declared_language": "en-IN"}
        response = await ac.post("/api/v1/intake/voice", files=files, data=data)
    assert response.status_code == 400
    res = response.json()
    assert "error" in res
    assert res["error"]["code"] == "UNSUPPORTED_AUDIO_FORMAT"

@pytest.mark.asyncio
async def test_12_voice_intake_oversized_audio():
    """Verify rejection of oversized audio files (> 25MB)."""
    with pytest.raises(JanSetuException) as excinfo:
        citizen_intake_service.validate_audio_payload(
            filename="large_recording.wav",
            content_type="audio/wav",
            size_bytes=26 * 1024 * 1024  # 26 MB
        )
    assert excinfo.value.code == "AUDIO_FILE_TOO_LARGE"
    assert excinfo.value.status_code == 400

@pytest.mark.asyncio
async def test_13_voice_intake_unsupported_language():
    """Verify unsupported language in voice intake is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        dummy_audio = io.BytesIO(b"RIFFdummydata")
        files = {"audio_file": ("voice.wav", dummy_audio, "audio/wav")}
        data = {"declared_language": "es-ES"}
        response = await ac.post("/api/v1/intake/voice", files=files, data=data)
    assert response.status_code == 400
    res = response.json()
    assert res["error"]["code"] == "UNSUPPORTED_LANGUAGE"

@pytest.mark.asyncio
async def test_14_mocked_stt_success_flow():
    """Verify STT service transcribe method returns structured STTResult."""
    result = await stt_service.transcribe(
        audio_data=b"dummy_pcm_bytes",
        language_code="ta-IN",
        request_id="REQ-TEST-001"
    )
    assert isinstance(result, STTResult)
    assert result.request_id == "REQ-TEST-001"
    assert result.language_code == "ta-IN"
    assert len(result.transcript) > 0
    assert result.confidence is not None
    assert result.confidence >= 0.9

@pytest.mark.asyncio
async def test_15_mocked_stt_unsupported_language_flow():
    """Verify STT service handles unsupported language properly."""
    with pytest.raises(JanSetuException) as excinfo:
        await stt_service.transcribe(
            audio_data=b"dummy_audio",
            language_code="de-DE"
        )
    assert excinfo.value.code == "UNSUPPORTED_LANGUAGE"

@pytest.mark.asyncio
async def test_16_mocked_translation_success_flow():
    """Verify Translation service translates Tamil vernacular to English."""
    result = await translation_service.translate(
        text="எங்கள் கிராமத்திற்கு மாலை நேரத்தில் பேருந்து வசதி இல்லை",
        source_language="ta-IN"
    )
    assert isinstance(result, TranslationResult)
    assert result.translation_status == "SUCCESS"
    assert "bus" in result.normalized_text.lower()
    assert result.source_language == "ta-IN"

@pytest.mark.asyncio
async def test_17_mocked_translation_failure_resilience():
    """Verify translation error preserves original text without breaking intake pipeline."""
    with patch.object(translation_service, "translate", new_callable=AsyncMock) as mock_trans:
        mock_trans.return_value = TranslationResult(
            original_text="பாதை சேதமடைந்துள்ளது",
            normalized_text="பாதை சேதமடைந்துள்ளது",
            source_language="ta-IN",
            target_language="en",
            translation_status="FAILED",
            error_message="Simulated Translation API Timeout"
        )

        intake_res = await citizen_intake_service.process_text_input(
            text="பாதை சேதமடைந்துள்ளது",
            language="ta-IN"
        )
        assert intake_res["status"] == "TRANSLATION_FAILED"
        assert intake_res["original_transcript"] == "பாதை சேதமடைந்துள்ளது"
        # Verify saved in BigQuery store
        stored = citizen_request_repo.get_by_id(intake_res["request_id"])
        assert stored is not None
        assert stored["processing_status"] == "TRANSLATION_FAILED"

@pytest.mark.asyncio
async def test_18_pii_sanitization_text():
    """Verify phone numbers and email addresses are scrubbed from citizen submissions."""
    text_with_pii = (
        "Contact me at +91 9876543210 or 9123456789. "
        "Also email citizen.complaint@gmail.com about the broken transformer."
    )
    sanitized = citizen_intake_service.sanitize_pii(text_with_pii)
    assert "+91 9876543210" not in sanitized
    assert "9123456789" not in sanitized
    assert "citizen.complaint@gmail.com" not in sanitized
    assert "[REDACTED_PHONE]" in sanitized
    assert "[REDACTED_EMAIL]" in sanitized

@pytest.mark.asyncio
async def test_19_pii_sanitization_in_intake_pipeline():
    """Verify PII is scrubbed before saving into BigQuery."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "Call me at +919876543210 regarding the road repair in Dharmapuri.",
            "language": "en-IN"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 200
    res = response.json()
    req_id = res["data"]["request_id"]
    stored = citizen_request_repo.get_by_id(req_id)
    assert stored is not None
    assert "+919876543210" not in stored["original_transcript"]
    assert "[REDACTED_PHONE]" in stored["original_transcript"]

@pytest.mark.asyncio
async def test_20_geo_id_association():
    """Verify valid geo_id is preserved and attached to the citizen request."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "Bridge construction across the stream has halted.",
            "language": "en-IN",
            "geo_id": "IND_TN_DHM_HRR"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["data"]["matched_geo_id"] == "IND_TN_DHM_HRR"

@pytest.mark.asyncio
async def test_21_invalid_geo_id_handling():
    """Verify invalid geo_id raises a clean 400 exception."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "text": "Water pipeline leakage.",
            "language": "en-IN",
            "geo_id": "NON_EXISTENT_GEO_9999"
        }
        response = await ac.post("/api/v1/intake/text", json=payload)
    assert response.status_code == 400
    res = response.json()
    assert res["error"]["code"] == "INVALID_GEO_ID"

@pytest.mark.asyncio
async def test_22_bigquery_persistence_verification():
    """Verify canonical columns are written to BigQuery repository."""
    intake_res = await citizen_intake_service.process_text_input(
        text="The primary school building has a leaky roof during monsoons.",
        language="en-IN",
        geo_id="IND_TN_DHM_HRR",
        channel="mobile_app"
    )
    req_id = intake_res["request_id"]
    stored = citizen_request_repo.get_by_id(req_id)
    assert stored is not None
    assert stored["request_id"] == req_id
    assert stored["geo_id"] == "IND_TN_DHM_HRR"
    assert stored["channel"] == "mobile_app"
    assert stored["language"] == "en-IN"
    assert stored["original_transcript"] == "The primary school building has a leaky roof during monsoons."
    assert stored["normalized_text"] == "The primary school building has a leaky roof during monsoons."
    assert stored["processing_status"] == "NORMALIZED"

@pytest.mark.asyncio
async def test_23_pubsub_event_broadcast():
    """Verify Pub/Sub event is broadcast upon citizen request creation."""
    with patch.object(pubsub_service, "publish_event", return_value=True) as mock_pubsub:
        intake_res = await citizen_intake_service.process_text_input(
            text="Need streetlights installed along the village road.",
            language="en-IN"
        )
        assert mock_pubsub.called
        call_kwargs = mock_pubsub.call_args[1]
        event_data = call_kwargs.get("data") or call_kwargs.get("payload")
        assert event_data["event_type"] == "citizen.request.created"
        assert event_data["request_id"] == intake_res["request_id"]

@pytest.mark.asyncio
async def test_24_audio_gcs_uri_structure():
    """Verify audio uploaded to GCS follows deterministic date/request_id path."""
    intake_res = await citizen_intake_service.process_voice_input(
        audio_bytes=b"RIFFtestbytes",
        filename="complaint.wav",
        content_type="audio/wav",
        language="ta-IN",
        geo_id="IND_TN_DHM_HRR"
    )
    req_id = intake_res["request_id"]
    audio_uri = intake_res["audio_gcs_uri"]
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    expected_prefix = f"gs://{settings.GCS_BUCKET}/audio/{today_str}/{req_id}"
    assert audio_uri.startswith(expected_prefix)
    assert audio_uri.endswith(".wav")

@pytest.mark.asyncio
async def test_25_request_status_endpoint():
    """Verify GET /api/v1/intake/{request_id} returns accurate status."""
    intake_res = await citizen_intake_service.process_text_input(
        text="Drainage overflow in ward 4.",
        language="en-IN",
        geo_id="IND_TN_DHM_HRR"
    )
    req_id = intake_res["request_id"]

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/intake/{req_id}")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["request_id"] == req_id
    assert data["status"] == "NORMALIZED"
    assert data["language"] == "en-IN"
    assert data["geo_id"] == "IND_TN_DHM_HRR"
    assert data["original_transcript"] == "Drainage overflow in ward 4."

@pytest.mark.asyncio
async def test_26_request_status_not_found():
    """Verify GET /api/v1/intake/{request_id} returns 404 for non-existent IDs."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/intake/REQ-NONEXISTENT-99999")
    assert response.status_code == 404
    res = response.json()
    assert "error" in res
    assert res["error"]["code"] == "NOT_FOUND"
