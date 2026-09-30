from typing import Dict, Any, Tuple, List, Optional, Set
from datetime import datetime
from pipelines.ingestion.base_pipeline import BaseIngestionPipeline
from pipelines.validation.validators import DataValidator

class InfrastructureIngestionPipeline(BaseIngestionPipeline):
    """
    Ingests and normalizes physical and digital infrastructure baseline data (PMGSY, JJM, TRAI, NFHS-5).
    """
    def __init__(self, source_name: str = "GOV_INFRA_AUDIT", is_synthetic: bool = False, known_geo_ids: Optional[Set[str]] = None):
        super().__init__(target_table="infrastructure", source_name=source_name, is_synthetic=is_synthetic)
        self.known_geo_ids = known_geo_ids

    def validate_record(self, raw_record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        return DataValidator.validate_infrastructure(raw_record, self.known_geo_ids)

    def normalize_record(self, valid_record: Dict[str, Any]) -> Dict[str, Any]:
        cat = valid_record.get("category", valid_record.get("infrastructure_type", "")).lower()
        deficit = float(valid_record.get("deficit_score", valid_record.get("deficit_value", 0.0)))
        return {
            "geo_id": valid_record["geo_id"],
            "category": cat,
            "infrastructure_type": cat,  # Canonical alias
            "indicator_name": valid_record["indicator_name"],
            "indicator_value": float(valid_record["indicator_value"]),
            "availability_value": valid_record.get("availability_value"),
            "coverage_value": valid_record.get("coverage_value"),
            "national_benchmark": float(valid_record.get("national_benchmark", 1.0)),
            "deficit_score": deficit,
            "deficit_value": deficit,    # Canonical alias
            "measurement_unit": valid_record.get("measurement_unit"),
            "last_audited_at": valid_record.get("last_audited_at"),
            "source_date": valid_record.get("source_date"),
            "source_dataset": valid_record.get("source_dataset", self.source_name),
            "source": self.source_name,
            "is_synthetic": self.is_synthetic,
            "created_at": valid_record.get("created_at", datetime.utcnow().isoformat()),
            "updated_at": datetime.utcnow().isoformat()
        }
