import hashlib
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.config import settings
from app.core.logging import logger
from app.core.taxonomy import validate_category
from app.db.bigquery_client import hotspot_repo, geography_repo, citizen_request_repo, demand_cluster_repo, db
from app.services.demand_aggregation_service import demand_aggregation_service

class HotspotDetectionService:
    """
    Phase 5 Demand Hotspot Detection Engine.
    Transforms aggregated citizen demand into deterministic, explainable geospatial demand hotspots.
    Computes weighted hotspot scores, assigns priority levels (CRITICAL, HIGH, MODERATE),
    guarantees deterministic hotspot identifiers, and provides component-level explainability.
    """
    def __init__(self):
        self.w_voice = getattr(settings, "HOTSPOT_WEIGHT_VOICE", 0.40)
        self.w_exposure = getattr(settings, "HOTSPOT_WEIGHT_EXPOSURE", 0.25)
        self.w_velocity = getattr(settings, "HOTSPOT_WEIGHT_VELOCITY", 0.20)
        self.w_concentration = getattr(settings, "HOTSPOT_WEIGHT_CONCENTRATION", 0.15)

        self.thresh_critical = getattr(settings, "HOTSPOT_CRITICAL_THRESHOLD", 0.70)
        self.thresh_high = getattr(settings, "HOTSPOT_HIGH_THRESHOLD", 0.45)
        self.thresh_moderate = getattr(settings, "HOTSPOT_MODERATE_THRESHOLD", 0.20)

        self.version = getattr(settings, "ANALYTICAL_VERSION", "v5.0-deterministic")
        self.default_window = getattr(settings, "HOTSPOT_TIME_WINDOW_DAYS", 14)
        self.disclaimer = "AI-Derived Analytical Signal — Not Official Policy"

    def generate_hotspot_id(self, geo_id: str, category: str, window_days: int) -> str:
        """
        Generates a deterministic hotspot identifier: HOT-{CAT}-{GEO}-{HASH}.
        The same (geo_id, category, window_days, version) always produces the identical ID.
        """
        cat_slug = category.upper()[:4]
        geo_slug = geo_id.upper()
        sig = f"{geo_id}_{category}_{window_days}_{self.version}".encode("utf-8")
        hash_suffix = hashlib.md5(sig).hexdigest()[:6].upper()
        return f"HOT-{cat_slug}-{geo_slug}-{hash_suffix}"

    def compute_hotspot_score(
        self,
        voice_intensity: float,
        population: int,
        trend_direction: str,
        velocity: Optional[float],
        concentration_ratio: float
    ) -> float:
        """
        Computes a deterministic, normalized hotspot score [0.0, 1.0].
        Components:
        1. Voice Intensity: Vvoice in [0.0, 1.0]
        2. Population Exposure: min(population / 100000, 1.0)
        3. Demand Velocity: Normalized based on trend category [0.0, 1.0]
        4. Category Concentration: Proportion of local complaints in this sector [0.0, 1.0]
        """
        # Component 1: Voice intensity [0, 1]
        c_voice = max(0.0, min(1.0, float(voice_intensity or 0.0)))

        # Component 2: Population exposure [0, 1] (benchmark: 100,000 citizens)
        c_exposure = min(max(0, int(population or 0)) / 100000.0, 1.0)

        # Component 3: Velocity signal [0, 1]
        if trend_direction == "RAPIDLY_INCREASING":
            c_velocity = 1.0
        elif trend_direction == "INCREASING":
            vel_val = float(velocity or 0.15)
            c_velocity = min(0.5 + (vel_val * 0.5), 0.90)
        elif trend_direction == "NEW_DEMAND":
            c_velocity = 0.55
        elif trend_direction == "STABLE":
            c_velocity = 0.25
        else:
            c_velocity = 0.0

        # Component 4: Concentration ratio [0, 1]
        c_conc = max(0.0, min(1.0, float(concentration_ratio or 0.0)))

        total_score = (
            (self.w_voice * c_voice) +
            (self.w_exposure * c_exposure) +
            (self.w_velocity * c_velocity) +
            (self.w_concentration * c_conc)
        )
        return round(min(1.0, max(0.0, total_score)), 4)

    def classify_hotspot_level(self, score: float) -> str:
        """Classifies numerical hotspot score into explainable tier: CRITICAL, HIGH, MODERATE, MONITORING."""
        if score >= self.thresh_critical:
            return "CRITICAL"
        elif score >= self.thresh_high:
            return "HIGH"
        elif score >= self.thresh_moderate:
            return "MODERATE"
        return "MONITORING"

    def compute_and_sync_hotspots(
        self,
        time_window_days: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes end-to-end hotspot generation from aggregated demand and syncs into repository.
        Idempotent: updates existing records without duplication.
        """
        window = time_window_days or self.default_window
        aggregations = demand_aggregation_service.aggregate_geographic_demand(time_window_days=window)
        now_str = datetime.utcnow().isoformat()

        hotspots: List[Dict[str, Any]] = []

        for agg in aggregations:
            # Only consider areas with at least 1 request
            if agg["request_count"] < getattr(settings, "HOTSPOT_MIN_REQUESTS", 1):
                continue

            v_intensity = agg["voice_intensity"]
            pop = agg["population"]
            trend = agg["trend_direction"]
            vel = agg["demand_velocity"]
            conc = agg["concentration_ratio"]

            score = self.compute_hotspot_score(
                voice_intensity=v_intensity,
                population=pop,
                trend_direction=trend,
                velocity=vel,
                concentration_ratio=conc
            )

            level = self.classify_hotspot_level(score)
            hotspot_id = self.generate_hotspot_id(agg["geo_id"], agg["category"], window)

            explanation = {
                "voice_intensity": v_intensity,
                "requests_per_1000": agg["requests_per_1000"],
                "population_exposure": pop,
                "demand_velocity_pct": agg["velocity_metrics"].get("velocity_pct"),
                "trend_direction": trend,
                "category_concentration_ratio": conc,
                "weights": {
                    "voice_intensity": self.w_voice,
                    "population_exposure": self.w_exposure,
                    "demand_velocity": self.w_velocity,
                    "category_concentration": self.w_concentration
                },
                "summary": (
                    f"{agg['request_count']} citizen requests recorded for {agg['category'].replace('_', ' ')} "
                    f"in {agg['geo_name']}. Voice intensity is {v_intensity} ({agg['requests_per_1000']} per 1,000 citizens) "
                    f"with {trend.replace('_', ' ').lower()} demand trend."
                )
            }

            hotspot_record = {
                "hotspot_id": hotspot_id,
                "geo_id": agg["geo_id"],
                "region_name": agg["geo_name"],
                "state_name": agg["state_name"],
                "state_code": agg["state_code"],
                "category": agg["category"],
                "hotspot_level": level,
                "hotspot_score": score,
                "voice_intensity_score": v_intensity,
                "voice_intensity": v_intensity,
                "demand_velocity": vel if vel is not None else 0.0,
                "growth_trend": trend,
                "trend_direction": trend,
                "estimated_population_impacted": pop,
                "population_exposure": pop,
                "request_count": agg["request_count"],
                "total_requests": agg["request_count"],
                "latitude": agg["latitude"],
                "longitude": agg["longitude"],
                "top_issue": agg["top_issue"],
                "associated_cluster_ids": agg.get("associated_cluster_ids", []),
                "cluster_id": agg.get("associated_cluster_ids", [None])[0] if agg.get("associated_cluster_ids") else None,
                "status": "active",
                "explanation": explanation,
                "time_window_days": window,
                "calculation_version": self.version,
                "generated_at": now_str,
                "disclaimer": self.disclaimer
            }

            # Upsert idempotently
            hotspot_repo.upsert_hotspot(hotspot_record)
            hotspots.append(hotspot_record)

        logger.info(f"Synchronized {len(hotspots)} demand hotspots in warehouse (version={self.version}).")
        return hotspots

    def list_hotspots(
        self,
        category: Optional[str] = None,
        hotspot_level: Optional[str] = None,
        state_code: Optional[str] = None,
        district: Optional[str] = None,
        block: Optional[str] = None,
        min_score: Optional[float] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Lists active demand hotspots from warehouse. If no hotspots exist, computes them first.
        """
        records = hotspot_repo.list_hotspots(
            category=category,
            hotspot_level=hotspot_level,
            state_code=state_code,
            min_score=min_score,
            limit=limit
        )

        if not records:
            # Sync fresh calculations
            self.compute_and_sync_hotspots()
            records = hotspot_repo.list_hotspots(
                category=category,
                hotspot_level=hotspot_level,
                state_code=state_code,
                min_score=min_score,
                limit=limit
            )

        # Apply district/block filters if provided
        filtered = []
        for r in records:
            if district and district.lower() not in r.get("region_name", "").lower() and district.lower() not in r.get("geo_id", "").lower():
                continue
            if block and block.lower() not in r.get("region_name", "").lower() and block.lower() not in r.get("geo_id", "").lower():
                continue
            r["disclaimer"] = self.disclaimer
            filtered.append(r)

        return filtered

    def get_hotspot_detail(self, hotspot_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single hotspot with detailed explanation components."""
        record = hotspot_repo.get_by_hotspot_id(hotspot_id)
        if not record:
            # Check if fresh sync reveals it
            self.compute_and_sync_hotspots()
            record = hotspot_repo.get_by_hotspot_id(hotspot_id)
        if record:
            record["disclaimer"] = self.disclaimer
        return record

    def get_summary_kpis(self) -> Dict[str, Any]:
        """
        Prepares aggregated telemetry for the Command Center based on actual warehouse data.
        """
        hotspots = self.list_hotspots(limit=1000)
        requests = citizen_request_repo.list_all(limit=10000)
        geos = geography_repo.list_all(limit=1000)

        # Count by category
        cat_counts: Dict[str, int] = {}
        for h in hotspots:
            cat = h.get("category", "other")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        # Count by state
        states = set(h.get("state_name") or h.get("state_code") for h in hotspots if h.get("state_name") or h.get("state_code"))
        districts = set(h.get("region_name") for h in hotspots if h.get("region_name"))

        # Increasing demand count
        increasing_count = sum(1 for h in hotspots if "INCREASING" in h.get("growth_trend", "").upper() or "NEW_DEMAND" in h.get("growth_trend", "").upper())

        # Total population exposed across distinct geo_ids
        distinct_geos = set(h.get("geo_id") for h in hotspots)
        total_exposed = sum(
            h.get("population_exposure", 0) for h in hotspots
            if h.get("geo_id") in distinct_geos
        )

        return {
            "total_citizen_requests": len(requests),
            "active_demand_hotspots": len(hotspots),
            "critical_hotspots_count": sum(1 for h in hotspots if h.get("hotspot_level") == "CRITICAL"),
            "high_hotspots_count": sum(1 for h in hotspots if h.get("hotspot_level") == "HIGH"),
            "moderate_hotspots_count": sum(1 for h in hotspots if h.get("hotspot_level") == "MODERATE"),
            "increasing_demand_areas": increasing_count,
            "states_covered": len(states),
            "districts_monitored": len(districts),
            "total_population_exposure": total_exposed,
            "category_distribution": cat_counts,
            "calculation_version": self.version,
            "disclaimer": self.disclaimer,
            "generated_at": datetime.utcnow().isoformat()
        }

hotspot_service = HotspotDetectionService()
