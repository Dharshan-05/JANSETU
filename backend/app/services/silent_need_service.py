import hashlib
from typing import List, Dict, Any, Optional, Union, Tuple
from datetime import datetime

from app.config import settings
from app.core.logging import logger
from app.core.taxonomy import validate_category, CATEGORIES
from app.db.bigquery_client import (
    db,
    geography_repo,
    demographics_repo,
    infrastructure_repo,
    investment_repo,
    citizen_request_repo,
    silent_need_repo
)
from app.services.demand_aggregation_service import demand_aggregation_service

class SilentNeedAggregationService:
    """
    Phase 6 Aggregation Service for Silent Need detection.
    Extracts multi-sector baseline data across demographics, infrastructure indicators,
    citizen intake voice intensity, and public investment context.
    """
    def __init__(self):
        self.time_window_days = getattr(settings, "HOTSPOT_TIME_WINDOW_DAYS", 14)

    def get_geo_demographics(self, geo_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves and normalizes demographic factors for a geography."""
        demos = [d for d in db.get_records("demographics") if d.get("geo_id") == geo_id]
        if not demos:
            # Fallback to geography table
            geos = [g for g in db.get_records("geography") if g.get("geo_id") == geo_id]
            if not geos:
                return None
            g = geos[0]
            return {
                "geo_id": geo_id,
                "total_population": int(g.get("population", 0) or 0),
                "vulnerability_percentage": 50.0,
                "vulnerability_score": 0.50,
                "digital_penetration_index": 0.50,
                "digital_access": 0.50,
                "status": "FALLBACK_GEOGRAPHY"
            }

        d = demos[0]
        pop = int(d.get("total_population", 0) or 0)
        vuln_raw = float(d.get("vulnerability_percentage", 50.0) or 50.0)
        vuln_score = vuln_raw / 100.0 if vuln_raw > 1.0 else vuln_raw
        vuln_score = max(0.0, min(1.0, vuln_score))

        digital_raw = float(d.get("digital_penetration_index", 0.50) or 0.50)
        digital_score = digital_raw / 100.0 if digital_raw > 1.0 else digital_raw
        digital_score = max(0.0, min(1.0, digital_score))

        return {
            "geo_id": geo_id,
            "total_population": pop,
            "vulnerability_percentage": vuln_raw,
            "vulnerability_score": round(vuln_score, 4),
            "digital_penetration_index": digital_raw,
            "digital_access": round(digital_score, 4),
            "status": "VALID" if pop > 0 else "ZERO_OR_MISSING_POPULATION"
        }

    def get_category_infra_deficit(
        self,
        geo_id: str,
        category: str
    ) -> Tuple[Optional[float], int, List[Dict[str, Any]]]:
        """
        Calculates category-level infrastructure deficit using equal weighting across indicators.
        Returns: (aggregated_deficit, indicator_count, indicator_records)
        """
        all_infra = db.get_records("infrastructure")
        cat_infra = [
            i for i in all_infra 
            if i.get("geo_id") == geo_id and (
                i.get("category", "").lower() == category.lower() or 
                i.get("sector", "").lower() == category.lower()
            )
        ]

        if not cat_infra:
            return None, 0, []

        valid_scores = []
        for rec in cat_infra:
            score = rec.get("deficit_score")
            if score is not None:
                try:
                    s_float = float(score)
                    valid_scores.append(max(0.0, min(1.0, s_float)))
                except (ValueError, TypeError):
                    continue

        if not valid_scores:
            return None, len(cat_infra), cat_infra

        # Equal weighting across available indicators
        avg_deficit = sum(valid_scores) / len(valid_scores)
        return round(avg_deficit, 4), len(valid_scores), cat_infra

    def get_investment_context(self, geo_id: str, category: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves existing public investment portfolio for context."""
        investments = db.get_records("investments")
        geo_inv = [i for i in investments if i.get("geo_id") == geo_id]
        if category:
            geo_inv = [i for i in geo_inv if i.get("sector", "").lower() == category.lower() or i.get("category", "").lower() == category.lower()]

        total_budget = sum(float(i.get("allocated_budget_inr", 0.0) or 0.0) for i in geo_inv)
        active_count = sum(1 for i in geo_inv if "ACTIVE" in str(i.get("status", "")).upper() or "PROGRESS" in str(i.get("status", "")).upper())
        completed_count = sum(1 for i in geo_inv if "COMPLETE" in str(i.get("status", "")).upper())

        return {
            "existing_investment_count": len(geo_inv),
            "existing_allocated_budget_inr": total_budget,
            "active_project_count": active_count,
            "completed_project_count": completed_count
        }


class SilentNeedExplanationService:
    """
    Phase 6 Explainability Engine.
    Generates deterministic, structured evidence factor breakdowns for silent need signals.
    Does not produce unsupported narrative claims or policy directives.
    """
    @staticmethod
    def build_explanation(
        geo_name: str,
        category: str,
        infra_deficit: float,
        vulnerability: float,
        voice_density: float,
        digital_access: float,
        discrepancy: float,
        triggers_met: Dict[str, bool]
    ) -> Dict[str, Any]:
        """Creates structured explainability driver dictionary."""
        drivers = [
            {
                "factor": "Infrastructure Deficit",
                "value": round(infra_deficit, 3),
                "contribution": f"{round(infra_deficit * 100, 1)}% measured baseline service gap in {category}",
                "evidence_type": "INFRASTRUCTURE"
            },
            {
                "factor": "Demographic Vulnerability",
                "value": round(vulnerability, 3),
                "contribution": f"{round(vulnerability * 100, 1)}% population vulnerability exposure index",
                "evidence_type": "DEMOGRAPHICS"
            },
            {
                "factor": "Citizen Voice Density",
                "value": round(voice_density, 3),
                "contribution": f"{round(voice_density, 3)} normalized request intensity (suppressed reporting volume)",
                "evidence_type": "CITIZEN_REQUESTS"
            },
            {
                "factor": "Digital Connectivity Access",
                "value": round(digital_access, 3),
                "contribution": f"{round(digital_access * 100, 1)}% cellular/broadband penetration (reporting barrier)",
                "evidence_type": "DEMOGRAPHICS"
            }
        ]

        if all(triggers_met.values()):
            summary = (
                f"Candidate Silent Need flagged in {geo_name} for {category.title()}. "
                f"Severe infrastructure deficit ({round(infra_deficit, 2)}) and elevated vulnerability ({round(vulnerability, 2)}) "
                f"coexist with low expressed citizen demand ({round(voice_density, 2)}) under restricted digital connectivity ({round(digital_access, 2)}). "
                f"Mathematical discrepancy is +{round(discrepancy, 2)}."
            )
        else:
            summary = (
                f"Evaluated {geo_name} for {category.title()}. "
                f"Discrepancy: {round(discrepancy, 2)}, Deficit: {round(infra_deficit, 2)}, Digital Access: {round(digital_access, 2)}. "
                f"Did not meet all three silent-need trigger thresholds."
            )

        return {
            "summary": summary,
            "drivers": drivers,
            "triggers_met": triggers_met,
            "disclaimer": "AI-Derived Analytical Signal — Not Official Policy",
            "validation_requirement": "Potential Silent Need Signal — requires administrative field validation."
        }


class SilentNeedDetectionService:
    """
    Phase 6 Silent Need Engine.
    Executes deterministic mathematical triangulation across infrastructure deficit,
    demographic vulnerability, citizen voice density, and digital accessibility.
    """
    def __init__(self):
        self.aggregation_service = SilentNeedAggregationService()
        self.explanation_service = SilentNeedExplanationService()

        self.w_infra = getattr(settings, "NEED_WEIGHT_INFRA", 0.55)
        self.w_vuln = getattr(settings, "NEED_WEIGHT_VULNERABILITY", 0.35)
        self.baseline_floor = getattr(settings, "NEED_BASELINE_FLOOR", 0.10)

        self.w_disc = getattr(settings, "SIGNAL_STRENGTH_WEIGHT_DISCREPANCY", 0.50)
        self.w_str_infra = getattr(settings, "SIGNAL_STRENGTH_WEIGHT_INFRA", 0.30)
        self.w_str_digital = getattr(settings, "SIGNAL_STRENGTH_WEIGHT_DIGITAL", 0.20)

        self.thresh_discrepancy = getattr(settings, "SILENT_NEED_DISCREPANCY_THRESHOLD", 0.35)
        self.thresh_min_deficit = getattr(settings, "SILENT_NEED_MIN_DEFICIT", 0.60)
        self.thresh_max_digital = getattr(settings, "SILENT_NEED_MAX_CONNECTIVITY", 0.40)

        self.thresh_strong = getattr(settings, "SIGNAL_CLASS_STRONG_THRESHOLD", 0.65)
        self.thresh_potential = getattr(settings, "SIGNAL_CLASS_POTENTIAL_THRESHOLD", 0.35)

        self.analytical_version = getattr(settings, "SILENT_NEED_ANALYTICAL_VERSION", "v6.0-deterministic")
        self.disclaimer = "AI-Derived Analytical Signal — Not Official Policy"
        self.validation_requirement = "Potential Silent Need Signal — requires administrative field validation."

    def generate_signal_id(self, geo_id: str, category: str) -> str:
        """
        Generates deterministic signal identifier: SILENT-{CAT}-{GEO}-{HASH}.
        The same (geo_id, category, analytical_version) produces identical ID without timestamps.
        """
        cat_slug = category.upper()[:4]
        geo_slug = geo_id.upper().replace("-", "")[:8]
        sig_bytes = f"{geo_id}_{category}_{self.analytical_version}".encode("utf-8")
        hash_suffix = hashlib.md5(sig_bytes).hexdigest()[:6].upper()
        return f"SILENT-{cat_slug}-{geo_slug}-{hash_suffix}"

    def compute_need_score(self, infra_deficit: float, vulnerability_score: float) -> float:
        """
        Computes deterministic infrastructure need score:
        Ineed(g) = 0.55 * InfraDeficit(g) + 0.35 * VulnerabilityScore(g) + 0.10
        Normalized and clamped to [0.0, 1.0].
        """
        deficit = max(0.0, min(1.0, float(infra_deficit or 0.0)))
        vuln = max(0.0, min(1.0, float(vulnerability_score or 0.0)))
        need = (self.w_infra * deficit) + (self.w_vuln * vuln) + self.baseline_floor
        return round(max(0.0, min(1.0, need)), 4)

    def compute_discrepancy(self, need_score: float, voice_density: float) -> float:
        """
        Computes discrepancy: Discrepancy(g) = Ineed(g) - Vvoice(g).
        Positive: need > voice.
        Negative: voice > need.
        """
        return round(float(need_score) - float(voice_density), 4)

    def compute_signal_strength(
        self,
        discrepancy: float,
        infra_deficit: float,
        digital_access: float
    ) -> float:
        """
        Computes deterministic analytical signal strength:
        signal_strength = 0.50 * normalized_discrepancy + 0.30 * infra_deficit + 0.20 * (1 - digital_access)
        Clamped to [0.0, 1.0].
        """
        norm_disc = max(0.0, min(1.0, float(discrepancy or 0.0)))
        deficit = max(0.0, min(1.0, float(infra_deficit or 0.0)))
        digital = max(0.0, min(1.0, float(digital_access or 0.0)))
        exclusion = 1.0 - digital

        strength = (
            (self.w_disc * norm_disc) +
            (self.w_str_infra * deficit) +
            (self.w_str_digital * exclusion)
        )
        return round(max(0.0, min(1.0, strength)), 4)

    def classify_signal(self, signal_strength: float, triggered: bool) -> str:
        """
        Assigns neutral analytical classification:
        STRONG_POTENTIAL, POTENTIAL, NO_SIGNAL.
        """
        if not triggered:
            return "NO_SIGNAL"
        if signal_strength >= self.thresh_strong:
            return "STRONG_POTENTIAL"
        if signal_strength >= self.thresh_potential:
            return "POTENTIAL"
        return "NO_SIGNAL"

    def evaluate_geo_category(
        self,
        geo_id: str,
        category: str,
        time_window_days: int = 14
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates a specific (geo_id, category) pair for potential silent need signals.
        """
        geos = [g for g in db.get_records("geography") if g.get("geo_id") == geo_id]
        if not geos:
            return None
        geo = geos[0]
        geo_name = geo.get("name", geo_id)
        state_name = geo.get("state_code", "India")
        lat = float(geo.get("latitude", 0.0) or 0.0)
        lon = float(geo.get("longitude", 0.0) or 0.0)

        # 1. Demographics
        demo = self.aggregation_service.get_geo_demographics(geo_id)
        if not demo:
            return None

        pop = demo["total_population"]
        vuln_score = demo["vulnerability_score"]
        digital_access = demo["digital_access"]

        # 2. Infrastructure Deficit
        deficit, indicator_count, indicator_records = self.aggregation_service.get_category_infra_deficit(geo_id, category)
        if deficit is None:
            # Missing infrastructure indicators for this sector: do not fabricate
            return None

        # 3. Citizen Voice Density (Phase 5 exact formula)
        voice_metrics = demand_aggregation_service.compute_voice_intensity(
            geo_id=geo_id,
            category=category,
            time_window_days=time_window_days
        )
        voice_density = voice_metrics.get("voice_intensity", 0.0)
        req_count = voice_metrics.get("request_count", 0)

        # 4. Ineed & Discrepancy
        need_score = self.compute_need_score(deficit, vuln_score)
        discrepancy = self.compute_discrepancy(need_score, voice_density)

        # 5. Trigger Check
        trig_disc = discrepancy >= self.thresh_discrepancy
        trig_infra = deficit >= self.thresh_min_deficit
        trig_digital = digital_access <= self.thresh_max_digital
        triggers_met = {
            "discrepancy_ge_threshold": trig_disc,
            "infra_deficit_ge_threshold": trig_infra,
            "digital_access_le_threshold": trig_digital
        }
        is_triggered = trig_disc and trig_infra and trig_digital

        # 6. Signal Strength & Class
        signal_strength = self.compute_signal_strength(discrepancy, deficit, digital_access)
        signal_class = self.classify_signal(signal_strength, is_triggered)

        # 7. Deterministic Signal ID
        signal_id = self.generate_signal_id(geo_id, category)

        # 8. Explainability Drivers
        explanation = self.explanation_service.build_explanation(
            geo_name=geo_name,
            category=category,
            infra_deficit=deficit,
            vulnerability=vuln_score,
            voice_density=voice_density,
            digital_access=digital_access,
            discrepancy=discrepancy,
            triggers_met=triggers_met
        )

        investment_ctx = self.aggregation_service.get_investment_context(geo_id, category)

        now_str = datetime.utcnow().isoformat()
        trigger_reason = (
            f"Triangulated discrepancy ({discrepancy:.2f} >= {self.thresh_discrepancy}), "
            f"infrastructure deficit ({deficit:.2f} >= {self.thresh_min_deficit}), "
            f"and digital exclusion ({digital_access:.2f} <= {self.thresh_max_digital})."
            if is_triggered else
            "Threshold conditions not fully satisfied."
        )

        return {
            "signal_id": signal_id,
            "geo_id": geo_id,
            "region_name": geo_name,
            "state_name": state_name,
            "category": category,
            "infra_deficit": deficit,
            "vulnerability_score": vuln_score,
            "digital_access": digital_access,
            "voice_density": voice_density,
            "need_score": need_score,
            "discrepancy": discrepancy,
            "signal_strength": signal_strength,
            "signal_class": signal_class,
            "triggered": is_triggered,
            "trigger_reason": trigger_reason,
            "population": pop,
            "request_count": req_count,
            "infrastructure_indicator_count": indicator_count,
            "explanation": explanation,
            "investment_context": investment_ctx,
            "analytical_version": self.analytical_version,
            "generated_at": now_str,
            "requires_field_validation": True,
            "disclaimer": self.disclaimer,
            "validation_requirement": self.validation_requirement,
            # Backward-compatibility aliases
            "infra_deficit_score": deficit,
            "voice_reporting_score": voice_density,
            "digital_access_score": digital_access,
            "population_vulnerability": vuln_score,
            "discrepancy_magnitude": discrepancy,
            "signal_confidence": round(signal_strength, 2),
            "validation_status": "POTENTIAL_SIGNAL_UNVALIDATED",
            "ai_hypothesis": explanation["summary"],
            "why_summary": explanation["summary"],
            "supporting_evidence_count": len(explanation["drivers"]),
            "latitude": lat,
            "longitude": lon
        }

    def sync_all_signals(self, time_window_days: int = 14) -> List[Dict[str, Any]]:
        """
        Evaluates all geographies across all infrastructure categories and upserts into warehouse.
        """
        geos = db.get_records("geography")
        infra_records = db.get_records("infrastructure")
        all_categories = sorted(list(set(
            i.get("category", "").lower() for i in infra_records if i.get("category")
        )))
        if not all_categories:
            all_categories = ["water", "transport", "healthcare", "roads", "sanitation", "electricity"]

        generated_signals = []

        for g in geos:
            gid = g.get("geo_id")
            if not gid:
                continue

            for cat in all_categories:
                sig = self.evaluate_geo_category(gid, cat, time_window_days=time_window_days)
                if sig:
                    silent_need_repo.upsert(sig)
                    generated_signals.append(sig)

        logger.info(f"Synchronized {len(generated_signals)} silent need signals across {len(geos)} geographies.")
        return generated_signals

    # =========================================================================
    # BACKWARD COMPATIBILITY INTERFACES
    # =========================================================================
    async def evaluate_region_silent_need(self, geo_id: str) -> List[Dict[str, Any]]:
        """Backward-compatible evaluation method for POST /api/v1/silent-need/evaluate/{geo_id}."""
        infra_records = [i for i in db.get_records("infrastructure") if i.get("geo_id") == geo_id]
        categories = sorted(list(set(i.get("category", "").lower() for i in infra_records if i.get("category"))))
        if not categories:
            categories = ["water", "transport", "healthcare", "roads"]

        results = []
        for cat in categories:
            sig = self.evaluate_geo_category(geo_id, cat)
            if sig and sig.get("triggered", False):
                silent_need_repo.upsert(sig)
                results.append(sig)
        return results

    def get_all_signals(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Backward-compatible fetch method."""
        signals = silent_need_repo.list(category=category, triggered=True, limit=1000)
        if not signals:
            self.sync_all_signals()
            signals = silent_need_repo.list(category=category, triggered=True, limit=1000)
        return signals

silent_need_engine = SilentNeedDetectionService()
silent_need_service = silent_need_engine
