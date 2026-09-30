"""
JANSETU — Phase 8 Policy Sandbox & Scenario Simulation Engine Test Suite
Tests for:
- Input validation (sectors, bounds, negative numbers)
- Pure deterministic mathematics (deficit reduction, gap shrinkage, population reach)
- Determinism & Idempotent persistence
- Hard governance rule: strict separation of HISTORICAL FACT, MODEL ASSUMPTION, SCENARIO ESTIMATE
- Budget strictly verified, user-provided assumption, or unavailable (no invented costs)
- Grounded Gemini explanation & zero-hallucination contract
- Neutral multi-scenario comparison (no winners / recommendations)
- REST API endpoints: /simulate, /scenarios, /{id}, /compare, /{id}/explain, /{id}/archive, 404s
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings
from app.services.sandbox_service import (
    sandbox_service,
    ScenarioSimulationService,
    ScenarioComparisonService,
    ScenarioExplanationService
)
from app.schemas.sandbox_schemas import (
    ScenarioInput,
    ScenarioResult,
    ScenarioBaseline,
    ScenarioAssumptions,
    ScenarioEstimate,
    InterventionType,
    MetricClassification,
    CostStatus
)
from app.db.bigquery_client import policy_scenario_repo


# =============================================================================
# 1. INPUT VALIDATION TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_invalid_sector_rejected():
    """Verify that an unsupported civic sector is strictly rejected with 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "aerospace_defense",
            "intervention_type": "SERVICE_COVERAGE_INCREASE"
        }
        res = await ac.post("/api/v1/sandbox/simulate", json=payload)
    assert res.status_code == 422
    assert "not supported" in res.text.lower()


@pytest.mark.asyncio
async def test_negative_coverage_rejected():
    """Verify negative coverage improvement percentage is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "water",
            "coverage_improvement_pct": -15.0
        }
        res = await ac.post("/api/v1/sandbox/simulate", json=payload)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_coverage_exceeding_100_rejected():
    """Verify coverage improvement > 100% is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "water",
            "coverage_improvement_pct": 150.0
        }
        res = await ac.post("/api/v1/sandbox/simulate", json=payload)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_negative_budget_rejected():
    """Verify negative budget is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "transport",
            "hypothetical_budget": -500000.0
        }
        res = await ac.post("/api/v1/sandbox/simulate", json=payload)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_invalid_population_pct_rejected():
    """Verify target population percentage > 100% or < 0% is rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "healthcare",
            "target_population_pct": 120.0
        }
        res = await ac.post("/api/v1/sandbox/simulate", json=payload)
    assert res.status_code == 422


# =============================================================================
# 2. DETERMINISTIC CALCULATION TESTS
# =============================================================================

def test_deficit_reduction_calculation():
    """
    Verify EstimatedDeficit = max(0, BaselineDeficit * (1 - CoverageImprovement)).
    Baseline: 0.80, Coverage: 25% -> 0.80 * (1 - 0.25) = 0.60.
    Gap reduction: 0.80 - 0.60 = 0.20.
    """
    estimate = ScenarioSimulationService.calculate_scenario(
        baseline_deficit=0.80,
        total_population=100000,
        coverage_improvement_pct=25.0,
        target_population_pct=50.0
    )
    assert estimate.estimated_deficit == 0.60
    assert estimate.estimated_gap_reduction == 0.20
    assert estimate.residual_gap == 0.60
    assert estimate.estimated_affected_population == 50000
    assert estimate.projected_accessibility == 0.40


def test_zero_deficit_baseline():
    """Verify if baseline deficit is 0.0, simulated deficit stays 0.0."""
    estimate = ScenarioSimulationService.calculate_scenario(
        baseline_deficit=0.0,
        total_population=50000,
        coverage_improvement_pct=40.0,
        target_population_pct=60.0
    )
    assert estimate.estimated_deficit == 0.0
    assert estimate.estimated_gap_reduction == 0.0
    assert estimate.residual_gap == 0.0


