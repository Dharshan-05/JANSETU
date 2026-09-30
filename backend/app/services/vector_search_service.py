from typing import List, Dict, Any, Optional
from app.config import settings
from app.core.logging import logger
from app.db.bigquery_client import db, embedding_repo, citizen_request_repo
from app.services.embedding_service import embedding_service

class VectorSearchService:
    """
    BigQuery Vector Search and Semantic Similarity Service for JANSETU.
    Performs nearest-neighbor vector search over `jansetu_intel.citizen_request_embeddings`
    with spatial and sectoral constraints.
    """
    def __init__(self):
        self.default_threshold = getattr(settings, "AI_SIMILARITY_THRESHOLD", 0.72)

    def search_similar_requests(
        self,
        query_embedding: List[float],
        geo_id: Optional[str] = None,
        category: Optional[str] = None,
        threshold: Optional[float] = None,
        exclude_request_id: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic vector similarity search against registered citizen embeddings.
        Returns matched neighbors with actual cosine similarity scores.
        """
        min_sim = threshold if threshold is not None else self.default_threshold
        candidates = embedding_repo.list_all_vectors()

        matches = []
        for cand in candidates:
            cand_req_id = cand.get("request_id")
            if exclude_request_id and cand_req_id == exclude_request_id:
                continue

            # Apply geographic filter if specified
            if geo_id and cand.get("geo_id") and cand.get("geo_id") != geo_id:
                continue

            # Apply category pre-filter if specified
            if category and cand.get("category") and cand.get("category") != category:
                continue

            cand_vec = cand.get("embedding")
            if not cand_vec:
                continue

            similarity = embedding_service.cosine_similarity(query_embedding, cand_vec)
            if similarity >= min_sim:
                # Retrieve original text snippet if available
                req_record = citizen_request_repo.get_by_id(cand_req_id) or {}
                matches.append({
                    "neighbor_request_id": cand_req_id,
                    "similarity": round(similarity, 4),
                    "category": cand.get("category") or req_record.get("primary_category", "other"),
                    "geo_id": cand.get("geo_id") or req_record.get("geo_id"),
                    "snippet": req_record.get("normalized_text") or req_record.get("original_transcript", ""),
                    "language": req_record.get("language")
                })

        # Sort by similarity descending
        matches.sort(key=lambda x: x["similarity"], reverse=True)
        return matches[:top_k]

    def find_similar_to_request(
        self,
        request_id: str,
        threshold: Optional[float] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """Finds semantically similar citizen requests for an existing request."""
        emb_record = embedding_repo.get_by_id(request_id)
        if not emb_record or not emb_record.get("embedding"):
            # Check citizen_requests table and generate embedding if needed
            req = citizen_request_repo.get_by_id(request_id)
            if not req:
                return []
            text = req.get("normalized_text") or req.get("original_transcript", "")
            return []

        return self.search_similar_requests(
            query_embedding=emb_record["embedding"],
            geo_id=emb_record.get("geo_id"),
            category=emb_record.get("category"),
            threshold=threshold,
            exclude_request_id=request_id,
            top_k=top_k
        )

vector_search_service = VectorSearchService()
