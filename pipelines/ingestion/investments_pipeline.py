from typing import Dict, Any, Tuple, List, Optional, Set
from datetime import datetime
from pipelines.ingestion.base_pipeline import BaseIngestionPipeline
from pipelines.validation.validators import DataValidator

class InvestmentsIngestionPipeline(BaseIngestionPipeline):
    """
    Ingests public capex works and schemes (PMGSY, JJM, AMRUT, etc.) with strict budget integrity.
    """
    def __init__(self, source_name: str = "GOV_BUDGET_PORTAL", is_synthetic: bool = False, known_geo_ids: Optional[Set[str]] = None):
        super().__init__(target_table="investments", source_name=source_name, is_synthetic=is_synthetic)
        self.known_geo_ids = known_geo_ids

    def validate_record(self, raw_record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        return DataValidator.validate_investment(raw_record, self.known_geo_ids)

    def normalize_record(self, valid_record: Dict[str, Any]) -> Dict[str, Any]:
        proj_id = valid_record.get("project_id", valid_record.get("investment_id"))
        cat = valid_record.get("category", valid_record.get("sector", "")).lower()
        budget = int(valid_record.get("allocated_budget_inr", valid_record.get("investment_amount", 0)))
        status = valid_record.get("status", valid_record.get("project_status", "sanctioned")).lower()

        return {
            "project_id": proj_id,
            "investment_id": proj_id,  # Canonical alias
            "geo_id": valid_record["geo_id"],
            "project_name": valid_record["project_name"],
            "scheme_name": valid_record.get("scheme_name"),
            "category": cat,
            "sector": cat,             # Canonical alias
            "allocated_budget_inr": budget,
            "investment_amount": float(budget),  # Canonical alias
            "expended_budget_inr": int(valid_record.get("expended_budget_inr", 0)),
            "currency": valid_record.get("currency", "INR"),
            "status": status,
            "project_status": status,  # Canonical alias
            "planned_date": valid_record.get("planned_date"),
            "commenced_date": valid_record.get("commenced_date", valid_record.get("start_date")),
            "start_date": valid_record.get("start_date", valid_record.get("commenced_date")),
            "target_completion_date": valid_record.get("target_completion_date", valid_record.get("completion_date")),
            "completion_date": valid_record.get("completion_date", valid_record.get("target_completion_date")),
            "contractor_name": valid_record.get("contractor_name"),
            "beneficiary_population": valid_record.get("beneficiary_population"),
            "source": self.source_name,
            "source_date": valid_record.get("source_date"),
            "is_synthetic": self.is_synthetic,
            "created_at": valid_record.get("created_at", datetime.utcnow().isoformat()),
            "updated_at": datetime.utcnow().isoformat()
        }
