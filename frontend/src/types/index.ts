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
  hotspot_score?: number;
  velocity_score?: number;
  concentration_ratio?: number;
  confidence_score?: number;
  explanation?: {
    voice_intensity: number;
    requests_per_1000: number;
    population_exposure: number;
    demand_velocity_pct?: number | null;
    trend_direction: string;
    category_concentration_ratio: number;
    weights: {
      voice_intensity: number;
      population_exposure: number;
      demand_velocity: number;
      category_concentration: number;
    };
    summary: string;
  };
  analytical_version?: string;
  disclaimer?: string;
}

export interface HotspotSummary {
  total_citizen_requests: number;
  active_demand_hotspots: number;
  critical_hotspots_count: number;
  high_hotspots_count: number;
  moderate_hotspots_count: number;
  increasing_demand_areas: number;
  states_covered: number;
  districts_monitored: number;
  total_population_exposure: number;
  category_distribution: Record<string, number>;
  calculation_version: string;
  disclaimer: string;
  generated_at: string;
}

export interface DemandShadowMatrixItem {
  geo_id: string;
  region_name: string;
  state_code: string;
  geo_level: string;
  latitude: number;
  longitude: number;
  population: number;
  digital_access_score: number;
  voice_intensity: number;
  infrastructure_need: number;
  discrepancy_magnitude: number;
  raw_request_count: number;
  quadrant: 'HIGH_VOICE_HIGH_NEED' | 'LOW_VOICE_HIGH_NEED' | 'HIGH_VOICE_LOW_NEED' | 'LOW_VOICE_LOW_NEED';
  quadrant_label: string;
  quadrant_description: string;
  action_guidance: string;
  status_color: string;
  category: string;
  time_window_days: number;
  analytical_version: string;
  disclaimer: string;
}

export interface DemandShadowMatrixResponse {
  matrix: DemandShadowMatrixItem[];
  summary: {
    total_geographies_analyzed: number;
    quadrant_counts: Record<string, number>;
    average_voice_intensity: number;
    average_need_deficit: number;
    voice_threshold: number;
    need_threshold: number;
    filter_category: string;
    filter_state: string;
    time_window_days: number;
    analytical_version: string;
    disclaimer: string;
    generated_at: string;
  };
  disclaimer: string;
}

export interface SilentNeedDriver {
  factor: string;
  value: number;
  contribution: string;
  evidence_type: string;
}

export interface SilentNeedExplanation {
  summary: string;
  drivers: SilentNeedDriver[];
  triggers_met: {
    discrepancy_ge_threshold: boolean;
    infra_deficit_ge_threshold: boolean;
    digital_access_le_threshold: boolean;
  };
  disclaimer: string;
  validation_requirement: string;
}