def test_full_coverage_100_pct():
    """Verify 100% coverage improvement reduces residual deficit to exactly 0.0."""
    estimate = ScenarioSimulationService.calculate_scenario(
        baseline_deficit=0.75,
        total_population=80000,
        coverage_improvement_pct=100.0,
        target_population_pct=100.0
    )
    assert estimate.estimated_deficit == 0.0
    assert estimate.estimated_gap_reduction == 0.75
    assert estimate.residual_gap == 0.0
    assert estimate.projected_accessibility == 1.0


def test_partial_coverage_calculations():
    """Verify 50% coverage on 0.70 deficit yields exactly 0.35 residual deficit."""
    estimate = ScenarioSimulationService.calculate_scenario(
        baseline_deficit=0.70,
        total_population=120000,
        coverage_improvement_pct=50.0,
        target_population_pct=75.0
    )
    assert estimate.estimated_deficit == 0.35
    assert estimate.estimated_gap_reduction == 0.35
    assert estimate.estimated_affected_population == 90000


def test_population_exposure_calculation():
    """Verify affected population calculation rounds correctly."""
    estimate = ScenarioSimulationService.calculate_scenario(
        baseline_deficit=0.60,
        total_population=194820,
        coverage_improvement_pct=30.0,
        target_population_pct=45.5
    )
    expected_pop = int(round(194820 * 0.455))
    assert estimate.estimated_affected_population == expected_pop


def test_boundary_values_clamping():
    """Verify extreme inputs clamp safely within [0.0, 1.0]."""
    estimate = ScenarioSimulationService.calculate_scenario(
        baseline_deficit=1.0,
        total_population=10000,
        coverage_improvement_pct=0.0,
        target_population_pct=0.0
    )
    assert estimate.estimated_deficit == 1.0
    assert estimate.estimated_gap_reduction == 0.0
    assert estimate.estimated_affected_population == 0


# =============================================================================
# 3. DETERMINISM & IDENTIFIERS
# =============================================================================

def test_deterministic_scenario_id():
    """Verify identical parameters always yield the identical scenario ID."""
    id1 = ScenarioSimulationService.generate_deterministic_id(
        geo_id="IND_TN_DHM_HRR",
        sector="water",
        intervention_type="SERVICE_COVERAGE_INCREASE",
        coverage_pct=35.0,
        target_pop_pct=60.0,
        hypothetical_budget=5000000.0,
        model_version="v8.0-deterministic"
    )
    id2 = ScenarioSimulationService.generate_deterministic_id(
        geo_id="IND_TN_DHM_HRR",
        sector="water",
        intervention_type="SERVICE_COVERAGE_INCREASE",
        coverage_pct=35.0,
        target_pop_pct=60.0,
        hypothetical_budget=5000000.0,
        model_version="v8.0-deterministic"
    )
    assert id1 == id2
    assert id1.startswith("SCN-")


@pytest.mark.asyncio
async def test_deterministic_simulation_service_results():
    """Verify service simulation produces identical results on successive executions."""
    inp = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="water",
        intervention_type="SERVICE_COVERAGE_INCREASE",
        coverage_improvement_pct=30.0,
        target_population_pct=50.0
    )
    res1 = await sandbox_service.simulate_scenario(inp)
    res2 = await sandbox_service.simulate_scenario(inp)

    assert res1.scenario_id == res2.scenario_id
    assert res1.estimated_result.estimated_deficit == res2.estimated_result.estimated_deficit
    assert res1.estimated_result.estimated_gap_reduction == res2.estimated_result.estimated_gap_reduction


def test_model_version_consistency():
    """Verify model version is stamped as v8.0-deterministic."""
    assert settings.SCENARIO_MODEL_VERSION == "v8.0-deterministic"


# =============================================================================
# 4. IDEMPOTENCY & VERSIONING
# =============================================================================

@pytest.mark.asyncio
async def test_scenario_persistence_idempotent():
    """Verify running the same simulation multiple times updates record without duplicating."""
    inp = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="transport",
        intervention_type="ACCESS_IMPROVEMENT",
        coverage_improvement_pct=20.0,
        target_population_pct=40.0
    )
    res1 = await sandbox_service.simulate_scenario(inp)
    count_before = len(policy_scenario_repo.list_scenarios(geo_id=inp.geo_id, sector=inp.sector))

    res2 = await sandbox_service.simulate_scenario(inp)
    count_after = len(policy_scenario_repo.list_scenarios(geo_id=inp.geo_id, sector=inp.sector))

    assert res1.scenario_id == res2.scenario_id
    assert count_after == count_before


