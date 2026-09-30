from typing import List, Dict, Any, Optional
from datetime import datetime
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger

class DemandClusterRepository(BaseRepository):
    """
    Data Access Repository for Synthesized Semantic Demand Clusters
    persisted in `jansetu_intel.demand_clusters`.
    """
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="demand_clusters", primary_key="cluster_id")

    def get_by_cluster_id(self, cluster_id: str) -> Optional[Dict[str, Any]]:
        return self.get_by_id(cluster_id)

    def list_by_geo_id(self, geo_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        clusters = self.db.get_records(self.table_name)
        results = [c for c in clusters if c.get("geo_id") == geo_id]
        if category:
            results = [c for c in results if c.get("category") == category]
        return results

    def list_by_category(self, category: str) -> List[Dict[str, Any]]:
        clusters = self.db.get_records(self.table_name)
        return [c for c in clusters if c.get("category") == category]

    def upsert_cluster(self, cluster_data: Dict[str, Any]) -> bool:
        """
        Idempotently inserts or updates a demand cluster record.
        Maintains deterministic cluster identities across ingestion runs.
        """
        cluster_id = cluster_data.get("cluster_id")
        if not cluster_id:
            raise ValueError("cluster_data must include 'cluster_id'")

        existing = self.get_by_cluster_id(cluster_id)
        if existing:
            existing.update(cluster_data)
            existing["updated_at"] = datetime.utcnow().isoformat()
            logger.debug(f"Updated demand cluster {cluster_id}")
            return True

        if "created_at" not in cluster_data:
            cluster_data["created_at"] = datetime.utcnow().isoformat()
        if "updated_at" not in cluster_data:
            cluster_data["updated_at"] = datetime.utcnow().isoformat()
        return self.insert([cluster_data])

    def get_all_clusters(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.list_all(limit=limit)
