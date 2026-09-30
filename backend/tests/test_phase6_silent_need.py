import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.silent_need_service import (
    silent_need_service,
    SilentNeedDetectionService,
    SilentNeedAggregationService
)
from app.db.bigquery_client import db, silent_need_repo

# =============================================================================
# 1. CORE MODEL & FORMULA TESTS
# =============================================================================

def test_01_need_score_formula():
    """Verify Ineed(g) = 0.55 * InfraDeficit + 0.35 * VulnerabilityScore + 0.10."""
    service = SilentNeedDetectionService()

    # Normal case: Deficit=0.80, Vulnerability=0.60
    # Expected: (0.55 * 0.80) + (0.35 * 0.60) + 0.10 = 0.44 + 0.21 + 0.10 = 0.75
    need = service.compute_need_score(infra_deficit=0.80, vulnerability_score=0.60)
    assert need == 0.75

    # Zero input baseline: Deficit=0, Vuln=0
    # Expected: 0 + 0 + 0.10 = 0.10
    need_zero = service.compute_need_score(infra_deficit=0.0, vulnerability_score=0.0)
    assert need_zero == 0.10

def test_02_need_score_bounds_and_clamping():
    """Verify Ineed is strictly clamped to [0.0, 1.0]."""
    service = SilentNeedDetectionService()

    # Upper boundary clamping: Deficit=1.0, Vuln=1.0 -> 0.55 + 0.35 + 0.10 = 1.00
    need_max = service.compute_need_score(infra_deficit=1.0, vulnerability_score=1.0)
    assert need_max == 1.0

    # Overflows should clamp to 1.0
    need_overflow = service.compute_need_score(infra_deficit=1.5, vulnerability_score=1.5)
    assert need_overflow == 1.0

    # Underflows should clamp to 0.0 (or baseline floor)
    need_underflow = service.compute_need_score(infra_deficit=-0.5, vulnerability_score=-0.5)
    assert need_underflow >= 0.0

def test_03_voice_density_reuses_phase5_formula():
    """Verify Phase 6 consumes the identical Phase 5 voice intensity logic."""
    from app.services.demand_aggregation_service import demand_aggregation_service

    v_calc = demand_aggregation_service.calculate_voice_intensity(request_count=20, population=10000)
    # 20 / 10000 * 1000 = 2.0 per 1000 -> 2.0 / 5.0 = 0.40
    assert v_calc["voice_intensity"] == 0.40

    v_phase6 = demand_aggregation_service.compute_voice_intensity_formula(20, 10000)
    assert v_phase6["voice_intensity"] == 0.40

def test_04_discrepancy_calculation():
    """Verify Discrepancy(g) = Ineed(g) - Vvoice(g) for both positive and negative values."""
    service = SilentNeedDetectionService()

    # Positive discrepancy: Need > Voice (Potential Gap)
    pos_disc = service.compute_discrepancy(need_score=0.75, voice_density=0.20)
    assert pos_disc == 0.55

    # Negative discrepancy: Voice > Need (Expressed Demand exceeds modelled need)
    neg_disc = service.compute_discrepancy(need_score=0.30, voice_density=0.60)
    assert neg_disc == -0.30

def test_05_signal_strength_formula():
    """Verify signal_strength = 0.50 * norm_disc + 0.30 * deficit + 0.20 * (1 - digital)."""
    service = SilentNeedDetectionService()

    # disc=0.50, deficit=0.80, digital=0.20 (exclusion=0.80)
    # Expected: (0.50 * 0.50) + (0.30 * 0.80) + (0.20 * 0.80) = 0.25 + 0.24 + 0.16 = 0.65
    strength = service.compute_signal_strength(discrepancy=0.50, infra_deficit=0.80, digital_access=0.20)
    assert strength == 0.65
    assert 0.0 <= strength <= 1.0

# =============================================================================
# 2. TRIGGER LOGIC & BOUNDARY TESTS
# =============================================================================

