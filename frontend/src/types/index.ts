export interface ExtractedLocation {
  raw_location_text: string;
  matched_village_or_ward?: string;
  block_or_taluk?: string;
  district?: string;
  state?: string;
  approximate_latitude?: number;
  approximate_longitude?: number;
}

export interface GeminiExtraction {
  primary_category: string;
  subcategory: string;
  specific_issue: string;
  location: ExtractedLocation;
  severity: number;
  urgency_score: number;
  affected_group: string;
  time_pattern: string;
  key_entities: string[];
  confidence: number;
}

export interface IntakeResponse {
  request_id: string;
  status: string;
  source_channel: string;
  detected_language: string;
  original_text: string;
  english_translation: string;
  extraction: GeminiExtraction;
  matched_geo_id: string;
  matched_admin_area: string;
  assigned_cluster_id?: string;
  cluster_title?: string;
  processing_time_ms: number;
  is_synthetic: boolean;
}

export interface CommandCenterKPIs {
  total_citizen_requests: number;
  active_demand_hotspots: number;
  emerging_signals_count: number;
  potential_silent_need_signals: number;
  states_covered: number;
  districts_monitored: number;
  public_projects_tracked: number;
  average_gap_reduction_pct: number;
  category_distribution: Record<string, number>;
  language_breakdown: Record<string, number>;
  top_critical_districts: Array<{
    geo_id: string;
    name: string;
    state: string;
    category: string;
    voice_intensity: number;
    total_requests: number;
  }>;
  data_policy_notice: string;
}

export interface DemandShadowZone {
  geo_id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  population: number;
  digital_connectivity: number;
  layer_a_voice_density: number;
  layer_b_infra_need: number;
  discrepancy: number;
  quadrant: 'CONFIRMED_DEMAND_HOTSPOT' | 'POTENTIAL_SILENT_NEED' | 'REQUIRES_VALIDATION' | 'STABILIZED_BASELINE';
  marker_color: string;
  total_requests: number;
}

export interface Hotspot {
  hotspot_id: string;
  geo_id: string;
  region_name: string;
  state_name: string;
  category: string;
  hotspot_level: string;
  voice_intensity_score: number;
  growth_trend: string;
  estimated_population_impacted: number;
  latitude: number;
  longitude: number;
  top_issue: string;
  total_requests: number;
  status: string;
}

export interface SilentNeedSignal {
  signal_id: string;
  geo_id: string;
  region_name: string;
  state_name: string;
  category: string;
  infra_deficit_score: number;
  voice_reporting_score: number;
  digital_access_score: number;
  population_vulnerability: number;
  discrepancy_magnitude: number;
  signal_confidence: number;
  validation_status: string;
  ai_hypothesis: string;
  latitude: number;
  longitude: number;
  why_summary: string;
  supporting_evidence_count: number;
}

export interface EvidenceTrailItem {
  evidence_type: string;
  dataset_source: string;
  metric: string;
  observed_value: string;
  benchmark?: string;
  deficit_percentage?: string;
}

export interface GroundedEvidenceBrief {
  signal_id: string;
  target_region: string;
  category: string;
  ai_hypothesis: string;
  confidence_rating: number;
  confidence_rationale: string;
  grounded_evidence_trail: EvidenceTrailItem[];
  gemini_summary: string;
  disclaimer: string;
}

export interface CivicDigitalTwin {
  geo_id: string;
  admin_name: string;
  admin_level: number;
  state_name: string;
  district_name?: string;
  latitude: number;
  longitude: number;
  population_metrics: {
    total_population: number;
    vulnerability_percentage: number;
    elderly_percentage: number;
    literacy_rate: number;
    digital_penetration_index: number;
    primary_livelihood: string;
  };
  civic_health_radar: {
    transport_access: number;
    water_security: number;
    healthcare_proximity: number;
    education_quality: number;
    power_reliability: number;
    sanitation_index: number;
  };
  intelligence_summary: {
    population_exposure: string;
    citizen_demand_level: string;
    infrastructure_gap: string;
    digital_access: string;
    investment_coverage: string;
    emerging_signal: string;
    potential_silent_need_zones: number;
  };
  active_clusters: Array<{
    cluster_id: string;
    category: string;
    title: string;
    request_count: number;
    severity_score: number;
    status: string;
  }>;
  silent_need_count: number;
  active_public_projects_count: number;
  allocated_capex_inr: number;
  last_computed_at: string;
}

