from typing import List, Dict, Any, Optional
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse

class DemographicsRepository(BaseRepository):
    """Data Access Repository for Demographics and SECC Vulnerability Indicators."""
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="demographics", primary_key="geo_id")

    def get_by_geo_id(self, geo_id: str) -> Optional[Dict[str, Any]]:
        return self.get_by_id(geo_id)

    def get_vulnerable_regions(self, threshold: float = 0.50) -> List[Dict[str, Any]]:
        return [
            r for r in self.db.get_records(self.table_name)
            if float(r.get("vulnerability_percentage", 0.0)) >= threshold
        ]
