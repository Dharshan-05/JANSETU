import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.demand_aggregation_service import demand_aggregation_service
from app.services.hotspot_service import hotspot_service
from app.services.demand_shadow_service import demand_shadow_service
from app.config import settings

@pytest.mark.asyncio
async def test_01_deterministic_hotspot_id_generation():
    """Verify deterministic hotspot ID format HOT-{CAT}-{GEO}-{HASH} and repeatability."""
    id1 = hotspot_service.generate_hotspot_id("GEO-TN-CHE-001", "transport", 14)
    id2 = hotspot_service.generate_hotspot_id("GEO-TN-CHE-001", "transport", 14)
    id_diff_geo = hotspot_service.generate_hotspot_id("GEO-UP-VAR-001", "transport", 14)
    id_diff_cat = hotspot_service.generate_hotspot_id("GEO-TN-CHE-001", "water", 14)

    assert id1 == id2, "Identical inputs must yield identical deterministic hotspot ID"
    assert id1.startswith("HOT-TRAN-GEO-TN-CHE-001-")
    assert id1 != id_diff_geo
    assert id1 != id_diff_cat

def test_02_voice_intensity_formula_and_zero_population_safety():
    """Verify voice intensity formula Vvoice(g, t) and safety against zero or missing population."""
    # Normal case: 25 requests in 10,000 pop -> 2.5 per 1,000 -> 2.5 / 5.0 = 0.50
    v1 = demand_aggregation_service.compute_voice_intensity_formula(25, 10000)
    assert v1["voice_intensity"] == 0.50
    assert v1["requests_per_1000"] == 2.5

    # Capped at 1.0: 100 requests in 1,000 pop -> 100 per 1,000 -> 20.0 -> capped at 1.0
    v2 = demand_aggregation_service.compute_voice_intensity_formula(100, 1000)
    assert v2["voice_intensity"] == 1.0

    # Zero population safety: no division by zero error, returns 0.0
    v_zero = demand_aggregation_service.compute_voice_intensity_formula(10, 0)
    assert v_zero["voice_intensity"] == 0.0
    assert v_zero["status"] == "ZERO_OR_MISSING_POPULATION"

    # Negative population safety
    v_neg = demand_aggregation_service.compute_voice_intensity_formula(10, -500)
    assert v_neg["voice_intensity"] == 0.0

def test_03_demand_velocity_and_zero_baseline_safety():
    """Verify velocity formula (curr - prev)/prev and explicit zero baseline handling."""
    # Normal positive growth: prev=10, curr=15 -> +50%
    vel1 = demand_aggregation_service.compute_demand_velocity_metrics(15, 10)
    assert vel1["velocity"] == 0.50
    assert vel1["velocity_pct"] == 50.0
    assert vel1["trend_direction"] == "RAPIDLY_INCREASING"

    # Normal moderate growth: prev=10, curr=12 -> +20%
    vel2 = demand_aggregation_service.compute_demand_velocity_metrics(12, 10)
    assert vel2["trend_direction"] == "INCREASING"

    # Stable: prev=10, curr=10 -> 0%
    vel3 = demand_aggregation_service.compute_demand_velocity_metrics(10, 10)
    assert vel3["trend_direction"] == "STABLE"

    # Decreasing: prev=20, curr=10 -> -50%
    vel4 = demand_aggregation_service.compute_demand_velocity_metrics(10, 20)
    assert vel4["trend_direction"] == "DECREASING"

    # Zero baseline with new demand: prev=0, curr=5 -> not infinite, labeled NEW_DEMAND
    vel_zero = demand_aggregation_service.compute_demand_velocity_metrics(5, 0)
    assert vel_zero["velocity"] is None
    assert vel_zero["trend_direction"] == "NEW_DEMAND"

    # Zero in both windows: prev=0, curr=0 -> INSUFFICIENT_DATA
    vel_none = demand_aggregation_service.compute_demand_velocity_metrics(0, 0)
    assert vel_none["velocity"] == 0.0
    assert vel_none["trend_direction"] == "INSUFFICIENT_DATA"

def test_04_deterministic_hotspot_scoring_and_weights():
    """Verify weighted hotspot score calculation and bounded range [0.0, 1.0]."""
    score = hotspot_service.compute_hotspot_score(
        voice_intensity=0.80,
        population=80000,
        trend_direction="RAPIDLY_INCREASING",
        velocity=0.40,
        concentration_ratio=0.60
    )
    assert 0.0 <= score <= 1.0
    assert score > 0.60, "High voice, large pop, rapid trend should result in elevated score"

    # Minimum score check
    min_score = hotspot_service.compute_hotspot_score(
        voice_intensity=0.0,
        population=0,
        trend_direction="INSUFFICIENT_DATA",
        velocity=0.0,
        concentration_ratio=0.0
    )
    assert min_score == 0.0

def test_05_priority_level_classification():
    """Verify classification into CRITICAL, HIGH, MODERATE priority tiers."""
    assert hotspot_service.classify_hotspot_level(0.85) == "CRITICAL"
    assert hotspot_service.classify_hotspot_level(0.70) == "CRITICAL"
    assert hotspot_service.classify_hotspot_level(0.55) == "HIGH"
    assert hotspot_service.classify_hotspot_level(0.45) == "HIGH"
    assert hotspot_service.classify_hotspot_level(0.30) == "MODERATE"
    assert hotspot_service.classify_hotspot_level(0.20) == "MODERATE"
    assert hotspot_service.classify_hotspot_level(0.10) == "MONITORING"

