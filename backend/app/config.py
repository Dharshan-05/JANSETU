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
    # PHASE 5: DEMAND HOTSPOTS & DEMAND SHADOW CONFIGURATION
    # =========================================================================
    HOTSPOT_TIME_WINDOW_DAYS: int = Field(
        default=14,
        description="Default aggregation time window in days for demand hotspots"
    )
    HOTSPOT_MIN_REQUESTS: int = Field(
        default=1,
        description="Minimum citizen requests required to evaluate demand concentration"
    )
    HOTSPOT_CRITICAL_THRESHOLD: float = Field(
        default=0.70,
        description="Hotspot score threshold for CRITICAL level classification"
    )
    HOTSPOT_HIGH_THRESHOLD: float = Field(
        default=0.45,
        description="Hotspot score threshold for HIGH level classification"
    )
    HOTSPOT_MODERATE_THRESHOLD: float = Field(
        default=0.20,
        description="Hotspot score threshold for MODERATE level classification"
    )
    HOTSPOT_VELOCITY_INCREASING: float = Field(
        default=0.10,
        description="Demand velocity rate threshold for INCREASING trend (+10%)"
    )
    HOTSPOT_VELOCITY_RAPID: float = Field(
        default=0.35,
        description="Demand velocity rate threshold for RAPIDLY_INCREASING trend (+35%)"
    )
    HOTSPOT_VELOCITY_DECREASING: float = Field(
        default=-0.10,
        description="Demand velocity rate threshold for DECREASING trend (-10%)"
    )
    
    # Hotspot scoring component weights (sum = 1.0)
    HOTSPOT_WEIGHT_VOICE: float = Field(
        default=0.40,
        description="Weight for citizen voice intensity in hotspot scoring"
    )
    HOTSPOT_WEIGHT_EXPOSURE: float = Field(
        default=0.25,
        description="Weight for population exposure in hotspot scoring"
    )
    HOTSPOT_WEIGHT_VELOCITY: float = Field(
        default=0.20,
        description="Weight for demand velocity trend in hotspot scoring"
    )
    HOTSPOT_WEIGHT_CONCENTRATION: float = Field(
        default=0.15,
        description="Weight for sector/category demand concentration in hotspot scoring"
    )

    # Demand Shadow matrix boundary thresholds
    DEMAND_SHADOW_VOICE_THRESHOLD: float = Field(
        default=0.40,
        description="Citizen voice intensity boundary dividing High vs Low Voice (X-axis)"
    )
    DEMAND_SHADOW_NEED_THRESHOLD: float = Field(
        default=0.50,
        description="Infrastructure deficit score boundary dividing High vs Low Need (Y-axis)"
    )
    ANALYTICAL_VERSION: str = Field(
        default="v6.0-deterministic",
        description="Canonical version identifier for deterministic demand calculations"
    )

    # =========================================================================
    # PHASE 6: POTENTIAL SILENT NEED DETECTION & GAP INTELLIGENCE
    # =========================================================================
    SILENT_NEED_ANALYTICAL_VERSION: str = Field(
        default="v6.0-deterministic",
        description="Canonical analytical version for Phase 6 Silent Need Engine"
    )
    SILENT_NEED_DISCREPANCY_THRESHOLD: float = Field(
        default=0.35,
        description="Minimum discrepancy between Ineed and Vvoice to trigger silent need candidate"
    )
    SILENT_NEED_MIN_DEFICIT: float = Field(
        default=0.60,
        description="Minimum infrastructure deficit threshold required to trigger silent need signal"
    )
    SILENT_NEED_MAX_CONNECTIVITY: float = Field(
        default=0.40,
        description="Maximum digital penetration index allowed to trigger silent need signal"
    )
    NEED_WEIGHT_INFRA: float = Field(
        default=0.55,
        description="Weight for infrastructure deficit in Ineed"
    )
    NEED_WEIGHT_VULNERABILITY: float = Field(
        default=0.35,
        description="Weight for demographic vulnerability in Ineed"
    )
    NEED_BASELINE_FLOOR: float = Field(
        default=0.10,
        description="Baseline need floor constant in Ineed"
    )
    SIGNAL_STRENGTH_WEIGHT_DISCREPANCY: float = Field(
        default=0.50,
        description="Weight for discrepancy in signal strength"
    )
    SIGNAL_STRENGTH_WEIGHT_INFRA: float = Field(
        default=0.30,
        description="Weight for infra deficit in signal strength"
    )
    SIGNAL_STRENGTH_WEIGHT_DIGITAL: float = Field(
        default=0.20,
        description="Weight for digital exclusion in signal strength"
    )
    SIGNAL_CLASS_STRONG_THRESHOLD: float = Field(
        default=0.65,
        description="Threshold for STRONG_POTENTIAL signal classification"
    )
    SIGNAL_CLASS_POTENTIAL_THRESHOLD: float = Field(
        default=0.35,
        description="Threshold for POTENTIAL signal classification"
    )

    # =========================================================================
    # PHASE 7 — GROUNDED EVIDENCE ENGINE
    # =========================================================================
    EVIDENCE_PROMPT_VERSION: str = Field(default="v7.0-grounded", description="Phase 7 Grounded Gemini Prompt Version")
    EVIDENCE_ANALYTICAL_VERSION: str = Field(default="v7.0-grounded", description="Phase 7 Evidence Engine Version")
    EVIDENCE_FRESHNESS_YEARS_CURRENT: int = Field(default=2, description="Max age in years for CURRENT freshness rating")
    EVIDENCE_FRESHNESS_YEARS_RECENT: int = Field(default=5, description="Max age in years for RECENT freshness rating")

    # =========================================================================
    # PHASE 8 — POLICY SANDBOX & SCENARIO SIMULATION ENGINE
    # =========================================================================
    SCENARIO_MODEL_VERSION: str = Field(default="v8.0-deterministic", description="Phase 8 Policy Sandbox Model Version")
    SCENARIO_PROMPT_VERSION: str = Field(default="v8.0-grounded-simulation", description="Phase 8 Scenario Grounded Prompt Version")

    # =========================================================================
    # PHASE 9 — CLOSED-LOOP IMPACT MEASUREMENT & EVALUATION ENGINE
    # =========================================================================
    IMPACT_ANALYTICAL_VERSION: str = Field(default="v9.0-impact-evaluation", description="Phase 9 Impact Evaluation Engine Version")
    IMPACT_PROMPT_VERSION: str = Field(default="v9.0-grounded-impact", description="Phase 9 Impact Evaluation Prompt Version")

    # =========================================================================
    # PHASE 10 — CIVIC INTELLIGENCE LEARNING & CONTINUOUS CALIBRATION ENGINE
    # =========================================================================
    LEARNING_ANALYTICAL_VERSION: str = Field(default="v10.0-continuous-learning", description="Phase 10 Learning Engine Version")
    LEARNING_PROMPT_VERSION: str = Field(default="v10.0-grounded-learning", description="Phase 10 Learning Grounded Prompt Version")
    MIN_CALIBRATION_SAMPLES: int = Field(default=10, description="Minimum samples to generate calibration candidate")
    MIN_VALIDATED_SAMPLES: int = Field(default=8, description="Minimum samples required for validation confidence")
    MIN_DIRECTIONAL_CONSISTENCY: float = Field(default=0.70, description="Minimum directional consistency threshold")
    MAX_ACCEPTABLE_ERROR: float = Field(default=0.25, description="Maximum acceptable prediction error (MAPE)")
    MAX_PARAMETER_CHANGE: float = Field(default=0.35, description="Maximum parameter shift before requiring manual review")
    DRIFT_THRESHOLD_MEAN_SHIFT: float = Field(default=0.20, description="Relative mean shift threshold for drift warning")
    DRIFT_THRESHOLD_VARIANCE_SHIFT: float = Field(default=0.25, description="Variance shift threshold for drift warning")

    # =========================================================================
    # OPTIONAL / LATER PHASE COMPATIBILITY
    # =========================================================================
    GEMINI_API_KEY: Optional[str] = Field(default="", description="Optional Gemini API Key")
    GEMINI_MODEL: str = Field(default="gemini-2.5-pro")
    GEMINI_FLASH_MODEL: str = Field(default="gemini-2.5-flash")
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
