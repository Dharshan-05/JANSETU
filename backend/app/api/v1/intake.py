import time
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query

from app.schemas.request_schemas import TextInputRequest
from app.schemas.response_schemas import BaseAPIResponse, IntakeProcessResponse
from app.core.logging import logger
from app.core.exceptions import JanSetuException, ResourceNotFoundException
from app.core.languages import list_supported_languages, normalize_language_code, LanguageConfig
from app.services.citizen_intake_service import citizen_intake_service
from app.services.gemini_service import gemini_service
from app.services.fusion_service import fusion_service
from app.services.embedding_service import embedding_service
from app.db.bigquery_client import geography_repo

router = APIRouter(prefix="/intake", tags=["Citizen Intake"])

@router.get("/languages", response_model=BaseAPIResponse[List[LanguageConfig]])
async def get_supported_languages():
    """Returns the list of currently supported Indian languages for citizen intake."""
    langs = list_supported_languages()
    return BaseAPIResponse(
        message="Supported languages retrieved successfully",
        data=langs
    )

@router.get("/{request_id}", response_model=BaseAPIResponse[Dict[str, Any]])
async def get_intake_request_status(request_id: str):
    """Retrieves non-sensitive processing status of a previously submitted citizen request."""
    status_data = citizen_intake_service.get_request_status(request_id)
    return BaseAPIResponse(
        message="Request status retrieved successfully",
        data=status_data
    )

@router.post("/voice", response_model=BaseAPIResponse[IntakeProcessResponse])
async def ingest_citizen_voice(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    declared_language: Optional[str] = Form(None),
    channel: str = Form("voice_web"),
    source_channel: str = Form("voice_web"),
    geo_id: Optional[str] = Form(None),
    declared_geo_id: Optional[str] = Form(None),
    declared_state: Optional[str] = Form(None),
    declared_district: Optional[str] = Form(None)
):
    """
    Ingests citizen voice audio in regional Indian languages (Tamil, Hindi, Telugu, English, etc.),
    stores raw audio in Google Cloud Storage, transcribes via Google Cloud Speech-to-Text (Chirp 2),
    sanitizes PII, translates via Translation Advanced v3, persists into BigQuery, and publishes
    a Pub/Sub event.
    """
    start_time = time.time()
    audio_bytes = await audio_file.read()
    filename = audio_file.filename or "citizen_recording.wav"
    content_type = audio_file.content_type

    # Support flexible parameters
    selected_language = language or declared_language
    selected_geo_id = geo_id or declared_geo_id
    active_channel = channel if channel != "voice_web" else source_channel

    # 1. Execute Core Citizen Intake Pipeline
    intake_res = await citizen_intake_service.process_voice_input(
        audio_bytes=audio_bytes,
        filename=filename,
        content_type=content_type,
        language=selected_language,
        geo_id=selected_geo_id,
        channel=active_channel
    )

    request_id = intake_res["request_id"]
    transcript = intake_res["original_transcript"]
    translation = intake_res["normalized_text"]
    canonical_lang = intake_res["language"]
    short_lang = canonical_lang.split("-")[0]
    matched_geo = intake_res["geo_id"]

    # 2. Downstream AI Extraction & Cluster Assignment (for backward compatibility)
    extraction = await gemini_service.extract_request_intelligence(
        transcript=transcript,
        english_translation=translation,
        detected_language=short_lang
    )

    geo_node = geography_repo.get_by_geo_id(matched_geo)
    matched_area = geo_node.get("geo_name", "Harur Block") if geo_node else "Local Administrative Area"

    embedding = await embedding_service.generate_embedding(translation)
    cluster = await fusion_service.assign_or_create_cluster(
        request_id=request_id,
        category=extraction.primary_category,
        geo_id=matched_geo,
        issue_title=extraction.specific_issue,
        embedding=embedding,
        severity=extraction.severity
    )

    total_time_ms = int((time.time() - start_time) * 1000)

    data = IntakeProcessResponse(
        request_id=request_id,
        status="PROCESSED",
        source_channel=active_channel,
        detected_language=short_lang,
        original_text=transcript,
        english_translation=translation,
        extraction=extraction,
        matched_geo_id=matched_geo,
        matched_admin_area=matched_area,
        assigned_cluster_id=cluster.get("cluster_id"),
        cluster_title=cluster.get("cluster_title"),
        processing_time_ms=total_time_ms,
        is_synthetic=False
    )
    return BaseAPIResponse(message="Citizen voice request successfully processed, translated, and queued", data=data)

@router.post("/text", response_model=BaseAPIResponse[IntakeProcessResponse])
async def ingest_citizen_text(payload: TextInputRequest):
    """
    Ingests citizen text in any supported Indian script or English,
    scrubs PII, translates via Translation Advanced v3, persists canonical
    request in BigQuery, and broadcasts a Pub/Sub intake event.
    """
    start_time = time.time()

    selected_language = payload.language or payload.detected_language
    selected_geo_id = payload.geo_id or payload.declared_geo_id
    active_channel = payload.channel or payload.source_channel

    # 1. Execute Core Citizen Intake Pipeline
    intake_res = await citizen_intake_service.process_text_input(
        text=payload.text,
        language=selected_language,
        geo_id=selected_geo_id,
        channel=active_channel
    )

    request_id = intake_res["request_id"]
    transcript = intake_res["original_transcript"]
    translation = intake_res["normalized_text"]
    canonical_lang = intake_res["language"]
    short_lang = canonical_lang.split("-")[0]
    matched_geo = intake_res["geo_id"]

    # 2. Downstream AI Extraction & Cluster Assignment (for backward compatibility)
    extraction = await gemini_service.extract_request_intelligence(
        transcript=transcript,
        english_translation=translation,
        detected_language=short_lang
    )

    geo_node = geography_repo.get_by_geo_id(matched_geo)
    matched_area = geo_node.get("geo_name", "Harur Block") if geo_node else "Local Administrative Area"

    embedding = await embedding_service.generate_embedding(translation)
    cluster = await fusion_service.assign_or_create_cluster(
        request_id=request_id,
        category=extraction.primary_category,
        geo_id=matched_geo,
        issue_title=extraction.specific_issue,
        embedding=embedding,
        severity=extraction.severity
    )

    total_time_ms = int((time.time() - start_time) * 1000)

    data = IntakeProcessResponse(
        request_id=request_id,
        status="PROCESSED",
        source_channel=active_channel,
        detected_language=short_lang,
        original_text=transcript,
        english_translation=translation,
        extraction=extraction,
        matched_geo_id=matched_geo,
        matched_admin_area=matched_area,
        assigned_cluster_id=cluster.get("cluster_id"),
        cluster_title=cluster.get("cluster_title"),
        processing_time_ms=total_time_ms,
        is_synthetic=False
    )
    return BaseAPIResponse(message="Citizen text request successfully processed, translated, and queued", data=data)
