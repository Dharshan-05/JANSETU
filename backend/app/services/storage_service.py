import os
from typing import Optional, Dict, Any
from app.config import settings
from app.core.logging import logger

try:
    from google.cloud import storage
    from google.api_core.exceptions import GoogleAPIError
    HAS_STORAGE_SDK = True
except ImportError:
    HAS_STORAGE_SDK = False

class StorageService:
    """
    Google Cloud Storage Service abstraction for JANSETU.
    Handles object upload, metadata retrieval, path generation, deletion,
    and connectivity health probes.
    """
    def __init__(self):
        self.bucket_name = settings.GCS_BUCKET
        self.use_mock = settings.GCS_USE_MOCK or not HAS_STORAGE_SDK
        self.client = None
        self._in_memory_store: Dict[str, Dict[str, Any]] = {}

        if not self.use_mock and HAS_STORAGE_SDK:
            try:
                self.client = storage.Client(project=settings.GCP_PROJECT_ID)
                logger.info(f"Initialized Google Cloud Storage client for project '{settings.GCP_PROJECT_ID}'")
            except Exception as e:
                logger.warning(f"Could not connect to live Cloud Storage: {e}. Using in-memory fallback.")
                self.use_mock = True

    def check_connectivity(self) -> bool:
        """Lightweight connectivity validation for readiness probe."""
        if self.use_mock:
            # Mock connectivity is valid as long as bucket_name is configured
            return bool(self.bucket_name)

        if self.client:
            try:
                # Lightweight probe: verify bucket exists or project client is healthy
                bucket = self.client.bucket(self.bucket_name)
                return bucket.exists()
            except Exception as e:
                logger.warning(f"GCS connectivity probe failed: {e}")
                return False
        return False

    def upload_object(
        self,
        destination_blob_name: Optional[str] = None,
        data: bytes = b"",
        content_type: str = "application/octet-stream",
        destination_path: Optional[str] = None
    ) -> str:
        """Uploads an object and returns the canonical gs:// path."""
        target_blob = destination_blob_name or destination_path or "unnamed_object"
        if not self.use_mock and self.client:
            try:
                bucket = self.client.bucket(self.bucket_name)
                blob = bucket.blob(target_blob)
                blob.upload_from_string(data, content_type=content_type)
                return self.generate_object_path(target_blob)
            except Exception as e:
                logger.error(f"Failed to upload object to GCS: {e}")
                raise e

        # Mock storage
        self._in_memory_store[target_blob] = {
            "size": len(data),
            "content_type": content_type,
            "data": data,
            "path": self.generate_object_path(target_blob)
        }
        return self.generate_object_path(target_blob)

    def retrieve_metadata(self, blob_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves object metadata."""
        if not self.use_mock and self.client:
            try:
                bucket = self.client.bucket(self.bucket_name)
                blob = bucket.get_blob(blob_name)
                if not blob:
                    return None
                return {
                    "name": blob.name,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "updated": str(blob.updated),
                    "md5_hash": blob.md5_hash
                }
            except Exception as e:
                logger.error(f"Failed to retrieve GCS metadata: {e}")
                return None

        # Mock metadata
        item = self._in_memory_store.get(blob_name)
        if not item:
            return None
        return {
            "name": blob_name,
            "size": item["size"],
            "content_type": item["content_type"],
            "updated": "2026-09-30T12:00:00Z",
            "md5_hash": "mock_hash"
        }

    def generate_object_path(self, blob_name: str) -> str:
        """Returns the canonical gs:// object path."""
        return f"gs://{self.bucket_name}/{blob_name.lstrip('/')}"

    def delete_object(self, blob_name: str) -> bool:
        """Deletes an object from the bucket."""
        if not self.use_mock and self.client:
            try:
                bucket = self.client.bucket(self.bucket_name)
                blob = bucket.blob(blob_name)
                blob.delete()
                return True
            except Exception as e:
                logger.error(f"Failed to delete GCS object: {e}")
                return False

        if blob_name in self._in_memory_store:
            del self._in_memory_store[blob_name]
            return True
        return False

storage_service = StorageService()