export interface SilentNeedSummary {
  total_geographies_analyzed: number;
  total_signals: number;
  potential_signals: number;
  strong_potential_signals: number;
  categories: Record<string, number>;
  states: Record<string, number>;
  analytical_version: string;
  disclaimer: string;
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
  ai_hypothesis?: string;
  latitude: number;
  longitude: number;
  why_summary?: string;
  supporting_evidence_count: number;
  // Phase 6 additions:
  infra_deficit?: number;
  vulnerability_score?: number;
  digital_access?: number;
  voice_density?: number;
  need_score?: number;
  discrepancy?: number;
  signal_strength?: number;
  signal_class?: 'STRONG_POTENTIAL' | 'POTENTIAL' | 'NO_SIGNAL';
  triggered?: boolean;
  trigger_reason?: string;
  population?: number;
  request_count?: number;
  infrastructure_indicator_count?: number;
  explanation?: SilentNeedExplanation;
  investment_context?: {
    existing_investment_count: number;
    existing_allocated_budget_inr: number;
    active_project_count: number;
    completed_project_count: number;
  };
  analytical_version?: string;
  generated_at?: string;
  requires_field_validation?: boolean;
  disclaimer?: string;
  validation_requirement?: string;
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

// =========================================================================
// PHASE 7: GROUNDED EVIDENCE ENGINE TYPES
// =========================================================================

export type SourceType = 'OFFICIAL_GOVERNMENT' | 'OFFICIAL_INSTITUTION' | 'JANSETU_ANALYTICAL' | 'SYNTHETIC';
export type ProvenanceStatus = 'VERIFIED' | 'ANALYTICAL' | 'SYNTHETIC' | 'UNAVAILABLE';
export type ClaimType = 'OBSERVED' | 'CALCULATED' | 'ANALYTICAL' | 'CONTEXTUAL' | 'UNAVAILABLE';
export type EvidenceQuality = 'COMPLETE' | 'PARTIAL' | 'LIMITED' | 'INSUFFICIENT';

export interface EvidenceRecord {
  evidence_id: string;
  signal_id: string;
  geo_id: string;
  category: string;
  source: string;
  source_type: SourceType | string;
  source_tier: number;
  source_date?: string;
  indicator_name: string;
  claim: string;
  evidence_value: any;
  unit?: string;
  dataset_id?: string;
  record_reference?: string;
  provenance_status: ProvenanceStatus | string;
  is_official: boolean;
  is_synthetic: boolean;
  retrieval_timestamp: string;
  freshness?: 'CURRENT' | 'RECENT' | 'HISTORICAL' | 'UNKNOWN' | string;
  source_url?: string;
}

export interface EvidenceClaim {
  claim_id: string;
  text: string;
  claim_type: ClaimType | string;
  evidence_ids: string[];
  validation_status?: 'VALIDATED' | 'REJECTED' | string;
}

export interface EvidenceDriver {
  driver_key: 'infra_deficit' | 'vulnerability' | 'citizen_voice' | 'digital_access' | 'investment' | string;
  name: string;
  value: any;
  formatted_value: string;
  source: string;
  source_date?: string;
  evidence_id: string;
  claim_type: ClaimType | string;
  status: string;
  description?: string;
}

export interface EvidenceSource {
  source_name: string;
  dataset_id: string;
  source_type: SourceType | string;
  source_tier: number;
  source_date?: string;
  geographic_level: string;
  provenance_status: string;
  is_synthetic: boolean;
  source_url?: string;
}

export interface EvidenceConflict {
  conflict_id: string;
  indicator_name: string;
  source_a: string;
  value_a: any;
  source_b: string;
  value_b: any;
  status: string;
  note: string;
}

export interface EvidenceTrailItem {
  evidence_type: string;
  dataset_source: string;
  metric: string;
  observed_value: string;
  benchmark?: string;
  deficit_percentage?: string;
}

export interface EvidenceResponse {
  signal_id: string;
  geo_id: string;
  category: string;
  signal: Record<string, any>;
  drivers: EvidenceDriver[];
  evidence: EvidenceRecord[];
  claims: EvidenceClaim[];
  evidence_coverage: number;
  evidence_quality: EvidenceQuality | string;
  coverage_details?: Record<string, string>;
  sources?: EvidenceSource[];
  limitations: string[];
  conflicts: EvidenceConflict[];
  validation_required: boolean;
  analytical_version: string;
  prompt_version: string;
  retrieval_timestamp: string;
  summary?: string;
  supported_evidence_ids?: string[];
  target_region?: string;
  ai_hypothesis?: string;
  confidence_rating?: number;
  confidence_rationale?: string;
  grounded_evidence_trail?: EvidenceTrailItem[];
  gemini_summary?: string;
  disclaimer: string;
  validation_requirement: string;
  audit_trail?: Record<string, any>;
}

export interface EvidenceSummary {
  total_evidence_records: number;
  official_sources_count: number;
  analytical_sources_count: number;
  synthetic_sources_count: number;
  verified_coverage_pct: number;
  analytical_version: string;
  disclaimer: string;
}
// =========================================================================
// PHASE 8: POLICY SANDBOX & SCENARIO SIMULATION TYPES
// =========================================================================

export type InterventionType =
  | 'SERVICE_COVERAGE_INCREASE'
  | 'INFRASTRUCTURE_CAPACITY_INCREASE'
  | 'ACCESS_IMPROVEMENT'
  | 'DEFICIT_REDUCTION'
  | 'CUSTOM_HYPOTHETICAL_INTERVENTION';

export type MetricClassification = 'HISTORICAL_FACT' | 'MODEL_ASSUMPTION' | 'SCENARIO_ESTIMATE';

export type CostStatus =
  | 'VERIFIED_INVESTMENT_BENCHMARK'
  | 'USER_PROVIDED_ASSUMPTION'
  | 'UNAVAILABLE';

export interface BaselineMetric {
  name: string;
  value: any;
  formatted_value: string;
  unit?: string;
  source_dataset?: string;
  evidence_ids: string[];
  classification: MetricClassification;
}

export interface ScenarioBaseline {
  geo_id: string;
  region_name: string;
  state_name: string;
  sector: string;
  population: BaselineMetric;
  vulnerability_score: BaselineMetric;
  digital_access_score: BaselineMetric;
  voice_density: BaselineMetric;
  infra_deficit_score: BaselineMetric;
  active_projects_count: BaselineMetric;
  total_allocated_budget_inr: BaselineMetric;
  signal_id?: string;
  retrieval_timestamp?: string;
  analytical_version: string;
}

export interface ScenarioAssumptions {
  intervention_type: InterventionType;
  sector: string;
  coverage_improvement_pct: number;
  target_population_pct: number;
  hypothetical_budget_inr?: number;
  implementation_timeline_months?: number;
  notes?: string;
  assumptions_classification: MetricClassification;
  cost_status: CostStatus;
}

export interface ScenarioEstimate {
  estimated_coverage_improvement_pct: number;
  estimated_infrastructure_deficit_after: number;
  estimated_gap_reduction: number;
  estimated_gap_reduction_pct: number;
  estimated_affected_population: number;
  cost_per_beneficiary_inr?: number;
  cost_status: CostStatus;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  sensitivity_range: {
    lower_gap_reduction: number;
    upper_gap_reduction: number;
    margin_pct: number;
  };
  classification: MetricClassification;
}

export interface ScenarioInput {
  geo_id: string;
  sector: string;
  intervention_type: InterventionType;
  coverage_improvement_pct: number;
  target_population_pct: number;
  hypothetical_budget_inr?: number;
  implementation_timeline_months?: number;
  notes?: string;
  signal_id?: string;
}

export interface ScenarioResult extends SimulationResult {
  scenario_id: string;
  geo_id: string;
  region_name: string;
  sector: string;
  intervention_type: InterventionType | string;
  baseline: ScenarioBaseline;
  assumptions: ScenarioAssumptions;
  estimates: ScenarioEstimate;
  limitations: string[];
  disclaimer: string;
  policy_notice: string;
  created_at: string;
  model_version: string;
  is_archived?: boolean;
}

export interface ScenarioComparisonItem {
  metric: string;
  classification: MetricClassification;
  values: Record<string, any>;
  notes?: string;
}

export interface ScenarioTradeOff {
  scenario_id: string;
  description: string;
  trade_offs: string[];
  unaddressed_dimensions: string[];
}

export interface ScenarioComparisonResponse {
  scenario_ids: string[];
  compared_count: number;
  comparison_table: ScenarioComparisonItem[];
  neutral_tradeoffs: ScenarioTradeOff[];
  data_limitations: string[];
  disclaimer: string;
  comparative_notice: string;
  compared_at: string;
}

export interface ScenarioExplanationResponse {
  scenario_id: string;
  grounded_explanation: string;
  cited_evidence_ids: string[];
  cited_sources: string[];
  key_hypotheses: string[];
  limitations_noted: string[];
  prompt_version: string;
  generated_at: string;
  disclaimer: string;
}

// =========================================================================
// PHASE 9: CLOSED-LOOP IMPACT MEASUREMENT & EVALUATION TYPES
// =========================================================================

export type IndicatorDirection =
  | 'HIGHER_IS_BETTER'
  | 'LOWER_IS_BETTER'
  | 'TARGET_RANGE'
  | 'NEUTRAL';

export type EvaluationType =
  | 'DESCRIPTIVE_BEFORE_AFTER'
  | 'TARGET_VS_ACTUAL'
  | 'PRE_POST_TREND'
  | 'CONTROLLED_COMPARISON'
  | 'CAUSAL_EVALUATION';

export type AttributionLevel =
  | 'NOT_ASSESSED'
  | 'DESCRIPTIVE_ONLY'
  | 'ASSOCIATION_SUPPORTED'
  | 'CAUSAL_EVIDENCE_AVAILABLE';

export type DataQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export type ObservationQualityStatus =
  | 'VERIFIED'
  | 'PARTIAL'
  | 'PROXY'
  | 'MISSING'
  | 'CONFLICTING';

export interface IndicatorDefinition {
  indicator_id: string;
  name: string;
  sector: string;
  unit: string;
  direction: IndicatorDirection;
  baseline_source: string;
  observation_source?: string;
  description?: string;
}

export interface BaselineSnapshot {
  baseline_id: string;
  geo_id: string;
  sector: string;
  indicator: IndicatorDefinition;
  value: number;
  unit: string;
  source: string;
  source_date: string;
  evidence_ids: string[];
  provenance: string;
  classification: string;
  snapshot_timestamp: string;
}

export interface OutcomeObservation {
  observation_id: string;
  evaluation_id: string;
  geo_id: string;
  indicator: IndicatorDefinition;
  value: number;
  unit: string;
  observation_date: string;
  source: string;
  source_type: string;
  provenance: string;
  evidence_ids: string[];
  quality_status: ObservationQualityStatus;
  classification: string;
  recorded_at: string;
}

export interface ConfounderItem {
  factor_type: string;
  description: string;
  direction_of_potential_bias?: string;
  classification: string;
}

export interface ImpactCalculation {
  absolute_change: number;
  percentage_change?: number | null;
  target_gap?: number | null;
  target_achievement_pct?: number | null;
  is_improvement?: boolean | null;
  classification: string;
}

export interface ScenarioComparisonDetail {
  scenario_id: string;
  scenario_estimate: number;
  scenario_estimate_classification: string;
  observed_outcome: number;
  observed_outcome_classification: string;
  scenario_outcome_difference: number;
  predicted_change: number;
  observed_change: number;
  prediction_error: number;
  absolute_prediction_error: number;
  relative_prediction_error?: number | null;
  directional_consistency: boolean;
  label: string;
  disclaimer: string;
}

export interface ImpactEvaluation extends ImpactMetric {
  evaluation_id: string;
  geo_id: string;
  region_name: string;
  state_name: string;
  sector: string;
  intervention_id: string;
  project_name: string;
  scenario_id?: string | null;
  baseline_period: string;
  observation_period: string;
  indicator: IndicatorDefinition;
  baseline_snapshot: BaselineSnapshot;
  observation?: OutcomeObservation | null;
  calculation?: ImpactCalculation | null;
  scenario_comparison?: ScenarioComparisonDetail | null;
  target_value?: number | null;
  evaluation_type: EvaluationType;
  attribution_level: AttributionLevel;
  attribution_statement: string;
  data_quality: DataQuality;
  confounders: ConfounderItem[];
  evidence_ids: string[];
  limitations: string[];
  is_verified: boolean;
  evaluation_status: string;
  model_version: string;
  created_at: string;
  governance_notice: string;
  disclaimer: string;
}

export interface EvaluationCreateInput {
  geo_id: string;
  sector: string;
  intervention_id: string;
  project_name?: string;
  scenario_id?: string;
  indicator_id: string;
  baseline_period: string;
  observation_period: string;
  target_value?: number;
  evaluation_type?: EvaluationType;
  confounders?: Array<{ factor_type: string; description: string }>;
}

export interface ObservationInput {
  value: number;
  unit: string;
  observation_date: string;
  source: string;
  source_type?: string;
  provenance?: string;
  evidence_ids?: string[];
  quality_status?: ObservationQualityStatus;
}

export interface ModelValidationSummary {
  total_scenarios_evaluated: number;
  total_evaluations_count: number;
  mean_absolute_prediction_error?: number | null;
  directional_consistency_rate?: number | null;
  evaluations_by_sector: Record<string, number>;
  data_quality_distribution: Record<string, number>;
  model_version: string;
  disclaimer: string;
}

export interface ImpactExplanationResponse {
  evaluation_id: string;
  grounded_explanation: string;
  cited_evidence_ids: string[];
  cited_sources: string[];
  attribution_rationale: string;
  contextual_factors_noted: string[];
  limitations_noted: string[];
  prompt_version: string;
  generated_at: string;
  disclaimer: string;
}

// =============================================================================
// PHASE 10: CONTINUOUS LEARNING & CALIBRATION TYPES
// =============================================================================

export type ModelFamily =
  | 'DEMAND_HOTSPOT'
  | 'DEMAND_SHADOW'
  | 'SILENT_NEED'
  | 'SCENARIO_SIMULATION'
  | 'IMPACT_FORECAST';

export type CalibrationStatus =
  | 'CANDIDATE'
  | 'UNDER_REVIEW'
  | 'VALIDATED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUPERSEDED'
  | 'ROLLED_BACK'
  | 'INSUFFICIENT_DATA'
  | 'REQUIRES_REVIEW';

export type LearningAction =
  | 'CREATED'
  | 'VALIDATED'
  | 'APPROVED'
  | 'ACTIVATED'
  | 'ROLLED_BACK'
  | 'REJECTED'
  | 'SUPERSEDED';

export type DriftStatus = 'STABLE' | 'WATCH' | 'DRIFT_DETECTED' | 'INSUFFICIENT_DATA';

export interface LearningObservation {
  evaluation_id: string;
  indicator_id: string;
  forecast_value?: number | null;
  observed_value: number;
  baseline_value?: number | null;
  predicted_change?: number | null;
  observed_change?: number | null;
  prediction_error?: number | null;
  relative_prediction_error?: number | null;
  observation_date: string;
  data_quality: string;
  is_directionally_aligned?: boolean | null;
  source_scenario_id?: string | null;
  sector?: string | null;
  geo_id?: string | null;
}

export interface CalibrationParameter {
  parameter_name: string;
  current_value: number;
  candidate_value: number;
  min_value: number;
  max_value: number;
  supported_range: number[];
  description?: string | null;
  evidence_count: number;
  validation_metric: string;
  relative_change?: number | null;
}

export interface LearningMetrics {
  sample_size: number;
  mae_before: number;
  mae_candidate: number;
  mape_before?: number | null;
  mape_candidate?: number | null;
  directional_consistency_before: number;
  directional_consistency_candidate: number;
  mean_prediction_error_before: number;
  mean_prediction_error_candidate: number;
  validation_sample_size: number;
  validation_mae_before?: number | null;
  validation_mae_candidate?: number | null;
  validation_directional_consistency_before?: number | null;
  validation_directional_consistency_candidate?: number | null;
}

export interface LearningCandidate {
  learning_id: string;
  model_family: ModelFamily;
  source_version: string;
  target_version: string;
  source_evaluation_ids: string[];
  training_window: { start: string; end: string };
  validation_window: { start: string; end: string };
  parameters: CalibrationParameter[];
  metrics: LearningMetrics;
  status: CalibrationStatus;
  created_at: string;
  updated_at?: string | null;
  reviewed_by?: string | null;
  review_notes?: string | null;
  notes?: string | null;
  disclaimer: string;
}

export interface ModelVersion {
  model_version: string;
  model_family: ModelFamily;
  parameters: Record<string, number>;
  created_at: string;
  status: CalibrationStatus;
  parent_version?: string | null;
  activated_at?: string | null;
  activated_by?: string | null;
  description?: string | null;
}

export interface LearningAuditEvent {
  event_id: string;
  learning_id?: string | null;
  model_version?: string | null;
  action: LearningAction;
  actor: string;
  timestamp: string;
  previous_status?: string | null;
  new_status?: string | null;
  reason?: string | null;
}

export interface DataQualityBreakdown {
  total_observations: number;
  verified_observations: number;
  proxy_observations: number;
  missing_observations: number;
  conflicting_observations: number;
  verified_pct: number;
  proxy_pct: number;
  missing_pct: number;
  conflicting_pct: number;
  overall_quality_score: number;
  quality_status: string;
}

export interface DriftReport {
  model_family: ModelFamily;
  parameter_name: string;
  status: DriftStatus;
  historical_mean: number;
  recent_mean: number;
  mean_shift_pct: number;
  variance_shift_pct: number;
  sample_count_recent: number;
  sample_count_historical: number;
  message: string;
  timestamp: string;
}

export interface LearningSummary {
  total_evaluations_ingested: number;
  total_candidates: number;
  active_models: number;
  pending_reviews: number;
  data_quality: DataQualityBreakdown;
  drift_summary: DriftReport[];
  analytical_version: string;
  prompt_version: string;
  disclaimers: string[];
}

export interface GenerateCandidateRequest {
  model_family?: ModelFamily;
  training_start?: string;
  training_end?: string;
  validation_start?: string;
  validation_end?: string;
  parameter_names?: string[];
  min_samples?: number;
}

export interface ValidateCandidateRequest {
  validation_start?: string;
  validation_end?: string;
}

export interface ApproveCandidateRequest {
  reviewer?: string;
  notes?: string;
}

export interface RejectCandidateRequest {
  reviewer?: string;
  reason: string;
}

export interface ActivateModelRequest {
  actor?: string;
  reason?: string;
}

export interface RollbackModelRequest {
  target_version?: string;
  actor?: string;
  reason?: string;
}

export interface LearningExplanationResponse {
  learning_id: string;
  prompt_version: string;
  grounded_explanation: string;
  cited_evaluation_ids: string[];
  limitations: string[];
  disclaimer: string;
}


