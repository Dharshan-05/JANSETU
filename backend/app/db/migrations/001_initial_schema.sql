-- ==============================================================================
-- JANSETU: BigQuery Initial DDL Schema Migration 001
-- Dataset: jansetu_intel
-- Location: asia-south1
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS `jansetu_intel`
OPTIONS(
  location="asia-south1",
  description="JANSETU Civic Infrastructure Intelligence Grid Warehouse"
);

-- 1. Administrative Geography Dimension Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.geography` (
  geo_id STRING NOT NULL OPTIONS(description="Unique LGD code or hierarchical geo ID, e.g., IND_TN_DHM_001"),
  admin_level INT64 NOT NULL OPTIONS(description="0=Country, 1=State, 2=District, 3=Block, 4=Village/Ward"),
  name STRING NOT NULL,
  native_name STRING,
  state_code STRING NOT NULL,
  district_code STRING,
  block_code STRING,
  parent_geo_id STRING,
  latitude FLOAT64,
  longitude FLOAT64,
  centroid GEOGRAPHY,
  boundary_polygon GEOGRAPHY,
  is_pilot_region BOOL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 2. Demographics & Vulnerability Index Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.demographics` (
  geo_id STRING NOT NULL,
  census_year INT64 DEFAULT 2021,
  total_population INT64 NOT NULL,
  male_population INT64,
  female_population INT64,
  sc_st_population INT64,
  vulnerability_percentage FLOAT64 OPTIONS(description="SECC Deprivation percentage 0.0 - 1.0"),
  elderly_percentage FLOAT64,
  literacy_rate FLOAT64,
  digital_penetration_index FLOAT64 OPTIONS(description="Household smartphone & active cellular data access 0.0 - 1.0"),
  primary_livelihood STRING,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 3. Infrastructure Reality Baseline Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.infrastructure` (
  geo_id STRING NOT NULL,
  category STRING NOT NULL OPTIONS(description="transport, water, healthcare, education, electricity, sanitation"),
  indicator_name STRING NOT NULL,
  indicator_value FLOAT64 NOT NULL,
  national_benchmark FLOAT64 NOT NULL,
  deficit_score FLOAT64 NOT NULL OPTIONS(description="Normalized gap score 0.0 to 1.0"),
  last_audited_at DATE,
  source_dataset STRING OPTIONS(description="e.g., PMGSY, JJM, HMIS, UDISE+, data.gov.in")
);

-- 4. Public Investments & Capital Projects Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.investments` (
  project_id STRING NOT NULL,
  geo_id STRING NOT NULL,
  project_name STRING NOT NULL,
  scheme_name STRING OPTIONS(description="e.g., PMGSY, Jal Jeevan Mission, Ayushman Bharat, AMRUT"),
  category STRING NOT NULL,
  allocated_budget_inr INT64 NOT NULL,
  expended_budget_inr INT64 DEFAULT 0,
  status STRING NOT NULL OPTIONS(description="sanctioned, in_progress, delayed, completed, stalled"),
  commenced_date DATE,
  target_completion_date DATE,
  contractor_name STRING,
  beneficiary_population INT64
);

-- 5. Citizen Raw & Extracted Requests Fact Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.citizen_requests` (
  request_id STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  geo_id STRING NOT NULL,
  source_channel STRING NOT NULL OPTIONS(description="voice_ivr, voice_web, text_web, whatsapp, bhashini_api"),
  detected_language STRING NOT NULL OPTIONS(description="ta, hi, te, en, kn, mr, bn"),
  audio_gcs_uri STRING,
  original_transcript STRING NOT NULL,
  english_translation STRING NOT NULL,
  
  -- Gemini Structured Extracted Intelligence
  primary_category STRING NOT NULL OPTIONS(description="transport, water, healthcare, education, electricity, sanitation, roads"),
  subcategory STRING NOT NULL,
  specific_issue STRING NOT NULL,
  extracted_location_name STRING,
  latitude FLOAT64,
  longitude FLOAT64,
  location_geog GEOGRAPHY,
  severity INT64 NOT NULL OPTIONS(description="1 (low) to 5 (critical emergency)"),
  urgency_score FLOAT64 NOT NULL OPTIONS(description="0.0 - 1.0 calculated urgency"),
  affected_group STRING NOT NULL OPTIONS(description="students, women, elderly, farmers, patients, general_population"),
  time_pattern STRING OPTIONS(description="evening, morning, seasonal_monsoon, continuous"),
  entities ARRAY<STRING>,
  
  -- Processing Metadata
  processing_status STRING NOT NULL OPTIONS(description="received, transcribed, extracted, clustered, verified"),
  is_synthetic BOOL DEFAULT FALSE,
  confidence_score FLOAT64 DEFAULT 0.95
);

-- 6. High-Dimensional Vector Embeddings Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.citizen_request_embeddings` (
  request_id STRING NOT NULL,
  category STRING NOT NULL,
  geo_id STRING NOT NULL,
  embedding ARRAY<FLOAT64> NOT NULL OPTIONS(description="768-dim Vertex AI text-multilingual-embedding-002"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 7. Synthesized Semantic Demand Clusters Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.demand_clusters` (
  cluster_id STRING NOT NULL,
  geo_id STRING NOT NULL,
  category STRING NOT NULL,
  cluster_title STRING NOT NULL,
  cluster_summary STRING NOT NULL,
  request_count INT64 NOT NULL,
  average_severity FLOAT64 NOT NULL,
  first_reported_at TIMESTAMP,
  latest_reported_at TIMESTAMP,
  growth_velocity_7d FLOAT64,
  centroid_latitude FLOAT64,
  centroid_longitude FLOAT64,
  status STRING NOT NULL OPTIONS(description="emerging, peak, plateau, resolved")
);

-- 8. Geospatial Demand Hotspots Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.hotspots` (
  hotspot_id STRING NOT NULL,
  geo_id STRING NOT NULL,
  category STRING NOT NULL,
  hotspot_level STRING NOT NULL OPTIONS(description="CRITICAL, HIGH, MODERATE"),
  voice_intensity_score FLOAT64 NOT NULL,
  growth_trend STRING NOT NULL OPTIONS(description="RAPIDLY_INCREASING, STEADY, DECLINING"),
  estimated_population_impacted INT64 NOT NULL,
  associated_cluster_ids ARRAY<STRING>,
  identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 9. Signature Feature: Silent Need Signals Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.silent_need_signals` (
  signal_id STRING NOT NULL,
  geo_id STRING NOT NULL,
  category STRING NOT NULL,
  infra_deficit_score FLOAT64 NOT NULL,
  voice_reporting_score FLOAT64 NOT NULL,
  digital_access_score FLOAT64 NOT NULL,
  population_vulnerability FLOAT64 NOT NULL,
  discrepancy_magnitude FLOAT64 NOT NULL,
  signal_confidence FLOAT64 NOT NULL,
  validation_status STRING NOT NULL OPTIONS(description="POTENTIAL_SIGNAL_UNVALIDATED, FIELD_SURVEY_SCHEDULED, VALIDATED, REJECTED"),
  ai_hypothesis STRING NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 10. Audit & Evidence Reference Graph Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.evidence_records` (
  evidence_id STRING NOT NULL,
  target_entity_type STRING NOT NULL OPTIONS(description="hotspot, silent_need_signal, digital_twin"),
  target_entity_id STRING NOT NULL,
  evidence_type STRING NOT NULL OPTIONS(description="CITIZEN_VOICE, CENSUS_DEMOGRAPHIC, INFRA_AUDIT, GOV_BUDGET"),
  record_reference_id STRING NOT NULL,
  metric_name STRING NOT NULL,
  observed_value STRING NOT NULL,
  benchmark_value STRING,
  dataset_source STRING NOT NULL,
  verified_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 11. Policy Sandbox Intervention Scenarios Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.policy_scenarios` (
  scenario_id STRING NOT NULL,
  created_by_user STRING NOT NULL,
  geo_id STRING NOT NULL,
  sector STRING NOT NULL,
  intervention_parameters JSON NOT NULL,
  predicted_population_affected INT64 NOT NULL,
  predicted_gap_reduction_pct FLOAT64 NOT NULL,
  estimated_cost_inr INT64 NOT NULL,
  addressed_cluster_count INT64 NOT NULL,
  simulation_model_version STRING NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 12. Impact Engine: Closed-Loop Project Tracking Table
CREATE TABLE IF NOT EXISTS `jansetu_intel.impact_metrics` (
  impact_id STRING NOT NULL,
  project_id STRING NOT NULL,
  geo_id STRING NOT NULL,
  baseline_date DATE NOT NULL,
  evaluation_date DATE NOT NULL,
  before_accessibility_pct FLOAT64 NOT NULL,
  after_accessibility_pct FLOAT64 NOT NULL,
  before_monthly_requests INT64 NOT NULL,
  after_monthly_requests INT64 NOT NULL,
  measured_sentiment_delta FLOAT64 NOT NULL,
  is_verified_by_audit BOOL DEFAULT FALSE
);