# =============================================================================
# 5. GOVERNANCE & METRIC CLASSIFICATION
# =============================================================================

@pytest.mark.asyncio
async def test_separation_of_fact_assumption_estimate():
    """Verify HISTORICAL FACT, MODEL ASSUMPTION, and SCENARIO ESTIMATE are strictly separated."""
    inp = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="healthcare",
        intervention_type="INFRASTRUCTURE_CAPACITY_INCREASE",
        coverage_improvement_pct=35.0,
        target_population_pct=65.0
    )
    result = await sandbox_service.simulate_scenario(inp)

    # 1. Baseline metrics must be HISTORICAL_FACT
    assert len(result.baseline.metrics) >= 3
    for m in result.baseline.metrics:
        assert m.classification == MetricClassification.HISTORICAL_FACT.value
        assert len(m.evidence_ids) >= 1

    # 2. User inputs must be MODEL_ASSUMPTION
    assert result.assumptions.classification == MetricClassification.MODEL_ASSUMPTION.value

    # 3. Calculated outputs must be SCENARIO_ESTIMATE
    assert result.estimated_result.classification == MetricClassification.SCENARIO_ESTIMATE.value
    assert result.classification == MetricClassification.SCENARIO_ESTIMATE.value


@pytest.mark.asyncio
async def test_mandatory_disclaimer_presence():
    """Verify scenario results carry both mandatory policy disclaimers."""
    inp = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="sanitation",
        coverage_improvement_pct=25.0
    )
    result = await sandbox_service.simulate_scenario(inp)

    assert "HYPOTHETICAL SCENARIO" in result.disclaimer
    assert "AI-Derived Analytical Signal — Not Official Policy" in result.disclaimer


@pytest.mark.asyncio
async def test_no_prescriptive_policy_language():
    """Verify output contains no prescriptive policy or budget directives."""
    inp = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="water",
        coverage_improvement_pct=40.0
    )
    result = await sandbox_service.simulate_scenario(inp)
    full_text = (result.disclaimer + " " + (result.explanation or "")).lower()

    prohibited_phrases = ["government should", "best policy", "must fund", "fund this region", "winner scenario"]
    for phrase in prohibited_phrases:
        assert phrase not in full_text


@pytest.mark.asyncio
async def test_cost_status_strictness():
    """Verify user-provided budget is tagged MODEL ASSUMPTION, while missing budget is UNAVAILABLE."""
    # With user-provided budget
    inp_with_budget = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="water",
        hypothetical_budget=10000000.0
    )
    res_budget = await sandbox_service.simulate_scenario(inp_with_budget)
    assert res_budget.assumptions.cost_status == CostStatus.MODEL_ASSUMPTION_USER_PROVIDED.value

    # Without budget
    inp_no_budget = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="water",
        hypothetical_budget=None
    )
    res_no_budget = await sandbox_service.simulate_scenario(inp_no_budget)
    assert res_no_budget.assumptions.cost_status == CostStatus.UNAVAILABLE.value


# =============================================================================
# 6. COMPARISON & EXPLANATION TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_multi_scenario_comparison():
    """Verify 2 to 3 scenarios can be compared side-by-side neutrally."""
    # Create scenario A (20%) and scenario B (40%)
    inp_a = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="transport", coverage_improvement_pct=20.0)
    inp_b = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="transport", coverage_improvement_pct=40.0)

    res_a = await sandbox_service.simulate_scenario(inp_a)
    res_b = await sandbox_service.simulate_scenario(inp_b)

    comp = await sandbox_service.compare_scenarios([res_a.scenario_id, res_b.scenario_id])
    assert len(comp.scenarios) == 2
    assert len(comp.comparison_table) >= 5
    assert comp.scenarios[0].scenario_id == res_a.scenario_id
    assert comp.scenarios[1].scenario_id == res_b.scenario_id


