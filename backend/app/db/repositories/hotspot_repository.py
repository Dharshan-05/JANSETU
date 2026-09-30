from typing import List, Dict, Any, Optional
from datetime import datetime
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger

class HotspotRepository(BaseRepository):
    """
    Data Access Repository for Geospatial Demand Hotspots
    persisted in `jansetu_intel.hotspots`.
    """
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="hotspots", primary_key="hotspot_id")

    def get_by_hotspot_id(self, hotspot_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single demand hotspot by its deterministic identifier."""
        return self.get_by_id(hotspot_id)

    def upsert_hotspot(self, hotspot_record: Dict[str, Any]) -> bool:
        """
        Idempotent persistence for demand hotspots.
        Updates existing hotspot if hotspot_id exists, or inserts new record.
        Prevents duplicate hotspot records when pipelines re-execute.
        """
        hotspot_id = hotspot_record.get("hotspot_id")
        if not hotspot_id:
            raise ValueError("hotspot_record must contain 'hotspot_id'")

        existing = self.get_by_id(hotspot_id)
        now_str = datetime.utcnow().isoformat()

        if existing:
            hotspot_record["updated_at"] = now_str
            self.update_by_id(hotspot_id, hotspot_record)
            logger.debug(f"Updated existing hotspot '{hotspot_id}' in warehouse.")
            return True

        if "created_at" not in hotspot_record:
            hotspot_record["created_at"] = now_str
        if "updated_at" not in hotspot_record:
            hotspot_record["updated_at"] = now_str

        return self.create_record(hotspot_record)

    def list_hotspots(
        self,
        category: Optional[str] = None,
        hotspot_level: Optional[str] = None,
        state_code: Optional[str] = None,
        geo_level: Optional[int] = None,
        min_score: Optional[float] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Lists hotspots with optional sectoral, severity level, geographic, and score filtering.
        """
        records = self.db.get_records(self.table_name)
        geos = {g.get("geo_id"): g for g in self.db.get_records("geography")}

        results: List[Dict[str, Any]] = []
        for h in records:
            if category and category.lower() != "all" and h.get("category", "").lower() != category.lower():
                continue
            if hotspot_level and h.get("hotspot_level", "").upper() != hotspot_level.upper():
                continue

            geo_id = h.get("geo_id")
            geo = geos.get(geo_id, {})

            if state_code and geo.get("state_code", "").upper() != state_code.upper() and h.get("state_name", "").upper() != state_code.upper():
                continue

            if geo_level is not None and geo.get("geo_level") != geo_level:
                continue

            score = h.get("hotspot_score") or h.get("voice_intensity_score", 0.0)
            if min_score is not None and score < min_score:
                continue

            item = dict(h)
            # Enrich with geography metadata if missing
            if "region_name" not in item:
                item["region_name"] = geo.get("name") or geo.get("geo_name") or geo_id
            if "state_name" not in item:
                item["state_name"] = geo.get("state_code", "State")
            if "latitude" not in item or item["latitude"] is None:
                item["latitude"] = geo.get("latitude", 0.0)
            if "longitude" not in item or item["longitude"] is None:
                item["longitude"] = geo.get("longitude", 0.0)

            results.append(item)

        # Sort by hotspot score / voice intensity descending
        results.sort(
            key=lambda x: (x.get("hotspot_score") or x.get("voice_intensity_score") or 0.0),
            reverse=True
        )
        return results[:limit]

    def count_hotspots(self) -> int:
        """Returns total active demand hotspots in warehouse."""
        return self.count()
