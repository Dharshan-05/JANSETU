import time
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import JanSetuException, ResourceNotFoundException
from app.db.bigquery_client import citizen_request_repo, embedding_repo, demand_cluster_repo
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.services.clustering_service import clustering_service
from app.services.vector_search_service import vector_search_service
from app.services.pubsub_service import pubsub_service
from app.schemas.extraction_schemas import GeminiRequestExtraction

class AIPerceptionService:
    """
    Phase 4 Master AI Perception & Semantic Clustering Orchestrator.
    Consumes canonical citizen requests, executes Gemini structured extraction,
    generates 768-dim multilingual vector embeddings, and performs demand clustering.
    """
    def __init__(self):
        self.pubsub_topic = settings.PUBSUB_TOPIC

    async def process_request(
        self,
        request_id: str,
        force_reprocess: bool = False
    ) -> Dict[str, Any]:
        """
        Executes end-to-end AI perception pipeline for a citizen request:
        1. Fetch canonical request
        2. Check AI status for idempotency
        3. Gemini structured extraction & Pydantic validation
        4. Update citizen_requests table
        5. Generate & persist 768-dim embedding
        6. Assign/create semantic demand cluster
        7. Publish Pub/Sub completion event
        """
        start_time = time.time()

        # 1. Fetch canonical request
        record = citizen_request_repo.get_by_id(request_id)
        if not record:
            raise ResourceNotFoundException(f"Citizen request '{request_id}' not found in canonical warehouse.")

        # 2. Idempotency Check: if already completed and not force_reprocess
        existing_ai_status = record.get("ai_status")
        if existing_ai_status == "COMPLETED" and not force_reprocess:
            logger.info(f"Request {request_id} already has completed AI perception. Returning cached result.")
            existing_emb = embedding_repo.get_by_id(request_id)
            existing_cluster_id = record.get("assigned_cluster_id")
            cluster = demand_cluster_repo.get_by_cluster_id(existing_cluster_id) if existing_cluster_id else {}
            return self._build_result(record, cluster, existing_emb, int((time.time() - start_time) * 1000))

        # Mark in-progress
        citizen_request_repo.update_by_id(request_id, {"ai_status": "PROCESSING"})

        try:
            transcript = record.get("original_transcript", "")
            normalized_text = record.get("normalized_text") or record.get("english_translation") or transcript
            language = record.get("language", "en")
            geo_id = record.get("geo_id", "IND")

            # 3. Gemini Structured Extraction
            extraction: GeminiRequestExtraction = await gemini_service.extract_request_intelligence(
                transcript=transcript,
                english_translation=normalized_text,
                detected_language=language,
                authoritative_geo_id=geo_id
            )

            # 4. Generate & Persist 768-dim Multilingual Embedding
            text_for_embedding = normalized_text if normalized_text else transcript
            embedding = await embedding_service.embed_and_persist(
                request_id=request_id,
                text=text_for_embedding,
                category=extraction.primary_category,
                geo_id=geo_id
            )

            # 5. Semantic Demand Clustering
            cluster = clustering_service.assign_to_cluster(
                request_id=request_id,
                geo_id=geo_id,
                category=extraction.primary_category,
                specific_issue=extraction.specific_issue,
                embedding=embedding,
                severity=extraction.severity
            )

            # 6. Update Canonical citizen_requests Record with Extracted Intelligence
            now_iso = datetime.utcnow().isoformat()
            updates = {
                "primary_category": extraction.primary_category,
                "subcategory": extraction.subcategory,
                "specific_issue": extraction.specific_issue,
                "severity": extraction.severity,
                "urgency_score": extraction.urgency_score,
                "urgency": extraction.urgency_score,
                "affected_group": extraction.affected_group,
                "cohort": extraction.affected_group,
                "time_pattern": extraction.time_pattern,
                "confidence_score": extraction.confidence,
                "assigned_cluster_id": cluster.get("cluster_id"),
                "cluster_title": cluster.get("cluster_title"),
                "ai_status": "COMPLETED",
                "ai_model_name": extraction.model_name,
                "ai_model_version": extraction.model_version,
                "ai_processed_at": now_iso,
                "updated_at": now_iso
            }
            citizen_request_repo.update_by_id(request_id, updates)
            record.update(updates)

            # 7. Publish AI Processing Event to Pub/Sub
            ai_event_payload = {
                "event_type": "citizen.request.ai.completed",
                "request_id": request_id,
                "geo_id": geo_id,
                "category": extraction.primary_category,
                "cluster_id": cluster.get("cluster_id"),
                "ai_status": "COMPLETED",
                "embedding_dimension": len(embedding),
                "processed_at": now_iso
            }
            pubsub_service.publish_event(
                data=ai_event_payload,
                topic_name=self.pubsub_topic,
                attributes={"request_id": request_id, "event": "ai_completed"}
            )

            elapsed_ms = int((time.time() - start_time) * 1000)
            return self._build_result(record, cluster, {"embedding": embedding}, elapsed_ms, extraction)

        except Exception as e:
            logger.error(f"AI perception pipeline failed for request {request_id}: {e}", exc_info=True)
            citizen_request_repo.update_by_id(request_id, {
                "ai_status": "FAILED",
                "ai_error": str(e)
            })
            raise JanSetuException(
                code="AI_PROCESSING_ERROR",
                message=f"Failed to complete AI perception for request '{request_id}': {str(e)}",
                status_code=500
            )

    def get_ai_status(self, request_id: str) -> Dict[str, Any]:
        """Retrieves AI perception status, extraction details, and cluster assignment."""
        record = citizen_request_repo.get_by_id(request_id)
        if not record:
            raise ResourceNotFoundException(f"Citizen request '{request_id}' not found.")

        emb = embedding_repo.get_by_id(request_id)
        cluster_id = record.get("assigned_cluster_id")
        cluster = demand_cluster_repo.get_by_cluster_id(cluster_id) if cluster_id else None

        return {
            "request_id": request_id,
            "ai_status": record.get("ai_status", "PENDING" if not record.get("primary_category") else "COMPLETED"),
            "language": record.get("language"),
            "original_transcript": record.get("original_transcript"),
            "normalized_text": record.get("normalized_text"),
            "geo_id": record.get("geo_id"),
            "extraction": {
                "primary_category": record.get("primary_category"),
                "subcategory": record.get("subcategory"),
                "specific_issue": record.get("specific_issue"),
                "severity": record.get("severity"),
                "urgency_score": record.get("urgency_score"),
                "affected_group": record.get("affected_group"),
                "cohort": record.get("affected_group"),
                "time_pattern": record.get("time_pattern"),
                "confidence_score": record.get("confidence_score")
            } if record.get("primary_category") else None,
            "embedding": {
                "status": "COMPLETED" if emb else "PENDING",
                "model": emb.get("embedding_model") if emb else "text-multilingual-embedding-002",
                "dimension": len(emb.get("embedding", [])) if emb else 768
            },
            "cluster": cluster,
            "provenance": {
                "model_name": record.get("ai_model_name", "gemini-2.5-pro"),
                "model_version": record.get("ai_model_version", "v4.0-structured"),
                "processed_at": record.get("ai_processed_at")
            }
        }

    def _build_result(
        self,
        record: Dict[str, Any],
        cluster: Dict[str, Any],
        emb: Optional[Dict[str, Any]],
        elapsed_ms: int,
        extraction: Optional[GeminiRequestExtraction] = None
    ) -> Dict[str, Any]:
        """Constructs standardized AI perception response payload."""
        req_id = record.get("request_id")
        similar = vector_search_service.find_similar_to_request(req_id, top_k=5) if emb else []

        return {
            "request_id": req_id,
            "ai_status": record.get("ai_status", "COMPLETED"),
            "geo_id": record.get("geo_id"),
            "language": record.get("language"),
            "original_transcript": record.get("original_transcript"),
            "normalized_text": record.get("normalized_text"),
            "extraction": extraction.model_dump() if extraction else {
                "primary_category": record.get("primary_category"),
                "subcategory": record.get("subcategory"),
                "specific_issue": record.get("specific_issue"),
                "severity": record.get("severity"),
                "urgency_score": record.get("urgency_score"),
                "affected_group": record.get("affected_group"),
                "cohort": record.get("affected_group"),
                "time_pattern": record.get("time_pattern"),
                "confidence": record.get("confidence_score", 0.95)
            },
            "embedding": {
                "status": "COMPLETED",
                "model": "text-multilingual-embedding-002",
                "dimension": 768
            },
            "assigned_cluster": {
                "cluster_id": cluster.get("cluster_id"),
                "cluster_title": cluster.get("cluster_title"),
                "representative_issue": cluster.get("representative_issue"),
                "request_count": cluster.get("request_count", 1),
                "average_severity": cluster.get("average_severity", record.get("severity", 3))
            },
            "cluster": {
                "cluster_id": cluster.get("cluster_id"),
                "cluster_title": cluster.get("cluster_title"),
                "representative_issue": cluster.get("representative_issue"),
                "request_count": cluster.get("request_count", 1),
                "average_severity": cluster.get("average_severity", record.get("severity", 3))
            },
            "similar_requests": similar,
            "processing_time_ms": elapsed_ms,
            "disclaimer": "AI-Derived Interpretation — Not Official Policy",
            "provenance": {
                "model_name": record.get("ai_model_name", "gemini-2.5-pro"),
                "model_version": record.get("ai_model_version", "v4.0-structured"),
                "prompt_version": "v4.0-grounded-perception",
                "processed_at": record.get("ai_processed_at")
            }
        }

ai_perception_service = AIPerceptionService()