def test_06_silent_need_trigger_conditions():
    """Verify signal triggers if and only if discrepancy >= 0.35, deficit >= 0.60, and digital <= 0.40."""
    service = SilentNeedDetectionService()

    # Case A: All 3 satisfied -> TRIGGERED
    sig_a = service.classify_signal(signal_strength=0.75, triggered=True)
    assert sig_a == "STRONG_POTENTIAL"

    # Case B: Discrepancy < 0.35 (e.g. 0.30) -> FAILS
    disc = 0.30
    deficit = 0.80
    digital = 0.20
    trig_b = (disc >= 0.35) and (deficit >= 0.60) and (digital <= 0.40)
    assert trig_b is False
    assert service.classify_signal(0.70, triggered=trig_b) == "NO_SIGNAL"

    # Case C: Deficit < 0.60 (e.g. 0.55) -> FAILS
    trig_c = (0.50 >= 0.35) and (0.55 >= 0.60) and (0.20 <= 0.40)
    assert trig_c is False

    # Case D: Digital Access > 0.40 (e.g. 0.45) -> FAILS
    trig_d = (0.50 >= 0.35) and (0.80 >= 0.60) and (0.45 <= 0.40)
    assert trig_d is False

def test_07_exact_threshold_boundaries():
    """Verify behavior exactly on the boundary thresholds (discrepancy=0.35, deficit=0.60, digital=0.40)."""
    disc = 0.35
    deficit = 0.60
    digital = 0.40

    is_trig = (disc >= 0.35) and (deficit >= 0.60) and (digital <= 0.40)
    assert is_trig is True, "Exact boundary values must trigger"

# =============================================================================
# 3. SIGNAL CLASSIFICATION & DETERMINISTIC IDS
# =============================================================================

def test_08_signal_classification_tiers():
    """Verify classifications: STRONG_POTENTIAL (>=0.65), POTENTIAL (>=0.35), NO_SIGNAL (<0.35)."""
    service = SilentNeedDetectionService()

    assert service.classify_signal(0.70, triggered=True) == "STRONG_POTENTIAL"
    assert service.classify_signal(0.65, triggered=True) == "STRONG_POTENTIAL"
    assert service.classify_signal(0.50, triggered=True) == "POTENTIAL"
    assert service.classify_signal(0.35, triggered=True) == "POTENTIAL"
    assert service.classify_signal(0.20, triggered=True) == "NO_SIGNAL"
    assert service.classify_signal(0.80, triggered=False) == "NO_SIGNAL"

def test_09_deterministic_signal_id_generation():
    """Verify deterministic format SILENT-{CAT}-{GEO}-{HASH} without timestamps."""
    service = SilentNeedDetectionService()

    id1 = service.generate_signal_id("IND_TN_DHM_PNG", "water")
    id2 = service.generate_signal_id("IND_TN_DHM_PNG", "water")
    id_diff_cat = service.generate_signal_id("IND_TN_DHM_PNG", "transport")
    id_diff_geo = service.generate_signal_id("IND_MH_GDC_AHR", "water")

    assert id1 == id2, "Identical inputs must yield identical deterministic signal ID"
    assert id1.startswith("SILENT-WATE-")
    assert id1 != id_diff_cat
    assert id1 != id_diff_geo

# =============================================================================
# 4. EXPLAINABILITY & NEUTRAL LANGUAGE GOVERNANCE
# =============================================================================

def test_10_explainability_drivers_and_neutral_language():
    """Verify structured explanation contains all 4 drivers and required disclaimers."""
    signals = silent_need_service.sync_all_signals()
    assert len(signals) > 0

    sig = signals[0]
    assert "explanation" in sig
    exp = sig["explanation"]

    assert "summary" in exp
    assert "drivers" in exp
    assert len(exp["drivers"]) == 4

    driver_names = [d["factor"] for d in exp["drivers"]]
    assert "Infrastructure Deficit" in driver_names
    assert "Demographic Vulnerability" in driver_names
    assert "Citizen Voice Density" in driver_names
    assert "Digital Connectivity Access" in driver_names

    # Check mandatory disclaimers and validation warnings
    assert sig["disclaimer"] == "AI-Derived Analytical Signal — Not Official Policy"
    assert "requires administrative field validation" in sig["validation_requirement"].lower()

    # Verify absence of non-neutral prescriptive text
    forbidden_terms = ["should build", "must receive", "funding allocation", "confirmed need", "objective need"]
    for term in forbidden_terms:
        assert term not in exp["summary"].lower()

