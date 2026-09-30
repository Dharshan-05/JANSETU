import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_silent_need_detection_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/silent-need")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert len(res["data"]) >= 1
    
    # Verify signature attributes
    signal = res["data"][0]
    assert signal["discrepancy_magnitude"] >= 0.35
    assert signal["digital_access_score"] <= 0.40
    assert signal["validation_status"] == "POTENTIAL_SIGNAL_UNVALIDATED"
    assert "requires validation" in res["message"].lower() or "potential" in res["message"].lower()

@pytest.mark.asyncio
async def test_demand_shadow_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/analytics/demand-shadow")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "zones" in res
    assert len(res["zones"]) > 0
    quadrants = set(z["quadrant"] for z in res["zones"])
    assert any("HOTSPOT" in q or "SILENT" in q for q in quadrants)
