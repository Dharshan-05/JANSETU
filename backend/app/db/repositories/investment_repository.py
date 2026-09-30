from typing import List, Dict, Any, Optional
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse

class InvestmentRepository(BaseRepository):
    """Data Access Repository for Public Schemes and Capital Expenditure Projects."""
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="investments", primary_key="project_id")

    def get_by_project_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        return self.get_by_id(project_id)

    def list_by_geo_id(self, geo_id: str) -> List[Dict[str, Any]]:
        return [r for r in self.db.get_records(self.table_name) if r.get("geo_id") == geo_id]

    def list_by_sector(self, sector: str) -> List[Dict[str, Any]]:
        return [
            r for r in self.db.get_records(self.table_name)
            if r.get("category", "").lower() == sector.lower() or
               r.get("sector", "").lower() == sector.lower()
        ]

    def get_total_allocated_by_geo(self, geo_id: str) -> int:
        projects = self.list_by_geo_id(geo_id)
        return sum(int(p.get("allocated_budget_inr", p.get("investment_amount", 0))) for p in projects)
