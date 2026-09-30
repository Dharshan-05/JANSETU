import json
from typing import Optional, Dict, Any, List
from app.config import settings
from app.core.logging import logger

try:
    from google.cloud import pubsub_v1
    from google.api_core.exceptions import GoogleAPIError
    HAS_PUBSUB_SDK = True
except ImportError:
    HAS_PUBSUB_SDK = False

class PubSubService:
    """
    Google Cloud Pub/Sub abstraction for JANSETU.
    Handles message publishing, topic resolution, connectivity validation,
    and asynchronous event buffering.
    """
    def __init__(self):
        self.project_id = settings.GCP_PROJECT_ID
        self.default_topic = settings.PUBSUB_TOPIC
        self.use_mock = settings.PUBSUB_USE_MOCK or not HAS_PUBSUB_SDK
        self.publisher = None
        self._published_messages: List[Dict[str, Any]] = []

        if not self.use_mock and HAS_PUBSUB_SDK:
            try:
                self.publisher = pubsub_v1.PublisherClient()
                logger.info(f"Initialized Google Cloud Pub/Sub client for project '{self.project_id}'")
            except Exception as e:
                logger.warning(f"Could not connect to live Pub/Sub: {e}. Using in-memory fallback.")
                self.use_mock = True

    def get_topic_path(self, topic_name: Optional[str] = None) -> str:
        """Constructs canonical project topic path."""
        t_name = topic_name or self.default_topic
        return f"projects/{self.project_id}/topics/{t_name}"

    def check_connectivity(self) -> bool:
        """Lightweight connectivity probe for readiness checks."""
        if self.use_mock:
            # Mock connectivity is valid as long as project and topic are configured
            return bool(self.project_id and self.default_topic)

        if self.publisher:
            try:
                # Lightweight probe: verify topic exists or publisher client is healthy
                topic_path = self.get_topic_path()
                self.publisher.get_topic(topic=topic_path)
                return True
            except Exception as e:
                logger.warning(f"Pub/Sub connectivity probe failed: {e}")
                return False
        return False

    def publish_event(
        self,
        data: Optional[Dict[str, Any]] = None,
        topic_name: Optional[str] = None,
        attributes: Optional[Dict[str, str]] = None,
        payload: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Publishes structured JSON event to the specified or default Pub/Sub topic.
        Returns the published message ID.
        """
        target_topic = topic_name or self.default_topic
        topic_path = self.get_topic_path(target_topic)
        event_dict = data if data is not None else (payload or {})
        payload_bytes = json.dumps(event_dict).encode("utf-8")
        attrs = attributes or {}

        if not self.use_mock and self.publisher:
            try:
                future = self.publisher.publish(topic_path, data=payload_bytes, **attrs)
                message_id = future.result(timeout=10.0)
                logger.info(f"Published event {message_id} to Pub/Sub topic '{target_topic}'")
                return message_id
            except Exception as e:
                logger.error(f"Failed to publish event to Pub/Sub: {e}")
                raise e

        # Mock publishing
        msg_id = f"mock-msg-{len(self._published_messages) + 1}"
        self._published_messages.append({
            "message_id": msg_id,
            "topic": target_topic,
            "data": data,
            "attributes": attrs
        })
        logger.debug(f"[Mock] Published event {msg_id} to topic '{target_topic}'")
        return msg_id

    def get_published_messages(self) -> List[Dict[str, Any]]:
        """Inspection helper for tests."""
        return self._published_messages

pubsub_service = PubSubService()
