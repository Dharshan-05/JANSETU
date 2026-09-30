import re
import uuid
from typing import Dict, Any, Tuple, List, Optional, Set
from datetime import datetime
from pipelines.ingestion.base_pipeline import BaseIngestionPipeline
from pipelines.validation.validators import DataValidator, PHONE_REGEX, EMAIL_REGEX

class CitizenRequestIngestionPipeline(BaseIngestionPipeline):
    """
    Ingests and normalizes citizen requests with strict privacy sanitization
    and multilingual channel classification.
    """
    def __init__(self, source_name: str = "JANSETU_CITIZEN_INTAKE", is_synthetic: bool = False, known_geo_ids: Optional[Set[str]] = None):
        super().__init__(target_table="citizen_requests", source_name=source_name, is_synthetic=is_synthetic)
        self.known_geo_ids = known_geo_ids

    def validate_record(self, raw_record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        return DataValidator.validate_citizen_request(raw_record, self.known_geo_ids)

    def normalize_record(self, valid_record: Dict[str, Any]) -> Dict[str, Any]:
        req_id = valid_record.get("request_id") or str(uuid.uuid4())
        transcript = valid_record.get("original_transcript", "")
        # Sanitize PII
        transcript = PHONE_REGEX.sub("[REDACTED_PHONE]", transcript)
        transcript = EMAIL_REGEX.sub("[REDACTED_EMAIL]", transcript)

        lang = valid_record.get("language", valid_record.get("detected_language", "en")).lower()
        channel = valid_record.get("channel", valid_record.get("source_channel", "text_web")).lower()
        urgency = float(valid_record.get("urgency_score", valid_record.get("urgency", 0.5)))
        norm_text = valid_record.get("normalized_text", valid_record.get("english_translation", transcript))
        cohort = valid_record.get("cohort", valid_record.get("affected_group", "general_population"))

        lat = valid_record.get("latitude")
        lon = valid_record.get("longitude")
        geog_wkt = f"POINT({lon} {lat})" if lat is not None and lon is not None else None

        return {
            "request_id": req_id,
            "user_id": valid_record.get("user_id"),
            "geo_id": valid_record["geo_id"],
            "channel": channel,
            "source_channel": channel,  # Compatibility alias
            "language": lang,
            "detected_language": lang,  # Compatibility alias
            "raw_text_reference": valid_record.get("raw_text_reference", valid_record.get("audio_gcs_uri")),
            "audio_gcs_uri": valid_record.get("audio_gcs_uri"),
            "original_transcript": transcript,
            "normalized_text": norm_text,
            "english_translation": norm_text,  # Compatibility alias
            "primary_category": valid_record.get("primary_category", "transport").lower(),
            "subcategory": valid_record.get("subcategory", "general_issue"),
            "specific_issue": valid_record.get("specific_issue", "Civic infrastructure issue"),
            "extracted_location_name": valid_record.get("extracted_location_name"),
            "latitude": lat,
            "longitude": lon,
            "location_geog": geog_wkt,
            "severity": int(valid_record.get("severity", 3)),
            "urgency": urgency,
            "urgency_score": urgency,  # Compatibility alias
            "affected_group": cohort,
            "cohort": cohort,          # Canonical alias
            "time_pattern": valid_record.get("time_pattern"),
            "entities": valid_record.get("entities", []),
            "processing_status": valid_record.get("processing_status", "received"),
            "confidence_score": float(valid_record.get("confidence_score", 0.95)),
            "source": self.source_name,
            "is_synthetic": self.is_synthetic,
            "created_at": valid_record.get("created_at", datetime.utcnow().isoformat()),
            "updated_at": datetime.utcnow().isoformat()
        }
