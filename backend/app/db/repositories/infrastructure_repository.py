from typing import List, Dict, Any, Optional
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse

class InfrastructureRepository(BaseRepository):
    """Data Access Repository for Physical & Digital Infrastructure Deficit Metrics."""
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="infrastructure", primary_key="geo_id")

    def list_by_geo_id(self, geo_id: str) -> List[Dict[str, Any]]:
        return [r for r in self.db.get_records(self.table_name) if r.get("geo_id") == geo_id]

    def list_by_category(self, category: str) -> List[Dict[str, Any]]:
        return [
            r for r in self.db.get_records(self.table_name)
            if r.get("category", "").lower() == category.lower() or
               r.get("infrastructure_type", "").lower() == category.lower()
        ]

    def get_high_deficit_areas(self, category: Optional[str] = None, min_deficit: float = 0.60) -> List[Dict[str, Any]]:
        matches = []
        for r in self.db.get_records(self.table_name):
            deficit = float(r.get("deficit_score", r.get("deficit_value", 0.0)))
            if deficit >= min_deficit:
                if category is None or r.get("category", "").lower() == category.lower():
                    matches.append(r)
        return matches
