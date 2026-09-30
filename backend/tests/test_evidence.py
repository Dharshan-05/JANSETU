import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_evidence_brief_retrieval():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # First retrieve a silent need signal ID
        res = await ac.get("/api/v1/silent-need")
        signals = res.json()["data"]
        assert len(signals) > 0
        sig_id = signals[0]["signal_id"]

        # Fetch evidence brief for this signal
        ev_res = await ac.get(f"/api/v1/evidence/{sig_id}")
    assert ev_res.status_code == 200
    ev_data = ev_res.json()["data"]
    assert ev_data["signal_id"] == sig_id
    assert len(ev_data["grounded_evidence_trail"]) >= 2
    assert "not a guaranteed outcome" in ev_data["disclaimer"].lower()

@pytest.mark.asyncio
async def test_impact_evaluations_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/impact/evaluations")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert len(res["data"]) >= 1
    eval_item = res["data"][0]
    assert eval_item["after_accessibility_pct"] > eval_item["before_accessibility_pct"]
    assert eval_item["request_reduction_pct"] > 0
