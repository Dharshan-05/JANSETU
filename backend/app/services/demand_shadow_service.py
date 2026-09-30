from typing import List, Dict, Any, Optional
from datetime import datetime

from app.config import settings
from app.core.logging import logger
from app.core.taxonomy import validate_category
from app.db.bigquery_client import (
    db,
    geography_repo,
    infrastructure_repo,
    citizen_request_repo
)
from app.services.demand_aggregation_service import demand_aggregation_service

class DemandShadowService:
    """
    Phase 5 Demand Shadow 2D Matrix Engine.
    Correlates citizen voice intensity (Axis X: Vvoice) against infrastructure need deficit (Axis Y: Ineed).
    Classifies geographic regions into 4 strictly neutral analytical quadrants:
    1. HIGH_VOICE_HIGH_NEED (Demand Hotspot)
    2. LOW_VOICE_HIGH_NEED (Potential Demand-Need Discrepancy / Candidate for admin review)
    3. HIGH_VOICE_LOW_NEED (Expressed Demand / Lower Baseline Deficit)
    4. LOW_VOICE_LOW_NEED (Low Current Signal)

    Strictly complies with neutral analytical framing:
    - Never prescribes government policy, budget, or construction.
    - All outputs labeled with AI-derived analytical disclaimer.
    """

    def __init__(self):
        self.thresh_voice = getattr(settings, "SHADOW_VOICE_THRESHOLD", 0.40)
        self.thresh_need = getattr(settings, "SHADOW_NEED_THRESHOLD", 0.50)
        self.analytical_version = getattr(settings, "ANALYTICAL_VERSION", "v5.0-deterministic")
        self.disclaimer = "AI-Derived Analytical Signal — Not Official Policy"

    def classify_quadrant(self, voice_intensity: float, need_deficit: float) -> Dict[str, str]:
        """
        Classifies voice vs need coordinates into one of 4 neutral analytical quadrants.
        """
        v = float(voice_intensity)
        n = float(need_deficit)

        if v >= self.thresh_voice and n >= self.thresh_need:
            return {
                "quadrant": "HIGH_VOICE_HIGH_NEED",
                "label": "Demand Hotspot",
                "color": "#EF4444",  # Red / Critical Demand
                "description": "High citizen demand density corroborating elevated infrastructure deficit.",
                "action_guidance": "High priority for administrative review and operational verification."
            }
        elif v < self.thresh_voice and n >= self.thresh_need:
            return {
                "quadrant": "LOW_VOICE_HIGH_NEED",
                "label": "Potential Demand-Need Discrepancy",
                "color": "#8B5CF6",  # Purple / Discrepancy
                "description": "High infrastructure deficit with lower citizen reporting volume. Potential Silent-Need Candidate Quadrant — Not a Silent Need determination. Requires further administrative validation.",
                "action_guidance": "Verify digital accessibility, reporting barriers, and ground physical surveys."
            }
        elif v >= self.thresh_voice and n < self.thresh_need:
            return {
                "quadrant": "HIGH_VOICE_LOW_NEED",
                "label": "Expressed Demand / Lower Deficit",
                "color": "#F59E0B",  # Amber / Divergence
                "description": "High civic voice density despite lower measured baseline deficit.",
                "action_guidance": "Examine potential emerging local issues, maintenance requests, or non-baseline concerns."
            }
        else:
            return {
                "quadrant": "LOW_VOICE_LOW_NEED",
                "label": "Low Current Signal",
                "color": "#10B981",  # Emerald / Baseline
                "description": "Low reporting volume and lower measured infrastructure deficit.",
                "action_guidance": "Continue routine monitoring and maintenance."
            }

    def compute_demand_shadow_matrix(
        self,
        geo_id: Optional[str] = None,
        geo_level: Optional[str] = None,
        category: Optional[str] = None,
        state_code: Optional[str] = None,
        time_window_days: int = 14,
        min_voice: Optional[float] = None,
        min_need: Optional[float] = None,
        quadrant_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates the 2D Demand Shadow Matrix across geographies.
        Pulls infrastructure deficit from the infrastructure repository,
        computes citizen voice intensity via demand_aggregation_service,
        and returns enriched matrix points with quadrant classifications and summary KPIs.
        """
        # Validate category if provided
        if category:
            is_valid, canon_cat = validate_category(category)
            if is_valid:
                category = canon_cat

        # Load reference data
        geos = db.get_records("geography")
        demographics_map = {d.get("geo_id"): d for d in db.get_records("demographics")}
        infra_records = db.get_records("infrastructure")

        matrix_items: List[Dict[str, Any]] = []
        quadrant_counts = {
            "HIGH_VOICE_HIGH_NEED": 0,
            "LOW_VOICE_HIGH_NEED": 0,
            "HIGH_VOICE_LOW_NEED": 0,
            "LOW_VOICE_LOW_NEED": 0
        }

        total_voice_sum = 0.0
        total_need_sum = 0.0

        for g in geos:
            gid = g.get("geo_id")
            if not gid:
                continue

            # Filtering
            if geo_id and gid != geo_id:
                continue
            if geo_level and g.get("geo_level") != geo_level:
                continue
            if state_code and g.get("state_code") != state_code:
                continue

            demo = demographics_map.get(gid, {})
            pop = int(demo.get("total_population", 0) or g.get("population", 0) or 50000)
            digital_access = float(demo.get("digital_penetration_index", 0.5) or 0.5)

            # Compute category-specific or overall infrastructure deficit
            geo_infra = [i for i in infra_records if i.get("geo_id") == gid]
            if category:
                geo_infra = [i for i in geo_infra if i.get("sector") == category or i.get("category") == category]

            if geo_infra:
                deficit_score = sum(float(i.get("deficit_score", 0.5) or 0.5) for i in geo_infra) / len(geo_infra)
            else:
                # Default baseline deficit if no direct record
                deficit_score = 0.45

            deficit_score = round(max(0.0, min(1.0, deficit_score)), 3)

            # Compute citizen voice intensity
            voice_metrics = demand_aggregation_service.compute_voice_intensity(
                geo_id=gid,
                category=category,
                time_window_days=time_window_days
            )
            voice_intensity = voice_metrics.get("voice_intensity", 0.0)
            raw_request_count = voice_metrics.get("request_count", 0)

            # Apply min filters if requested
            if min_voice is not None and voice_intensity < min_voice:
                continue
            if min_need is not None and deficit_score < min_need:
                continue

            # Classify quadrant
            quad_info = self.classify_quadrant(voice_intensity, deficit_score)
            quad_code = quad_info["quadrant"]

            if quadrant_filter and quad_code != quadrant_filter:
                continue

            quadrant_counts[quad_code] = quadrant_counts.get(quad_code, 0) + 1
            total_voice_sum += voice_intensity
            total_need_sum += deficit_score

            # Discrepancy = Need - Voice
            discrepancy = round(deficit_score - voice_intensity, 3)

            matrix_items.append({
                "geo_id": gid,
                "region_name": g.get("name", "Unknown Region"),
                "state_code": g.get("state_code", "Unknown"),
                "geo_level": str(g.get("geo_level", "district")),
                "latitude": float(g.get("latitude", 0.0) or 0.0),
                "longitude": float(g.get("longitude", 0.0) or 0.0),
                "population": pop,
                "digital_access_score": round(digital_access, 3),
                "voice_intensity": voice_intensity,
                "infrastructure_need": deficit_score,
                "discrepancy_magnitude": discrepancy,
                "raw_request_count": raw_request_count,
                "quadrant": quad_code,
                "quadrant_label": quad_info["label"],
                "quadrant_description": quad_info["description"],
                "action_guidance": quad_info["action_guidance"],
                "status_color": quad_info["color"],
                "category": category or "ALL",
                "time_window_days": time_window_days,
                "analytical_version": self.analytical_version,
                "disclaimer": self.disclaimer
            })

        count = len(matrix_items)
        avg_voice = round(total_voice_sum / max(1, count), 3) if count > 0 else 0.0
        avg_need = round(total_need_sum / max(1, count), 3) if count > 0 else 0.0

        return {
            "matrix": matrix_items,
            "summary": {
                "total_geographies_analyzed": count,
                "quadrant_counts": quadrant_counts,
                "average_voice_intensity": avg_voice,
                "average_need_deficit": avg_need,
                "voice_threshold": self.thresh_voice,
                "need_threshold": self.thresh_need,
                "filter_category": category or "ALL",
                "filter_state": state_code or "ALL",
                "time_window_days": time_window_days,
                "analytical_version": self.analytical_version,
                "disclaimer": self.disclaimer,
                "generated_at": datetime.utcnow().isoformat()
            }
        }

demand_shadow_service = DemandShadowService()
