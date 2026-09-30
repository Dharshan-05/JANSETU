from typing import Dict, Any, Tuple, List, Optional, Set
from datetime import datetime
from pipelines.ingestion.base_pipeline import BaseIngestionPipeline
from pipelines.validation.validators import DataValidator

class DemographicsIngestionPipeline(BaseIngestionPipeline):
    """
    Ingests census and SECC demographic records with vulnerability and digital penetration indicators.
    """
    def __init__(self, source_name: str = "SECC_CENSUS_INDIA", is_synthetic: bool = False, known_geo_ids: Optional[Set[str]] = None):
        super().__init__(target_table="demographics", source_name=source_name, is_synthetic=is_synthetic)
        self.known_geo_ids = known_geo_ids

    def validate_record(self, raw_record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        return DataValidator.validate_demographics(raw_record, self.known_geo_ids)

    def normalize_record(self, valid_record: Dict[str, Any]) -> Dict[str, Any]:
        pop = valid_record.get("total_population", valid_record.get("population", 0))
        return {
            "geo_id": valid_record["geo_id"],
            "census_year": valid_record.get("census_year", 2021),
            "total_population": pop,
            "population": pop,  # Canonical alias
            "households": valid_record.get("households"),
            "male_population": valid_record.get("male_population"),
            "female_population": valid_record.get("female_population"),
            "sc_st_population": valid_record.get("sc_st_population"),
            "vulnerability_percentage": valid_record.get("vulnerability_percentage", 0.0),
            "vulnerability_indicators": valid_record.get("vulnerability_indicators"),
            "elderly_percentage": valid_record.get("elderly_percentage"),
            "literacy_rate": valid_record.get("literacy_rate"),
            "digital_penetration_index": valid_record.get("digital_penetration_index", 0.0),
            "primary_livelihood": valid_record.get("primary_livelihood"),
            "data_source": self.source_name,
            "source": self.source_name,
            "source_date": valid_record.get("source_date"),
            "is_synthetic": self.is_synthetic,
            "created_at": valid_record.get("created_at", datetime.utcnow().isoformat()),
            "updated_at": datetime.utcnow().isoformat()
        }
