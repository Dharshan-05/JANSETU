import uuid
import re
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import JanSetuException, ResourceNotFoundException
from app.core.languages import normalize_language_code, is_supported_language
from app.services.stt_service import stt_service, STTResult
from app.services.translation_service import translation_service, TranslationResult
from app.services.storage_service import storage_service
from app.services.pubsub_service import pubsub_service
from app.db.bigquery_client import citizen_request_repo, geography_repo
from pipelines.validation.validators import PHONE_REGEX, EMAIL_REGEX

# Permitted audio MIME types for citizen voice intake
ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/x-wav", "audio/wave",
    "audio/webm", "video/webm",
    "audio/ogg", "application/ogg",
    "audio/m4a", "audio/mp4", "audio/x-m4a",
    "audio/mpeg", "audio/mp3"
}

MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB

class CitizenIntakeService:
    """
    Orchestration service for the Multilingual Citizen Input Layer.
    Handles audio validation, Cloud Storage persistence, Chirp 2 Speech-to-Text,
    Translation Advanced v3 semantic normalization, PII scrubbing, BigQuery
    canonical persistence, and Pub/Sub event broadcasting.
    """

    def __init__(self):
        self.pubsub_topic = settings.PUBSUB_TOPIC

    def validate_audio_payload(self, filename: str, content_type: Optional[str], size_bytes: int) -> str:
        """Validates uploaded audio MIME type, extension, and file size."""
        if size_bytes == 0:
            raise JanSetuException(
                code="EMPTY_AUDIO_FILE",
                message="Uploaded audio recording is empty.",
                status_code=400
            )

        if size_bytes > MAX_AUDIO_BYTES:
            raise JanSetuException(
                code="AUDIO_FILE_TOO_LARGE",
                message=f"Audio file exceeds maximum allowed limit of {MAX_AUDIO_BYTES // (1024*1024)} MB.",
                status_code=400
            )

        # Normalize and validate content type
        normalized_mime = (content_type or "").lower().split(";")[0].strip()
        if normalized_mime not in ALLOWED_AUDIO_TYPES:
            # Fallback to extension check
            ext = filename.split(".")[-1].lower() if "." in filename else ""
            if ext not in ["wav", "webm", "ogg", "m4a", "mp3"]:
                raise JanSetuException(
                    code="UNSUPPORTED_AUDIO_FORMAT",
                    message=f"Audio format '{content_type}' is not supported. Please upload WAV, WebM, OGG, or M4A.",
                    status_code=400
                )
            return ext

        # Extract clean extension
        ext_map = {
            "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
            "audio/webm": "webm", "video/webm": "webm",
            "audio/ogg": "ogg", "application/ogg": "ogg",
            "audio/m4a": "m4a", "audio/mp4": "m4a", "audio/x-m4a": "m4a",
            "audio/mpeg": "mp3", "audio/mp3": "mp3"
        }
        return ext_map.get(normalized_mime, "wav")

    def sanitize_pii(self, text: str) -> str:
        """Sanitizes telephone numbers and email addresses from raw text."""
        sanitized = PHONE_REGEX.sub("[REDACTED_PHONE]", text)
        sanitized = EMAIL_REGEX.sub("[REDACTED_EMAIL]", sanitized)
        return sanitized

    def validate_geo_id(self, geo_id: Optional[str]) -> Optional[str]:
        """Validates that a provided geo_id exists in canonical geography dimension."""
        if not geo_id:
            return None
        clean_geo = geo_id.strip()
        node = geography_repo.get_by_geo_id(clean_geo)
        if not node:
            raise JanSetuException(
                code="INVALID_GEO_ID",
                message=f"Provided geographic identifier '{geo_id}' does not exist in administrative registry.",
                status_code=400
            )
        return clean_geo

    async def process_text_input(
        self,
        text: str,
        language: Optional[str] = None,
        geo_id: Optional[str] = None,
        channel: str = "text_web",
        user_id: Optional[str] = None,
        is_synthetic: bool = False
    ) -> Dict[str, Any]:
        """
        Processes citizen text input:
        Validation -> PII Scrubbing -> Translation -> BigQuery -> Pub/Sub
        """
        clean_text = text.strip()
        if not clean_text:
            raise JanSetuException(
                code="EMPTY_INPUT_TEXT",
                message="Citizen request text cannot be empty.",
                status_code=400
            )

        # 1. Validate language
        canonical_lang = normalize_language_code(language)
        if language and not is_supported_language(canonical_lang):
            raise JanSetuException(
                code="UNSUPPORTED_LANGUAGE",
                message=f"Language '{language}' is not supported.",
                status_code=400
            )

        # 2. Validate Geolocation
        resolved_geo_id = self.validate_geo_id(geo_id) or "IND_TN_DHM_HRR"

        # 3. PII Sanitization
        sanitized_transcript = self.sanitize_pii(clean_text)

        # 4. Translation & Semantic Normalization
        trans_res = await translation_service.translate(
            text=sanitized_transcript,
            source_language=canonical_lang
        )

        request_id = f"REQ-TEXT-{uuid.uuid4().hex[:8].upper()}"
        created_at = datetime.utcnow().isoformat()

        # 5. BigQuery Persistence
        canonical_record = {
            "request_id": request_id,
            "user_id": user_id or f"anon_{uuid.uuid4().hex[:6]}",
            "geo_id": resolved_geo_id,
            "channel": channel,
            "source_channel": channel,
            "language": canonical_lang,
            "detected_language": canonical_lang.split("-")[0],
            "raw_text_reference": None,
            "audio_gcs_uri": None,
            "original_transcript": sanitized_transcript,
            "normalized_text": trans_res.normalized_text,
            "english_translation": trans_res.normalized_text,
            "processing_status": "NORMALIZED" if trans_res.translation_status == "SUCCESS" else "TRANSLATION_FAILED",
            "source": "JANSETU_SYNTHETIC_DEMO" if is_synthetic else "JANSETU_CITIZEN_INTAKE",
            "is_synthetic": is_synthetic,
            "created_at": created_at,
            "updated_at": created_at
        }
        citizen_request_repo.insert([canonical_record])

        # 6. Pub/Sub Event Broadcasting
        event_payload = {
            "event_type": "citizen.request.created",
            "request_id": request_id,
            "geo_id": resolved_geo_id,
            "language": canonical_lang,
            "channel": channel,
            "status": canonical_record["processing_status"],
            "created_at": created_at
        }
        pubsub_service.publish_event(
            data=event_payload,
            topic_name=self.pubsub_topic,
            attributes={"request_id": request_id, "channel": channel}
        )

        return {
            "request_id": request_id,
            "status": canonical_record["processing_status"],
            "language": canonical_lang,
            "original_transcript": sanitized_transcript,
            "normalized_text": trans_res.normalized_text,
            "geo_id": resolved_geo_id,
            "channel": channel,
            "created_at": created_at
        }

    async def process_voice_input(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None,
        language: Optional[str] = None,
        geo_id: Optional[str] = None,
        channel: str = "voice_web",
        user_id: Optional[str] = None,
        is_synthetic: bool = False
    ) -> Dict[str, Any]:
        """
        Processes citizen voice recording:
        Validation -> Cloud Storage -> Chirp 2 STT -> PII Scrubbing -> Translation -> BigQuery -> Pub/Sub
        """
        # 1. Audio Format & Size Validation
        ext = self.validate_audio_payload(filename=filename, content_type=content_type, size_bytes=len(audio_bytes))

        # 2. Language Validation
        canonical_lang = normalize_language_code(language)
        if language and not is_supported_language(canonical_lang):
            raise JanSetuException(
                code="UNSUPPORTED_LANGUAGE",
                message=f"Language '{language}' is not supported.",
                status_code=400
            )

        # 3. Geolocation Validation
        resolved_geo_id = self.validate_geo_id(geo_id) or "IND_TN_DHM_HRR"

        request_id = f"REQ-VOICE-{uuid.uuid4().hex[:8].upper()}"
        created_at = datetime.utcnow().isoformat()

        # 4. Deterministic Cloud Storage Upload
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        gcs_destination = f"audio/{date_str}/{request_id}.{ext}"
        storage_service.upload_object(
            destination_blob_name=gcs_destination,
            data=audio_bytes,
            content_type=content_type or "audio/wav"
        )
        audio_gcs_uri = f"gs://{settings.GCS_BUCKET}/{gcs_destination}"

        # 5. Speech-to-Text Recognition (Chirp 2)
        stt_result = await stt_service.transcribe(
            audio_data=audio_bytes,
            language_code=canonical_lang,
            request_id=request_id
        )

        # 6. PII Sanitization
        sanitized_transcript = self.sanitize_pii(stt_result.transcript)

        # 7. Semantic Normalization / Translation
        trans_res = await translation_service.translate(
            text=sanitized_transcript,
            source_language=canonical_lang
        )

        # 8. Canonical BigQuery Persistence
        canonical_record = {
            "request_id": request_id,
            "user_id": user_id or f"anon_{uuid.uuid4().hex[:6]}",
            "geo_id": resolved_geo_id,
            "channel": channel,
            "source_channel": channel,
            "language": canonical_lang,
            "detected_language": canonical_lang.split("-")[0],
            "raw_text_reference": audio_gcs_uri,
            "audio_gcs_uri": audio_gcs_uri,
            "original_transcript": sanitized_transcript,
            "normalized_text": trans_res.normalized_text,
            "english_translation": trans_res.normalized_text,
            "processing_status": "NORMALIZED" if trans_res.translation_status == "SUCCESS" else "TRANSLATION_FAILED",
            "source": "JANSETU_SYNTHETIC_DEMO" if is_synthetic else "JANSETU_CITIZEN_INTAKE",
            "is_synthetic": is_synthetic,
            "confidence_score": stt_result.confidence or 0.95,
            "created_at": created_at,
            "updated_at": created_at
        }
        citizen_request_repo.insert([canonical_record])

        # 9. Pub/Sub Event Broadcasting
        event_payload = {
            "event_type": "citizen.request.created",
            "request_id": request_id,
            "geo_id": resolved_geo_id,
            "language": canonical_lang,
            "channel": channel,
            "audio_uri": audio_gcs_uri,
            "status": canonical_record["processing_status"],
            "created_at": created_at
        }
        pubsub_service.publish_event(
            data=event_payload,
            topic_name=self.pubsub_topic,
            attributes={"request_id": request_id, "channel": channel}
        )

        return {
            "request_id": request_id,
            "status": canonical_record["processing_status"],
            "language": canonical_lang,
            "original_transcript": sanitized_transcript,
            "normalized_text": trans_res.normalized_text,
            "audio_gcs_uri": audio_gcs_uri,
            "confidence": stt_result.confidence,
            "geo_id": resolved_geo_id,
            "channel": channel,
            "created_at": created_at
        }

    def get_request_status(self, request_id: str) -> Dict[str, Any]:
        """Retrieves non-sensitive processing status of a citizen request."""
        record = citizen_request_repo.get_by_request_id(request_id)
        if not record:
            raise ResourceNotFoundException(f"Citizen request '{request_id}' not found.")

        return {
            "request_id": record.get("request_id"),
            "status": record.get("processing_status", "RECEIVED"),
            "channel": record.get("channel"),
            "language": record.get("language"),
            "geo_id": record.get("geo_id"),
            "original_transcript": record.get("original_transcript"),
            "normalized_text": record.get("normalized_text"),
            "audio_gcs_uri": record.get("audio_gcs_uri"),
            "created_at": record.get("created_at")
        }

citizen_intake_service = CitizenIntakeService()
