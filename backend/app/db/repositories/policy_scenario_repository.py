"""
JANSETU — Policy Scenario Repository (Phase 8)
Data Access Repository for Policy Sandbox scenarios persisted in
`jansetu_intel.policy_scenarios`.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger


class PolicyScenarioRepository(BaseRepository):
    """
    Phase 8 Data Access Repository for Policy Sandbox Scenarios.
    Maintains deterministic scenario records, assumptions, estimates,
    and versioning without destructive deletion.
    """
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="policy_scenarios", primary_key="scenario_id")

    def get_scenario(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single scenario by its unique deterministic ID."""
        return self.get_by_id(scenario_id)

    def create_scenario(self, scenario_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Idempotent persistence for policy scenario runs.
        If scenario_id already exists, updates record (or preserves versioned state).
        """
        scenario_id = scenario_data.get("scenario_id")
        if not scenario_id:
            raise ValueError("scenario_data must contain 'scenario_id'")

        existing = self.get_by_id(scenario_id)
        now_str = datetime.utcnow().isoformat()

        if existing:
            scenario_data["updated_at"] = now_str
            self.update_by_id(scenario_id, scenario_data)
            logger.debug(f"Updated existing policy scenario '{scenario_id}' in warehouse.")
            return scenario_data

        if "created_at" not in scenario_data:
            scenario_data["created_at"] = now_str
        if "updated_at" not in scenario_data:
            scenario_data["updated_at"] = now_str

        self.create_record(scenario_data)
        logger.info(f"Persisted new policy scenario '{scenario_id}' in warehouse.")
        return scenario_data

    def list_scenarios(
        self,
        geo_id: Optional[str] = None,
        sector: Optional[str] = None,
        intervention_type: Optional[str] = None,
        scenario_version: Optional[int] = None,
        include_archived: bool = False,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves filterable list of policy scenarios.
        """
        records = self.db.get_records(self.table_name)
        results: List[Dict[str, Any]] = []

        for r in records:
            if not include_archived and r.get("is_archived", False):
                continue

            if geo_id and r.get("geo_id") != geo_id:
                continue

            if sector and sector.lower() != "all":
                r_sec = r.get("sector") or r.get("category", "")
                if r_sec.lower() != sector.lower():
                    continue

            if intervention_type and intervention_type.upper() != "ALL":
                r_type = r.get("intervention_type", "")
                if r_type.upper() != intervention_type.upper():
                    continue

            if scenario_version is not None and r.get("scenario_version") != scenario_version:
                continue

            results.append(r)
            if len(results) >= limit:
                break

        return results

    def compare_scenarios(self, scenario_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Retrieves multiple scenarios for side-by-side neutral comparison.
        """
        found = []
        for sid in scenario_ids:
            sc = self.get_by_id(sid)
            if sc:
                found.append(sc)
        return found

    def archive_scenario(self, scenario_id: str) -> bool:
        """
        Soft-archives a scenario without physically destroying historical audit logs.
        """
        existing = self.get_by_id(scenario_id)
        if not existing:
            return False

        return self.update_by_id(scenario_id, {
            "is_archived": True,
            "archived_at": datetime.utcnow().isoformat()
        })
