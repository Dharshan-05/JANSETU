from typing import Dict, Any, List, Optional
from app.services.clustering_service import clustering_service

class RequestFusionService:
    """
    Backward-compatible facade delegating to the Phase 4 DemandClusteringService.
    Ensures existing callers throughout Phase 1-3 remain 100% operational.
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
        return clustering_service.assign_to_cluster(
            request_id=request_id,
            geo_id=geo_id,
            category=category,
            specific_issue=issue_title,
            embedding=embedding,
            severity=severity
        )

    def get_clusters_for_region(self, geo_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        return clustering_service.list_clusters(geo_id=geo_id, category=category)

fusion_service = RequestFusionService()
