import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # =========================================================================
    # APPLICATION
    # =========================================================================
    APP_NAME: str = Field(default="JANSETU", description="Application name")
    APP_SERVICE: str = Field(
        default="AI Civic Infrastructure Intelligence Grid",
        description="Application service descriptor"
    )
    APP_VERSION: str = Field(default="0.1.0", description="Application version")
    ENVIRONMENT: str = Field(
        default="development",
        description="Environment: development, staging, production"
    )
    HOST: str = Field(default="0.0.0.0", description="Bind host")
    PORT: int = Field(default=8000, description="Bind port (supports Cloud Run $PORT)")
    API_V1_STR: str = "/api/v1"

    # =========================================================================
    # GOOGLE CLOUD CORE
    # =========================================================================
    GCP_PROJECT_ID: str = Field(default="jansetu-gov-ai", description="GCP Project ID")
    GOOGLE_CLOUD_PROJECT: str = Field(default="jansetu-gov-ai", description="GCP Project ID alias")
    GCP_REGION: str = Field(default="asia-south1", description="GCP Deployment Region (Mumbai)")
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = Field(
        default=None,
        description="Path to GCP Service Account JSON key"
    )

    # =========================================================================
    # BIGQUERY
    # =========================================================================
    BIGQUERY_DATASET: str = Field(default="jansetu_intel", description="Primary BigQuery dataset name")
    BIGQUERY_ANALYTICS_DATASET: str = Field(
        default="jansetu_analytics",
        description="BigQuery analytics & derived intelligence dataset name"
    )
    BIGQUERY_LOCATION: str = Field(default="asia-south1", description="BigQuery dataset location")
    BIGQUERY_USE_MOCK: bool = Field(
        default=True,
        description="Use in-memory datastore fallback when live GCP credentials are unavailable"
    )

    # =========================================================================
    # GOOGLE CLOUD PUB/SUB
    # =========================================================================
    PUBSUB_TOPIC: str = Field(
        default="citizen-requests-raw",
        description="Pub/Sub topic for raw citizen events"
    )
    PUBSUB_SUBSCRIPTION: str = Field(
        default="citizen-requests-processor-sub",
        description="Pub/Sub subscription for workers"
    )
    PUBSUB_USE_MOCK: bool = Field(
        default=True,
        description="Use in-memory message bus when live Pub/Sub is unavailable"
    )

    # =========================================================================
    # GOOGLE CLOUD STORAGE
    # =========================================================================
    GCS_BUCKET: str = Field(
        default="jansetu-citizen-audio",
        description="GCS bucket name for audio files"
    )
    GCS_EXPORTS_BUCKET: str = Field(
        default="jansetu-data-exports",
        description="GCS bucket for analytical exports"
    )
    GCS_USE_MOCK: bool = Field(
        default=True,
        description="Use in-memory storage when live GCS is unavailable"
    )

    # =========================================================================
    # FIREBASE AUTHENTICATION
    # =========================================================================
    FIREBASE_PROJECT_ID: str = Field(
        default="jansetu-gov-ai",
        description="Firebase Project Identifier"
    )
    FIREBASE_CREDENTIALS_PATH: Optional[str] = Field(
        default=None,
        description="Path to Firebase Admin Service Account credentials file"
    )
    FIREBASE_MOCK_AUTH: bool = Field(
        default=True,
        description="Allow mock token validation for testing when Firebase Admin is not initialized with live credentials"
    )

    # =========================================================================
    # OPTIONAL / LATER PHASE COMPATIBILITY
    # =========================================================================
    GEMINI_API_KEY: Optional[str] = Field(default="", description="Optional Gemini API Key")
    GEMINI_MODEL: str = Field(default="gemini-2.5-pro")
    GEMINI_FLASH_MODEL: str = Field(default="gemini-2.5-flash")
    SILENT_NEED_DISCREPANCY_THRESHOLD: float = 0.35
    SILENT_NEED_MIN_DEFICIT: float = 0.60
    SILENT_NEED_MAX_CONNECTIVITY: float = 0.40
    MIN_POPULATION_THRESHOLD: int = 200

    # =========================================================================
    # CORS & SECURITY
    # =========================================================================
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Allowed frontend origin"
    )
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://jansetu.web.app"
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
