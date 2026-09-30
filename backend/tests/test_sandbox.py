import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_policy_sandbox_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "geo_id": "IND_TN_DHM_HRR",
            "sector": "transport",
            "intervention_type": "ADD_BUS_ROUTES",
            "parameters": {
                "additional_evening_routes": 8,
                "fleet_allocation": "mini_electric_feeder",
                "estimated_budget_inr": 6400000
            }
        }
        response = await ac.post("/api/v1/sandbox/simulate", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["estimated_population_benefited"] > 10000
    assert data["projected_accessibility_index"] > data["current_accessibility_index"]
    assert "not a guaranteed outcome" in data["disclaimer"].lower()
    assert data["addressed_clusters_count"] >= 1

@pytest.mark.asyncio
async def test_civic_digital_twin_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/digital-twin/IND_TN_DHM_HRR")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    twin = res["data"]
    assert twin["admin_name"] == "Harur Block"
    assert twin["civic_health_radar"]["transport_access"] is not None
    assert twin["population_metrics"]["total_population"] == 194820
