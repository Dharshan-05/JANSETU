from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger

class SilentNeedRepository(BaseRepository):
    """
    Phase 6 Data Access Repository for Potential Silent Need Signals
    persisted in `jansetu_intel.silent_need_signals`.
    """
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="silent_need_signals", primary_key="signal_id")

    def get_by_signal_id(self, signal_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single silent need signal by its deterministic identifier."""
        return self.get_by_id(signal_id)

    def upsert(self, signal_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Idempotent persistence for silent need signals.
        Updates existing record if signal_id exists, or inserts new record.
        Prevents duplicate signal records when evaluation pipelines re-run.
        """
        signal_id = signal_record.get("signal_id")
        if not signal_id:
            raise ValueError("signal_record must contain 'signal_id'")

        existing = self.get_by_id(signal_id)
        now_str = datetime.utcnow().isoformat()

        if existing:
            signal_record["updated_at"] = now_str
            self.update_by_id(signal_id, signal_record)
            logger.debug(f"Updated existing silent need signal '{signal_id}' in warehouse.")
            return signal_record

        if "created_at" not in signal_record:
            signal_record["created_at"] = now_str
        if "updated_at" not in signal_record:
            signal_record["updated_at"] = now_str

        self.create_record(signal_record)
        return signal_record

    def list(
        self,
        geo_id: Optional[str] = None,
        geo_level: Optional[Union[str, int]] = None,
        category: Optional[str] = None,
        state_code: Optional[str] = None,
        district: Optional[str] = None,
        block: Optional[str] = None,
        min_signal_strength: Optional[float] = None,
        signal_class: Optional[str] = None,
        triggered: Optional[bool] = None,
        min_discrepancy: Optional[float] = None,
        min_infra_deficit: Optional[float] = None,
        max_digital_access: Optional[float] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves filtered list of silent need signals with multi-dimensional criteria.
        """
        records = self.db.get_records(self.table_name)
        geos = {g.get("geo_id"): g for g in self.db.get_records("geography")}

        results: List[Dict[str, Any]] = []
        for s in records:
            gid = s.get("geo_id")
            geo = geos.get(gid, {})

            if geo_id and gid != geo_id:
                continue

            if geo_level is not None and str(geo.get("geo_level")) != str(geo_level):
                continue

            if category and category.lower() != "all":
                s_cat = s.get("category", "")
                if s_cat.lower() != category.lower():
                    continue

            if state_code and state_code.lower() != "all":
                geo_st = geo.get("state_code", "")
                sig_st = s.get("state_name", "")
                if geo_st.upper() != state_code.upper() and sig_st.upper() != state_code.upper():
                    continue

            if district:
                reg_name = s.get("region_name", "")
                if district.lower() not in reg_name.lower() and district.lower() not in gid.lower():
                    continue

            if block:
                reg_name = s.get("region_name", "")
                if block.lower() not in reg_name.lower():
                    continue

            if signal_class and signal_class.lower() != "all":
                s_cls = s.get("signal_class", "")
                if s_cls.upper() != signal_class.upper():
                    continue

            if triggered is not None:
                is_trig = s.get("triggered", True)
                if bool(is_trig) != bool(triggered):
                    continue

            strength = float(s.get("signal_strength", s.get("signal_confidence", 0.0)) or 0.0)
            if min_signal_strength is not None and strength < min_signal_strength:
                continue

            disc = float(s.get("discrepancy", s.get("discrepancy_magnitude", 0.0)) or 0.0)
            if min_discrepancy is not None and disc < min_discrepancy:
                continue

            infra = float(s.get("infra_deficit", s.get("infra_deficit_score", 0.0)) or 0.0)
            if min_infra_deficit is not None and infra < min_infra_deficit:
                continue

            digital = float(s.get("digital_access", s.get("digital_access_score", 1.0)) or 1.0)
            if max_digital_access is not None and digital > max_digital_access:
                continue

            item = dict(s)
            item.setdefault("disclaimer", "AI-Derived Analytical Signal — Not Official Policy")
            item.setdefault("validation_requirement", "Potential Silent Need Signal — requires administrative field validation.")
            results.append(item)

        # Sort by signal_strength descending
        results.sort(
            key=lambda x: float(x.get("signal_strength", x.get("signal_confidence", 0.0)) or 0.0),
            reverse=True
        )

        return results[:limit]

    def count(
        self,
        category: Optional[str] = None,
        signal_class: Optional[str] = None,
        triggered: Optional[bool] = None
    ) -> int:
        """Returns total count of matching signals."""
        records = self.list(category=category, signal_class=signal_class, triggered=triggered, limit=10000)
        return len(records)

    def summary(self) -> Dict[str, Any]:
        """Calculates aggregated telemetry summary across silent need signals."""
        records = self.db.get_records(self.table_name)
        geos = self.db.get_records("geography")

        cat_counts: Dict[str, int] = {}
        state_counts: Dict[str, int] = {}
        potential_count = 0
        strong_count = 0
        total_signals = 0

        for s in records:
            # Only count actual triggered signals towards silent need metrics
            is_trig = s.get("triggered", True)
            if not is_trig:
                continue

            total_signals += 1
            cat = s.get("category", "other").lower()
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

            st = s.get("state_name", "Unknown")
            state_counts[st] = state_counts.get(st, 0) + 1

            s_class = s.get("signal_class", "POTENTIAL")
            if s_class == "STRONG_POTENTIAL":
                strong_count += 1
            elif s_class == "POTENTIAL":
                potential_count += 1

        return {
            "total_geographies_analyzed": len(geos),
            "total_signals": total_signals,
            "potential_signals": potential_count,
            "strong_potential_signals": strong_count,
            "categories": cat_counts,
            "states": state_counts,
            "analytical_version": "v6.0-deterministic",
            "disclaimer": "AI-Derived Analytical Signal — Not Official Policy"
        }
