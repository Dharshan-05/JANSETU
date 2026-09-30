from typing import List, Dict, Any, Optional
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse

class CitizenRequestRepository(BaseRepository):
    """Data Access Repository for Canonical Citizen Intake Fact Records."""
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="citizen_requests", primary_key="request_id")

    def get_by_request_id(self, request_id: str) -> Optional[Dict[str, Any]]:
        return self.get_by_id(request_id)

    def list_by_geo_id(self, geo_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        matches = [r for r in self.db.get_records(self.table_name) if r.get("geo_id") == geo_id]
        return matches[:limit]

    def list_by_category(self, category: str, limit: int = 100) -> List[Dict[str, Any]]:
        matches = [r for r in self.db.get_records(self.table_name) if r.get("primary_category", "").lower() == category.lower()]
        return matches[:limit]

    def count_by_geo(self, geo_id: str) -> int:
        return len([r for r in self.db.get_records(self.table_name) if r.get("geo_id") == geo_id])