def test_06_explainability_components():
    """Verify that detected hotspots contain all 4 explanation components and weights."""
    hotspots = hotspot_service.compute_and_sync_hotspots()
    assert len(hotspots) > 0

    h = hotspots[0]
    assert "explanation" in h
    exp = h["explanation"]
    assert "voice_intensity" in exp
    assert "population_exposure" in exp
    assert "trend_direction" in exp
    assert "category_concentration_ratio" in exp
    assert "weights" in exp
    assert exp["weights"]["voice_intensity"] == 0.40
    assert exp["weights"]["population_exposure"] == 0.25
    assert exp["weights"]["demand_velocity"] == 0.20
    assert exp["weights"]["category_concentration"] == 0.15
    assert "summary" in exp

def test_07_demand_shadow_quadrant_classification():
    """Verify 4 neutral analytical quadrants for Demand Shadow matrix."""
    # Quadrant 1: High Voice (>=0.40) + High Need (>=0.50) -> Demand Hotspot
    q1 = demand_shadow_service.classify_quadrant(0.60, 0.75)
    assert q1["quadrant"] == "HIGH_VOICE_HIGH_NEED"
    assert q1["label"] == "Demand Hotspot"

    # Quadrant 2: Low Voice (<0.40) + High Need (>=0.50) -> Potential Discrepancy
    q2 = demand_shadow_service.classify_quadrant(0.20, 0.80)
    assert q2["quadrant"] == "LOW_VOICE_HIGH_NEED"
    assert q2["label"] == "Potential Demand-Need Discrepancy"
    assert "Potential Silent-Need Candidate" in q2["description"]

    # Quadrant 3: High Voice (>=0.40) + Low Need (<0.50) -> Expressed Demand
    q3 = demand_shadow_service.classify_quadrant(0.65, 0.30)
    assert q3["quadrant"] == "HIGH_VOICE_LOW_NEED"
    assert q3["label"] == "Expressed Demand / Lower Deficit"

    # Quadrant 4: Low Voice (<0.40) + Low Need (<0.50) -> Low Current Signal
    q4 = demand_shadow_service.classify_quadrant(0.15, 0.25)
    assert q4["quadrant"] == "LOW_VOICE_LOW_NEED"
    assert q4["label"] == "Low Current Signal"

def test_08_demand_shadow_matrix_computation():
    """Verify 2D matrix calculation, discrepancy magnitude, and summary stats."""
    res = demand_shadow_service.compute_demand_shadow_matrix()
    assert "matrix" in res
    assert "summary" in res
    assert len(res["matrix"]) > 0

    item = res["matrix"][0]
    assert "geo_id" in item
    assert "voice_intensity" in item
    assert "infrastructure_need" in item
    assert "discrepancy_magnitude" in item
    assert item["discrepancy_magnitude"] == round(item["infrastructure_need"] - item["voice_intensity"], 3)
    assert "quadrant" in item
    assert item["disclaimer"] == "AI-Derived Analytical Signal — Not Official Policy"

    summary = res["summary"]
    assert summary["total_geographies_analyzed"] == len(res["matrix"])
    assert "quadrant_counts" in summary
    assert "disclaimer" in summary

@pytest.mark.asyncio
async def test_09_api_list_hotspots_endpoint():
    """Test GET /api/v1/hotspots endpoint with query filters."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Default query
        res = await ac.get("/api/v1/hotspots")
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        assert len(payload["data"]) > 0

        first = payload["data"][0]
        assert "hotspot_id" in first
        assert "hotspot_score" in first
        assert "voice_intensity_score" in first
        assert "growth_trend" in first
        assert "disclaimer" in first
        assert "Not Official Policy" in first["disclaimer"]

        # Filter by category
        res_cat = await ac.get("/api/v1/hotspots?category=transport")
        assert res_cat.status_code == 200
        data_cat = res_cat.json()["data"]
        for h in data_cat:
            assert h["category"] == "transport"

@pytest.mark.asyncio
async def test_10_api_hotspots_summary_endpoint():
    """Test GET /api/v1/hotspots/summary endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/hotspots/summary")
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        data = payload["data"]
        assert "active_demand_hotspots" in data
        assert "total_citizen_requests" in data
        assert "category_distribution" in data
        assert "disclaimer" in data
        assert "Not Official Policy" in data["disclaimer"]

@pytest.mark.asyncio
async def test_11_api_hotspot_detail_endpoint():
    """Test GET /api/v1/hotspots/{hotspot_id} endpoint for success and 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Fetch list to get a valid ID
        list_res = await ac.get("/api/v1/hotspots")
        valid_id = list_res.json()["data"][0]["hotspot_id"]

        detail_res = await ac.get(f"/api/v1/hotspots/{valid_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()["data"]
        assert detail["hotspot_id"] == valid_id
        assert "explanation" in detail
        assert detail["explanation"] is not None

        # 404 test
        not_found_res = await ac.get("/api/v1/hotspots/HOT-INVALID-NONEXISTENT-999")
        assert not_found_res.status_code == 404

@pytest.mark.asyncio
async def test_12_api_demand_shadow_endpoint_and_filters():
    """Test GET /api/v1/demand-shadow endpoint and filtering."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/demand-shadow")
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        data = payload["data"]
        assert "matrix" in data
        assert "summary" in data
        assert len(data["matrix"]) > 0

        # Filter by quadrant
        res_quad = await ac.get("/api/v1/demand-shadow?quadrant=HIGH_VOICE_HIGH_NEED")
        assert res_quad.status_code == 200
        data_quad = res_quad.json()["data"]["matrix"]
        for item in data_quad:
            assert item["quadrant"] == "HIGH_VOICE_HIGH_NEED"

@pytest.mark.asyncio
async def test_13_backward_compatibility_analytics_demand_shadow():
    """Verify that existing GET /api/v1/analytics/demand-shadow continues to work."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/analytics/demand-shadow")
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        assert "zones" in payload
        assert len(payload["zones"]) > 0
