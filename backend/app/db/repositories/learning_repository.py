"""
JANSETU — Learning & Continuous Calibration Repository (Phase 10)
Data Access Repository for learning candidates, versioned model parameters,
and governance audit trails in `jansetu_analytics`.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger

class LearningRepository(BaseRepository):
    """
    Phase 10 Repository managing:
    - learning_candidates (candidate calibrations derived from Phase 9 observations)
    - model_versions (immutable versioned model configurations)
    - learning_audit_events (immutable audit log of all transitions)
    """

    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="learning_candidates", primary_key="learning_id")
        self.versions_table = "model_versions"
        self.audit_table = "learning_audit_events"
        self._ensure_seed_records()

    def _ensure_seed_records(self) -> None:
        """Seeds canonical initial model versions and baseline candidate if not present."""
        # 1. Seed Active Baseline Model Versions
        version_records = self.db.get_records(self.versions_table)
        existing_versions = {r.get("model_version") for r in version_records}

        initial_versions = [
            {
                "model_version": "v8.0-deterministic",
                "model_family": "SCENARIO_SIMULATION",
                "parameters": {
                    "scenario_effectiveness_factor": 1.0,
                    "target_population_elasticity": 1.0
                },
                "status": "ACTIVE",
                "parent_version": None,
                "created_at": "2025-01-01T00:00:00",
                "activated_at": "2025-01-01T00:00:00",
                "activated_by": "System Initialization",
                "description": "Deterministic counterfactual scenario simulation engine baseline"
            },
            {
                "model_version": "v5.0-deterministic",
                "model_family": "DEMAND_HOTSPOT",
                "parameters": {
                    "voice_density_weight": 0.40,
                    "demand_velocity_weight": 0.20,
                    "population_exposure_weight": 0.25,
                    "category_concentration_weight": 0.15
                },
                "status": "ACTIVE",
                "parent_version": None,
                "created_at": "2025-01-01T00:00:00",
                "activated_at": "2025-01-01T00:00:00",
                "activated_by": "System Initialization",
                "description": "Deterministic citizen demand hotspot prioritization baseline"
            },
            {
                "model_version": "v6.0-deterministic",
                "model_family": "SILENT_NEED",
                "parameters": {
                    "silent_need_discrepancy_weight": 0.50,
                    "infra_deficit_weight": 0.30,
                    "digital_exclusion_weight": 0.20
                },
                "status": "ACTIVE",
                "parent_version": None,
                "created_at": "2025-01-01T00:00:00",
                "activated_at": "2025-01-01T00:00:00",
                "activated_by": "System Initialization",
                "description": "Potential Silent Need discrepancy and deficit detection baseline"
            }
        ]

        for v in initial_versions:
            if v["model_version"] not in existing_versions:
                self.db.insert_records(self.versions_table, [v])

        # 2. Seed Canonical Learning Candidate
        candidates = self.db.get_records(self.table_name)
        existing_candidate_ids = {c.get("learning_id") for c in candidates}

        if "LRN-SCENARIO-001" not in existing_candidate_ids:
            canonical_candidate = {
                "learning_id": "LRN-SCENARIO-001",
                "model_family": "SCENARIO_SIMULATION",
                "source_version": "v8.0-deterministic",
                "target_version": "v10.0-candidate-001",
                "source_evaluation_ids": [
                    "EVAL-IND_TN_DHM_HRR-WATER-001",
                    "EVAL-IND_UP_STP_SAD-HEALTH-002",
                    "EVAL-IND_BR_GAY_BOD-ROAD-003",
                    "EVAL-IND_MP_JHB_MEG-POWER-004",
                    "EVAL-IND_RJ_JAL_KUK-WATER-005",
                    "EVAL-IND_OD_MYB_KRP-EDU-006",
                    "EVAL-007", "EVAL-008", "EVAL-009", "EVAL-010",
                    "EVAL-011", "EVAL-012", "EVAL-013", "EVAL-014"
                ],
                "training_window": {
                    "start": "2024-01-01",
                    "end": "2025-06-30"
                },
                "validation_window": {
                    "start": "2025-07-01",
                    "end": "2026-03-31"
                },
                "parameters": [
                    {
                        "parameter_name": "scenario_effectiveness_factor",
                        "current_value": 1.0,
                        "candidate_value": 0.88,
                        "min_value": 0.10,
                        "max_value": 2.0,
                        "supported_range": [0.10, 2.0],
                        "description": "Multiplicative scaling factor adjusting hypothetical coverage to empirical outcome yield",
                        "evidence_count": 14,
                        "validation_metric": "MAE",
                        "relative_change": -12.0
                    }
                ],
                "metrics": {
                    "sample_size": 14,
                    "mae_before": 0.082,
                    "mae_candidate": 0.067,
                    "mape_before": 0.124,
                    "mape_candidate": 0.089,
                    "directional_consistency_before": 0.71,
                    "directional_consistency_candidate": 0.86,
                    "mean_prediction_error_before": 0.024,
                    "mean_prediction_error_candidate": 0.005,
                    "validation_sample_size": 6,
                    "validation_mae_before": 0.082,
                    "validation_mae_candidate": 0.067,
                    "validation_directional_consistency_before": 0.71,
                    "validation_directional_consistency_candidate": 0.86
                },
                "status": "CANDIDATE",
                "created_at": "2026-04-01T08:00:00",
                "updated_at": "2026-04-01T08:00:00",
                "reviewed_by": None,
                "review_notes": None,
                "notes": "Candidate derived from multi-state rural infrastructure outcomes",
                "disclaimer": "CALIBRATION CANDIDATE — Model estimate derived from historical data. Not an automatically active model. Requires administrative review."
            }
            self.db.insert_records(self.table_name, [canonical_candidate])

            # Seed initial audit event
            audit_records = self.db.get_records(self.audit_table)
            if not audit_records:
                initial_audit = {
                    "event_id": f"AUD-EVT-{uuid.uuid4().hex[:8]}",
                    "learning_id": "LRN-SCENARIO-001",
                    "model_version": "v10.0-candidate-001",
                    "action": "CREATED",
                    "actor": "System Calibration Scheduler",
                    "timestamp": "2026-04-01T08:00:00",
                    "previous_status": None,
                    "new_status": "CANDIDATE",
                    "reason": "Periodic historical outcome calibration generation"
                }
                self.db.insert_records(self.audit_table, [initial_audit])

    # =========================================================================
    # CANDIDATE METHODS
    # =========================================================================

    def create_candidate(self, candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Creates or upserts a learning candidate."""
        self._ensure_seed_records()
        learning_id = candidate.get("learning_id")
        records = self.db.get_records(self.table_name)
        existing_idx = next((i for i, r in enumerate(records) if r.get("learning_id") == learning_id), None)

        if existing_idx is not None:
            records[existing_idx] = candidate
        else:
            self.db.insert_records(self.table_name, [candidate])

        # Record audit event
        self.create_audit_event({
            "event_id": f"AUD-EVT-{uuid.uuid4().hex[:8]}",
            "learning_id": learning_id,
            "model_version": candidate.get("target_version"),
            "action": "CREATED",
            "actor": candidate.get("reviewed_by") or "System",
            "timestamp": datetime.utcnow().isoformat(),
            "previous_status": None,
            "new_status": candidate.get("status", "CANDIDATE"),
            "reason": candidate.get("notes") or "Created calibration candidate"
        })
        return candidate

    def get_candidate(self, learning_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a learning candidate by ID."""
        self._ensure_seed_records()
        records = self.db.get_records(self.table_name)
        for r in records:
            if r.get("learning_id") == learning_id:
                return r
        return None

    def list_candidates(
        self,
        model_family: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Lists learning candidates with optional filtering."""
        self._ensure_seed_records()
        records = self.db.get_records(self.table_name)
        results = []
        for r in records:
            if model_family and model_family != "all" and r.get("model_family") != model_family:
                continue
            if status and status != "all" and r.get("status") != status:
                continue
            results.append(r)
        return results[:limit]

    def update_candidate_status(
        self,
        learning_id: str,
        new_status: str,
        actor: str = "Admin",
        notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Updates candidate status with mandatory audit event creation."""
        self._ensure_seed_records()
        records = self.db.get_records(self.table_name)
        target = None
        for r in records:
            if r.get("learning_id") == learning_id:
                target = r
                break

        if not target:
            return None

        previous_status = target.get("status")
        target["status"] = new_status
        target["updated_at"] = datetime.utcnow().isoformat()
        if actor:
            target["reviewed_by"] = actor
        if notes:
            target["review_notes"] = notes

        # Record audit event
        action_map = {
            "VALIDATED": "VALIDATED",
            "APPROVED": "APPROVED",
            "ACTIVE": "ACTIVATED",
            "REJECTED": "REJECTED",
            "SUPERSEDED": "SUPERSEDED"
        }
        action = action_map.get(new_status, "VALIDATED")

        self.create_audit_event({
            "event_id": f"AUD-EVT-{uuid.uuid4().hex[:8]}",
            "learning_id": learning_id,
            "model_version": target.get("target_version"),
            "action": action,
            "actor": actor,
            "timestamp": datetime.utcnow().isoformat(),
            "previous_status": previous_status,
            "new_status": new_status,
            "reason": notes or f"Status transitioned from {previous_status} to {new_status}"
        })
        return target

    # =========================================================================
    # MODEL VERSION METHODS
    # =========================================================================

    def create_model_version(self, version_data: Dict[str, Any]) -> Dict[str, Any]:
        """Registers a new immutable model version."""
        self._ensure_seed_records()
        records = self.db.get_records(self.versions_table)
        version_tag = version_data.get("model_version")
        existing_idx = next((i for i, r in enumerate(records) if r.get("model_version") == version_tag), None)

        if existing_idx is not None:
            records[existing_idx] = version_data
        else:
            self.db.insert_records(self.versions_table, [version_data])
        return version_data

    def get_model_version(self, model_version: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific model version."""
        self._ensure_seed_records()
        records = self.db.get_records(self.versions_table)
        for r in records:
            if r.get("model_version") == model_version:
                return r
        return None

    def list_model_versions(
        self,
        model_family: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Lists model versions."""
        self._ensure_seed_records()
        records = self.db.get_records(self.versions_table)
        results = []
        for r in records:
            if model_family and model_family != "all" and r.get("model_family") != model_family:
                continue
            if status and status != "all" and r.get("status") != status:
                continue
            results.append(r)
        return results

    def get_active_model_version(self, model_family: str) -> Optional[Dict[str, Any]]:
        """Returns the currently ACTIVE model version for a given family."""
        self._ensure_seed_records()
        records = self.db.get_records(self.versions_table)
        for r in records:
            if r.get("model_family") == model_family and r.get("status") == "ACTIVE":
                return r
        return None

    def activate_model_version(
        self,
        model_version: str,
        actor: str = "Admin",
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Activates a model version.
        Marks previously active version for that model family as SUPERSEDED.
        Creates an audit record.
        """
        self._ensure_seed_records()
        records = self.db.get_records(self.versions_table)
        target = None
        for r in records:
            if r.get("model_version") == model_version:
                target = r
                break

        if not target:
            raise ValueError(f"Model version '{model_version}' not found.")

        family = target.get("model_family")
        now_str = datetime.utcnow().isoformat()

        # Supersede currently active version in the same family
        superseded_version = None
        for r in records:
            if r.get("model_family") == family and r.get("status") == "ACTIVE" and r.get("model_version") != model_version:
                r["status"] = "SUPERSEDED"
                superseded_version = r.get("model_version")
                self.create_audit_event({
                    "event_id": f"AUD-EVT-{uuid.uuid4().hex[:8]}",
                    "model_version": superseded_version,
                    "action": "SUPERSEDED",
                    "actor": actor,
                    "timestamp": now_str,
                    "previous_status": "ACTIVE",
                    "new_status": "SUPERSEDED",
                    "reason": f"Superseded by activation of {model_version}"
                })

        # Mark target as ACTIVE
        prev_status = target.get("status")
        target["status"] = "ACTIVE"
        target["activated_at"] = now_str
        target["activated_by"] = actor

        self.create_audit_event({
            "event_id": f"AUD-EVT-{uuid.uuid4().hex[:8]}",
            "model_version": model_version,
            "action": "ACTIVATED",
            "actor": actor,
            "timestamp": now_str,
            "previous_status": prev_status,
            "new_status": "ACTIVE",
            "reason": reason or f"Authorized activation of model {model_version}"
        })

        return target

    def rollback_model_version(
        self,
        target_version: Optional[str] = None,
        actor: str = "Admin",
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Rolls back the active model to target_version or previous parent version.
        Never deletes model versions. Creates audit record.
        """
        self._ensure_seed_records()
        records = self.db.get_records(self.versions_table)
        now_str = datetime.utcnow().isoformat()

        # If target_version specified, look for it
        target = None
        if target_version:
            for r in records:
                if r.get("model_version") == target_version:
                    target = r
                    break
            if not target:
                raise ValueError(f"Target model version '{target_version}' not found.")
        else:
            # Look for most recent SUPERSEDED or parent version
            for r in records:
                if r.get("status") == "SUPERSEDED":
                    target = r
                    break
            if not target:
                # Default to base deterministic version
                for r in records:
                    if "deterministic" in r.get("model_version", ""):
                        target = r
                        break

        if not target:
            raise ValueError("No eligible model version available for rollback.")

        family = target.get("model_family")
        current_active = None
        for r in records:
            if r.get("model_family") == family and r.get("status") == "ACTIVE" and r.get("model_version") != target["model_version"]:
                current_active = r
                break

        if current_active:
            current_active["status"] = "ROLLED_BACK"
            self.create_audit_event({
                "event_id": f"AUD-EVT-{uuid.uuid4().hex[:8]}",
                "model_version": current_active.get("model_version"),
                "action": "ROLLED_BACK",
                "actor": actor,
                "timestamp": now_str,
                "previous_status": "ACTIVE",
                "new_status": "ROLLED_BACK",
                "reason": f"Rolled back in favor of {target['model_version']}"
            })

        target_prev_status = target.get("status")
        target["status"] = "ACTIVE"
        target["activated_at"] = now_str
        target["activated_by"] = actor

        self.create_audit_event({
            "event_id": f"AUD-EVT-{uuid.uuid4().hex[:8]}",
            "model_version": target["model_version"],
            "action": "ACTIVATED",
            "actor": actor,
            "timestamp": now_str,
            "previous_status": target_prev_status,
            "new_status": "ACTIVE",
            "reason": reason or f"Rollback restoration of {target['model_version']}"
        })

        return target

    # =========================================================================
    # AUDIT TRAIL METHODS
    # =========================================================================

    def create_audit_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Appends an immutable audit event to learning_audit_events."""
        if "event_id" not in event_data:
            event_data["event_id"] = f"AUD-EVT-{uuid.uuid4().hex[:8]}"
        if "timestamp" not in event_data:
            event_data["timestamp"] = datetime.utcnow().isoformat()

        self.db.insert_records(self.audit_table, [event_data])
        return event_data

    def list_audit_events(
        self,
        learning_id: Optional[str] = None,
        model_version: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Lists audit events with optional filtering."""
        self._ensure_seed_records()
        records = self.db.get_records(self.audit_table)
        results = []
        for r in records:
            if learning_id and r.get("learning_id") != learning_id:
                continue
            if model_version and r.get("model_version") != model_version:
                continue
            results.append(r)
        # Return newest first
        results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return results[:limit]