export interface SimulationResult {
  simulation_id: string;
  geo_id: string;
  region_name: string;
  sector: string;
  intervention_type: string;
  status: string;
  estimated_population_benefited: number;
  current_accessibility_index: number;
  projected_accessibility_index: number;
  absolute_gain_pct: number;
  addressed_clusters_count: number;
  total_clusters_in_sector: number;
  unaddressed_residual_needs: string[];
  estimated_budget_inr: number;
  roi_cost_per_beneficiary_inr: number;
  confidence_interval: {
    lower_bound_gain: number;
    upper_bound_gain: number;
    standard_error: number;
  };
  disclaimer: string;
}

export interface ImpactMetric {
  impact_id: string;
  project_id: string;
  project_name: string;
  geo_id: string;
  region_name: string;
  sector: string;
  commenced_date: string;
  evaluation_date: string;
  before_accessibility_pct: number;
  after_accessibility_pct: number;
  accessibility_gain_pct: number;
  before_monthly_requests: number;
  after_monthly_requests: number;
  request_reduction_pct: number;
  measured_sentiment_recovery: number;
  is_verified: boolean;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  native_name: string;
  script: string;
  sample_phrase: string;
  chirp_supported: boolean;
  translation_supported: boolean;
}

export interface SupportedLanguagesResponse {
  success: boolean;
  languages: SupportedLanguage[];
  supported_codes: string[];
  default_language: string;
}

export interface CitizenRequestStatus {
  request_id: string;
  status: string;
  channel: string;
  language: string;
  original_transcript?: string;
  normalized_text?: string;
  created_at?: string;
  geo_id?: string;
  audio_gcs_uri?: string;
  translation_status?: string;
  transcription_status?: string;
}

// =========================================================================
// PHASE 4: AI PERCEPTION & SEMANTIC CLUSTERING TYPES
// =========================================================================

export interface GeminiExtraction {
  primary_category: string;
  subcategory: string;
  urgency_score: number;
  severity_level: number;
  affected_demographic: string;
  raw_location_text?: string;
  extracted_entities: string[];
  infrastructure_gap: string;
  actionable_summary: string;
  confidence_score: number;
  hallucination_safeguards_passed: boolean;
  extracted_at: string;
  model_provenance?: string;
}

export interface AIPerceptionResult {
  success: boolean;
  request_id: string;
  geo_id: string;
  category: string;
  subcategory: string;
  urgency_score: number;
  severity_level: number;
  affected_demographic: string;
  actionable_summary: string;
  extraction: GeminiExtraction;
  embedding: {
    dimension: number;
    model: string;
    subspace_signature?: string;
    preview: number[];
  };
  cluster: {
    cluster_id: string;
    title: string;
    representative_issue: string;
    total_requests: number;
    created_new: boolean;
  };
  model_provenance: {
    gemini_model: string;
    embedding_model: string;
    extraction_version: string;
    clustering_version: string;
  };
  disclaimer: string;
}

export interface DemandCluster {
  cluster_id: string;
  geo_id: string;
  category: string;
  subcategory: string;
  title: string;
  representative_issue: string;
  request_count: number;
  severity_score: number;
  urgency_score: number;
  affected_cohorts: string[];
  request_ids: string[];
  status: string;
  first_reported_at: string;
  last_updated_at: string;
}

export interface SimilarRequest {
  request_id: string;
  geo_id: string;
  category: string;
  original_text: string;
  similarity_score: number;
}

export interface ControlledTaxonomy {
  categories: string[];
  subcategories: Record<string, string[]>;
  allowed_cohorts: string[];
}


