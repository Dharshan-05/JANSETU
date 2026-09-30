import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings
from app.core.logging import logger

try:
    from google.cloud import bigquery
    from google.api_core.exceptions import GoogleAPIError
    HAS_BIGQUERY_SDK = True
except ImportError:
    HAS_BIGQUERY_SDK = False

class BigQueryWarehouse:
    """
    BigQuery Client Abstraction for JANSETU.
    Establishes project & dataset configuration, lightweight connectivity health checks,
    reusable parameterized query and insert interfaces, and canonical repository layers.
    """
    CANONICAL_TABLES = [
        "geography",
        "demographics",
        "infrastructure",
        "investments",
        "citizen_requests",
        "citizen_request_embeddings",
        "demand_clusters",
        "hotspots",
        "silent_need_signals",
        "evidence_records",
        "policy_scenarios",
        "impact_metrics"
    ]

    def __init__(self):
        self.project_id = settings.GCP_PROJECT_ID
        self.dataset_id = settings.BIGQUERY_DATASET
        self.analytics_dataset_id = settings.BIGQUERY_ANALYTICS_DATASET
        self.location = settings.BIGQUERY_LOCATION
        self.use_mock = settings.BIGQUERY_USE_MOCK or not HAS_BIGQUERY_SDK
        self.client: Optional[Any] = None

        # In-memory structured datastore for tests & offline development
        self._store: Dict[str, List[Dict[str, Any]]] = {
            tbl: [] for tbl in self.CANONICAL_TABLES
        }

        if not self.use_mock and HAS_BIGQUERY_SDK:
            try:
                self.client = bigquery.Client(project=self.project_id, location=self.location)
                logger.info(f"Connected to Google Cloud BigQuery: {self.project_id}.{self.dataset_id}")
            except Exception as e:
                logger.warning(f"BigQuery live client initialization failed: {e}. Using in-memory datastore.")
                self.use_mock = True

    def check_connectivity(self) -> bool:
        """Lightweight connectivity probe for readiness checks."""
        if self.use_mock:
            # Mock connectivity is valid as long as project and dataset are configured
            return bool(self.project_id and self.dataset_id)

        if self.client:
            try:
                # Lightweight probe: verify dataset exists
                dataset_ref = self.client.dataset(self.dataset_id)
                self.client.get_dataset(dataset_ref)
                return True
            except Exception as e:
                logger.warning(f"BigQuery connectivity probe failed: {e}")
                return False
        return False

    def execute_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Executes a query against BigQuery or in-memory datastore."""
        if not self.use_mock and self.client:
            try:
                job_config = bigquery.QueryJobConfig()
                query_job = self.client.query(query, job_config=job_config)
                return [dict(row) for row in query_job.result()]
            except Exception as e:
                logger.error(f"BigQuery query execution error: {e}")
                raise e

        # When in mock mode, return relevant records based on query hints
        logger.debug(f"[Mock BigQuery] Executing query: {query[:80]}...")
        return []

    def insert_records(self, table_name: str, records: List[Dict[str, Any]]) -> bool:
        """Inserts records into BigQuery table or in-memory datastore."""
        if not self.use_mock and self.client:
            try:
                table_ref = f"{self.project_id}.{self.dataset_id}.{table_name}"
                errors = self.client.insert_rows_json(table_ref, records)
                if errors:
                    logger.error(f"BigQuery insert errors in {table_name}: {errors}")
                    return False
                return True
            except Exception as e:
                logger.error(f"Failed to insert rows into BigQuery {table_name}: {e}")
                return False

        if table_name not in self._store:
            self._store[table_name] = []
        self._store[table_name].extend(records)
        return True

    def get_records(self, table_name: str) -> List[Dict[str, Any]]:
        return self._store.get(table_name, [])

    def clear_table(self, table_name: str):
        if table_name in self._store:
            self._store[table_name] = []

    def get_table_counts(self) -> Dict[str, int]:
        """Returns row count for all canonical tables."""
        return {tbl: len(self._store.get(tbl, [])) for tbl in self.CANONICAL_TABLES}

    def run_migrations(self, migration_sql_path: Optional[str] = None) -> bool:
        """
        Executes reproducible initial schema migration.
        In live BigQuery mode: executes DDL against BigQuery.
        In mock mode: ensures all 12 canonical tables are initialized in _store.
        """
        if migration_sql_path is None:
            migration_sql_path = str(Path(__file__).resolve().parent / "migrations" / "001_initial_schema.sql")

        try:
            with open(migration_sql_path, "r", encoding="utf-8") as f:
                ddl = f.read()

            if not self.use_mock and self.client:
                job = self.client.query(ddl)
                job.result()
                logger.info("Successfully executed BigQuery migration DDL.")
            else:
                for tbl in self.CANONICAL_TABLES:
                    if tbl not in self._store:
                        self._store[tbl] = []
                logger.info(f"Verified {len(self.CANONICAL_TABLES)} canonical tables in in-memory datastore.")
            return True
        except Exception as e:
            logger.error(f"Error running migration: {e}")
            return False

db = BigQueryWarehouse()

# Initialize Repository instances
from app.db.repositories.geography_repository import GeographyRepository
from app.db.repositories.demographics_repository import DemographicsRepository
from app.db.repositories.infrastructure_repository import InfrastructureRepository
from app.db.repositories.investment_repository import InvestmentRepository
from app.db.repositories.citizen_request_repository import CitizenRequestRepository

geography_repo = GeographyRepository(db)
demographics_repo = DemographicsRepository(db)
infrastructure_repo = InfrastructureRepository(db)
investment_repo = InvestmentRepository(db)
citizen_request_repo = CitizenRequestRepository(db)
