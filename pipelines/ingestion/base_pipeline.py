from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from app.db.bigquery_client import db
from app.core.logging import logger

class BaseIngestionPipeline(ABC):
    """
    Abstract Ingestion Pipeline enforcing the canonical ETL flow:
    SOURCE -> RAW/STAGING -> VALIDATION -> NORMALIZATION -> BIGQUERY CANONICAL TABLE
    """
    def __init__(self, target_table: str, source_name: str, is_synthetic: bool = False):
        self.target_table = target_table
        self.source_name = source_name
        self.is_synthetic = is_synthetic
        self.stats = {
            "extracted": 0,
            "validated": 0,
            "quarantined": 0,
            "loaded": 0
        }
        self.quarantine: List[Dict[str, Any]] = []

    @abstractmethod
    def validate_record(self, raw_record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate a single raw record against schema constraints."""
        pass

    @abstractmethod
    def normalize_record(self, valid_record: Dict[str, Any]) -> Dict[str, Any]:
        """Transform valid record into canonical BigQuery schema."""
        pass

    def run(self, raw_dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes the end-to-end ingestion pipeline:
        1. Extract
        2. Validate
        3. Normalize
        4. Load into BigQuery warehouse
        """
        self.stats["extracted"] = len(raw_dataset)
        normalized_records: List[Dict[str, Any]] = []

        for record in raw_dataset:
            is_valid, errors = self.validate_record(record)
            if is_valid:
                self.stats["validated"] += 1
                canonical = self.normalize_record(record)
                # Attach provenance
                if "source" not in canonical:
                    canonical["source"] = self.source_name
                canonical["is_synthetic"] = self.is_synthetic
                canonical["ingestion_timestamp"] = datetime.utcnow().isoformat()
                normalized_records.append(canonical)
            else:
                self.stats["quarantined"] += 1
                self.quarantine.append({
                    "raw_record": record,
                    "errors": errors,
                    "quarantined_at": datetime.utcnow().isoformat()
                })

        # Load normalized records into BigQuery
        if normalized_records:
            success = db.insert_records(self.target_table, normalized_records)
            if success:
                self.stats["loaded"] = len(normalized_records)
                logger.info(
                    f"[{self.target_table}] Successfully ingested {self.stats['loaded']} records "
                    f"from '{self.source_name}' (Quarantined: {self.stats['quarantined']})"
                )
            else:
                logger.error(f"[{self.target_table}] Failed to insert records into BigQuery.")

        return self.stats
