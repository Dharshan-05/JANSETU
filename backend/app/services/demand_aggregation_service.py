import math
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

from app.config import settings
from app.core.logging import logger
from app.core.taxonomy import validate_category, CATEGORIES
from app.db.bigquery_client import (
    citizen_request_repo,
    demand_cluster_repo,
    geography_repo,
    demographics_repo
)

class DemandAggregationService:
    """
    Phase 5 Demand Aggregation Engine.
    Deterministically aggregates canonical citizen requests and semantic demand clusters
    across geographic administrative boundaries and civic infrastructure sectors.
    Calculates normalized voice intensity, demand velocity, population exposure,
    and category demand concentration.
    """
    def __init__(self):
        self.default_window_days = getattr(settings, "HOTSPOT_TIME_WINDOW_DAYS", 14)
        self.increasing_thresh = getattr(settings, "HOTSPOT_VELOCITY_INCREASING", 0.10)
        self.rapid_thresh = getattr(settings, "HOTSPOT_VELOCITY_RAPID", 0.35)
        self.decreasing_thresh = getattr(settings, "HOTSPOT_VELOCITY_DECREASING", -0.10)
        self.calculation_version = getattr(settings, "ANALYTICAL_VERSION", "v5.0-deterministic")

    def calculate_voice_intensity(self, request_count: int, population: int) -> Dict[str, Any]:
        """
        Calculates normalized citizen voice intensity according to the canonical JANSETU specification:
        Vvoice(g, t) = min( (RequestCount(g, t) / Population(g)) * (1000 / 5.0), 1.0 )

        Safely handles population = 0, missing population, and missing requests.
        Always exposes both the raw request count, population, requests per 1000, and normalized score.
        """
        req_count = max(0, int(request_count or 0))
        pop = int(population or 0)

        if pop <= 0:
            return {
                "raw_request_count": req_count,
                "population": 0,
                "requests_per_1000": 0.0,
                "voice_intensity": 0.0,
                "status": "ZERO_OR_MISSING_POPULATION",
                "measurement_status": "ZERO_OR_MISSING_POPULATION",
                "formula": "min((RequestCount / Population) * (1000 / 5.0), 1.0)"
            }

        requests_per_1000 = (req_count / float(pop)) * 1000.0
        # Benchmark: 5 requests per 1,000 citizens = 1.0 saturation
        normalized_intensity = min(requests_per_1000 / 5.0, 1.0)

        return {
            "raw_request_count": req_count,
            "population": pop,
            "requests_per_1000": round(requests_per_1000, 4),
            "voice_intensity": round(normalized_intensity, 4),
            "status": "VALID",
            "measurement_status": "VALID",
            "formula": "min((RequestCount / Population) * (1000 / 5.0), 1.0)"
        }

    compute_voice_intensity_formula = calculate_voice_intensity

    def calculate_demand_velocity(
        self,
        current_count: int,
        previous_count: int,
        window_days: int = 14
    ) -> Dict[str, Any]:
        """
        Calculates temporal demand velocity comparing the current time window vs the previous baseline window:
        velocity = (current_count - previous_count) / previous_count

        Explicitly handles zero baseline (NEW_DEMAND / INSUFFICIENT_DATA) without division by zero.
        """
        curr = max(0, int(current_count or 0))
        prev = max(0, int(previous_count or 0))

        if prev == 0 and curr > 0:
            return {
                "current_count": curr,
                "previous_count": 0,
                "window_days": window_days,
                "velocity": None,
                "velocity_ratio": 1.0,
                "velocity_pct": None,
                "trend_direction": "NEW_DEMAND",
                "explanation": "No citizen demand observed in previous period; demand newly emerged."
            }

        if prev == 0 and curr == 0:
            return {
                "current_count": 0,
                "previous_count": 0,
                "window_days": window_days,
                "velocity": 0.0,
                "velocity_ratio": 0.0,
                "velocity_pct": 0.0,
                "trend_direction": "INSUFFICIENT_DATA",
                "explanation": "Zero requests observed across both evaluation windows."
            }

        rate = (curr - prev) / float(prev)

        if rate >= self.rapid_thresh:
            trend = "RAPIDLY_INCREASING"
        elif rate >= self.increasing_thresh:
            trend = "INCREASING"
        elif rate <= self.decreasing_thresh:
            trend = "DECREASING"
        else:
            trend = "STABLE"

        return {
            "current_count": curr,
            "previous_count": prev,
            "window_days": window_days,
            "velocity": round(rate, 4),
            "velocity_ratio": round(rate, 4),
            "velocity_pct": round(rate * 100.0, 2),
            "trend_direction": trend,
            "explanation": f"Demand changed by {round(rate * 100.0, 1)}% relative to previous {window_days}-day period."
        }

    compute_demand_velocity_metrics = calculate_demand_velocity

    def compute_voice_intensity(
        self,
        geo_id: str,
        category: Optional[str] = None,
        time_window_days: int = 14
    ) -> Dict[str, Any]:
        """
        Computes voice intensity metrics for a specific geo_id and optional category.
        """
        aggregations = self.aggregate_geographic_demand(
            geo_id=geo_id,
            category=category,
            time_window_days=time_window_days
        )
        if aggregations:
            if category:
                for a in aggregations:
                    if a.get("category") == category:
                        return {
                            "voice_intensity": a["voice_intensity"],
                            "request_count": a["request_count"],
                            "population": a["population"],
                            "requests_per_1000": a["requests_per_1000"]
                        }
            total_reqs = sum(a["request_count"] for a in aggregations)
            pop = aggregations[0]["population"]
            res = self.calculate_voice_intensity(total_reqs, pop)
            return {
                "voice_intensity": res["voice_intensity"],
                "request_count": total_reqs,
                "population": pop,
                "requests_per_1000": res["requests_per_1000"]
            }

        geos = {g.get("geo_id"): g for g in geography_repo.list_all()}
        demos = {d.get("geo_id"): d for d in demographics_repo.list_all()}
        pop = 50000
        if geo_id in demos:
            pop = int(demos[geo_id].get("total_population", 50000) or 50000)
        elif geo_id in geos:
            pop = int(geos[geo_id].get("population", 50000) or 50000)

        res = self.calculate_voice_intensity(0, pop)
        return {
            "voice_intensity": 0.0,
            "request_count": 0,
            "population": pop,
            "requests_per_1000": 0.0
        }

    def aggregate_geographic_demand(
        self,
        geo_id: Optional[str] = None,
        geo_level: Optional[int] = None,
        category: Optional[str] = None,
        time_window_days: Optional[int] = None,
        reference_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Aggregates citizen requests and clusters into granular (geo_id, category) demand summaries.
        Applies geographic hierarchy constraints, deduplication, population exposure lookups,
        and temporal velocity analysis.
        """
        window = time_window_days or self.default_window_days
        now = reference_date or datetime.utcnow()
        current_cutoff = now - timedelta(days=window)
        previous_cutoff = now - timedelta(days=window * 2)

        # 1. Fetch raw datasets
        all_requests = citizen_request_repo.list_all(limit=10000)
        all_geos = {g["geo_id"]: g for g in geography_repo.list_all(limit=1000)}
        all_demographics = {d["geo_id"]: d for d in demographics_repo.list_all(limit=1000)}
        all_clusters = demand_cluster_repo.get_all_clusters()

        # Build clusters map: (geo_id, category) -> list of cluster records
        cluster_map: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        for cl in all_clusters:
            c_geo = cl.get("geo_id")
            c_cat = validate_category(cl.get("category"))
            if c_geo and c_cat:
                cluster_map.setdefault((c_geo, c_cat), []).append(cl)

        # 2. Filter requests based on criteria
        filtered_requests: List[Dict[str, Any]] = []
        for req in all_requests:
            r_geo = req.get("geo_id")
            if not r_geo or r_geo not in all_geos:
                continue

            geo_node = all_geos[r_geo]

            # Geographic filters
            if geo_id and r_geo != geo_id and geo_node.get("parent_geo_id") != geo_id:
                continue
            if geo_level is not None and geo_node.get("geo_level") != geo_level:
                continue

            # Category filter
            raw_cat = req.get("primary_category") or req.get("category")
            req_cat = validate_category(raw_cat)
            if category and category.lower() != "all" and req_cat != validate_category(category):
                continue

            req["_normalized_category"] = req_cat
            filtered_requests.append(req)

        # 3. Group requests by (geo_id, category)
        groups: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        geo_total_requests: Dict[str, int] = {}

        for req in filtered_requests:
            g_key = (req["geo_id"], req["_normalized_category"])
            groups.setdefault(g_key, []).append(req)
            geo_total_requests[req["geo_id"]] = geo_total_requests.get(req["geo_id"], 0) + 1

        # Also ensure seeded clusters without direct raw requests appear in aggregations
        for (c_geo, c_cat), cl_list in cluster_map.items():
            if geo_id and c_geo != geo_id:
                continue
            if category and category.lower() != "all" and c_cat != validate_category(category):
                continue
            if (c_geo, c_cat) not in groups:
                groups[(c_geo, c_cat)] = []

        # 4. Synthesize aggregation records
        aggregations: List[Dict[str, Any]] = []

        for (g_id, cat), req_list in groups.items():
            geo_info = all_geos.get(g_id, {})
            demo_info = all_demographics.get(g_id, {})

            # Deduplicate request IDs
            unique_ids = set()
            curr_window_reqs = []
            prev_window_reqs = []

            for r in req_list:
                r_id = r.get("request_id")
                if r_id and r_id not in unique_ids:
                    unique_ids.add(r_id)

                # Parse timestamp for window splitting
                ts_str = r.get("created_at")
                if ts_str:
                    try:
                        # Normalize ISO timestamp
                        clean_ts = ts_str.replace("Z", "+00:00") if ts_str.endswith("Z") else ts_str
                        r_dt = datetime.fromisoformat(clean_ts).replace(tzinfo=None)
                    except Exception:
                        r_dt = now
                else:
                    r_dt = now

                if r_dt >= current_cutoff:
                    curr_window_reqs.append(r)
                elif r_dt >= previous_cutoff:
                    prev_window_reqs.append(r)
                else:
                    # Treat older seeded requests as baseline
                    curr_window_reqs.append(r)

            # Link relevant clusters
            linked_clusters = cluster_map.get((g_id, cat), [])
            cluster_request_sum = sum(cl.get("request_count", 0) for cl in linked_clusters)

            # Observed request count: max of raw linked requests or cluster count
            raw_count = len(unique_ids)
            effective_current_count = max(raw_count, cluster_request_sum)
            effective_prev_count = len(prev_window_reqs)

            # Determine population
            population = demo_info.get("total_population") or geo_info.get("population_reference", 0)

            # Calculate voice intensity
            voice_metrics = self.calculate_voice_intensity(
                request_count=effective_current_count,
                population=population
            )

            # Calculate velocity
            velocity_metrics = self.calculate_demand_velocity(
                current_count=effective_current_count,
                previous_count=effective_prev_count,
                window_days=window
            )

            # Category concentration ratio in this geography
            total_geo_reqs = geo_total_requests.get(g_id, effective_current_count)
            concentration_ratio = (effective_current_count / float(max(total_geo_reqs, 1))) if total_geo_reqs > 0 else 1.0
            concentration_ratio = min(1.0, max(0.0, concentration_ratio))

            # Primary top issue derived from requests or cluster
            top_issue = None
            if linked_clusters:
                top_issue = linked_clusters[0].get("representative_issue") or linked_clusters[0].get("cluster_title")
            elif req_list:
                top_issue = req_list[0].get("specific_issue") or req_list[0].get("normalized_text")
            if not top_issue:
                top_issue = f"Concentrated demand reported for {cat.replace('_', ' ')}"

            agg_record = {
                "geo_id": g_id,
                "geo_name": geo_info.get("name") or geo_info.get("geo_name") or g_id,
                "geo_level": geo_info.get("geo_level", 3),
                "state_code": geo_info.get("state_code", "IN"),
                "state_name": geo_info.get("state_name") or geo_info.get("state_code", "State"),
                "category": cat,
                "latitude": geo_info.get("latitude", 0.0),
                "longitude": geo_info.get("longitude", 0.0),
                "time_window_days": window,
                "request_count": effective_current_count,
                "unique_request_count": max(len(unique_ids), 1 if effective_current_count > 0 else 0),
                "population": population,
                "population_exposure": population,
                "population_exposure_note": "Population exposure estimate based on geographic administrative population.",
                "voice_metrics": voice_metrics,
                "voice_intensity": voice_metrics["voice_intensity"],
                "requests_per_1000": voice_metrics["requests_per_1000"],
                "velocity_metrics": velocity_metrics,
                "demand_velocity": velocity_metrics["velocity"],
                "trend_direction": velocity_metrics["trend_direction"],
                "concentration_ratio": round(concentration_ratio, 4),
                "top_issue": top_issue,
                "associated_cluster_ids": [cl.get("cluster_id") for cl in linked_clusters if cl.get("cluster_id")],
                "calculation_version": self.calculation_version,
                "generated_at": now.isoformat()
            }
            aggregations.append(agg_record)

        return aggregations

demand_aggregation_service = DemandAggregationService()
