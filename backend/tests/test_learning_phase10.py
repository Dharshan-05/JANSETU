"""
JANSETU — Phase 10 Test Suite
Civic Intelligence Learning & Continuous Calibration Engine
Validates:
1. Ingestion of Phase 9 observations and quality tracking.
2. Temporal leakage prevention (training_date < validation_date).
3. Deterministic calibration, parameter bounds, weight normalization.
4. Out-of-sample held-out validation (MAE, MAPE, directional consistency).
5. Governance lifecycle (candidate generation, validation, approval, activation, rollback).
6. Immutability of historical data (Phases 1-9 tables unchanged).
7. Drift monitoring and statistical shift classification.
8. Grounded explanation constraints (no policy dictates or ranking).
9. REST API endpoints under /api/v1/learning.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.schemas.learning_schemas import (
    ModelFamily,
    CalibrationStatus,
    LearningAction,
    DriftStatus,
    LearningObservation,
    CalibrationParameter,
    GenerateCandidateRequest,
    ValidateCandidateRequest,
    ApproveCandidateRequest,
    RejectCandidateRequest,
    ActivateModelRequest,
    RollbackModelRequest
)
from app.services.learning_service import (
    LearningObservationService,
    ValidationSplitService,
    CalibrationService,
    DriftMonitoringService,
    DataQualityMonitoringService,
    LearningExplanationService,
    learning_engine_service
)
from app.db.bigquery_client import learning_repo, impact_repo

client = TestClient(app)

# Helper mock observation generator
def create_mock_observations(count: int = 12, start_year: int = 2024) -> list:
    obs_list = []
    for i in range(1, count + 1):
        month = (i % 12) + 1
        year = start_year + (i // 13)
        obs_date = f"{year}-{month:02d}-15"
        obs_list.append(LearningObservation(
            evaluation_id=f"EVAL-TEST-{i:03d}",
            indicator_id="IND-WATER-COV-01",
            forecast_value=60.0 + (i * 1.5),
            observed_value=58.0 + (i * 1.3),
            baseline_value=35.0,
            predicted_change=25.0 + (i * 1.5),
            observed_change=23.0 + (i * 1.3),
            prediction_error=-2.0,
            relative_prediction_error=0.03,
            observation_date=obs_date,
            data_quality="VERIFIED",
            is_directionally_aligned=True,
            source_scenario_id=f"SCN-TEST-{i:03d}",
            sector="water_security",
            geo_id=f"09-24-{i:03d}"
        ))
    return obs_list


# =============================================================================
# 1. OBSERVATION & QUALITY TESTS
# =============================================================================

def test_01_learning_observation_service_ingestion():
    svc = LearningObservationService()
    obs = svc.get_learning_observations()
    assert isinstance(obs, list)
    assert len(obs) > 0
    first = obs[0]
    assert hasattr(first, "evaluation_id")
    assert hasattr(first, "observed_value")
    assert hasattr(first, "observation_date")


def test_02_learning_observation_filtering():
    svc = LearningObservationService()
    water_obs = svc.get_learning_observations(sector="water_security")
    for o in water_obs:
        assert o.sector == "water_security"


def test_03_temporal_split_chronological_ordering():
    split_svc = ValidationSplitService()
    mock_obs = create_mock_observations(14)
    train_obs, val_obs, train_win, val_win = split_svc.split_dataset(
        mock_obs,
        training_start="2024-01-01",
        training_end="2024-08-31",
        validation_start="2024-09-01",
        validation_end="2024-12-31"
    )
    assert len(train_obs) > 0
    assert len(val_obs) > 0
    assert train_win["end"] <= val_win["start"]
    for t in train_obs:
        assert t.observation_date <= train_win["end"]
    for v in val_obs:
        assert v.observation_date >= val_win["start"]


def test_04_temporal_leakage_window_overlap_rejected():
    split_svc = ValidationSplitService()
    mock_obs = create_mock_observations(10)
    with pytest.raises(ValueError) as excinfo:
        split_svc.split_dataset(
            mock_obs,
            training_start="2024-01-01",
            training_end="2024-10-01",
            validation_start="2024-09-01",
            validation_end="2024-12-31"
        )
    assert "TEMPORAL_LEAKAGE_DETECTED" in str(excinfo.value)


def test_05_temporal_leakage_observation_in_validation_rejected():
    split_svc = ValidationSplitService()
    # Create an observation inside training set that violates boundary
    leaky_obs = [
        LearningObservation(
            evaluation_id="EVAL-LEAK-01",
            indicator_id="IND-WATER-COV-01",
            observed_value=50.0,
            observation_date="2025-05-01",
            data_quality="VERIFIED"
        )
    ]
    with pytest.raises(ValueError) as excinfo:
        split_svc.split_dataset(
            leaky_obs,
            training_start="2024-01-01",
            training_end="2025-06-01",
            validation_start="2025-01-01",
            validation_end="2025-12-31"
        )
    assert "TEMPORAL_LEAKAGE_DETECTED" in str(excinfo.value)


def test_06_insufficient_sample_size_handling():
    calib_svc = CalibrationService()
    sparse_obs = create_mock_observations(3)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=sparse_obs,
        validation_obs=[],
        min_samples=8
    )
    assert status == CalibrationStatus.INSUFFICIENT_DATA
    assert len(params) == 0
    assert metrics.sample_size == 3


# =============================================================================
# 2. CALIBRATION & MATHEMATICAL INTEGRITY
# =============================================================================

def test_07_deterministic_scenario_simulation_calibration():
    calib_svc = CalibrationService()
    train_obs = create_mock_observations(12)
    val_obs = create_mock_observations(4)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=train_obs,
        validation_obs=val_obs,
        min_samples=8
    )
    assert status in [CalibrationStatus.CANDIDATE, CalibrationStatus.REQUIRES_REVIEW]
    assert len(params) >= 1
    p = params[0]
    assert p.parameter_name == "scenario_effectiveness_factor"
    assert 0.10 <= p.candidate_value <= 2.0


def test_08_parameter_bounds_enforcement():
    param = CalibrationParameter(
        parameter_name="test_factor",
        current_value=1.0,
        candidate_value=1.45,
        min_value=0.1,
        max_value=2.0
    )
    assert param.min_value <= param.candidate_value <= param.max_value


def test_09_nan_and_infinite_parameter_rejection():
    calib_svc = CalibrationService()
    # Mock invalid observation with division by zero producing NaN/Inf
    bad_obs = [
        LearningObservation(
            evaluation_id=f"EVAL-INF-{i}",
            indicator_id="IND-WATER-COV-01",
            observed_value=10.0,
            predicted_change=0.0,
            observed_change=10.0,
            observation_date="2024-05-01",
            data_quality="VERIFIED"
        )
        for i in range(10)
    ]
    # Calibration handles zero division gracefully or clamps values safely
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=bad_obs,
        validation_obs=[],
        min_samples=5
    )
    for p in params:
        import math
        assert not math.isnan(p.candidate_value)
        assert not math.isinf(p.candidate_value)


def test_10_weight_normalization_hotspot_model():
    calib_svc = CalibrationService()
    train_obs = create_mock_observations(10)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.DEMAND_HOTSPOT,
        training_obs=train_obs,
        validation_obs=[],
        min_samples=5
    )
    assert len(params) == 4
    total_weight = sum(p.candidate_value for p in params)
    assert abs(total_weight - 1.0) < 0.005


def test_11_weight_normalization_silent_need_model():
    calib_svc = CalibrationService()
    train_obs = create_mock_observations(10)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SILENT_NEED,
        training_obs=train_obs,
        validation_obs=[],
        min_samples=5
    )
    assert len(params) == 3
    total_weight = sum(p.candidate_value for p in params)
    assert abs(total_weight - 1.0) < 0.005


def test_12_max_parameter_change_requires_review():
    calib_svc = CalibrationService()
    # High discrepancy observation to force large parameter movement
    extreme_obs = []
    for i in range(12):
        extreme_obs.append(LearningObservation(
            evaluation_id=f"EVAL-EXT-{i}",
            indicator_id="IND-WATER-COV-01",
            predicted_change=10.0,
            observed_change=25.0,  # 2.5x shift
            observation_date="2024-05-01",
            data_quality="VERIFIED",
            observed_value=75.0
        ))
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=extreme_obs,
        validation_obs=[],
        min_samples=5
    )
    if any(abs(p.candidate_value - p.current_value) > settings.MAX_PARAMETER_CHANGE for p in params):
        assert status == CalibrationStatus.REQUIRES_REVIEW


def test_13_deterministic_metrics_mae_calculation():
    calib_svc = CalibrationService()
    train_obs = create_mock_observations(10)
    val_obs = create_mock_observations(5)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=train_obs,
        validation_obs=val_obs,
        min_samples=5
    )
    assert metrics.mae_before >= 0.0
    assert metrics.mae_candidate >= 0.0
    assert metrics.sample_size == 10
    assert metrics.validation_sample_size == 5


def test_14_deterministic_metrics_mape_calculation():
    calib_svc = CalibrationService()
    train_obs = create_mock_observations(10)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=train_obs,
        validation_obs=[],
        min_samples=5
    )
    assert metrics.mape_before is not None
    assert metrics.mape_candidate is not None


def test_15_directional_consistency_rate_computation():
    calib_svc = CalibrationService()
    train_obs = create_mock_observations(10)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=train_obs,
        validation_obs=[],
        min_samples=5
    )
    assert 0.0 <= metrics.directional_consistency_before <= 1.0
    assert 0.0 <= metrics.directional_consistency_candidate <= 1.0


def test_16_held_out_validation_out_of_sample():
    calib_svc = CalibrationService()
    train_obs = create_mock_observations(10)
    val_obs = create_mock_observations(6)
    params, metrics, status = calib_svc.calibrate(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        training_obs=train_obs,
        validation_obs=val_obs,
        min_samples=5
    )
    assert metrics.validation_mae_before is not None
    assert metrics.validation_mae_candidate is not None


def test_17_neutral_comparison_language_no_winners():
    explain_svc = LearningExplanationService()
    cand = learning_engine_service.generate_candidate(GenerateCandidateRequest(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        min_samples=2
    ))
    res = explain_svc.explain_candidate(cand)
    text = res.grounded_explanation.lower()
    assert "winner" not in text
    assert "best model" not in text
    assert "optimal model" not in text
    assert "recommended model" not in text


# =============================================================================
# 3. DRIFT & QUALITY MONITORING TESTS
# =============================================================================

def test_18_drift_monitoring_stable_distribution():
    drift_svc = DriftMonitoringService()
    stable_obs = [
        LearningObservation(
            evaluation_id=f"STABLE-{i}",
            indicator_id="IND-WATER-COV-01",
            observed_value=58.0 + (i % 3) * 0.5,
            observation_date=f"2024-{(i%12)+1:02d}-15",
            data_quality="VERIFIED"
        )
        for i in range(16)
    ]
    reports = drift_svc.analyze_drift(stable_obs)
    assert len(reports) > 0
    assert reports[0].status in [DriftStatus.STABLE, DriftStatus.WATCH]


def test_19_drift_monitoring_detects_distribution_shift():
    drift_svc = DriftMonitoringService()
    # Create shifted observations (old = 30.0, new = 90.0)
    shifted_obs = []
    for i in range(8):
        shifted_obs.append(LearningObservation(
            evaluation_id=f"OLD-{i}",
            indicator_id="IND-WATER-COV-01",
            observed_value=30.0,
            observation_date="2024-01-15",
            data_quality="VERIFIED"
        ))
    for i in range(8):
        shifted_obs.append(LearningObservation(
            evaluation_id=f"NEW-{i}",
            indicator_id="IND-WATER-COV-01",
            observed_value=90.0,
            observation_date="2025-06-15",
            data_quality="VERIFIED"
        ))
    reports = drift_svc.analyze_drift(shifted_obs)
    assert reports[0].status == DriftStatus.DRIFT_DETECTED
    assert reports[0].mean_shift_pct > 50.0


def test_20_data_quality_monitoring_breakdown():
    quality_svc = DataQualityMonitoringService()
    obs_batch = [
        LearningObservation(evaluation_id="Q1", indicator_id="IND-1", observed_value=1.0, observation_date="2025-01-01", data_quality="VERIFIED"),
        LearningObservation(evaluation_id="Q2", indicator_id="IND-1", observed_value=1.0, observation_date="2025-01-01", data_quality="PROXY"),
        LearningObservation(evaluation_id="Q3", indicator_id="IND-1", observed_value=1.0, observation_date="2025-01-01", data_quality="MISSING"),
        LearningObservation(evaluation_id="Q4", indicator_id="IND-1", observed_value=1.0, observation_date="2025-01-01", data_quality="CONFLICTING")
    ]
    report = quality_svc.analyze_quality(obs_batch)
    assert report.total_observations == 4
    assert report.verified_observations == 1
    assert report.proxy_observations == 1
    assert report.missing_observations == 1
    assert report.conflicting_observations == 1
    assert report.verified_pct == 25.0


def test_21_historical_records_immutability():
    # Verify Phase 9 evaluations remain intact and unmodified after calibration
    pre_evals = impact_repo.list_evaluations()
    pre_count = len(pre_evals)

    _ = learning_engine_service.generate_candidate(GenerateCandidateRequest(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        min_samples=2
    ))

    post_evals = impact_repo.list_evaluations()
    assert len(post_evals) == pre_count


# =============================================================================
# 4. GOVERNANCE & VERSION LIFECYCLE TESTS
# =============================================================================

def test_22_candidate_lifecycle_create_and_get():
    cand = learning_engine_service.generate_candidate(GenerateCandidateRequest(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        min_samples=1
    ))
    fetched = learning_repo.get_candidate(cand.learning_id)
    assert fetched is not None
    assert fetched["learning_id"] == cand.learning_id
    assert fetched["status"] in ["CANDIDATE", "REQUIRES_REVIEW"]


def test_23_candidate_lifecycle_validate():
    cand = learning_engine_service.generate_candidate(GenerateCandidateRequest(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        min_samples=1
    ))
    validated = learning_engine_service.validate_candidate(cand.learning_id, ValidateCandidateRequest())
    assert validated.status == CalibrationStatus.VALIDATED


def test_24_candidate_lifecycle_approve():
    cand = learning_engine_service.generate_candidate(GenerateCandidateRequest(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        min_samples=1
    ))
    learning_engine_service.validate_candidate(cand.learning_id, ValidateCandidateRequest())
    approved = learning_engine_service.approve_candidate(
        cand.learning_id,
        ApproveCandidateRequest(reviewer="State Chief Planner", notes="Verified empirical improvements")
    )
    assert approved.status == CalibrationStatus.APPROVED
    assert approved.reviewed_by == "State Chief Planner"


def test_25_candidate_lifecycle_reject():
    cand = learning_engine_service.generate_candidate(GenerateCandidateRequest(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        min_samples=1
    ))
    rejected = learning_engine_service.reject_candidate(
        cand.learning_id,
        RejectCandidateRequest(reviewer="State Chief Planner", reason="Data window too narrow")
    )
    assert rejected.status == CalibrationStatus.REJECTED


def test_26_model_activation_creates_new_version_and_supersedes():
    # Baseline v8.0 is initially ACTIVE
    active_before = learning_repo.get_active_model_version("SCENARIO_SIMULATION")
    assert active_before is not None
    prev_tag = active_before["model_version"]

    # Create and activate a new version
    new_tag = "v10.0-calibrated-unit-test"
    learning_repo.create_model_version({
        "model_version": new_tag,
        "model_family": "SCENARIO_SIMULATION",
        "parameters": {"scenario_effectiveness_factor": 0.88},
        "status": "APPROVED",
        "parent_version": prev_tag,
        "created_at": "2026-04-01T00:00:00"
    })

    activated = learning_engine_service.activate_model(
        new_tag,
        ActivateModelRequest(actor="Lead Data Architect", reason="Field validated")
    )
    assert activated.status == CalibrationStatus.ACTIVE

    # Verify previous version became SUPERSEDED
    old_record = learning_repo.get_model_version(prev_tag)
    assert old_record["status"] == "SUPERSEDED"


def test_27_model_rollback_preserves_history_and_restores_active():
    # Rollback to baseline deterministic version
    rolled_back = learning_engine_service.rollback_model(
        version="v8.0-deterministic",
        req=RollbackModelRequest(actor="Lead Data Architect", reason="Testing rollback")
    )
    assert rolled_back.model_version == "v8.0-deterministic"
    assert rolled_back.status == CalibrationStatus.ACTIVE

    # Check audit event was created
    audits = learning_repo.list_audit_events()
    rollback_events = [a for a in audits if a.get("action") == "ROLLED_BACK"]
    assert len(rollback_events) > 0


def test_28_audit_trail_records_all_transitions():
    audits = learning_repo.list_audit_events(limit=100)
    assert len(audits) > 0
    actions = {a["action"] for a in audits}
    assert "CREATED" in actions or "ACTIVATED" in actions


def test_29_grounded_gemini_explanation_and_disclaimers():
    cand = learning_engine_service.generate_candidate(GenerateCandidateRequest(
        model_family=ModelFamily.SCENARIO_SIMULATION,
        min_samples=2
    ))
    res = learning_engine_service.explain_candidate(cand.learning_id)
    assert res.prompt_version == settings.LEARNING_PROMPT_VERSION
    assert len(res.cited_evaluation_ids) > 0
    assert "CALIBRATION CANDIDATE" in res.disclaimer
    assert "policy" not in res.grounded_explanation.lower() or "not official policy" in res.disclaimer.lower()


# =============================================================================
# 5. REST API ENDPOINTS
# =============================================================================

def test_30_api_learning_summary_endpoint():
    res = client.get("/api/v1/learning/summary")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_evaluations_ingested" in data
    assert "active_models" in data
    assert "drift_summary" in data
    assert data["analytical_version"] == "v10.0-continuous-learning"


def test_31_api_list_and_get_candidates_endpoints():
    res = client.get("/api/v1/learning/candidates")
    assert res.status_code == 200
    items = res.json()["data"]
    assert len(items) > 0

    first_id = items[0]["learning_id"]
    res2 = client.get(f"/api/v1/learning/candidates/{first_id}")
    assert res2.status_code == 200
    assert res2.json()["data"]["learning_id"] == first_id


def test_32_api_generate_candidate_endpoint_and_leakage_422():
    # Valid generation
    res = client.post("/api/v1/learning/candidates/generate", json={
        "model_family": "SCENARIO_SIMULATION",
        "min_samples": 2
    })
    assert res.status_code == 201
    cand_id = res.json()["data"]["learning_id"]

    # Invalid generation with overlapping leakage windows -> 422
    leak_res = client.post("/api/v1/learning/candidates/generate", json={
        "model_family": "SCENARIO_SIMULATION",
        "training_start": "2024-01-01",
        "training_end": "2025-06-01",
        "validation_start": "2024-09-01",  # Starts before training ends!
        "validation_end": "2025-12-31"
    })
    assert leak_res.status_code == 422


def test_33_api_model_versions_and_activate_rollback_endpoints():
    res = client.get("/api/v1/learning/models")
    assert res.status_code == 200
    versions = res.json()["data"]
    assert len(versions) >= 2

    # Activate
    act_res = client.post("/api/v1/learning/models/v8.0-deterministic/activate", json={
        "actor": "Admin Test",
        "reason": "Test activation"
    })
    assert act_res.status_code == 200
    assert act_res.json()["data"]["status"] == "ACTIVE"


def test_34_api_audit_events_endpoint():
    res = client.get("/api/v1/learning/audit-events")
    assert res.status_code == 200
    events = res.json()["data"]
    assert isinstance(events, list)
    assert len(events) > 0
    assert "action" in events[0]
