"""
JANSETU — Impact Evaluation Repository (Phase 9)
Data Access Repository for Closed-Loop Impact Measurements persisted in
`jansetu_intel.impact_metrics`.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger

class ImpactRepository(BaseRepository):
    """
    Phase 9 Data Access Repository for Closed-Loop Impact Evaluations.
    Maintains baseline snapshots, verified observations, deterministic calculations,
    and Phase 8 scenario validation links in `impact_metrics`.
    """
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="impact_metrics", primary_key="evaluation_id")
        self._ensure_seed_records()

    def _ensure_seed_records(self) -> None:
        """Seeds canonical initial evaluations if not present in table."""
        records = self.db.get_records(self.table_name)
        existing_ids = {r.get("evaluation_id") or r.get("impact_id") for r in records}

        now_str = datetime.utcnow().isoformat()
        canonical_seed = [
            {
                "evaluation_id": "EVAL-IND_TN_DHM_HRR-WATER-001",
                "impact_id": "IMP-001",
                "geo_id": "IND_TN_DHM_HRR",
                "region_name": "Harur Block",
                "state_name": "Tamil Nadu",
                "sector": "water_security",
                "intervention_id": "PRJ-TN-001",
                "project_id": "PRJ-TN-001",
                "project_name": "Harur Rural Deep Borewell & Solar Pumping Grid",
                "scenario_id": "SCN-IND_TN_DHM_HRR-WATER-F104A1",
                "baseline_period": "2024-04-01",
                "observation_period": "2025-06-30",
                "commenced_date": "2024-04-01",
                "evaluation_date": "2025-06-30",
                "indicator": {
                    "indicator_id": "IND-WATER-COV-01",
                    "name": "Piped Drinking Water Household Coverage",
                    "sector": "water_security",
                    "unit": "percentage",
                    "direction": "HIGHER_IS_BETTER",
                    "baseline_source": "Jal Jeevan Mission Rural Baseline 2024",
                    "observation_source": "Ministry of Jal Shakti Independent Field Audit 2026",
                    "description": "Percentage of rural habitations with functional tap water connection."
                },
                "baseline_snapshot": {
                    "baseline_id": "BASE-IND_TN_DHM_HRR-WATER-001",
                    "geo_id": "IND_TN_DHM_HRR",
                    "sector": "water_security",
                    "indicator": {
                        "indicator_id": "IND-WATER-COV-01",
                        "name": "Piped Drinking Water Household Coverage",
                        "sector": "water_security",
                        "unit": "percentage",
                        "direction": "HIGHER_IS_BETTER",
                        "baseline_source": "Jal Jeevan Mission Rural Baseline 2024",
                        "observation_source": "Ministry of Jal Shakti Independent Field Audit 2026"
                    },
                    "value": 42.0,
                    "unit": "percentage",
                    "source": "Jal Jeevan Mission Rural Baseline 2024",
                    "source_date": "2024-04-01",
                    "evidence_ids": ["EV-5127A0-INF-01", "EVD-TN-DHM-01"],
                    "provenance": "VERIFIED",
                    "classification": "HISTORICAL_FACT",
                    "snapshot_timestamp": "2024-04-01T00:00:00"
                },
                "observation": {
                    "observation_id": "OBS-IND_TN_DHM_HRR-WATER-001",
                    "evaluation_id": "EVAL-IND_TN_DHM_HRR-WATER-001",
                    "geo_id": "IND_TN_DHM_HRR",
                    "indicator": {
                        "indicator_id": "IND-WATER-COV-01",
                        "name": "Piped Drinking Water Household Coverage",
                        "sector": "water_security",
                        "unit": "percentage",
                        "direction": "HIGHER_IS_BETTER",
                        "baseline_source": "Jal Jeevan Mission Rural Baseline 2024",
                        "observation_source": "Ministry of Jal Shakti Independent Field Audit 2026"
                    },
                    "value": 68.0,
                    "unit": "percentage",
                    "observation_date": "2025-06-30",
                    "source": "Ministry of Jal Shakti Independent Field Audit 2025",
                    "source_type": "OFFICIAL_FIELD_AUDIT",
                    "provenance": "VERIFIED",
                    "evidence_ids": ["EV-OBS-HRR-2026-01"],
                    "quality_status": "VERIFIED",
                    "classification": "OBSERVED_OUTCOME",
                    "recorded_at": "2026-04-01T10:00:00"
                },
                "calculation": {
                    "absolute_change": 26.0,
                    "percentage_change": 61.9,
                    "target_gap": 3.0,
                    "target_achievement_pct": 104.6,
                    "is_improvement": True,
                    "classification": "IMPACT_ESTIMATE"
                },
                "scenario_comparison": {
                    "scenario_id": "SCN-IND_TN_DHM_HRR-WATER-F104A1",
                    "scenario_estimate": 67.0,
                    "scenario_estimate_classification": "SCENARIO_ESTIMATE",
                    "observed_outcome": 68.0,
                    "observed_outcome_classification": "OBSERVED_OUTCOME",
                    "scenario_outcome_difference": 1.0,
                    "predicted_change": 25.0,
                    "observed_change": 26.0,
                    "prediction_error": 1.0,
                    "absolute_prediction_error": 1.0,
                    "relative_prediction_error": 0.04,
                    "directional_consistency": True,
                    "label": "Scenario-to-Outcome Difference",
                    "disclaimer": "Phase 8 Scenario Estimate — Not an Observed Outcome"
                },
                "target_value": 65.0,
                "evaluation_type": "DESCRIPTIVE_BEFORE_AFTER",
                "attribution_level": "DESCRIPTIVE_ONLY",
                "attribution_statement": "The observed indicator changed by 61.9% (+26.0 percentage points) between baseline and post-intervention measurement.",
                "data_quality": "HIGH",
                "confounders": [
                    {
                        "factor_type": "seasonal_variation",
                        "description": "Summer seasonal water table dip partially offset by ground recharge.",
                        "classification": "CONTEXTUAL_FACTOR"
                    }
                ],
                "evidence_ids": ["EV-5127A0-INF-01", "EV-OBS-HRR-2026-01"],
                "limitations": [
                    "Descriptive before/after evaluation only; no randomized control group available.",
                    "Ignores localized groundwater salinity fluctuations across sub-habitations.",
                    "Administrative field verification recommended before policy scaling."
                ],
                "is_verified": True,
                "evaluation_status": "COMPLETED",
                "model_version": "v9.0-impact-evaluation",
                "created_at": now_str,
                "governance_notice": "AI-Derived Analytical Signal — Not Official Policy",
                "disclaimer": "OBSERVED OUTCOME — MEASURED DATA. Causality is descriptive unless explicitly validated.",
                # Legacy fields
                "before_accessibility_pct": 42.0,
                "after_accessibility_pct": 68.0,
                "accessibility_gain_pct": 26.0,
                "before_monthly_requests": 4820,
                "after_monthly_requests": 1904,
                "request_reduction_pct": 60.5,
                "measured_sentiment_recovery": 0.48,
                "is_verified_by_audit": True
            },
            {
                "evaluation_id": "EVAL-IND_UP_VAR_PND-ROAD-001",
                "impact_id": "IMP-002",
                "geo_id": "IND_UP_VAR_PND",
                "region_name": "Pindra Block",
                "state_name": "Uttar Pradesh",
                "sector": "road_transport",
                "intervention_id": "PRJ-UP-002",
                "project_id": "PRJ-UP-002",
                "project_name": "Pindra Rural Highway All-Weather Link Phase 2",
                "scenario_id": "SCN-IND_UP_VAR_PND-ROAD-E4B221",
                "baseline_period": "2024-06-01",
                "observation_period": "2026-01-15",
                "commenced_date": "2024-06-01",
                "evaluation_date": "2026-01-15",
                "indicator": {
                    "indicator_id": "IND-ROAD-TIME-01",
                    "name": "Average Transit Travel Time to Nearest Taluk Center",
                    "sector": "road_transport",
                    "unit": "minutes",
                    "direction": "LOWER_IS_BETTER",
                    "baseline_source": "PMGSY Transport Rural Survey 2024",
                    "observation_source": "UP State Road Transport Telemetry Audit 2026",
                    "description": "Average commuting duration in minutes during peak market hours."
                },
                "baseline_snapshot": {
                    "baseline_id": "BASE-IND_UP_VAR_PND-ROAD-001",
                    "geo_id": "IND_UP_VAR_PND",
                    "sector": "road_transport",
                    "indicator": {
                        "indicator_id": "IND-ROAD-TIME-01",
                        "name": "Average Transit Travel Time to Nearest Taluk Center",
                        "sector": "road_transport",
                        "unit": "minutes",
                        "direction": "LOWER_IS_BETTER",
                        "baseline_source": "PMGSY Transport Rural Survey 2024",
                        "observation_source": "UP State Road Transport Telemetry Audit 2026"
                    },
                    "value": 55.0,
                    "unit": "minutes",
                    "source": "PMGSY Transport Rural Survey 2024",
                    "source_date": "2024-06-01",
                    "evidence_ids": ["EV-UP-PND-TRN-01"],
                    "provenance": "VERIFIED",
                    "classification": "HISTORICAL_FACT",
                    "snapshot_timestamp": "2024-06-01T00:00:00"
                },
                "observation": {
                    "observation_id": "OBS-IND_UP_VAR_PND-ROAD-001",
                    "evaluation_id": "EVAL-IND_UP_VAR_PND-ROAD-001",
                    "geo_id": "IND_UP_VAR_PND",
                    "indicator": {
                        "indicator_id": "IND-ROAD-TIME-01",
                        "name": "Average Transit Travel Time to Nearest Taluk Center",
                        "sector": "road_transport",
                        "unit": "minutes",
                        "direction": "LOWER_IS_BETTER",
                        "baseline_source": "PMGSY Transport Rural Survey 2024",
                        "observation_source": "UP State Road Transport Telemetry Audit 2026"
                    },
                    "value": 35.0,
                    "unit": "minutes",
                    "observation_date": "2026-01-15",
                    "source": "UP State Road Transport Telemetry Audit 2026",
                    "source_type": "OFFICIAL_FIELD_AUDIT",
                    "provenance": "VERIFIED",
                    "evidence_ids": ["EV-OBS-PND-2026-02"],
                    "quality_status": "VERIFIED",
                    "classification": "OBSERVED_OUTCOME",
                    "recorded_at": "2026-01-20T10:00:00"
                },
                "calculation": {
                    "absolute_change": -20.0,
                    "percentage_change": -36.4,
                    "target_gap": 5.0,
                    "target_achievement_pct": 80.0,
                    "is_improvement": True,
                    "classification": "IMPACT_ESTIMATE"
                },
                "scenario_comparison": {
                    "scenario_id": "SCN-IND_UP_VAR_PND-ROAD-E4B221",
                    "scenario_estimate": 38.0,
                    "scenario_estimate_classification": "SCENARIO_ESTIMATE",
                    "observed_outcome": 35.0,
                    "observed_outcome_classification": "OBSERVED_OUTCOME",
                    "scenario_outcome_difference": -3.0,
                    "predicted_change": -17.0,
                    "observed_change": -20.0,
                    "prediction_error": -3.0,
                    "absolute_prediction_error": 3.0,
                    "relative_prediction_error": 0.176,
                    "directional_consistency": True,
                    "label": "Scenario-to-Outcome Difference",
                    "disclaimer": "Phase 8 Scenario Estimate — Not an Observed Outcome"
                },
                "target_value": 30.0,
                "evaluation_type": "DESCRIPTIVE_BEFORE_AFTER",
                "attribution_level": "DESCRIPTIVE_ONLY",
                "attribution_statement": "The observed indicator changed by -36.4% (-20.0 minutes) between baseline and post-intervention measurement.",
                "data_quality": "HIGH",
                "confounders": [
                    {
                        "factor_type": "parallel_infrastructure_project",
                        "description": "Concurrently constructed rail overbridge reduced intersection bottlenecks.",
                        "classification": "CONTEXTUAL_FACTOR"
                    }
                ],
                "evidence_ids": ["EV-UP-PND-TRN-01", "EV-OBS-PND-2026-02"],
                "limitations": [
                    "Descriptive before/after evaluation only; travel time fluctuates with seasonal agricultural traffic.",
                    "Causality not proven without controlled non-intervention corridor comparison."
                ],
                "is_verified": True,
                "evaluation_status": "COMPLETED",
                "model_version": "v9.0-impact-evaluation",
                "created_at": now_str,
                "governance_notice": "AI-Derived Analytical Signal — Not Official Policy",
                "disclaimer": "OBSERVED OUTCOME — MEASURED DATA. Causality is descriptive unless explicitly validated.",
                # Legacy fields
                "before_accessibility_pct": 35.0,
                "after_accessibility_pct": 65.0,
                "accessibility_gain_pct": 30.0,
                "before_monthly_requests": 3410,
                "after_monthly_requests": 1120,
                "request_reduction_pct": 67.2,
                "measured_sentiment_recovery": 0.52,
                "is_verified_by_audit": True
            }
        ]

        to_insert = [c for c in canonical_seed if c["evaluation_id"] not in existing_ids and c["impact_id"] not in existing_ids]
        if to_insert:
            self.db.insert_records(self.table_name, to_insert)
            logger.info(f"Seeded {len(to_insert)} canonical impact evaluations into warehouse.")

    def get_evaluation(self, evaluation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single evaluation by its unique evaluation_id or legacy impact_id."""
        self._ensure_seed_records()
        records = self.db.get_records(self.table_name)
        for r in records:
            if r.get("evaluation_id") == evaluation_id or r.get("impact_id") == evaluation_id:
                return r
        return None

    def create_evaluation(self, evaluation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Idempotent persistence for an impact evaluation.
        If evaluation_id already exists, updates record without duplicates.
        """
        eval_id = evaluation_data.get("evaluation_id")
        if not eval_id:
            raise ValueError("evaluation_data must contain 'evaluation_id'")

        existing = self.get_evaluation(eval_id)
        now_str = datetime.utcnow().isoformat()

        if existing:
            evaluation_data["updated_at"] = now_str
            self.db.update_record(self.table_name, "evaluation_id", eval_id, evaluation_data)
            logger.debug(f"Updated existing impact evaluation '{eval_id}'.")
            return evaluation_data

        if "created_at" not in evaluation_data:
            evaluation_data["created_at"] = now_str
        evaluation_data["updated_at"] = now_str

        self.create_record(evaluation_data)
        logger.info(f"Persisted new impact evaluation '{eval_id}'.")
        return evaluation_data

    def list_evaluations(
        self,
        geo_id: Optional[str] = None,
        sector: Optional[str] = None,
        evaluation_type: Optional[str] = None,
        data_quality: Optional[str] = None,
        attribution_level: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieves filterable list of impact evaluations."""
        self._ensure_seed_records()
        records = self.db.get_records(self.table_name)
        results: List[Dict[str, Any]] = []

        for r in records:
            if geo_id and r.get("geo_id") != geo_id:
                continue

            if sector and sector.lower() != "all":
                r_sec = r.get("sector") or r.get("category", "")
                if r_sec.lower() != sector.lower():
                    continue

            if evaluation_type and evaluation_type.upper() != "ALL":
                r_type = r.get("evaluation_type", "")
                if r_type.upper() != evaluation_type.upper():
                    continue

            if data_quality and data_quality.upper() != "ALL":
                r_dq = r.get("data_quality", "")
                if r_dq.upper() != data_quality.upper():
                    continue

            if attribution_level and attribution_level.upper() != "ALL":
                r_attr = r.get("attribution_level", "")
                if r_attr.upper() != attribution_level.upper():
                    continue

            results.append(r)
            if len(results) >= limit:
                break

        return results

    def create_observation(self, evaluation_id: str, observation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Attaches a verified post-intervention outcome observation to an evaluation."""
        eval_record = self.get_evaluation(evaluation_id)
        if not eval_record:
            return None

        eval_record["observation"] = observation_data
        eval_record["updated_at"] = datetime.utcnow().isoformat()
        self.db.update_record(self.table_name, "evaluation_id", eval_record.get("evaluation_id"), eval_record)
        return eval_record

    def get_model_validation(self) -> Dict[str, Any]:
        """
        Aggregates evaluations that have both a Phase 8 scenario and an observed outcome
        to compute directional consistency and prediction errors.
        """
        self._ensure_seed_records()
        records = self.db.get_records(self.table_name)
        evaluated_scenarios = [
            r for r in records
            if r.get("scenario_comparison") and r.get("observation")
        ]

        total_scenarios = len(evaluated_scenarios)
        if total_scenarios == 0:
            return {
                "total_scenarios_evaluated": 0,
                "total_evaluations_count": len(records),
                "mean_absolute_prediction_error": None,
                "directional_consistency_rate": None,
                "evaluations_by_sector": {},
                "data_quality_distribution": {},
                "model_version": "v9.0-impact-evaluation",
                "disclaimer": "AI-Derived Analytical Signal — Model Validation Only. Does Not Reflect Single Policy Score."
            }

        abs_errors = []
        consistent_count = 0
        sector_counts: Dict[str, int] = {}
        dq_counts: Dict[str, int] = {}

        for r in evaluated_scenarios:
            sc = r.get("scenario_comparison", {})
            ape = sc.get("absolute_prediction_error")
            if ape is not None:
                abs_errors.append(ape)
            if sc.get("directional_consistency"):
                consistent_count += 1

            sec = r.get("sector", "unknown")
            sector_counts[sec] = sector_counts.get(sec, 0) + 1

            dq = r.get("data_quality", "HIGH")
            dq_counts[dq] = dq_counts.get(dq, 0) + 1

        mape = round(sum(abs_errors) / max(len(abs_errors), 1), 2) if abs_errors else None
        dc_rate = round((consistent_count / total_scenarios) * 100, 1)

        return {
            "total_scenarios_evaluated": total_scenarios,
            "total_evaluations_count": len(records),
            "mean_absolute_prediction_error": mape,
            "directional_consistency_rate": dc_rate,
            "evaluations_by_sector": sector_counts,
            "data_quality_distribution": dq_counts,
            "model_version": "v9.0-impact-evaluation",
            "disclaimer": "AI-Derived Analytical Signal — Model Validation Only. Does Not Reflect Single Policy Score."
        }
