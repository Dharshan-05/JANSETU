from typing import List, Dict, Any, Optional
from app.db.bigquery_client import BigQueryWarehouse

class BaseRepository:
    """
    Base Data Access Repository providing standard CRUD-like analytical query operations
    over BigQuery and in-memory datastores.
    """
    def __init__(self, db: BigQueryWarehouse, table_name: str, primary_key: str):
        self.db = db
        self.table_name = table_name
        self.primary_key = primary_key

    def get_by_id(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single record by primary key."""
        records = self.db.get_records(self.table_name)
        for r in records:
            if r.get(self.primary_key) == entity_id:
                return r
        return None

    def list_all(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List records with pagination."""
        records = self.db.get_records(self.table_name)
        return records[offset:offset + limit]

    def find(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter records by matching key-value pairs in query dict."""
        records = self.db.get_records(self.table_name)
        return [
            r for r in records
            if all(r.get(k) == v for k, v in query.items())
        ]

    def count(self) -> int:
        """Return total row count in table."""
        return len(self.db.get_records(self.table_name))

    def insert(self, records: List[Dict[str, Any]]) -> bool:
        """Insert records into table."""
        return self.db.insert_records(self.table_name, records)

    def create_record(self, record: Dict[str, Any]) -> bool:
        """Insert a single record into table."""
        return self.insert([record])

    def update_by_id(self, entity_id: str, updates: Dict[str, Any]) -> bool:
        """Update a single record by primary key."""
        return self.db.update_record(self.table_name, self.primary_key, entity_id, updates)

