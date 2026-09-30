import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.db.bigquery_client import db
from app.services.embedding_service import embedding_service
from app.core.logging import logger

SIMILARITY_THRESHOLD = 0.72

class RequestFusionService:
    """
    Fuses disparate multilingual citizen descriptions of the same infrastructure gap
    into cohesive Semantic Demand Clusters using vector similarity and spatial proximity.
    """

    async def assign_or_create_cluster(
        self,
        request_id: str,
        category: str,
        geo_id: str,
        issue_title: str,
        embedding: List[float],
        severity: int
    ) -> Dict[str, Any]:
        clusters = db.get_records("demand_clusters")
        
        # Look for matching cluster in same geographic region and sector
        matched_cluster = None
        best_similarity = 0.0

        for c in clusters:
            if c.get("category") == category and c.get("geo_id") == geo_id:
                c_emb = c.get("representative_embedding")
                if c_emb:
                    sim = embedding_service.cosine_similarity(embedding, c_emb)
                    if sim > best_similarity:
                        best_similarity = sim
                        if sim >= SIMILARITY_THRESHOLD:
                            matched_cluster = c

        if matched_cluster:
            # Update existing cluster
            matched_cluster["request_count"] += 1
            curr_sev = matched_cluster["average_severity"]
            cnt = matched_cluster["request_count"]
            matched_cluster["average_severity"] = round(((curr_sev * (cnt - 1)) + severity) / cnt, 2)
            matched_cluster["latest_reported_at"] = datetime.utcnow().isoformat()
            logger.info(f"Fused request {request_id} into existing cluster {matched_cluster['cluster_id']} (similarity: {best_similarity:.3f})")
            return matched_cluster

        # Create new semantic demand cluster
        new_cluster_id = f"CLS-{category.upper()[:3]}-{uuid.uuid4().hex[:6].upper()}"
        new_cluster = {
            "cluster_id": new_cluster_id,
            "geo_id": geo_id,
            "category": category,
            "cluster_title": f"{issue_title.replace('_', ' ').title()}",
            "cluster_summary": f"Aggregated citizen requests regarding {issue_title.replace('_', ' ')} in region {geo_id}.",
            "request_count": 1,
            "average_severity": float(severity),
            "first_reported_at": datetime.utcnow().isoformat(),
            "latest_reported_at": datetime.utcnow().isoformat(),
            "growth_velocity_7d": 12.5,
            "representative_embedding": embedding,
            "status": "emerging"
        }
        db.insert_records("demand_clusters", [new_cluster])
        logger.info(f"Created new semantic cluster {new_cluster_id} for request {request_id}")
        return new_cluster

    def get_clusters_for_region(self, geo_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        all_clusters = db.get_records("demand_clusters")
        results = [c for c in all_clusters if c.get("geo_id") == geo_id]
        if category:
            results = [c for c in results if c.get("category") == category]
        return results

fusion_service = RequestFusionService()
