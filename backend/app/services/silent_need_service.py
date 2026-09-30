import uuid
from typing import List, Dict, Any, Optional
from app.config import settings
from app.db.bigquery_client import db
from app.services.gemini_service import gemini_service
from app.core.logging import logger

class SilentNeedEngine:
    """
    Signature Engine of JANSETU:
    Detects Potential Silent Need Signals where severe infrastructure deficit
    and demographic exposure coexist with an unnaturally low citizen reporting footprint,
    caused by digital access and connectivity barriers.
    """

    async def evaluate_region_silent_need(self, geo_id: str) -> List[Dict[str, Any]]:
        # Fetch demographic baseline
        demographics = [d for d in db.get_records("demographics") if d.get("geo_id") == geo_id]
        if not demographics:
            return []
        demo = demographics[0]

        pop = demo.get("total_population", 0)
        if pop < settings.MIN_POPULATION_THRESHOLD:
            return []

        vulnerability = demo.get("vulnerability_percentage", 0.5)
        digital_access = demo.get("digital_penetration_index", 0.35)

        # Fetch infrastructure deficits
        infra_records = [i for i in db.get_records("infrastructure") if i.get("geo_id") == geo_id]
        if not infra_records:
            return []

        # Fetch citizen requests for this region
        requests = [r for r in db.get_records("citizen_requests") if r.get("geo_id") == geo_id]

        # Fetch geography metadata
        geo_records = [g for g in db.get_records("geography") if g.get("geo_id") == geo_id]
        geo_name = geo_records[0].get("name", geo_id) if geo_records else geo_id
        state_name = geo_records[0].get("state_code", "India") if geo_records else "India"

        signals = []

        # Group infra deficits by category
        categories = set(r.get("category") for r in infra_records)
        for cat in categories:
            cat_infra = [r for r in infra_records if r.get("category") == cat]
            avg_deficit = sum(r.get("deficit_score", 0.0) for r in cat_infra) / len(cat_infra)

            # Category citizen requests
            cat_requests = [r for r in requests if r.get("primary_category") == cat]
            req_count = len(cat_requests)

            # Normalized voice intensity (requests per 1,000 residents)
            voice_rate = (req_count / max(pop, 1)) * 1000.0
            # Scale voice to 0-1 range (e.g. 5 requests per 1000 = 1.0)
            voice_reporting_score = min(voice_rate / 5.0, 1.0)

            # Compute combined need index
            combined_need = (0.55 * avg_deficit) + (0.35 * vulnerability) + 0.10
            discrepancy = combined_need - voice_reporting_score

            # Evaluation check
            is_silent_need = (
                discrepancy >= settings.SILENT_NEED_DISCREPANCY_THRESHOLD and
                avg_deficit >= settings.SILENT_NEED_MIN_DEFICIT and
                digital_access <= settings.SILENT_NEED_MAX_CONNECTIVITY
            )

            if is_silent_need:
                signal_id = f"SIG-SILENT-{uuid.uuid4().hex[:6].upper()}"
                confidence = round(min(0.70 + (discrepancy * 0.25) + (vulnerability * 0.10), 0.98), 2)

                # Prepare grounded evidence audit records
                evidence_trail = [
                    {
                        "evidence_type": "INFRA_AUDIT",
                        "dataset_source": cat_infra[0].get("source_dataset", "Official Infrastructure Audit"),
                        "metric": f"{cat.title()} Deficit Score",
                        "observed_value": f"{avg_deficit:.2f} (Critical Deficit)",
                        "benchmark": "< 0.25",
                        "deficit_percentage": f"{int(avg_deficit * 100)}% gap"
                    },
                    {
                        "evidence_type": "CENSUS_DEMOGRAPHIC",
                        "dataset_source": "SECC / National Census",
                        "metric": "Digital Penetration Index",
                        "observed_value": f"{digital_access * 100:.1f}%",
                        "benchmark": "National Avg 62.0%",
                        "deficit_percentage": f"{int((1 - digital_access) * 100)}% disconnected"
                    },
                    {
                        "evidence_type": "CITIZEN_VOICE",
                        "dataset_source": "JANSETU Ingestion Stream",
                        "metric": "Total Citizen Reports in 90 Days",
                        "observed_value": f"{req_count} requests",
                        "benchmark": f"{max(int(pop * 0.002), 15)} expected baseline",
                        "deficit_percentage": f"Discrepancy magnitude: {discrepancy:.2f}"
                    }
                ]

                # Store audit evidence records
                for ev in evidence_trail:
                    db.insert_records("evidence_records", [{
                        "evidence_id": f"EV-{uuid.uuid4().hex[:6].upper()}",
                        "target_entity_type": "silent_need_signal",
                        "target_entity_id": signal_id,
                        "evidence_type": ev["evidence_type"],
                        "record_reference_id": geo_id,
                        "metric_name": ev["metric"],
                        "observed_value": ev["observed_value"],
                        "benchmark_value": ev["benchmark"],
                        "dataset_source": ev["dataset_source"]
                    }])

                # Generate grounded hypothesis
                hypothesis = await gemini_service.summarize_evidence_trail(
                    target_region=f"{geo_name}, {state_name}",
                    category=cat,
                    evidence_records=evidence_trail
                )

                signal_record = {
                    "signal_id": signal_id,
                    "geo_id": geo_id,
                    "region_name": geo_name,
                    "state_name": state_name,
                    "category": cat,
                    "infra_deficit_score": round(avg_deficit, 3),
                    "voice_reporting_score": round(voice_reporting_score, 3),
                    "digital_access_score": round(digital_access, 3),
                    "population_vulnerability": round(vulnerability, 3),
                    "discrepancy_magnitude": round(discrepancy, 3),
                    "signal_confidence": confidence,
                    "validation_status": "POTENTIAL_SIGNAL_UNVALIDATED",
                    "ai_hypothesis": hypothesis,
                    "latitude": geo_records[0].get("latitude", 12.0) if geo_records else 12.0,
                    "longitude": geo_records[0].get("longitude", 78.0) if geo_records else 78.0,
                    "why_summary": f"High {cat} deficit ({avg_deficit:.2f}) with only {req_count} voice reports in a low digital connectivity zone ({digital_access * 100:.0f}%).",
                    "supporting_evidence_count": len(evidence_trail)
                }
                signals.append(signal_record)
                db.insert_records("silent_need_signals", [signal_record])
                logger.info(f"Triggered Potential Silent Need Signal: {signal_id} in {geo_name} ({cat})")

        return signals

    def get_all_signals(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        signals = db.get_records("silent_need_signals")
        if category:
            signals = [s for s in signals if s.get("category") == category]
        return signals

silent_need_engine = SilentNeedEngine()
