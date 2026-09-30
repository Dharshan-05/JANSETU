from typing import Dict, Any, List, Set, Optional
from datetime import datetime
from app.schemas.data_schemas import DataQualityReport, TableQualitySummary
from pipelines.validation.validators import DataValidator

class DataQualityAuditor:
    """
    Computes comprehensive data quality metrics across JANSETU's BigQuery warehouse.
    Detects null rates, invalid values, orphan foreign keys, duplicates, and provenance.
    """

    PRIMARY_KEYS = {
        "geography": "geo_id",
        "demographics": "geo_id",
        "infrastructure": ["geo_id", "indicator_name"],
        "investments": "project_id",
        "citizen_requests": "request_id",
        "citizen_request_embeddings": "request_id",
        "demand_clusters": "cluster_id",
        "hotspots": "hotspot_id",
        "silent_need_signals": "signal_id",
        "evidence_records": "evidence_id",
        "policy_scenarios": "scenario_id",
        "impact_metrics": "impact_id"
    }

    @classmethod
    def audit_store(cls, store: Dict[str, List[Dict[str, Any]]]) -> DataQualityReport:
        total_records = 0
        table_summaries: Dict[str, TableQualitySummary] = {}
        all_sources: Set[str] = set()
        missing_geo_references = 0

        # Step 1: Collect valid geography IDs
        geo_records = store.get("geography", [])
        known_geo_ids: Set[str] = {g.get("geo_id") for g in geo_records if g.get("geo_id")}

        # Step 2: Validate geography hierarchy integrity
        geo_hierarchy_valid = True
        for g in geo_records:
            is_valid, _ = DataValidator.validate_geography(g, known_geo_ids)
            if not is_valid:
                geo_hierarchy_valid = False

        # Step 3: Audit each canonical table
        for table_name, records in store.items():
            count = len(records)
            total_records += count
            pk_field = cls.PRIMARY_KEYS.get(table_name, "id")

            seen_pks = set()
            duplicates = 0
            null_count = 0
            total_fields_checked = 0
            valid_rows = 0
            invalid_rows = 0
            synthetic_count = 0
            official_count = 0
            sources = set()

            for row in records:
                # Primary key check (handles single or composite key)
                if isinstance(pk_field, list):
                    pk_val = tuple(row.get(f) for f in pk_field)
                    if all(v is not None for v in pk_val):
                        if pk_val in seen_pks:
                            duplicates += 1
                        seen_pks.add(pk_val)
                else:
                    pk = row.get(pk_field)
                    if pk:
                        if pk in seen_pks:
                            duplicates += 1
                        seen_pks.add(pk)

                # Null field rate check
                for k, v in row.items():
                    total_fields_checked += 1
                    if v is None:
                        null_count += 1

                # Synthetic / Official count
                is_synth = row.get("is_synthetic", False)
                if is_synth:
                    synthetic_count += 1
                else:
                    official_count += 1

                # Source tracking
                src = row.get("source") or row.get("source_dataset") or row.get("data_source") or "UNKNOWN"
                sources.add(src)
                all_sources.add(src)

                # Foreign key check against geography
                if table_name not in ["geography", "policy_scenarios"]:
                    row_geo_id = row.get("geo_id")
                    if row_geo_id and row_geo_id not in known_geo_ids:
                        missing_geo_references += 1

                # Row validity evaluation
                is_valid = True
                if table_name == "geography":
                    is_valid, _ = DataValidator.validate_geography(row, known_geo_ids)
                elif table_name == "demographics":
                    is_valid, _ = DataValidator.validate_demographics(row, known_geo_ids)
                elif table_name == "infrastructure":
                    is_valid, _ = DataValidator.validate_infrastructure(row, known_geo_ids)
                elif table_name == "investments":
                    is_valid, _ = DataValidator.validate_investment(row, known_geo_ids)
                elif table_name == "citizen_requests":
                    is_valid, _ = DataValidator.validate_citizen_request(row, known_geo_ids)

                if is_valid:
                    valid_rows += 1
                else:
                    invalid_rows += 1

            null_rate = (null_count / total_fields_checked * 100.0) if total_fields_checked > 0 else 0.0

            table_summaries[table_name] = TableQualitySummary(
                table_name=table_name,
                row_count=count,
                valid_rows=valid_rows,
                invalid_rows=invalid_rows,
                null_rate_percentage=round(null_rate, 2),
                duplicate_count=duplicates,
                synthetic_count=synthetic_count,
                official_count=official_count,
                sources=sorted(list(sources))
            )

        status = "HEALTHY"
        if not geo_hierarchy_valid or missing_geo_references > 0:
            status = "WARNING"
        for summary in table_summaries.values():
            if summary.invalid_rows > 0 or summary.duplicate_count > 0:
                status = "WARNING"

        return DataQualityReport(
            total_records=total_records,
            table_summaries=table_summaries,
            geographic_hierarchy_valid=geo_hierarchy_valid,
            missing_geo_references=missing_geo_references,
            provenance_sources=sorted(list(all_sources)),
            status=status,
            timestamp=datetime.utcnow()
        )
