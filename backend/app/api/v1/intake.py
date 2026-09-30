import time
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import Optional

from app.schemas.request_schemas import TextInputRequest
from app.schemas.response_schemas import BaseAPIResponse, IntakeProcessResponse
from app.services.stt_service import stt_service
from app.services.translation_service import translation_service
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.services.fusion_service import fusion_service
from app.db.bigquery_client import db
from app.core.logging import logger

router = APIRouter(prefix="/intake", tags=["Citizen Intake"])

@router.post("/voice", response_model=BaseAPIResponse[IntakeProcessResponse])
async def ingest_citizen_voice(
    audio_file: UploadFile = File(...),
    declared_language: Optional[str] = Form(None),
    source_channel: str = Form("voice_web"),
    declared_state: Optional[str] = Form(None),
    declared_district: Optional[str] = Form(None),
    declared_geo_id: Optional[str] = Form(None)
):
    """
    Ingests citizen voice audio in regional Indian languages (Tamil, Hindi, Telugu, etc.),
    transcribes via Speech-to-Text, translates via Google Translation, extracts structured
    infrastructure parameters using Gemini 2.5, and fuses into semantic clusters.
    """
    start_time = time.time()
    audio_bytes = await audio_file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio payload received.")

    # 1. Speech to Text
    transcript, detected_lang, confidence = await stt_service.transcribe_audio(
        audio_bytes=audio_bytes,
        declared_language=declared_language
    )

    # 2. Translation & Normalization
    translation, lang_iso = await translation_service.translate_to_english(
        text=transcript,
        source_lang=detected_lang
    )

    # 3. Gemini Structured Extraction
    extraction = await gemini_service.extract_request_intelligence(
        transcript=transcript,
        english_translation=translation,
        detected_language=lang_iso
    )

    # Resolve Administrative Geography
    matched_geo = declared_geo_id or extraction.location.block_or_taluk or "IND_TN_DHM_HRR"
    matched_area = f"{extraction.location.block_or_taluk or 'Harur'}, {extraction.location.district or 'Dharmapuri'}"

    # 4. Multilingual Dense Embedding
    embedding = await embedding_service.generate_embedding(translation)

    # 5. Semantic Request Fusion
    request_id = f"REQ-VOICE-{uuid.uuid4().hex[:8].upper()}"
    cluster = await fusion_service.assign_or_create_cluster(
        request_id=request_id,
        category=extraction.primary_category,
        geo_id=matched_geo,
        issue_title=extraction.specific_issue,
        embedding=embedding,
        severity=extraction.severity
    )

    # 6. BigQuery Persistence
    req_record = {
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat(),
        "geo_id": matched_geo,
        "source_channel": source_channel,
        "detected_language": lang_iso,
        "audio_gcs_uri": f"gs://jansetu-citizen-audio/{request_id}.wav",
        "original_transcript": transcript,
        "english_translation": translation,
        "primary_category": extraction.primary_category,
        "subcategory": extraction.subcategory,
        "specific_issue": extraction.specific_issue,
        "extracted_location_name": extraction.location.raw_location_text,
        "latitude": extraction.location.approximate_latitude,
        "longitude": extraction.location.approximate_longitude,
        "severity": extraction.severity,
        "urgency_score": extraction.urgency_score,
        "affected_group": extraction.affected_group,
        "time_pattern": extraction.time_pattern,
        "entities": extraction.key_entities,
        "processing_status": "clustered",
        "is_synthetic": False,
        "confidence_score": confidence
    }
    db.insert_records("citizen_requests", [req_record])

    total_time_ms = int((time.time() - start_time) * 1000)

    data = IntakeProcessResponse(
        request_id=request_id,
        status="PROCESSED",
        source_channel=source_channel,
        detected_language=lang_iso,
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
    return BaseAPIResponse(message="Citizen voice request successfully processed and fused", data=data)

@router.post("/text", response_model=BaseAPIResponse[IntakeProcessResponse])
async def ingest_citizen_text(payload: TextInputRequest):
    """
    Ingests citizen text in any Indian script or English, executes Gemini 2.5 entity
    extraction, computes dense vectors, and attaches request to the civic grid.
    """
    start_time = time.time()

    # 1. Translation
    translation, lang_iso = await translation_service.translate_to_english(
        text=payload.text,
        source_lang=payload.detected_language
    )

    # 2. Gemini Structured Extraction
    extraction = await gemini_service.extract_request_intelligence(
        transcript=payload.text,
        english_translation=translation,
        detected_language=lang_iso
    )

    # Resolve Geo ID
    matched_geo = payload.declared_geo_id or extraction.location.block_or_taluk or "IND_TN_DHM_HRR"
    matched_area = f"{extraction.location.block_or_taluk or 'Local Block'}, {extraction.location.district or 'District'}"

    # 3. Dense Vector Embedding
    embedding = await embedding_service.generate_embedding(translation)

    # 4. Fusion
    request_id = f"REQ-TEXT-{uuid.uuid4().hex[:8].upper()}"
    cluster = await fusion_service.assign_or_create_cluster(
        request_id=request_id,
        category=extraction.primary_category,
        geo_id=matched_geo,
        issue_title=extraction.specific_issue,
        embedding=embedding,
        severity=extraction.severity
    )

    # 5. BigQuery Persistence
    req_record = {
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat(),
        "geo_id": matched_geo,
        "source_channel": payload.source_channel,
        "detected_language": lang_iso,
        "audio_gcs_uri": None,
        "original_transcript": payload.text,
        "english_translation": translation,
        "primary_category": extraction.primary_category,
        "subcategory": extraction.subcategory,
        "specific_issue": extraction.specific_issue,
        "extracted_location_name": extraction.location.raw_location_text,
        "latitude": payload.latitude or extraction.location.approximate_latitude,
        "longitude": payload.longitude or extraction.location.approximate_longitude,
        "severity": extraction.severity,
        "urgency_score": extraction.urgency_score,
        "affected_group": extraction.affected_group,
        "time_pattern": extraction.time_pattern,
        "entities": extraction.key_entities,
        "processing_status": "clustered",
        "is_synthetic": False,
        "confidence_score": 0.98
    }
    db.insert_records("citizen_requests", [req_record])

    total_time_ms = int((time.time() - start_time) * 1000)

    data = IntakeProcessResponse(
        request_id=request_id,
        status="PROCESSED",
        source_channel=payload.source_channel,
        detected_language=lang_iso,
        original_text=payload.text,
        english_translation=translation,
        extraction=extraction,
        matched_geo_id=matched_geo,
        matched_admin_area=matched_area,
        assigned_cluster_id=cluster.get("cluster_id"),
        cluster_title=cluster.get("cluster_title"),
        processing_time_ms=total_time_ms,
        is_synthetic=False
    )
    return BaseAPIResponse(message="Citizen text request successfully processed and fused", data=data)
