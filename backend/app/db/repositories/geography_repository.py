from typing import List, Dict, Any, Optional
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse

class GeographyRepository(BaseRepository):
    """Data Access Repository for Canonical Geography Dimension."""
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="geography", primary_key="geo_id")

    def get_by_geo_id(self, geo_id: str) -> Optional[Dict[str, Any]]:
        return self.get_by_id(geo_id)

    def get_children(self, parent_geo_id: str) -> List[Dict[str, Any]]:
        """Retrieve immediate subdivisions under a parent."""
        return [r for r in self.db.get_records(self.table_name) if r.get("parent_geo_id") == parent_geo_id]

    def get_by_level(self, geo_level: int) -> List[Dict[str, Any]]:
        """Retrieve all geographic units at a specific level (0=Country, 1=State, etc.)."""
        return [
            r for r in self.db.get_records(self.table_name)
            if r.get("geo_level") == geo_level or r.get("admin_level") == geo_level
        ]

    def get_hierarchy(self, geo_id: str) -> List[Dict[str, Any]]:
        """
        Traverses upward from any administrative level to the Country root,
        returning the full lineage path.
        """
        lineage = []
        curr_id = geo_id
        while curr_id:
            node = self.get_by_geo_id(curr_id)
            if not node:
                break
            lineage.append(node)
            curr_id = node.get("parent_geo_id")
        return list(reversed(lineage))

    def list_states(self) -> List[Dict[str, Any]]:
        return self.get_by_level(1)

    def list_districts(self, state_code: Optional[str] = None) -> List[Dict[str, Any]]:
        districts = self.get_by_level(2)
        if state_code:
            return [d for d in districts if d.get("state_code", "").upper() == state_code.upper()]
        return districts

    def list_blocks(self, district_id: Optional[str] = None) -> List[Dict[str, Any]]:
        blocks = self.get_by_level(3)
        if district_id:
            return [b for b in blocks if b.get("parent_geo_id") == district_id or b.get("district_code") == district_id]
        return blocks