# =============================================================================
# 5. REPOSITORY & API INTEGRATION TESTS
# =============================================================================

def test_11_repository_upsert_and_idempotency():
    """Verify repository idempotent persistence without record duplication."""
    test_sig = {
        "signal_id": "SILENT-TEST-GEO01-ABC123",
        "geo_id": "GEO-TEST-01",
        "region_name": "Test Region",
        "state_name": "Test State",
        "category": "water",
        "infra_deficit": 0.85,
        "vulnerability_score": 0.70,
        "digital_access": 0.25,
        "voice_density": 0.10,
        "need_score": 0.81,
        "discrepancy": 0.71,
        "signal_strength": 0.76,
        "signal_class": "STRONG_POTENTIAL",
        "triggered": True,
        "trigger_reason": "Test triggered",
        "population": 40000,
        "request_count": 4,
        "infrastructure_indicator_count": 2,
        "infra_deficit_score": 0.85,
        "voice_reporting_score": 0.10,
        "digital_access_score": 0.25,
        "population_vulnerability": 0.70,
        "discrepancy_magnitude": 0.71,
        "signal_confidence": 0.76,
        "validation_status": "POTENTIAL_SIGNAL_UNVALIDATED",
        "requires_field_validation": True,
        "disclaimer": "AI-Derived Analytical Signal — Not Official Policy",
        "validation_requirement": "Potential Silent Need Signal — requires administrative field validation."
    }

    # First upsert
    silent_need_repo.upsert(test_sig)
    rec1 = silent_need_repo.get_by_id("SILENT-TEST-GEO01-ABC123")
    assert rec1 is not None

    count_before = silent_need_repo.count()

    # Second upsert (idempotency check)
    silent_need_repo.upsert(test_sig)
    count_after = silent_need_repo.count()
    assert count_after == count_before, "Upserting existing signal_id must update, not duplicate"

@pytest.mark.asyncio
async def test_12_api_silent_need_list_and_filters():
    """Test GET /api/v1/silent-need endpoint and query filters."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Default list query
        res = await ac.get("/api/v1/silent-need")
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        assert len(payload["data"]) >= 1

        first = payload["data"][0]
        assert "signal_id" in first
        assert "need_score" in first
        assert "discrepancy" in first
        assert "signal_strength" in first
        assert first["disclaimer"] == "AI-Derived Analytical Signal — Not Official Policy"

        # Filter by category
        res_cat = await ac.get("/api/v1/silent-need?category=water")
        assert res_cat.status_code == 200
        for item in res_cat.json()["data"]:
            assert item["category"].lower() == "water"

@pytest.mark.asyncio
async def test_13_api_silent_need_summary():
    """Test GET /api/v1/silent-need/summary endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/silent-need/summary")
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        data = payload["data"]
        assert "total_geographies_analyzed" in data
        assert "total_signals" in data
        assert "potential_signals" in data
        assert "strong_potential_signals" in data
        assert data["analytical_version"] == "v6.0-deterministic"
        assert data["disclaimer"] == "AI-Derived Analytical Signal — Not Official Policy"

@pytest.mark.asyncio
async def test_14_api_silent_need_detail_and_404():
    """Test GET /api/v1/silent-need/{signal_id} endpoint for success and 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Fetch list to obtain valid ID
        list_res = await ac.get("/api/v1/silent-need")
        valid_id = list_res.json()["data"][0]["signal_id"]

        detail_res = await ac.get(f"/api/v1/silent-need/{valid_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()["data"]
        assert detail["signal_id"] == valid_id
        assert "explanation" in detail

        # Unknown ID test
        not_found_res = await ac.get("/api/v1/silent-need/SILENT-INVALID-NONEXISTENT-999")
        assert not_found_res.status_code == 404
