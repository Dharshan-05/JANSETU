from typing import Dict, Any, Tuple, List, Optional, Set
from datetime import datetime
from pipelines.ingestion.base_pipeline import BaseIngestionPipeline
from pipelines.validation.validators import DataValidator

class GeographyIngestionPipeline(BaseIngestionPipeline):
    """
    Ingests and normalizes administrative geography data according to the
    5-level Indian administrative hierarchy (Country -> State -> District -> Block -> Village/Ward).
    Enforces LGD identifiers and GIS centroid generation.
    """
    def __init__(self, source_name: str = "OFFICIAL_LGD", is_synthetic: bool = False, known_geo_ids: Optional[Set[str]] = None):
        super().__init__(target_table="geography", source_name=source_name, is_synthetic=is_synthetic)
        self.known_geo_ids = known_geo_ids or set()

    def validate_record(self, raw_record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        return DataValidator.validate_geography(raw_record, self.known_geo_ids)

    def normalize_record(self, valid_record: Dict[str, Any]) -> Dict[str, Any]:
        geo_id = valid_record["geo_id"]
        level = valid_record.get("geo_level", valid_record.get("admin_level", 0))
        geo_name = valid_record.get("geo_name", valid_record.get("name", ""))
        lat = valid_record.get("latitude")
        lon = valid_record.get("longitude")

        # Generate GIS centroid point if coordinates available
        centroid_wkt = f"POINT({lon} {lat})" if lat is not None and lon is not None else None

        normalized = {
            "geo_id": geo_id,
            "parent_geo_id": valid_record.get("parent_geo_id"),
            "geo_level": level,
            "admin_level": level,  # Compatibility alias
            "geo_name": geo_name,
            "name": geo_name,      # Compatibility alias
            "native_name": valid_record.get("native_name"),
            "state_code": valid_record.get("state_code", "").upper(),
            "district_code": valid_record.get("district_code"),
            "block_code": valid_record.get("block_code"),
            "lgd_code": valid_record.get("lgd_code"),
            "latitude": lat,
            "longitude": lon,
            "centroid": centroid_wkt,
            "geometry": centroid_wkt,
            "population_reference": valid_record.get("population_reference"),
            "is_pilot_region": bool(valid_record.get("is_pilot_region", False)),
            "is_synthetic": self.is_synthetic,
            "source": self.source_name,
            "created_at": valid_record.get("created_at", datetime.utcnow().isoformat()),
            "updated_at": datetime.utcnow().isoformat()
        }
        self.known_geo_ids.add(geo_id)
        return normalized
