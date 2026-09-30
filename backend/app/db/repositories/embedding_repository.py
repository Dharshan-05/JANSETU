from typing import List, Dict, Any, Optional
from datetime import datetime
from app.db.repositories.base_repository import BaseRepository
from app.db.bigquery_client import BigQueryWarehouse
from app.core.logging import logger

class EmbeddingRepository(BaseRepository):
    """
    Data Access Repository for Citizen Request Vector Embeddings
    persisted in `jansetu_intel.citizen_request_embeddings`.
    """
    def __init__(self, db: BigQueryWarehouse):
        super().__init__(db=db, table_name="citizen_request_embeddings", primary_key="request_id")

    def get_by_request_id(self, request_id: str) -> Optional[Dict[str, Any]]:
        return self.get_by_id(request_id)

    def upsert_embedding(
        self,
        request_id: str,
        embedding: List[float],
        embedding_model: str = "text-multilingual-embedding-002",
        embedding_dimension: int = 768,
        category: Optional[str] = None,
        geo_id: Optional[str] = None
    ) -> bool:
        """
        Idempotent persistence: updates existing vector representation if request_id
        already has an embedding, preventing duplicate vector rows in warehouse.
        """
        if len(embedding) != embedding_dimension:
            raise ValueError(f"Embedding vector dimension {len(embedding)} does not match expected {embedding_dimension}")

        existing = self.get_by_id(request_id)
        if existing:
            existing["embedding"] = embedding
            existing["embedding_model"] = embedding_model
            existing["embedding_dimension"] = embedding_dimension
            if category:
                existing["category"] = category
            if geo_id:
                existing["geo_id"] = geo_id
            existing["updated_at"] = datetime.utcnow().isoformat()
            logger.debug(f"Updated existing vector embedding for request {request_id}")
            return True

        record = {
            "request_id": request_id,
            "embedding_model": embedding_model,
            "embedding_dimension": embedding_dimension,
            "category": category,
            "geo_id": geo_id,
            "embedding": embedding,
            "created_at": datetime.utcnow().isoformat()
        }
        return self.insert([record])

    def list_by_geo_id(self, geo_id: str, limit: int = 200) -> List[Dict[str, Any]]:
        matches = [r for r in self.db.get_records(self.table_name) if r.get("geo_id") == geo_id]
        return matches[:limit]

    def list_by_category(self, category: str, limit: int = 200) -> List[Dict[str, Any]]:
        matches = [r for r in self.db.get_records(self.table_name) if r.get("category") == category]
        return matches[:limit]

    def list_all_vectors(self) -> List[Dict[str, Any]]:
        return self.db.get_records(self.table_name)
