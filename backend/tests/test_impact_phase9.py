"""
JANSETU — Phase 9 Test Suite
Closed-Loop Impact Measurement & Evaluation Engine
Tests:
1. Baseline Snapshots (immutability, evidence linkage, missing indicator rejection)
2. Post-Intervention Observations (unit safety, quality status, provenance)
3. Deterministic Mathematics (absolute change, percentage change, zero baseline, directionality)
4. Attribution Governance (DESCRIPTIVE_ONLY, no automatic causal claims)
5. Data Quality & Confounder Contextualization
6. Phase 8 Scenario Integration & Model Validation (prediction error, directional consistency)
7. Grounded Gemini Explanations & Disclaimers
8. REST API Endpoints (create, list, detail, observations, calculate, explain, model-validation)
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.impact_service import (
    impact_service, 
    CONTROLLED_INDICATORS,
    BaselineSnapshotService,
    OutcomeObservationService,
    ImpactCalculationService,
    AttributionService
)
from app.schemas.impact_schemas import (
    IndicatorDirection,
    EvaluationType,
    AttributionLevel,
    DataQuality,
    ObservationQualityStatus,
    MetricClassification,
    EvaluationCreateInput,
    ObservationInput,
    ConfounderItem
)

# =============================================================================
# 1. BASELINE SNAPSHOT TESTS
# =============================================================================

def test_baseline_snapshot_creation():
    svc = BaselineSnapshotService()
    snap = svc.get_or_create_snapshot(
        geo_id="IND_TN_DHM_HRR",
        sector="water_security",
        indicator_id="IND-WATER-COV-01",
        baseline_period="2024-04-01"
    )
    assert snap.baseline_id.startswith("BASE-IND_TN_DHM_HRR-WATER")
    assert snap.value == 42.0
    assert snap.unit == "percentage"
    assert snap.classification == MetricClassification.HISTORICAL_FACT
    assert len(snap.evidence_ids) >= 1
    assert "Jal Jeevan Mission" in snap.source

def test_invalid_indicator_rejected():
    svc = BaselineSnapshotService()
    with pytest.raises(ValueError, match="INVALID_INDICATOR"):
        svc.get_or_create_snapshot(
            geo_id="IND_TN_DHM_HRR",
            sector="water_security",
            indicator_id="NON_EXISTENT_INDICATOR",
            baseline_period="2024-04-01"
        )

def test_controlled_indicator_taxonomy():
    assert "IND-WATER-COV-01" in CONTROLLED_INDICATORS
    assert "IND-ROAD-TIME-01" in CONTROLLED_INDICATORS
    water_ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]
    road_ind = CONTROLLED_INDICATORS["IND-ROAD-TIME-01"]
    assert water_ind.direction == IndicatorDirection.HIGHER_IS_BETTER
    assert road_ind.direction == IndicatorDirection.LOWER_IS_BETTER

# =============================================================================
# 2. OBSERVATION & UNIT SAFETY TESTS
# =============================================================================

def test_observation_creation_and_provenance():
    svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]
    obs_input = ObservationInput(
        value=68.5,
        unit="percentage",
        observation_date="2026-03-31",
        source="Ministry of Jal Shakti Audit",
        source_type="OFFICIAL_FIELD_AUDIT",
        evidence_ids=["EV-OBS-TEST-01"],
        quality_status=ObservationQualityStatus.VERIFIED
    )
    obs = svc.record_observation(
        evaluation_id="EVAL-TEST-001",
        geo_id="IND_TN_DHM_HRR",
        indicator=ind,
        input_data=obs_input
    )
    assert obs.value == 68.5
    assert obs.unit == "percentage"
    assert obs.classification == MetricClassification.OBSERVED_OUTCOME
    assert obs.quality_status == ObservationQualityStatus.VERIFIED

def test_incompatible_unit_rejection():
    svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"] # expects "percentage"
    obs_input = ObservationInput(
        value=15.0,
        unit="hours/day", # Mismatched unit
        observation_date="2026-03-31",
        source="Field Survey"
    )
    with pytest.raises(ValueError, match="INCOMPATIBLE_UNITS"):
        svc.record_observation(
            evaluation_id="EVAL-TEST-002",
            geo_id="IND_TN_DHM_HRR",
            indicator=ind,
            input_data=obs_input
        )

# =============================================================================
# 3. DETERMINISTIC MATHEMATICS TESTS
# =============================================================================

def test_impact_calculation_higher_is_better():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]

    baseline = snap_svc.get_or_create_snapshot("IND_TN_DHM_HRR", "water_security", "IND-WATER-COV-01", "2024-04-01")
    obs = obs_svc.record_observation(
        "EVAL-TEST-01", "IND_TN_DHM_HRR", ind,
        ObservationInput(value=70.0, unit="percentage", observation_date="2026-03-31", source="Audit")
    )

    calc, scn_comp = calc_svc.calculate_impact(baseline, obs, target_value=65.0)
    assert calc.absolute_change == round(70.0 - 42.0, 3) # +28.0
    assert calc.percentage_change == round(((70.0 - 42.0) / 42.0) * 100, 1) # +66.7%
    assert calc.target_gap == 5.0 # 70 - 65
    assert calc.is_improvement is True
    assert calc.classification == MetricClassification.IMPACT_ESTIMATE

def test_impact_calculation_lower_is_better():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-ROAD-TIME-01"] # lower is better, baseline is 55 mins

    baseline = snap_svc.get_or_create_snapshot("IND_UP_VAR_PND", "road_transport", "IND-ROAD-TIME-01", "2024-06-01")
    obs = obs_svc.record_observation(
        "EVAL-TEST-02", "IND_UP_VAR_PND", ind,
        ObservationInput(value=35.0, unit="minutes", observation_date="2026-01-15", source="Telemetry")
    )

    calc, _ = calc_svc.calculate_impact(baseline, obs, target_value=30.0)
    assert calc.absolute_change == -20.0 # 35 - 55
    assert calc.percentage_change == round((-20.0 / 55.0) * 100, 1) # -36.4%
    assert calc.is_improvement is True # decrease in travel time is an improvement!

def test_impact_calculation_zero_baseline_division_safety():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]

    baseline = snap_svc.get_or_create_snapshot("IND_TN_DHM_HRR", "water_security", "IND-WATER-COV-01", "2024-04-01")
    baseline.value = 0.0 # Zero baseline

    obs = obs_svc.record_observation(
        "EVAL-TEST-03", "IND_TN_DHM_HRR", ind,
        ObservationInput(value=25.0, unit="percentage", observation_date="2026-03-31", source="Audit")
    )

    calc, _ = calc_svc.calculate_impact(baseline, obs)
    assert calc.absolute_change == 25.0
    assert calc.percentage_change is None # Protected against ZeroDivisionError

# =============================================================================
# 4. ATTRIBUTION & CAUSALITY GOVERNANCE TESTS
# =============================================================================

def test_descriptive_attribution_enforced_by_default():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]

    baseline = snap_svc.get_or_create_snapshot("IND_TN_DHM_HRR", "water_security", "IND-WATER-COV-01", "2024-04-01")
    obs = obs_svc.record_observation(
        "EVAL-TEST-04", "IND_TN_DHM_HRR", ind,
        ObservationInput(value=68.0, unit="percentage", observation_date="2026-03-31", source="Audit")
    )
    calc, _ = calc_svc.calculate_impact(baseline, obs)

    level, stmt = AttributionService.evaluate_attribution(
        eval_type=EvaluationType.DESCRIPTIVE_BEFORE_AFTER,
        data_quality=DataQuality.HIGH,
        confounders=[],
        calc=calc,
        indicator=ind
    )
    assert level == AttributionLevel.DESCRIPTIVE_ONLY
    # Must use non-causal phrasing
    assert "The observed indicator 'Piped Drinking Water Household Coverage' changed by" in stmt
    assert "caused" not in stmt.lower()

def test_causal_attribution_only_when_explicitly_supported():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]

    baseline = snap_svc.get_or_create_snapshot("IND_TN_DHM_HRR", "water_security", "IND-WATER-COV-01", "2024-04-01")
    obs = obs_svc.record_observation(
        "EVAL-TEST-05", "IND_TN_DHM_HRR", ind,
        ObservationInput(value=68.0, unit="percentage", observation_date="2026-03-31", source="Audit")
    )
    calc, _ = calc_svc.calculate_impact(baseline, obs)

    level, stmt = AttributionService.evaluate_attribution(
        eval_type=EvaluationType.CAUSAL_EVALUATION,
        data_quality=DataQuality.HIGH,
        confounders=[],
        calc=calc,
        indicator=ind
    )
    assert level == AttributionLevel.CAUSAL_EVIDENCE_AVAILABLE
    assert "Statistically validated causal evaluation" in stmt

def test_confounders_demote_causal_claim():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]

    baseline = snap_svc.get_or_create_snapshot("IND_TN_DHM_HRR", "water_security", "IND-WATER-COV-01", "2024-04-01")
    obs = obs_svc.record_observation(
        "EVAL-TEST-06", "IND_TN_DHM_HRR", ind,
        ObservationInput(value=68.0, unit="percentage", observation_date="2026-03-31", source="Audit")
    )
    calc, _ = calc_svc.calculate_impact(baseline, obs)

    confounder = ConfounderItem(
        factor_type="extreme_weather_event",
        description="Flash monsoon floods altered surface water retention."
    )

    level, stmt = AttributionService.evaluate_attribution(
        eval_type=EvaluationType.CAUSAL_EVALUATION,
        data_quality=DataQuality.HIGH,
        confounders=[confounder],
        calc=calc,
        indicator=ind
    )
    # With unadjusted confounders, causality cannot be claimed
    assert level == AttributionLevel.DESCRIPTIVE_ONLY

# =============================================================================
# 5. PHASE 8 SCENARIO INTEGRATION TESTS
# =============================================================================

def test_scenario_to_outcome_difference():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-WATER-COV-01"]

    baseline = snap_svc.get_or_create_snapshot("IND_TN_DHM_HRR", "water_security", "IND-WATER-COV-01", "2024-04-01") # 42.0
    obs = obs_svc.record_observation(
        "EVAL-TEST-07", "IND_TN_DHM_HRR", ind,
        ObservationInput(value=68.0, unit="percentage", observation_date="2026-03-31", source="Audit")
    )

    # Scenario forecasted 65.0
    calc, scn_comp = calc_svc.calculate_impact(
        baseline, obs, scenario_estimate=65.0, scenario_id="SCN-TEST-01"
    )

    assert scn_comp is not None
    assert scn_comp.scenario_estimate == 65.0
    assert scn_comp.observed_outcome == 68.0
    assert scn_comp.scenario_outcome_difference == 3.0 # 68 - 65
    assert scn_comp.predicted_change == 23.0 # 65 - 42
    assert scn_comp.observed_change == 26.0 # 68 - 42
    assert scn_comp.prediction_error == 3.0 # 26 - 23
    assert scn_comp.absolute_prediction_error == 3.0
    assert scn_comp.directional_consistency is True # both predicted and actual were positive gains
    assert scn_comp.label == "Scenario-to-Outcome Difference"
    assert "Not an Observed Outcome" in scn_comp.disclaimer

# =============================================================================
# 6. SERVICE INTEGRATION & WORKFLOW
# =============================================================================

def test_full_evaluation_lifecycle():
    # 1. Create evaluation
    eval_input = EvaluationCreateInput(
        geo_id="IND_TN_DHM_HRR",
        sector="water_security",
        intervention_id="PRJ-TN-WATER-09",
        project_name="Dharmapuri Solar Borewell Initiative",
        indicator_id="IND-WATER-COV-01",
        baseline_period="2024-04-01",
        observation_period="2026-03-31",
        target_value=70.0
    )
    eval_rec = impact_service.create_evaluation(eval_input)
    assert eval_rec.evaluation_id.startswith("EVAL-IND_TN_DHM_HRR-WATER")
    assert eval_rec.evaluation_status == "PENDING_OBSERVATION"
    assert eval_rec.baseline_snapshot.value == 42.0

    # 2. Record observation and trigger calculation
    obs_input = ObservationInput(
        value=72.0,
        unit="percentage",
        observation_date="2026-03-31",
        source="Jal Shakti Independent Audit",
        evidence_ids=["EV-AUDIT-2026-TN"]
    )
    evaluated = impact_service.record_observation_and_calculate(eval_rec.evaluation_id, obs_input)
    assert evaluated.evaluation_status == "COMPLETED"
    assert evaluated.observation is not None
    assert evaluated.observation.value == 72.0
    assert evaluated.calculation.absolute_change == 30.0
    assert evaluated.calculation.target_gap == 2.0 # 72 - 70

    # 3. Grounded Gemini explanation
    exp = impact_service.explain_evaluation(evaluated.evaluation_id)
    assert exp.evaluation_id == evaluated.evaluation_id
    assert "Harur Block" in exp.grounded_explanation
    assert len(exp.cited_evidence_ids) >= 1
    assert "AI-Derived Analytical Signal" in exp.disclaimer

# =============================================================================
# 7. MODEL VALIDATION SUMMARY
# =============================================================================

def test_model_validation_summary():
    summary = impact_service.get_model_validation()
    assert summary.total_evaluations_count >= 1
    assert summary.total_scenarios_evaluated >= 1
    assert summary.directional_consistency_rate is not None
    assert "AI-Derived Analytical Signal" in summary.disclaimer

# =============================================================================
# 8. REST API INTEGRATION TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_api_get_controlled_indicators():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/impact/indicators")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 5
    ids = [d["indicator_id"] for d in data]
    assert "IND-WATER-COV-01" in ids
    assert "IND-ROAD-TIME-01" in ids

@pytest.mark.asyncio
async def test_api_list_impact_evaluations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/impact/evaluations")
    assert res.status_code == 200
    res_json = res.json()
    assert res_json["success"] is True
    assert len(res_json["data"]) >= 1
    # Verify backward compatibility fields
    item = res_json["data"][0]
    assert "before_accessibility_pct" in item
    assert "after_accessibility_pct" in item
    assert "request_reduction_pct" in item

@pytest.mark.asyncio
async def test_api_create_and_observe_evaluation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create
        create_payload = {
            "geo_id": "IND_UP_VAR_PND",
            "sector": "road_transport",
            "intervention_id": "PRJ-UP-HWY-01",
            "project_name": "Pindra Bypass Corridor",
            "indicator_id": "IND-ROAD-TIME-01",
            "baseline_period": "2024-06-01",
            "observation_period": "2026-01-15",
            "target_value": 30.0
        }
        res_create = await ac.post("/api/v1/impact/evaluations", json=create_payload)
        assert res_create.status_code == 201
        eval_id = res_create.json()["data"]["evaluation_id"]

        # Detail
        res_detail = await ac.get(f"/api/v1/impact/evaluations/{eval_id}")
        assert res_detail.status_code == 200
        assert res_detail.json()["data"]["evaluation_id"] == eval_id

        # Observe
        obs_payload = {
            "value": 32.0,
            "unit": "minutes",
            "observation_date": "2026-01-15",
            "source": "UP Transit Audit",
            "source_type": "OFFICIAL_FIELD_AUDIT"
        }
        res_obs = await ac.post(f"/api/v1/impact/evaluations/{eval_id}/observations", json=obs_payload)
        assert res_obs.status_code == 200
        data_obs = res_obs.json()["data"]
        assert data_obs["observation"]["value"] == 32.0
        assert data_obs["calculation"]["absolute_change"] == -23.0 # 32 - 55

        # Explain
        res_exp = await ac.post(f"/api/v1/impact/evaluations/{eval_id}/explain")
        assert res_exp.status_code == 200
        exp_data = res_exp.json()["data"]
        assert exp_data["evaluation_id"] == eval_id
        assert len(exp_data["grounded_explanation"]) > 20

@pytest.mark.asyncio
async def test_api_model_validation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/impact/model-validation")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_scenarios_evaluated" in data
    assert "directional_consistency_rate" in data

@pytest.mark.asyncio
async def test_api_unknown_evaluation_returns_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/impact/evaluations/NON_EXISTENT_EVAL_ID")
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_api_observation_incompatible_unit_returns_400():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create evaluation
        create_payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "water_security",
            "intervention_id": "PRJ-TN-UNIT-TEST",
            "indicator_id": "IND-WATER-COV-01",
            "baseline_period": "2024-04-01",
            "observation_period": "2026-03-31"
        }
        res_create = await ac.post("/api/v1/impact/evaluations", json=create_payload)
        eval_id = res_create.json()["data"]["evaluation_id"]

        # Attempt observation with incompatible unit (kilometers instead of percentage)
        bad_obs = {
            "value": 45.0,
            "unit": "kilometers",
            "observation_date": "2026-03-31",
            "source": "Faulty Audit"
        }
        res_bad = await ac.post(f"/api/v1/impact/evaluations/{eval_id}/observations", json=bad_obs)
        assert res_bad.status_code == 400
        err_msg = str(res_bad.json())
        assert "INCOMPATIBLE_UNITS" in err_msg

@pytest.mark.asyncio
async def test_api_list_filtering_by_sector():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/impact/evaluations?sector=water_security")
        assert res.status_code == 200
        data = res.json()["data"]
        for item in data:
            assert item["sector"].lower() == "water_security"

@pytest.mark.asyncio
async def test_api_list_filtering_by_data_quality():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/impact/evaluations?data_quality=HIGH")
        assert res.status_code == 200
        data = res.json()["data"]
        for item in data:
            assert item["data_quality"] == "HIGH"

def test_directionality_health_distance():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-HEALTH-DIST-01"] # Lower is better (km to PHC)

    baseline = snap_svc.get_or_create_snapshot("IND_MH_GDC_AHR", "healthcare_access", "IND-HEALTH-DIST-01", "2024-06-01") # 14.5 km
    obs = obs_svc.record_observation(
        "EVAL-TEST-HLT", "IND_MH_GDC_AHR", ind,
        ObservationInput(value=4.2, unit="km", observation_date="2026-02-15", source="NHM Audit")
    )
    calc, _ = calc_svc.calculate_impact(baseline, obs, target_value=5.0)
    assert calc.absolute_change == round(4.2 - 14.5, 3) # -10.3 km
    assert calc.is_improvement is True # Lower distance to PHC is improvement!
    assert calc.target_achievement_pct is not None
    assert calc.target_achievement_pct > 100.0 # Exceeded target of 5.0 km

def test_directionality_power_availability():
    calc_svc = ImpactCalculationService()
    snap_svc = BaselineSnapshotService()
    obs_svc = OutcomeObservationService()
    ind = CONTROLLED_INDICATORS["IND-POWER-HRS-01"] # Higher is better (hours/day)

    baseline = snap_svc.get_or_create_snapshot("IND_TG_MBN_JDC", "electricity_supply", "IND-POWER-HRS-01", "2024-04-01") # 6.5 hrs
    obs = obs_svc.record_observation(
        "EVAL-TEST-PWR", "IND_TG_MBN_JDC", ind,
        ObservationInput(value=14.0, unit="hours/day", observation_date="2026-02-28", source="Grid Telemetry")
    )
    calc, _ = calc_svc.calculate_impact(baseline, obs, target_value=12.0)
    assert calc.absolute_change == 7.5 # +7.5 hrs/day
    assert calc.is_improvement is True
    assert calc.target_achievement_pct == round((14.0 / 12.0) * 100.0, 1) # 116.7%

def test_evaluation_idempotency():
    eval_input = EvaluationCreateInput(
        geo_id="IND_TN_DHM_HRR",
        sector="water_security",
        intervention_id="PRJ-IDEMP-01",
        indicator_id="IND-WATER-COV-01",
        baseline_period="2024-04-01",
        observation_period="2026-03-31"
    )
    eval1 = impact_service.create_evaluation(eval_input)
    eval2 = impact_service.create_evaluation(eval_input)
    assert eval1.evaluation_id == eval2.evaluation_id

def test_governance_disclaimers_present():
    eval_list = impact_service.list_evaluations(limit=5)
    assert len(eval_list) >= 1
    for ev in eval_list:
        assert "AI-Derived Analytical Signal" in ev.governance_notice
        assert "OBSERVED OUTCOME — MEASURED DATA" in ev.disclaimer
