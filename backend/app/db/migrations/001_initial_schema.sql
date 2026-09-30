-- ==============================================================================
-- JANSETU: BigQuery Initial DDL Schema Migration 001
-- Datasets: jansetu_intel (Core), jansetu_analytics (Analytics)
-- Location: asia-south1
-- Phase: PHASE 2 — DATA ENGINEERING / DATA LAYER
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- DATASET DEFINITIONS
-- ------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS `jansetu_intel`
OPTIONS(
  location="asia-south1",
  description="JANSETU Civic Infrastructure Intelligence Grid Core Data Warehouse"
);

CREATE SCHEMA IF NOT EXISTS `jansetu_analytics`
OPTIONS(
  location="asia-south1",
  description="JANSETU Analytical Layer & Derived Intelligence Warehouse"
);

-- ==============================================================================
-- 1. ADMINISTRATIVE GEOGRAPHY DIMENSION TABLE
-- Purpose: Canonical geographic hierarchy for the JANSETU Civic Digital Twin.
-- Hierarchy: Country (0) -> State (1) -> District (2) -> Block (3) -> Village/Ward (4)
-- GIS Foundation: ST_GEOGPOINT centroid and polygon geometry for spatial joins.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.geography` (
  geo_id STRING NOT NULL OPTIONS(description="Unique LGD code or hierarchical geo ID, e.g. IND_TN_DHM_HRR"),
  parent_geo_id STRING OPTIONS(description="Parent geography identifier in hierarchy"),
  geo_level INT64 NOT NULL OPTIONS(description="0=Country, 1=State, 2=District, 3=Block, 4=Village/Ward"),
  admin_level INT64 OPTIONS(description="Compatibility alias for geo_level"),
  geo_name STRING NOT NULL OPTIONS(description="Canonical English geographical name"),
  name STRING OPTIONS(description="Compatibility alias for geo_name"),
  native_name STRING OPTIONS(description="Endonym in official state script, e.g. தமிழ் or हिन्दी"),
  state_code STRING NOT NULL OPTIONS(description="Standard 2-letter state code, e.g. TN, UP, TG, MH"),
  district_code STRING OPTIONS(description="District identifier or name"),
  block_code STRING OPTIONS(description="Block/Taluk identifier or name"),
  lgd_code STRING OPTIONS(description="Official Ministry of Panchayati Raj Local Government Directory (LGD) code"),
  latitude FLOAT64 OPTIONS(description="WGS84 centroid latitude"),
  longitude FLOAT64 OPTIONS(description="WGS84 centroid longitude"),
  geometry GEOGRAPHY OPTIONS(description="Spatial boundary polygon or ST_GEOGPOINT centroid"),
  centroid GEOGRAPHY OPTIONS(description="Spatial ST_GEOGPOINT point for geospatial proximity joins"),
  population_reference INT64 OPTIONS(description="Reference population census figure"),
  is_pilot_region BOOL DEFAULT FALSE OPTIONS(description="Flag indicating active pilot intelligence region"),
  is_synthetic BOOL DEFAULT FALSE OPTIONS(description="True if record is generated demo/testing data"),
  source STRING DEFAULT 'OFFICIAL_LGD' OPTIONS(description="Provenance source of geographic definition"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY state_code, geo_level;

-- ==============================================================================
-- 2. DEMOGRAPHICS & VULNERABILITY INDEX TABLE
-- Purpose: Store demographic, census, and SECC deprivation indicators for gap analysis.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.demographics` (
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  census_year INT64 DEFAULT 2021,
  total_population INT64 NOT NULL OPTIONS(description="Total population count"),
  population INT64 OPTIONS(description="Canonical alias for total_population"),
  households INT64 OPTIONS(description="Total household count in administrative unit"),
  male_population INT64,
  female_population INT64,
  sc_st_population INT64 OPTIONS(description="Scheduled Caste and Scheduled Tribe population"),
  vulnerability_percentage FLOAT64 OPTIONS(description="SECC Deprivation percentage 0.0 - 1.0"),
  vulnerability_indicators JSON OPTIONS(description="Detailed SECC deprivation dimension breakdown"),
  elderly_percentage FLOAT64 OPTIONS(description="Proportion of population aged 60+"),
  literacy_rate FLOAT64 OPTIONS(description="Literacy rate 0.0 - 1.0"),
  digital_penetration_index FLOAT64 OPTIONS(description="Household smartphone & active cellular data access 0.0 - 1.0"),
  primary_livelihood STRING OPTIONS(description="Dominant economic livelihood driver"),
  data_source STRING DEFAULT 'SECC_CENSUS_INDIA' OPTIONS(description="Provenance data source"),
  source_date DATE OPTIONS(description="Publication or release date of source dataset"),
  is_synthetic BOOL DEFAULT FALSE OPTIONS(description="True if generated demo data"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY geo_id;

-- ==============================================================================
-- 3. INFRASTRUCTURE AUDIT BASELINE TABLE
-- Purpose: Store infrastructure availability, density, and deficit signals (PMGSY, JJM, etc.).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.infrastructure` (
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  category STRING NOT NULL OPTIONS(description="Domain: transport, water, healthcare, education, electricity, sanitation, roads"),
  infrastructure_type STRING OPTIONS(description="Canonical alias for category"),
  indicator_name STRING NOT NULL OPTIONS(description="Standardized metric name, e.g. Piped Tap Water Reliability"),
  indicator_value FLOAT64 NOT NULL OPTIONS(description="Observed measurement value in the field"),
  availability_value FLOAT64 OPTIONS(description="Absolute count or proportion of available infrastructure"),
  coverage_value FLOAT64 OPTIONS(description="Proportion of population or habitations covered 0.0 - 1.0"),
  national_benchmark FLOAT64 NOT NULL OPTIONS(description="National or state service level benchmark"),
  deficit_score FLOAT64 NOT NULL OPTIONS(description="Normalized infrastructure deficit score 0.0 to 1.0"),
  deficit_value FLOAT64 OPTIONS(description="Canonical alias for deficit_score"),
  measurement_unit STRING OPTIONS(description="Unit: hours/day, km, ratio, percentage"),
  last_audited_at DATE OPTIONS(description="Audit date"),
  source_date DATE OPTIONS(description="Audit or release date of dataset"),
  source_dataset STRING OPTIONS(description="e.g., PMGSY, JJM, HMIS, UDISE+, data.gov.in"),
  source STRING DEFAULT 'GOV_INFRA_AUDIT' OPTIONS(description="Canonical provenance source"),
  is_synthetic BOOL DEFAULT FALSE OPTIONS(description="True if synthetic demo record"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY geo_id, category;

-- ==============================================================================
-- 4. PUBLIC INVESTMENTS & CAPITAL PROJECTS TABLE
-- Purpose: Track capital public expenditure, scheme sanctions, and status.
-- Partitioning: Partitioned by DATE(created_at) for efficient temporal filtering.
-- Clustering: Clustered by geo_id and category (sector) for local budget joins.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.investments` (
  project_id STRING NOT NULL OPTIONS(description="Sanction or project tracking identifier"),
  investment_id STRING OPTIONS(description="Canonical alias for project_id"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  project_name STRING NOT NULL OPTIONS(description="Official scheme work title"),
  scheme_name STRING OPTIONS(description="National/State flagship scheme: PMGSY, JJM, AMRUT, etc."),
  category STRING NOT NULL OPTIONS(description="Infrastructure sector: transport, water, healthcare, etc."),
  sector STRING OPTIONS(description="Canonical alias for category"),
  allocated_budget_inr INT64 NOT NULL OPTIONS(description="Sanctioned public expenditure in INR"),
  investment_amount FLOAT64 OPTIONS(description="Canonical alias for allocated_budget_inr"),
  expended_budget_inr INT64 DEFAULT 0 OPTIONS(description="Actual cumulative expenditure disbursed in INR"),
  currency STRING DEFAULT 'INR',
  status STRING NOT NULL OPTIONS(description="sanctioned, in_progress, delayed, completed, stalled"),
  project_status STRING OPTIONS(description="Canonical alias for status"),
  planned_date DATE OPTIONS(description="Target sanction approval or commencement date"),
  commenced_date DATE OPTIONS(description="Actual work groundbreaking date"),
  start_date DATE OPTIONS(description="Canonical alias for commenced_date"),
  target_completion_date DATE OPTIONS(description="Official contract completion deadline"),
  completion_date DATE OPTIONS(description="Actual project delivery date"),
  contractor_name STRING,
  beneficiary_population INT64 OPTIONS(description="Target population intended to be served"),
  source STRING DEFAULT 'GOV_BUDGET_PORTAL' OPTIONS(description="Provenance source portal"),
  source_date DATE OPTIONS(description="Publication or sanction date"),
  is_synthetic BOOL DEFAULT FALSE OPTIONS(description="CRITICAL: Explicitly true for demo capex"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY geo_id, category;

-- ==============================================================================
-- 5. CANONICAL CITIZEN REQUESTS TABLE
-- Purpose: Aggregated citizen development requests across voice, text, and messaging.
-- Privacy: Strictly data-minimized. NO phone numbers, auth tokens, or biometrics.
-- Partitioning: Partitioned by DATE(created_at) for time-series scalability across India.
-- Clustering: Clustered by geo_id, primary_category for high-speed spatial aggregations.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.citizen_requests` (
  request_id STRING NOT NULL OPTIONS(description="Unique deterministic UUID v4 for the intake request"),
  user_id STRING OPTIONS(description="Hashed pseudonymous user identifier (no direct PII)"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  channel STRING OPTIONS(description="Intake channel: voice_ivr, voice_web, text_web, whatsapp, bhashini_api"),
  source_channel STRING OPTIONS(description="Compatibility alias for channel"),
  language STRING OPTIONS(description="ISO language code: ta, hi, te, kn, mr, bn, en"),
  detected_language STRING OPTIONS(description="Compatibility alias for language"),
  raw_text_reference STRING OPTIONS(description="Pointer to raw audio URI in Cloud Storage or text intake payload"),
  audio_gcs_uri STRING OPTIONS(description="Cloud Storage URI for voice audio recording"),
  original_transcript STRING NOT NULL OPTIONS(description="Citizen verbatim transcript in source language"),
  normalized_text STRING OPTIONS(description="Standardized English translation of citizen request"),
  english_translation STRING NOT NULL OPTIONS(description="Compatibility alias for normalized_text"),
  
  -- Structured Extracted Features (populated by later AI phases)
  primary_category STRING NOT NULL OPTIONS(description="transport, water, healthcare, education, electricity, sanitation, roads"),
  subcategory STRING NOT NULL OPTIONS(description="Granular issue classifier"),
  specific_issue STRING NOT NULL OPTIONS(description="Concise 2-5 word descriptor of the infrastructure gap"),
  extracted_location_name STRING OPTIONS(description="Named landmark or village extracted from voice"),
  latitude FLOAT64 OPTIONS(description="Approximate latitude"),
  longitude FLOAT64 OPTIONS(description="Approximate longitude"),
  location_geog GEOGRAPHY OPTIONS(description="ST_GEOGPOINT representing citizen request location"),
  severity INT64 NOT NULL OPTIONS(description="1 (minor) to 5 (critical emergency)"),
  urgency FLOAT64 OPTIONS(description="Canonical alias for urgency_score 0.0 - 1.0"),
  urgency_score FLOAT64 NOT NULL OPTIONS(description="0.0 to 1.0 urgency index"),
  affected_group STRING NOT NULL OPTIONS(description="students, women, elderly, farmers, patients, general_population"),
  cohort STRING OPTIONS(description="Canonical alias for affected_group"),
  time_pattern STRING OPTIONS(description="evening, morning, seasonal_monsoon, continuous"),
  entities ARRAY<STRING> OPTIONS(description="Extracted infrastructure and administrative entities"),
  
  -- Processing Metadata & Provenance
  processing_status STRING NOT NULL OPTIONS(description="received, transcribed, extracted, clustered, verified"),
  confidence_score FLOAT64 DEFAULT 0.95 OPTIONS(description="Extraction model confidence score"),
  source STRING DEFAULT 'JANSETU_CITIZEN_INTAKE' OPTIONS(description="Intake ingestion source"),
  is_synthetic BOOL DEFAULT FALSE OPTIONS(description="Explicit boolean: true if synthetic test data"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY geo_id, primary_category;

-- ==============================================================================
-- 6. CITIZEN REQUEST VECTOR EMBEDDINGS TABLE
-- Purpose: Storage foundation for Vertex AI 768-dim multilingual embeddings.
-- Ready for BigQuery VECTOR_SEARCH indexing in later AI phases.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.citizen_request_embeddings` (
  request_id STRING NOT NULL OPTIONS(description="Foreign key referencing citizen_requests.request_id"),
  embedding_model STRING DEFAULT 'text-multilingual-embedding-002' OPTIONS(description="Vertex AI embedding foundation model"),
  embedding_dimension INT64 DEFAULT 768 OPTIONS(description="Dimensionality of vector representation"),
  category STRING OPTIONS(description="Request category for pre-filtering"),
  geo_id STRING OPTIONS(description="Geography reference for spatial clustering"),
  embedding ARRAY<FLOAT64> NOT NULL OPTIONS(description="768-dimensional normalized embedding vector"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY geo_id;

-- ==============================================================================
-- 7. SYNTHESIZED SEMANTIC DEMAND CLUSTERS TABLE
-- Purpose: Storage schema for semantically clustered citizen requests.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.demand_clusters` (
  cluster_id STRING NOT NULL OPTIONS(description="Unique demand cluster identifier, e.g. CLS-TRN-041"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  category STRING NOT NULL OPTIONS(description="Infrastructure sector: transport, water, etc."),
  cluster_label STRING OPTIONS(description="Concise human-readable cluster title"),
  cluster_title STRING NOT NULL OPTIONS(description="Compatibility alias for cluster_label"),
  representative_issue STRING OPTIONS(description="Canonical summary of the common civic problem"),
  cluster_summary STRING NOT NULL OPTIONS(description="Compatibility alias for representative_issue"),
  request_count INT64 NOT NULL OPTIONS(description="Total aggregated citizen reports in this cluster"),
  average_severity FLOAT64 NOT NULL OPTIONS(description="Mean severity rating 1.0 to 5.0"),
  first_reported_at TIMESTAMP,
  latest_reported_at TIMESTAMP,
  growth_velocity_7d FLOAT64 OPTIONS(description="7-day percentage growth in reporting volume"),
  centroid_latitude FLOAT64,
  centroid_longitude FLOAT64,
  status STRING NOT NULL OPTIONS(description="emerging, peak, plateau, resolved"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY geo_id, category;

-- ==============================================================================
-- 8. GEOSPATIAL DEMAND HOTSPOTS TABLE
-- Purpose: High-intensity civic demand concentrations requiring administrative notice.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.hotspots` (
  hotspot_id STRING NOT NULL OPTIONS(description="Unique hotspot identifier, e.g. HOT-TN-001"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  cluster_id STRING OPTIONS(description="Primary associated demand cluster"),
  category STRING NOT NULL OPTIONS(description="Infrastructure sector"),
  hotspot_level STRING NOT NULL OPTIONS(description="CRITICAL, HIGH, MODERATE"),
  voice_intensity_score FLOAT64 NOT NULL OPTIONS(description="Normalized reporting density 0.0 to 1.0"),
  demand_velocity FLOAT64 OPTIONS(description="Rate of acceleration of incoming citizen demands"),
  growth_trend STRING NOT NULL OPTIONS(description="RAPIDLY_INCREASING, STEADY, DECLINING"),
  estimated_population_impacted INT64 NOT NULL OPTIONS(description="Demographic exposure in vicinity"),
  population_exposure INT64 OPTIONS(description="Canonical alias for estimated_population_impacted"),
  request_count INT64 OPTIONS(description="Total citizen requests linked to this hotspot"),
  associated_cluster_ids ARRAY<STRING>,
  latitude FLOAT64,
  longitude FLOAT64,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY geo_id;

-- ==============================================================================
-- 9. SIGNATURE FEATURE: SILENT NEED SIGNALS TABLE
-- Purpose: Identifies high deficit regions with disproportionately low citizen reporting.
-- Policy: All records remain: 'Potential Silent Need Signal — requires administrative field validation'
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.silent_need_signals` (
  signal_id STRING NOT NULL OPTIONS(description="Unique signal identifier, e.g. SIG-SILENT-MH-001"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  category STRING NOT NULL OPTIONS(description="Infrastructure sector"),
  infra_deficit FLOAT64 OPTIONS(description="Canonical normalized deficit score 0.0 to 1.0"),
  infra_deficit_score FLOAT64 NOT NULL OPTIONS(description="Compatibility alias for infra_deficit"),
  vulnerability_score FLOAT64 OPTIONS(description="Demographic vulnerability index 0.0 to 1.0"),
  population_vulnerability FLOAT64 NOT NULL OPTIONS(description="Compatibility alias for vulnerability_score"),
  voice_density FLOAT64 OPTIONS(description="Normalized reporting volume per capita 0.0 to 1.0"),
  voice_reporting_score FLOAT64 NOT NULL OPTIONS(description="Compatibility alias for voice_density"),
  digital_access FLOAT64 OPTIONS(description="Digital penetration / connectivity index 0.0 to 1.0"),
  digital_access_score FLOAT64 NOT NULL OPTIONS(description="Compatibility alias for digital_access"),
  discrepancy FLOAT64 OPTIONS(description="Discrepancy magnitude: deficit vs voice reporting"),
  discrepancy_magnitude FLOAT64 NOT NULL OPTIONS(description="Compatibility alias for discrepancy"),
  signal_status STRING DEFAULT 'POTENTIAL_SILENT_NEED_SIGNAL',
  signal_confidence FLOAT64 NOT NULL OPTIONS(description="Confidence rating of discrepancy 0.0 to 1.0"),
  validation_status STRING NOT NULL OPTIONS(description="POTENTIAL_SIGNAL_UNVALIDATED, FIELD_SURVEY_SCHEDULED, VALIDATED, REJECTED"),
  ai_hypothesis STRING NOT NULL OPTIONS(description="Contextual explanation of digital exclusion shadow"),
  supporting_evidence_count INT64 DEFAULT 0,
  latitude FLOAT64,
  longitude FLOAT64,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
CLUSTER BY geo_id;

-- ==============================================================================
-- 10. AUDIT & EVIDENCE REFERENCE GRAPH TABLE
-- Purpose: Grounded evidentiary citations and provenance audit trail.
-- Partitioning: Partitioned by DATE(created_at).
-- Clustering: Clustered by geo_id, source.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.evidence_records` (
  evidence_id STRING NOT NULL OPTIONS(description="Unique evidence citation identifier"),
  signal_id STRING OPTIONS(description="Associated silent need signal or hotspot ID"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  target_entity_type STRING OPTIONS(description="hotspot, silent_need_signal, digital_twin"),
  target_entity_id STRING OPTIONS(description="Target entity identifier"),
  evidence_type STRING OPTIONS(description="CITIZEN_VOICE, CENSUS_DEMOGRAPHIC, INFRA_AUDIT, GOV_BUDGET"),
  record_reference_id STRING OPTIONS(description="Referenced primary record key in source dataset"),
  source STRING NOT NULL OPTIONS(description="Authoritative source: PMGSY, JJM, Census, etc."),
  dataset_source STRING OPTIONS(description="Compatibility alias for source"),
  source_date DATE OPTIONS(description="Publication or release date of source citation"),
  source_reference STRING OPTIONS(description="Table or section reference within source dataset"),
  claim STRING OPTIONS(description="Evidence assertion statement"),
  metric_name STRING OPTIONS(description="Compatibility alias for claim / indicator name"),
  evidence_value STRING OPTIONS(description="Observed measurement or quotation"),
  observed_value STRING OPTIONS(description="Compatibility alias for evidence_value"),
  benchmark_value STRING,
  retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY geo_id, source;

-- ==============================================================================
-- 11. POLICY SCENARIOS TABLE
-- Purpose: Policy Sandbox counterfactual intervention simulation records.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.policy_scenarios` (
  scenario_id STRING NOT NULL OPTIONS(description="Unique simulation scenario run identifier"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  scenario_name STRING NOT NULL OPTIONS(description="Human-readable scenario description"),
  intervention_type STRING NOT NULL OPTIONS(description="Intervention domain: bus_route_optimization, tap_water_grid, etc."),
  input_parameters JSON OPTIONS(description="Simulation input hyperparameters"),
  intervention_parameters JSON OPTIONS(description="Compatibility alias for input_parameters"),
  estimated_exposure INT64 OPTIONS(description="Estimated population in intervention footprint"),
  predicted_population_affected INT64 OPTIONS(description="Compatibility alias for estimated_exposure"),
  estimated_beneficiaries INT64 OPTIONS(description="Estimated net beneficiaries experiencing gap reduction"),
  predicted_gap_reduction_pct FLOAT64 OPTIONS(description="Predicted percentage reduction in infrastructure deficit"),
  estimated_cost_inr INT64 OPTIONS(description="Projected capital expenditure required in INR"),
  addressed_cluster_count INT64 OPTIONS(description="Count of active citizen demand clusters resolved"),
  created_by_user STRING DEFAULT 'system',
  simulation_model_version STRING DEFAULT 'v1.0',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ==============================================================================
-- 12. IMPACT METRICS TABLE
-- Purpose: Closed-loop pre/post public intervention verification telemetry.
-- Partitioning: Partitioned by DATE(created_at).
-- Clustering: Clustered by geo_id, project_id.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `jansetu_intel.impact_metrics` (
  impact_id STRING NOT NULL OPTIONS(description="Unique evaluation identifier"),
  geo_id STRING NOT NULL OPTIONS(description="Foreign key referencing geography.geo_id"),
  project_id STRING NOT NULL OPTIONS(description="Foreign key referencing investments.project_id"),
  metric_name STRING NOT NULL OPTIONS(description="Measured civic outcome indicator"),
  baseline_value FLOAT64 NOT NULL OPTIONS(description="Pre-intervention benchmark measurement"),
  post_intervention_value FLOAT64 NOT NULL OPTIONS(description="Post-intervention outcome measurement"),
  measurement_period STRING OPTIONS(description="Evaluation interval: 6M, 12M, 24M"),
  data_source STRING DEFAULT 'GOV_FIELD_AUDIT' OPTIONS(description="Audit or telemetry data source"),
  baseline_date DATE,
  evaluation_date DATE,
  before_accessibility_pct FLOAT64,
  after_accessibility_pct FLOAT64,
  before_monthly_requests INT64,
  after_monthly_requests INT64,
  measured_sentiment_delta FLOAT64,
  is_verified_by_audit BOOL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY geo_id, project_id;
