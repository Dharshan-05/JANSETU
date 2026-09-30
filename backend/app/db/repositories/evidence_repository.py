"""
JANSETU — Evidence Repository (Phase 7)
Data Access Repository for Grounded Evidence Records persisted in
`jansetu_intel.evidence_records`.
"""

from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger


class EvidenceRepository(BaseRepository):
    """
    Phase 7 Data Access Repository for Grounded Evidence Records.
    Handles atomic factual observations, official government audits,
    analytical signals, and provenance trails.
    """
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="evidence_records", primary_key="evidence_id")

    def get_by_signal(self, signal_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all evidence records linked to a specific signal ID.
        Checks both 'signal_id' and legacy 'target_entity_id' for backward compatibility.
        """
        records = self.db.get_records(self.table_name)
        return [
            r for r in records
            if r.get("signal_id") == signal_id or r.get("target_entity_id") == signal_id
        ]

    def upsert(self, evidence_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Idempotent persistence for atomic evidence records.
        Updates existing record if evidence_id exists, or inserts new record.
        """
        ev_id = evidence_record.get("evidence_id")
        if not ev_id:
            raise ValueError("evidence_record must contain 'evidence_id'")

        existing = self.get_by_id(ev_id)
        now_str = datetime.utcnow().isoformat()

        if existing:
            evidence_record["updated_at"] = now_str
            self.update_by_id(ev_id, evidence_record)
            logger.debug(f"Updated existing evidence record '{ev_id}' in warehouse.")
            return evidence_record

        if "created_at" not in evidence_record:
            evidence_record["created_at"] = now_str
        if "retrieval_timestamp" not in evidence_record:
            evidence_record["retrieval_timestamp"] = now_str

        self.create_record(evidence_record)
        return evidence_record

    def list(
        self,
        geo_id: Optional[str] = None,
        category: Optional[str] = None,
        source_type: Optional[str] = None,
        source_tier: Optional[int] = None,
        provenance_status: Optional[str] = None,
        is_official: Optional[bool] = None,
        is_synthetic: Optional[bool] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieves filtered list of atomic evidence records.
        """
        records = self.db.get_records(self.table_name)
        results: List[Dict[str, Any]] = []

        for r in records:
            if geo_id and r.get("geo_id") != geo_id:
                continue

            if category and category.lower() != "all":
                r_cat = r.get("category", "")
                if r_cat.lower() != category.lower():
                    continue

            if source_type and source_type.upper() != "ALL":
                r_st = r.get("source_type", "")
                if r_st.upper() != source_type.upper():
                    continue

            if source_tier is not None and r.get("source_tier") != source_tier:
                continue

            if provenance_status and provenance_status.upper() != "ALL":
                r_ps = r.get("provenance_status", "")
                if r_ps.upper() != provenance_status.upper():
                    continue

            if is_official is not None and bool(r.get("is_official", False)) != is_official:
                continue

            if is_synthetic is not None and bool(r.get("is_synthetic", False)) != is_synthetic:
                continue

            results.append(r)
            if len(results) >= limit:
                break

        return results

    def delete_stale(
        self,
        signal_id: Optional[str] = None,
        older_than_timestamp: Optional[str] = None
    ) -> int:
        """
        Safely removes stale evidence records for a specific signal or older than a cutoff.
        Preserves historical evidence records where possible.
        """
        records = self.db.get_records(self.table_name)
        kept: List[Dict[str, Any]] = []
        deleted_count = 0

        for r in records:
            should_delete = False
            if signal_id and (r.get("signal_id") == signal_id or r.get("target_entity_id") == signal_id):
                if older_than_timestamp:
                    rec_ts = r.get("retrieval_timestamp") or r.get("created_at", "")
                    if rec_ts < older_than_timestamp:
                        should_delete = True
                else:
                    should_delete = True
            elif older_than_timestamp and not signal_id:
                rec_ts = r.get("retrieval_timestamp") or r.get("created_at", "")
                if rec_ts < older_than_timestamp:
                    should_delete = True

            if should_delete:
                deleted_count += 1
            else:
                kept.append(r)

        if deleted_count > 0:
            self.db.clear_table(self.table_name)
            self.db.insert_records(self.table_name, kept)
            logger.info(f"Purged {deleted_count} stale evidence records (signal_id={signal_id}).")

        return deleted_count

    def get_summary(self) -> Dict[str, Any]:
        """
        Aggregates evidence warehouse metrics for auditability and monitoring.
        """
        records = self.db.get_records(self.table_name)
        total = len(records)
        official = sum(1 for r in records if r.get("is_official") or r.get("source_tier") in (1, 2))
        analytical = sum(1 for r in records if r.get("source_type") == "JANSETU_ANALYTICAL" or r.get("source_tier") == 3)
        synthetic = sum(1 for r in records if r.get("is_synthetic") or r.get("source_tier") == 4)
        verified = sum(1 for r in records if r.get("provenance_status") == "VERIFIED")

        return {
            "total_evidence_records": total,
            "official_sources_count": official,
            "analytical_sources_count": analytical,
            "synthetic_sources_count": synthetic,
            "verified_coverage_pct": round((verified / total * 100), 1) if total > 0 else 0.0,
            "analytical_version": "v7.0-grounded",
            "disclaimer": "AI-Derived Analytical Signal — Not Official Policy"
        }