@pytest.mark.asyncio
async def test_comparison_neutrality_no_winners():
    """Verify comparison table does not declare any winners or optimal rankings."""
    inp_a = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="water", coverage_improvement_pct=20.0)
    inp_b = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="water", coverage_improvement_pct=50.0)

    res_a = await sandbox_service.simulate_scenario(inp_a)
    res_b = await sandbox_service.simulate_scenario(inp_b)

    comp = await sandbox_service.compare_scenarios([res_a.scenario_id, res_b.scenario_id])
    comp_json = comp.model_dump_json().lower()

    assert "winner" not in comp_json
    assert "optimal" not in comp_json
    assert "best" not in comp_json
    assert "recommended" not in comp_json


@pytest.mark.asyncio
async def test_grounded_scenario_explanation():
    """Verify explanation cites baseline deficit and estimates without hallucinated data."""
    inp = ScenarioInput(
        geo_id="IND_TN_DHM_HRR",
        sector="roads",
        coverage_improvement_pct=30.0,
        target_population_pct=60.0
    )
    res = await sandbox_service.simulate_scenario(inp)
    assert res.explanation is not None
    assert "HISTORICAL FACT" in res.explanation
    assert "SCENARIO ESTIMATE" in res.explanation


# =============================================================================
# 7. REST API ENDPOINT INTEGRATION TESTS
# =============================================================================

@pytest.mark.asyncio
async def test_simulate_endpoint_200():
    """Verify POST /api/v1/sandbox/simulate returns 200 with full ScenarioResult payload."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "water",
            "intervention_type": "SERVICE_COVERAGE_INCREASE",
            "coverage_improvement_pct": 25.0,
            "target_population_pct": 60.0
        }
        res = await ac.post("/api/v1/sandbox/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["scenario_id"].startswith("SCN-")
    assert data["sector"] == "water"
    assert data["classification"] == "SCENARIO_ESTIMATE"
    assert data["estimated_result"]["estimated_deficit"] >= 0.0


@pytest.mark.asyncio
async def test_list_scenarios_endpoint():
    """Verify GET /api/v1/sandbox/scenarios lists persisted scenarios."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/sandbox/scenarios")
    assert res.status_code == 200
    scenarios = res.json()["data"]
    assert isinstance(scenarios, list)
    assert len(scenarios) >= 1


@pytest.mark.asyncio
async def test_get_scenario_by_id_endpoint():
    """Verify GET /api/v1/sandbox/scenarios/{id} retrieves specific scenario."""
    inp = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="transport", coverage_improvement_pct=25.0)
    sim = await sandbox_service.simulate_scenario(inp)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get(f"/api/v1/sandbox/scenarios/{sim.scenario_id}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["scenario_id"] == sim.scenario_id


@pytest.mark.asyncio
async def test_scenario_404_not_found():
    """Verify GET /api/v1/sandbox/scenarios/NON_EXISTENT returns 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/sandbox/scenarios/SCN-NON-EXISTENT-999")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_compare_scenarios_endpoint():
    """Verify POST /api/v1/sandbox/compare executes side-by-side comparison."""
    inp_a = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="water", coverage_improvement_pct=20.0)
    inp_b = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="water", coverage_improvement_pct=50.0)
    sim_a = await sandbox_service.simulate_scenario(inp_a)
    sim_b = await sandbox_service.simulate_scenario(inp_b)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"scenario_ids": [sim_a.scenario_id, sim_b.scenario_id]}
        res = await ac.post("/api/v1/sandbox/compare", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["scenarios"]) == 2
    assert len(data["comparison_table"]) >= 4


@pytest.mark.asyncio
async def test_explain_scenario_endpoint():
    """Verify POST /api/v1/sandbox/{id}/explain returns grounded narrative."""
    inp = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="healthcare", coverage_improvement_pct=30.0)
    sim = await sandbox_service.simulate_scenario(inp)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(f"/api/v1/sandbox/{sim.scenario_id}/explain")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["scenario_id"] == sim.scenario_id
    assert len(data["explanation"]) > 30


@pytest.mark.asyncio
async def test_archive_scenario_endpoint():
    """Verify POST /api/v1/sandbox/{id}/archive soft-archives scenario."""
    inp = ScenarioInput(geo_id="IND_TN_DHM_HRR", sector="sanitation", coverage_improvement_pct=15.0)
    sim = await sandbox_service.simulate_scenario(inp)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post(f"/api/v1/sandbox/{sim.scenario_id}/archive")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["is_archived"] is True
