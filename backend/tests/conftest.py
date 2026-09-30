import pytest
from app.db.bigquery_client import db
from pipelines.seed_india_data import seed_india_pilot_data

@pytest.fixture(autouse=True, scope="session")
def setup_seed_data():
    """Ensures test database is seeded for all integration test runs."""
    if not db.get_records("geography"):
        seed_india_pilot_data()
